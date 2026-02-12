import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, LinearProgress, styled,
    Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Alert
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteIcon from '@mui/icons-material/Delete'; // Optional if we want to delete backups later
// import { useSnackbar } from 'notistack';
import apiClient from '../services/apiClient';

// Styled Cyberpunk Progress Bar
const CyberLinearProgress = styled(LinearProgress)(({ theme, ownerState }) => ({
    height: 6,
    borderRadius: 3,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    '& .MuiLinearProgress-bar': {
        borderRadius: 3,
        backgroundColor: ownerState.color === 'secondary' ? '#ff00ff' : '#00f2ff',
        boxShadow: `0 0 8px ${ownerState.color === 'secondary' ? '#ff00ff' : '#00f2ff'}`,
    },
}));

const BackupManager = () => {
    const [history, setHistory] = useState([]);
    const [nextBackup, setNextBackup] = useState(null);
    const [timeLeft, setTimeLeft] = useState('');
    // const { enqueueSnackbar } = useSnackbar();
    const [processingType, setProcessingType] = useState(null); // 'db' or 'project' or null

    // Restore states
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [availableBackups, setAvailableBackups] = useState([]);
    const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
    const [backupToRestore, setBackupToRestore] = useState(null);
    const [restoring, setRestoring] = useState(false);

    const fetchHistory = async () => {
        try {
            // apiClient already handles baseURL and Authorization token
            const res = await apiClient.get('/admin/backups/history');
            setHistory(res.data);
            calculateNext();
        } catch (error) {
            console.error(error);
            // enqueueSnackbar('Error fetching backup history', { variant: 'error' });
        }
    };

    // Calculate next backup time (Schedule is 0 */4 * * * => 00:00, 04:00, 08:00...)
    const calculateNext = () => {
        const now = new Date();
        const hour = now.getHours();
        const nextHour = Math.ceil((hour + 1) / 4) * 4;
        const nextTime = new Date(now);
        nextTime.setHours(nextHour, 0, 0, 0);
        if (nextTime <= now) nextTime.setHours(nextTime.getHours() + 4);
        setNextBackup(nextTime);
    };

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    // Timer logic
    useEffect(() => {
        if (!nextBackup) return;
        const interval = setInterval(() => {
            const now = new Date();
            const diff = nextBackup - now;
            if (diff <= 0) {
                setTimeLeft('Processing...');
                calculateNext();
            } else {
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${h}h ${m}m ${s}s`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [nextBackup]);

    const triggerBackup = async (type) => {
        try {
            setProcessingType(type);
            await apiClient.post('/admin/backups/trigger', { type });
            // Simulate minimum loading visual for UX since backend is fire-and-forget but fast
            setTimeout(() => {
                setProcessingType(null); // Stop spinner
                fetchHistory();          // Refresh list
            }, 3000);
        } catch (error) {
            setProcessingType(null);
            alert(`Failed: ${error.message}`);
        }
    };

    const cleanDisplayLog = (log) => {
        if (!log) return '';
        // Remove ASCII bars if they exist in old history
        return log.replace(/[█░\[\]]/g, '').replace(/\d+%\s*\(\d+\/\d+\)/g, '').trim() || 'Details available in logs';
    };

    const handleOpenRestore = async () => {
        try {
            const res = await apiClient.get('/admin/backups/list');
            setAvailableBackups(res.data);
            setRestoreDialogOpen(true);
        } catch (error) {
            console.error(error);
            alert('Failed to fetch backups list');
        }
    };

    const handleRequestRestore = (folderName) => {
        setBackupToRestore(folderName);
        setConfirmRestoreOpen(true);
    };

    const executeRestore = async () => {
        setConfirmRestoreOpen(false);
        setRestoring(true);
        try {
            const res = await apiClient.post('/admin/backups/restore', { folderName: backupToRestore });
            alert(`Success: ${res.data.msg}`);
            fetchHistory(); // Refresh history to see the restore log
            setRestoreDialogOpen(false);
        } catch (error) {
            console.error(error);
            alert(`Restore Failed: ${error.response?.data?.error || error.message}`);
        } finally {
            setRestoring(false);
            setBackupToRestore(null);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                <Typography variant="h4" sx={{ color: '#00f2ff', textShadow: '0 0 10px rgba(0,242,255,0.5)' }}>
                    System Backups
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,242,255,0.2)', minWidth: 200, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#aaa' }}>NEXT AUTO-BACKUP IN</Typography>
                    <Typography variant="h5" sx={{ color: '#fff', fontFamily: 'monospace' }}>
                        {timeLeft || '...'}
                    </Typography>
                </Paper>
            </Box>

            {/* Visual Processing Indicator */}
            {processingType && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ color: processingType === 'db' ? '#00f2ff' : '#ff00ff', mb: 1 }}>
                        Processing {processingType === 'db' ? 'DATABASE' : 'PROJECT FILES'} backup...
                    </Typography>
                    <CyberLinearProgress color={processingType === 'db' ? 'primary' : 'secondary'} ownerState={{ color: processingType === 'db' ? 'primary' : 'secondary' }} />
                </Box>
            )}

            <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                    variant="contained"
                    disabled={!!processingType || restoring}
                    startIcon={<PlayArrowIcon />}
                    onClick={() => triggerBackup('db')}
                    sx={{ bgcolor: 'rgba(0,242,255,0.1)', border: '1px solid #00f2ff', color: '#00f2ff', '&:hover': { bgcolor: 'rgba(0,242,255,0.2)' } }}
                >
                    Backup Database Now
                </Button>
                <Button
                    variant="contained"
                    disabled={!!processingType || restoring}
                    startIcon={<PlayArrowIcon />}
                    onClick={() => triggerBackup('project')}
                    sx={{ bgcolor: 'rgba(255,0,255,0.1)', border: '1px solid #ff00ff', color: '#ff00ff', '&:hover': { bgcolor: 'rgba(255,0,255,0.2)' } }}
                >
                    Backup Project Files Now
                </Button>

                <Box sx={{ flexGrow: 1 }} />

                <Button
                    variant="contained"
                    disabled={!!processingType || restoring}
                    startIcon={<RestoreIcon />}
                    onClick={handleOpenRestore}
                    sx={{ bgcolor: 'rgba(255,50,50,0.1)', border: '1px solid #ff3333', color: '#ff3333', '&:hover': { bgcolor: 'rgba(255,50,50,0.2)' } }}
                >
                    Restore Database
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ bgcolor: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#aaa' }}>Time</TableCell>
                            <TableCell sx={{ color: '#aaa' }}>Type</TableCell>
                            <TableCell sx={{ color: '#aaa' }}>Status</TableCell>
                            <TableCell sx={{ color: '#aaa' }}>Duration</TableCell>
                            <TableCell sx={{ color: '#aaa' }}>Details</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {history.map((entry) => (
                            <TableRow key={entry.id}>
                                <TableCell sx={{ color: '#fff' }}>
                                    {new Date(entry.timestamp).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={entry.type.toUpperCase()}
                                        size="small"
                                        sx={{
                                            bgcolor: entry.type === 'database' ? 'rgba(0,242,255,0.1)' : 'rgba(255,0,255,0.1)',
                                            color: entry.type === 'database' ? '#00f2ff' : '#ff00ff',
                                            border: `1px solid ${entry.type === 'database' ? '#00f2ff' : '#ff00ff'}`
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={entry.success ? 'SUCCESS' : 'FAILED'}
                                        color={entry.success ? 'success' : 'error'}
                                        variant="outlined"
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell sx={{ color: '#ccc' }}>
                                    {(entry.duration / 1000).toFixed(1)}s
                                </TableCell>
                                <TableCell
                                    title={cleanDisplayLog(entry.logs)}
                                    sx={{ minWidth: 150 }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Box sx={{ width: '100%', mr: 1 }}>
                                            <CyberLinearProgress
                                                variant="determinate"
                                                value={entry.success ? 100 : 100}
                                                color={entry.success ? (entry.type === 'database' ? 'primary' : 'secondary') : 'error'}
                                                ownerState={{ color: entry.success ? (entry.type === 'database' ? 'primary' : 'secondary') : 'error' }}
                                                sx={{
                                                    opacity: entry.success ? 1 : 0.5,
                                                    '& .MuiLinearProgress-bar': {
                                                        bgcolor: !entry.success ? '#ff3333' : undefined,
                                                        boxShadow: !entry.success ? '0 0 5px red' : undefined
                                                    }
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                        {history.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ color: '#666' }}>No backup history found</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Restore List Dialog */}
            <Dialog open={restoreDialogOpen} onClose={() => !restoring && setRestoreDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: '#0f172a', border: '1px solid #00f2ff', color: '#fff' } }}>
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Select Backup to Restore</DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {restoring && <LinearProgress color="secondary" sx={{ mb: 2 }} />}
                    {availableBackups.length === 0 ? (
                        <Typography sx={{ color: '#aaa', textAlign: 'center', py: 3 }}>No backups found.</Typography>
                    ) : (
                        <List>
                            {availableBackups.map((folder) => (
                                <ListItem key={folder} divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <ListItemText
                                        primary={folder}
                                        secondary={folder.includes('backup_') ? new Date(folder.replace('backup_', '').replace(/-/g, ':').replace('T', ' ').slice(0, 19)).toLocaleString() : ''}
                                        primaryTypographyProps={{ color: '#00f2ff', fontFamily: 'monospace' }}
                                        secondaryTypographyProps={{ color: '#888' }}
                                    />
                                    <ListItemSecondaryAction>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            disabled={restoring}
                                            onClick={() => handleRequestRestore(folder)}
                                        >
                                            Restore
                                        </Button>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRestoreDialogOpen(false)} disabled={restoring} sx={{ color: '#fff' }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Confirm Restore Dialog */}
            <Dialog open={confirmRestoreOpen} onClose={() => setConfirmRestoreOpen(false)} PaperProps={{ sx: { bgcolor: '#1a0505', border: '1px solid red', color: '#fff' } }}>
                <DialogTitle sx={{ color: 'red' }}>⚠️ CRITICAL WARNING</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to restore the database from <b>{backupToRestore}</b>?
                    </Typography>
                    <Alert severity="error" variant="filled" sx={{ mt: 2 }}>
                        This will ERASE current data and replace it with the backup content. This action cannot be undone.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmRestoreOpen(false)} sx={{ color: '#fff' }}>Cancel</Button>
                    <Button onClick={executeRestore} color="error" variant="contained">YES, RESTORE EVERYTHING</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BackupManager;
