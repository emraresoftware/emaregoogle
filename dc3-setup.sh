#!/bin/bash
# ============================================================
# EmareCloud DC-3 Kurulum Scripti
# Sunucu: 34.90.186.48 (europe-west4-a)
# ============================================================
set -e

echo "╔══════════════════════════════════════════════════╗"
echo "║  EmareCloud DC-3 — Kurulum Başlıyor              ║"
echo "╚══════════════════════════════════════════════════╝"

# 1. Sistem güncellemesi
echo "[1/8] Sistem güncelleniyor..."
apt-get update -qq && apt-get upgrade -y -qq

# 2. Temel paketler
echo "[2/8] Temel paketler kuruluyor..."
apt-get install -y -qq \
  python3.11 python3.11-venv python3.11-dev \
  python3-pip \
  nginx \
  git \
  curl wget \
  build-essential \
  libssl-dev libffi-dev \
  rsync \
  ufw \
  net-tools \
  htop

# 3. Dizin yapısı
echo "[3/8] Dizin yapısı oluşturuluyor..."
mkdir -p /opt/emarecloud/logs
mkdir -p /opt/emarecloud/instance

# 4. Python venv
echo "[4/8] Python virtual environment oluşturuluyor..."
python3.11 -m venv /opt/emarecloud/venv
/opt/emarecloud/venv/bin/pip install --upgrade pip -q

# 5. Nginx konfigürasyonu
echo "[5/8] Nginx yapılandırılıyor..."
cat > /etc/nginx/sites-available/emarecloud << 'NGINX_EOF'
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    server_name _;

    client_max_body_size 50M;

    location /static/ {
        alias /opt/emarecloud/static/;
        expires 30d;
    }

    location / {
        proxy_pass http://127.0.0.1:5555;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
        proxy_connect_timeout 60;
        proxy_send_timeout 86400;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/emarecloud /etc/nginx/sites-enabled/emarecloud
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl enable nginx && systemctl restart nginx

# 6. Firewall
echo "[6/8] UFW güvenlik duvarı yapılandırılıyor..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 7. wsgi.py oluştur
echo "[7/8] wsgi.py oluşturuluyor..."
cat > /opt/emarecloud/wsgi.py << 'WSGI_EOF'
from app import create_app
app, _ = create_app()
WSGI_EOF

# 8. Systemd service
echo "[8/8] Systemd servisi oluşturuluyor..."
cat > /etc/systemd/system/emarecloud.service << 'SERVICE_EOF'
[Unit]
Description=EmareCloud DC-3
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/emarecloud
Environment=FLASK_ENV=production
ExecStart=/opt/emarecloud/venv/bin/gunicorn \
    --worker-class geventwebsocket.gunicorn.workers.GeventWebSocketWorker \
    --workers 1 \
    --bind 0.0.0.0:5555 \
    --timeout 120 \
    --keep-alive 5 \
    --access-logfile /opt/emarecloud/logs/access.log \
    --error-logfile /opt/emarecloud/logs/error.log \
    wsgi:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE_EOF

systemctl daemon-reload
systemctl enable emarecloud

echo ""
echo "✅ Sistem hazırlandı!"
echo "   IP: $(curl -s ifconfig.me)"
echo "   Sonraki adım: kod deploy + pip install + db migration"
