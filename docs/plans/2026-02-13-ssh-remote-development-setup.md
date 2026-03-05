# SSH Remote Development Setup for Claude Code + AWS EC2

**Created:** 2026-02-13
**Purpose:** Enable remote development on AWS EC2 using Claude Code's SSH connection feature
**Status:** Implementation Guide

---

## Context

This guide was created to help set up SSH access from Claude Code (desktop app) to an AWS EC2 instance for remote development. The use case is working on Blaze Sports Intel code from a cloud server instead of a local Mac, enabling:

- More powerful hardware (EC2 can have more CPU/RAM)
- Persistent development environment (stays running even when laptop is closed)
- Access from multiple devices
- Faster deployments (EC2 closer to Cloudflare infrastructure)

---

## What is SSH?

**SSH (Secure Shell)** is a protocol for securely controlling one computer from another over the internet.

- **Without SSH:** Working directly on your Mac, editing files stored on your Mac
- **With SSH:** Connected to a remote machine (AWS EC2), editing files stored there, from your Mac's screen

---

## Authentication Approach: SSH Keys (Recommended)

**Why keys instead of passwords:**
- AWS EC2 requires key-based auth (password auth disabled by default for security)
- More secure—can't be brute-forced like passwords
- No typing passwords every connection
- Industry standard for cloud development

**How it works:**
- Generate cryptographic key pair: one public, one private
- Public key → lives on EC2 instance
- Private key → stays on your Mac
- When connecting, they verify each other mathematically

---

## Complete Setup Process

### 1. Create AWS EC2 Instance

**AWS Console → EC2 → Launch Instance:**

- **Name:** `bsi-dev-server`
- **OS Image:** Ubuntu Server 22.04 LTS (free tier eligible)
- **Instance type:**
  - `t2.micro` (free tier, good for learning)
  - `t3.medium` (~$30/month, better performance)
- **Key pair:** Create new
  - Name: `bsi-ec2-key`
  - Type: RSA
  - Format: `.pem`
  - **Save the downloaded `.pem` file!**
- **Network:** Allow SSH from "My IP"
- **Storage:** 20-30 GB

**After launch:**
- Wait for instance to reach "Running" state
- Note the **Public IPv4 address** (e.g., `54.123.45.67`)

---

### 2. Set Up SSH Keys on Your Mac

**If AWS gave you a `.pem` file (most common):**

```bash
# Create .ssh directory
mkdir -p ~/.ssh

# Move the downloaded key
mv ~/Downloads/bsi-ec2-key.pem ~/.ssh/

# Set correct permissions (required by SSH)
chmod 600 ~/.ssh/bsi-ec2-key.pem

# Verify
ls -la ~/.ssh/bsi-ec2-key.pem
```

**If generating your own key (for existing instances):**

```bash
# Generate new key pair
ssh-keygen -t ed25519 -C "austin@blazesportsintel.com" -f ~/.ssh/bsi-custom-key

# Passphrase options:
# - Blank (press Enter twice): easier, less secure
# - Set passphrase: more secure, type it when connecting

# Set permissions
chmod 600 ~/.ssh/bsi-custom-key
chmod 644 ~/.ssh/bsi-custom-key.pub
```

---

### 3. Add Public Key to EC2 (If Generated Your Own)

**Only needed if you generated your own key:**

```bash
# Display public key
cat ~/.ssh/bsi-custom-key.pub

# SSH into instance with AWS-provided key
ssh -i ~/.ssh/bsi-ec2-key.pem ubuntu@YOUR_EC2_IP

# On EC2, add your custom public key
echo "PASTE_YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit
```

---

### 4. Test SSH from Terminal

**Before using Claude Code, verify terminal SSH works:**

```bash
# Ubuntu instances
ssh -i ~/.ssh/bsi-ec2-key.pem ubuntu@YOUR_EC2_IP

# Amazon Linux instances
ssh -i ~/.ssh/bsi-ec2-key.pem ec2-user@YOUR_EC2_IP
```

**Success looks like:**
```
Welcome to Ubuntu 22.04.3 LTS
ubuntu@ip-172-31-xx-xx:~$
```

**Common issues:**
- "Permission denied" → Check `chmod 600` on key file
- "Connection refused" → Check EC2 security group allows SSH
- "Host key verification" → Type `yes` when prompted

---

### 5. Configure Claude Code SSH Connection

**In Claude Code → Add SSH Connection dialog:**

| Field | Value | Example |
|-------|-------|---------|
| **Name** | Friendly label | `BSI Dev Server` |
| **SSH Host** | `username@ip` | `ubuntu@54.123.45.67` |
| **SSH Port** | Default is `22` | `22` |
| **Identity File** | Path to private key | `~/.ssh/bsi-ec2-key.pem` |

**Username by OS:**
- Ubuntu: `ubuntu`
- Amazon Linux: `ec2-user`
- Debian: `admin`

**Example config:**
```
Name: BSI Dev Server
SSH Host: ubuntu@54.123.45.67
SSH Port: 22
Identity File: ~/.ssh/bsi-ec2-key.pem
```

---

### 6. Connect in Claude Code

1. Click connection dropdown (shows "Local" by default)
2. Select your server name ("BSI Dev Server")
3. Claude Code connects via SSH
4. File operations now happen on remote machine

**Set up your dev environment on EC2:**

```bash
# Clone BSI repo
git clone https://github.com/ahump20/BSI.git
cd BSI

# Install Node.js (if needed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install dependencies
npm install

# Verify everything works
npm run typecheck
```

---

### 7. Verify the Setup

**Test checklist:**
- [ ] File access works in Claude Code
- [ ] Terminal shows `ubuntu@ip-xxx-xxx:~$`
- [ ] Can clone repos with Git
- [ ] Node.js and npm installed
- [ ] Can run BSI commands (`npm run dev`, etc.)

---

## Optional Improvements

### SSH Config File (Easier Connections)

Create `~/.ssh/config` on your Mac:

```
Host bsi-dev
    HostName 54.123.45.67
    User ubuntu
    IdentityFile ~/.ssh/bsi-ec2-key.pem
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

**Benefits:**
- Connect with just: `ssh bsi-dev`
- In Claude Code, use SSH Host: `bsi-dev` (leave Identity File empty)

### Persistent Sessions with tmux

```bash
# On EC2, install tmux
sudo apt-get install tmux

# Start session
tmux new -s dev

# Detach: Ctrl+B then D
# Reattach: tmux attach -t dev
```

**Benefit:** Your work survives SSH disconnections

---

## Cost Management

**AWS EC2 Pricing:**
- `t2.micro`: Free tier (750 hours/month, first 12 months)
- `t3.medium`: ~$30/month (running 24/7)

**To save money:**
- **Stop instance** when not using (AWS Console → Stop)
- Files are preserved, no charges while stopped
- **Start instance** when you need it again (gets new IP unless using Elastic IP)

---

## How It Works (Mental Model)

**Before SSH:**
```
Claude Code → reads files on Mac → executes commands on Mac
```

**After SSH:**
```
Claude Code → SSH tunnel → reads files on EC2 → executes commands on EC2
                           ↑
                    Your Mac is just the UI
```

**What this means:**
- Your Mac shows the code, but the code actually lives on EC2
- When you run commands, they execute on the EC2 server
- Your EC2 instance needs Git, Node, npm, etc.—that's where everything runs
- The BSI repo on EC2 is separate from any copy on your Mac

---

## Quick Reference

**Connect from terminal:**
```bash
ssh -i ~/.ssh/bsi-ec2-key.pem ubuntu@YOUR_EC2_IP
```

**Connect in Claude Code:**
1. Connection dropdown → Select server
2. Start coding!

**Check EC2 status:**
- AWS Console → EC2 → Instances
- Instance must be "Running" to connect

**Transfer files:**
```bash
# Mac → EC2
scp -i ~/.ssh/bsi-ec2-key.pem local-file.txt ubuntu@YOUR_EC2_IP:~/

# EC2 → Mac
scp -i ~/.ssh/bsi-ec2-key.pem ubuntu@YOUR_EC2_IP:~/remote-file.txt ./
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Permission denied (publickey)" | Check key file permissions: `chmod 600 ~/.ssh/bsi-ec2-key.pem` |
| "Connection timed out" | Check EC2 security group allows SSH from your IP |
| "Host key verification failed" | Type `yes` when prompted, or clear old keys: `ssh-keygen -R YOUR_EC2_IP` |
| Can't find key file | Verify path: `ls -la ~/.ssh/bsi-ec2-key.pem` |
| Wrong username | Ubuntu uses `ubuntu`, Amazon Linux uses `ec2-user` |
| EC2 IP changed | Stop/start changes IP (use Elastic IP for static address) |

---

## Next Steps

After successful setup:
- Set up your full BSI dev environment on EC2
- Configure Git with your credentials
- Install any additional tools needed (Docker, PostgreSQL, etc.)
- Consider creating an AMI snapshot of configured instance (backup)
- Set up CloudWatch alarms for cost monitoring

---

## Security Best Practices

1. **Protect your private key:**
   - Never share `.pem` files
   - Never commit to Git
   - Back up securely (encrypted drive)

2. **EC2 Security Group:**
   - Only allow SSH from your IP (not 0.0.0.0/0)
   - Update when your IP changes

3. **Keep EC2 updated:**
   ```bash
   sudo apt-get update
   sudo apt-get upgrade
   ```

4. **Monitor costs:**
   - Set up AWS billing alerts
   - Stop instances when not in use

---

**Document created for:** Austin Humphrey / Blaze Sports Intel
**Last updated:** 2026-02-13
