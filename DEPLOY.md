# Инструкция по развертыванию (DEPLOY)

Этот проект состоит из **Node.js Backend** (Express + MongoDB) и **React Frontend**.
Архитектура: Клиент-Сервер.
Совместимость: Linux (x86_64, ARM64), Windows.

## 📋 Требования
- **OS**: Ubuntu 20.04+ / Debian 11+ (рекомендуется)
- **Node.js**: v18.x или v20.x
- **MongoDB**: v5.0+
- **Nginx**: Для проксирования запросов (рекомендуется)
- **PM2**: Для управления процессами (глобально: `npm i -g pm2`)

## 🚀 1. Установка

1. **Клонирование репозитория**
   На сервере выполните:
   ```bash
   git clone <URL_ВАШЕГО_РЕПОЗИТОРИЯ> site_deeplom
   cd site_deeplom
   ```

2. **Установка зависимостей**
   В корневой папке выполните:

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

## ⚙️ 2. Настройка конфигурации (.env)

В проекте есть файлы `.env.example`. Используйте их как шаблон.

### Backend
1. Скопируйте пример: `cp .env.example .env`
2. Отредактируйте: `nano .env`
   - `PORT`: Порт бэкенда (по умолчанию 5555)
   - `MONGODB_URI`: Строка подключения к базе

### Frontend
1. Скопируйте пример: `cp .env.example .env`
2. Отредактируйте: `nano .env`
   - `REACT_APP_API_URL`: Если используете Nginx, оставьте `/api`. Если нет — укажите полный путь `http://IP:5555/api`
   - `GENERATE_SOURCEMAP=false`: Для продакшена

## 🏗️ 3. Сборка Frontend
Для работы в продакшене фронтенд нужно скомпилировать в статику:

```bash
cd frontend
npm run build
# Появится папка build/
```

## 🏃 4. Запуск

### Backend (через PM2)
```bash
cd backend
pm2 start server.js --name "deeplom-backend"
pm2 save
pm2 startup
```

### Frontend (через Nginx)
Настройте Nginx как обратный прокси. 

Пример конфига (`/etc/nginx/sites-available/deeplom`):
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

## 💾 5. База данных (Перенос)
1. На старом сервере: `node backend/backup-db-script.js`
2. Заберите архив из `backups/db/`.
3. На новом сервере восстановите через `mongorestore`.
