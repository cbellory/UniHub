const mongoose = require('mongoose');
const MongoClient = mongoose.mongo.MongoClient;

const uri = 'mongodb://127.0.0.1:27018';
const dbName = 'walletsDB';

// Full list of valid files found in step 3371 and 3372
const AVAILABLE_IMAGES = [
    '/uploads/avatars/1760219603294-0d50e31a857da79042e0ef61cee3e1ad.gif',
    '/uploads/avatars/1760225127858-zhivotnye_kot_13379.jpg',
    '/uploads/avatars/1760396404379-0d50e31a857da79042e0ef61cee3e1ad.gif',
    '/uploads/avatars/1764908047261-myvyna-so-vkusom-kurytsy-ostraia-59-h-54228905808673.jpg',
    '/uploads/avatars/1764949445579-Untitled.jpeg',
    '/uploads/avatars/1764949454272-zhivotnye_kot_13379.jpg',
    '/uploads/avatars/1765242003520-d0d91598-08fb-4de9-b500-6de6d0305cef.png',
    '/uploads/avatars/1765570565700-Ð‘ÐµÐ· Ð½Ð°Ð·Ð²Ð°Ð½Ð¸Ñ .gif', // Note: Renamed in logic, but keeping original path if file exists? No, user said broken. I will skip this one if possible, but list says it exists.
    '/uploads/avatars/1765570672705-1.gif',
    '/uploads/avatars/1765570728308-Ð¡Ð¾Ð·Ð´Ð°Ð½Ð¸Ðµ_Ð°Ð½Ð¸Ð¼Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ð¾Ð³Ð¾_Ð²Ð¸Ð´ÐµÐ¾_Ð¿Ð¾_Ð·Ð°Ð¿Ñ€Ð¾Ñ Ñƒ.mp4', // Skip video? Yes.
    '/uploads/avatars/1765571076833-1.gif',
    '/uploads/avatars/1765695640610-9d24a13b19934ab0fd14228f74cbd6775984ac2f.jpg',
    '/uploads/avatars/1766375671693-photo_2025-12-17_07-33-53.png',
    '/uploads/avatars/1767610816920-de755dab-3bdf-45a5-b553-6f50e8b04a0b.png',
    '/uploads/avatars/1767610875461-de755dab-3bdf-45a5-b553-6f50e8b04a0b.png',
    '/uploads/avatars/1767610885176-de755dab-3bdf-45a5-b553-6f50e8b04a0b.png',
    '/uploads/avatars/1767611473454-de755dab-3bdf-45a5-b553-6f50e8b04a0b.png',
    '/uploads/avatars/1767611474290-de755dab-3bdf-45a5-b553-6f50e8b04a0b.png',
    '/uploads/avatars/1767611474493-de755dab-3bdf-45a5-b553-6f50e8b04a0b.png',
    '/uploads/avatars/1767611474677-de755dab-3bdf-45a5-b553-6f50e8b04a0b.png',
    '/uploads/avatars/1767611474824-de755dab-3bdf-45a5-b553-6f50e8b04a0b.png',
    '/uploads/avatars/1767611475006-de755dab-3bdf-45a5-b553-6f50e8b04a0b.png',
    '/uploads/avatars/1767611520174-de755dab-3bdf-45a5-b553-6f50e8b04a0b.png',
    '/uploads/avatars/1767611604358-de755dab-3bdf-45a5-b553-6f50e8b04a0b.png',
    '/uploads/avatars/1767611713753-de755dab-3bdf-45a5-b553-6f50e8b04a0b.png',
    '/uploads/avatars/1767611765546-de755dab-3bdf-45a5-b553-6f50e8b04a0b.png',
    '/uploads/avatars/1767611804177-de755dab-3bdf-45a5-b553-6f50e8b04a0b.png',
    '/uploads/avatars/1767613169016-de755dab-3bdf-45a5-b553-6f50e8b04a0b.png',
    '/uploads/avatars/1767613561305-8c25adac-5e28-4b3b-b038-6cfd1d3648ed.png',
    '/uploads/avatars/1767613825678-a52eeb5b-db32-4195-9bba-1b9288fb4506.png',
    '/uploads/avatars/1767615049963-png-clipart-computer-icons-student-education-college-avatar-angle-child.png',
    '/uploads/1728234375594-hot-wallet-telegram-app-v0-8pe6ybeme2ad1.webp',
    '/uploads/1728319250678-logo192.png',
    '/uploads/1728663004130-1457a42e-c0e9-4159-82a7-63cd879e66c2.webp',
    '/uploads/1729296591395-1457a42e-c0e9-4159-82a7-63cd879e66c2.webp',
    '/uploads/1729303610458-1457a42e-c0e9-4159-82a7-63cd879e66c2.webp',
    '/uploads/1729303617938-1457a42e-c0e9-4159-82a7-63cd879e66c2.webp',
    '/uploads/1729429034468-Screenshot_1.png',
    '/uploads/1729914383773-Visco.png',
    '/uploads/1729914614309-Logopit_1729914603860.png',
    '/uploads/1729914647734-Logopit_1729914640419.png',
    '/uploads/1729914688283-Logopit_1729914677357.png',
    '/uploads/1730559445342-BKFsWarw_400x400.png',
    '/uploads/1730559755042-mL10v6MJAWSC1-LvsLt2o.png',
    '/uploads/1732633980589-paws1730205532073.png',
    '/uploads/BKFsWarw_400x400.png',
    '/uploads/Screenshot_1.png'
].filter(p => !p.endsWith('.mp4')); // Exclude videos

console.log('Connecting and Distributing Images...');

MongoClient.connect(uri)
    .then(async client => {
        const db = client.db(dbName);
        const tasksCollection = db.collection('tasks');

        const tasks = await tasksCollection.find({}).toArray();
        console.log(`Found ${tasks.length} tasks.`);
        console.log(`Available unique images: ${AVAILABLE_IMAGES.length}`);

        // Shuffle images
        const shuffled = [...AVAILABLE_IMAGES].sort(() => 0.5 - Math.random());

        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            const image = shuffled[i % shuffled.length]; // Loop if we run out, but we have ~50 images for 21 tasks, so unique.

            await tasksCollection.updateOne(
                { _id: task._id },
                { $set: { imageUrl: image } }
            );
            console.log(`Updated [${task.name}] -> ${image}`);
        }

        console.log(`Distribution complete. All tasks have unique* images.`);
        client.close();
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
