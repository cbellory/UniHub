import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Radio, RadioGroup, FormControlLabel,
    LinearProgress, Fade, IconButton
} from '@mui/material';
import { CheckCircle, Cancel, Close, EmojiEvents } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';

const QuizModal = ({ open, task, onClose, onComplete }) => {
    const { t } = useLanguage();
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [answers, setAnswers] = useState({}); // { [questionIdx]: selectedOptionIdx }
    const [showResult, setShowResult] = useState(false);
    const [resultMessage, setResultMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!task || !task.quizData || task.quizData.length === 0) return null;

    const currentQuestion = task.quizData[currentQuestionIdx];
    const progress = ((currentQuestionIdx + 1) / task.quizData.length) * 100;

    const handleOptionSelect = (optIdx) => {
        setAnswers(prev => ({ ...prev, [currentQuestionIdx]: optIdx }));
    };

    const handleNext = () => {
        if (currentQuestionIdx < task.quizData.length - 1) {
            setCurrentQuestionIdx(prev => prev + 1);
        } else {
            submitQuiz();
        }
    };

    const submitQuiz = async () => {
        setIsSubmitting(true);
        // Prepare answers array based on indices
        const indices = task.quizData.map((_, i) => answers[i]);

        try {
            // Call parent onComplete with answers
            // We expect onComplete to throw if validation fails
            await onComplete(indices);
            setIsSuccess(true);
            setResultMessage(t('quizPassed') || "Тест пройдено! +XP Нараховано");
        } catch (err) {
            setIsSuccess(false);
            setResultMessage(err.message || (t('quizFailed') || "Тест не пройдено. Спробуйте ще раз."));
        } finally {
            setIsSubmitting(false);
            setShowResult(true);
        }
    };

    const handleClose = () => {
        setCurrentQuestionIdx(0);
        setAnswers({});
        setShowResult(false);
        onClose();
    };

    // RESULT SCREEN
    if (showResult) {
        return (
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' } }}>
                <Box sx={{ p: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    {isSuccess ?
                        <EmojiEvents sx={{ fontSize: 80, color: '#fbbf24' }} className="animate-bounce" /> :
                        <Cancel sx={{ fontSize: 80, color: '#ef4444' }} />
                    }

                    <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                        {isSuccess ? (t('congrats') || "Вітаємо!") : (t('failed') || "Невдача")}
                    </Typography>

                    <Typography variant="body1" sx={{ color: isSuccess ? '#4ade80' : '#f87171' }}>
                        {resultMessage}
                    </Typography>

                    <Button
                        variant="contained"
                        onClick={handleClose}
                        sx={{ mt: 2, bgcolor: isSuccess ? '#fbbf24' : '#64748b', width: '50%' }}
                    >
                        {t('close') || "Закрити"}
                    </Button>
                </Box>
            </Dialog>
        );
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    bgcolor: '#0f172a',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    backdropFilter: 'blur(10px)'
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Box>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                        {task.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {t('question') || "Питання"} {currentQuestionIdx + 1} {t('of') || "з"} {task.quizData.length}
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} sx={{ color: '#64748b' }}><Close /></IconButton>
            </DialogTitle>

            <LinearProgress variant="determinate" value={progress} sx={{ height: 4, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />

            <DialogContent sx={{ mt: 2 }}>
                <Typography variant="h5" sx={{ color: '#e2e8f0', mb: 3, fontWeight: 'medium' }}>
                    {currentQuestion.question}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {currentQuestion.options.map((opt, idx) => (
                        <Box
                            key={idx}
                            onClick={() => handleOptionSelect(idx)}
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                cursor: 'pointer',
                                border: answers[currentQuestionIdx] === idx ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                                bgcolor: answers[currentQuestionIdx] === idx ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255,255,255,0.02)',
                                transition: 'all 0.2s',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                                display: 'flex', alignItems: 'center'
                            }}
                        >
                            <Radio
                                checked={answers[currentQuestionIdx] === idx}
                                sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#38bdf8' } }}
                            />
                            <Typography sx={{ color: '#fff', ml: 1 }}>{opt}</Typography>
                        </Box>
                    ))}
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button
                    onClick={handleNext}
                    disabled={answers[currentQuestionIdx] === undefined || isSubmitting}
                    variant="contained"
                    fullWidth
                    sx={{
                        bgcolor: '#38bdf8',
                        py: 1.5,
                        fontWeight: 'bold',
                        '&:hover': { bgcolor: '#0ea5e9' },
                        '&:disabled': { bgcolor: 'rgba(56, 189, 248, 0.3)' }
                    }}
                >
                    {currentQuestionIdx === task.quizData.length - 1 ?
                        (isSubmitting ? (t('submitting') || "Відправка...") : (t('finishQuiz') || "Завершити тест"))
                        : (t('nextQuestion') || "Наступне питання")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default QuizModal;
