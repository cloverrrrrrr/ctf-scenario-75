# Proxmox VE Deployment & Import Guide

## Overview

This repository contains the deployment instructions for the Cybersecurity Range Virtual Appliance.

The lab environment is distributed in two deployment formats:

* **Native Proxmox Backup (`.vma.zst`)** → Recommended for fastest deployment
* **Standalone QCOW2 Disk Image (`.qcow2`)** → Recommended for custom VM configurations or VLAN integration

---

# Download Links

| Artifact      | Description                      | Download                                    |
| ------------- | -------------------------------- | ------------------------------------------- |
| Native Backup | Pre-configured Proxmox VM backup | `[Insert Cloud Storage Download Link Here]` |
| QCOW2 Disk    | Universal virtual disk image     | `[Insert Cloud Storage Download Link Here]` |

---

# Deployment Options

## Option A — Native Restore via Proxmox Backup (Recommended)

This method provides the fastest and simplest deployment experience.

### Step 1 — Upload Backup File

Upload the downloaded backup archive to your Proxmox dump directory:

```bash
/var/lib/vz/dump/
```

Example file:

```bash
vzdump-qemu-750.vma.zst
```

---

### Step 2 — Access Proxmox Shell

Access your Proxmox host through:

* SSH
* Proxmox Web UI → Shell

---

### Step 3 — Restore Virtual Machine

Run the following restore command:

```bash
qmrestore /var/lib/vz/dump/vzdump-qemu-750.vma.zst 750 --storage local-lvm
```

### Parameter Explanation

| Parameter   | Description            |
| ----------- | ---------------------- |
| `750`       | Target VM ID           |
| `local-lvm` | Target storage backend |

> Ensure the selected VM ID is unused before restoring.

---

### Step 4 — Start the Virtual Machine

Start the restored VM:

```bash
qm start 750
```

You may also start the VM directly from the Proxmox Web UI.

---

# Option B — Manual Import via QCOW2 Disk

Use this method if you want:

* Custom hardware allocation
* VLAN segmentation
* Manual network mapping
* Alternative storage layouts

---

## Step 1 — Create Empty VM

Create a new VM from the Proxmox Web UI.

Suggested configuration:

| Setting  | Value                  |
| -------- | ---------------------- |
| VM ID    | `751`                  |
| OS Media | `Do not use any media` |

---

## Step 2 — Remove Default Disk

After VM creation:

1. Navigate to:

```text
VM → Hardware
```

2. Delete the automatically generated default disk.

---

## Step 3 — Upload QCOW2 Image

Upload the provided QCOW2 image to:

```bash
/var/lib/vz/images/
```

Example:

```bash
scenario75-disk.qcow2
```

---

## Step 4 — Import Disk into VM

Execute:

```bash
qm importdisk 751 /var/lib/vz/images/scenario75-disk.qcow2 local-lvm
```

---

## Step 5 — Attach Imported Disk

From the Proxmox Web UI:

### Navigate to:

```text
VM 751 → Hardware
```

Then:

1. Double-click `Unused Disk 0`
2. Click `Add`

---

## Step 6 — Configure Boot Order

Navigate to:

```text
VM 751 → Options → Boot Order
```

Set the imported disk as the primary boot device.

---

## Step 7 — Start Virtual Machine

Start the VM from either:

* Proxmox Web UI
* CLI

```bash
qm start 751
```

---

# Post-Deployment Verification

Once the VM boots successfully:

* The internal networking stack automatically requests a DHCP lease
* The appliance should become accessible from your lab network

---

# Access Information

## Target Web Portal

Open the following URL in your browser:

```text
http://<VM_ASSIGNED_IP>:3075
```

Example:

```text
http://192.168.1.50:3075
```

---

# Blue Team Forensics Access

Connect through SSH using the custom analyst access port:

```bash
ssh analyst@<VM_ASSIGNED_IP> -p 2275
```

### Default Credentials

| Username  | Password          |
| --------- | ----------------- |
| `analyst` | `blue_team_rocks` |

---

# Recommended Resource Allocation

| Resource | Minimum |
| -------- | ------- |
| vCPU     | 2       |
| RAM      | 4 GB    |
| Storage  | 40 GB   |

---

# Network Requirements

| Service            | Port       |
| ------------------ | ---------- |
| Web Portal         | `3075/TCP` |
| SSH Analyst Access | `2275/TCP` |

Ensure these ports are reachable from your lab environment.

---

# Troubleshooting

## VM Does Not Boot

Verify:

* Boot order configuration
* Disk attachment status
* Storage backend availability

---

## Web Portal Unreachable

Check:

```bash
ip a
systemctl status networking
```

Ensure DHCP assignment completed successfully.

---

## SSH Connection Refused

Verify that:

* Port `2275` is allowed by firewall rules
* VM network adapter is connected
* SSH service is active

Example:

```bash
systemctl status ssh
```

---

# Notes

* This appliance is intended for isolated laboratory environments only.
* Do not expose the VM directly to the public internet.
* Snapshotting the VM before use is strongly recommended.

---

# License

This project is provided for educational and internal cybersecurity training purposes only.
