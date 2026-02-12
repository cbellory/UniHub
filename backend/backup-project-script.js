const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Define paths relative to this script (which will be in backend/)
const PROJECT_ROOT = path.resolve(__dirname, '..'); // Up one level from backend/ to site_deeplom/
const BACKUP_ROOT = path.join(PROJECT_ROOT, 'backups', 'project');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_ROOT)) fs.mkdirSync(BACKUP_ROOT, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const tarName = `DeppLom_Source_${timestamp}.tar.gz`;
const tarPath = path.join(BACKUP_ROOT, tarName);

// Exclude list (tar compatible)
const excludes = [
    'node_modules',
    '.git',
    'backups',
    'dist',
    'build',
    'pm2-backend-error.log',
    'pm2-backend.log',
    '*.log',
    'admin/data', // Exclude local DB data if present
    'backend/data' // Exclude local DB data if present
];

async function run() {
    console.log('\n🚀 STARTING PROJECT BACKUP (LINUX)');
    console.log('================================');
    console.log(`📅 ID: ${timestamp}`);
    console.log(`📂 Target: ${tarPath}`);

    // Construct Tar Command
    // tar -czf <archive> --exclude=<pattern> ... <directory>

    const args = ['-czf', tarPath];

    excludes.forEach(ex => {
        args.push(`--exclude=${ex}`);
    });

    // Add directory to backup (PROJECT_ROOT) relative to where we run?
    // Be careful with absolute paths in tar. 
    // Best to run tar from one level up? 
    // Or just specify the current directory contents.

    // Let's backup the contents of PROJECT_ROOT
    args.push('-C', PROJECT_ROOT, '.');

    console.log(`Command: tar ${args.join(' ')}`);

    const proc = spawn('tar', args);

    proc.stdout.on('data', (data) => process.stdout.write(data));
    proc.stderr.on('data', (data) => process.stderr.write(data));

    proc.on('close', (code) => {
        if (code === 0) {
            console.log('\n================================');
            console.log(`🎉 SUCCESS: ${tarName}`);
            const stats = fs.statSync(tarPath);
            console.log(`📦 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        } else {
            console.error('\n❌ Backup failed with code', code);
            process.exit(1);
        }
    });

    proc.on('error', (err) => {
        console.error('\n❌ Backup process error:', err);
        process.exit(1);
    });
}

run();
