# 🛠️ Development Guide

This guide is for developers who want to contribute to or customize the Pi Dashboard.

## 📋 Table of Contents
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Running Locally](#running-locally)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Building for Production](#building-for-production)
- [Contributing](#contributing)

---

## 🚀 Development Setup

### Prerequisites
- Python 3.9+
- Docker & Docker Compose (for containerized development)
- Git
- Text editor or IDE (VS Code recommended)

### Local Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/pi-dashboard.git
cd pi-dashboard
```

2. **Create virtual environment**
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

5. **Run the application**
```bash
python app.py
```

Visit `http://localhost:8080` to see your changes!

---

## 📁 Project Structure

```
pi-dashboard/
├── app.py                  # Main Flask application
├── requirements.txt        # Python dependencies
├── Dockerfile             # Container image definition
├── docker-compose.yml     # Docker orchestration
├── install.sh            # Installation script
├── generate_icons.py     # PWA icon generator
│
├── templates/
│   └── index.html        # Main dashboard template
│
├── static/
│   ├── css/
│   │   └── style.css     # Styles (glassmorphism design)
│   ├── js/
│   │   └── app.js        # Frontend logic & WebSocket
│   ├── icons/            # PWA icons
│   ├── manifest.json     # PWA manifest
│   └── sw.js            # Service Worker
│
└── docs/
    └── ...              # Additional documentation
```

### Key Files

- **`app.py`**: Backend API and WebSocket server
  - System metrics collection (CPU, memory, disk, network)
  - Flask routes and Socket.IO handlers
  - Background tasks for broadcasting metrics

- **`templates/index.html`**: Main UI template
  - Semantic HTML structure
  - Metric cards and visualizations
  - Responsive layout

- **`static/css/style.css`**: Styling
  - CSS variables for theming
  - Glassmorphism effects
  - Responsive grid layouts
  - Animations

- **`static/js/app.js`**: Frontend JavaScript
  - WebSocket connection management
  - Real-time metric updates
  - Theme toggle
  - PWA installation

---

## 🏃 Running Locally

### Development Mode (Hot Reload)

For Python file changes:
```bash
export FLASK_ENV=development
python app.py
```

The app will auto-reload when you change Python files.

For frontend changes (HTML/CSS/JS), just refresh your browser.

### Docker Development

Build and run with Docker:
```bash
docker-compose up --build
```

View logs:
```bash
docker-compose logs -f
```

---

## 🔧 Making Changes

### Adding a New Metric

1. **Backend**: Add metric collection function in `app.py`
```python
def get_new_metric():
    """Get your new metric"""
    return {
        'value': 42,
        'status': 'good'
    }
```

2. **Add to metrics collection**
```python
def collect_all_metrics():
    return {
        ...
        'new_metric': get_new_metric()
    }
```

3. **Frontend**: Add display in `index.html`
```html
<div class="metric-card">
    <h3>New Metric</h3>
    <span id="newMetricValue">0</span>
</div>
```

4. **Update JavaScript** in `app.js`
```javascript
updateNewMetric(data) {
    const element = document.getElementById('newMetricValue');
    if (element) {
        element.textContent = data.new_metric.value;
    }
}
```

### Customizing the UI

**Colors**: Edit CSS variables in `style.css`
```css
:root {
    --gradient-purple: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}
```

**Layout**: Modify grid in `style.css`
```css
.metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
```

**Icons**: Replace SVGs in `index.html` or add from [Feather Icons](https://feathericons.com/)

### Changing Update Frequency

Edit `app.py`:
```python
def background_metrics_broadcast():
    while True:
        socketio.sleep(5)  # Change to desired seconds
        ...
```

---

## 🧪 Testing

### Manual Testing
1. Start the application
2. Open browser DevTools (F12)
3. Check Console for errors
4. Monitor Network tab for WebSocket connection
5. Test on different screen sizes

### Stress Testing
```bash
# Monitor resource usage
docker stats pi-dashboard

# Generate load
ab -n 1000 -c 10 http://localhost:8080/
```

### Testing on Real Pi
```bash
# Build for ARM
docker buildx build --platform linux/arm/v7 -t pi-dashboard:arm .

# Test on device
docker run -p 8080:8080 pi-dashboard:arm
```

---

## 📦 Building for Production

### Optimize Image Size
```bash
# Build with BuildKit
DOCKER_BUILDKIT=1 docker build -t pi-dashboard:latest .

# Check size
docker images pi-dashboard
```

### Multi-Architecture Build
```bash
# Setup buildx
docker buildx create --use

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64,linux/arm/v7 \
  -t yourusername/pi-dashboard:latest \
  --push .
```

---

## 🤝 Contributing

### Contribution Workflow

1. **Fork the repository**

2. **Create a feature branch**
```bash
git checkout -b feature/amazing-feature
```

3. **Make your changes**
- Write clean, commented code
- Follow existing code style
- Test thoroughly

4. **Commit with clear messages**
```bash
git commit -m "Add: Amazing new feature"
```

5. **Push to your fork**
```bash
git push origin feature/amazing-feature
```

6. **Open a Pull Request**
- Describe your changes
- Reference any issues
- Add screenshots for UI changes

### Code Style

**Python**
- Follow PEP 8
- Use docstrings for functions
- Keep functions small and focused

**JavaScript**
- Use ES6+ features
- Comment complex logic
- Use meaningful variable names

**CSS**
- Use CSS variables for colors
- Keep selectors specific
- Group related styles

### Git Commit Messages

Format:
```
Type: Short description

Longer description if needed
```

Types:
- `Add:` New feature
- `Fix:` Bug fix
- `Update:` Modify existing feature
- `Refactor:` Code restructuring
- `Docs:` Documentation changes
- `Style:` Formatting, no code change

---

## 🐛 Debugging Tips

### Backend Issues
```bash
# Enable debug mode
export FLASK_DEBUG=1
python app.py

# Check logs
docker-compose logs -f pi-dashboard
```

### Frontend Issues
```javascript
// Add debug logging in app.js
console.log('[DEBUG]', data);

// Monitor WebSocket
socket.on('connect', () => {
    console.log('Connected to server');
});
```

### Network Issues
```bash
# Check if port is in use
sudo netstat -tulpn | grep 8080

# Test WebSocket connection
wscat -c ws://localhost:8080/socket.io/
```

---

## 📚 Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)
- [psutil Documentation](https://psutil.readthedocs.io/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## 💡 Ideas for New Features

- [ ] Historical data with charts (Chart.js)
- [ ] Email/SMS alerts
- [ ] Docker container monitoring
- [ ] GPIO pin control
- [ ] Multi-device dashboard
- [ ] Mobile app (React Native)
- [ ] Database logging (SQLite/InfluxDB)
- [ ] REST API authentication
- [ ] Customizable widgets
- [ ] Export to CSV/PDF

---

**Happy coding! 🚀**

For questions, open an issue on GitHub.
