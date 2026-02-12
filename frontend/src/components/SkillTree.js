import React, { useEffect, useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent, CardActionArea,
    Chip, LinearProgress, Button, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Tooltip, Fade, useMediaQuery, useTheme
} from '@mui/material';
import {
    Lock, CheckCircle, RadioButtonUnchecked,
    ArrowBack, PlayArrow, EmojiEvenhts, School, Science, Close,
    Cloud, Storage, Security, Code, Quiz, AccountBalanceWallet, VpnKey, Search
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/apiService';
import { getTasks, completeTask, submitTaskReport } from '../services/apiService';
import QuizModal from './QuizModal';

// --- HELPERS ---

// --- STYLES GENERATOR ---
const getTaskTheme = (task) => {
    const name = task.name.toLowerCase();
    const type = task.type || '';

    // AWS / Cloud
    if (name.includes('aws') || name.includes('cloud') || name.includes('glue') || name.includes('redshift')) {
        return {
            icon: <Cloud sx={{ fontSize: 60, color: '#fff' }} />,
            gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            bg: 'rgba(249, 115, 22, 0.2)'
        };
    }
    // SQL / Database
    if (name.includes('sql') || name.includes('database') || name.includes('storage') || name.includes('збереження') || name.includes('etl')) {
        return {
            icon: <Storage sx={{ fontSize: 60, color: '#fff' }} />,
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            bg: 'rgba(59, 130, 246, 0.2)'
        };
    }
    // Crypto / Security / Wallet
    if (name.includes('wallet') || name.includes('гаман') || name.includes('key') || name.includes('seed') || name.includes('metamask') || name.includes('безпека')) {
        return {
            icon: <AccountBalanceWallet sx={{ fontSize: 60, color: '#fff' }} />,
            gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            bg: 'rgba(16, 185, 129, 0.2)'
        };
    }
    // Cryptography / Hash
    if (name.includes('crypto') || name.includes('hash') || name.includes('хеш') || name.includes('vpn')) {
        return {
            icon: <VpnKey sx={{ fontSize: 60, color: '#fff' }} />,
            gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            bg: 'rgba(139, 92, 246, 0.2)'
        };
    }
    // Code / Smart Contracts
    if (name.includes('contract') || name.includes('code') || name.includes('solidity') || name.includes('remix') || name.includes('token') || name.includes('deploy')) {
        return {
            icon: <Code sx={{ fontSize: 60, color: '#fff' }} />,
            gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
            bg: 'rgba(236, 72, 153, 0.2)'
        };
    }
    // Quiz
    if (type === 'quiz' || name.includes('quiz') || name.includes('test') || name.includes('тест')) {
        return {
            icon: <Quiz sx={{ fontSize: 60, color: '#fff' }} />,
            gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
            bg: 'rgba(244, 63, 94, 0.2)'
        };
    }

    return {
        icon: <School sx={{ fontSize: 60, color: '#fff' }} />,
        gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
        bg: 'rgba(100, 116, 139, 0.2)'
    };
};

const isTaskLocked = (task, completedTasksMap) => {
    if (!task.prerequisites || task.prerequisites.length === 0) return false;
    return task.prerequisites.some(reqId => !completedTasksMap[reqId]);
};

const calculateProgress = (course, completedTasksMap) => {
    let total = 0;
    let done = 0;
    course.topics?.forEach(topic => {
        topic.tasks?.forEach(task => {
            total++;
            if (completedTasksMap[task._id]) done++;
        });
    });
    return total === 0 ? 0 : Math.round((done / total) * 100);
};

// --- STYLES GENERATOR ---
const getCourseStyle = (id) => {
    const gradients = [
        'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
        'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
        'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
        'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
        'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)'
    ];
    const borders = [
        'rgba(6, 182, 212, 0.3)',
        'rgba(236, 72, 153, 0.3)',
        'rgba(16, 185, 129, 0.3)',
        'rgba(245, 158, 11, 0.3)',
        'rgba(99, 102, 241, 0.3)'
    ];
    const accents = ['#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#6366f1'];

    // Simple hash from string
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;

    return {
        background: gradients[index],
        border: borders[index],
        accent: accents[index]
    };
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
};

// --- COMPONENTS ---

const CourseCard = ({ course, progress, onClick }) => {
    const { t } = useLanguage();
    const style = useMemo(() => getCourseStyle(course._id), [course._id]);

    return (
        <Card
            sx={{
                height: '100%',
                background: style.background,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${style.border}`,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 10px 30px -10px ${style.accent}40`,
                    borderColor: style.accent
                },
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -1, left: -1, right: -1, bottom: -1,
                    borderRadius: 'inherit',
                    padding: '1px',
                    background: `linear-gradient(135deg, ${style.accent}, transparent)`,
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    opacity: 0.5
                }
            }}
            onClick={onClick}
        >
            <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        p: 2,
                        borderRadius: '16px',
                        bgcolor: `${style.accent}20`,
                        color: style.accent,
                        boxShadow: `0 0 20px ${style.accent}20`
                    }}>
                        <School fontSize="large" />
                    </Box>
                    <Typography variant="h5" sx={{
                        fontWeight: 'bold',
                        color: '#fff',
                        fontSize: '1.25rem',
                        lineHeight: 1.3
                    }}>
                        {course.title}
                    </Typography>
                </Box>

                <Typography variant="body2" sx={{
                    mb: 4,
                    flexGrow: 1,
                    color: 'rgba(255,255,255,0.7)',
                    lineHeight: 1.6
                }}>
                    {course.description || t('noDescription')}
                </Typography>

                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="caption" sx={{ color: style.accent, fontWeight: 'bold', letterSpacing: '1px' }}>
                            {t('progress')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#fff' }}>{progress}%</Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 6,
                            borderRadius: 4,
                            bgcolor: 'rgba(255,255,255,0.1)',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                background: `linear-gradient(90deg, ${style.accent}, #fff)`
                            }
                        }}
                    />
                </Box>
            </CardContent>
        </Card>
    );
};

const TreeView = ({ course, completedTasks, onBack, onTaskClick }) => {
    const { t } = useLanguage();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // NEW: Local Filter State for TreeView
    const [searchQuery, setSearchQuery] = useState('');
    const [hideCompleted, setHideCompleted] = useState(false);

    // Logic to filter topics or tasks within topics
    const filteredTopics = useMemo(() => {
        if (!course.topics) return [];

        return course.topics.map(topic => {
            // Filter tasks
            const filteredTasks = topic.tasks?.filter(task => {
                const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    task.description?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesStatus = hideCompleted ? !completedTasks[task._id] : true;
                return matchesSearch && matchesStatus;
            });

            // Return topic only if it has matching tasks OR if the topic title matches search
            // (If topic title matches, show all its tasks that match status)
            const topicTitleMatch = topic.title.toLowerCase().includes(searchQuery.toLowerCase());

            if (topicTitleMatch) {
                // If topic name matches, keep all its valid status tasks
                return {
                    ...topic,
                    tasks: topic.tasks?.filter(task => hideCompleted ? !completedTasks[task._id] : true)
                };
            }

            // Otherwise, keep topic only if it has filtered tasks
            if (filteredTasks && filteredTasks.length > 0) {
                return { ...topic, tasks: filteredTasks };
            }
            return null;
        }).filter(Boolean); // Remove nulls
    }, [course, searchQuery, hideCompleted, completedTasks]);

    return (
        <Box className="animate-fade-in" sx={{ position: 'relative' }}>
            {/* Background Pattern */}
            <Box sx={{
                position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
                backgroundSize: '30px 30px',
                opacity: 0.1,
                zIndex: -1,
                maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)'
            }} />

            {/* Header */}
            <Box sx={{ mb: 8, position: 'relative', zIndex: 10 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <IconButton onClick={onBack} sx={{
                        border: '1px solid rgba(255,255,255,0.1)',
                        bgcolor: 'rgba(255,255,255,0.05)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                    }}>
                        <ArrowBack />
                    </IconButton>
                    <Box>
                        <Typography variant="h3" sx={{ fontWeight: '800', color: '#fff', letterSpacing: '-0.02em' }}>
                            {course.title}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: '600px' }}>
                            {t('missionLogicRoute')}
                        </Typography>
                    </Box>
                </Box>

                {/* --- COURSE FILTERS BAR --- */}
                <Paper sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: 'center',
                    gap: 3,
                    background: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px'
                }}>
                    <TextField
                        placeholder={t('searchTasks')}
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                            sx: { color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' } }
                        }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 'max-content' }}>
                        <Typography variant="body2" color="text.secondary">{t('hideCompleted')}</Typography>
                        <IconButton
                            onClick={() => setHideCompleted(!hideCompleted)}
                            color={hideCompleted ? "primary" : "default"}
                        >
                            {hideCompleted ? <CheckCircle /> : <RadioButtonUnchecked />}
                        </IconButton>
                    </Box>
                </Paper>
            </Box>

            {/* Timeline */}
            <Box sx={{ position: 'relative', ml: { xs: 2, md: 4 }, pl: { xs: 4, md: 6 }, pb: 4 }}>
                {/* The Beam - Main Vertical Line (Desktop Only) */}
                {!isMobile && (
                    <Box sx={{
                        position: 'absolute',
                        left: { xs: '19px', md: '35px' },
                        top: 20,
                        bottom: 0,
                        width: '3px',
                        background: 'linear-gradient(180deg, #06b6d4 0%, rgba(6, 182, 212, 0.1) 90%, transparent 100%)',
                        boxShadow: '0 0 15px #06b6d4',
                        zIndex: 0
                    }} />
                )}

                {/* Xwrapper removed */}
                {filteredTopics.map((topic, idx) => (
                    <Box key={topic._id} sx={{ mb: 8, position: 'relative' }}>
                        {/* Node Beacon (Desktop Only) */}
                        {!isMobile && (
                            <Box
                                id={`topic-node-${topic._id}`}
                                sx={{
                                    position: 'absolute',
                                    left: { xs: '-41px', md: '-57px' },
                                    top: 15,
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    bgcolor: '#0f172a',
                                    border: '4px solid #06b6d4',
                                    boxShadow: '0 0 15px #06b6d4',
                                    zIndex: 2,
                                    transition: 'all 0.3s ease',
                                    '&:hover': { transform: 'scale(1.2)', boxShadow: '0 0 25px #06b6d4' }
                                }}
                            />
                        )}

                        {/* Topic Header */}
                        <Paper sx={{
                            mb: 3, p: 2,
                            background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.1) 0%, transparent 100%)',
                            borderLeft: '4px solid #06b6d4',
                            backdropFilter: 'blur(5px)',
                            display: 'flex', alignItems: 'center', gap: 2,
                            borderRadius: '0 4px 4px 0',
                            position: 'relative', zIndex: 1
                        }} elevation={0}>
                            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold', textShadow: '0 2px 10px rgba(0,0,0,0.5)', letterSpacing: 1 }}>
                                <span style={{ opacity: 0.5, fontSize: '0.7em', marginRight: 15, fontFamily: 'monospace' }}>#{String(idx + 1).padStart(2, '0')}</span>
                                {topic.title}
                            </Typography>
                        </Paper>

                        {/* Tasks Grid */}
                        <Grid container spacing={{ xs: 2, md: 4 }} sx={{ position: 'relative', zIndex: 1 }}>
                            {topic.tasks?.map((task, tIdx) => {
                                const isLocked = isTaskLocked(task, completedTasks);
                                const isDone = completedTasks[task._id];
                                const theme = getTaskTheme(task);

                                return (
                                    <Grid item xs={12} sm={6} md={4} key={task._id}>
                                        <Paper
                                            id={`task-card-${task._id}`}
                                            onClick={() => !isLocked && onTaskClick(task)}
                                            sx={{
                                                height: '100%',
                                                display: 'flex', flexDirection: 'column',
                                                bgcolor: isDone ? 'rgba(16, 185, 129, 0.05)' : 'rgba(30, 41, 59, 0.6)',
                                                backdropFilter: 'blur(12px)',
                                                border: isDone ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: '12px',
                                                cursor: isLocked ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                opacity: isLocked ? 0.6 : 1,
                                                position: 'relative',
                                                overflow: 'hidden',
                                                filter: isLocked ? 'grayscale(0.8)' : 'none',
                                                transform: 'translateZ(0)', // Force GPU layer
                                                '&:hover': !isLocked && {
                                                    transform: 'translateY(-6px)',
                                                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6)',
                                                    bgcolor: 'rgba(30, 41, 59, 0.8)',
                                                    borderColor: '#38bdf8'
                                                }
                                            }}
                                        >
                                            {/* STEP NUMBER INDICATOR */}
                                            <Box sx={{
                                                position: 'absolute',
                                                top: 0, right: 0,
                                                p: 1.5,
                                                background: isDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                                                borderBottomLeftRadius: '12px',
                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                borderLeft: '1px solid rgba(255,255,255,0.05)',
                                                color: isDone ? '#34d399' : 'rgba(255,255,255,0.3)',
                                                fontWeight: 'bold',
                                                fontSize: '0.8rem',
                                                fontFamily: 'monospace'
                                            }}>
                                                {(tIdx + 1).toString().padStart(2, '0')}
                                            </Box>

                                            {/* Card Content ... (Existing content) */}
                                            {task.imageUrl ? (
                                                <Box sx={{
                                                    height: 140, width: '100%',
                                                    // Fix: Remove hardcoded domain. Use relative path or full URL if provided.
                                                    // Assuming /uploads is proxied or served from same origin in production/dev via Nginx
                                                    backgroundImage: `url(${task.imageUrl.startsWith('http') ? task.imageUrl : (task.imageUrl.startsWith('/') ? task.imageUrl : `/${task.imageUrl}`)})`,
                                                    backgroundSize: 'cover', backgroundPosition: 'center',
                                                    position: 'relative',
                                                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                                                }}>
                                                    <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15, 23, 42, 1) 0%, transparent 100%)' }} />
                                                </Box>
                                            ) : (
                                                <Box sx={{
                                                    height: 80, width: '100%',
                                                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                                                }}>
                                                    <Science sx={{ fontSize: 32, opacity: 0.3, color: '#38bdf8' }} />
                                                </Box>
                                            )}

                                            <Box sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                    <Chip
                                                        label={`${task.points} XP`}
                                                        size="small"
                                                        sx={{
                                                            height: 24,
                                                            bgcolor: isDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6, 182, 212, 0.15)',
                                                            color: isDone ? '#34d399' : '#22d3ee',
                                                            fontWeight: '800',
                                                            fontSize: '0.75rem',
                                                            border: '1px solid',
                                                            borderColor: isDone ? 'rgba(16, 185, 129, 0.3)' : 'rgba(6, 182, 212, 0.2)'
                                                        }}
                                                    />
                                                    {isLocked ? <Lock sx={{ color: 'rgba(255,255,255,0.2)', fontSize: 20 }} /> :
                                                        isDone ? <CheckCircle sx={{ color: '#34d399', fontSize: 20 }} /> :
                                                            <RadioButtonUnchecked sx={{ color: 'rgba(255,255,255,0.2)', fontSize: 20 }} />}
                                                </Box>

                                                <Typography variant="h6" sx={{
                                                    fontWeight: '700',
                                                    mb: 1,
                                                    color: '#f1f5f9',
                                                    fontSize: '1rem',
                                                    lineHeight: 1.4,
                                                    flexGrow: 1
                                                }}>
                                                    {task.name}
                                                </Typography>

                                                {task.tags?.length > 0 && (
                                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 'auto', pt: 2 }}>
                                                        {task.tags.map((tag, i) => (
                                                            <span key={i} style={{
                                                                fontSize: '0.65rem',
                                                                padding: '2px 8px',
                                                                borderRadius: 10,
                                                                background: 'rgba(255,255,255,0.05)',
                                                                color: '#94a3b8',
                                                                border: '1px solid rgba(255,255,255,0.05)'
                                                            }}>
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </Box>
                                                )}
                                            </Box>
                                        </Paper>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

// --- MAIN COMPONENT ---

const SkillTree = ({ groupName, account }) => {
    const { t } = useLanguage();
    const [treeData, setTreeData] = useState([]);
    const [completedTasks, setCompletedTasks] = useState({});
    const [extraTasks, setExtraTasks] = useState([]); // Tasks not in the tree
    const [loading, setLoading] = useState(true);

    const [view, setView] = useState('list'); // 'list' | 'tree'
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [searchQuery, setSearchQuery] = useState(''); // NEW: Search State

    // Modal State
    const [openModal, setOpenModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [openQuizModal, setOpenQuizModal] = useState(false); // New state for quiz
    const [secretCode, setSecretCode] = useState('');
    const [submissionText, setSubmissionText] = useState('');
    const [submissionFile, setSubmissionFile] = useState(null);

    useEffect(() => {
        loadData();
    }, [groupName, account]);

    const loadData = async () => {
        try {
            setLoading(true);
            const tree = await api.getStudentTree(groupName);
            setTreeData(tree);

            const tasksData = await getTasks(account || 'guest');
            if (tasksData) {
                const completedMap = tasksData.completedTasks?.reduce((acc, [taskId, status]) => {
                    acc[taskId] = status;
                    return acc;
                }, {}) || {};
                setCompletedTasks(completedMap);
                setExtraTasks([]);
            }
        } catch (err) {
            console.error("Error loading skill tree:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCourseClick = (course) => {
        setSelectedCourse(course);
        setView('tree');
    };

    const handleBack = () => {
        setView('list');
        setSelectedCourse(null);
    };

    const handleTaskClick = (task) => {
        if (task.type === 'quiz') {
            setSelectedTask(task);
            setOpenQuizModal(true);
        } else {
            setSelectedTask(task);
            setOpenModal(true);
        }
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setOpenQuizModal(false);
        setSelectedTask(null);
        setSecretCode('');
        setSubmissionText('');
        setSubmissionFile(null);
    };

    const handleQuizComplete = async (answers) => {
        if (!selectedTask) return;
        try {
            await api.completeTask(account, selectedTask._id, null, answers);
            setCompletedTasks(prev => ({ ...prev, [selectedTask._id]: true }));
        } catch (err) {
            throw err;
        }
    };

    const handleSubmit = async () => {
        if (!selectedTask) return;
        try {
            if (selectedTask.type === 'manual') {
                await submitTaskReport(account, selectedTask._id, submissionText, submissionFile);
                alert('Report submitted!');
            } else if (selectedTask.type === 'code' || selectedTask.secretCode) {
                await completeTask(account, selectedTask._id, secretCode);
                setCompletedTasks(prev => ({ ...prev, [selectedTask._id]: true }));
                alert('Task Completed!');
            } else {
                await completeTask(account, selectedTask._id);
                setCompletedTasks(prev => ({ ...prev, [selectedTask._id]: true }));
                alert('Task Completed!');
            }
            handleCloseModal();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    if (loading) return <LinearProgress color="secondary" />;

    if (!treeData || treeData.length === 0) {
        return (
            <Paper className="glass-panel" sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    {t('noCoursesAssigned')} {groupName}.
                </Typography>
            </Paper>
        );
    }

    // Filter Logic
    const filteredCourses = treeData.filter(course => {
        const query = searchQuery.toLowerCase();
        return course.title?.toLowerCase().includes(query) || course.description?.toLowerCase().includes(query);
    });

    return (
        <Box sx={{ minHeight: '600px' }}>
            {view === 'list' ? (
                <Fade in={true}>
                    <Box>
                        <Box sx={{ mb: 4, ml: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                            <Box>
                                <Typography variant="h3" sx={{ fontWeight: 'bold', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', color: 'transparent', mb: 1 }}>
                                    {t('missionControl')}
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    {t('selectPath')}
                                </Typography>
                            </Box>

                            {/* Course Search */}
                            <TextField
                                placeholder={t('searchCourses')}
                                variant="outlined"
                                size="small"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                sx={{
                                    minWidth: 250,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '12px',
                                        bgcolor: 'rgba(255,255,255,0.05)',
                                        '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                        '&.Mui-focused fieldset': { borderColor: '#06b6d4' }
                                    },
                                    '& input': { color: '#fff' }
                                }}
                            />
                        </Box>

                        <Grid container spacing={{ xs: 2, md: 4 }}>
                            {filteredCourses.length > 0 ? (
                                filteredCourses.map(course => (
                                    <Grid item xs={12} md={6} lg={4} key={course._id}>
                                        <CourseCard
                                            course={course}
                                            progress={calculateProgress(course, completedTasks)}
                                            onClick={() => handleCourseClick(course)}
                                        />
                                    </Grid>
                                ))
                            ) : (
                                <Grid item xs={12}>
                                    <Typography color="text.secondary" textAlign="center" py={4}>
                                        NO COURSES FOUND
                                    </Typography>
                                </Grid>
                            )}
                        </Grid>



                    </Box>
                </Fade>
            ) : (
                <TreeView
                    course={selectedCourse}
                    completedTasks={completedTasks}
                    onBack={handleBack}
                    onTaskClick={handleTaskClick}
                />
            )
            }
            {/* TASK INTERACTION MODAL */}
            <Dialog
                open={openModal}
                onClose={handleCloseModal}
                maxWidth="sm"
                fullWidth
                scroll="paper"
                PaperProps={{
                    sx: {
                        background: 'rgba(15, 23, 42, 0.95)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '24px',
                        maxHeight: '90vh', // Ensure it doesn't overflow screen height
                        margin: 2 // Add margin on mobile
                    }
                }}
            >
                <DialogTitle sx={{
                    fontFamily: 'Orbitron',
                    color: '#06b6d4',
                    pt: 3,
                    pb: 1,
                    pr: 6, // Make space for close button
                    position: 'relative'
                }}>
                    {selectedTask?.name}
                    <IconButton
                        aria-label="close"
                        onClick={handleCloseModal}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: 'rgba(255, 255, 255, 0.5)',
                            '&:hover': { color: '#ffffff', background: 'rgba(255,255,255,0.1)' }
                        }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        {selectedTask?.description || t('noDescription')}
                    </Typography>

                    {selectedTask?.type === 'manual' && (
                        <Box sx={{ mt: 2 }}>
                            <TextField
                                fullWidth multiline rows={4}
                                label={t('missionReport')}
                                variant="outlined"
                                value={submissionText}
                                onChange={e => setSubmissionText(e.target.value)}
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': { color: '#fff' },
                                    '& .MuiInputLabel-root': { color: 'text.secondary' },
                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }
                                }}
                            />
                            {/* FILE UPLOAD */}
                            <Button
                                variant="outlined"
                                component="label"
                                fullWidth
                                sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
                            >
                                {submissionFile ? submissionFile.name : t('uploadFile')}
                                <input
                                    type="file"
                                    hidden
                                    onChange={(e) => setSubmissionFile(e.target.files[0])}
                                />
                            </Button>
                        </Box>
                    )}

                    {(selectedTask?.type === 'code' || selectedTask?.secretCode) && (
                        <TextField
                            fullWidth
                            label={t('secretCode')}
                            value={secretCode}
                            onChange={e => setSecretCode(e.target.value)}
                            sx={{ mt: 2, '& input': { color: '#fff' } }}
                        />
                    )}

                    {selectedTask?.url && (
                        <Button href={selectedTask.url} target="_blank" variant="outlined" fullWidth sx={{ mt: 2, py: 1.5, borderColor: '#3b82f6', color: '#3b82f6' }}>
                            {t('openMissionLink')}
                        </Button>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleCloseModal} sx={{ color: 'text.secondary' }}>{t('abort')}</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        sx={{
                            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                            px: 4
                        }}
                    >
                        {selectedTask?.type === 'manual' ? t('submitReport') : t('completeMission')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* QUIZ MODAL */}
            <QuizModal
                open={openQuizModal}
                task={selectedTask}
                onClose={handleCloseModal}
                onComplete={handleQuizComplete}
            />
        </Box >
    );
};

export default SkillTree;
