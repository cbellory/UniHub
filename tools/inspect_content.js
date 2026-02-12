const mongoose = require('mongoose');
require('dotenv').config({ path: '../backend/.env' });

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/walletsDB';

mongoose.connect(uri)
    .then(async () => {
        console.log('Connected to DB');

        const courses = await mongoose.connection.db.collection('courses').find({}).toArray();
        const topics = await mongoose.connection.db.collection('topics').find({}).toArray();

        // Create a map of topics for easy lookup
        const topicMap = topics.reduce((acc, t) => {
            acc[t._id.toString()] = t;
            return acc;
        }, {});

        console.log('\n--- EXISTING COURSES CONTENT ---\n');

        courses.forEach(course => {
            console.log(`COURSE: ${course.title} (ID: ${course._id})`);
            console.log(`CURRENT DESCRIPTION: ${course.description || 'N/A'}`);
            console.log('TOPICS:');
            if (course.topics && course.topics.length) {
                course.topics.forEach(tId => {
                    const topic = topicMap[tId.toString()];
                    if (topic) {
                        console.log(`  - ${topic.title}`);
                        // Optionally print task names if needed, but topic titles usually suffice for summary
                    } else {
                        console.log(`  - [Missing Topic ID: ${tId}]`);
                    }
                });
            }
            console.log('\n--------------------------------\n');
        });

        await mongoose.disconnect();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
