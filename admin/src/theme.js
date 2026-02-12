import { createTheme } from '@mui/material';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#8b5cf6' }, // Violet 500
        secondary: { main: '#06b6d4' }, // Cyan 500
        background: {
            default: '#09090b',
            paper: '#18181b',
        },
        text: {
            primary: '#fafafa',
            secondary: '#a1a1aa',
        },
        success: {
            main: '#10b981', // Emerald 500
        },
        error: {
            main: '#ef4444', // Red 500
        },
        warning: {
            main: '#f59e0b', // Amber 500
        }
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h6: { fontWeight: 600 },
        button: { textTransform: 'none', fontWeight: 500 },
    },
    shape: { borderRadius: 16 },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: 'rgba(24, 24, 27, 0.6)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: 'none',
                },
            },
        },
    },
});

export default theme;
