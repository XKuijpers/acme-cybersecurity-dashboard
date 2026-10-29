const db = require('./db')
const bcrypt = require('bcrypt')
const readline = require('readline')

// Reads input from command prompt
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

// Reads the answer to the question using the rl variable
function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve)
    })
}

// Main function that runs upon creating account
async function main() {
    try {

        // Input to the questions stored in the database
        const email = (await ask('Admin email: ')).trim().toLowerCase()
        const password = await ask('Admin password: ')

        if (!email || !password) {
            throw new Error('Email and password are required.')
        }

        if (password.length < 12) {
            throw new Error('Use a password of at least 12 characters.')
        }

        // Encrypts password in database using bcrypt
        const passwordHash = await bcrypt.hash(password, 12)

        await db.execute(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            [email, passwordHash],
        )

        console.log('Admin account created successfully.')
    } catch (error) {
        console.error('Could not create admin:', error.message)
        process.exitCode = 1
    } finally {
        rl.close()
        await db.end()
    }
}

main()
