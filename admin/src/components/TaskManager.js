import React, { useState, useEffect, useMemo } from 'react';
import {
  Slider, Autocomplete, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Box, Typography, Button, Select, MenuItem, FormControl, InputLabel,
  Grid, IconButton
} from '@mui/material';
import { Download, Search, Add, Delete, CheckCircle } from '@mui/icons-material';

const TaskManager = ({
  tasks,
  onEditTask,
  onAddTask,
  onDeleteTask,
  editingTask,
  onCancelTaskEdit,
  onSaveTask,
}) => {
  const [taskData, setTaskData] = useState(editingTask || {});

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterTags, setFilterTags] = useState([]);
  const [filterPointsRange, setFilterPointsRange] = useState([0, 5000]);

  useEffect(() => {
    setTaskData(
      editingTask || { name: '', url: '', points: 0, secretCode: '', description: '', tags: '', type: 'auto', quizData: [] }
    );
  }, [editingTask]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Special handling for points to be number
    const newValue = name === 'points' ? (value === '' ? '' : Number(value)) : value;
    setTaskData({ ...taskData, [name]: newValue });
  };

  // --- QUIZ EDITOR LOGIC ---
  const addQuestion = () => {
    const newQ = { question: '', options: ['', '', '', ''], correctIndex: 0 };
    setTaskData({ ...taskData, quizData: [...(taskData.quizData || []), newQ] });
  };

  const removeQuestion = (idx) => {
    const newData = [...(taskData.quizData || [])];
    newData.splice(idx, 1);
    setTaskData({ ...taskData, quizData: newData });
  };

  const updateQuestion = (idx, field, value) => {
    const newData = [...(taskData.quizData || [])];
    newData[idx][field] = value;
    setTaskData({ ...taskData, quizData: newData });
  };

  const updateOption = (qIdx, oIdx, value) => {
    const newData = [...(taskData.quizData || [])];
    newData[qIdx].options[oIdx] = value;
    setTaskData({ ...taskData, quizData: newData });
  };

  const handleSave = () => onSaveTask(taskData);

  // Helper to generate a color from string
  const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  };

  const getTagStyle = (tag) => {
    const color = stringToColor(tag);
    const r = parseInt(color.substring(1, 3), 16);
    const g = parseInt(color.substring(3, 5), 16);
    const b = parseInt(color.substring(5, 7), 16);
    return {
      fontSize: '0.75rem',
      background: `rgba(${r}, ${g}, ${b}, 0.15)`,
      color: `rgb(${Math.min(r + 100, 255)}, ${Math.min(g + 100, 255)}, ${Math.min(b + 100, 255)})`,
      padding: '2px 8px',
      borderRadius: '4px',
      border: `1px solid rgba(${r}, ${g}, ${b}, 0.3)`
    };
  };

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

  const filteredTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];

    return tasks.filter(task => {
      // 1. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = task.name?.toLowerCase().includes(q) || task.description?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Filter Type
      if (filterType !== 'all' && task.type !== filterType) return false;

      // 3. Points Range Filter
      const points = task.points || 0;
      if (points < filterPointsRange[0] || points > filterPointsRange[1]) {
        return false;
      }

      // 4. Tags Filter (OR logic)
      if (filterTags.length > 0) {
        if (!task.tags || task.tags.length === 0) return false;
        const hasTag = task.tags.some(t => filterTags.includes(t));
        if (!hasTag) return false;
      }

      return true;
    });
  }, [tasks, searchQuery, filterType, filterPointsRange, filterTags]);

  const handleExportCSV = () => {
    const headers = ['Name', 'Points', 'Type', 'Description', 'Tags', 'URL'];
    const csvRows = filteredTasks.map(t => [
      `"${t.name || ''}"`,
      t.points,
      t.type,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(Array.isArray(t.tags) ? t.tags.join(', ') : t.tags || '')}"`,
      t.url
    ]);

    const csvContent = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasks_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="task-manager">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>Керування завданнями</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onAddTask}
          sx={{ bgcolor: '#8b5cf6' }}
        >
          Додати завдання
        </Button>
      </Box>

      {/* FILTER PANEL */}
      <Box className="glass-panel" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#fff' }}>Фільтри та Пошук</Typography>
          <Button startIcon={<Download />} onClick={handleExportCSV} sx={{ color: '#60a5fa' }}>Експорт CSV</Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {/* Search */}
          <TextField
            placeholder="Пошук завдань (Назва, Опис)"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flex: 1, minWidth: 250, '& .MuiOutlinedInput-root': { color: '#fff' } }}
            InputProps={{ startAdornment: <Search sx={{ color: '#94a3b8', mr: 1 }} /> }}
          />

          {/* Type Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: '#94a3b8' }}>Тип завданння</InputLabel>
            <Select
              value={filterType}
              label="Тип завданння"
              onChange={(e) => setFilterType(e.target.value)}
              sx={{ color: '#fff', '& .MuiSelect-icon': { color: '#fff' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
            >
              <MenuItem value="all">Всі типи</MenuItem>
              <MenuItem value="auto">Автоматичні</MenuItem>
              <MenuItem value="manual">Ручні</MenuItem>
              <MenuItem value="manual">Ручні</MenuItem>
              <MenuItem value="code">Код</MenuItem>
              <MenuItem value="quiz">Тест</MenuItem>
            </Select>
          </FormControl>

          {/* Slider */}
          <Box sx={{ width: 200, px: 1 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>Бали: {filterPointsRange[0]} - {filterPointsRange[1]}</Typography>
            <Slider
              value={filterPointsRange}
              onChange={(e, val) => setFilterPointsRange(val)}
              min={0} max={5000}
              size="small"
              sx={{ color: '#8b5cf6' }}
            />
          </Box>

          {/* Tags */}
          <Autocomplete
            multiple
            options={uniqueTags}
            value={filterTags}
            onChange={(e, val) => setFilterTags(val)}
            renderInput={(params) => <TextField {...params} label="Теги" size="small" sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94a3b8' } }} />}
            renderTags={(value, getTagProps) => value.map((option, index) => <Chip label={option} {...getTagProps({ index })} size="small" sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#fff' }} />)}
          />
        </Box>
      </Box>

      {/* TASKS GRID */}
      <div className="task-grid">
        {filteredTasks.map((task) => (
          <div key={task.id || task._id} className="task-card glass-panel">
            <div className="task-img-container">
              {task.imageUrl ? (
                <img
                  src={task.imageUrl.startsWith('/uploads') ? (task.imageUrl.startsWith('http') ? task.imageUrl : (task.imageUrl.startsWith('/') ? task.imageUrl : `/${task.imageUrl}`)) : task.imageUrl}
                  alt={task.name}
                  className="task-img"
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#1c1c1e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>NO IMAGE</div>
              )}
            </div>

            <div className="task-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 className="task-title">{task.name}</h3>
                <span className="task-points">{task.points} XP</span>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <Chip label={task.type || 'auto'} size="small" sx={{ height: 20, bgcolor: '#333', color: '#aaa', fontSize: '0.7rem' }} />
                {Array.isArray(task.tags) && task.tags.map((tag, idx) => (
                  <span key={idx} style={getTagStyle(tag)}>#{tag}</span>
                ))}
              </div>

              <p className="text-muted text-small" style={{ marginBottom: 16, flex: 1 }}>
                {task.description ? (task.description.length > 60 ? task.description.slice(0, 60) + '...' : task.description) : 'No description'}
              </p>

              <div className="btn-row" style={{ marginTop: 'auto' }}>
                <button onClick={() => onEditTask(task)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Edit</button>
                <button onClick={() => onDeleteTask(task.id || task._id)} className="btn btn-danger" style={{ padding: '10px' }}>✕</button>
              </div>
            </div>
          </div>
        ))}
        {filteredTasks.length === 0 && (
          <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 8, color: '#64748b', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
            <Search sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography>Завдання не знайдено</Typography>
          </Box>
        )}
      </div>

      {/* EDIT DIALOG */}
      <Dialog
        open={!!editingTask}
        onClose={onCancelTaskEdit}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: '#18181b',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fafafa'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {taskData._id ? 'Редагувати завдання' : 'Додати завдання'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Назва" name="name" fullWidth value={taskData.name || ''} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { color: '#fff' } }} />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Бали (XP)" name="points" type="number" fullWidth value={taskData.points ?? ''} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { color: '#fff' } }} />
              <FormControl fullWidth>
                <InputLabel>Тип</InputLabel>
                <Select name="type" label="Тип" value={taskData.type || 'auto'} onChange={handleChange} sx={{ color: '#fff' }}>
                  <MenuItem value="auto">Автоматично</MenuItem>
                  <MenuItem value="code">Секретний код</MenuItem>
                  <MenuItem value="manual">Ручна перевірка</MenuItem>
                  <MenuItem value="quiz">Тест (Quiz)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* QUIZ EDITOR UI */}
            {taskData.type === 'quiz' && (
              <Box sx={{ border: '1px solid #4ade80', borderRadius: 2, p: 2, bgcolor: 'rgba(74, 222, 128, 0.05)' }}>
                <Typography variant="h6" sx={{ color: '#4ade80', mb: 2 }}>Редактор тесту</Typography>

                {(taskData.quizData || []).map((q, qIdx) => (
                  <Box key={qIdx} sx={{ mb: 3, p: 2, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Typography sx={{ color: '#aaa', pt: 1 }}>#{qIdx + 1}</Typography>
                      <TextField
                        fullWidth size="small"
                        label="Запитання"
                        value={q.question}
                        onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { color: '#fff' } }}
                      />
                      <IconButton onClick={() => removeQuestion(qIdx)} sx={{ color: '#ef4444' }}><Delete /></IconButton>
                    </Box>

                    <Grid container spacing={1}>
                      {q.options.map((opt, oIdx) => (
                        <Grid item xs={6} key={oIdx}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                              onClick={() => updateQuestion(qIdx, 'correctIndex', oIdx)}
                              sx={{ color: q.correctIndex === oIdx ? '#4ade80' : '#555' }}
                            >
                              <CheckCircle />
                            </IconButton>
                            <TextField
                              fullWidth size="small"
                              placeholder={`Варіант ${oIdx + 1}`}
                              value={opt}
                              onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  color: q.correctIndex === oIdx ? '#4ade80' : '#ddd',
                                  borderColor: q.correctIndex === oIdx ? '#4ade80' : 'inherit'
                                }
                              }}
                            />
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ))}

                <Button startIcon={<Add />} onClick={addQuestion} variant="outlined" fullWidth sx={{ color: '#4ade80', borderColor: '#4ade80' }}>
                  Додати запитання
                </Button>
              </Box>
            )}

            <TextField label="Посилання (URL)" name="url" fullWidth value={taskData.url || ''} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { color: '#fff' } }} />
            <TextField label="Опис" name="description" multiline rows={3} fullWidth value={taskData.description || ''} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { color: '#fff' } }} />

            <Box>
              <TextField label="Теги (через кому)" name="tags" fullWidth value={Array.isArray(taskData.tags) ? taskData.tags.join(', ') : (taskData.tags || '')} onChange={(e) => setTaskData({ ...taskData, tags: e.target.value.split(',').map(s => s.trim()) })} sx={{ '& .MuiOutlinedInput-root': { color: '#fff' } }} />
              <Typography variant="caption" sx={{ color: '#64748b', ml: 1 }}>Напр: youtube, daily, start</Typography>
            </Box>

            {taskData.type === 'code' && (
              <TextField label="Секретний код (для типу Code)" name="secretCode" fullWidth value={taskData.secretCode || ''} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { color: '#fff' } }} />
            )}

            <Button variant="outlined" component="label" sx={{ color: '#94a3b8', borderColor: '#333' }}>
              {taskData.image ? `Обрано: ${taskData.image.name}` : 'Завантажити обкладинку'}
              <input type="file" hidden onChange={(e) => setTaskData({ ...taskData, image: e.target.files[0] })} />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button onClick={onCancelTaskEdit} sx={{ color: '#ef4444' }}>Скасувати</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#8b5cf6' }}>Зберегти</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TaskManager;
