/**
 * Pi Dashboard - Real-time Monitoring Client
 * WebSocket-based updates with smooth animations
 */

class PiDashboard {
    constructor() {
        this.socket = null;
        this.currentProcessTab = 'cpu';
        this.init();
    }

    init() {
        this.setupTheme();
        this.setupSocketIO();
        this.setupEventListeners();
        this.checkRebootPermission();
    }

    // ===================================
    // Theme Management
    // ===================================

    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

    // ===================================
    // WebSocket Connection
    // ===================================

    setupSocketIO() {
        this.socket = io({
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10
        });

        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.updateConnectionStatus(true);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.updateConnectionStatus(false);
        });

        this.socket.on('metrics_update', (data) => {
            this.updateMetrics(data);
        });

        this.socket.on('system_info', (data) => {
            console.log('System info:', data);
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    }

    updateConnectionStatus(connected) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (connected) {
            statusDot.classList.add('connected');
            statusText.textContent = 'Connected';
        } else {
            statusDot.classList.remove('connected');
            statusText.textContent = 'Disconnected';
        }
    }

    // ===================================
    // Metrics Update
    // ===================================

    updateMetrics(data) {
        this.updateCPU(data.cpu);
        this.updateMemory(data.memory);
        this.updateDisk(data.disk);
        this.updateTemperature(data.temperature);
        this.updateUptime(data.uptime);
        this.updateNetwork(data.network);
        this.updateProcesses(data.top_processes_cpu, data.top_processes_mem);
        this.updateLastUpdate();
    }

    updateCPU(cpu) {
        if (!cpu) return;

        // Update overall CPU
        const cpuOverall = document.getElementById('cpuOverall');
        const cpuRing = document.getElementById('cpuRing');
        const cpuFreq = document.getElementById('cpuFreq');

        if (cpuOverall) {
            cpuOverall.textContent = cpu.overall;
        }

        // Update progress ring
        if (cpuRing) {
            const circumference = 2 * Math.PI * 60;
            const offset = circumference - (cpu.overall / 100) * circumference;
            cpuRing.style.strokeDashoffset = offset;
        }

        // Update frequency
        if (cpuFreq && cpu.frequency) {
            cpuFreq.textContent = `${cpu.frequency} MHz`;
        }

        // Update per-core usage
        const coreGrid = document.getElementById('coreGrid');
        if (coreGrid && cpu.per_core && cpu.per_core.length > 0) {
            coreGrid.innerHTML = cpu.per_core.map((usage, index) => `
                <div class="core-item">
                    <div class="core-label">Core ${index}</div>
                    <div class="core-bar">
                        <div class="core-bar-fill" style="width: ${usage}%"></div>
                    </div>
                    <div class="core-value">${usage}%</div>
                </div>
            `).join('');
        }
    }

    updateMemory(memory) {
        if (!memory) return;

        const memoryPercent = document.getElementById('memoryPercent');
        const memoryRing = document.getElementById('memoryRing');
        const memoryDetails = document.getElementById('memoryDetails');
        const ramBar = document.getElementById('ramBar');
        const ramValue = document.getElementById('ramValue');
        const swapBar = document.getElementById('swapBar');
        const swapValue = document.getElementById('swapValue');

        if (memoryPercent) {
            memoryPercent.textContent = memory.percent;
        }

        if (memoryRing) {
            const circumference = 2 * Math.PI * 60;
            const offset = circumference - (memory.percent / 100) * circumference;
            memoryRing.style.strokeDashoffset = offset;
        }

        if (memoryDetails) {
            memoryDetails.textContent = `${memory.used} GB / ${memory.total} GB`;
        }

        if (ramBar && ramValue) {
            ramBar.style.width = `${memory.percent}%`;
            ramValue.textContent = `${memory.percent}%`;
        }

        if (swapBar && swapValue) {
            swapBar.style.width = `${memory.swap_percent}%`;
            swapValue.textContent = `${memory.swap_percent}%`;
        }
    }

    updateDisk(disks) {
        if (!disks || disks.length === 0) return;

        const diskList = document.getElementById('diskList');
        if (!diskList) return;

        diskList.innerHTML = disks.map(disk => {
            const color = this.getDiskColor(disk.percent);
            return `
                <div class="disk-item">
                    <div class="disk-header">
                        <div class="disk-name">${disk.mountpoint}</div>
                        <div class="disk-size">${disk.used} GB / ${disk.total} GB</div>
                    </div>
                    <div class="disk-bar">
                        <div class="disk-bar-fill" style="width: ${disk.percent}%; background: ${color}"></div>
                    </div>
                    <div class="disk-details">
                        <span>${disk.device}</span>
                        <span>${disk.percent}% used</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    getDiskColor(percent) {
        if (percent >= 90) return 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
        if (percent >= 75) return 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)';
        return 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)';
    }

    updateTemperature(temperature) {
        const tempValue = document.getElementById('tempValue');
        const tempGauge = document.getElementById('tempGauge');
        const tempStatus = document.getElementById('tempStatus');

        if (!tempValue) return;

        if (temperature === null || temperature === undefined) {
            tempValue.textContent = '--';
            if (tempGauge) tempGauge.style.width = '0%';
            if (tempStatus) {
                tempStatus.textContent = 'Not Available';
                tempStatus.className = 'temp-status';
            }
            return;
        }

        tempValue.textContent = temperature;

        // Update gauge (assuming max temp of 85°C)
        if (tempGauge) {
            const percent = Math.min((temperature / 85) * 100, 100);
            tempGauge.style.width = `${percent}%`;
        }

        // Update status
        if (tempStatus) {
            if (temperature < 60) {
                tempStatus.textContent = 'Normal';
                tempStatus.className = 'temp-status normal';
            } else if (temperature < 70) {
                tempStatus.textContent = 'Warm';
                tempStatus.className = 'temp-status warm';
            } else {
                tempStatus.textContent = 'Hot';
                tempStatus.className = 'temp-status hot';
            }
        }
    }

    updateUptime(uptime) {
        if (!uptime) return;

        const uptimeDisplay = document.getElementById('uptimeDisplay');
        if (!uptimeDisplay) return;

        const parts = [];
        if (uptime.days > 0) parts.push(`${uptime.days}d`);
        if (uptime.hours > 0) parts.push(`${uptime.hours}h`);
        if (uptime.minutes > 0) parts.push(`${uptime.minutes}m`);
        
        uptimeDisplay.textContent = parts.join(' ') || 'Just started';
    }

    updateNetwork(network) {
        if (!network) return;

        const downloadSpeed = document.getElementById('downloadSpeed');
        const uploadSpeed = document.getElementById('uploadSpeed');
        const totalDownload = document.getElementById('totalDownload');
        const totalUpload = document.getElementById('totalUpload');

        if (downloadSpeed && network.bandwidth) {
            downloadSpeed.textContent = this.formatSpeed(network.bandwidth.download);
        }

        if (uploadSpeed && network.bandwidth) {
            uploadSpeed.textContent = this.formatSpeed(network.bandwidth.upload);
        }

        if (totalDownload) {
            totalDownload.textContent = `${network.bytes_recv} GB`;
        }

        if (totalUpload) {
            totalUpload.textContent = `${network.bytes_sent} GB`;
        }
    }

    formatSpeed(kbps) {
        if (kbps >= 1024) {
            return `${(kbps / 1024).toFixed(2)} MB/s`;
        }
        return `${kbps.toFixed(2)} KB/s`;
    }

    updateProcesses(cpuProcesses, memProcesses) {
        const processList = document.getElementById('processList');
        if (!processList) return;

        const processes = this.currentProcessTab === 'cpu' ? cpuProcesses : memProcesses;
        if (!processes || processes.length === 0) return;

        processList.innerHTML = processes.map(proc => {
            const value = this.currentProcessTab === 'cpu' ? proc.cpu : proc.memory;
            return `
                <div class="process-item">
                    <div class="process-info">
                        <div class="process-name">${this.escapeHtml(proc.name)}</div>
                        <div class="process-user">${this.escapeHtml(proc.user)}</div>
                    </div>
                    <div class="process-usage">
                        <div class="process-badge">${value}%</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateLastUpdate() {
        const lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) {
            const now = new Date();
            lastUpdate.textContent = now.toLocaleTimeString();
        }
    }

    // ===================================
    // Event Listeners
    // ===================================

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Process tabs
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchProcessTab(tab);
            });
        });

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportMetrics());
        }

        // Reboot button
        const rebootBtn = document.getElementById('rebootBtn');
        if (rebootBtn) {
            rebootBtn.addEventListener('click', () => this.rebootSystem());
        }

        // Install PWA prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
        });
    }

    switchProcessTab(tab) {
        this.currentProcessTab = tab;
        
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Force update
        this.socket.emit('request_metrics');
    }

    // ===================================
    // Actions
    // ===================================

    async exportMetrics() {
        try {
            const response = await fetch('/api/metrics');
            const data = await response.json();
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pi-metrics-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export metrics');
        }
    }

    async checkRebootPermission() {
        // Check if reboot is allowed via environment variable
        const rebootBtn = document.getElementById('rebootBtn');
        // For now, keep it hidden unless explicitly enabled
    }

    async rebootSystem() {
        if (!confirm('Are you sure you want to reboot the system? This will interrupt all running processes.')) {
            return;
        }

        try {
            const response = await fetch('/api/reboot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                alert('System is rebooting...');
            } else {
                alert(`Reboot failed: ${data.message}`);
            }
        } catch (error) {
            console.error('Reboot failed:', error);
            alert('Failed to reboot system');
        }
    }

    // ===================================
    // PWA Installation
    // ===================================

    async installPWA() {
        if (!this.deferredPrompt) return;

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        console.log(`User ${outcome} the install prompt`);
        this.deferredPrompt = null;
    }
}

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dashboard = new PiDashboard();
    });
} else {
    window.dashboard = new PiDashboard();
}

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/sw.js')
            .then(registration => console.log('SW registered:', registration))
            .catch(error => console.log('SW registration failed:', error));
    });
}
