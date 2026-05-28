import os
import time

LOG_DIR = "/opt/admin/logs" # SCENARIO75{/opt/admin/logs}
ACCESS_LOG = os.path.join(LOG_DIR, "access.log")
ERROR_LOG = os.path.join(LOG_DIR, "error.log") # SCENARIO75{/opt/admin/logs/error.log}

os.makedirs(LOG_DIR, exist_ok=True)

# Telemetry Assets & Indicators
attacker_ip = "10.10.14.50" # SCENARIO75{10.10.14.50}
attacker_ua = "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0" # SCENARIO75{Mozilla/5.0}
legit_ip = "192.168.1.100" # SCENARIO75{192.168.1.100}
legit_ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
b64_header = "UEhBTlRPTUdSSUR7QkxVRV9MMGdfSHVudDNyX000c3Qzcn0" # SCENARIO75{UEhBTlRPTUdSSUR7QkxVRV9MMGdfSHVudDNyX000c3Qzcn0}

print("[*] Generating high-fidelity threat logs...")

with open(ACCESS_LOG, "w") as f_access, open(ERROR_LOG, "w") as f_error:
    # 1. Baseline Administrative Background Traffic
    f_access.write(f'{legit_ip} - - [24/May/2026:18:45:12 +0000] "GET / HTTP/1.1" 200 1245 "-" "{legit_ua}" "-"\n')
    f_access.write(f'{legit_ip} - - [24/May/2026:18:46:01 +0000] "GET /dashboard HTTP/1.1" 200 3412 "-" "{legit_ua}" "-"\n')

    # 2. Phase 1 Reconnaissance by Attacker
    f_access.write(f'{attacker_ip} - - [24/May/2026:18:48:22 +0000] "GET / HTTP/1.1" 200 1245 "-" "{attacker_ua}" "-"\n')
    f_access.write(f'{attacker_ip} - - [24/May/2026:18:49:05 +0000] "GET /robots.txt HTTP/1.1" 200 68 "-" "{attacker_ua}" "-"\n')

    # 3. Phase 2 WAF Defeat & Execution
    # First WAF Alert entry exactly at 18:50:15
    f_access.write(f'{attacker_ip} - - [24/May/2026:18:50:15 +0000] "POST /feedback HTTP/1.1" 403 184 "-" "{attacker_ua}" "-"\n')
    f_error.write(f'[24/May/2026:18:50:15 +0000] [warn] WAF BLOCK: Malicious input element "<script>" rejected from src_ip: {attacker_ip}\n') # SCENARIO75{18:50:15}, SCENARIO75{<script>}

    # Successful WAF bypass with SVG 
    f_access.write(f'{attacker_ip} - - [24/May/2026:18:51:02 +0000] "POST /feedback HTTP/1.1" 200 245 "-" "{attacker_ua}" "-"\n')

    # 4. Phase 3 Session Replay Access & Exfiltration
    # Dashboard access with replayed token exactly at 18:51:55 returning status code 200
    f_access.write(f'{attacker_ip} - - [24/May/2026:18:51:55 +0000] "GET /dashboard HTTP/1.1" 200 4105 "-" "{attacker_ua}" "{b64_header}"\n') # SCENARIO75{18:51:55}, SCENARIO75{200}

    # Anomaly Security Flagged Log entry exactly at 18:53:10
    f_error.write(f'[24/May/2026:18:53:10 +0000] [CRITICAL] Security Alert: Authentication bypass anomaly detected. Cookie mismatch identified for context token pattern adm_sess_.\n') # SCENARIO75{18:53:10}, SCENARIO75{CRITICAL}, SCENARIO75{Authentication bypass anomaly}

print("[+] Forensic telemetry database written completely to /opt/admin/logs")