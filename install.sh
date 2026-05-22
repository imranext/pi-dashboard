#!/bin/bash

#################################################
# Pi Dashboard Installation Script
# One-command setup for Raspberry Pi
#################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logo
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════╗
║                                       ║
║      🚀 Pi Dashboard Installer       ║
║   Modern System Monitoring for Pi    ║
║                                       ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${RED}❌ Error: This script is designed for Linux systems${NC}"
    exit 1
fi

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Check for Docker
echo -e "\n${BLUE}Checking prerequisites...${NC}"
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    echo -e "${YELLOW}Installing Docker...${NC}"
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    
    print_status "Docker installed successfully"
    print_info "You may need to log out and back in for group changes to take effect"
else
    print_status "Docker is installed"
fi

# Check for Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed"
    echo -e "${YELLOW}Installing Docker Compose...${NC}"
    
    # Install Docker Compose
    sudo apt-get update
    sudo apt-get install -y docker-compose-plugin
    
    print_status "Docker Compose installed successfully"
else
    print_status "Docker Compose is installed"
fi

# Create .env file if it doesn't exist
echo -e "\n${BLUE}Configuring environment...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    
    # Generate random secret key
    SECRET_KEY=$(openssl rand -hex 32)
    sed -i "s/change-me-to-a-random-secure-key-in-production/$SECRET_KEY/" .env
    
    print_status "Created .env file with secure secret key"
else
    print_info ".env file already exists, skipping"
fi

# Get local IP address
LOCAL_IP=$(hostname -I | awk '{print $1}')

# Build and start the dashboard
echo -e "\n${BLUE}Building and starting Pi Dashboard...${NC}"
docker-compose build
docker-compose up -d

# Wait for container to be healthy
echo -e "\n${BLUE}Waiting for dashboard to start...${NC}"
sleep 5

# Check if container is running
if docker ps | grep -q pi-dashboard; then
    print_status "Dashboard is running!"
    
    echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}    🎉 Installation Complete! 🎉${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo -e "\n${BLUE}Access your dashboard at:${NC}"
    echo -e "  • Local:   ${GREEN}http://localhost:8080${NC}"
    echo -e "  • Network: ${GREEN}http://$LOCAL_IP:8080${NC}"
    echo -e "\n${BLUE}Useful commands:${NC}"
    echo -e "  • View logs:    ${YELLOW}docker-compose logs -f${NC}"
    echo -e "  • Stop:         ${YELLOW}docker-compose stop${NC}"
    echo -e "  • Start:        ${YELLOW}docker-compose start${NC}"
    echo -e "  • Restart:      ${YELLOW}docker-compose restart${NC}"
    echo -e "  • Remove:       ${YELLOW}docker-compose down${NC}"
    echo -e "\n${BLUE}PWA Installation:${NC}"
    echo -e "  Open the dashboard in Chrome/Edge on your mobile device"
    echo -e "  and tap '${YELLOW}Add to Home Screen${NC}' to install as an app!"
    echo -e ""
else
    print_error "Dashboard failed to start"
    echo -e "\n${YELLOW}Checking logs:${NC}"
    docker-compose logs
    exit 1
fi

# Optional: Set up as systemd service
read -p "$(echo -e ${YELLOW}Would you like to set up auto-start on boot? [y/N]: ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Create systemd service
    sudo tee /etc/systemd/system/pi-dashboard.service > /dev/null << EOF
[Unit]
Description=Pi Dashboard - System Monitor
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable pi-dashboard.service
    
    print_status "Auto-start on boot enabled"
    echo -e "  • Disable: ${YELLOW}sudo systemctl disable pi-dashboard.service${NC}"
fi

echo -e "\n${GREEN}Happy monitoring! 📊${NC}\n"
