# 🚀 Deployment Checklist

Use this checklist to ensure a smooth deployment of Pi Dashboard on your Raspberry Pi Zero 2W.

---

## ✅ Pre-Deployment

### Hardware Requirements
- [ ] Raspberry Pi Zero 2W (or compatible device)
- [ ] MicroSD card (8GB+ recommended)
- [ ] Power supply (5V, 2.5A recommended)
- [ ] Network connection (WiFi or Ethernet)

### Software Requirements
- [ ] Raspberry Pi OS installed (Lite or Desktop)
- [ ] SSH access configured (if headless)
- [ ] System updated: `sudo apt update && sudo apt upgrade`
- [ ] Internet connection active

### Optional Tools
- [ ] Domain name configured (if exposing publicly)
- [ ] SSL certificate ready (Let's Encrypt recommended)
- [ ] Firewall configured (ufw recommended)

---

## 📦 Installation Steps

### Quick Installation (Recommended)
- [ ] Download installation script:
  ```bash
  curl -fsSL https://raw.githubusercontent.com/yourusername/pi-dashboard/main/install.sh -o install.sh
  ```
- [ ] Make executable: `chmod +x install.sh`
- [ ] Run installer: `./install.sh`
- [ ] Follow prompts
- [ ] Note the access URL displayed

### Manual Installation
- [ ] Clone repository: `git clone https://github.com/yourusername/pi-dashboard.git`
- [ ] Navigate to directory: `cd pi-dashboard`
- [ ] Copy environment: `cp .env.example .env`
- [ ] Edit configuration: `nano .env`
- [ ] Build and start: `docker-compose up -d`

---

## ⚙️ Configuration

### Required Configuration
- [ ] Update `.env` file with your settings
- [ ] Change `SECRET_KEY` to a secure random value
- [ ] Set desired `PORT` (default: 8080)
- [ ] Configure `ALLOW_REBOOT` if needed

### Generate Secure Secret Key
```bash
openssl rand -hex 32
```

### Network Configuration
- [ ] Note your Pi's IP address: `hostname -I`
- [ ] Test local access: `http://localhost:8080`
- [ ] Test network access: `http://YOUR_PI_IP:8080`
- [ ] Configure port forwarding (if needed for remote access)

### Firewall Setup (Recommended)
```bash
sudo ufw allow 8080/tcp
sudo ufw enable
```

---

## 🔒 Security Hardening (Production)

### Essential Security Steps
- [ ] Change default SSH port
- [ ] Disable root login via SSH
- [ ] Use SSH key authentication
- [ ] Keep system updated
- [ ] Enable firewall (ufw)
- [ ] Use strong passwords

### Application Security
- [ ] Change secret key from default
- [ ] Enable HTTPS with reverse proxy
- [ ] Limit network access if possible
- [ ] Regular backup configuration
- [ ] Monitor logs for suspicious activity

### Reverse Proxy Setup (Optional but Recommended)

**Install Nginx:**
```bash
sudo apt install nginx
```

**Configure SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

**Nginx Configuration:**
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🧪 Testing

### Basic Functionality Tests
- [ ] Dashboard loads successfully
- [ ] CPU metrics display correctly
- [ ] Memory usage shows accurate data
- [ ] Disk usage appears for all partitions
- [ ] Temperature reading is visible (if supported)
- [ ] Network stats update in real-time
- [ ] Process list displays
- [ ] Theme toggle works (light/dark)
- [ ] WebSocket connection established

### Browser Compatibility
- [ ] Tested on Chrome/Chromium
- [ ] Tested on Firefox
- [ ] Tested on Safari (if applicable)
- [ ] Tested on mobile browser
- [ ] PWA installation works

### Performance Verification
- [ ] Check container memory: `docker stats pi-dashboard`
- [ ] Verify CPU usage is < 5%
- [ ] Confirm RAM usage is < 50MB
- [ ] Test page load time (should be < 2s)
- [ ] Monitor for memory leaks (run for 1 hour)

### API Testing
```bash
# Test metrics endpoint
curl http://localhost:8080/api/metrics

# Test health endpoint
curl http://localhost:8080/health

# Test system info
curl http://localhost:8080/api/system-info
```

---

## 📱 PWA Setup

### Mobile Installation
- [ ] Open dashboard in Chrome/Edge on mobile
- [ ] Wait for "Add to Home Screen" prompt
- [ ] Tap "Install" or "Add"
- [ ] Verify app icon appears on home screen
- [ ] Launch from home screen
- [ ] Confirm standalone mode works

### Desktop Installation
- [ ] Open in Chrome/Edge on desktop
- [ ] Click install icon in address bar
- [ ] Or: Menu → Install Pi Dashboard
- [ ] Verify desktop shortcut created
- [ ] Launch as standalone app

---

## 🔧 Maintenance

### Regular Tasks
- [ ] Check logs weekly: `docker-compose logs pi-dashboard`
- [ ] Monitor disk space: `df -h`
- [ ] Update system packages monthly
- [ ] Restart container if needed: `docker-compose restart`
- [ ] Check for dashboard updates

### Backup Configuration
```bash
# Backup .env file
cp .env .env.backup

# Backup entire config
tar -czf pi-dashboard-backup-$(date +%Y%m%d).tar.gz \
    .env docker-compose.yml
```

### Update Dashboard
```bash
cd pi-dashboard
git pull
docker-compose down
docker-compose up -d --build
```

---

## 🐛 Troubleshooting

### Common Issues

**Dashboard not accessible:**
- [ ] Check if container is running: `docker ps`
- [ ] Check logs: `docker-compose logs`
- [ ] Verify port not in use: `sudo netstat -tulpn | grep 8080`
- [ ] Check firewall: `sudo ufw status`

**Temperature not showing:**
- [ ] Verify thermal zone exists: `cat /sys/class/thermal/thermal_zone0/temp`
- [ ] Check file permissions
- [ ] Restart container

**High memory usage:**
- [ ] Check for memory leaks: `docker stats`
- [ ] Restart container: `docker-compose restart`
- [ ] Check system resources: `htop`

**WebSocket disconnects:**
- [ ] Check network stability
- [ ] Verify no proxy interference
- [ ] Check browser console for errors

---

## 📊 Monitoring

### Container Health
```bash
# Check container status
docker ps -a | grep pi-dashboard

# View resource usage
docker stats pi-dashboard

# Check health status
docker inspect pi-dashboard | grep Health -A 10
```

### System Health
```bash
# Overall system status
htop

# Temperature
vcgencmd measure_temp

# Memory
free -h

# Disk space
df -h
```

---

## 🎯 Post-Deployment

### Verification Checklist
- [ ] Dashboard accessible locally
- [ ] Dashboard accessible from network
- [ ] All metrics displaying correctly
- [ ] Real-time updates working
- [ ] No errors in logs
- [ ] Container healthy
- [ ] PWA installable
- [ ] Theme toggle functional

### Documentation
- [ ] Note access URLs
- [ ] Document custom configurations
- [ ] Save backup of .env file
- [ ] Record any issues encountered

### Share & Enjoy!
- [ ] Take screenshots
- [ ] Share with community
- [ ] Star the repository ⭐
- [ ] Provide feedback
- [ ] Report any bugs

---

## 📞 Getting Help

If you encounter issues:

1. **Check Documentation**
   - README.md
   - DEVELOPMENT.md
   - This checklist

2. **Review Logs**
   ```bash
   docker-compose logs -f pi-dashboard
   ```

3. **Community Support**
   - GitHub Issues
   - GitHub Discussions

4. **Debug Mode**
   ```bash
   # Enable debug logging
   docker-compose down
   FLASK_DEBUG=1 docker-compose up
   ```

---

## ✨ Success!

If you've completed all checks, congratulations! 🎉

Your Pi Dashboard is now running and monitoring your system.

**Access URLs:**
- Local: http://localhost:8080
- Network: http://YOUR_PI_IP:8080

**Useful Commands:**
```bash
# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose stop

# Remove completely
docker-compose down
```

---

<div align="center">

**Happy Monitoring! 📊**

Made with ❤️ for Raspberry Pi

</div>
