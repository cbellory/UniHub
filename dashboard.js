const express = require('express');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
const os = require('os');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PROJECT_ROOT = path.resolve(__dirname);
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend');
const ADMIN_DIR = path.join(PROJECT_ROOT, 'admin');

const uiDir = path.join(__dirname, 'dashboard_ui');
if (!fs.existsSync(uiDir)) fs.mkdirSync(uiDir);

app.use(express.static(uiDir));
app.use(express.json());

let processes = {};

// Cross-platform process killer
const killProcess = (pid) => {
    if (!pid) return;
    const isWin = process.platform === 'win32';
    try {
        if (isWin) {
            exec(`taskkill /F /T /PID ${pid}`);
        } else {
            try {
                process.kill(pid, 'SIGKILL');
            } catch (e) {
                console.error(`Failed to kill process ${pid}:`, e);
            }
        }
    } catch (err) {
        console.error(`Error killing process ${pid}:`, err);
    }
};

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

function broadcastLog(type, data) {
    let str = data.toString();
    const msg = JSON.stringify({ type, data: str });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(msg);
        }
    });
}

function broadcastStatus(id, isRunning) {
    const msg = JSON.stringify({ type: 'status', id, isRunning });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) client.send(msg);
    });
}

function runCommand(command, cwd, id, args = [], options = {}) {
    broadcastLog(id, `> Executing: ${command} ${args.join(' ')}`);
    broadcastStatus(id, true);

    const proc = spawn(command, args, {
        cwd,
        shell: true,
        env: { ...process.env, FORCE_COLOR: '1' },
        ...options
    });
    processes[id] = proc;

    proc.stdout.on('data', (data) => broadcastLog(id, data));
    proc.stderr.on('data', (data) => broadcastLog(id, data));

    proc.on('close', (code) => {
        broadcastLog(id, `Process exited with code ${code}`);
        broadcastStatus(id, false);
        delete processes[id];
    });

    proc.on('error', (err) => {
        broadcastLog(id, `Failed to start process: ${err.message}`);
        broadcastStatus(id, false);
        delete processes[id];
    });
}

function checkSystemStatus(client) {
    const isWin = process.platform === 'win32';
    if (isWin) return;

    // Check PM2 (Backend)
    exec('pm2 jlist', (err, stdout) => {
        if (!err) {
            try {
                const list = JSON.parse(stdout);
                const backend = list.find(p => p.name === 'backend');
                const isRunning = backend && backend.pm2_env.status === 'online';
                // Send status for 'backend'
                client.send(JSON.stringify({ type: 'status', id: 'backend', isRunning }));
            } catch (e) { }
        }
    });

    // Check Docker (DB)
    exec('docker inspect -f "{{.State.Running}}" legacy-mongo', (err, stdout) => {
        const isRunning = !err && stdout.trim() === 'true';
        // Send status for 'db-start'
        client.send(JSON.stringify({ type: 'status', id: 'db-start', isRunning }));
    });
}

// Websocket Connection
wss.on('connection', (ws) => {
    // Send current in-memory process status first
    Object.keys(processes).forEach(id => {
        ws.send(JSON.stringify({ type: 'status', id, isRunning: true }));
    });

    // Check external system status (PM2/Docker)
    checkSystemStatus(ws);
});


// --- API ENDPOINTS ---

app.get('/api/ip', (req, res) => res.json({ ip: getLocalIP() }));

// 6. Repair DB
app.post('/api/repair-db', (req, res) => {
    const isWin = process.platform === 'win32';
    if (isWin) {
        const repair = spawn('cmd.exe', ['/c', path.join(__dirname, 'legacy_scripts', 'REPAIR_DB.bat')]);
        repair.stdout.on('data', (data) => broadcastLog('repair', data));
    } else {
        const repairScript = path.join(__dirname, 'tools', 'repair_indices.js');
        runCommand('node', __dirname, 'repair', [repairScript]);
    }
    res.json({ status: 'started' });
});

// 7. Start DB Safe
app.post('/api/start-db', (req, res) => {
    const isWin = process.platform === 'win32';
    if (isWin) {
        spawn('cmd.exe', ['/c', path.join(__dirname, 'legacy_scripts', 'SAFE_DB_START.bat')], { detached: true });
        res.json({ status: 'started' });
    } else {
        // Linux: Docker Container for Legacy Mongo
        broadcastLog('db', 'Starting MongoDB (Docker: legacy-mongo)...');
        exec('docker start legacy-mongo', (err, stdout, stderr) => {
            if (err) {
                if (stderr && stderr.includes('No such container')) {
                    broadcastLog('db', 'Container not found, creating new one...');
                    exec('docker run -d --name legacy-mongo -v /home/orangepi/site_deeplom/admin/data/db:/data/db -p 27018:27017 mongo:latest', (e, out, serr) => {
                        if (e) broadcastLog('db', `Error creating DB: ${e.message}`);
                        else {
                            broadcastLog('db', 'Database Container Created & Started.');
                            broadcastStatus('db-start', true);
                        }
                    });
                } else {
                    broadcastLog('db', `Error starting DB: ${stderr || err.message}`);
                }
            } else {
                broadcastLog('db', 'Database Server Started (Docker).');
                broadcastStatus('db-start', true);
            }
        });
        res.json({ status: 'started' });
    }
});

// 9. Start Production (DB + Backend only)
app.post('/api/start-prod', (req, res) => {
    broadcastLog('other', '🚀 Initializing PRODUCTION Start...');

    // 1. Start DB
    const isWin = process.platform === 'win32';
    if (isWin) {
        spawn('cmd.exe', ['/c', path.join(__dirname, 'legacy_scripts', 'SAFE_DB_START.bat')], { detached: true });
    } else {
        exec('docker start legacy-mongo', (err) => {
            if (!err) broadcastLog('db', 'MongoDB Container Started.');
        });
    }

    // 2. Start Backend (PM2)
    setTimeout(() => {
        if (isWin) {
            const cmd = 'npm.cmd';
            const backend = spawn(cmd, ['start'], { cwd: path.join(__dirname, 'backend'), shell: true });
            processes['backend'] = backend;
        } else {
            broadcastLog('backend', 'Starting Backend via PM2...');
            exec('pm2 start server.js --name "backend" --cwd ./backend --output /home/orangepi/site_deeplom/pm2-backend.log --error /home/orangepi/site_deeplom/pm2-backend-error.log', (err, stdout, stderr) => {
                if (err) broadcastLog('backend', `PM2 Start Error: ${stderr}`);
                else {
                    broadcastLog('backend', 'Backend started (Production Mode).');
                    broadcastStatus('backend', true);
                    exec('pm2 save');
                }
            });
        }
    }, 2000);

    res.json({ status: 'started' });
});

// 10. Start Dev Mode (Legacy Start All)
app.post('/api/start-dev', (req, res) => {
    broadcastLog('other', '🛠️ Initializing DEV Start (Localhost)...');
    const isWin = process.platform === 'win32';

    // START DB
    if (isWin) {
        spawn('cmd.exe', ['/c', path.join(__dirname, 'legacy_scripts', 'SAFE_DB_START.bat')], { detached: true });
    } else {
        exec('docker start legacy-mongo', (err) => {
            if (!err) broadcastLog('db', 'MongoDB Container Started.');
        });
    }

    // 2. Start Backend (PM2)
    setTimeout(() => {
        if (isWin) {
            const cmd = 'npm.cmd';
            const backend = spawn(cmd, ['start'], { cwd: path.join(__dirname, 'backend'), shell: true });
            processes['backend'] = backend;
        } else {
            broadcastLog('backend', 'Starting Backend via PM2...');
            exec('pm2 start server.js --name "backend" --cwd ./backend --output /home/orangepi/site_deeplom/pm2-backend.log --error /home/orangepi/site_deeplom/pm2-backend-error.log', (err, stdout, stderr) => {
                if (err) broadcastLog('backend', `PM2 Start Error: ${stderr}`);
                else {
                    broadcastLog('backend', 'Backend started.');
                    broadcastStatus('backend', true);
                }
            });
        }
    }, 3000);

    // 3. Start Frontend (Dev Server)
    setTimeout(() => {
        if (!processes['frontend']) {
            const cmd = isWin ? 'npm.cmd' : 'npm';
            const frontend = spawn(cmd, ['start'], {
                cwd: path.join(__dirname, 'frontend'),
                shell: true
            });
            processes['frontend'] = frontend;
            broadcastLog('other', 'Starting Frontend (Dev Server)...');
            frontend.stdout.on('data', (d) => broadcastLog('other', `[Frontend] ${d}`));
        }
    }, 7000);

    // 4. Start Admin (Dev Server)
    setTimeout(() => {
        if (!processes['admin']) {
            const cmd = isWin ? 'npm.cmd' : 'npm';
            const admin = spawn(cmd, ['start'], {
                cwd: path.join(__dirname, 'admin'),
                shell: true
            });
            processes['admin'] = admin;
            broadcastLog('other', 'Starting Admin Panel (Dev Server)...');
            admin.stdout.on('data', (d) => broadcastLog('other', `[Admin] ${d}`));
        }
    }, 12000);

    res.json({ status: 'started' });
});


// Backend Control
app.post('/api/start-backend', (req, res) => {
    const isWin = process.platform === 'win32';
    if (isWin) {
        if (processes['backend']) return res.json({ status: 'running', message: 'Backend already running' });
        const cmd = 'npm.cmd';
        const backend = spawn(cmd, ['start'], { cwd: path.join(__dirname, 'backend'), shell: true, detached: true });
        processes['backend'] = backend;
        broadcastStatus('backend', true);
        res.json({ status: 'started' });
    } else {
        // Linux: PM2
        exec('pm2 start server.js --name "backend" --cwd ./backend --output /home/orangepi/site_deeplom/pm2-backend.log --error /home/orangepi/site_deeplom/pm2-backend-error.log', (err, stdout, stderr) => {
            if (err) {
                broadcastLog('backend', `PM2 Error: ${stderr}`);
                res.status(500).json({ error: 'Failed to start PM2' });
            } else {
                broadcastLog('backend', 'Backend started with PM2');
                broadcastStatus('backend', true);
                exec('pm2 save');
                res.json({ status: 'started' });
            }
        });
    }
});

app.post('/api/stop-backend', (req, res) => {
    const isWin = process.platform === 'win32';
    if (isWin) {
        if (processes['backend']) {
            killProcess(processes['backend'].pid);
            delete processes['backend'];
            broadcastStatus('backend', false);
            res.json({ status: 'stopped' });
        } else {
            res.status(400).json({ status: 'error', message: 'Backend not running (win)' });
        }
    } else {
        // Linux: PM2 Stop
        exec('pm2 stop backend', (err, stdout) => {
            if (err) broadcastLog('backend', 'PM2 Stop Error (maybe not running?)');
            else broadcastLog('backend', 'Backend stopped via PM2');

            broadcastStatus('backend', false);
            res.json({ status: 'stopped' });
        });
    }
});

app.post('/api/restart-backend', (req, res) => {
    const isWin = process.platform === 'win32';
    if (isWin) {
        if (processes['backend']) { killProcess(processes['backend'].pid); delete processes['backend']; broadcastStatus('backend', false); }
        setTimeout(() => { }, 2000);
        res.json({ msg: 'Restarting (Windows)...' });
    } else {
        // Linux: PM2 Restart
        exec('pm2 restart backend', (err, stdout) => {
            if (err) {
                exec('pm2 start server.js --name "backend" --cwd ./backend', (e) => {
                    if (e) broadcastLog('backend', 'Failed to restart/start backend');
                    else broadcastStatus('backend', true);
                });
            } else {
                broadcastLog('backend', 'Backend successfully restarted via PM2');
                broadcastStatus('backend', true);
            }
        });
        res.json({ msg: 'Restart initiated (PM2)' });
    }
});

// Build Tools
app.post('/api/build-frontend', (req, res) => {
    const isWin = process.platform === 'win32';
    const cmd = isWin ? 'npm.cmd' : 'npm';
    runCommand(cmd, FRONTEND_DIR, 'frontend-build', ['run', 'build']);
    res.json({ msg: 'Frontend build started' });
});

app.post('/api/build-admin', (req, res) => {
    const isWin = process.platform === 'win32';
    const cmd = isWin ? 'npm.cmd' : 'npm';
    runCommand(cmd, ADMIN_DIR, 'admin-build', ['run', 'build']);
    res.json({ msg: 'Admin build started' });
});

// Backups & Restore
app.post('/api/backup-db', (req, res) => {
    if (processes['backup-db']) return res.status(400).json({ msg: 'Backup already in progress' });
    const backupScript = path.join(BACKEND_DIR, 'backup-db-script.js');
    runCommand('node', BACKEND_DIR, 'backup-db', [backupScript]);
    res.json({ msg: 'Database backup started...' });
});

app.post('/api/backup-project', (req, res) => {
    if (processes['backup-project']) return res.status(400).json({ msg: 'Backup already in progress' });
    const backupScript = path.join(BACKEND_DIR, 'backup-project-script.js');
    runCommand('node', BACKEND_DIR, 'backup-project', [backupScript]);
    res.json({ msg: 'Project backup started...' });
});

app.get('/api/get-db-backups', (req, res) => {
    const dbBackupDir = path.join(PROJECT_ROOT, 'backups', 'db');
    if (!fs.existsSync(dbBackupDir)) return res.json([]);
    const backups = fs.readdirSync(dbBackupDir)
        .filter(f => fs.statSync(path.join(dbBackupDir, f)).isDirectory() && f.startsWith('backup_'))
        .sort().reverse();
    res.json(backups);
});

app.post('/api/restore-db', (req, res) => {
    const { folder } = req.body;
    if (processes['restore-db']) return res.status(400).json({ msg: 'Restore already in progress' });
    if (!folder) return res.status(400).json({ msg: 'No backup folder specified' });
    const restoreScript = path.join(BACKEND_DIR, 'restore-db-script.js');
    runCommand('node', BACKEND_DIR, 'restore-db', [restoreScript, folder]);
    res.json({ msg: 'Database restore started...' });
});

app.post('/api/hard-reset-db', (req, res) => {
    const isWin = process.platform === 'win32';
    if (isWin) {
        spawn('cmd.exe', ['/c', path.join(__dirname, 'legacy_scripts', 'HARD_RESET_DB.bat')]);
    } else {
        broadcastLog('other', 'Hard Reset: Dropping database "walletsDB"...');
        exec('mongosh walletsDB --eval "db.dropDatabase()"', (error, stdout, stderr) => {
            if (error) broadcastLog('other', `Error dropping DB: ${stderr || error.message}`);
            else broadcastLog('other', 'Database dropped successfully.');
        });
    }
    res.json({ status: 'started' });
});

// Shutdown Endpoint
app.post('/api/shutdown', (req, res) => {
    res.json({ msg: 'Dashboard shutting down...' });

    // Graceful exit
    setTimeout(() => {
        // Kill all tracked child processes
        Object.keys(processes).forEach(id => {
            const proc = processes[id];
            if (proc && !proc.killed) killProcess(proc.pid);
        });
        process.exit(0);
    }, 1000);
});

// --- Global Control Endpoints ---

// Helper: Check if Port is Open (for DB Readiness)
function waitForPort(port, host = '127.0.0.1', timeout = 10000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
            const socket = new require('net').Socket();
            socket.setTimeout(500);
            socket.on('connect', () => {
                socket.destroy();
                resolve(true);
            });
            socket.on('timeout', () => {
                socket.destroy();
                if (Date.now() - start > timeout) reject(new Error('Timeout'));
                else setTimeout(check, 500);
            });
            socket.on('error', (err) => {
                socket.destroy();
                if (Date.now() - start > timeout) reject(err);
                else setTimeout(check, 500);
            });
            socket.connect(port, host);
        };
        check();
    });
}

// Helper: Promisified Exec
function execPromise(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (err, stdout, stderr) => {
            if (err) reject({ err, stderr });
            else resolve(stdout);
        });
    });
}

app.post('/api/stop-all', async (req, res) => {
    broadcastLog('other', '🛑 STOPPING SERVICES (SAFE MODE)...');

    // Windows Logic (Simplified)
    if (process.platform === 'win32') {
        ['backend', 'frontend', 'admin'].forEach(id => {
            if (processes[id]) {
                killProcess(processes[id].pid);
                delete processes[id];
            }
        });
        broadcastLog('other', 'Services Stopped.');
        return res.json({ status: 'stopped' });
    }

    // Linux Logic: Sequential Shutdown
    try {
        // 1. Stop Apps First (Backend, Admin, Frontend)
        broadcastLog('other', '1. Stopping Applications...');
        try {
            await execPromise('pm2 stop backend admin frontend');
            broadcastLog('other', '✓ Applications Stopped.');
            broadcastStatus('backend', false);
            broadcastStatus('admin', false);
            broadcastStatus('frontend', false);
        } catch (e) {
            broadcastLog('other', `! Warning stopping apps: ${e.message}`);
        }

        // 2. Wait a moment for graceful cleanup
        await new Promise(r => setTimeout(r, 1000));

        // 3. Stop Database
        broadcastLog('other', '2. Stopping Database...');
        await execPromise('docker stop legacy-mongo');
        broadcastLog('db', '✓ Database Stopped.');
        broadcastStatus('db-start', false);

        broadcastLog('other', '✅ SYSTEM OFF (SAFE SHUTDOWN COMPLETE)');
        res.json({ status: 'stopped' });

    } catch (err) {
        broadcastLog('other', `❌ Error during shutdown: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/start-all', async (req, res) => {
    broadcastLog('other', '🚀 STARTING SERVICES (SAFE MODE)...');

    if (process.platform === 'win32') return res.json({ msg: 'Win32 safe start not implemented' });

    try {
        // 1. Start Database
        broadcastLog('other', '1. Starting Database...');
        try {
            await execPromise('docker start legacy-mongo');
            broadcastLog('db', '✓ Container Triggered.');
        } catch (e) {
            broadcastLog('db', `! Warning starting DB: ${e.message}`);
        }

        // 2. Wait for DB Port Readiness (27017)
        broadcastLog('other', '⏳ Waiting for Database Connection...');
        try {
            // Check Docker internal port mappings usually map to localhost:27018 based on previous artifacts, 
            // but let's check 27018 since line 169 says "-p 27018:27017"
            await waitForPort(27018);
            broadcastLog('db', '✓ Database is Charging & Ready!');
            broadcastStatus('db-start', true);
        } catch (e) {
            broadcastLog('other', '⚠️ DB Timeout, proceeding anyway...');
        }

        // 3. Start Apps
        broadcastLog('other', '3. Starting Applications...');
        await execPromise('pm2 start backend admin frontend');

        broadcastLog('other', '✅ SYSTEM ONLINE');
        broadcastStatus('backend', true);
        broadcastStatus('admin', true);
        broadcastStatus('frontend', true);

        res.json({ status: 'started' });

    } catch (err) {
        broadcastLog('other', `❌ Error during startup: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(uiDir, 'index.html'));
});

const PORT = 9999;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Control Center running at http://localhost:${PORT}`);
});
