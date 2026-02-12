const mongoose = require('../backend/node_modules/mongoose');
const Diploma = require('../backend/models/Diploma');
const Certificate = require('../backend/models/Certificate');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const UPLOADS_ROOT = path.join(__dirname, '../backend/uploads');
const DIPLOMAS_OLD = path.join(UPLOADS_ROOT, 'diplomas');
const DIPLOMAS_NEW = path.join(UPLOADS_ROOT, 'content', 'diplomas');
const CERTS_OLD = path.join(UPLOADS_ROOT, 'certificates');
const CERTS_NEW = path.join(UPLOADS_ROOT, 'content', 'certificates');

const moveDir = (oldPath, newPath) => {
    if (fs.existsSync(oldPath)) {
        if (!fs.existsSync(path.dirname(newPath))) fs.mkdirSync(path.dirname(newPath), { recursive: true });
        if (!fs.existsSync(newPath)) fs.mkdirSync(newPath, { recursive: true });

        const files = fs.readdirSync(oldPath);
        files.forEach(f => {
            const src = path.join(oldPath, f);
            const dest = path.join(newPath, f);
            // Check if file, not dir (though dip/cert folders shouldn't have subdirs)
            if (fs.lstatSync(src).isFile()) {
                fs.renameSync(src, dest);
            }
        });
        fs.rmdirSync(oldPath);
        console.log(`Moved ${oldPath} to ${newPath}`);
    }
};

const fixDocs = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Move Files
        moveDir(DIPLOMAS_OLD, DIPLOMAS_NEW);
        moveDir(CERTS_OLD, CERTS_NEW);

        // Update DB
        const diplomas = await Diploma.find({ 'diplomaData.imageUrl': { $regex: /^\/uploads\/diplomas\// } });
        for (const d of diplomas) {
            d.diplomaData.imageUrl = d.diplomaData.imageUrl.replace('/uploads/diplomas/', '/uploads/content/diplomas/');
            await d.save();
            console.log(`Updated diploma ${d._id}`);
        }

        const certs = await Certificate.find({ 'certificateData.imageUrl': { $regex: /^\/uploads\/certificates\// } });
        for (const c of certs) {
            c.certificateData.imageUrl = c.certificateData.imageUrl.replace('/uploads/certificates/', '/uploads/content/certificates/');
            await c.save();
            console.log(`Updated certificate ${c._id}`);
        }

        console.log('--- Migration Complete ---');
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixDocs();
