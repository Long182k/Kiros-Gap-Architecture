#!/bin/bash
# VPS Initial Setup Script for GapAnalyzer
# Run as root or with sudo

set -e

echo "🚀 Setting up GapAnalyzer VPS..."

# ============================================
# 1. Install Docker
# ============================================
echo "📦 Installing Docker..."
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Add current user to docker group
usermod -aG docker $SUDO_USER || true

# ============================================
# 2. Create App Directory
# ============================================
echo "📁 Creating app directory..."
mkdir -p /opt/gapanalyzer
chown -R $SUDO_USER:$SUDO_USER /opt/gapanalyzer

# ============================================
# 3. Configure Firewall
# ============================================
echo "🔒 Configuring firewall..."
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable

# ============================================
# 4. Install Fail2ban (optional security)
# ============================================
echo "🛡️ Installing Fail2ban..."
apt-get update
apt-get install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# ============================================
# 5. Setup SSH Key for GitHub Actions
# ============================================
echo ""
echo "============================================"
echo "📋 MANUAL STEPS REQUIRED:"
echo "============================================"
echo ""
echo "1. Add these GitHub Secrets to your repository:"
echo "   - VPS_HOST: $(curl -s ifconfig.me)"
echo "   - VPS_USER: $SUDO_USER"
echo "   - VPS_SSH_KEY: (paste your SSH private key)"
echo "   - GEMINI_API_KEY: (your Gemini API key)"
echo ""
echo "2. Copy .env.example to /opt/gapanalyzer/.env and configure:"
echo "   cp .env.example /opt/gapanalyzer/.env"
echo "   nano /opt/gapanalyzer/.env"
echo ""
echo "3. After first deploy, run database migrations:"
echo "   docker exec gapanalyzer-backend node scripts/migrate.js"
echo ""
echo "✅ VPS setup complete!"
