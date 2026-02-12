import React, { useEffect, useState, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    Typography,
    Grid,
    Chip,
    Box,
    Tabs,
    Tab,
    Paper,
    Divider,
    Fade,
    Avatar,
    IconButton,
    Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SchoolIcon from '@mui/icons-material/School';
import TokenIcon from '@mui/icons-material/Token';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import DiplomaViewer from './DiplomaViewer';

const GlassCard = ({ children, sx = {}, ...props }) => (
    <Paper
        elevation={0}
        sx={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 1,
            overflow: 'hidden',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
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
            borderRadius: 1,
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
            <Typography variant="h4" fontWeight="bold" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                {value}
            </Typography>
        </Box>
        {/* Decorative Circle */}
        <Box
            sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                zIndex: 1
            }}
        />
    </Paper>
);

const StudentProfileModal = ({ open, onClose, address }) => {
    const { t } = useLanguage();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);

    const [badges, setBadges] = useState([]);

    const fetchDetails = useCallback(async () => {
        setLoading(true);
        try {
            const [data, badgesData] = await Promise.all([
                apiService.getPublicUserDetails(address),
                apiService.getBadges()
            ]);
            setProfile(data);
            setBadges(badgesData);
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    }, [address]);

    useEffect(() => {
        if (open && address) {
            fetchDetails();
        }
    }, [open, address, fetchDetails]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    if (!open) return null;

    // Apply visual effects from equipped items
    const frameClass = profile?.wallet?.equipped?.avatarFrame || '';
    const bgClass = profile?.wallet?.equipped?.profileBg || '';

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
                    backgroundImage: 'linear-gradient(145deg, #09090b 0%, #18181b 100%)',
                    color: '#f8fafc',
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    overflow: 'hidden' // Important for BG
                }
            }}
        >
            {/* Dynamic Background Layer */}
            {bgClass && (
                <div className={bgClass} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.3, zIndex: 0, pointerEvents: 'none' }} />
            )}

            {/* Header Bar */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 3,
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(0,0,0,0.2)',
                zIndex: 1, position: 'relative'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {t('studentProfile')}
                    </Typography>
                    <Chip label={address} variant="outlined" size="small" sx={{ borderColor: 'rgba(255,255,255,0.1)', color: '#64748b', fontFamily: 'monospace' }} />
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#94a3b8', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <DialogContent sx={{
                p: { xs: 2, md: 4 }, // Reduced padding on mobile/tablet
                minHeight: { xs: 300, md: 500 }, // Reduced minHeight
                zIndex: 1,
                position: 'relative',
                overflowY: 'auto', // Explicit scroll
                maxHeight: 'calc(100vh - 100px)' // Ensure space for header
            }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                        <Typography sx={{ color: '#94a3b8' }}>{t('loadingData')}</Typography>
                    </Box>
                ) : !profile ? (
                    <Typography color="error" align="center">{t('failedToLoadProfile')}</Typography>
                ) : (
                    <Grid container spacing={{ xs: 2, md: 4 }}>
                        {/* Left Column: User Identity */}
                        <Grid item xs={12} md={3}>
                            <GlassCard sx={{
                                p: { xs: 2, md: 4 },
                                textAlign: 'center',
                                height: '100%',
                                position: 'relative',
                                display: { xs: 'flex', md: 'block' }, // Flex on mobile/tablet for side-by-side
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexDirection: { xs: 'row', md: 'column' },
                                gap: 2
                            }}>
                                <Box sx={{
                                    display: 'inline-block',
                                    position: 'relative',
                                    mb: { xs: 0, md: 3 }
                                }}>
                                    <div className={frameClass} style={{ padding: frameClass ? 0 : 5 }}>
                                        <Avatar
                                            src={profile.wallet.avatarUrl ? (profile.wallet.avatarUrl.startsWith('http') ? profile.wallet.avatarUrl : `/${profile.wallet.avatarUrl.replace(/^\//, '')}`) : ''}
                                            sx={{
                                                width: { xs: 64, md: 120 }, // Smaller on mobile/tablet
                                                height: { xs: 64, md: 120 },
                                                border: frameClass ? 'none' : '4px solid #18181b'
                                            }}
                                        />
                                    </div>
                                </Box>

                                <Box sx={{ textAlign: { xs: 'left', md: 'center' }, flex: 1 }}>
                                    <Typography variant="h5" fontWeight="bold" gutterBottom className={profile.wallet.equipped?.nickEffect || ''} sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }}>
                                        {profile.wallet.username || 'No Name'}
                                    </Typography>

                                    <Chip
                                        label={profile.wallet.group || t('noGroup')}
                                        sx={{
                                            bgcolor: 'rgba(59, 130, 246, 0.1)',
                                            color: '#60a5fa',
                                            fontWeight: 600,
                                            border: '1px solid rgba(59, 130, 246, 0.2)'
                                        }}
                                        size="small"
                                    />
                                </Box>

                                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'block', md: 'none' }, mx: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                                <Divider sx={{ my: 3, display: { xs: 'none', md: 'block' }, borderColor: 'rgba(255,255,255,0.1)' }} />

                                <Box sx={{ textAlign: 'left', minWidth: { xs: 80, md: 'auto' } }}>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1 }}>{t('battlePassLevel')}</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="h4" fontWeight="bold" sx={{ color: '#f59e0b', fontSize: { xs: '1.5rem', md: '3rem' } }}>{profile.wallet.battlePassLevel}</Typography>
                                        <StarIcon sx={{ color: '#f59e0b' }} />
                                    </Box>
                                    <Box sx={{ mt: 1, height: 6, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                                        <Box sx={{ width: `${Math.min(profile.wallet.battlePassProgress || 0, 100)}%`, height: '100%', bgcolor: '#f59e0b', borderRadius: 3 }} />
                                    </Box>
                                </Box>

                            </GlassCard>
                        </Grid>

                        {/* Right Column: Stats & Data */}
                        <Grid item xs={12} md={9}>
                            {/* Stats Row */}
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                                <Grid item xs={12} sm={6}>
                                    <StatCard
                                        title={t('xpPoints')}
                                        value={profile.wallet.points.toLocaleString()}
                                        icon={<WorkspacePremiumIcon />}
                                        gradient="linear-gradient(135deg, #059669 0%, #10b981 100%)"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <StatCard
                                        title={t('quantumTokens')}
                                        value={profile.wallet.tokenBalance.toLocaleString()}
                                        icon={<TokenIcon />}
                                        gradient="linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)"
                                    />
                                </Grid>
                            </Grid>

                            {/* Tabs Section */}
                            <Box sx={{ width: '100%' }}>
                                <Tabs
                                    value={activeTab}
                                    onChange={handleTabChange}
                                    sx={{
                                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                                        mb: 3,
                                        '& .MuiTab-root': {
                                            color: '#94a3b8',
                                            fontWeight: 500,
                                            textTransform: 'none',
                                            fontSize: '1rem',
                                            '&.Mui-selected': { color: '#fff' }
                                        },
                                        '& .MuiTabs-indicator': {
                                            bgcolor: '#8b5cf6',
                                            height: 3,
                                            borderRadius: '3px 3px 0 0'
                                        }
                                    }}
                                >
                                    <Tab label={`${t('completedTasksCount')} (${profile.completedTasks.length})`} icon={<AssignmentTurnedInIcon fontSize="small" />} iconPosition="start" />
                                    <Tab label={`Сертифікати (${profile.diplomas.length})`} icon={<SchoolIcon fontSize="small" />} iconPosition="start" />
                                    <Tab label={t('badges') || 'Badges'} icon={<WorkspacePremiumIcon fontSize="small" sx={{ color: '#f59e0b' }} />} iconPosition="start" />
                                </Tabs>

                                {/* TASKS */}
                                {activeTab === 0 && (
                                    <Fade in={true}>
                                        <Grid container spacing={2}>
                                            {profile.completedTasks.map(task => (
                                                <Grid item xs={12} sm={6} key={task._id}>
                                                    <GlassCard sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Box>
                                                            <Typography variant="body1" fontWeight="500">{task.name}</Typography>
                                                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>{task.type === 'manual' ? t('completed') : 'Auto'}</Typography>
                                                        </Box>
                                                        <Chip label={`+${task.points} XP`} size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', fontWeight: 'bold' }} />
                                                    </GlassCard>
                                                </Grid>
                                            ))}
                                            {profile.completedTasks.length === 0 && (
                                                <Grid item xs={12}>
                                                    <Box sx={{ textAlign: 'center', py: 5, color: '#52525b' }}>
                                                        <AssignmentTurnedInIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                                                        <Typography>{t('studentNoTasks')}</Typography>
                                                    </Box>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </Fade>
                                )}

                                {/* DIPLOMAS */}
                                {activeTab === 1 && (
                                    <Fade in={true}>
                                        <Box>
                                            <DiplomaViewer userAddress={profile.wallet.address} compact={true} />
                                        </Box>
                                    </Fade>
                                )}

                                {/* BADGES */}
                                {activeTab === 2 && (
                                    <Fade in={true}>
                                        <Grid container spacing={2}>
                                            {/* Render Earned Badges */}
                                            {profile.wallet.badges && profile.wallet.badges.map((b) => {
                                                const badgeInfo = badges.find(i => i.id === b.badgeId);
                                                return (
                                                    <Grid item xs={6} sm={4} key={b.badgeId}>
                                                        <GlassCard sx={{ p: 2, textAlign: 'center', border: '1px solid #f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
                                                            <Typography variant="h2" sx={{ mb: 1 }}>{badgeInfo?.iconUrl || '🏆'}</Typography>
                                                            <Typography variant="body1" fontWeight="bold">{badgeInfo?.name?.ua || b.badgeId}</Typography>
                                                            <Typography variant="caption" sx={{ color: '#fbbf24' }}>{new Date(b.date).toLocaleDateString()}</Typography>
                                                        </GlassCard>
                                                    </Grid>
                                                );
                                            })}
                                            {/* Render Locked Badges (Optional: filter out ones user has) */}
                                            {badges.filter(allB => !profile.wallet.badges?.some(myB => myB.badgeId === allB.id)).map(locked => (
                                                <Grid item xs={6} sm={4} key={locked.id}>
                                                    <GlassCard sx={{ p: 2, textAlign: 'center', opacity: 0.5, filter: 'grayscale(1)' }}>
                                                        <Typography variant="h2" sx={{ mb: 1 }}>{locked.iconUrl || '🔒'}</Typography>
                                                        <Typography variant="body1" fontWeight="bold">{locked.name?.ua}</Typography>
                                                        <Typography variant="caption">{locked.description?.ua}</Typography>
                                                    </GlassCard>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Fade>
                                )}

                            </Box>
                        </Grid>
                    </Grid>
                )}
            </DialogContent>
        </Dialog >
    );
};

export default StudentProfileModal;
