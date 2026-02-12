const express = require('express');
const router = express.Router();
const BackupScheduler = require('../services/backupScheduler');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

// Get backup history
// Only admins should see this
router.get('/history', authMiddleware, checkRole(['admin', 'superadmin']), (req, res) => {
    res.json(BackupScheduler.getHistory());
});

// Manual trigger
router.post('/trigger', authMiddleware, checkRole(['admin', 'superadmin']), async (req, res) => {
    const { type } = req.body; // 'db' or 'project'
    if (!type) return res.status(400).json({ msg: 'Type required' });

    // Non-blocking trigger (or blocking? Let's make it blocking for clear feedback in UI, or async if slow)
    // Backups can be slow. Let's return "Started" and let UI poll history.

    BackupScheduler.triggerNow(type); // Fire and forget (it updates history)

    res.json({ msg: `Backup (${type}) started.` });
});

// List available DB backups
router.get('/list', authMiddleware, checkRole(['admin', 'superadmin']), (req, res) => {
    const backups = BackupScheduler.getDbBackups();
    res.json(backups);
});

// Restore DB
router.post('/restore', authMiddleware, checkRole(['admin', 'superadmin']), async (req, res) => {
    const { folderName } = req.body;
    if (!folderName) return res.status(400).json({ msg: 'Folder Name required' });

    // This is a destructive operation.
    // It is blocking so we can return the result log.

    try {
        const result = await BackupScheduler.restoreDb(folderName);
        if (result.success) {
            res.json({ msg: 'Restore successful', logs: result.logs });
        } else {
            res.status(500).json({ msg: 'Restore failed', logs: result.logs });
        }
    } catch (e) {
        res.status(500).json({ msg: 'Restore error', error: e.message });
    }
});

module.exports = router;
