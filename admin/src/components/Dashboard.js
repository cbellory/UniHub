import React, { useEffect, useState } from 'react';
import {
    Box, Grid, Paper, Typography, CircularProgress,
    Avatar, List, ListItem, ListItemAvatar, ListItemText,
    LinearProgress, Chip, Divider
} from '@mui/material';
import {
    People, Assignment, TrendingUp, Warning,
    EmojiEvents, ArrowUpward, AccessTime
} from '@mui/icons-material';

import * as dashboardApi from '../services/dashboardApi';
import LineChart from './Charts/LineChart';
import PieChart from './Charts/PieChart';

const StatCard = ({ title, value, icon, color, subtext }) => (
    <Paper className="glass-panel" sx={{ p: 3, height: '100%', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>{title}</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', my: 1, color: '#fff' }}>{value}</Typography>
            {subtext && <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{subtext}</Typography>}
        </Box>
        <Box sx={{
            position: 'absolute', right: -20, bottom: -20,
            color: color, opacity: 0.15, transform: 'rotate(-15deg)'
        }}>
            {React.cloneElement(icon, { sx: { fontSize: 120 } })}
        </Box>
    </Paper>
);

// ... imports



// ... StatCard component (keep as is or improve)

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [performance, setPerformance] = useState(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const s = await dashboardApi.getDashboardStats();
                setStats(s.stats);

                const p = await dashboardApi.getPerformanceMetrics();
                setPerformance(p);

                const a = await dashboardApi.getActivityChart();
                setActivity(a);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;

    // Prepare Chart Data
    const activityData = activity.map(a => a.count);
    const activityLabels = activity.map(a => a._id.slice(5)); // Remove year

    const debtorCount = performance?.debtors?.length || 0;
    const totalStudents = stats?.students || 0;
    const goodStudents = Math.max(0, totalStudents - debtorCount);

    const performanceData = [
        { label: 'Успішні', value: goodStudents, color: '#10b981' },
        { label: 'Боржники', value: debtorCount, color: '#ef4444' }
    ];

    return (
        <Box className="animate-fade-in">
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#fff' }}>Dashboard</Typography>

            {/* 1. STATS ROW */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Всього Студентів"
                        value={stats?.students || 0}
                        icon={<People />}
                        color="#3b82f6"
                        subtext="Активних користувачів"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Здано Робіт"
                        value={stats?.tasks || 0}
                        icon={<Assignment />}
                        color="#10b981"
                        subtext="Загальна кількість завдань"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Економіка (Tokens)"
                        value={(stats?.economy?.totalTokens || 0).toLocaleString()}
                        icon={<TrendingUp />}
                        color="#f59e0b"
                        subtext={`XP: ${(stats?.economy?.totalXP || 0).toLocaleString()}`}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Очікують перевірки"
                        value={stats?.pendingReviews || 0}
                        icon={<AccessTime />}
                        color="#ef4444"
                        subtext="Потребують уваги"
                    />
                </Grid>
            </Grid>

            {/* 2. CHARTS ROW */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper className="glass-panel" sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Активність (Останні 7 днів)</Typography>
                        <Box sx={{ mt: 2 }}>
                            <LineChart data={activityData} labels={activityLabels} color="#6366f1" height={250} />
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper className="glass-panel" sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Успішність</Typography>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                            <PieChart data={performanceData} size={200} />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* 3. LISTS GRID */}
            <Grid container spacing={3}>

                {/* LEFT: Leaders */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper className="glass-panel" sx={{ p: 0 }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EmojiEvents sx={{ color: '#fbbf24' }} /> Топ Успішності
                            </Typography>
                        </Box>
                        <List>
                            {performance?.leaders?.map((student, i) => (
                                <ListItem key={i}>
                                    <ListItemAvatar>
                                        <Avatar src={student.avatarUrl ? (student.avatarUrl.startsWith('http') ? student.avatarUrl : `/${student.avatarUrl.replace(/^\//, '')}`) : ''}>
                                            {student.username?.[0]}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={student.username}
                                        secondary={<Typography variant="caption" sx={{ color: '#94a3b8' }}>{student.group || 'No Group'}</Typography>}
                                    />
                                    <Box sx={{ textAlign: 'right', minWidth: 100 }}>
                                        <Typography variant="h6" sx={{ color: '#10b981' }}>{student.progress}%</Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>{student.completed} / {student.total} завдань</Typography>
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                {/* RIGHT: Debtors List */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper className="glass-panel" sx={{ p: 0, height: '100%', bgcolor: 'rgba(239, 68, 68, 0.05) !important', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <Typography variant="h6" sx={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Warning /> Боржники
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#fca5a5' }}>
                                Студенти з прогресом нижче 50%
                            </Typography>
                        </Box>
                        <List>
                            {performance?.debtors?.length > 0 ? performance.debtors.map((student, i) => (
                                <React.Fragment key={i}>
                                    <ListItem alignItems="flex-start">
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>!</Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={student.username}
                                            secondaryTypographyProps={{ component: 'div' }}
                                            secondary={
                                                <Box>
                                                    <Typography variant="caption" component="span" sx={{ color: '#fca5a5' }}>
                                                        {student.group}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={student.progress}
                                                            sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.2)', '& .MuiLinearProgress-bar': { bgcolor: '#ef4444' } }}
                                                        />
                                                        <Typography variant="caption" sx={{ color: '#fff' }}>{student.progress}%</Typography>
                                                    </Box>
                                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                                        Здано лише {student.completed} з {student.total}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    <Divider component="li" sx={{ borderColor: 'rgba(239, 68, 68, 0.1)' }} />
                                </React.Fragment>
                            )) : (
                                <Box sx={{ p: 3, textAlign: 'center', color: '#fca5a5' }}>
                                    Чудово! Боржників немає.
                                </Box>
                            )}
                        </List>

                    </Paper>
                </Grid>

            </Grid>
        </Box>
    );
};

export default Dashboard;
