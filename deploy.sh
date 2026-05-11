#!/usr/bin/env bash
#
# deploy.sh — Развёртывание Essay Tracker на Ubuntu 22.04+
#
# Использование:
#   sudo bash deploy.sh
#
# Скрипт:
#   1. Устанавливает Node.js 20, nginx, certbot
#   2. Создаёт пользователя приложения
#   3. Копирует файлы, устанавливает зависимости, собирает проект
#   4. Настраивает systemd-сервис для автозапуска
#   5. Настраивает nginx как HTTPS reverse proxy
#   6. Получает бесплатный SSL-сертификат Let's Encrypt
#
set -euo pipefail

# ─── Проверки ──────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  echo "❌ Запустите с sudo:  sudo bash deploy.sh"
  exit 1
fi

APP_NAME="essay-tracker.chikhladze.org"
DOMAIN="$APP_NAME"
APP_USER="jarashow"
APP_DIR="/var/www/$APP_NAME"
NODE_PORT=3001
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║      Essay Tracker — Развёртывание...            ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Домен:  $DOMAIN"
echo "║  Папка:  $APP_DIR"
echo "║  Порт:   $NODE_PORT"
echo "║  Протокол: HTTPS (с SSL)"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ─── 1. Установка системных пакетов ───────────────────────
echo "📦 [1/7] Установка системных пакетов..."
apt-get update -qq
apt-get install -y -qq curl gnupg2 ca-certificates lsb-release nginx certbot python3-certbot-nginx git > /dev/null

# Node.js 20.x через NodeSource
if ! command -v node &> /dev/null || [[ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt 18 ]]; then
  echo "   Установка Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null
  apt-get install -y -qq nodejs > /dev/null
fi
echo "   ✅ Node.js $(node -v), npm $(npm -v)"

# ─── 2. Создание пользователя ─────────────────────────────
echo "👤 [2/7] Создание пользователя $APP_USER..."
if ! id "$APP_USER" &> /dev/null; then
  useradd --system --shell /bin/bash --create-home --home-dir "/home/$APP_USER" "$APP_USER"
fi

# ─── 3. Копирование файлов проекта ────────────────────────
echo "📂 [3/7] Копирование файлов в $APP_DIR..."
mkdir -p "$APP_DIR"

# Копируем всё, кроме node_modules и dist
rsync -a --delete \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.git' \
  --exclude 'deploy.sh' \
  "$SCRIPT_DIR/" "$APP_DIR/"

chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

# ─── 4. Установка зависимостей и сборка ───────────────────
echo "🔨 [4/7] Установка зависимостей и сборка..."
cd "$APP_DIR"
sudo -u "$APP_USER" npm install --production=false > /dev/null 2>&1
sudo -u "$APP_USER" npm run build > /dev/null 2>&1
echo "   ✅ Проект собран"

# ─── 5. Создание systemd-сервиса ──────────────────────────
echo "⚙️  [5/7] Настройка systemd-сервиса..."
cat > "/etc/systemd/system/${APP_NAME}.service" << EOF
[Unit]
Description=English Essay Tracker
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node $APP_DIR/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=$NODE_PORT

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "$APP_NAME" > /dev/null 2>&1
systemctl restart "$APP_NAME"
echo "   ✅ Сервис запущен"

# ─── 6. Настройка nginx (HTTP) ────────────────────────────
echo "🌐 [6/8] Настройка nginx (HTTP)..."

cat > "/etc/nginx/sites-available/$APP_NAME" << EOF
server {
    listen 80;
    listen [::]:80;

    server_name $DOMAIN;

    client_max_body_size 10M;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    location / {
        proxy_pass http://127.0.0.1:$NODE_PORT;
        proxy_http_version 1.1;

        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;

        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto http;

        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf "/etc/nginx/sites-available/$APP_NAME" "/etc/nginx/sites-enabled/$APP_NAME"
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl restart nginx

echo "   ✅ nginx запущен на HTTP"

# ─── 7. Получение SSL сертификата ─────────────────────────
echo "🔒 [7/8] Получение SSL-сертификата Let's Encrypt..."

certbot certonly \
  --non-interactive \
  --agree-tos \
  --nginx \
  -d "$DOMAIN" \
  --email admin@$DOMAIN \
  --redirect \
  --hsts \
  --staple-ocsp \
  --no-eff-email

# ─── 8. Переключение nginx на HTTPS ───────────────────────
echo "🌍 [8/8] Включение HTTPS..."

cat > "/etc/nginx/sites-available/$APP_NAME" << EOF
server {
    listen 80;
    listen [::]:80;

    server_name $DOMAIN;

    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 10M;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    location / {
        proxy_pass http://127.0.0.1:$NODE_PORT;
        proxy_http_version 1.1;

        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;

        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;

        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

nginx -t
systemctl reload nginx

echo "   ✅ HTTPS включён"

# ─── Финальная проверка ──────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   ✅ Развёртывание завершено                     ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║                                                  ║"
echo "║  🌐 Сайт:    https://$DOMAIN"
echo "║  📁 Файлы:   $APP_DIR"
echo "║  📊 Данные:  $APP_DIR/data.json"
echo "║  ⚙️  Сервис:  $APP_NAME.service"
echo "║                                                  ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Полезные команды:                               ║"
echo "║                                                  ║"
echo "║  Статус:    sudo systemctl status $APP_NAME"
echo "║  Логи:      sudo journalctl -u $APP_NAME -f"
echo "║  Рестарт:   sudo systemctl restart $APP_NAME"
echo "║  Останов:   sudo systemctl stop $APP_NAME"
echo "║                                                  ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
