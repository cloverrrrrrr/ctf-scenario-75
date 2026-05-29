const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');

const app = express();
const PORT = 3075;

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('X-Powered-By', 'Node.js');
    next();
});

let feedbackDatabase = [];

app.get('/', (req, res) => {
    if (req.cookies.admin_session && req.cookies.admin_session.startsWith('adm_sess_')) {
        return res.redirect('/dashboard');
    }

    if (!req.cookies.pre_mfa_session) {
        res.cookie('pre_mfa_session', 'pending_mfa_verification', { 
            httpOnly: false, 
            path: '/'
        });
    }
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Corporate Admin Feedback System</title></head>
        <body>
            <div style="max-width:600px; margin: 40px auto; font-family: Arial;">
                <h2>Admin Feedback Submission (Pre-Auth Portal)</h2>
                <p>Welcome. Please submit your audit feedback below.</p>
                <form action="/feedback" method="POST">
                    <textarea name="feedback" style="width:100%; height:100px;"></textarea><br><br>
                    <input type="submit" value="Submit Feedback">
                </form>
            </div>
                <!--
    _____       _           _
    |  __ \     | |         | |
    | |__) |___ | |__   ___ | |_ ___
    |  _  // _ \| '_ \ / _ \| __/ __|
    | | \ \ (_) | |_) | (_) | |_\__ \
    |_|  \_\___/|_.__/ \___/ \__|___/

        Curious? Crawlers know the way.

                /robots.txt
    -->
        </body>
        </html>
    `);
});

app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send("User-agent: *\nDisallow: /api/verify-mfa");
});

app.post('/feedback', (req, res) => {
    const userFeedback = req.body.feedback || '';

    if (/<script>/i.test(userFeedback)) {
        return res.status(403).send("Forbidden: Malicious Payload Detected by WAF.");
    }
    if (userFeedback.includes("document.cookie")) {
        return res.status(403).send("Forbidden: Sensitive Object Access Blocked by WAF.");
    }

    if (/<svg/i.test(userFeedback) && userFeedback.includes("window[") && userFeedback.includes("fetch")) {
        feedbackDatabase.push(userFeedback); 
        
        setTimeout(() => { simulateAdminActivity(); }, 3000);

        return res.send("Feedback submitted successfully. An administrator will review your input shortly.");
    }

    feedbackDatabase.push(userFeedback);
    res.send("Feedback submitted successfully.");
});

app.get('/api/verify-mfa', (req, res) => {
    const preSession = req.cookies.pre_mfa_session;

    if (preSession === 'pending_mfa_verification') {
        res.cookie('admin_session', 'adm_sess_LEGITIMATE_USER_TOKEN_123', { httpOnly: true, path: '/' });
        return res.status(200).json({ message: "MFA Verified. Admin Session Issued." });
    } else {
        return res.status(400).json({ error: "No valid pre-authentication session found." });
    }
});

app.get('/dashboard', (req, res) => {
    const sessionCookie = req.cookies.admin_session || '';

    if (!sessionCookie.startsWith('adm_sess_')) {
        return res.status(401).send("<h1>401 Unauthorized</h1><p>Active administrative session required. Access Denied.</p>");
    }

    const reflectedXSS = feedbackDatabase.find(item => item.includes('<svg')) || 'No recent alerts.';

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Administrative Dashboard</title>
            <style>
                body { font-family: Arial; background-color: #1a1d20; color: #fff; padding: 40px; }
                .xss-payload { background: #111; padding: 15px; color: #00ff00; font-family: monospace; }
                .flag-box { margin-top: 20px; padding: 15px; background: #dc3545; font-weight: bold; }
            </style>
        </head>
        <body>
            <h2>System Audit Console (Authenticated Areas)</h2>
            <p>Welcome, Authorized Administrator.</p>
            
            <h3>Stored Alerts Review Panel:</h3>
            <div class="xss-payload">${reflectedXSS}</div>
            <div class="flag-box">
                SYSTEM COMPROMISED: SCENARIO75{RED_C00k13_MFA_Byp4ss_0wn3d}
            </div>
        </body>
        </html>
    `);
});

function simulateAdminActivity() {
    console.log("[*] Simulator Bot: Admin asli login dan membuka dashboard review...");

    const options = {
        hostname: '0.0.0.0',
        port: PORT,
        path: '/dashboard',
        method: 'GET',
        headers: {
            'Cookie': 'admin_session=adm_sess_SECRET_ADMIN_CONTEXTURE_TOKEN_ABC999',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AdminAuditBot/1.1',
            'X-Forwarded-For': 'UEhBTlRPTUdSSUR7QkxVRV9MMGdfSHVudDNyX000c3Qzcn0'
        }
    };

    const req = http.request(options, (res) => {
        res.on('data', () => {});
        res.on('end', () => { console.log("[+] Simulator Bot: Admin selesai memeriksa dashboard."); });
    });
    req.on('error', (e) => { console.error(`[-] Bot Error: ${e.message}`); });
    req.end();
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Admin Feedback System listening exactly on port ${PORT}`);
});