const mongoose = require('mongoose');
const MongoClient = mongoose.mongo.MongoClient;

const uri = 'mongodb://127.0.0.1:27018'; // Direct connection
const dbName = 'walletsDB';

console.log('Connecting and Translating Quizzes...');

MongoClient.connect(uri)
    .then(async client => {
        const db = client.db(dbName);
        const tasksCollection = db.collection('tasks');

        // Find all quizzes
        const quizzes = await tasksCollection.find({ type: 'quiz' }).toArray();
        console.log(`Found ${quizzes.length} quizzes to translate.`);

        for (const quiz of quizzes) {
            console.log(`Translating: ${quiz.name}`);

            let newName = quiz.name;
            let newDesc = quiz.description;
            let newQuizData = [...(quiz.quizData || [])];
            let modified = false;

            // Translate Name
            if (newName.includes('Quiz:')) newName = newName.replace('Quiz:', 'Тест:');

            // Translate Description
            if (newDesc.includes('A short quiz to test your knowledge on')) {
                newDesc = newDesc.replace('A short quiz to test your knowledge on', 'Короткий тест для перевірки знань з теми');
            }

            // Translate Questions (Heuristic based on known English seeds)
            newQuizData = newQuizData.map(q => {
                let text = q.question;
                let opts = [...q.options];

                // JS / AWS / General mappings
                if (text.includes("What is 2 + '2' in JavaScript?")) {
                    text = "Скільки буде 2 + '2' у JavaScript?";
                    opts = ["4", "22", "NaN", "Помилка"];
                }
                else if (text.includes("Which keyword is used to define a constant?")) {
                    text = "Яке ключове слово використовується для оголошення константи?";
                    opts = ["var", "let", "const", "final"];
                }
                // CSS
                else if (text.includes("What does CSS stand for?")) {
                    text = "Як розшифровується CSS?";
                    opts = ["Creative Style Sheets", "Cascading Style Sheets", "Computer Style Sheets", "Colorful Style Sheets"];
                }
                else if (text.includes("Which property changes text color?")) {
                    text = "Яка властивість змінює колір тексту?";
                    opts = ["text-color", "color", "font-color", "fg-color"];
                }
                // Intro
                else if (text.includes("What is the first step in learning?")) {
                    text = "Який перший крок у навчанні?";
                    opts = ["Здатися", "Постійність", "Сон", "Їжа"];
                }
                else if (text.includes("True or False: We are just getting started.")) {
                    text = "Правда чи ні: Ми тільки починаємо.";
                    opts = ["Правда", "Ні"];
                }
                // Generic Topics
                else if (text.includes("What is a key concept of")) {
                    text = text.replace("What is a key concept of", "Яка ключова концепція");
                    text = text.replace("?", "?");
                    opts = ["Магія", "Логіка", "Хаос", "Удача"];
                }
                else if (text.includes("How many hours should you practice?")) {
                    text = "Скільки годин треба практикуватися?";
                    opts = ["0", "1", "10000", "Щодня"];
                }
                else if (text.includes("Basic verification: Do you understand this topic?")) {
                    text = "Базова перевірка: Ви зрозуміли цю тему?";
                    opts = ["Так", "Ні", "Не впевнений", "Що?"];
                }

                return { ...q, question: text, options: opts };
            });

            // Update
            await tasksCollection.updateOne(
                { _id: quiz._id },
                {
                    $set: {
                        name: newName,
                        description: newDesc,
                        quizData: newQuizData
                    }
                }
            );
        }

        console.log(`Translated all quizzes.`);
        client.close();
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
