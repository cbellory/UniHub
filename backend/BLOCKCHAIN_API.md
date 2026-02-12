# 🔗 Backend Blockchain Integration

Интеграция смарт-контрактов UniversityCoin и SoulboundDiploma с backend.

## 📋 Новые API Endpoints

### **Токены (UniversityCoin)**

#### 1. Выдать токены студенту
```http
POST /api/tokens/mint
Content-Type: application/json

{
  "studentAddress": "0x...",
  "amount": 100,
  "reason": "За отличную работу"
}
```

#### 2. Получить баланс токенов
```http
GET /api/tokens/balance/:address
```

#### 3. Синхронизировать баланс
```http
POST /api/tokens/sync/:address
```

#### 4. Получить адреса контрактов
```http
GET /api/tokens/contracts
```

---

### **Дипломы (SoulboundDiploma)**

#### 1. Выдать диплом
```http
POST /api/diploma/mint
Content-Type: application/json

{
  "studentAddress": "0x...",
  "metadataURI": "ipfs://QmHash.../diploma.json",
  "diplomaData": {
    "university": "Університет державної фіскальної служби України",
    "specialty": "Комп'ютерні науки",
    "graduationYear": 2025,
    "averageGrade": 4.8,
    "honors": "З відзнакою"
  }
}
```

#### 2. Получить информацию о дипломе
```http
GET /api/diploma/:tokenId
```

#### 3. Получить все дипломы студента
```http
GET /api/diploma/student/:address
```

#### 4. Получить все дипломы (админ)
```http
GET /api/diploma/all/list?page=1&limit=20
```

#### 5. Проверить подлинность диплома
```http
GET /api/diploma/verify/:tokenId
```

---

## 🏗️ Архитектура

```
backend/
├── services/
│   └── contractService.js    # Сервис для работы с блокчейном
├── controllers/
│   ├── tokenController.js    # Контроллер токенов
│   └── diplomaController.js  # Контроллер дипломов
├── models/
│   └── Diploma.js            # Модель диплома в MongoDB
├── routes/
│   ├── tokenRoutes.js        # Роуты токенов
│   └── diplomaRoutes.js      # Роуты дипломов
└── app.js                    # Регистрация роутов
```

---

## 🔐 Конфигурация

Добавьте в `.env`:
```
MNEMONIC=your mnemonic phrase here
```

---

## 📦 Адреса контрактов (BSC Testnet)

- **UniversityCoin (UCN)**: `0x101D7361767cA6C581974D8b54B62aa1ae230B50`
- **SoulboundDiploma (UDIP)**: `0x6FA7413d881C01F21c4D53e543FB35091210fAD3`

---

## 🧪 Тестирование

### Пример: Выдача токенов
```bash
curl -X POST http://localhost:5000/api/tokens/mint \
  -H "Content-Type: application/json" \
  -d '{
    "studentAddress": "0x7FdCA82e2D1b4EA9cd94B5d22a5B6d872e473dCE",
    "amount": 100,
    "reason": "Test mint"
  }'
```

### Пример: Проверка баланса
```bash
curl http://localhost:5000/api/tokens/balance/0x7FdCA82e2D1b4EA9cd94B5d22a5B6d872e473dCE
```

---

## ⚠️ Важно

1. **Мнемоника** используется только для тестовой сети!
2. Все транзакции логируются в консоль
3. Данные дублируются в MongoDB для быстрого доступа
4. При выдаче токенов/дипломов обновляется и блокчейн, и база данных

---

## 🔄 Синхронизация

Backend автоматически синхронизирует данные:
- При выдаче токенов → обновляется `Wallet.tokenBalance`
- При выдаче диплома → создается запись в `Diploma`

Для ручной синхронизации используйте:
```http
POST /api/tokens/sync/:address
```
