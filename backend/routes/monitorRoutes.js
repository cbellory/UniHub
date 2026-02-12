const express = require('express');
const router = express.Router();
const os = require('os');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

// Helper to get CPU Usage
const getCpuUsage = () => {
    return new Promise((resolve) => {
        const start = os.cpus();
        setTimeout(() => {
            const end = os.cpus();

            let idleDiff = 0;
            let totalDiff = 0;

            for (let i = 0; i < start.length; i++) {
                const startCpu = start[i];
                const endCpu = end[i];

                let startTotal = 0;
                let endTotal = 0;

                for (const type in startCpu.times) startTotal += startCpu.times[type];
                for (const type in endCpu.times) endTotal += endCpu.times[type];

                idleDiff += (endCpu.times.idle - startCpu.times.idle);
                totalDiff += (endTotal - startTotal);
            }

            const usage = 100 - Math.floor((100 * idleDiff) / totalDiff);
            resolve(usage);
        }, 100); // 100ms sample
    });
};

router.get('/stats', authMiddleware, checkRole(['admin', 'superadmin']), async (req, res) => {
    try {
        const cpuUsage = await getCpuUsage();

        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memUsage = Math.floor((usedMem / totalMem) * 100);

        const stats = {
            cpu: cpuUsage,
            ram: {
                total: (totalMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                used: (usedMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                usagePercentage: memUsage
            },
            uptime: os.uptime(), // seconds
            os: `${os.type()} ${os.release()} (${os.arch()})`,
            nodeVersion: process.version,
            loadAvg: os.loadavg() // [1, 5, 15] min avg
        };

        res.json(stats);
    } catch (error) {
        console.error('Monitor Error:', error);
        res.status(500).json({ msg: 'Server Monitor Error' });
    }
});

module.exports = router;
