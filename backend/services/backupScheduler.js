const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Removed node-cron to avoid installation issues. 
// Using setInterval instead.

const HISTORY_FILE = path.join(__dirname, '..', 'data', 'backup_history.json');
const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data dir
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Load history
let history = [];
if (fs.existsSync(HISTORY_FILE)) {
    try {
        history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    } catch (e) {
        history = [];
    }
}

function saveHistory() {
    // Keep only last 50 entries
    if (history.length > 50) history = history.slice(0, 50);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

// Clean log output to remove progress bars and noise
function cleanLog(output) {
    if (!output) return '';

    // Split by newlines (handling \r as well)
    // Replace \r with \n for simpler splitting, or just split by [\r\n]+
    const lines = output.split(/[\r\n]+/);

    // Filter noise
    const cleanLines = lines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        // Exclude lines with progress bars characters usually used [██░░]
        if (trimmed.includes('█') || trimmed.includes('░') || (trimmed.startsWith('[') && trimmed.includes('%'))) {
            return false;
        }
        return true;
    });

    // Valid lines usually contain "Success", "Created", "Error", paths
    // If empty, fallback to raw truncate
    if (cleanLines.length === 0) return output.slice(-100);

    // Join distinct lines
    return [...new Set(cleanLines)].join(' | ').slice(0, 200);
}

function runScript(scriptName, type) {
    return new Promise((resolve) => {
        const scriptPath = path.join(__dirname, '..', scriptName);
        console.log(`[BackupScheduler] Starting ${type} backup...`);

        const startTime = Date.now();
        // Use node executable path to be safe, or just 'node'
        const proc = spawn('node', [scriptPath], { shell: true });

        let output = '';

        proc.stdout.on('data', (data) => { output += data.toString(); });
        proc.stderr.on('data', (data) => { output += data.toString(); });

        proc.on('close', (code) => {
            const duration = Date.now() - startTime;
            const success = code === 0;

            console.log(`[BackupScheduler] ${type} finished. Success: ${success}`);

            const entry = {
                id: Date.now(),
                type,
                timestamp: new Date().toISOString(),
                success,
                duration,
                logs: cleanLog(output) // Use cleaned logs
            };

            history.unshift(entry); // Add to top
            saveHistory();
            resolve(success);
        });
    });
}

const BackupScheduler = {
    init: () => {
        console.log('[BackupScheduler] Initialized. Schedule: Every 4 hours.');

        // Schedule: Every 4 hours = 4 * 60 * 60 * 1000 ms
        const INTERVAL_MS = 4 * 60 * 60 * 1000;

        setInterval(async () => {
            console.log('[BackupScheduler] Triggering automatic backups...');

            // Run DB Backup
            await runScript('backup-db-script.js', 'database');

            // Run Project Backup (sequential)
            await runScript('backup-project-script.js', 'project');

        }, INTERVAL_MS);
    },

    getHistory: () => history,

    triggerNow: async (type) => {
        if (type === 'db') return await runScript('backup-db-script.js', 'database');
        if (type === 'project') return await runScript('backup-project-script.js', 'project');
    },

    getDbBackups: () => {
        const dbBackupDir = path.join(PROJECT_ROOT, 'backups', 'db'); // defined below, but PROJECT_ROOT is not defined in this file scope.
        // Wait, PROJECT_ROOT was not defined in the original file. Let's look at lines 8-9.
        // const DATA_DIR = path.join(__dirname, '..', 'data');
        // So root is path.join(__dirname, '..')

        const rootDir = path.join(__dirname, '..');
        const dbBackupPath = path.join(rootDir, 'backups', 'db');

        if (!fs.existsSync(dbBackupPath)) return [];

        try {
            const files = fs.readdirSync(dbBackupPath).filter(file => {
                return fs.statSync(path.join(dbBackupPath, file)).isDirectory() && file.startsWith('backup_');
            });
            // Sort new to old
            return files.sort().reverse();
        } catch (e) {
            console.error('Error listing backups:', e);
            return [];
        }
    },

    restoreDb: async (folderName) => {
        return await new Promise((resolve) => {
            const scriptPath = path.join(__dirname, '..', 'restore-db-script.js');
            console.log(`[BackupScheduler] Starting DB Restore from ${folderName}...`);

            const startTime = Date.now();
            // Pass folderName as argument
            const proc = spawn('node', [scriptPath, folderName], { shell: true });

            let output = '';

            proc.stdout.on('data', (data) => { output += data.toString(); });
            proc.stderr.on('data', (data) => { output += data.toString(); });

            proc.on('close', (code) => {
                const duration = Date.now() - startTime;
                const success = code === 0;

                console.log(`[BackupScheduler] Restore DB finished. Success: ${success}`);

                const entry = {
                    id: Date.now(),
                    type: 'restore-db',
                    timestamp: new Date().toISOString(),
                    success,
                    duration,
                    details: folderName,
                    logs: cleanLog(output)
                };

                history.unshift(entry);
                saveHistory();
                resolve({ success, logs: output });
            });
        });
    }
};

module.exports = BackupScheduler;
