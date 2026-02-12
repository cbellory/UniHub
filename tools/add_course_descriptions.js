const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '../backend/.env' });

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/walletsDB';
const client = new MongoClient(uri);

const UPDATES = [
    {
        title: "Amazon",
        newDescription: "Вивчення екосистеми Amazon та основ хмарних обчислень AWS. Побудова масштабованих рішень, робота з серверами EC2, базами даних RDS та безсерверною архітектурою Lambda."
    },
    {
        title: "Машинне навчання та штучний інтелект у фінансах",
        newDescription: "Застосування методів штучного інтелекту для аналізу фінансових ринків. Прогнозування цін, алгоритмічна торгівля, оцінка ризиків та автоматизація фінансових рішень."
    },
    {
        title: "Основи Блокчейну (KN-1)",
        newDescription: "Вступ до Web3, гаманців та базових концепцій криптографії. Ви навчитеся створювати та захищати крипто-гаманці, проводити транзакції та розуміти принципи роботи блокчейну."
    },
    {
        title: "Смарт-контракти 101 (KN-1)",
        newDescription: "Основи Solidity та середовище Remix IDE. Практичний курс: від першого смарт-контракту до деплою власного токена ERC-20 та взаємодії з блокчейн-мережами."
    }
];

async function run() {
    try {
        await client.connect();
        console.log("Connected to DB");
        const db = client.db();

        for (const item of UPDATES) {
            const course = await db.collection('courses').findOne({ title: item.title });
            if (course) {
                await db.collection('courses').updateOne(
                    { _id: course._id },
                    { $set: { description: item.newDescription } }
                );
                console.log(`✅ Updated description for: ${item.title}`);
            } else {
                console.warn(`⚠️ Course not found: ${item.title}`);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

run();
