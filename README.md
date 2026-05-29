# 🚀 Cyber Range Lab: Cookie Reuse & MFA Bypass (Scenario 75)

Welcome to the **Admin Feedback System** vulnerability lab. This is a self-contained "Red vs. Blue" Capture The Flag (CTF) environment designed to simulate session hijacking flaws, rudimentary WAF bypasses, and multi-factor authentication anomalies.

---

## 📊 Overview Architecture



This lab runs inside a Linux Virtual Machine containerized with Docker and is fully optimized for a **Proxmox VE** deployment.

* **Target Web Application Port**: `3075` (HTTP)
* **Flag Submission Portal**: `http://<VM_IP>:3075/submit-flag`
* **Blue Team Forensic Terminal**: SSH via Port `2275` (`analyst` / `blue_team_rocks`)

---

## 🗂️ Documentation Index (Quick Links)

To streamline evaluation and deployment, the documentation has been split into dedicated modules:

### 🛠️ [1. Proxmox Infrastructure & Deployment Guide](docs/proxmox_deployment.md)
Contains step-by-step instructions on how to import the pre-configured VM image (`.vma.zst` / `.qcow2`) into a Proxmox VE hypervisor, configure network bridges, and troubleshoot host network issues.

### 🎯 [2. Complete CTF Walkthrough & Flag Solutions](docs/ctf_walkthrough.md)
The official comprehensive solution guide. It covers:
* **Red Team Attack Path**: Reconnaissance, WAF Evasion via HTML5 `<svg>` tokens, and programmatic MFA bypass.
* **Blue Team Forensic Path**: Log hunting in `/opt/admin/logs`, threat mapping, base64 payload decoding, and incident remediation steps.

---

## ⚡ Quick Start (For Local Testing Only)
If you want to test the application locally on your machine before importing the virtual image into Proxmox:

```bash
# Clone repository
git clone <repository-url> && cd ctf-scenario75

# Run the automation script (Installs local files & runs docker)
sudo chmod +x setup.sh && sudo ./setup.sh