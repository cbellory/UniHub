import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, CircularProgress, Alert,
  Paper, Divider, Chip, IconButton, Grid
} from '@mui/material';
import { Delete, CheckCircle, PauseCircleFilled } from '@mui/icons-material';
import { createProposal, getProposals, closeProposal, deleteProposal } from '../services/daoApi';

const DaoManager = () => {
  const [proposals, setProposals] = useState([]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [choices, setChoices] = useState('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load proposals on mount
  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    setFetching(true);
    try {
      const data = await getProposals();
      setProposals(data);
    } catch (err) {
      console.error("Failed to load proposals", err);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const choicesArray = choices.split(',')
      .map(choice => choice.trim())
      .filter(choice => choice.length > 0);

    if (choicesArray.length < 2) {
      setError('Необхідно вказати мінімум 2 варіанти вибору, розділених комою.');
      setLoading(false);
      return;
    }

    try {
      await createProposal(title, description, choicesArray);
      setSuccess('Голосування успішно створено!');
      setTitle('');
      setDescription('');
      setChoices('');
      loadProposals(); // Refresh list
    } catch (err) {
      setError(err.message || 'Сталася невідома помилка.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (id) => {
    if (!window.confirm("Ви дійсно хочете завершити це голосування?")) return;
    try {
      await closeProposal(id);
      loadProposals();
    } catch (err) {
      alert("Не вдалося завершити голосування: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Видалити це голосування? Ця дія незворотна.")) return;
    try {
      await deleteProposal(id);
      loadProposals();
    } catch (err) {
      alert("Не вдалося видалити: " + err.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
        Керування DAO
      </Typography>

      <Grid container spacing={4}>
        {/* LEFT COLUMN: CREATE FORM */}
        <Grid item xs={12} md={5}>
          <Paper className="glass-panel" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Створити нове голосування</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                label="Заголовок"
                fullWidth
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                margin="normal"
                variant="filled"
                InputProps={{ style: { color: '#fff' } }}
                InputLabelProps={{ style: { color: '#aaa' } }}
              />
              <TextField
                label="Опис"
                fullWidth
                required
                multiline
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                margin="normal"
                variant="filled"
                InputProps={{ style: { color: '#fff' } }}
                InputLabelProps={{ style: { color: '#aaa' } }}
              />
              <TextField
                label="Варіанти (через кому)"
                fullWidth
                required
                value={choices}
                onChange={(e) => setChoices(e.target.value)}
                helperText="Наприклад: Так, Ні, Утриматись"
                margin="normal"
                variant="filled"
                InputProps={{ style: { color: '#fff' } }}
                InputLabelProps={{ style: { color: '#aaa' }, sx: { color: '#aaa' } }}
                FormHelperTextProps={{ sx: { color: '#777' } }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                fullWidth
                sx={{ mt: 2, height: 48 }}
              >
                {loading ? <CircularProgress size={24} /> : "Створити"}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* RIGHT COLUMN: EXISTING PROPOSALS */}
        <Grid item xs={12} md={7}>
          <Typography variant="h6" gutterBottom sx={{ color: '#fff', mb: 2 }}>
            Активні та Архівні голосування
          </Typography>

          {fetching ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {proposals.length === 0 && <Typography sx={{ color: '#aaa' }}>Голосувань немає.</Typography>}

              {proposals.map((prop) => (
                <Paper key={prop._id} className="glass-panel" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#fff' }}>{prop.title}</Typography>
                      <Chip
                        label={prop.isActive ? "ACTIVE" : "CLOSED"}
                        color={prop.isActive ? "success" : "default"}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                      {prop.description.substring(0, 80)}{prop.description.length > 80 ? '...' : ''}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#777' }}>
                      Всього голосів: {prop.choices.reduce((acc, c) => acc + c.votes, 0)} | Учасників: {prop.voters.length}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {prop.isActive && (
                      <Button
                        variant="outlined"
                        color="warning"
                        size="small"
                        onClick={() => handleClose(prop._id)}
                        startIcon={<PauseCircleFilled />}
                      >
                        Завершити
                      </Button>
                    )}
                    <IconButton color="error" onClick={() => handleDelete(prop._id)}>
                      <Delete />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default DaoManager;