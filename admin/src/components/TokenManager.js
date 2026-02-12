import React, { useState } from 'react';
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
} from '@mui/material';
import { mintTokens, getTokenBalance, syncTokenBalance } from '../services/blockchainApi';

const TokenManager = () => {
    const [studentAddress, setStudentAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [balanceInfo, setBalanceInfo] = useState(null);

    const handleMintTokens = async () => {
        if (!studentAddress || !amount) {
            setMessage({ type: 'error', text: 'Заповніть адресу та кількість токенів' });
            return;
        }

        if (parseFloat(amount) <= 0) {
            setMessage({ type: 'error', text: 'Кількість токенів має бути більше 0' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const result = await mintTokens(studentAddress, parseFloat(amount), reason);
            setMessage({
                type: 'success',
                text: `Токени успішно видані! Транзакція: ${result.data.transactionHash}`,
            });
            // Очистка формы
            setAmount('');
            setReason('');
            // Обновляем баланс
            handleCheckBalance();
        } catch (error) {
            setMessage({
                type: 'error',
                text: `Помилка: ${error.response?.data?.message || error.message}`,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCheckBalance = async () => {
        if (!studentAddress) {
            setMessage({ type: 'error', text: 'Введіть адресу студента' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const result = await getTokenBalance(studentAddress);
            setBalanceInfo(result.data);
        } catch (error) {
            setMessage({
                type: 'error',
                text: `Помилка: ${error.response?.data?.message || error.message}`,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSyncBalance = async () => {
        if (!studentAddress) {
            setMessage({ type: 'error', text: 'Введіть адресу студента' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            await syncTokenBalance(studentAddress);
            setMessage({ type: 'success', text: 'Баланс синхронізовано!' });
            handleCheckBalance();
        } catch (error) {
            setMessage({
                type: 'error',
                text: `Помилка: ${error.response?.data?.message || error.message}`,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Керування токенами UniversityCoin (UCN)
            </Typography>

            {message && (
                <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
                    {message.text}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Выдача токенов */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Видати токени
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
                                label="Кількість токенів"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                margin="normal"
                                size="small"
                            />

                            <TextField
                                fullWidth
                                label="Причина (необов'язково)"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="За відмінну роботу"
                                margin="normal"
                                size="small"
                                multiline
                                rows={2}
                            />

                            <Button
                                fullWidth
                                variant="contained"
                                color="primary"
                                onClick={handleMintTokens}
                                disabled={loading}
                                sx={{ mt: 2 }}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Видати токени'}
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Проверка баланса */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Перевірка балансу
                            </Typography>

                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={handleCheckBalance}
                                disabled={loading || !studentAddress}
                                sx={{ mt: 2 }}
                            >
                                Перевірити баланс
                            </Button>

                            <Button
                                fullWidth
                                variant="outlined"
                                color="secondary"
                                onClick={handleSyncBalance}
                                disabled={loading || !studentAddress}
                                sx={{ mt: 1 }}
                            >
                                Синхронізувати з блокчейном
                            </Button>

                            {balanceInfo && (
                                <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Адреса:</strong> {balanceInfo.address}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        <strong>Баланс (блокчейн):</strong> {balanceInfo.blockchainBalance} UCN
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        <strong>Баланс (база даних):</strong> {balanceInfo.databaseBalance} UCN
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color={balanceInfo.synced ? 'success.main' : 'warning.main'}
                                        sx={{ mt: 1 }}
                                    >
                                        <strong>Статус:</strong> {balanceInfo.synced ? '✓ Синхронізовано' : '⚠ Потрібна синхронізація'}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Информация */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" color="info.dark">
                    <strong>Інформація:</strong> Токени UCN видаються студентам за виконання завдань та досягнення.
                    Всі транзакції записуються в блокчейн BNB Smart Chain Testnet.
                </Typography>
            </Box>
        </Box>
    );
};

export default TokenManager;
