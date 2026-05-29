#!/bin/bash
# Lab Infrastructure Automated Provisioning Engine

set -e

echo "[*] Initializing Cyber Range Environment Setup..."

# Update and install critical requirements
apt-get update -y
apt-get install -y docker.io docker-compose python3 openssh-server npm nodejs

# 1. Configure Custom Blue Team SSH Access
# Credentials: analyst / blue_team_rocks
USERNAME="analyst"
PASSWORD="blue_team_rocks"

if ! id -u "$USERNAME" >/dev/null 2>&1; then
    useradd -m -s /bin/bash "$USERNAME"
    echo "$USERNAME:$PASSWORD" | chpasswd
    echo "[+] Blue Team User Account Created."
fi

# Change SSH configuration to run on custom port 2275
sed -i 's/#Port 22/Port 2275/g' /etc/ssh/sshd_config || echo "Port 2275" >> /etc/ssh/sshd_config
systemctl restart sshd
echo "[+] SSH Service bound to custom port 2275."

# 2. Execute High-Fidelity Forensic Telemetry Injection
python3 generate_logs.py

# 3. Fire up the containerized Vulnerable Web Application Architecture
echo "[*] Building and running the application container fabric via Docker Compose..."
docker-compose down 2>/dev/null || true
docker-compose up -d --build

echo "================================================================="
echo "[+] CAPTURE THE FLAG RANGE SETUP SUCCESSFULLY ENGINE DEPLOYED"
echo "[-] Target Application Endpoint: http://localhost:3075"
echo "[-] Incident Response Management: SSH via Port 2275"
echo "================================================================="