import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Button, TextField, Grid,
    List, ListItem, ListItemText, ListItemSecondaryAction,
    IconButton, Divider, Card, CardContent,
    Select, MenuItem, FormControl, InputLabel,
    Accordion, AccordionSummary, AccordionDetails, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Menu, MenuItem as ContextMenuItem, ListItemIcon
} from '@mui/material';
import {
    Add, Delete, Edit, ExpandMore, School, Class, Assignment,
    MoreVert, Folder, FolderOpen, Topic, DragIndicator
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

import * as eduApi from '../services/educationApi';
import { getTasks, updateTask } from '../services/adminApi';
import { useToast } from '../contexts/ToastContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const EducationManager = () => {
    const [activeTab, setActiveTab] = useState('courses'); // 'courses' or 'groups'

    // Data State
    const [courses, setCourses] = useState([]);
    const [topics, setTopics] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [groups, setGroups] = useState([]);

    // Selection State
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null); // NEW: Group Selection

    // Dialog & Menu State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState(''); // 'createCourse', 'editCourse', 'createTopic', 'editTopic'
    const [dialogValue, setDialogValue] = useState('');
    const [dialogDescription, setDialogDescription] = useState(''); // NEW state for description
    const [activeItem, setActiveItem] = useState(null); // The item being edited/deleted

    const [anchorEl, setAnchorEl] = useState(null);
    const [menuType, setMenuType] = useState('course'); // 'course' or 'topic'

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const c = await eduApi.getCourses();
            setCourses(c);
            const t = await getTasks();
            setTasks(t);
            const g = await eduApi.getGroups();
            setGroups(g);
        } catch (err) {
            console.error(err);
        }
    };

    const { showToast } = useToast();

    const handleAssignTaskToTopic = async (taskId, topicId) => {
        try {
            await updateTask(taskId, { topic: topicId });
            loadData();
        } catch (e) {
            console.error(e);
            showToast('Помилка прив\'язки', 'error');
        }
    };

    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const items = Array.from(topics);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Optimistic update
        setTopics(items);

        try {
            // Update order for all affected items
            // In a real app we might send the full array or just index changes
            // Here we iterate and update 'order' property
            const updates = items.map((topic, index) => ({
                _id: topic._id,
                order: index + 1
            }));

            // We need a bulk update API ideally. For now we will loop (not efficient but checking constraints)
            // Or just trust the frontend order until reload? No, better save.
            await Promise.all(updates.map(u => eduApi.updateTopic(u._id, { order: u.order })));
            showToast('Порядок збережено', 'success');
        } catch (e) {
            console.error(e);
            showToast('Помилка збереження порядку', 'error');
            loadData(); // Revert on error
        }
    };

    const handleSelectCourse = async (course) => {
        setSelectedCourse(course);
        const t = await eduApi.getTopics(course._id);
        const sortedTopics = t.sort((a, b) => a.order - b.order);
        setTopics(sortedTopics);
    };

    // --- MENU HANDLERS ---
    const handleMenuOpen = (event, type, item) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setMenuType(type);
        setActiveItem(item);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setActiveItem(null);
    };

    // --- DIALOG HANDLERS ---
    const openDialog = (type, item = null) => {
        setDialogType(type);
        setActiveItem(item);
        setDialogValue(item ? item.title || item.name : ''); // Handle title for course/topic, name for group
        setDialogDescription(item ? item.description || '' : ''); // Pre-fill description if exists
        setDialogOpen(true);
        setAnchorEl(null); // Close the menu but keep activeItem!
    };

    const handleDialogSubmit = async () => {
        if (!dialogValue) {
            showToast('Введіть назву!', 'warning');
            return;
        }

        try {
            if (dialogType === 'createCourse') {
                await eduApi.createCourse({
                    title: dialogValue,
                    description: dialogDescription
                });
                showToast('Курс створено', 'success');
                loadData();
            } else if (dialogType === 'editCourse') {
                const updated = await eduApi.updateCourse(activeItem._id, {
                    title: dialogValue,
                    description: dialogDescription
                });
                setCourses(prev => prev.map(c => c._id === updated._id ? updated : c));
                if (selectedCourse?._id === activeItem._id) setSelectedCourse(updated);
                showToast('Курс оновлено', 'success');
            } else if (dialogType === 'createTopic') {
                await eduApi.createTopic({
                    title: dialogValue,
                    course: selectedCourse._id,
                    order: topics.length + 1
                });
                const t = await eduApi.getTopics(selectedCourse._id);
                setTopics(t.sort((a, b) => a.order - b.order));
                showToast('Тему створено', 'success');
            } else if (dialogType === 'editTopic') {
                const updated = await eduApi.updateTopic(activeItem._id, { title: dialogValue });
                setTopics(prev => prev.map(t => t._id === updated._id ? updated : t));
                showToast('Тему змінено', 'success');
                showToast('Тему змінено', 'success');
            } else if (dialogType === 'editGroup') {
                const updated = await eduApi.updateGroup(activeItem._id, { name: dialogValue });
                setGroups(prev => prev.map(g => g._id === updated._id ? updated : g));
                if (selectedGroup?._id === activeItem._id) setSelectedGroup(updated); // Update selected
                showToast('Групу оновлено', 'success');
            } else if (dialogType === 'createGroup') { // NEW: Handle Create Group
                await eduApi.createGroup({ name: dialogValue });
                loadData();
                showToast('Групу створено', 'success');
            }
            setDialogOpen(false);
        } catch (e) {
            console.error(e);
            showToast('Помилка сервера', 'error');
        }
    };

    const handleDeleteFromMenu = async () => {
        if (!activeItem) return;

        let confirmMsg = 'Видалити цей елемент?';
        if (menuType === 'course') confirmMsg = 'Видалити цей курс?';
        if (menuType === 'topic') confirmMsg = 'Видалити цю тему?';
        if (menuType === 'group') confirmMsg = 'Видалити цю групу?';

        if (!window.confirm(confirmMsg)) return;

        try {
            if (menuType === 'course') {
                await eduApi.deleteCourse(activeItem._id);
                setCourses(prev => prev.filter(c => c._id !== activeItem._id));
                if (selectedCourse?._id === activeItem._id) setSelectedCourse(null);
            } else if (menuType === 'topic') {
                await eduApi.deleteTopic(activeItem._id);
                setTopics(prev => prev.filter(t => t._id !== activeItem._id));
            } else if (menuType === 'group') {
                await eduApi.deleteGroup(activeItem._id);
                setGroups(prev => prev.filter(g => g._id !== activeItem._id));
                if (selectedGroup?._id === activeItem._id) setSelectedGroup(null); // Deselect
            }
        } catch (e) {
            console.error(e);
        }
        handleMenuClose();
    };


    const handleToggleCourseInGroup = async (group, courseId) => {
        const currentCourses = group.courses || [];
        const courseIds = currentCourses.map(c => typeof c === 'object' ? c._id : c);
        let newCourses;
        if (courseIds.includes(courseId)) {
            newCourses = courseIds.filter(id => id !== courseId);
        } else {
            newCourses = [...courseIds, courseId];
        }
        await eduApi.updateGroup(group._id, { courses: newCourses });
        const updatedGroup = { ...group, courses: newCourses };
        setGroups(prev => prev.map(g => g._id === group._id ? updatedGroup : g));
        if (selectedGroup?._id === group._id) setSelectedGroup(updatedGroup);
    };

    // Group creation needs its own simple logic or dialog reuse
    const [newGroupName, setNewGroupName] = useState('');
    const handleCreateGroup = async () => {
        // Deprecated in favor of Dialog
    };

    const handleSelectGroup = (group) => {
        setSelectedGroup(group);
    };

    const theme = useTheme();

    return (
        <Box sx={{ p: 1 }}>
            {/* Top Navigation */}
            <Paper
                className="glass-panel"
                sx={{
                    mb: 4, p: 1,
                    display: 'flex', gap: 1,
                    borderRadius: 3,
                    background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
                }}
            >
                <Button
                    sx={{ borderRadius: 2, flex: 1, py: 1.5 }}
                    variant={activeTab === 'courses' ? 'contained' : 'text'}
                    onClick={() => setActiveTab('courses')}
                    startIcon={<School />}
                >
                    Курси та Програма
                </Button>
                <Button
                    sx={{ borderRadius: 2, flex: 1, py: 1.5 }}
                    variant={activeTab === 'groups' ? 'contained' : 'text'}
                    onClick={() => setActiveTab('groups')}
                    startIcon={<Class />}
                >
                    Групи та Доступи
                </Button>
            </Paper>

            {/* --- COURSES VIEW --- */}
            {activeTab === 'courses' && (
                <Grid container spacing={3}>
                    {/* LEFT SIDEBAR: Course List */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Ваші Курси</Typography>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<Add />}
                                onClick={() => openDialog('createCourse')}
                                sx={{ bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                            >
                                Створити
                            </Button>
                        </Box>

                        <Box sx={{ display: 'grid', gap: 2 }}>
                            {courses.map(course => (
                                <Paper
                                    key={course._id}
                                    className="glass-panel"
                                    onClick={() => handleSelectCourse(course)}
                                    sx={{
                                        p: 2,
                                        cursor: 'pointer',
                                        borderRadius: 1, // Sharper
                                        background: selectedCourse?._id === course._id
                                            ? `linear-gradient(135deg, ${theme.palette.primary.main}33 0%, ${theme.palette.secondary.main}1a 100%)`
                                            : theme.palette.background.paper,
                                        border: selectedCourse?._id === course._id
                                            ? `1px solid ${theme.palette.primary.main}80`
                                            : '1px solid rgba(255,255,255,0.05)',
                                        transition: 'all 0.2s',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            bgcolor: 'rgba(255,255,255,0.05)',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Box sx={{
                                            mr: 2,
                                            p: 1,
                                            borderRadius: '4px', // Sharper
                                            bgcolor: selectedCourse?._id === course._id ? `${theme.palette.primary.main}4d` : 'rgba(255,255,255,0.05)',
                                            color: selectedCourse?._id === course._id ? '#fff' : theme.palette.text.secondary
                                        }}>
                                            <FolderOpen fontSize="small" />
                                        </Box>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: selectedCourse?._id === course._id ? '#fff' : theme.palette.text.primary }}>
                                                {course.title}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', lineHeight: 1.2 }}>
                                                {course.description ? (course.description.length > 40 ? course.description.substring(0, 40) + '...' : course.description) : 'No description'}
                                            </Typography>
                                        </Box>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleMenuOpen(e, 'course', course)}
                                            sx={{
                                                color: 'rgba(255,255,255,0.3)',
                                                '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' }
                                            }}
                                        >
                                            <MoreVert fontSize="small" />
                                        </IconButton>
                                    </Box>

                                    {/* Decorative Active Indicator */}
                                    {selectedCourse?._id === course._id && (
                                        <Box sx={{
                                            position: 'absolute',
                                            left: 0, top: 0, bottom: 0, width: 4,
                                            bgcolor: '#8b5cf6'
                                        }} />
                                    )}
                                </Paper>
                            ))}
                            {courses.length === 0 && (
                                <Box sx={{
                                    p: 4, textAlign: 'center', color: '#64748b',
                                    border: '2px dashed rgba(255,255,255,0.05)', borderRadius: 4
                                }}>
                                    <School sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
                                    <Typography>Список курсів порожній</Typography>
                                </Box>
                            )}
                        </Box>
                    </Grid>

                    {/* RIGHT CONTENT: Topics Manager */}
                    <Grid item xs={12} md={8}>
                        {selectedCourse ? (
                            <Box className="animate-fade-in">
                                <Paper
                                    className="glass-panel"
                                    sx={{
                                        p: 3, mb: 3,
                                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
                                        border: '1px solid rgba(139, 92, 246, 0.2)'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="overline" color="secondary" sx={{ letterSpacing: 2 }}>Активний курс</Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#fff' }}>{selectedCourse.title}</Typography>
                                            {selectedCourse.description && (
                                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>{selectedCourse.description}</Typography>
                                            )}
                                        </Box>
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            startIcon={<Add />}
                                            onClick={() => openDialog('createTopic')}
                                        >
                                            Нова Тема
                                        </Button>
                                    </Box>
                                </Paper>

                                {/* Topics List with Drag & Drop */}
                                <DragDropContext onDragEnd={handleDragEnd}>
                                    <Droppable droppableId="topics-list">
                                        {(provided) => (
                                            <Box
                                                sx={{ display: 'grid', gap: 2 }}
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                            >
                                                {topics.map((topic, index) => {
                                                    const topicTasks = tasks.filter(t => t.topic === topic._id);
                                                    return (
                                                        <Draggable key={topic._id} draggableId={topic._id} index={index}>
                                                            {(provided, snapshot) => (
                                                                <Paper
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    sx={{
                                                                        p: 0,
                                                                        bgcolor: 'rgba(20, 20, 30, 0.6)',
                                                                        backdropFilter: 'blur(10px)',
                                                                        borderRadius: 1, // Sharper
                                                                        border: '1px solid rgba(255,255,255,0.05)',
                                                                        overflow: 'hidden',
                                                                        transition: 'box-shadow 0.2s, background-color 0.2s', // Removed 'all' to prevent dnd glitches
                                                                        '&:hover': { border: '1px solid rgba(255,255,255,0.1)' },
                                                                        ...provided.draggableProps.style, // Essential for dnd positioning
                                                                        ...(snapshot.isDragging ? {
                                                                            boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
                                                                            borderColor: theme.palette.primary.main,
                                                                            bgcolor: 'rgba(30, 41, 59, 0.9)'
                                                                        } : {})
                                                                    }}
                                                                >
                                                                    {/* Topic Header */}
                                                                    <Box sx={{
                                                                        p: 2,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'space-between',
                                                                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                                                                        bgcolor: 'rgba(255,255,255,0.02)'
                                                                    }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                            {/* Drag Handle */}
                                                                            <Box
                                                                                {...provided.dragHandleProps}
                                                                                sx={{
                                                                                    cursor: 'grab',
                                                                                    color: '#64748b',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    '&:hover': { color: '#fff' }
                                                                                }}
                                                                            >
                                                                                <DragIndicator fontSize="small" />
                                                                            </Box>

                                                                            <Box sx={{
                                                                                width: 28, height: 28,
                                                                                borderRadius: '4px', // Sharper
                                                                                bgcolor: 'rgba(59, 130, 246, 0.1)',
                                                                                color: '#3b82f6',
                                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                fontWeight: 'bold', fontSize: '0.8rem'
                                                                            }}>
                                                                                {index + 1}
                                                                            </Box>
                                                                            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>
                                                                                {topic.title}
                                                                            </Typography>
                                                                            <Chip label={`${topicTasks.length} tasks`} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(255,255,255,0.05)', color: '#64748b', borderRadius: '4px' }} />
                                                                        </Box>

                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={(e) => handleMenuOpen(e, 'topic', topic)}
                                                                            sx={{ color: '#64748b', '&:hover': { color: '#fff' } }}
                                                                        >
                                                                            <MoreVert fontSize="small" />
                                                                        </IconButton>
                                                                    </Box>

                                                                    {/* Topic Content */}
                                                                    <Box sx={{ p: 2 }}>
                                                                        {/* Task Grid */}
                                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
                                                                            {topicTasks.length > 0 ? topicTasks.map(task => (
                                                                                <Paper
                                                                                    key={task._id}
                                                                                    elevation={0}
                                                                                    sx={{
                                                                                        display: 'flex', alignItems: 'center', gap: 1,
                                                                                        pl: 1.5, pr: 1, py: 0.75,
                                                                                        bgcolor: 'rgba(30, 41, 59, 0.5)',
                                                                                        borderRadius: '4px', // Sharper
                                                                                        border: '1px solid rgba(255,255,255,0.05)',
                                                                                        transition: 'all 0.2s',
                                                                                        '&:hover': {
                                                                                            bgcolor: 'rgba(30, 41, 59, 0.8)',
                                                                                            transform: 'translateY(-1px)',
                                                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <Assignment sx={{ fontSize: 16, color: '#3b82f6' }} />
                                                                                    <Typography variant="body2" sx={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{task.name}</Typography>
                                                                                    <IconButton
                                                                                        size="small"
                                                                                        onClick={() => handleAssignTaskToTopic(task._id, null)}
                                                                                        sx={{
                                                                                            ml: 0.5, p: 0.25,
                                                                                            color: '#ef4444', opacity: 0,
                                                                                            transition: 'opacity 0.2s',
                                                                                            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' },
                                                                                            '.MuiPaper-root:hover &': { opacity: 0.5 },
                                                                                            '.MuiPaper-root:hover &:hover': { opacity: 1 }
                                                                                        }}
                                                                                    >
                                                                                        <Delete fontSize="inherit" />
                                                                                    </IconButton>
                                                                                </Paper>
                                                                            )) : (
                                                                                <Box sx={{
                                                                                    width: '100%', py: 3,
                                                                                    border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 2,
                                                                                    textAlign: 'center'
                                                                                }}>
                                                                                    <Typography variant="caption" sx={{ color: '#64748b', fontStyle: 'italic' }}>
                                                                                        У цій темі немає завдань
                                                                                    </Typography>
                                                                                </Box>
                                                                            )}
                                                                        </Box>

                                                                        {/* Add Task Quick Select */}
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                            <FormControl size="small" fullWidth sx={{
                                                                                '& .MuiOutlinedInput-root': {
                                                                                    bgcolor: 'rgba(0,0,0,0.2)',
                                                                                    borderRadius: 2,
                                                                                    color: '#cbd5e1',
                                                                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.05)' },
                                                                                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.1)' }
                                                                                },
                                                                                '& .MuiInputLabel-root': { color: '#64748b', fontSize: '0.85rem' }
                                                                            }}>
                                                                                <InputLabel>+ Прив'язати завдання</InputLabel>
                                                                                <Select
                                                                                    label="+ Прив'язати завдання"
                                                                                    value=""
                                                                                    onChange={(e) => handleAssignTaskToTopic(e.target.value, topic._id)}
                                                                                >
                                                                                    {tasks.filter(t => t.topic !== topic._id).map(t => (
                                                                                        <MenuItem key={t._id} value={t._id} sx={{ fontSize: '0.9rem' }}>
                                                                                            {t.name}
                                                                                            {t.topic && <Typography variant="caption" sx={{ ml: 1, color: '#94a3b8' }}>(в іншій темі)</Typography>}
                                                                                        </MenuItem>
                                                                                    ))}
                                                                                </Select>
                                                                            </FormControl>
                                                                        </Box>
                                                                    </Box>
                                                                </Paper>
                                                            )}
                                                        </Draggable>
                                                    );
                                                })}
                                                {provided.placeholder}

                                                {topics.length === 0 && (
                                                    <Box sx={{ textAlign: 'center', py: 8, color: '#64748b', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: 4 }}>
                                                        <Topic sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                                                        <Typography>В цьому курсі ще немає тем</Typography>
                                                        <Button
                                                            onClick={() => openDialog('createTopic')}
                                                            sx={{ mt: 2, color: '#8b5cf6', borderColor: 'rgba(139, 92, 246, 0.3)' }}
                                                            variant="outlined"
                                                        >
                                                            Створити першу тему
                                                        </Button>
                                                    </Box>
                                                )}
                                            </Box>
                                        )}
                                    </Droppable>
                                </DragDropContext>

                            </Box>
                        ) : (
                            <Box sx={{
                                height: '100%', display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                color: '#64748b', opacity: 0.7
                            }}>
                                <School sx={{ fontSize: 80, mb: 2, color: 'rgba(255,255,255,0.05)' }} />
                                <Typography variant="h6">Оберіть курс для налаштування</Typography>
                                <Typography variant="body2">Список курсів знаходиться зліва</Typography>
                            </Box>
                        )}
                    </Grid>
                </Grid>
            )}

            {/* --- GROUPS VIEW --- */}
            {activeTab === 'groups' && (
                <Grid container spacing={3}>
                    {/* LEFT SIDEBAR: Group List */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                                Групи доступу
                            </Typography>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<Add />}
                                onClick={() => openDialog('createGroup')}
                                sx={{ bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                            >
                                Створити
                            </Button>
                        </Box>

                        <Box sx={{ display: 'grid', gap: 2 }}>
                            {groups.map(group => (
                                <Paper
                                    key={group._id}
                                    className="glass-panel"
                                    onClick={() => handleSelectGroup(group)}
                                    sx={{
                                        p: 2,
                                        cursor: 'pointer',
                                        borderRadius: 1,
                                        background: selectedGroup?._id === group._id
                                            ? `linear-gradient(135deg, ${theme.palette.primary.main}33 0%, ${theme.palette.secondary.main}1a 100%)`
                                            : theme.palette.background.paper,
                                        border: selectedGroup?._id === group._id
                                            ? `1px solid ${theme.palette.primary.main}80`
                                            : '1px solid rgba(255,255,255,0.05)',
                                        transition: 'all 0.2s',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            bgcolor: 'rgba(255,255,255,0.05)',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Box sx={{
                                            mr: 2,
                                            p: 1,
                                            borderRadius: '4px',
                                            bgcolor: selectedGroup?._id === group._id ? `${theme.palette.primary.main}4d` : 'rgba(255,255,255,0.05)',
                                            color: selectedGroup?._id === group._id ? '#fff' : theme.palette.text.secondary
                                        }}>
                                            <Class fontSize="small" />
                                        </Box>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: selectedGroup?._id === group._id ? '#fff' : theme.palette.text.primary }}>
                                                {group.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                                {group.courses?.length || 0} курсів
                                            </Typography>
                                        </Box>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleMenuOpen(e, 'group', group)}
                                            sx={{
                                                color: 'rgba(255,255,255,0.3)',
                                                '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' }
                                            }}
                                        >
                                            <MoreVert fontSize="small" />
                                        </IconButton>
                                    </Box>
                                    {selectedGroup?._id === group._id && (
                                        <Box sx={{
                                            position: 'absolute',
                                            left: 0, top: 0, bottom: 0, width: 4,
                                            bgcolor: '#8b5cf6'
                                        }} />
                                    )}
                                </Paper>
                            ))}
                        </Box>
                    </Grid>

                    {/* RIGHT PANEL: Group Details */}
                    <Grid item xs={12} md={8}>
                        {selectedGroup ? (
                            <Box className="animate-fade-in">
                                <Paper
                                    className="glass-panel"
                                    sx={{
                                        p: 3, mb: 3,
                                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
                                        border: '1px solid rgba(139, 92, 246, 0.2)'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="overline" color="secondary" sx={{ letterSpacing: 2 }}>Налаштування групи</Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#fff' }}>{selectedGroup.name}</Typography>
                                        </Box>
                                        <Button
                                            variant="outlined"
                                            startIcon={<Edit />}
                                            onClick={() => openDialog('editGroup', selectedGroup)}
                                            sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                                        >
                                            Змінити назву
                                        </Button>
                                    </Box>
                                </Paper>

                                <Typography variant="h6" sx={{ mb: 2, color: '#94a3b8' }}>Доступні курси</Typography>

                                <Grid container spacing={2}>
                                    {courses.map(course => {
                                        const isAssigned = selectedGroup.courses.some(c => (c._id || c) === course._id);
                                        return (
                                            <Grid item xs={12} sm={6} key={course._id}>
                                                <Paper
                                                    onClick={() => handleToggleCourseInGroup(selectedGroup, course._id)}
                                                    sx={{
                                                        p: 2,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        bgcolor: isAssigned ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)',
                                                        border: isAssigned ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            bgcolor: isAssigned ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                                            transform: 'translateY(-2px)'
                                                        }
                                                    }}
                                                >
                                                    <Box sx={{
                                                        mr: 2,
                                                        color: isAssigned ? '#34d399' : '#64748b'
                                                    }}>
                                                        {isAssigned ? <Assignment /> : <School />}
                                                    </Box>
                                                    <Box sx={{ flexGrow: 1 }}>
                                                        <Typography variant="body1" sx={{ color: isAssigned ? '#fff' : '#94a3b8', fontWeight: isAssigned ? 600 : 400 }}>
                                                            {course.title}
                                                        </Typography>
                                                    </Box>
                                                    {isAssigned && (
                                                        <Box sx={{
                                                            width: 8, height: 8, borderRadius: '50%',
                                                            bgcolor: '#34d399', boxShadow: '0 0 10px #34d399'
                                                        }} />
                                                    )}
                                                </Paper>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </Box>
                        ) : (
                            <Box sx={{
                                height: '100%', display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                color: '#64748b', opacity: 0.7,
                                minHeight: 400
                            }}>
                                <Class sx={{ fontSize: 80, mb: 2, color: 'rgba(255,255,255,0.05)' }} />
                                <Typography variant="h6">Оберіть групу</Typography>
                                <Typography variant="body2">Список груп знаходиться зліва</Typography>
                            </Box>
                        )}
                    </Grid>
                </Grid>
            )}

            {/* --- SHARED DIALOGS & MENUS --- */}

            {/* Context Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        bgcolor: '#1e1e24', color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                    }
                }}
            >
                <ContextMenuItem onClick={() => {
                    if (menuType === 'course') openDialog('editCourse', activeItem);
                    else if (menuType === 'topic') openDialog('editTopic', activeItem);
                    else if (menuType === 'group') openDialog('editGroup', activeItem);
                }}>
                    <ListItemIcon><Edit fontSize="small" sx={{ color: '#fff' }} /></ListItemIcon>
                    Редагувати
                </ContextMenuItem>
                <ContextMenuItem onClick={handleDeleteFromMenu} sx={{ color: '#ef4444' }}>
                    <ListItemIcon><Delete fontSize="small" sx={{ color: '#ef4444' }} /></ListItemIcon>
                    Видалити
                </ContextMenuItem>
            </Menu>

            {/* Input Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                PaperProps={{
                    sx: {
                        bgcolor: '#18181b', color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                        minWidth: 400
                    }
                }}
            >
                <DialogTitle>
                    {dialogType === 'createCourse' && 'Новий Курс'}
                    {dialogType === 'editCourse' && 'Редагувати Курс'}
                    {dialogType === 'createTopic' && 'Нова Тема'}
                    {dialogType === 'editTopic' && 'Редагувати Тему'}
                    {dialogType === 'editGroup' && 'Редагувати Групу'}
                    {dialogType === 'createGroup' && 'Нова Група'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Назва"
                        fullWidth
                        variant="outlined"
                        value={dialogValue}
                        onChange={(e) => setDialogValue(e.target.value)}
                        sx={{
                            mt: 1,
                            '& .MuiInputLabel-root': { color: '#94a3b8' },
                            '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } }
                        }}
                    />
                    {/* NEW DESCRIPTION FIELD FOR COURSES ONLY */}
                    {(dialogType === 'createCourse' || dialogType === 'editCourse') && (
                        <TextField
                            margin="dense"
                            label="Опис курсу"
                            fullWidth
                            multiline
                            rows={3}
                            variant="outlined"
                            value={dialogDescription}
                            onChange={(e) => setDialogDescription(e.target.value)}
                            sx={{
                                mt: 2,
                                '& .MuiInputLabel-root': { color: '#94a3b8' },
                                '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } }
                            }}
                        />
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ color: '#94a3b8' }}>Скасувати</Button>
                    <Button onClick={handleDialogSubmit} variant="contained">Зберегти</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default EducationManager;
