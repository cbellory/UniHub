import { createTheme } from '@mui/material/styles';

// --- THEME PRESETS ---
export const themePresets = {
    blue: {
        primary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5' }, // Electric Indigo
        secondary: { main: '#d946ef', light: '#e879f9', dark: '#c026d3' }, // Fuchsia
        background: { default: '#030014', paper: 'rgba(17, 25, 40, 0.75)' },
        gradient: `radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
                   radial-gradient(circle at 100% 0%, rgba(217, 70, 239, 0.1) 0%, transparent 50%),
                   radial-gradient(circle at 100% 100%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)`
    },
    pink: {
        primary: { main: '#ec4899', light: '#f472b6', dark: '#db2777' }, // Pink
        secondary: { main: '#8b5cf6', light: '#a78bfa', dark: '#7c3aed' }, // Violet
        background: { default: '#1f0210', paper: 'rgba(40, 10, 25, 0.75)' },
        gradient: `radial-gradient(circle at 0% 0%, rgba(236, 72, 153, 0.15) 0%, transparent 50%),
                   radial-gradient(circle at 100% 0%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                   radial-gradient(circle at 100% 100%, rgba(217, 70, 239, 0.1) 0%, transparent 50%)`
    },
    green: {
        primary: { main: '#10b981', light: '#34d399', dark: '#059669' }, // Emerald
        secondary: { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' }, // Amber
        background: { default: '#02120a', paper: 'rgba(5, 25, 15, 0.75)' },
        gradient: `radial-gradient(circle at 0% 0%, rgba(16, 185, 129, 0.15) 0%, transparent 50%),
                   radial-gradient(circle at 100% 0%, rgba(245, 158, 11, 0.1) 0%, transparent 50%),
                   radial-gradient(circle at 100% 100%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)`
    }
};

export const getTheme = (mode = 'blue') => {
    const preset = themePresets[mode] || themePresets.blue;

    return createTheme({
        palette: {
            mode: 'dark',
            primary: {
                main: preset.primary.main,
                light: preset.primary.light,
                dark: preset.primary.dark,
                contrastText: '#ffffff',
            },
            secondary: {
                main: preset.secondary.main,
                light: preset.secondary.light,
                dark: preset.secondary.dark,
                contrastText: '#ffffff',
            },
            background: {
                default: preset.background.default,
                paper: preset.background.paper,
            },
            text: {
                primary: '#f8fafc',
                secondary: '#94a3b8',
            },
            action: {
                hover: `${preset.primary.main}14`, // 8% opacity (hex 14) roughly
                selected: `${preset.primary.main}29`, // 16% opacity (hex 29) roughly
            },
            // Custom semantic colors
            custom: {
                cardBg: 'rgba(30, 41, 59, 0.4)',
                cardBorder: 'rgba(255, 255, 255, 0.1)',
                neonBorder: `${preset.primary.main}80`, // 50% opacity
                glassHighlight: 'rgba(255, 255, 255, 0.05)',
            }
        },
        typography: {
            fontFamily: '"Inter", "Roboto", sans-serif',
            h1: { fontFamily: '"Orbitron", sans-serif', fontWeight: 700, letterSpacing: '0.02em', color: '#f8fafc' },
            h2: { fontFamily: '"Orbitron", sans-serif', fontWeight: 700, letterSpacing: '0.02em', color: '#f8fafc' },
            h3: { fontFamily: '"Orbitron", sans-serif', fontWeight: 600, color: '#f8fafc' },
            h4: { fontFamily: '"Orbitron", sans-serif', fontWeight: 600, color: '#f8fafc' },
            h5: { fontFamily: '"Orbitron", sans-serif', fontWeight: 500, color: '#f8fafc' },
            h6: { fontFamily: '"Orbitron", sans-serif', fontWeight: 500, color: '#f8fafc', letterSpacing: '0.05em' },
            button: {
                fontFamily: '"Inter", sans-serif',
                fontWeight: 600,
                textTransform: 'none',
            },
            body1: {
                fontSize: '1rem',
                lineHeight: 1.6,
            },
        },
        shape: {
            borderRadius: 16,
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        backgroundColor: preset.background.default,
                        backgroundImage: preset.gradient,
                        backgroundAttachment: 'fixed',
                        scrollbarWidth: 'thin',
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: preset.background.default,
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: '#334155',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            background: '#475569',
                        },
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        background: 'rgba(30, 41, 59, 0.4)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: `0 12px 40px 0 ${preset.primary.main}33`, // 20% opacity
                            borderColor: `${preset.primary.main}66`, // 40%
                        },
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        backgroundColor: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: '12px',
                        padding: '10px 24px',
                        transition: 'all 0.3s ease',
                    },
                    containedPrimary: {
                        background: `linear-gradient(135deg, ${preset.primary.main} 0%, ${preset.primary.dark} 100%)`,
                        boxShadow: `0 4px 12px ${preset.primary.dark}66`,
                        border: '1px solid rgba(255,255,255,0.1)',
                        '&:hover': {
                            background: `linear-gradient(135deg, ${preset.primary.dark} 0%, ${preset.primary.main} 100%)`,
                            boxShadow: `0 6px 20px ${preset.primary.dark}99`,
                            transform: 'translateY(-2px)',
                        },
                    },
                    containedSecondary: {
                        background: `linear-gradient(135deg, ${preset.secondary.main} 0%, ${preset.secondary.dark} 100%)`,
                        boxShadow: `0 4px 12px ${preset.secondary.dark}66`,
                        '&:hover': {
                            background: `linear-gradient(135deg, ${preset.secondary.dark} 0%, ${preset.secondary.main} 100%)`,
                            boxShadow: `0 6px 20px ${preset.secondary.dark}99`,
                            transform: 'translateY(-2px)',
                        },
                    },
                    outlined: {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        color: '#e2e8f0',
                        '&:hover': {
                            borderColor: preset.primary.main,
                            backgroundColor: `${preset.primary.main}1a`, // 10%
                            color: '#fff',
                        },
                    },
                },
            },
            MuiTab: {
                styleOverrides: {
                    root: {
                        color: '#94a3b8',
                        '&.Mui-selected': {
                            color: '#fff',
                            textShadow: `0 0 10px ${preset.primary.main}80`,
                        },
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        backdropFilter: 'blur(4px)',
                    },
                    filledPrimary: {
                        backgroundColor: `${preset.primary.main}33`,
                        border: `1px solid ${preset.primary.main}4d`,
                        color: preset.primary.light,
                    },
                    filledSecondary: {
                        backgroundColor: `${preset.secondary.main}33`,
                        border: `1px solid ${preset.secondary.main}4d`,
                        color: preset.secondary.light,
                    }
                }
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: '12px',
                            '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                            },
                            '&:hover fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: preset.primary.main,
                                boxShadow: `0 0 0 1px ${preset.primary.main}`,
                            },
                        },
                    }
                }
            }
        },
    });
};

export default getTheme();
