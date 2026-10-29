const express = require('express')
const cors = require('cors')
const nodemailer = require('nodemailer')
require('dotenv').config()

const db = require('./db')
const bcrypt = require('bcrypt')
const geoip = require('geoip-lite')

const app = express()
const PORT = process.env.PORT || 3000

// Connects to the email system using the information from .env
const emailTransporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST,
    port: Number(process.env.BREVO_SMTP_PORT || 587),
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_KEY,
    },
})


async function sendLoginNotification({
                                         email,
                                         status,
                                         ipAddress,
                                         country,
                                     }) {
    const descriptions = {
        success: 'A user successfully logged in.',
        wrong_password: 'A login attempt failed: incorrect password.',
        unknown_email: 'A login attempt used an unknown email address.',
        account_locked: 'A login attempt targeted a locked account.',
        ip_blocked: 'A login attempt came from a blocked IP address.',
    }

    const successful = status === 'success'

    // Email format that gets sent on every login attempt
    await emailTransporter.sendMail({
        from: {
            name: 'ACME Security Dashboard',
            address: process.env.SECURITY_SENDER_EMAIL,
        },
        to: process.env.SECURITY_ALERT_EMAIL,
        subject: `${successful ? 'Successful login' : 'Failed login'} - ACME Security`,
        text: [
            'ACME Corporation Security Notification',
            '',
            descriptions[status] || `Login result: ${status}`,
            '',
            `Submitted email: ${email}`,
            `Result: ${status}`,
            `IP address: ${ipAddress}`,
            `Country: ${country || 'Unknown'}`,
            `Time: ${new Date().toISOString()}`,
        ].join('\n'),
    })
}

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.json({ message: 'ACME Cybersecurity API is running!' })
})

// Tests if db can extract information by using a connection link
app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 AS result')

        res.json({
            success: true,
            message: 'Database connection successful!',
            result: rows[0].result,
        })
    } catch (error) {
        console.error('Database connection failed:', error.message)

        res.status(500).json({
            success: false,
            message: 'Database connection failed.',
        })
    }
})

// Sends formatted alert to the db table
async function createSecurityAlert({
                                       userId = null,
                                       type,
                                       severity,
                                       description,
                                       ipAddress = null,
                                   }) {
    await db.execute(
        `INSERT INTO security_alerts
            (user_id, alert_type, severity, description, ip_address)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, type, severity, description, ipAddress],
    );
}

// Login function using the db users table
app.post('/api/login', async (req, res) => {
    try {
        // 1. Read and validate the submitted credentials
        const email =
            typeof req.body?.email === 'string'
                ? req.body.email.trim().toLowerCase()
                : '';

        const password =
            typeof req.body?.password === 'string'
                ? req.body.password
                : '';

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.',
            });
        }

        // 2. Get the IP address and country
        const ipAddress = (
            req.ip ||
            req.socket.remoteAddress ||
            'unknown'
        ).slice(0, 45);

        // Stores the IP address in geo using geoip
        const geo = geoip.lookup(ipAddress);
        const country = geo ? geo.country : null;

        let user = null;
        let status = 'unknown_email';

        // 3. Check whether this IP address is blocked
        const [blockedRows] = await db.execute(
            `SELECT id
             FROM ip_blocks
             WHERE ip_address = ?
               AND is_active = TRUE
               AND (expires_at IS NULL OR expires_at > NOW())
             LIMIT 1`,
            [ipAddress],
        );

        if (blockedRows.length > 0) {
            status = 'ip_blocked';
        } else {
            // 4. Find the user by email
            const [users] = await db.execute(
                `SELECT id, email, password_hash, is_locked
                 FROM users
                 WHERE email = ?
                 LIMIT 1`,
                [email],
            );

            if (users.length === 0) {
                status = 'unknown_email';
            } else {
                user = users[0];

                // 5. Check whether the account is locked
                if (Boolean(user.is_locked)) {
                    status = 'account_locked';
                } else {
                    // 6. Compare the submitted password with its bcrypt hash
                    const passwordMatches = await bcrypt.compare(
                        password,
                        user.password_hash,
                    );

                    status = passwordMatches
                        ? 'success'
                        : 'wrong_password';
                }
            }
        }

        // 7. Record every login attempt in the database
        await db.execute(
            `INSERT INTO login_attempts
                (user_id, email_submitted, ip_address, status, country)
             VALUES (?, ?, ?, ?, ?)`,
            [
                user ? user.id : null,
                email,
                ipAddress,
                status,
                country,
            ],
        );

        try {
            // Uses the send email function created earlier to send the email
            await sendLoginNotification({
                email,
                status,
                ipAddress,
                country,
            })
        } catch (emailError) {
            console.error(
                'Failed to send login notification:',
                emailError.message,
            )
        }

        // 8. Create an alert for the individual login attempt and sends to db
        try {
            if (status === 'wrong_password') {
                await createSecurityAlert({
                    userId: user.id,
                    type: 'failed_login',
                    severity: 'Low',
                    description: 'Login failed: incorrect password',
                    ipAddress,
                });
            } else if (status === 'unknown_email') {
                await createSecurityAlert({
                    type: 'unknown_email',
                    severity: 'Low',
                    description: 'Login failed: unknown email address',
                    ipAddress,
                });
            } else if (status === 'account_locked') {
                await createSecurityAlert({
                    userId: user.id,
                    type: 'locked_account',
                    severity: 'High',
                    description: 'Login attempt on a locked account',
                    ipAddress,
                });
            } else if (status === 'ip_blocked') {
                await createSecurityAlert({
                    type: 'blocked_ip',
                    severity: 'Urgent',
                    description: 'Login attempt from a blocked IP address',
                    ipAddress,
                });
            }
        } catch (alertError) {
            console.error(
                'Failed to create login alert:',
                alertError.message,
            );
        }

        // 9. Detect repeated failed login attempts from this IP
        try {
            const [attemptRows] = await db.execute(
                `SELECT
                    COUNT(*) AS failed_attempts,
                    COUNT(DISTINCT email_submitted) AS targeted_accounts
                 FROM login_attempts
                 WHERE ip_address = ?
                   AND status IN ('wrong_password', 'unknown_email')
                   AND attempted_at >= NOW() - INTERVAL 10 MINUTE`,
                [ipAddress],
            );

            const failedAttempts = Number(
                attemptRows[0].failed_attempts,
            );

            const targetedAccounts = Number(
                attemptRows[0].targeted_accounts,
            );

            // Medium: 5 failed attempts within 10 minutes
            if (failedAttempts === 5) {
                await createSecurityAlert({
                    type: 'suspicious_login',
                    severity: 'Medium',
                    description:
                        'Multiple failed login attempts detected',
                    ipAddress,
                });
            }

            // High: 10 failed attempts within 10 minutes
            if (failedAttempts === 10) {
                await createSecurityAlert({
                    type: 'brute_force_detected',
                    severity: 'High',
                    description:
                        'Possible brute-force attack detected',
                    ipAddress,
                });
            }

            // High: repeated failures targeting multiple email addresses
            if (failedAttempts >= 5 && targetedAccounts >= 3) {
                const [existingAlerts] = await db.execute(
                    `SELECT id
                     FROM security_alerts
                     WHERE ip_address = ?
                       AND alert_type = 'multiple_accounts_targeted'
                       AND created_at >= NOW() - INTERVAL 10 MINUTE
                     LIMIT 1`,
                    [ipAddress],
                );

                if (existingAlerts.length === 0) {
                    await createSecurityAlert({
                        type: 'multiple_accounts_targeted',
                        severity: 'High',
                        description:
                            'Repeated failed logins targeting multiple accounts',
                        ipAddress,
                    });
                }
            }
        } catch (detectionError) {
            console.error(
                'Failed to detect suspicious activity:',
                detectionError.message,
            );
        }

        // 10. Return the result to the frontend
        if (status === 'success') {
            return res.status(200).json({
                success: true,
                message: 'Login successful',
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid Email ID or Password.',
        });
    } catch (error) {
        console.error('Login error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'A server error occurred. Please try again.',
        });
    }
});

// API link used to track logins in the past week graph
app.get('/api/stats/logins', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                DATE_FORMAT(attempted_at, '%Y-%m-%d') AS date,
                COUNT(*) AS total
            FROM login_attempts
            WHERE status = 'success'
                AND attempted_at >= CURDATE() - INTERVAL 6 DAY
                AND attempted_at < CURDATE() + INTERVAL 1 DAY
            GROUP BY DATE_FORMAT(attempted_at, '%Y-%m-%d')
            ORDER BY date
        `)

        res.json({
            success: true,
            data: rows,
        })
    } catch (error) {
        console.error('Failed to fetch login statistics:', error.message)

        res.status(500).json({
            success: false,
            message: 'Failed to fetch login statistics.',
        })
    }
})

// API link used to track unique ip logins for unique logins graph
app.get('/api/stats/unique-logins', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                DATE_FORMAT(attempted_at, '%Y-%m-%d') AS date,
                COUNT(DISTINCT ip_address) AS total
            FROM login_attempts
            WHERE status = 'success'
                AND attempted_at >= CURDATE() - INTERVAL 6 DAY
                AND attempted_at < CURDATE() + INTERVAL 1 DAY
            GROUP BY DATE_FORMAT(attempted_at, '%Y-%m-%d')
            ORDER BY date
        `)

        res.json({
            success: true,
            data: rows,
        })
    } catch (error) {
        console.error('Failed to fetch unique login statistics:', error.message)

        res.status(500).json({
            success: false,
            message: 'Failed to fetch unique login statistics.',
        })
    }
})

// API link used to track all the login attempts for the login attempts pie chart
app.get('/api/stats/login-attempts', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                COUNT(CASE WHEN status = 'success' THEN 1 END) AS successful,
                COUNT(CASE WHEN status = 'unknown_email' THEN 1 END) AS unknown_email,
                COUNT(CASE WHEN status = 'wrong_password' THEN 1 END) AS wrong_password,
                COUNT(CASE WHEN status = 'account_locked' THEN 1 END) AS account_locked,
                COUNT(CASE WHEN status = 'ip_blocked' THEN 1 END) AS ip_blocked
            FROM login_attempts
        `)

        res.json({
            success: true,
            data: rows[0],
        })
    } catch (error) {
        console.error('Failed to fetch login attempt statistics:', error.message)

        res.status(500).json({
            success: false,
            message: 'Failed to fetch login attempt statistics.',
        })
    }
})

// API link used to track the top 5 suspicious ips for the chart based on incorrect passwords
app.get('/api/stats/top-suspicious-ips', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                ip_address,
                COUNT(*) AS total
            FROM login_attempts
            WHERE status = 'wrong_password'
            GROUP BY ip_address
            ORDER BY total DESC, ip_address ASC
            LIMIT 5
        `)

        res.json({
            success: true,
            data: rows,
        })
    } catch (error) {
        console.error('Failed to fetch suspicious IP statistics:', error.message)

        res.status(500).json({
            success: false,
            message: 'Failed to fetch suspicious IP statistics.',
        })
    }
})

// API link used to track the top 5 country logins (attempts)
app.get('/api/stats/attempts-per-country', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                country,
                COUNT(*) AS total
            FROM login_attempts
            WHERE country IS NOT NULL
            GROUP BY country
            ORDER BY total DESC, country ASC
            LIMIT 5
        `)

        const countryNames = new Intl.DisplayNames(['en'], {
            type: 'region',
        })

        res.json({
            success: true,
            data: rows.map((row) => ({
                country: countryNames.of(row.country) || row.country,
                total: Number(row.total),
            })),
        })
    } catch (error) {
        console.error('Failed to fetch country statistics:', error.message)

        res.status(500).json({
            success: false,
            message: 'Failed to fetch country statistics.',
        })
    }
})

// API link to track the kpi stats
app.get('/api/stats/kpi', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                COUNT(
                    CASE WHEN status = 'success' THEN 1 END
                ) AS successful_logins,

                COUNT(
                    DISTINCT CASE
                        WHEN status = 'success' THEN ip_address
                    END
                ) AS unique_ips,

                COUNT(*) AS total_attempts,

                COUNT(
                    CASE WHEN status != 'success' THEN 1 END
                ) AS failed_logins

            FROM login_attempts
        `)

        const stats = rows[0]
        const totalAttempts = Number(stats.total_attempts)
        const failedLogins = Number(stats.failed_logins)

        res.json({
            success: true,
            data: {
                successfulLogins: Number(stats.successful_logins),
                uniqueIPs: Number(stats.unique_ips),
                failedPercentage:
                    totalAttempts === 0
                        ? 0
                        : (failedLogins / totalAttempts) * 100,
            },
        })
    } catch (error) {
        console.error('Failed to fetch KPI statistics:', error.message)

        res.status(500).json({
            success: false,
            message: 'Failed to fetch KPI statistics.',
        })
    }
})

// API link used to track alerts from db
app.get('/api/alerts', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                id,
                alert_type,
                severity,
                description,
                ip_address,
                is_read,
                created_at
            FROM security_alerts
            WHERE is_read = FALSE
            ORDER BY created_at DESC
            LIMIT 50
        `)

        res.json({
            success: true,
            data: rows,
        })
    } catch (error) {
        console.error('Failed to fetch alerts:', error.message)

        res.status(500).json({
            success: false,
            message: 'Failed to fetch alerts.',
        })
    }
})

// API link used to mark alerts as read in db
app.patch('/api/alerts/:id/read', async (req, res) => {
    try {
        const alertId = Number(req.params.id);

        if (!Number.isInteger(alertId) || alertId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid alert ID.',
            });
        }

        const [result] = await db.execute(
            `UPDATE security_alerts
             SET is_read = TRUE
             WHERE id = ?`,
            [alertId],
        );

        if (result.affectedRows === 0) {
            const [rows] = await db.execute(
                'SELECT id FROM security_alerts WHERE id = ?',
                [alertId],
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Alert not found.',
                });
            }
        }

        return res.json({
            success: true,
            message: 'Alert marked as read.',
        });
    } catch (error) {
        console.error('Failed to mark alert as read:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Failed to mark alert as read.',
        });
    }
});

// Checks which port the server is running on
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})
