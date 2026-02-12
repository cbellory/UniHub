#!/bin/bash
set -e

# This script should be run with sudo

echo "Installing Nginx and Certbot..."
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

echo "Configuring Nginx..."
cat <<EOF > /etc/nginx/sites-available/cbellory.online
server {
    listen 80;
    server_name cbellory.online www.cbellory.online;
    client_max_body_size 50M;

    # Fix CSP for Cloudflare/External Scripts
    add_header Content-Security-Policy "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src *; img-src * data: blob:;";

    location / {
        proxy_pass http://localhost:5555;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Link to sites-enabled
ln -sf /etc/nginx/sites-available/cbellory.online /etc/nginx/sites-enabled/
# Remove default to avoid conflicts
rm -f /etc/nginx/sites-enabled/default

echo "Testing Nginx config..."
nginx -t

echo "Reloading Nginx..."
systemctl reload nginx

echo "Nginx setup complete. HTTP access should work."
