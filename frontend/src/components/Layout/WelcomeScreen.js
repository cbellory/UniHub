import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import CyberSphere from '../CyberSphere';

const WelcomeScreen = ({ t, onConnect }) => {
    return (
        <Box sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative'
        }}>
            {/* Decorative Background Blob */}
            <Box sx={{
                position: 'absolute',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)',
                zIndex: -1,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                filter: 'blur(60px)',
            }} />

            <CyberSphere />

            <Typography variant="h2" sx={{
                mb: 2,
                background: 'linear-gradient(to right, #ffffff, #94a3b8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
            }}>
                {t('systemOnline')}
            </Typography>
            <Typography variant="h5" sx={{ mb: 8, color: 'text.secondary', maxWidth: '600px', fontWeight: 300 }}>
                {t('platformTagline')}
            </Typography>

            <Button
                onClick={onConnect}
                variant="contained"
                size="large"
                sx={{
                    padding: '18px 48px',
                    fontSize: '1.2rem',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    boxShadow: '0 0 40px rgba(99, 102, 241, 0.5)',
                    '&:hover': {
                        boxShadow: '0 0 60px rgba(99, 102, 241, 0.7)',
                        transform: 'scale(1.05)'
                    }
                }}
            >
                {t('connectWallet')}
            </Button>
        </Box>
    );
};

export default WelcomeScreen;
