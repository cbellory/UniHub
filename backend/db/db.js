const mongoose = require("mongoose");

const connectDB = async () => {
  const connStr = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/walletsDB";

  const attemptConnection = async () => {
    try {
      console.log("🔄 Попытка подключения к MongoDB:", connStr);

      await mongoose.connect(connStr, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      console.log("✅ MongoDB успешно подключена!");
      console.log("📊 Состояние подключения:", mongoose.connection.readyState);
    } catch (err) {
      console.error("❌ Ошибка подключения к MongoDB:");
      console.error("   Сообщение:", err.message);
      console.error("   Строка подключения:", connStr);
      console.error("   ⏳ Повторная попытка через 5 секунд...");

      // Повторная попытка через 5 секунд
      setTimeout(attemptConnection, 5000);
    }
  };

  attemptConnection();
};

// Обработчики событий подключения
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose: Соединение установлено');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Mongoose: Ошибка соединения:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose: Соединение разорвано');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB соединение закрыто через app termination');
  process.exit(0);
});

module.exports = connectDB;
