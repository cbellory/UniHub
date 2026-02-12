const { MongoClient } = require('mongodb');

// Connect to the database
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/walletsDB';
const client = new MongoClient(uri);

const UKRAINIAN_CONTENT = {
    group: "KN-1",
    courses: [
        {
            title: "Blockchain Fundamentals (KN-1)",
            newTitle: "Основи Блокчейну (KN-1)",
            description: "Вступ до Web3, гаманців та базових концепцій криптографії.",
            topics: [
                {
                    title: "Wallets & Security",
                    newTitle: "Гаманці та Безпека",
                    description: "Як створити та захистити свій крипто-гаманець.",
                    tasks: [
                        {
                            name: "Install MetaMask",
                            newName: "Встановити MetaMask",
                            description: "Встановіть розширення MetaMask для вашого браузера та створіть свій перший гаманець. Це ваш ключ до світу Web3.",
                            imageUrl: "https://images.unsplash.com/photo-1622630998477-20aa696fa4a5?auto=format&fit=crop&w=800&q=80",
                            url: "https://metamask.io"
                        },
                        {
                            name: "Secure Your Phrase",
                            newName: "Захисти свою Seed-фразу",
                            description: "Запишіть вашу секретну фразу (12 слів) на папері. НІКОЛИ не зберігайте її в цифровому вигляді (скріншоти, нотатки). Це єдиний спосіб відновити доступ до коштів.",
                            imageUrl: "https://images.unsplash.com/photo-1563206767-5b1d972b9323?auto=format&fit=crop&w=800&q=80",
                            url: "#"
                        },
                        {
                            name: "First Transaction",
                            newName: "Перша Транзакція",
                            description: "Отримайте тестові ETH у мережі Sepolia та надішліть 0.001 ETH на адресу викладача. Вставте хеш транзакції (TxID) у звіт.",
                            imageUrl: "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&w=800&q=80",
                            url: "https://sepolia.etherscan.io"
                        }
                    ]
                },
                {
                    title: "Cryptography Basics",
                    newTitle: "Основи Криптографії",
                    description: "Що таке хешування та як працюють ключі.",
                    tasks: [
                        {
                            name: "Hash Functions",
                            newName: "Хеш-функції",
                            description: "Розрахуйте SHA256 хеш для рядка \"Hello World\". Введіть останні 4 символи отриманого хешу як секретний код. (Підказка: використовуйте онлайн інструменти)",
                            imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
                            url: "https://emn178.github.io/online-tools/sha256.html"
                        },
                        {
                            name: "Public vs Private Keys",
                            newName: "Публічні та Приватні Ключі",
                            description: "Прочитайте статтю про асиметричне шифрування. Напишіть короткий звіт: чим відрізняється публічний ключ від приватного?",
                            imageUrl: "https://images.unsplash.com/photo-1584433144859-1fc3ab99a94d?auto=format&fit=crop&w=800&q=80",
                            url: "https://ethereum.org/en/developers/docs/accounts/"
                        }
                    ]
                }
            ]
        },
        {
            title: "Smart Contracts 101 (KN-1)",
            newTitle: "Смарт-контракти 101 (KN-1)",
            description: "Основи Solidity та середовище Remix IDE.",
            topics: [
                {
                    title: "Remix IDE",
                    newTitle: "Середовище Remix IDE",
                    description: "Знайомство з інструментами розробки.",
                    tasks: [
                        {
                            name: "Deploy \"Storage\"",
                            newName: "Деплой контракту Storage",
                            description: "Відкрийте Remix IDE, скомпілюйте стандартний контракт 'Storage.sol' та розгорніть його (Deploy) у JavaScript VM. Зробіть скріншот консолі з успішним деплоєм.",
                            imageUrl: "https://images.unsplash.com/photo-1607799275518-d58665d67203?auto=format&fit=crop&w=800&q=80",
                            url: "https://remix.ethereum.org"
                        },
                        {
                            name: "Store Value",
                            newName: "Збереження Значення",
                            description: "Викличте функцію `store` з числом 123. Потім викличте `retrieve` і переконайтеся, що повернулося 123. Надішліть скріншот.",
                            imageUrl: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=800&q=80",
                            url: "https://remix.ethereum.org"
                        },
                        {
                            name: "Custom Contract",
                            newName: "Власний Контракт",
                            description: "Напишіть простий контракт, який зберігає ваше ім'я (string) у публічній змінній. Розгорніть його та надішліть код.",
                            imageUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=800&q=80",
                            url: "https://remix.ethereum.org"
                        }
                    ]
                },
                {
                    title: "Advanced Concepts",
                    newTitle: "Просунуті Концепції",
                    description: "Токени та стандарти.",
                    tasks: [
                        {
                            name: "ERC-20 Token",
                            newName: "Створення ERC-20 Токена",
                            description: "Використовуйте OpenZeppelin Wizard, щоб створити свій власний токен (наприклад, MyToken). Скопіюйте код у Remix і розгорніть.",
                            imageUrl: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=800&q=80",
                            url: "https://wizard.openzeppelin.com"
                        },
                        {
                            name: "Final Quiz",
                            newName: "Фінальний Тест",
                            description: "Який акронім означає «Ми всі досягнемо успіху» у крипто-спільноті? (Введіть відповідь як секретний код)",
                            imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
                            url: "#"
                        }
                    ]
                }
            ]
        }
    ]
};

async function run() {
    try {
        await client.connect();
        console.log("Connected to database");
        const db = client.db();

        for (const courseData of UKRAINIAN_CONTENT.courses) {
            console.log(`Processing Course: ${courseData.title}...`);

            // 1. Update Course
            // We search by the OLD English title OR the NEW Ukrainian title (in case run twice)
            const course = await db.collection('courses').findOne({
                $or: [{ title: courseData.title }, { title: courseData.newTitle }]
            });

            if (!course) {
                console.warn(`Course not found: ${courseData.title}`);
                continue;
            }

            await db.collection('courses').updateOne(
                { _id: course._id },
                {
                    $set: {
                        title: courseData.newTitle,
                        description: courseData.description
                    }
                }
            );
            console.log(`  -> Updated Course Title: ${courseData.newTitle}`);

            // 2. Update Topics & Tasks
            for (const topicData of courseData.topics) {
                const topic = await db.collection('topics').findOne({
                    course: course._id, // Ensure it belongs to this course
                    $or: [{ title: topicData.title }, { title: topicData.newTitle }]
                });

                if (!topic) {
                    console.warn(`  Topic not found: ${topicData.title}`);
                    continue;
                }

                await db.collection('topics').updateOne(
                    { _id: topic._id },
                    {
                        $set: {
                            title: topicData.newTitle,
                            description: topicData.description
                        }
                    }
                );
                console.log(`  -> Updated Topic: ${topicData.newTitle}`);

                // 3. Update Tasks
                for (const taskData of topicData.tasks) {
                    const task = await db.collection('tasks').findOne({
                        topic: topic._id, // Ensure it belongs to this topic
                        $or: [{ name: taskData.name }, { name: taskData.newName }]
                    });

                    if (!task) {
                        console.warn(`    Task not found: ${taskData.name}`);
                        continue;
                    }

                    await db.collection('tasks').updateOne(
                        { _id: task._id },
                        {
                            $set: {
                                name: taskData.newName,
                                description: taskData.description,
                                imageUrl: taskData.imageUrl
                            }
                        }
                    );
                    console.log(`    -> Updated Task: ${taskData.newName}`);
                }
            }
        }

        console.log("Localization complete.");

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

run();
