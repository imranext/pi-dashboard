# =====================================
# Pi Dashboard - Optimized ARM Dockerfile
# Multi-stage build for minimal image size
# Target: Raspberry Pi Zero 2W (ARM)
# =====================================

# Stage 1: Builder
FROM python:3.11-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    gcc \
    musl-dev \
    linux-headers \
    python3-dev

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-alpine

LABEL maintainer="Pi Dashboard"
LABEL description="Lightweight system monitoring dashboard for Raspberry Pi Zero 2W"
LABEL version="1.0"

# Install runtime dependencies only
RUN apk add --no-cache \
    procps \
    coreutils \
    util-linux

# Create non-root user for security
RUN addgroup -g 1000 pimonitor && \
    adduser -D -u 1000 -G pimonitor pimonitor

# Set working directory
WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Copy application files
COPY --chown=pimonitor:pimonitor . .

# Set environment variables
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080 \
    HOST=0.0.0.0

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Switch to non-root user
USER pimonitor

# Run the application
CMD ["python", "app.py"]
