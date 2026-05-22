#!/bin/bash

#################################################
# Pi Dashboard Quick Start Script
# Fast deployment without installation
#################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Pi Dashboard Quick Start${NC}\n"

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker not found. Please install Docker first:${NC}"
    echo "   curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# Create .env if needed
if [ ! -f .env ]; then
    echo -e "${BLUE}Creating default configuration...${NC}"
    cat > .env << EOF
PORT=8080
HOST=0.0.0.0
SECRET_KEY=$(openssl rand -hex 16)
ALLOW_REBOOT=false
EOF
    echo -e "${GREEN}✓${NC} Configuration created\n"
fi

# Start the dashboard
echo -e "${BLUE}Starting Pi Dashboard...${NC}"
docker-compose up -d

# Wait a moment
sleep 3

# Get IP
LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")

# Success message
if docker ps | grep -q pi-dashboard; then
    echo -e "\n${GREEN}✅ Dashboard is running!${NC}\n"
    echo -e "   Local:   http://localhost:8080"
    echo -e "   Network: http://${LOCAL_IP}:8080"
    echo -e "\n${YELLOW}Stop with:${NC} docker-compose down\n"
else
    echo -e "\n${RED}❌ Failed to start. Check logs with:${NC}"
    echo -e "   docker-compose logs\n"
    exit 1
fi
