import React from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@mui/system';

// --- ANIMATIONS ---
const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 20px rgba(99, 102, 241, 0.4), 0 0 60px rgba(99, 102, 241, 0.2); }
  50% { transform: scale(1.05); box-shadow: 0 0 40px rgba(99, 102, 241, 0.6), 0 0 80px rgba(217, 70, 239, 0.4); }
  100% { transform: scale(1); box-shadow: 0 0 20px rgba(99, 102, 241, 0.4), 0 0 60px rgba(99, 102, 241, 0.2); }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const revSpin = keyframes`
  0% { transform: rotate(360deg); }
  100% { transform: rotate(0deg); }
`;

const CyberSphere = () => {
    return (
        <Box sx={{ position: 'relative', width: 140, height: 140, display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 6 }}>

            {/* 1. CORE SPHERE */}
            <Box sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #a855f7, #6366f1)',
                animation: `${pulse} 3s infinite ease-in-out`,
                position: 'relative',
                zIndex: 2,
                '&::after': { // Shine reflection
                    content: '""',
                    position: 'absolute',
                    top: '15%',
                    left: '15%',
                    width: '20%',
                    height: '20%',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.8)',
                    filter: 'blur(2px)'
                }
            }} />

            {/* 2. INNER RING (Fast) */}
            <Box sx={{
                position: 'absolute',
                width: 90,
                height: 90,
                borderRadius: '50%',
                border: '2px solid transparent',
                borderTop: '2px solid #6366f1',
                borderLeft: '2px solid transparent',
                borderRight: '2px solid rgba(217, 70, 239, 0.5)',
                animation: `${spin} 4s linear infinite`,
                zIndex: 1
            }} />

            {/* 3. OUTER RING (Slow) */}
            <Box sx={{
                position: 'absolute',
                width: 120,
                height: 120,
                borderRadius: '50%',
                border: '1px dashed rgba(99, 102, 241, 0.3)',
                animation: `${revSpin} 10s linear infinite`,
                zIndex: 1
            }}>
                {/* Satellite on Outer Ring */}
                <Box sx={{
                    position: 'absolute',
                    top: '-4px', // On the rim
                    left: '50%',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: '#d946ef',
                    boxShadow: '0 0 10px #d946ef'
                }} />
            </Box>

            {/* 4. GHOST RING (Wobbly/Decorative) */}
            <Box sx={{
                position: 'absolute',
                width: 140,
                height: 140,
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                animation: `${spin} 20s linear infinite`,
            }} />

        </Box>
    );
};

export default CyberSphere;
