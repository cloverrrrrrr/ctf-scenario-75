const http = require('http');
const url = require('url');
const querystring = require('querystring');

const PORT = 3075;
let feedbackDatabase = [];

const server = http.createServer((req, res) => {
    res.setHeader('X-Powered-By', 'Node.js');

    const cookies = {};
    const rc = req.headers.cookie;
    if (rc) {
        rc.split(';').forEach(cookie => {
            const parts = cookie.split('=');
            cookies[parts.shift().trim()] = decodeURIComponent(parts.join('='));
        });
    }

    const parsedUrl = url.parse(req.url, true);

    if (parsedUrl.pathname === '/' && req.method === 'GET') {
        if (!cookies.pre_mfa_session) {
            res.setHeader('Set-Cookie', 'pre_mfa_session=pending_mfa_verification; Path=/');
        }

        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(`
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
                </div>
            </body>
            </html>
        `);
    }

    else if (parsedUrl.pathname === '/robots.txt' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end("User-agent: *\nDisallow: /api/verify-mfa");
    }

    else if (parsedUrl.pathname === '/api/verify-mfa' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: "MFA Gateway Online" }));
    }

    else if (parsedUrl.pathname === '/feedback' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const postData = querystring.parse(body);
            const userFeedback = postData.feedback || '';

            if (/<script>/i.test(userFeedback)) {
                res.writeHead(403, { 'Content-Type': 'text/plain' });
                return res.end("Forbidden: Malicious Payload Detected by WAF.");
            }

            if (userFeedback.includes("document.cookie")) {
                res.writeHead(403, { 'Content-Type': 'text/plain' });
                return res.end("Forbidden: Sensitive Object Access Blocked by WAF.");
            }

            if (/<svg/i.test(userFeedback) && userFeedback.includes("window[") && userFeedback.includes("fetch")) {
                feedbackDatabase.push(userFeedback); 
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                return res.end("Feedback submitted successfully. An administrator will review your input shortly.");
            }

            feedbackDatabase.push(userFeedback);
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            return res.end("Feedback submitted successfully.");
        });
    }

    else if (parsedUrl.pathname === '/dashboard' && req.method === 'GET') {
        const sessionCookie = cookies.admin_session || '';

        if (sessionCookie.startsWith('adm_sess_')) {
            const reflectedXSS = feedbackDatabase.find(item => item.includes('<svg')) || 'No recent alerts.';

            res.writeHead(200, { 'Content-Type': 'text/html' });
            return res.end(`
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
                        <div class="xss-payload">${reflectedXSS}</div>
                        <div class="flag-box">
                            SYSTEM COMPROMISED: SCENARIO75{RED_C00k13_MFA_Byp4ss_0wn3d}
                        </div>
                    </div>
                </body>
                </html>
            `);
        } else {
            res.writeHead(401, { 'Content-Type': 'text/plain' });
            return res.end("Unauthorized: Active administrative session required or MFA verification missing.");
        }
    }

    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end("Not Found");
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Admin Feedback System listening exactly on port ${PORT}`);
});