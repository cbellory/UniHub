// server.dev.js - Простой HTTP и WebSocket сервер для разработки и работы за Cloudflare

const http = require('http');
const WebSocket = require('ws');
const events = require('events');
const app = require('./app'); // Импортируем "мозг" нашего приложения из app.js

// Порт для HTTP-сервера. Для Cloudflare используем 80, 
// для локальной разработки можно поменять на 8080 или 3001, если порт 80 занят или требует прав администратора.
const port = process.env.PORT || 5555;

// Увеличение лимита слушателей, как и в вашем оригинальном файле
events.defaultMaxListeners = 30;

// Создаем HTTP сервер, передавая ему наше Express-приложение
const httpServer = http.createServer(app);

// Настройка WebSocket-сервера поверх нашего HTTP-сервера
const wss = new WebSocket.Server({ server: httpServer });

// --- WebSocket Logic ---
wss.on('connection', (ws, req) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`[WS] Нове з'єднання: ${ip}`);

  ws.on('message', (message) => {
    // Convert Buffer to String to ensure frontend receives text
    const messageText = message.toString();

    // Broadcast to everyone else
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(messageText);
      }
    });
  });

  ws.on('close', () => {
    // console.log(`[WS] З'єднання закрито: ${ip}`);
  });

  ws.on('error', (error) => {
    console.error(`[WS] Помилка: ${error.message}`);
  });

  // Removed the "Welcome" message to prevent spam on reconnects
});
// --- End WebSocket Logic ---

// Запускаем HTTP сервер, чтобы он начал принимать запросы
httpServer.listen(port, () => {
  console.log(`✅${port}`);
});

console.log('WebSocket-сервер налаштований та готовий до роботи.');