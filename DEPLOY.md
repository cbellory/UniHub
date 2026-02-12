# Deployment Guide (DEPLOY)

This project consists of a **Node.js Backend** (Express + MongoDB) and a **React Frontend**.
Architecture: Client-Server.
Compatibility: Linux (x86_64, ARM64), Windows.

## 📋 Requirements
- **OS**: Ubuntu 20.04+ / Debian 11+ (recommended)
- **Node.js**: v18.x or v20.x
- **MongoDB**: v5.0+
- **Nginx**: For request proxying (recommended)
- **PM2**: For process management (global: `npm i -g pm2`)

## 🚀 1. Installation

1. **Clone Repository**
   On your server run:
   ```bash
   git clone https://github.com/cbellory/UniHub.git site_deeplom
   cd site_deeplom
   ```

2. **Install Dependencies**
   In the root folder run:

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

## ⚙️ 2. Configuration (.env)

The project includes `.env.example` files. Use them as templates.

### Backend
1. Copy example: `cp .env.example .env`
2. Edit: `nano .env`
   - `PORT`: Backend port (default 5555)
   - `MONGODB_URI`: Database connection string

### Frontend
1. Copy example: `cp .env.example .env`
2. Edit: `nano .env`
   - `REACT_APP_API_URL`: If using Nginx, keep `/api`. If not — specify full path `http://IP:5555/api`
   - `GENERATE_SOURCEMAP=false`: For production

## 🏗️ 3. Build Frontend
For production, the frontend needs to be compiled into static files:

```bash
cd frontend
npm run build
# A build/ folder will be created
```

## 🏃 4. Run

### Backend (via PM2)
```bash
cd backend
pm2 start server.js --name "deeplom-backend"
pm2 save
pm2 startup
```

### Frontend (via Nginx)
Configure Nginx as a reverse proxy.

Example config (`/etc/nginx/sites-available/deeplom`):
```nginx
server {
    listen 80;
    server_name your_domain_or_ip;

    root /path/to/site_deeplom/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5555/; # Backend port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 💾 5. Database (Migration)
1. On old server: `node backend/backup-db-script.js`
2. Copy archive from `backups/db/`.
3. On new server restore via `mongorestore`.
