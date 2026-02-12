# 🎓 University Smart Contracts

Смарт-контракты для дипломного проекта "Цифровий Університет".

## 📋 Контракты

### 1. **UniversityCoin (UCN)**
- Стандарт: ERC-20
- Утилітарний токен для винагород студентів
- Функції:
  - ✅ Mint (тільки MINTER_ROLE)
  - ✅ Burn (будь-хто може спалити свої токени)
  - ✅ Pause/Unpause (тільки PAUSER_ROLE)
  - ✅ Access Control (ролі)

### 2. **SoulboundDiploma (UDIP)**
- Стандарт: ERC-721 (NFT)
- Непередавані токени (Soulbound)
- Функції:
  - ✅ Mint дипломів (тільки owner)
  - ❌ Transfer заблокований
  - ✅ Метадані в IPFS

## 🚀 Установка

```bash
cd site/contracts
npm install
```

## 🔧 Компіляція

```bash
npm run compile
```

## 🧪 Тестування

```bash
npm test
```

## 📦 Деплой

### Локальна мережа (для тестів)
```bash
# В одному терминале запустите локальную ноду
npx hardhat node

# В другом терминале задеплойте
npm run deploy:local
```

### BNB Smart Chain Testnet
```bash
npm run deploy:testnet
```

После деплоя адреса контрактов будут сохранены в `deployed-addresses.json`.

## 🔗 Полезные ссылки

- **BSC Testnet Explorer**: https://testnet.bscscan.com/
- **BSC Testnet Faucet**: https://testnet.bnbchain.org/faucet-smart
- **OpenZeppelin Docs**: https://docs.openzeppelin.com/

## 📁 Структура проекта

```
contracts/
├── contracts/
│   ├── UniversityCoin.sol       # ERC-20 токен
│   └── SoulboundDiploma.sol     # ERC-721 SBT
├── scripts/
│   └── deploy.ts                # Скрипт деплоя
├── test/
│   ├── UniversityCoin.test.ts   # Тесты токена
│   └── SoulboundDiploma.test.ts # Тесты диплома
├── hardhat.config.ts            # Конфигурация Hardhat
└── package.json
```

## 🔐 Безопасность

⚠️ **ВАЖНО**: Мнемоническая фраза в `hardhat.config.ts` используется только для тестовой сети!
Никогда не используйте эту фразу в mainnet!

## 📝 Примеры использования

### Mint токенов студенту
```javascript
const coin = await ethers.getContractAt("UniversityCoin", COIN_ADDRESS);
await coin.mint(studentAddress, ethers.parseEther("100"));
```

### Выдача диплома
```javascript
const diploma = await ethers.getContractAt("SoulboundDiploma", DIPLOMA_ADDRESS);
const metadataURI = "ipfs://QmHash.../diploma.json";
await diploma.safeMint(studentAddress, metadataURI);
```

## 🎯 Роадмап

- [x] Создать UniversityCoin
- [x] Создать SoulboundDiploma
- [x] Написать тесты
- [x] Деплой в testnet
- [ ] Интеграция с backend
- [ ] Интеграция с frontend
