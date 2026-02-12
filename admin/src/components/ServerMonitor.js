import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, LinearProgress, styled } from '@mui/material';
import apiClient from '../services/apiClient';

// Styled Components for Cyberpunk look
const StatCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(0, 242, 255, 0.1)',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(0,242,255,0.5), transparent)',
    }
}));

const MetricValue = styled(Typography)(({ theme, color }) => ({
    fontFamily: '"Share Tech Mono", monospace',
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: color || '#fff',
    textShadow: `0 0 10px ${color || 'rgba(255,255,255,0.5)'}`
}));

const MonitorBar = styled(LinearProgress)(({ theme, variantColor }) => ({
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    '& .MuiLinearProgress-bar': {
        background: variantColor === 'cpu'
            ? 'linear-gradient(90deg, #00f2ff, #00C2FF)'
            : 'linear-gradient(90deg, #ff00ff, #BC13FE)',
        boxShadow: `0 0 10px ${variantColor === 'cpu' ? '#00f2ff' : '#ff00ff'}`
    }
}));

const ServerMonitor = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await apiClient.get('/admin/monitor/stats');
            setStats(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Monitor fetch fail:", error);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 3000); // 3 sec refresh
        return () => clearInterval(interval);
    }, []);

    const formatUptime = (seconds) => {
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor(seconds % (3600 * 24) / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        const s = Math.floor(seconds % 60);
        return `${d}d ${h}h ${m}m ${s}s`;
    };

    if (loading && !stats) return <CircularProgress />;

    return (
        <Box sx={{ p: 3 }} className="animate-fade-in">
            <Typography variant="h4" sx={{ mb: 4, color: '#fff', fontWeight: 'bold' }}>
                LIVE <span style={{ color: '#00f2ff' }}>SYSTEM MONITOR</span>
            </Typography>

            <Grid container spacing={3}>
                {/* CPU Usage */}
                <Grid item xs={12} md={6}>
                    <StatCard>
                        <Typography variant="h6" sx={{ color: '#aaa', mb: 2 }}>CPU LOAD</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 1 }}>
                            <MetricValue color="#00f2ff">{stats.cpu}%</MetricValue>
                            <Typography sx={{ color: '#666', fontFamily: 'monospace' }}>
                                {stats.loadAvg[0].toFixed(2)} / {stats.loadAvg[1].toFixed(2)} (Avg)
                            </Typography>
                        </Box>
                        <MonitorBar variant="determinate" value={stats.cpu} variantColor="cpu" />
                    </StatCard>
                </Grid>

                {/* RAM Usage */}
                <Grid item xs={12} md={6}>
                    <StatCard>
                        <Typography variant="h6" sx={{ color: '#aaa', mb: 2 }}>RAM USAGE</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 1 }}>
                            <MetricValue color="#ff00ff">{stats.ram.usagePercentage}%</MetricValue>
                            <Typography sx={{ color: '#666', fontFamily: 'monospace' }}>
                                {stats.ram.used} / {stats.ram.total}
                            </Typography>
                        </Box>
                        <MonitorBar variant="determinate" value={stats.ram.usagePercentage} variantColor="ram" />
                    </StatCard>
                </Grid>

                {/* System Info */}
                <Grid item xs={12} md={4}>
                    <StatCard>
                        <Typography variant="h6" sx={{ color: '#aaa', mb: 1 }}>UPTIME</Typography>
                        <Typography variant="h5" sx={{ color: '#fff', fontFamily: 'monospace' }}>
                            {formatUptime(stats.uptime)}
                        </Typography>
                    </StatCard>
                </Grid>

                <Grid item xs={12} md={4}>
                    <StatCard>
                        <Typography variant="h6" sx={{ color: '#aaa', mb: 1 }}>OS</Typography>
                        <Typography variant="body1" sx={{ color: '#fff' }}>
                            {stats.os}
                        </Typography>
                    </StatCard>
                </Grid>

                <Grid item xs={12} md={4}>
                    <StatCard>
                        <Typography variant="h6" sx={{ color: '#aaa', mb: 1 }}>NODE.JS</Typography>
                        <Typography variant="body1" sx={{ color: '#00f2ff', fontFamily: 'monospace' }}>
                            {stats.nodeVersion}
                        </Typography>
                    </StatCard>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ServerMonitor;
