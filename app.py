#!/usr/bin/env python3
"""
Raspberry Pi Zero 2W Monitoring Dashboard
Lightweight system monitoring with Flask and WebSockets
"""

import os
import time
import psutil
import platform
from datetime import datetime, timedelta
from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO, emit
from threading import Lock
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'pi-monitor-secret-key')

# Enable CORS and configure SocketIO for lightweight operation
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading', 
                    ping_timeout=10, ping_interval=5)

# Thread lock for safe operations
thread_lock = Lock()

# Store network counters for bandwidth calculation
last_net_io = None
last_net_time = None

def get_cpu_info():
    """Get CPU usage and per-core information"""
    try:
        cpu_percent = psutil.cpu_percent(interval=0.5)
        cpu_per_core = psutil.cpu_percent(interval=0.5, percpu=True)
        cpu_freq = psutil.cpu_freq()
        
        return {
            'overall': round(cpu_percent, 1),
            'per_core': [round(core, 1) for core in cpu_per_core],
            'frequency': round(cpu_freq.current, 0) if cpu_freq else 0,
            'cores': psutil.cpu_count()
        }
    except Exception as e:
        logger.error(f"Error getting CPU info: {e}")
        return {'overall': 0, 'per_core': [], 'frequency': 0, 'cores': 0}

def get_memory_info():
    """Get memory usage information"""
    try:
        mem = psutil.virtual_memory()
        swap = psutil.swap_memory()
        
        return {
            'total': round(mem.total / (1024**3), 2),
            'used': round(mem.used / (1024**3), 2),
            'available': round(mem.available / (1024**3), 2),
            'percent': round(mem.percent, 1),
            'swap_total': round(swap.total / (1024**3), 2),
            'swap_used': round(swap.used / (1024**3), 2),
            'swap_percent': round(swap.percent, 1)
        }
    except Exception as e:
        logger.error(f"Error getting memory info: {e}")
        return {'total': 0, 'used': 0, 'available': 0, 'percent': 0}

def get_disk_info():
    """Get disk usage for all partitions"""
    try:
        partitions = []
        for partition in psutil.disk_partitions(all=False):
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                partitions.append({
                    'device': partition.device,
                    'mountpoint': partition.mountpoint,
                    'fstype': partition.fstype,
                    'total': round(usage.total / (1024**3), 2),
                    'used': round(usage.used / (1024**3), 2),
                    'free': round(usage.free / (1024**3), 2),
                    'percent': round(usage.percent, 1)
                })
            except PermissionError:
                continue
        return partitions
    except Exception as e:
        logger.error(f"Error getting disk info: {e}")
        return []

def get_temperature():
    """Get CPU temperature (Raspberry Pi specific)"""
    try:
        # Try multiple methods to get temperature
        
        # Method 1: psutil sensors (if available)
        if hasattr(psutil, 'sensors_temperatures'):
            temps = psutil.sensors_temperatures()
            if temps:
                # Check common temperature sensor names
                for name in ['cpu_thermal', 'cpu-thermal', 'coretemp', 'k10temp']:
                    if name in temps:
                        return round(temps[name][0].current, 1)
        
        # Method 2: Raspberry Pi specific file
        if os.path.exists('/sys/class/thermal/thermal_zone0/temp'):
            with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
                temp = float(f.read().strip()) / 1000.0
                return round(temp, 1)
        
        # Method 3: Alternative thermal file
        if os.path.exists('/sys/class/hwmon/hwmon0/temp1_input'):
            with open('/sys/class/hwmon/hwmon0/temp1_input', 'r') as f:
                temp = float(f.read().strip()) / 1000.0
                return round(temp, 1)
                
        return None
    except Exception as e:
        logger.error(f"Error getting temperature: {e}")
        return None

def get_uptime():
    """Get system uptime"""
    try:
        boot_time = datetime.fromtimestamp(psutil.boot_time())
        uptime = datetime.now() - boot_time
        
        days = uptime.days
        hours, remainder = divmod(uptime.seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        
        return {
            'days': days,
            'hours': hours,
            'minutes': minutes,
            'seconds': seconds,
            'boot_time': boot_time.strftime('%Y-%m-%d %H:%M:%S')
        }
    except Exception as e:
        logger.error(f"Error getting uptime: {e}")
        return {'days': 0, 'hours': 0, 'minutes': 0, 'seconds': 0}

def get_network_info():
    """Get network statistics with bandwidth calculation"""
    global last_net_io, last_net_time
    
    try:
        current_io = psutil.net_io_counters()
        current_time = time.time()
        
        bandwidth = {'download': 0, 'upload': 0}
        
        if last_net_io and last_net_time:
            time_delta = current_time - last_net_time
            if time_delta > 0:
                # Calculate bandwidth in KB/s
                download_speed = (current_io.bytes_recv - last_net_io.bytes_recv) / time_delta / 1024
                upload_speed = (current_io.bytes_sent - last_net_io.bytes_sent) / time_delta / 1024
                
                bandwidth = {
                    'download': round(download_speed, 2),
                    'upload': round(upload_speed, 2)
                }
        
        last_net_io = current_io
        last_net_time = current_time
        
        return {
            'bytes_sent': round(current_io.bytes_sent / (1024**3), 2),
            'bytes_recv': round(current_io.bytes_recv / (1024**3), 2),
            'packets_sent': current_io.packets_sent,
            'packets_recv': current_io.packets_recv,
            'bandwidth': bandwidth
        }
    except Exception as e:
        logger.error(f"Error getting network info: {e}")
        return {'bytes_sent': 0, 'bytes_recv': 0, 'bandwidth': {'download': 0, 'upload': 0}}

def get_top_processes(sort_by='cpu', limit=5):
    """Get top processes by CPU or memory usage"""
    try:
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'username']):
            try:
                info = proc.info
                processes.append({
                    'pid': info['pid'],
                    'name': info['name'][:30],  # Truncate long names
                    'cpu': round(info['cpu_percent'], 1),
                    'memory': round(info['memory_percent'], 1),
                    'user': info['username']
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        # Sort by specified field
        sort_key = 'cpu' if sort_by == 'cpu' else 'memory'
        processes.sort(key=lambda x: x[sort_key], reverse=True)
        
        return processes[:limit]
    except Exception as e:
        logger.error(f"Error getting processes: {e}")
        return []

def get_system_info():
    """Get static system information"""
    try:
        uname = platform.uname()
        return {
            'hostname': uname.node,
            'system': uname.system,
            'release': uname.release,
            'machine': uname.machine,
            'processor': uname.processor or 'ARM',
            'python_version': platform.python_version()
        }
    except Exception as e:
        logger.error(f"Error getting system info: {e}")
        return {}

def collect_all_metrics():
    """Collect all system metrics"""
    return {
        'cpu': get_cpu_info(),
        'memory': get_memory_info(),
        'disk': get_disk_info(),
        'temperature': get_temperature(),
        'uptime': get_uptime(),
        'network': get_network_info(),
        'top_processes_cpu': get_top_processes('cpu', 5),
        'top_processes_mem': get_top_processes('memory', 5),
        'timestamp': datetime.now().isoformat()
    }

# Routes
@app.route('/')
def index():
    """Serve the main dashboard page"""
    system_info = get_system_info()
    return render_template('index.html', system_info=system_info)

@app.route('/api/metrics')
def api_metrics():
    """REST API endpoint for metrics"""
    return jsonify(collect_all_metrics())

@app.route('/api/system-info')
def api_system_info():
    """REST API endpoint for system information"""
    return jsonify(get_system_info())

@app.route('/api/reboot', methods=['POST'])
def api_reboot():
    """Reboot the system (requires appropriate permissions)"""
    try:
        if os.environ.get('ALLOW_REBOOT', 'false').lower() == 'true':
            os.system('sudo reboot')
            return jsonify({'status': 'success', 'message': 'System rebooting...'})
        else:
            return jsonify({'status': 'error', 'message': 'Reboot not enabled'}), 403
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/health')
def health():
    """Health check endpoint for Docker"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

# WebSocket handlers
@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info('Client connected')
    emit('system_info', get_system_info())

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info('Client disconnected')

@socketio.on('request_metrics')
def handle_metrics_request():
    """Handle real-time metrics request"""
    try:
        metrics = collect_all_metrics()
        emit('metrics_update', metrics)
    except Exception as e:
        logger.error(f"Error sending metrics: {e}")
        emit('error', {'message': str(e)})

def background_metrics_broadcast():
    """Background task to broadcast metrics to all connected clients"""
    while True:
        try:
            socketio.sleep(3)  # Update every 3 seconds
            metrics = collect_all_metrics()
            socketio.emit('metrics_update', metrics, broadcast=True)
        except Exception as e:
            logger.error(f"Error in background broadcast: {e}")

@socketio.on('start_monitoring')
def handle_start_monitoring():
    """Start monitoring for a specific client"""
    logger.info('Client started monitoring')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    host = os.environ.get('HOST', '0.0.0.0')
    
    logger.info(f"Starting Pi Dashboard on {host}:{port}")
    
    # Start background metrics broadcast
    socketio.start_background_task(background_metrics_broadcast)
    
    socketio.run(app, host=host, port=port, debug=False, allow_unsafe_werkzeug=True)
