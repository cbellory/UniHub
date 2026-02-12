import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Card, CardContent, CardActions, CardMedia,
  Button, Typography, Grid, Box,
  Modal, TextField, Slider, Autocomplete, Chip,
  Select, MenuItem, FormControl, InputLabel, Paper, Collapse, IconButton,
  useTheme, alpha
} from '@mui/material';
import { FilterList, ExpandMore, ExpandLess, Search, HelpOutline, CloudUpload } from '@mui/icons-material';
import { getTasks, completeTask, submitTaskReport } from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import SkillTree from './SkillTree';

const getTagStyle = (tag) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return {
    background: `hsla(${h}, 70%, 50%, 0.15)`,
    color: `hsl(${h}, 80%, 75%)`,
    border: `1px solid hsla(${h}, 70%, 50%, 0.3)`
  };
};

// --- SMART SEARCH COMPONENT ---
const HighlightedText = ({ text, highlight }) => {
  if (!highlight.trim()) return text;

  // Split query into terms and escape regex special chars
  const terms = highlight.split(/\s+/).filter(t => t.length > 0).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (terms.length === 0) return text;

  const regex = new RegExp(`(${terms.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} style={{ color: '#facc15', fontWeight: 'bold', textShadow: '0 0 5px rgba(250, 204, 21, 0.3)' }}>
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};

const FlatTaskList = ({ account }) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const [tasks, setTasks] = useState([]);
  const [tasksCompleted, setTasksCompleted] = useState({});
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filterTags, setFilterTags] = useState([]);
  const [filterPointsRange, setFilterPointsRange] = useState([0, 2000]);
  const [sortBy, setSortBy] = useState('recommended');

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Modal states
  const [openCodeModal, setOpenCodeModal] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [secretCode, setSecretCode] = useState("");
  const [currentTaskPoints, setCurrentTaskPoints] = useState(0);
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Manual Submission States
  const [openManualModal, setOpenManualModal] = useState(false);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFile, setSubmissionFile] = useState(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const walletAddress = account || "guest";

      // Prepare filters for API
      const filters = {};
      if (debouncedSearchQuery) filters.search = debouncedSearchQuery;
      if (filterTags.length > 0) filters.tags = filterTags;
      if (filterPointsRange[0] > 0 || filterPointsRange[1] < 2000) {
        filters.min_points = filterPointsRange[0];
        filters.max_points = filterPointsRange[1];
      }

      const tasksData = await getTasks(walletAddress, filters);
      if (tasksData) {
        setPoints(tasksData.points || 0);
        setTasks(tasksData.availableTasks || []);
        setTasksCompleted(tasksData.completedTasks?.reduce((acc, [taskId, isCompleted]) => {
          acc[taskId] = isCompleted;
          return acc;
        }, {}) || {});
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [account, debouncedSearchQuery, filterTags, filterPointsRange]);

  // Trigger load on filter change
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Unique tags for filter (from currently loaded tasks - dynamic)
  const uniqueTags = useMemo(() => {
    const tags = new Set();
    if (Array.isArray(tasks)) {
      tasks.forEach(task => {
        if (Array.isArray(task.tags)) {
          task.tags.forEach(tag => tags.add(tag));
        }
      });
    }
    return Array.from(tags);
  }, [tasks]);

  // Client-Side Sorting only (Server returns filtered list)
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Sorting
    result.sort((a, b) => {
      const isCompletedA = tasksCompleted[a._id] || false;
      const isCompletedB = tasksCompleted[b._id] || false;

      if (sortBy === 'recommended') {
        if (isCompletedA !== isCompletedB) return isCompletedA - isCompletedB;
        return b.points - a.points;
      }
      if (sortBy === 'points_desc') return b.points - a.points;
      if (sortBy === 'points_asc') return a.points - b.points;
      // if (sortBy === 'newest') ... (if we had created_at)
      return 0;
    });

    return result;
  }, [tasks, tasksCompleted, sortBy]);

  // Handlers
  const handleTaskClick = async (task) => {
    if (!account) {
      alert('Підключіть гаманець для виконання завдань');
      return;
    }

    // Open link if exists
    if (task.url) window.open(task.url, '_blank');

    // Handle Manual Verification Task
    if (task.type === 'manual') {
      setCurrentTaskId(task._id);
      setOpenManualModal(true);
      return;
    }

    // Handle Code Verification Task
    if (task.secretCode || task.type === 'code') {
      setCurrentTaskId(task._id);
      setCurrentTaskPoints(task.points);
      setOpenCodeModal(true);
    } else {
      // Auto Task
      try {
        await completeTask(account, task._id);
        setTasksCompleted(prev => ({ ...prev, [task._id]: true }));
        setPoints(prev => prev + task.points);
      } catch (error) {
        console.error("Error completing task:", error);
        alert("Не вдалося виконати завдання.");
      }
    }
  };

  const handleManualSubmit = async () => {
    if (!submissionFile && !submissionText) {
      alert("Будь ласка, додайте опис або файл.");
      return;
    }

    try {
      await submitTaskReport(account, currentTaskId, submissionText, submissionFile);
      alert("Звіт відправлено на перевірку адміністратору!");
      setOpenManualModal(false);
      setSubmissionText("");
      setSubmissionFile(null);
    } catch (error) {
      console.error("Submission error:", error);
      alert("Помилка при відправці: " + error.message);
    }
  };

  const handleCompleteTaskWithCode = async () => {
    if (!secretCode) {
      alert("Код не введено!");
      return;
    }
    try {
      await completeTask(account, currentTaskId, secretCode);
      setTasksCompleted(prev => ({ ...prev, [currentTaskId]: true }));
      setPoints(prev => prev + currentTaskPoints);
      handleCloseModal();
    } catch (error) {
      console.error("Error completing task with code:", error);
      alert("Не вдалося виконати завдання: невірний код.");
    }
  };

  const handleCloseModal = () => {
    setOpenCodeModal(false);
    setSecretCode("");
    setCurrentTaskId(null);

    setOpenManualModal(false);
    setSubmissionText("");
    setSubmissionFile(null);
  };

  const handleOpenDescriptionModal = (task) => {
    setSelectedTask(task);
    setDescriptionModalOpen(true);
  };

  if (loading) return <Typography padding={4} textAlign="center" color="text.secondary">SYNCING DATA...</Typography>;

  return (
    <Box sx={{ width: '100%' }}>

      {/* --- CONTROLS BAR --- */}
      <Paper sx={{
        p: 2, mb: 3,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        alignItems: 'center',
        background: theme.palette.background.paper,
        borderRadius: '16px'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, width: '100%' }}>
          <Search sx={{ color: 'text.secondary', mr: 1 }} />
          <TextField
            variant="standard"
            placeholder={t('searchTasks')}
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ disableUnderline: true, sx: { color: 'text.primary' } }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "contained" : "outlined"}
            size="small"
            color="secondary"
          >
            {t('filters')}
          </Button>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              displayEmpty
              variant="outlined"
              sx={{ borderRadius: '12px', height: '40px', color: 'text.primary' }}
            >
              <MenuItem value="recommended">{t('recommended')}</MenuItem>
              <MenuItem value="points_desc">{t('highestXP')}</MenuItem>
              <MenuItem value="points_asc">{t('lowestXP')}</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* --- EXPANDABLE FILTERS --- */}
      <Collapse in={showFilters}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: '16px', background: 'rgba(0,0,0,0.2)' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>{t('tagsDatabase')}</Typography>
              <Autocomplete
                multiple
                options={uniqueTags}
                value={filterTags}
                onChange={(event, newValue) => setFilterTags(newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                      sx={{
                        bgcolor: alpha(theme.palette.secondary.main, 0.2),
                        color: theme.palette.secondary.light,
                        borderColor: alpha(theme.palette.secondary.main, 0.3),
                        borderWidth: 1,
                        borderStyle: 'solid'
                      }}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} variant="standard" placeholder={t('selectTags')} />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('xpRange')}: {filterPointsRange[0]} - {filterPointsRange[1]}
              </Typography>
              <Slider
                value={filterPointsRange}
                onChange={(e, val) => setFilterPointsRange(val)}
                valueLabelDisplay="auto"
                min={0}
                max={2000}
                sx={{ color: 'primary.main' }}
              />
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* --- TASK GRID --- */}
      <Grid container spacing={2}>
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <Grid item xs={12} key={task._id} className="animate-fade-in">
              <Card
                className="glass-card"
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  background: 'rgba(30, 41, 59, 0.4) !important', // Ensure override
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                    borderColor: theme.palette.primary.main
                  }
                }}>
                {/* --- Task Image (if exists) --- */}
                {task.imageUrl && (
                  <Box sx={{
                    position: 'relative',
                    width: { xs: '100%', sm: '160px' },
                    height: { xs: '120px', sm: '120px' },
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    <CardMedia
                      component="img"
                      image={task.imageUrl}
                      alt={task.name}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'brightness(0.8)'
                      }}
                    />
                    {/* Gradient Overlay */}
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.3)} 0%, transparent 100%)`
                    }} />
                  </Box>
                )}

                {/* --- Left: XP Badge --- */}
                <Box sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '80px',
                  borderRight: { sm: `1px solid ${theme.palette.divider}` },
                  width: { xs: '100%', sm: 'auto' }
                }}>
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold', textShadow: '0 0 10px rgba(99,102,241,0.5)' }}>
                    {task.points}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{t('xp')}</Typography>
                </Box>

                {/* --- Middle: Content --- */}
                <CardContent sx={{ flexGrow: 1, py: 1.5, px: 2, textAlign: { xs: 'center', sm: 'left' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '0.95rem', flexGrow: 1 }}>
                      <HighlightedText text={task.name} highlight={searchQuery} />
                    </Typography>
                    {task.description && (
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDescriptionModal(task)}
                        sx={{
                          color: 'text.secondary',
                          '&:hover': {
                            color: 'primary.main',
                            bgcolor: alpha(theme.palette.primary.main, 0.1)
                          }
                        }}
                        title="View description"
                      >
                        <HelpOutline fontSize="small" />
                      </IconButton>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                    {task.tags && task.tags.slice(0, 3).map((tag, idx) => {
                      const style = getTagStyle(tag);
                      return (
                        <Chip
                          key={idx}
                          label={tag}
                          size="small"
                          sx={{
                            bgcolor: style.background,
                            color: style.color,
                            border: style.border,
                            fontWeight: 'bold',
                            fontSize: '0.65rem',
                            height: '20px'
                          }}
                        />
                      );
                    })}
                    {task.tags && task.tags.length > 3 && (
                      <Chip label={`+${task.tags.length - 3}`} size="small" sx={{ height: '20px', fontSize: '0.65rem' }} />
                    )}
                  </Box>
                </CardContent>

                {/* --- Right: Action --- */}
                <CardActions sx={{ p: 1.5, minWidth: '140px', justifyContent: 'center' }}>
                  {tasksCompleted[task._id] ? (
                    <Button
                      variant="outlined"
                      disabled
                      size="small"
                      fullWidth
                      sx={{
                        borderColor: 'success.main',
                        color: 'success.main',
                        fontSize: '0.75rem',
                        '&:disabled': { borderColor: 'rgba(74, 222, 128, 0.3)', color: 'rgba(74, 222, 128, 0.5)' }
                      }}
                    >
                      {t('completed')}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      fullWidth
                      onClick={() => handleTaskClick(task)}
                      sx={{ boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)' }}
                    >
                      {task.type === 'manual' ? 'VERIFY' : t('startTask')}
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Box sx={{ p: 8, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 4 }}>
              <Typography variant="h6" color="text.secondary">NO ACTIVE MISSIONS FOUND</Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* --- MANUAL SUBMISSION MODAL --- */}
      <Modal open={openManualModal} onClose={handleCloseModal}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: '#0f172a',
          border: '1px solid rgba(99, 102, 241, 0.5)',
          borderRadius: '24px',
          boxShadow: '0 0 50px rgba(99, 102, 241, 0.2)',
          p: 4,
          outline: 'none'
        }}>
          <Typography variant="h5" sx={{ mb: 2, color: 'primary.main', fontFamily: 'Orbitron', textAlign: 'center' }}>
            VERIFICATION REQUIRED
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', textAlign: 'center' }}>
            Attach proof of completion (screenshot, link, or description).
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            placeholder="Description or Link..."
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            sx={{ mb: 3, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1 }}
          />

          <Button
            component="label"
            variant="outlined"
            fullWidth
            sx={{ mb: 3, height: 50, borderStyle: 'dashed' }}
            startIcon={<CloudUpload />}
          >
            {submissionFile ? submissionFile.name : "Upload Screenshot"}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => setSubmissionFile(e.target.files[0])}
            />
          </Button>

          <Button variant="contained" onClick={handleManualSubmit} fullWidth size="large">
            SUBMIT FOR REVIEW
          </Button>
        </Box>
      </Modal>

      {/* --- CODE MODAL --- */}
      <Modal open={openCodeModal} onClose={handleCloseModal}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 350,
          bgcolor: 'background.default',
          border: '1px solid rgba(99, 102, 241, 0.5)',
          borderRadius: '24px',
          boxShadow: '0 0 50px rgba(99, 102, 241, 0.2)',
          p: 4,
          textAlign: 'center'
        }}>
          <Typography variant="h5" sx={{ mb: 2, color: 'primary.main', fontFamily: 'Orbitron' }}>
            SECURITY CHECK
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            Enter the mission secret code to verify completion.
          </Typography>

          <TextField
            fullWidth
            label="ACCESS CODE"
            variant="outlined"
            value={secretCode}
            onChange={(e) => setSecretCode(e.target.value)}
            sx={{ mb: 4 }}
            InputProps={{ sx: { fontFamily: 'monospace', letterSpacing: '2px', textAlign: 'center' } }}
          />

          <Button variant="contained" onClick={handleCompleteTaskWithCode} fullWidth size="large">
            VERIFY & CLAIM
          </Button>
        </Box>
      </Modal>

      {/* --- DETAILS MODAL --- */}
      <Modal open={descriptionModalOpen} onClose={() => setDescriptionModalOpen(false)}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '90%', maxWidth: '500px',
          bgcolor: '#0f172a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          p: 4
        }}>
          <Typography variant="h5" gutterBottom sx={{ fontFamily: 'Orbitron', color: '#fff' }}>
            {selectedTask?.name}
          </Typography>
          <Typography sx={{ mt: 2, whiteSpace: 'pre-wrap', color: 'text.secondary', lineHeight: 1.6 }}>
            {selectedTask ? (
              <HighlightedText text={selectedTask.description || "No description available."} highlight={searchQuery} />
            ) : "No description available."}
          </Typography>
          <Button onClick={() => setDescriptionModalOpen(false)} variant="outlined" sx={{ mt: 4, width: '100%' }}>
            CLOSE
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};



const TaskSystem = ({ account, profile }) => {
  if (profile?.group) {
    return <SkillTree groupName={profile.group} account={account} />;
  }
  return <FlatTaskList account={account} />;
};

export default TaskSystem;