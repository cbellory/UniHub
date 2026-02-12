import React, { useState, useEffect } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Button, TextField, Box, Typography, Grid, Paper } from '@mui/material'; // Added Grid, Paper
// Импортируем наши новые, чистые функции
import { fetchLevels, addLevel, updateLevel, deleteLevel } from '../services/battlePassApi';

const BattlePassAdmin = () => {
  const [levels, setLevels] = useState([]);
  const [editingLevel, setEditingLevel] = useState(null);
  const [newLevel, setNewLevel] = useState({ level: '', pointsRequired: '', reward: '' });

  useEffect(() => {
    loadLevels();
  }, []);

  const loadLevels = async () => {
    try {
      // Вызываем функцию без токена
      const data = await fetchLevels();
      setLevels(data);
    } catch (error) {
      console.error("Ошибка при загрузке уровней Battle Pass:", error);
    }
  };

  const handleSaveLevel = async () => {
    try {
      if (editingLevel) {
        // Вызываем функцию без токена
        await updateLevel(editingLevel._id, editingLevel);
      } else {
        // Вызываем функцию без токена
        await addLevel(newLevel);
        setNewLevel({ level: '', pointsRequired: '', reward: '' });
      }
      loadLevels(); // Обновляем список
      setEditingLevel(null);
    } catch (error) {
      console.error("Ошибка при сохранении уровня Battle Pass:", error);
    }
  };

  const handleEdit = (level) => {
    setEditingLevel({ ...level }); // Создаем копию, чтобы избежать мутаций
    setNewLevel({ level: '', pointsRequired: '', reward: '' }); // Сбрасываем форму добавления
  };

  const handleCancelEdit = () => {
    setEditingLevel(null);
  };

  const handleDelete = async (id) => {
    try {
      // Вызываем функцию без токена
      await deleteLevel(id);
      loadLevels();
    } catch (error) {
      console.error("Ошибка при удалении уровня Battle Pass:", error);
    }
  };

  // Обработчики для полей ввода, чтобы код был чище
  const handleInputChange = (e, isEditing) => {
    const { name, value } = e.target;
    if (isEditing) {
      setEditingLevel(prev => ({ ...prev, [name]: value }));
    } else {
      setNewLevel(prev => ({ ...prev, [name]: value }));
    }
  };


  // JSX верстка остается почти без изменений
  return (
    <Box sx={{ flexGrow: 1, p: 2 }}>
      <Grid container spacing={3}>
        {/* Left Column: Form */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {editingLevel ? 'Редагувати рівень' : 'Додати новий рівень'}
            </Typography>
            <Box component="form" noValidate autoComplete="off">
              <TextField
                name="level"
                label="Рівень"
                fullWidth
                value={editingLevel ? editingLevel.level : newLevel.level}
                onChange={(e) => handleInputChange(e, !!editingLevel)}
                margin="normal"
              />
              <TextField
                name="pointsRequired"
                label="Бали"
                fullWidth
                value={editingLevel ? editingLevel.pointsRequired : newLevel.pointsRequired}
                onChange={(e) => handleInputChange(e, !!editingLevel)}
                margin="normal"
              />
              <TextField
                name="reward"
                label="Нагорода"
                fullWidth
                value={editingLevel ? editingLevel.reward : newLevel.reward}
                onChange={(e) => handleInputChange(e, !!editingLevel)}
                margin="normal"
              />
              <Box mt={2}>
                <Button variant="contained" color="primary" onClick={handleSaveLevel} fullWidth>
                  {editingLevel ? 'Зберегти зміни' : 'Додати рівень'}
                </Button>
                {editingLevel && (
                  <Button variant="outlined" color="secondary" onClick={handleCancelEdit} fullWidth sx={{ mt: 1 }}>
                    Скасувати
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Table */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Список рівнів</Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Рівень</TableCell>
                  <TableCell>Необхідні бали</TableCell>
                  <TableCell>Нагорода</TableCell>
                  <TableCell>Дії</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {levels.map((level) => (
                  <TableRow key={level._id}>
                    <TableCell>{level.level}</TableCell>
                    <TableCell>{level.pointsRequired}</TableCell>
                    <TableCell>{level.reward}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => handleEdit(level)}>Редагувати</Button>
                      <Button size="small" color="error" onClick={() => handleDelete(level._id)}>Видалити</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BattlePassAdmin;