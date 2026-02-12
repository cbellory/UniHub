import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Grid,
    Chip,
    Box,
    Tabs,
    Tab,
    Paper,
    Divider,
    List,
    ListItem,
    ListItemText,
    Fade,
    Avatar,
    IconButton,
    Tooltip // NEW
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SchoolIcon from '@mui/icons-material/School';
import HistoryIcon from '@mui/icons-material/History';
import TokenIcon from '@mui/icons-material/Token';
import StarIcon from '@mui/icons-material/Star';
import AccountTreeIcon from '@mui/icons-material/AccountTree'; // NEW
import AdminSkillTree from './AdminSkillTree'; // NEW

import { getUserDetails } from '../services/adminApi';

const GlassCard = ({ children, sx = {}, ...props }) => (
    <Paper
        elevation={0}
        sx={{
            background: 'rgba(20, 20, 20, 0.4)', // Darker, cleaner
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 1, // Sharp (4px)
            overflow: 'hidden',
            transition: 'border-color 0.2s',
            '&:hover': {
                border: '1px solid rgba(255, 255, 255, 0.2)',
            },
            ...sx
        }}
        {...props}
    >
        {children}
    </Paper>
);

const StatCard = ({ title, value, icon, gradient }) => (
    <Paper
        sx={{
            p: 3,
            borderRadius: 1, // Sharp
            background: gradient,
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.1)'
        }}
    >
        <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, opacity: 0.9 }}>
                {icon}
                <Typography variant="overline" sx={{ ml: 1, fontWeight: 600, letterSpacing: 1 }}>{title}</Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)', fontFamily: 'monospace' }}>
                {value}
            </Typography>
        </Box>
        {/* Decorative Lines instead of Circle for tech look */}
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 100,
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05))',
                zIndex: 1
            }}
        />
    </Paper>
);

const StudentProfileModal = ({ open, onClose, address }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        if (open && address) {
            fetchDetails();
        }
    }, [open, address]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const data = await getUserDetails(address);
            setProfile(data);
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    if (!open) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="lg"
            TransitionComponent={Fade}
            PaperProps={{
                sx: {
                    bgcolor: '#09090b', // Deep dark background
                    backgroundImage: 'linear-gradient(to bottom right, #09090b, #121214)',
                    color: '#f8fafc',
                    borderRadius: 1, // Sharp
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 0 50px rgba(0,0,0,0.7)'
                }
            }}
        >
            {/* Header Bar */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 3,
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(0,0,0,0.2)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Профайл Студента
                    </Typography>
                    <Chip label={address} variant="outlined" size="small" sx={{ borderColor: 'rgba(255,255,255,0.1)', color: '#64748b', fontFamily: 'monospace' }} />
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#94a3b8', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 0, minHeight: 500, display: 'flex', flexDirection: 'column' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                        <Typography sx={{ color: '#94a3b8' }}>Завантаження даних...</Typography>
                    </Box>
                ) : !profile ? (
                    <Typography color="error" align="center">Не вдалося завантажити профіль</Typography>
                ) : (
                    <Box sx={{ p: 0 }}>
                        {/* COMPACT HEADER */}
                        <Box sx={{
                            position: 'relative',
                            p: 3,
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: 3, // Space between elements
                            background: 'rgba(0,0,0,0.2)', // Slightly darker header area
                            borderBottom: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            {/* 1. Avatar */}
                            <Box sx={{
                                width: 72, height: 72,
                                flexShrink: 0,
                                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                borderRadius: 1, // Sharp
                                p: 0.2
                            }}>
                                <Avatar
                                    src={profile.wallet.avatarUrl ? `https://cbellory.online${profile.wallet.avatarUrl}` : ''}
                                    sx={{ width: '100%', height: '100%', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 0.8 }}
                                />
                            </Box>

                            {/* 2. Identity Info */}
                            <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                    <Typography variant="h5" fontWeight="bold" sx={{ fontFamily: 'monospace', lineHeight: 1 }}>
                                        {profile.wallet.username || 'No Name'}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={profile.wallet.group || 'Без групи'}
                                        sx={{
                                            bgcolor: 'rgba(59, 130, 246, 0.1)',
                                            color: '#60a5fa',
                                            fontWeight: 600,
                                            border: '1px solid rgba(59, 130, 246, 0.2)',
                                            borderRadius: 0.5,
                                            height: 20,
                                            fontSize: '0.7rem'
                                        }}
                                    />
                                </Box>

                                {/* Battle Pass Mini-Bar */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>BP Lvl</Typography>
                                        <Typography variant="h6" fontWeight="bold" sx={{ color: '#f59e0b', fontFamily: 'monospace', lineHeight: 1 }}>{profile.wallet.battlePassLevel}</Typography>
                                    </Box>
                                    <Box sx={{ flexGrow: 1, maxWidth: 200, height: 4, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 0, overflow: 'hidden' }}>
                                        <Box sx={{ width: `${Math.min(profile.wallet.battlePassProgress || 0, 100)}%`, height: '100%', bgcolor: '#f59e0b' }} />
                                    </Box>
                                </Box>
                            </Box>

                            {/* 3. Stats (XP/Tokens) */}
                            <Box sx={{ display: 'flex', gap: 3 }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>XP</Typography>
                                    <Typography variant="h6" sx={{ fontFamily: 'monospace', color: '#10b981' }}>{profile.wallet.points.toLocaleString()}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>TOKENS</Typography>
                                    <Typography variant="h6" sx={{ fontFamily: 'monospace', color: '#6366f1' }}>{profile.wallet.tokenBalance.toLocaleString()}</Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* TABS & CONTENT AREA */}
                        <Box sx={{ p: 0 }}>
                            <Tabs
                                value={activeTab}
                                onChange={handleTabChange}
                                sx={{
                                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                                    px: 3, pt: 1,
                                    bgcolor: 'rgba(0,0,0,0.1)',
                                    minHeight: 48,
                                    '& .MuiTab-root': {
                                        color: '#94a3b8',
                                        fontWeight: 500,
                                        textTransform: 'uppercase',
                                        fontSize: '0.8rem',
                                        letterSpacing: 1,
                                        minHeight: 48,
                                        py: 1.5,
                                        mr: 2,
                                        '&.Mui-selected': { color: '#fff' }
                                    },
                                    '& .MuiTabs-indicator': {
                                        bgcolor: '#3b82f6',
                                        height: 2
                                    }
                                }}
                            >
                                <Tab label={`Завдання (${profile.completedTasks.length})`} icon={<AssignmentTurnedInIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
                                <Tab label={`Звіти (${profile.submissions.length})`} icon={<HistoryIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
                                <Tab label={`Сертифікати (${profile.diplomas.length})`} icon={<SchoolIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
                                <Tab label="Карта" icon={<AccountTreeIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
                            </Tabs>

                            <Box sx={{ p: 3, height: 600, overflowY: 'auto' }}>
                                {/* TASKS */}
                                {activeTab === 0 && (
                                    <Fade in={true}>
                                        <Grid container spacing={2}>
                                            {profile.completedTasks.map(task => (
                                                <Grid item xs={12} sm={6} md={4} key={task._id}>
                                                    <GlassCard sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', gap: 1 }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <Typography variant="body2" fontWeight="600" sx={{ lineHeight: 1.3 }}>{task.name}</Typography>
                                                            {task.type === 'manual' && <Tooltip title="Ручна перевірка"><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'block' }} /></Tooltip>}
                                                        </Box>
                                                        <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>{task.type || 'auto'}</Typography>
                                                            <Chip label={`+${task.points}`} size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', fontWeight: 'bold', borderRadius: 0.5 }} />
                                                        </Box>
                                                    </GlassCard>
                                                </Grid>
                                            ))}
                                            {profile.completedTasks.length === 0 && (
                                                <Grid item xs={12}>
                                                    <Box sx={{ textAlign: 'center', py: 5, color: '#52525b' }}>
                                                        <AssignmentTurnedInIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
                                                        <Typography variant="body2">Немає виконаних завдань</Typography>
                                                    </Box>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </Fade>
                                )}

                                {/* SUBMISSIONS */}
                                {activeTab === 1 && (
                                    <Fade in={true}>
                                        <Box>
                                            {profile.submissions.map(sub => (
                                                <GlassCard key={sub._id} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                                    <Box sx={{
                                                        width: 32, height: 32,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        color: '#94a3b8',
                                                        borderRadius: 0.5
                                                    }}>
                                                        <HistoryIcon fontSize="small" />
                                                    </Box>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                            <Typography variant="body2" fontWeight="600">{sub.taskId?.name || 'Unknown Task'}</Typography>
                                                            <Chip
                                                                label={sub.status.toUpperCase()}
                                                                size="small"
                                                                sx={{
                                                                    height: 20, fontSize: '0.65rem',
                                                                    bgcolor: sub.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : sub.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                                    color: sub.status === 'approved' ? '#34d399' : sub.status === 'rejected' ? '#f87171' : '#fbbf24',
                                                                    fontWeight: 'bold',
                                                                    borderRadius: 0.5
                                                                }}
                                                            />
                                                        </Box>
                                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
                                                            {new Date(sub.submittedAt).toLocaleString()}
                                                        </Typography>
                                                        {sub.submissionText && (
                                                            <Paper sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <Typography variant="body2" sx={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.85rem' }}>
                                                                    "{sub.submissionText}"
                                                                </Typography>
                                                            </Paper>
                                                        )}
                                                    </Box>
                                                </GlassCard>
                                            ))}
                                            {profile.submissions.length === 0 && (
                                                <Box sx={{ textAlign: 'center', py: 5, color: '#52525b' }}>
                                                    <Typography variant="body2">Історія звітів порожня</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Fade>
                                )}

                                {/* DIPLOMAS */}
                                {activeTab === 2 && (
                                    <Fade in={true}>
                                        <Box>
                                            {profile.diplomas.map(dip => (
                                                <Paper key={dip._id} sx={{
                                                    p: 0,
                                                    mb: 2,
                                                    borderRadius: 1, // Sharp
                                                    overflow: 'hidden',
                                                    position: 'relative',
                                                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                                }}>
                                                    <Box sx={{ p: 2, position: 'relative', zIndex: 2 }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <Box>
                                                                <Typography variant="overline" sx={{ color: '#818cf8', letterSpacing: 2, fontSize: '0.7rem' }}>BLOCKCHAIN DIPLOMA</Typography>
                                                                <Typography variant="h5" sx={{ fontFamily: 'serif', fontWeight: 'bold' }}>{dip.diplomaData.specialty}</Typography>
                                                            </Box>
                                                            <SchoolIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.1)' }} />
                                                        </Box>

                                                        <Grid container spacing={2} sx={{ mt: 2 }}>
                                                            <Grid item xs={6}>
                                                                <Typography variant="caption" sx={{ color: '#a5b4fc' }}>TOKEN ID</Typography>
                                                                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>#{dip.tokenId}</Typography>
                                                            </Grid>
                                                            <Grid item xs={6}>
                                                                <Typography variant="caption" sx={{ color: '#a5b4fc' }}>ISSUED</Typography>
                                                                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{new Date(dip.issuedAt).toLocaleDateString()}</Typography>
                                                            </Grid>
                                                        </Grid>
                                                    </Box>
                                                </Paper>
                                            ))}
                                            {profile.diplomas.length === 0 && (
                                                <Box sx={{ textAlign: 'center', py: 5, color: '#52525b' }}>
                                                    <Typography variant="body2">Немає сертифікатів</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Fade>
                                )}

                                {/* SKILL TREE */}
                                {activeTab === 3 && (
                                    <Fade in={true}>
                                        <Box sx={{ height: '550px', background: '#000', borderRadius: 2, overflow: 'hidden' }}>
                                            <AdminSkillTree
                                                studentAddress={address}
                                                completedTasksProp={profile.completedTasks}
                                            />
                                        </Box>
                                    </Fade>
                                )}

                            </Box>
                        </Box>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default StudentProfileModal;
