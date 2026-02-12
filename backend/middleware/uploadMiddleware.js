const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Utility to ensure directory exists
 */
const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

/**
 * Factory function to create a Multer upload middleware
 * @param {string} type - 'avatar', 'task', 'content', 'submission'
 */
const createUpload = (type) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            let uploadPath = path.join(__dirname, '../uploads', 'misc'); // Fallback

            // 1. Determine Context (User ID or General)
            let entityId = 'general';

            // Try to find an identifier in this order:
            // 1. req.user.address (if authorized)
            // 2. req.params.address (if in URL)
            // 3. req.body.address (if in form-data - might be unreliable if sent after file)
            // 4. req.user.loginName (for admins)

            if (req.user && req.user.address) entityId = req.user.address;
            else if (req.params.address) entityId = req.params.address;
            else if (req.body.address) entityId = req.body.address;
            else if (req.user && req.user.loginName) entityId = req.user.loginName;

            // Sanitize ID
            entityId = entityId.replace(/[^a-zA-Z0-9_-]/g, '_');

            // 2. Build Path based on Type
            switch (type) {
                case 'avatar':
                    // /uploads/users/{ID}/avatars/
                    uploadPath = path.join(__dirname, '../uploads/users', entityId, 'avatars');
                    break;
                case 'submission':
                    // /uploads/users/{ID}/submissions/
                    uploadPath = path.join(__dirname, '../uploads/users', entityId, 'submissions');
                    break;
                case 'task':
                    // /uploads/content/tasks/
                    uploadPath = path.join(__dirname, '../uploads/content/tasks');
                    break;
                case 'badge':
                    // /uploads/content/badges/
                    uploadPath = path.join(__dirname, '../uploads/content/badges');
                    break;
                case 'diploma':
                    // /uploads/content/diplomas/
                    uploadPath = path.join(__dirname, '../uploads/content/diplomas');
                    break;
                case 'certificate':
                    // /uploads/content/certificates/
                    uploadPath = path.join(__dirname, '../uploads/content/certificates');
                    break;
                default:
                    uploadPath = path.join(__dirname, '../uploads/misc');
            }

            ensureDir(uploadPath);
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            // Timestamp + Clean Name
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
            cb(null, `${name}-${uniqueSuffix}${ext}`);
        }
    });

    return multer({
        storage: storage,
        limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
    });
};

module.exports = createUpload;
