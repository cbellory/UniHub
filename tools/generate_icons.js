const mongoose = require('mongoose');
const MongoClient = mongoose.mongo.MongoClient;
const fs = require('fs');
const path = require('path');

const uri = 'mongodb://127.0.0.1:27018';
const dbName = 'walletsDB';
const UPLOADS_DIR = path.join(__dirname, '../backend/uploads/icons');

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Helper to generate SVG content
function generateSVG(name, type, index) {
    const colors = [
        ['#4F46E5', '#818CF8'], // Indigo
        ['#2563EB', '#60A5FA'], // Blue
        ['#059669', '#34D399'], // Emerald
        ['#D97706', '#FBBF24'], // Amber
        ['#DC2626', '#F87171'], // Red
        ['#7C3AED', '#A78BFA'], // Violet
        ['#DB2777', '#F472B6']  // Pink
    ];

    // Pick color based on task name hash or type
    let colorIdx = 0;
    if (name.toLowerCase().includes('aws')) colorIdx = 3; // Amber/Orange
    else if (name.toLowerCase().includes('sql')) colorIdx = 1; // Blue
    else if (name.toLowerCase().includes('quiz')) colorIdx = 5; // Violet
    else if (type === 'quiz') colorIdx = 6; // Pink
    else colorIdx = index % colors.length;

    const [c1, c2] = colors[colorIdx];

    // Get Initials (max 2 chars)
    const initials = name.replace(/[^a-zA-Z0-9\s]/g, '').split(' ')
        .filter(w => w.length > 0)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('');

    return `
<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${c2};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" rx="40" ry="40" fill="url(#grad${index})" />
  <circle cx="200" cy="200" r="140" fill="rgba(255,255,255,0.2)" />
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="120" fill="white">
    ${initials}
  </text>
  <text x="50%" y="85%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.8)">
    ${type.toUpperCase()}
  </text>
</svg>
`.trim();
}

console.log('Connecting and Generating Search Icons...');

MongoClient.connect(uri)
    .then(async client => {
        const db = client.db(dbName);
        const tasksCollection = db.collection('tasks');

        const tasks = await tasksCollection.find({}).toArray();
        console.log(`Found ${tasks.length} tasks.`);

        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            const svgContent = generateSVG(task.name, task.type || 'task', i);
            const fileName = `icon-${task._id}.svg`;
            const filePath = path.join(UPLOADS_DIR, fileName);

            fs.writeFileSync(filePath, svgContent);

            const webPath = `/uploads/icons/${fileName}`;

            await tasksCollection.updateOne(
                { _id: task._id },
                { $set: { imageUrl: webPath } }
            );
            console.log(`Generated and updated: ${task.name} -> ${webPath}`);
        }

        console.log(`All icons generated.`);
        client.close();
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
