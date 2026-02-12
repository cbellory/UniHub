import React, { useState, useEffect } from 'react';
import {
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Box,
    Card,
    CardContent,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { Visibility, CheckCircle, Delete } from '@mui/icons-material';
import {
    mintDiploma,
    getAllDiplomas,
    getDiplomaInfo,
    verifyDiploma,
    deleteDiploma,
} from '../services/blockchainApi';

const DiplomaManager = () => {
    const [studentAddress, setStudentAddress] = useState('');
    const [metadataURI, setMetadataURI] = useState('');
    const [diplomaData, setDiplomaData] = useState({
        university: 'Університет державної фіскальної служби України',
        specialty: '',
        graduationYear: new Date().getFullYear(),
        averageGrade: '',
        honors: '',
        imageUrl: '',
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [diplomas, setDiplomas] = useState([]);
    const [selectedDiploma, setSelectedDiploma] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        fetchDiplomas();
    }, []);

    const fetchDiplomas = async () => {
        try {
            const result = await getAllDiplomas(1, 50);
            setDiplomas(result.data.diplomas || []);
        } catch (error) {
            console.error('Помилка при завантаженні сертифікатів:', error);
        }
    }
};

const handleMintDiploma = async () => {
    if (!studentAddress) {
        setMessage({ type: 'error', text: 'Заповніть адресу студента' });
        return;
    }

    setLoading(true);
    setMessage(null);

    try {
        const result = await mintDiploma(studentAddress, metadataURI, diplomaData, imageFile);
        setMessage({
            type: 'success',
            text: `Сертифікат успішно виданий! Token ID: ${result.data.tokenId}`,
        });
        // Очистка формы
        setStudentAddress('');
        setMetadataURI('');
        setDiplomaData({
            ...diplomaData,
            specialty: '',
            averageGrade: '',
            honors: '',
            imageUrl: '',
        });
        setImageFile(null);
        setImagePreview(null);
        // Обновляем список
        fetchDiplomas();
    } catch (error) {
        setMessage({
            type: 'error',
            text: `Помилка: ${error.response?.data?.message || error.message}`,
        });
    } finally {
        setLoading(false);
    }
};

const handleViewDiploma = async (diploma) => {
    try {
        const result = await getDiplomaInfo(diploma.tokenId);
        setSelectedDiploma({ ...diploma, ...result.data });
        setDialogOpen(true);
    } catch (error) {
        setMessage({
            type: 'error',
            text: `Помилка: ${error.response?.data?.message || error.message}`,
        });
    }
};

const handleVerifyDiploma = async (tokenId) => {
    try {
        const result = await verifyDiploma(tokenId);
        setMessage({
            type: result.data.isValid ? 'success' : 'warning',
            text: result.data.isValid
                ? 'Сертифікат підтверджено! ✓'
                : 'Сертифікат не пройшов перевірку!',
        });
    } catch (error) {
        setMessage({
            type: 'error',
            text: `Помилка: ${error.response?.data?.message || error.message}`,
        });
    }
};


const handleDeleteDiploma = async (id) => {
    console.log('Attempting to delete diploma with DB ID:', id);

    if (!id) {
        setMessage({ type: 'error', text: 'Помилка: ID сертифіката не знайдено' });
        return;
    }

    if (window.confirm('Ви впевнені, що хочете видалити цей сертифікат з бази даних? (В блокчейні він залишиться)')) {
        try {
            const response = await deleteDiploma(id);
            console.log('Delete response:', response);

            if (response.success) {
                setMessage({ type: 'success', text: 'Сертифікат видалено з бази даних' });
                // Мгновенно обновляем стейт, убирая удаленный диплом
                setDiplomas(prev => prev.filter(d => d._id !== id));
            } else {
                setMessage({ type: 'error', text: 'Не вдалося видалити сертифікат' });
            }
        } catch (error) {
            console.error('Delete error:', error);
            setMessage({ type: 'error', text: 'Помилка при видаленні: ' + (error.response?.data?.message || error.message) });
        }
    }
};

return (
    <Box>
        <Typography variant="h5" gutterBottom>
            Керування сертифікатами (Soulbound Certificate NFT)
        </Typography>

        {message && (
            <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
                {message.text}
            </Alert>
        )}

        <Grid container spacing={3}>
            {/* Выдача диплома */}
            <Grid item xs={12} md={6}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Видати сертифікат
                        </Typography>

                        <TextField
                            fullWidth
                            label="Адреса студента"
                            value={studentAddress}
                            onChange={(e) => setStudentAddress(e.target.value)}
                            placeholder="0x..."
                            margin="normal"
                            size="small"
                        />

                        <TextField
                            fullWidth
                            label="URI метаданих (IPFS) - необов'язково"
                            value={metadataURI}
                            onChange={(e) => setMetadataURI(e.target.value)}
                            placeholder="Залиште пустим для авто-генерації"
                            margin="normal"
                            size="small"
                        />

                        <TextField
                            fullWidth
                            label="Спеціальність"
                            value={diplomaData.specialty}
                            onChange={(e) =>
                                setDiplomaData({ ...diplomaData, specialty: e.target.value })
                            }
                            margin="normal"
                            size="small"
                        />

                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Рік випуску"
                                    type="number"
                                    value={diplomaData.graduationYear}
                                    onChange={(e) =>
                                        setDiplomaData({ ...diplomaData, graduationYear: parseInt(e.target.value) })
                                    }
                                    margin="normal"
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Середній бал"
                                    type="number"
                                    step="0.1"
                                    value={diplomaData.averageGrade}
                                    onChange={(e) =>
                                        setDiplomaData({ ...diplomaData, averageGrade: parseFloat(e.target.value) })
                                    }
                                    margin="normal"
                                    size="small"
                                />
                            </Grid>
                        </Grid>

                        <TextField
                            fullWidth
                            label="Відзнака (необов'язково)"
                            value={diplomaData.honors}
                            onChange={(e) =>
                                setDiplomaData({ ...diplomaData, honors: e.target.value })
                            }
                            placeholder="З відзнакою"
                            margin="normal"
                            size="small"
                        />

                        <Box sx={{ mt: 2, mb: 1 }}>
                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="raised-button-file"
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        setImageFile(file);
                                        setImagePreview(URL.createObjectURL(file));
                                    }
                                }}
                            />
                            <label htmlFor="raised-button-file">
                                <Button variant="outlined" component="span" fullWidth>
                                    Завантажити зображення сертифіката
                                </Button>
                            </label>
                            {imagePreview && (
                                <Box sx={{ mt: 2, textAlign: 'center' }}>
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                                    />
                                    <Button
                                        size="small"
                                        color="error"
                                        onClick={() => {
                                            setImageFile(null);
                                            setImagePreview(null);
                                        }}
                                    >
                                        Видалити
                                    </Button>
                                </Box>
                            )}
                        </Box>

                        <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            onClick={handleMintDiploma}
                            disabled={loading}
                            sx={{ mt: 2 }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Видати сертифікат'}
                        </Button>
                    </CardContent>
                </Card>
            </Grid>

            {/* Список дипломов */}
            <Grid item xs={12} md={6}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Видані сертифікати ({diplomas.length})
                        </Typography>

                        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Token ID</TableCell>
                                        <TableCell>Студент</TableCell>
                                        <TableCell>Дата</TableCell>
                                        <TableCell align="center">Дії</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {diplomas.map((diploma) => (
                                        <TableRow key={diploma.tokenId}>
                                            <TableCell>#{diploma.tokenId}</TableCell>
                                            <TableCell>
                                                {diploma.studentAddress.substring(0, 6)}...
                                                {diploma.studentAddress.substring(38)}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(diploma.issuedAt).toLocaleDateString('uk-UA')}
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleViewDiploma(diploma)}
                                                >
                                                    <Visibility fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="success"
                                                    onClick={() => handleVerifyDiploma(diploma.tokenId)}
                                                >
                                                    <CheckCircle fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteDiploma(diploma._id)}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>

        {/* Диалог просмотра диплома */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Інформація про сертифікат</DialogTitle>
            <DialogContent>
                {selectedDiploma && (
                    <Box>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Token ID:</strong> {selectedDiploma.tokenId}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Студент:</strong> {selectedDiploma.studentAddress}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Спеціальність:</strong> {selectedDiploma.diplomaData?.specialty}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Рік випуску:</strong> {selectedDiploma.diplomaData?.graduationYear}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Середній бал:</strong> {selectedDiploma.diplomaData?.averageGrade}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Metadata URI:</strong>{' '}
                            <a href={selectedDiploma.metadataURI} target="_blank" rel="noopener noreferrer">
                                {selectedDiploma.metadataURI}
                            </a>
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Транзакція:</strong>{' '}
                            <a
                                href={`https://testnet.bscscan.com/tx/${selectedDiploma.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Переглянути на BSCScan
                            </a>
                        </Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setDialogOpen(false)}>Закрити</Button>
            </DialogActions>
        </Dialog>

        {/* Информация */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2" color="info.dark">
                <strong>Інформація:</strong> Сертифікати є непередаваними NFT (Soulbound Tokens).
                Після видачі їх неможливо передати іншій особі. Всі сертифікати зберігаються в блокчейні BNB Smart Chain Testnet.
            </Typography>
        </Box>
    </Box>
);
};

export default DiplomaManager;
