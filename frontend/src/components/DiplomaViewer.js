import React, { useState, useEffect } from 'react';
import { getMyDiplomas, verifyMyDiploma } from '../services/blockchainService';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Button,
    Modal,
    Chip,
    CircularProgress,
    Link,
    useTheme,
    alpha
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const DiplomaViewer = ({ userAddress, compact = false }) => {
    const theme = useTheme();
    const [diplomas, setDiplomas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDiploma, setSelectedDiploma] = useState(null);

    useEffect(() => {
        if (userAddress) {
            fetchDiplomas();
        }
    }, [userAddress]);

    const fetchDiplomas = async () => {
        try {
            setLoading(true);
            const result = await getMyDiplomas(userAddress);
            setDiplomas(result.data.diplomas || []);
        } catch (err) {
            setError('Помилка при завантаженні дипломів');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyDiploma = async (tokenId) => {
        try {
            const result = await verifyMyDiploma(tokenId);
            alert(
                result.data.isValid
                    ? '✓ CERTIFICATE VERIFIED. AUTHENTICITY CONFIRMED.'
                    : '⚠ VALIDATION FAILED. CERTIFICATE INVALID.'
            );
        } catch (err) {
            alert('Verification Error');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress color="secondary" />
                <Typography sx={{ ml: 2, color: 'text.secondary' }}>SCANNING ARCHIVES...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    if (diplomas.length === 0) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="200px" textAlign="center">
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    NO CERTIFICATES FOUND
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Certificates will be issued upon academy graduation.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', mt: compact ? 0 : 2 }}>
            {!compact && (
                <Typography variant="h5" sx={{ mb: 3, color: '#fff', fontFamily: 'Orbitron', textAlign: 'center' }}>
                    DIGITAL CERTIFICATES ({diplomas.length})
                </Typography>
            )}

            <Grid container spacing={3}>
                {diplomas.map((diploma) => (
                    <Grid item xs={12} sm={6} md={4} key={diploma.tokenId}>
                        <Card
                            sx={{
                                cursor: 'pointer',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                overflow: 'hidden',
                                '&:hover': {
                                    transform: 'translateY(-5px)',
                                    boxShadow: `0 0 20px ${alpha(theme.palette.secondary.main, 0.3)}`,
                                    borderColor: theme.palette.secondary.main
                                }
                            }}
                            onClick={() => setSelectedDiploma(diploma)}
                        >
                            <Box sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '4px',
                                background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`
                            }} />

                            {diploma.diplomaData?.imageUrl ? (
                                <CardMedia
                                    component="img"
                                    height="160"
                                    image={diploma.diplomaData.imageUrl}
                                    alt="Certificate"
                                    sx={{ filter: 'brightness(0.9)' }}
                                />
                            ) : (
                                <Box sx={{ height: 160, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography variant="h6" color="text.secondary">NO IMAGE</Typography>
                                </Box>
                            )}

                            <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                                    <Chip
                                        label={`ID #${diploma.tokenId}`}
                                        size="small"
                                        sx={{
                                            background: 'rgba(255,255,255,0.1)',
                                            color: 'text.secondary',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    />
                                    <Chip
                                        label="SBT"
                                        size="small"
                                        sx={{
                                            background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
                                            color: '#000',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                </Box>
                                <Typography variant="h6" component="div" gutterBottom sx={{ fontWeight: 'bold', color: '#fff', fontSize: '1rem' }}>
                                    {diploma.diplomaData?.university || 'University Name'}
                                </Typography>
                                <Typography variant="body2" color="primary.light" mb={2}>
                                    {diploma.diplomaData?.specialty || 'Specialization'}
                                </Typography>

                                <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', pt: 2, mt: 1 }}>
                                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="caption" color="text.secondary">YEAR</Typography>
                                        <Typography variant="caption" sx={{ color: '#fff' }}>{diploma.diplomaData?.graduationYear}</Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography variant="caption" color="text.secondary">GPA</Typography>
                                        <Typography variant="caption" sx={{ color: theme.palette.success.light }}>{diploma.diplomaData?.averageGrade}</Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                            <Box p={2} pt={0}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<VerifiedUserIcon />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleVerifyDiploma(diploma.tokenId);
                                    }}
                                    sx={{
                                        borderColor: theme.palette.success.main,
                                        color: theme.palette.success.main,
                                        '&:hover': {
                                            borderColor: theme.palette.success.light,
                                            background: alpha(theme.palette.success.main, 0.1)
                                        }
                                    }}
                                >
                                    VERIFY ON-CHAIN
                                </Button>
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Modal for details */}
            <Modal
                open={!!selectedDiploma}
                onClose={() => setSelectedDiploma(null)}
                aria-labelledby="diploma-modal-title"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: { xs: '95%', sm: '85%', md: 600 }, // Responsive width
                    maxWidth: '95vw',
                    bgcolor: '#0f172a',
                    border: `1px solid ${theme.palette.primary.main}`,
                    borderRadius: 3,
                    boxShadow: `0 0 50px ${alpha(theme.palette.primary.main, 0.2)}`,
                    p: { xs: 2, md: 4 }, // Responsive padding
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}>
                    {selectedDiploma && (
                        <>
                            <Typography id="diploma-modal-title" variant="h6" component="h2" gutterBottom fontFamily="Orbitron" color="primary.main" textAlign="center" mb={2}>
                                CERTIFICATE DETAILS
                            </Typography>

                            {selectedDiploma.diplomaData?.imageUrl && (
                                <Box mb={3} sx={{
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    bgcolor: 'rgba(0,0,0,0.2)'
                                }}>
                                    <img
                                        src={selectedDiploma.diplomaData.imageUrl}
                                        alt="Certificate Full"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '50vh', // Constrain height for iPad
                                            objectFit: 'contain',
                                            display: 'block'
                                        }}
                                    />
                                </Box>
                            )}

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">UNIVERSITY</Typography>
                                    <Typography variant="body1" gutterBottom sx={{ color: '#fff' }}>{selectedDiploma.diplomaData?.university}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">SPECIALTY</Typography>
                                    <Typography variant="body1" gutterBottom sx={{ color: '#fff' }}>{selectedDiploma.diplomaData?.specialty}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">GRADUATION YEAR</Typography>
                                    <Typography variant="body1" gutterBottom sx={{ color: '#fff' }}>{selectedDiploma.diplomaData?.graduationYear}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">AVERAGE GRADE</Typography>
                                    <Typography variant="body1" gutterBottom sx={{ color: '#fff' }}>{selectedDiploma.diplomaData?.averageGrade}</Typography>
                                </Grid>
                                {selectedDiploma.diplomaData?.honors && (
                                    <Grid item xs={12}>
                                        <Typography variant="caption" color="text.secondary">HONORS</Typography>
                                        <Typography variant="body1" color="secondary.main" fontWeight="bold" gutterBottom>
                                            {selectedDiploma.diplomaData.honors}
                                        </Typography>
                                    </Grid>
                                )}
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">ISSUED AT</Typography>
                                    <Typography variant="body1" gutterBottom sx={{ color: '#fff' }}>
                                        {new Date(selectedDiploma.issuedAt).toLocaleString('en-US')}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">BLOCKCHAIN TRANSACTION</Typography>
                                    <Link
                                        href={`https://testnet.bscscan.com/tx/${selectedDiploma.transactionHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        underline="hover"
                                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: theme.palette.primary.main }}
                                    >
                                        {selectedDiploma.transactionHash.substring(0, 30)}...
                                        <OpenInNewIcon fontSize="small" />
                                    </Link>
                                </Grid>
                            </Grid>

                            <Box mt={3} p={2} bgcolor="rgba(99, 102, 241, 0.1)" borderRadius={2} border={`1px solid ${alpha(theme.palette.primary.main, 0.3)}`}>
                                <Typography variant="caption" color="primary.light">
                                    <strong>NOTE:</strong> This certificate is a Soulbound Token (SBT). It is permanently bound to your wallet address and cannot be transferred.
                                </Typography>
                            </Box>

                            <Box mt={3} display="flex" justifyContent="flex-end">
                                <Button variant="outlined" onClick={() => setSelectedDiploma(null)}>CLOSE</Button>
                            </Box>
                        </>
                    )}
                </Box>
            </Modal>
        </Box>
    );
};

export default DiplomaViewer;
