const mongoose = require('mongoose');
const Task = require('../backend/models/Task');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/walletsDB';

console.log('Connecting to:', uri);

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then(async () => {
        console.log('Connected!');

        // Find Tasks that look like quizzes
        const tasks = await Task.find({
            $or: [
                { name: { $regex: /quiz|test|тест|экзамен/i } },
                { type: 'quiz' }
            ]
        });

        console.log(`Found ${tasks.length} tasks to update.`);

        for (const task of tasks) {
            console.log(`Updating: ${task.name}`);

            let quizData = [];

            // Generate content based on name
            if (task.name.toLowerCase().includes('js') || task.name.toLowerCase().includes('javascript')) {
                quizData = [
                    {
                        question: "What is the correct way to declare a variable in ES6?",
                        options: ["var myVar;", "let myVar;", "variable myVar;", "int myVar;"],
                        correctIndex: 1
                    },
                    {
                        question: "Which symbol is used for comments in JavaScript?",
                        options: ["#", "<!-- -->", "//", "**"],
                        correctIndex: 2
                    },
                    {
                        question: "What is console.log() used for?",
                        options: ["Printing to printer", "Debugging/Printing to console", "Sending email", "Creating a log file on server"],
                        correctIndex: 1
                    }
                ];
            } else if (task.name.toLowerCase().includes('react')) {
                quizData = [
                    {
                        question: "What is a React Component?",
                        options: ["A database generic", "A function or class that returns UI", "A styling sheet", "A server-side script"],
                        correctIndex: 1
                    },
                    {
                        question: "Which hook is used for side effects?",
                        options: ["useState", "useEffect", "useContext", "useReducer"],
                        correctIndex: 1
                    }
                ];
            } else {
                // Generic Quiz
                quizData = [
                    {
                        question: "What is the primary goal of this course?",
                        options: ["To have fun", "To learn new skills", "To waste time", "None of the above"],
                        correctIndex: 1
                    },
                    {
                        question: "Is this statement true? 'Learning is a continuous process'",
                        options: ["Yes", "No", "Maybe", "I don't know"],
                        correctIndex: 0
                    }
                ];
            }

            task.type = 'quiz';
            task.quizData = quizData;
            await task.save();
            console.log(`Updated ${task.name} with ${quizData.length} questions.`);
        }

        console.log('Done.');
        process.exit(0);
    })
    .catch(err => {
        console.error('Migration failed:', err);
        process.exit(1);
    });
