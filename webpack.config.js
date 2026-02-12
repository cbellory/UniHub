module.exports = {
    // ... остальные параметры конфигурации
    resolve: {
      fallback: {
        "https": false,
        "http": false,
        "stream": false,
        "crypto": false,
        // добавьте другие модули, которые вы не хотите полифилировать
      }
    }
  };
  