import React, { useEffect, useState } from 'react';
import { getPendingSubmissions, reviewSubmission } from '../services/adminApi';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '@mui/material/styles';
import { Checkbox, FormControlLabel, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
const ExpandableText = ({ text }) => {
    const [open, setOpen] = useState(false);
    // Truncate if longer than 300 chars or more than 5 lines (approx)
    const MAX_LENGTH = 300;
    const isLong = text.length > MAX_LENGTH || text.split('\n').length > 6;

    const displayText = !open && isLong ? text.slice(0, MAX_LENGTH) + '...' : text;

    return (
        <>
            <div
                style={{
                    marginBottom: 20,
                    background: '#0f172a',
                    padding: '16px',
                    borderRadius: 12,
                    border: '1px solid rgba(56, 189, 248, 0.1)',
                    color: '#e2e8f0',
                    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif', // Better font
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap', // Preserve whitespace
                    wordBreak: 'break-word',
                    position: 'relative',
                    cursor: isLong ? 'pointer' : 'default',
                    transition: 'background 0.2s',
                }}
                onClick={() => isLong && setOpen(true)}
                onMouseEnter={e => isLong && (e.currentTarget.style.background = '#1e293b')}
                onMouseLeave={e => isLong && (e.currentTarget.style.background = '#0f172a')}
            >
                {displayText}
                {isLong && (
                    <div style={{
                        marginTop: 8,
                        color: '#38bdf8',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        textAlign: 'right'
                    }}>
                        Читать полностью
                    </div>
                )}
            </div>

            {/* Full Text Modal */}
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    style: {
                        background: '#0f172a',
                        color: '#fff',
                        borderRadius: 16,
                        border: '1px solid rgba(255,255,255,0.1)'
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    Отчет студента
                    <IconButton onClick={() => setOpen(false)} sx={{ color: '#94a3b8' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <div style={{
                        marginTop: 20,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontSize: '1rem',
                        lineHeight: 1.7,
                        color: '#e2e8f0',
                        fontFamily: '"Inter", sans-serif'
                    }}>
                        {text}
                    </div>
                </DialogContent>
                <DialogActions sx={{ padding: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Button onClick={() => setOpen(false)} variant="outlined" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
                        Закрыть
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

const TaskVerification = ({ onOpenProfile }) => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmissions, setSelectedSubmissions] = useState(new Set());
    const [filter, setFilter] = useState({}); // Defined filter state
    const { showToast } = useToast();
    const theme = useTheme();

    useEffect(() => {
        fetchSubmissions();
    }, [filter]);

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const data = await getPendingSubmissions(filter);
            setSubmissions(data);
        } catch (error) {
            console.error('Error fetching submissions:', error);
            showToast('Помилка завантаження', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSelect = (id) => {
        setSelectedSubmissions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedSubmissions(new Set(submissions.map(s => s._id)));
        } else {
            setSelectedSubmissions(new Set());
        }
    };

    const handleBulkReview = async (status) => {
        if (selectedSubmissions.size === 0) return;

        if (!window.confirm(`Ви впевнені, що хочете змінити статус ${selectedSubmissions.size} завдань?`)) return;

        try {
            await Promise.all(Array.from(selectedSubmissions).map(id => reviewSubmission(id, status)));
            showToast(`Опрацьовано ${selectedSubmissions.size} завдань`, 'success');
            setSelectedSubmissions(new Set());
            fetchSubmissions();
        } catch (e) {
            console.error(e);
            showToast('Помилка масової обробки', 'error');
        }
    };

    const handleReview = async (id, status, feedback = '') => {
        if (!window.confirm(`Ви впевнені, що хочете ${status === 'approve' ? 'схвалити' : 'відхилити'} це завдання?`)) return;

        try {
            await reviewSubmission(id, status, feedback);
            showToast('Статус оновлено', 'success');
            setSubmissions(prev => prev.filter(s => s._id !== id));
        } catch (error) {
            console.error("Review error:", error);
            showToast('Помилка оновлення статусу', 'error');
        }
    };

    if (loading) return (
        <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner"></div>
            <p style={{ color: '#94a3b8', marginTop: 10 }}>Завантаження заявок...</p>
        </div>
    );

    return (
        <div className="task-verification fade-in">
            <h2 className="section-title" style={{
                marginBottom: 30,
                display: 'flex',
                alignItems: 'center',
                gap: 15,
                background: 'linear-gradient(to right, #fff, #94a3b8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800
            }}>
                <span style={{ fontSize: '1.5em' }}>✅</span>
                Перевірка завдань
                <span style={{
                    fontSize: '0.6em',
                    background: 'rgba(255,255,255,0.1)',
                    padding: '2px 10px',
                    borderRadius: 20,
                    color: '#fff',
                    WebkitTextFillColor: '#fff'
                }}>
                    {submissions.length}
                </span>
            </h2>

            {/* BULK ACTIONS TOOLBAR */}
            {submissions.length > 0 && (
                <div style={{
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    padding: '10px 20px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 12
                }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={submissions.length > 0 && selectedSubmissions.size === submissions.length}
                                indeterminate={selectedSubmissions.size > 0 && selectedSubmissions.size < submissions.length}
                                onChange={handleSelectAll}
                                sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#8b5cf6' } }}
                            />
                        }
                        label="Вибрати всі"
                        sx={{ color: '#e2e8f0' }}
                    />

                    {selectedSubmissions.size > 0 && (
                        <div className="fade-in" style={{ display: 'flex', gap: 10 }}>
                            <Button
                                variant="contained"
                                color="success"
                                size="small"
                                onClick={() => handleBulkReview('approve')}
                            >
                                Схвалити ({selectedSubmissions.size})
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleBulkReview('reject')}
                            >
                                Відхилити ({selectedSubmissions.size})
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 25 }}>
                {submissions.map(sub => (
                    <div key={sub._id} className="glass-panel" style={{
                        padding: 0,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        background: selectedSubmissions.has(sub._id) ? 'rgba(139, 92, 246, 0.1)' : 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                        border: selectedSubmissions.has(sub._id) ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.05)',
                        position: 'relative'
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '10px 24px',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            background: 'rgba(255,255,255,0.02)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Checkbox
                                    checked={selectedSubmissions.has(sub._id)}
                                    onChange={() => handleToggleSelect(sub._id)}
                                    sx={{ color: '#64748b', '&.Mui-checked': { color: '#8b5cf6' }, padding: 0 }}
                                />
                                <div>
                                    <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600 }}>{sub.taskId?.name || 'Невідоме завдання'}</h4>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
                                        Надіслано {new Date(sub.submittedAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <div style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: '#34d399',
                                padding: '4px 8px',
                                borderRadius: 6,
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                border: '1px solid rgba(16, 185, 129, 0.2)'
                            }}>
                                {sub.taskId?.points || 0} XP
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{ padding: 24, flex: 1 }}>

                            {/* User Info */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                marginBottom: 20,
                                paddingBottom: 15,
                                borderBottom: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div style={{
                                    width: 32, height: 32,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', fontSize: '0.8rem'
                                }}>
                                    {sub.studentAvatar ? (
                                        <img
                                            src={sub.studentAvatar.startsWith('http') ? sub.studentAvatar : `/${sub.studentAvatar.replace(/^\//, '')}`}
                                            alt="Av"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentElement.style.background = '#6366f1'; e.target.parentElement.innerHTML = sub.walletAddress.substring(2, 4); }}
                                        />
                                    ) : (
                                        sub.walletAddress.substring(2, 4)
                                    )}
                                </div>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
                                <div style={{ fontWeight: 600, color: '#fff' }}>
                                    {sub.studentName ? `${sub.studentName} ${sub.studentGroup ? `(${sub.studentGroup})` : ''}` : 'Невідомий студент'}
                                </div>
                                <div
                                    onClick={() => onOpenProfile && onOpenProfile(sub.walletAddress)}
                                    style={{ color: '#64748b', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'monospace' }}
                                >
                                    {sub.walletAddress}
                                </div>
                            </div>
                        </div>

                        {/* Text with Expandable Logic */}
                        {sub.submissionText && (
                            <ExpandableText text={sub.submissionText} />
                        )}

                        {/* Image */}
                        {sub.proofImageUrl && (
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: 1, marginBottom: 8 }}>Вкладення</div>
                                <div
                                    style={{
                                        borderRadius: 12,
                                        overflow: 'hidden',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        position: 'relative',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => window.open(sub.proofImageUrl.startsWith('http') ? sub.proofImageUrl : `/${sub.proofImageUrl.replace(/^\//, '')}`, '_blank')}
                                >
                                    <img
                                        src={sub.proofImageUrl}
                                        alt="Proof"
                                        style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
                                    />
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: 8, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: '0.75rem', textAlign: 'center' }}>
                                        Натисніть для перегляду
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{
                            padding: 16,
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 12,
                            background: 'rgba(0,0,0,0.2)'
                        }}>
                            <button
                                className="btn"
                                onClick={() => handleReview(sub._id, 'reject')}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(239, 68, 68, 0.5)',
                                    color: '#ef4444',
                                    padding: '10px',
                                    borderRadius: 10,
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
                            >
                                Відхилити
                            </button>
                            <button
                                className="btn"
                                onClick={() => handleReview(sub._id, 'approve')}
                                style={{
                                    background: '#10b981',
                                    border: 'none',
                                    color: '#fff',
                                    padding: '10px',
                                    borderRadius: 10,
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={e => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseOut={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                Схвалити
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {submissions.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    color: '#64748b',
                    padding: '80px 20px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 20,
                    border: '1px dashed rgba(255,255,255,0.1)'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: 20, opacity: 0.5 }}>🎉</div>
                    <div style={{ fontSize: '1.2rem', marginBottom: 10 }}>Все чисто!</div>
                    <div>Немає нових заявок на перевірку.</div>
                </div>
            )}
        </div>
    );
};

export default TaskVerification;
