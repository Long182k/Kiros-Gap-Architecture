#!/bin/bash
# VPS Initial Setup Script for GapAnalyzer
# Run as root or with sudo on your Ubuntu VPS

set -e

echo "🚀 Setting up GapAnalyzer VPS..."

# ============================================
# 1. Install Docker
# ============================================
echo "📦 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# Add current user to docker group
usermod -aG docker $SUDO_USER 2>/dev/null || usermod -aG docker $USER || true

# ============================================
# 2. Install Git
# ============================================
echo "📦 Installing Git..."
apt-get update
apt-get install -y git

# ============================================
# 3. Create App Directory
# ============================================
echo "📁 Creating app directory..."
mkdir -p /opt/gapanalyzer
cd /opt/gapanalyzer

# ============================================
# 4. Clone Repository
# ============================================
REPO_URL="https://github.com/Long182k/Kiros-Gap-Architecture.git"

if [ -d ".git" ]; then
    echo "📥 Updating existing repository..."
    git pull origin master
else
    echo "📥 Cloning repository..."
    git clone $REPO_URL .
fi

# ============================================
# 5. Create .env file from example
# ============================================
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Edit /opt/gapanalyzer/.env with your actual values!"
fi

# ============================================
# 6. Configure Firewall
# ============================================
echo "🔒 Configuring firewall..."
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable

# ============================================
# 7. Set Permissions
# ============================================
chown -R $SUDO_USER:$SUDO_USER /opt/gapanalyzer 2>/dev/null || chown -R $USER:$USER /opt/gapanalyzer

# ============================================
# Done!
# ============================================
echo ""
echo "============================================"
echo "✅ VPS SETUP COMPLETE!"
echo "============================================"
echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. Edit environment variables:"
echo "   nano /opt/gapanalyzer/.env"
echo ""
echo "2. After editing .env, start the application:"
echo "   cd /opt/gapanalyzer"
echo "   docker compose up -d"
echo ""
echo "3. Run database migrations:"
echo "   docker exec gapanalyzer-backend node scripts/migrate.js"
echo ""
echo "4. Check logs:"
echo "   docker compose logs -f"
echo ""
echo "🌐 Your VPS IP: $(curl -s ifconfig.me)"
echo ""
