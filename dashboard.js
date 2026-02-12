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

// NEW: Git Support
const git = require('simple-git')(PROJECT_ROOT);

// --- DATABASE CONNECTION (For Admin Management) ---
// CRITICAL: Must use the SAME mongoose instance as the backend model (v5.x)
// Otherwise User model (registered on backend mongoose) won't see this connection.
const mongoose = require(path.join(BACKEND_DIR, 'node_modules', 'mongoose'));
const User = require(path.join(BACKEND_DIR, 'models', 'User.js'));

// Connect to DB using the same URI as backend (usually port 27018 for legacy-mongo)
// We'll try to read it from .env or default to 27018
const backendEnvPath = path.join(BACKEND_DIR, '.env');
let mongoUri = 'mongodb://127.0.0.1:27018/walletsDB';

if (fs.existsSync(backendEnvPath)) {
    const envContent = fs.readFileSync(backendEnvPath, 'utf8');
    const match = envContent.match(/MONGODB_URI=(.*)/);
    if (match && match[1]) mongoUri = match[1].trim();
}

mongoose.connect(mongoUri)
    .then(() => console.log('Dashboard connected to MongoDB (Admin Management Ready)'))
    .catch(err => console.error('Dashboard MongoDB Connection Error:', err));

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

// Self-Restart Endpoint
app.post('/api/restart-self', (req, res) => {
    res.json({ msg: 'Dashboard restarting...' });

    setTimeout(() => {
        // Spawn a new instance of this process
        const subprocess = spawn(process.argv[0], process.argv.slice(1), {
            detached: true,
            std: 'ignore',
            shell: true
        });
        subprocess.unref();
        process.exit();
    }, 1000);
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

// --- Config API (Setup Wizard) ---
function parseEnv(filePath) {
    if (!fs.existsSync(filePath)) return {};
    return fs.readFileSync(filePath, 'utf8').split('\n').reduce((acc, line) => {
        const [key, ...val] = line.split('=');
        if (key && val) acc[key.trim()] = val.join('=').trim();
        return acc;
    }, {});
}

function writeEnv(filePath, updates) {
    let current = {};
    if (fs.existsSync(filePath)) current = parseEnv(filePath);
    const merged = { ...current, ...updates };
    const content = Object.entries(merged).map(([k, v]) => `${k}=${v}`).join('\n');
    fs.writeFileSync(filePath, content);
}

app.get('/api/config', (req, res) => {
    try {
        const backendEnv = parseEnv(path.join(BACKEND_DIR, '.env'));
        const frontendEnv = parseEnv(path.join(FRONTEND_DIR, '.env'));

        res.json({
            backend: {
                port: backendEnv.PORT || '5555',
                mongoUri: backendEnv.MONGODB_URI || ''
            },
            frontend: {
                apiUrl: frontendEnv.REACT_APP_API_URL || '',
                walletProjectId: frontendEnv.REACT_APP_WALLET_CONNECT_PROJECT_ID || ''
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/config', (req, res) => {
    const { backend, frontend } = req.body;

    try {
        if (backend) {
            writeEnv(path.join(BACKEND_DIR, '.env'), {
                PORT: backend.port,
                MONGODB_URI: backend.mongoUri
            });
        }

        if (frontend) {
            writeEnv(path.join(FRONTEND_DIR, '.env'), {
                REACT_APP_API_URL: frontend.apiUrl,
                REACT_APP_WALLET_CONNECT_PROJECT_ID: frontend.walletProjectId
            });
        }

        res.json({ msg: 'Configuration saved. Please Restart All Systems to apply.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
app.get('/api/version', (req, res) => {
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
        res.json({ version: pkg.version || '0.0.0' });
    } catch (e) { res.json({ version: '0.0.0' }); }
});

// --- Git Control ---
app.get('/api/git-status', async (req, res) => {
    try {
        const stdout = await execPromise('git status -s');
        res.json({ output: stdout || 'Clean working directory' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/git-push', (req, res) => {
    if (processes['git']) return res.status(400).json({ msg: 'Git operation in progress' });

    let { message, bumpType } = req.body; // bumpType: 'patch', 'minor', 'major' or null

    try {
        // 1. Auto Versioning
        let version = '0.0.0';
        if (bumpType) {
            const pkgPath = path.join(PROJECT_ROOT, 'package.json');
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            const parts = (pkg.version || '0.0.0').split('.').map(Number);

            if (bumpType === 'major') { parts[0]++; parts[1] = 0; parts[2] = 0; }
            else if (bumpType === 'minor') { parts[1]++; parts[2] = 0; }
            else { parts[2]++; } // patch default

            version = parts.join('.');
            pkg.version = version;
            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
            broadcastLog('git', `Version bumped to ${version}`);
        } else {
            const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
            version = pkg.version;
        }

        // 2. Default Message
        if (!message) {
            const date = new Date().toISOString().split('T')[0];
            message = `Update v${version} (${date})`;
        }

        // 3. Chain commands
        // If bumped, we need to add package.json explicitly or just 'git add .' covers it
        const cmd = `git add . && git commit -m "${message}" && git push`;

        runCommand(cmd, PROJECT_ROOT, 'git', [], { shell: true });
        res.json({ msg: `Git Push started (v${version})...` });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/git-pull', (req, res) => {
    if (processes['git']) return res.status(400).json({ msg: 'Git operation in progress' });

    runCommand('git pull', PROJECT_ROOT, 'git', [], { shell: true });
    res.json({ msg: 'Git Pull started...' });
});

// --- Tools API ---
app.get('/api/tools', (req, res) => {
    const toolsDir = path.join(PROJECT_ROOT, 'tools');
    if (!fs.existsSync(toolsDir)) return res.json([]);
    const files = fs.readdirSync(toolsDir).filter(f => f.endsWith('.js'));
    res.json(files);
});

app.post('/api/run-tool', (req, res) => {
    const { script } = req.body;
    if (!script) return res.status(400).json({ error: 'No script specified' });

    // Security check to prevent running files outside tools/
    if (script.includes('..') || script.includes('/')) return res.status(403).json({ error: 'Invalid script path' });

    const toolsDir = path.join(PROJECT_ROOT, 'tools');
    const scriptPath = path.join(toolsDir, script);

    runCommand('node', toolsDir, 'tool-run', [scriptPath]);
    res.json({ msg: `Script ${script} started...` });
});

// --- ADMIN MANAGEMENT API ---

app.get('/api/admins', async (req, res) => {
    try {
        const admins = await User.find({}, 'loginName role');
        res.json(admins);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/create-admin', async (req, res) => {
    const { loginName, password, role } = req.body;
    if (!loginName || !password || !role) return res.status(400).json({ error: 'Missing fields' });

    try {
        const existing = await User.findOne({ loginName });
        if (existing) return res.status(400).json({ error: 'User already exists' });

        const newUser = new User({ loginName, password, role });
        await newUser.save(); // Model handles hashing

        broadcastLog('other', `New Admin Created: ${loginName} (${role})`);
        res.json({ msg: 'User created' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/delete-admin/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        broadcastLog('other', `Admin Deleted: ID ${req.params.id}`);
        res.json({ msg: 'User deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
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

app.post('/api/git/commit', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Commit message required' });
    try {
        await git.add('.');
        const result = await git.commit(message);
        broadcastLog('git', `Commit successful: ${result.summary.changes} changes`);
        res.json(result);
    } catch (error) {
        broadcastLog('git', `Commit error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// NEW: Git Branch Management
app.get('/api/git/branches', async (req, res) => {
    try {
        const branchSummary = await git.branch();
        res.json(branchSummary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/git/checkout', async (req, res) => {
    const { branch } = req.body;
    if (!branch) return res.status(400).json({ error: 'Branch name required' });
    try {
        await git.checkout(branch);
        const status = await git.status();
        broadcastLog('git', `Switched to branch: ${branch}`);
        res.json({ message: `Switched to ${branch}`, status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/git/reset', async (req, res) => {
    try {
        await git.reset('hard');
        broadcastLog('git', 'Hard reset to HEAD executed.');
        res.json({ message: 'Reset successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(uiDir, 'index.html'));
});

const PORT = 9999;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Control Center running at http://localhost:${PORT}`);
});
