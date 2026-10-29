# FDD (Cybersecurity Monitoring Dashboard)

## General description
A fully functional dashboard monitoring a fictional company.

## Functional requirements
- Email alerts about login/security events;
- Collecting the IP-address of a user when logged in;
- Captures failed login attempts;
- Email alerts about suspicious activity;
- Sends audit logs about certain changes;
  - Adding/deleting/editing accounts.
- Shows graphs about data such as;
  - Amount of log-ins;
  - Amount of unique log-ins (IP-address based).
- Has a user management function in order to add/delete/manage accounts;
  - Includes role-based access to the company dashboard.
    - Internship:
      - Can access the dashboard to get an overview of the security alerts.
    - Employee:
      - Can access the dashboard to get an overview of the security alerts;
      - Add/remove internship accounts.
    - Senior:
      - Can access the dashboard to get an overview of the security alerts;
      - Add/remove internship and employee accounts;
      - Can manage permissions of internship accounts.
    - Director:
      - Can access the dashboard to get an overview of the security alerts;
      - Add/remove internship and employee accounts;
      - Can manage permissions of internship, employee, and senior accounts;
      - Full administrator access.
- Use of ChatGPT to automatically classify certain suspicious activity;
- A search/filtering function for the alerts.

## Non-functional requirements

### Performance
The dashboard should load within 2 seconds under normal network conditions.

### Usability
Based on this article (https://www.ncsc.gov.uk/blog-post/accessibility-as-a-cyber-security-priority), I want to adhere to the following bullet points to ensure the best accessibility;
- Prevent complicated interfaces, mis-labelled buttons, ambiguous link text, or audio-only/visual-only warnings as it could make human errors more likely;
- Using colour schemes of 'red for high risk' and 'green for safe' may be inappropriate for people with colour blindness (https://venngage.com/templates/checklist/color-accessibility-color-blindness-work-checklist-9815a39e-ee23-4566-b08f-e2bdd97193e5);
- Avoid a lack of accessible feedback or error messaging when completing a configuration change, as it may lead to falsely presuming you have implemented a security control when you haven’t.

### Security
All the dashboard data should be logged and stored in a secure way (hashing passwords and other vulnerable information).

### Responsiveness
The app should be usable on the most popular screensizes (laptop, desktop, tablet, mobile).

--- 
# Refinement of each requirement
### Must Have:
- [X] Email alerts about login/security events;
- [X] Email alerts about suspicious activity;
- [X] Shows graphs about data such as;
  - [X] Amount of log-ins; 
  - [X] Amount of unique log-ins (IP-address based).
- [X] The dashboard should load within 2 seconds under normal network conditions;

### Should Have:
- [X] Collecting the IP-address of a user when logged in;
- [X] Captures failed login attempts;
- [X] Using colour schemes of 'red for high risk' and 'green for safe' may be inappropriate for people with colour blindness (https://venngage.com/templates/checklist/color-accessibility-color-blindness-work-checklist-9815a39e-ee23-4566-b08f-e2bdd97193e5);
- [X] Avoid a lack of accessible feedback or error messaging when completing a configuration change, as it may lead to falsely presuming you have implemented a security control when you haven’t.

### Could Have:
- [ ] Use of ChatGPT to automatically classify certain suspicious activity;
- [ ] A search/filtering function for the alerts;
- [ ] The app should be usable on the most popular screensizes (laptop, desktop, tablet, mobile);
- [X] Prevent complicated interfaces, mis-labelled buttons, ambiguous link text, or audio-only/visual-only warnings as it could make human errors more likely;
- [ ] Has a user management function in order to manage accounts permissions.
- [X] All the dashboard data should be logged and stored in a secure way (hashing passwords and other vulnerable information).
- [ ] Sends audit logs about certain changes;
  - [ ] Adding/deleting/editing accounts.
- [ ] Has a user management function in order to add/delete accounts;
  - [ ] Includes role-based access to the company dashboard.

### Won't Have:
- [X] Bright or otherwise overstimulating colors.