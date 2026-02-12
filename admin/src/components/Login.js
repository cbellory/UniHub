import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { Box, Paper, Typography, TextField, Button, Alert, styled } from '@mui/material';
import { LockOpen, Person } from '@mui/icons-material';

// Styled Components for background effects
const BackgroundGlow = styled(Box)({
  position: 'absolute',
  width: '600px',
  height: '600px',
  background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(9, 9, 11, 0) 70%)',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 0,
  pointerEvents: 'none',
});

const Login = ({ onLoginSuccess }) => {
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, role } = await login(loginName, password);
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      if (typeof onLoginSuccess === 'function') onLoginSuccess();
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: '#09090b',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <BackgroundGlow />

      {/* Additional decorative elements */}
      <Box sx={{
        position: 'absolute', top: '20%', left: '20%', width: 300, height: 300,
        background: 'rgba(6, 182, 212, 0.05)', borderRadius: '50%', filter: 'blur(80px)'
      }} />

      <Paper
        elevation={24}
        sx={{
          zIndex: 1,
          width: '100%',
          maxWidth: 420,
          p: 5,
          borderRadius: 4,
          bgcolor: 'rgba(24, 24, 27, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1px', mb: 1 }}>
            <span style={{ color: '#fff' }}>Admin</span>
            <span style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Panel</span>
          </Typography>
          <Typography variant="body2" sx={{ color: '#a1a1aa' }}>
            Secure Access Gateway
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleLogin}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              InputProps={{
                startAdornment: <Person sx={{ color: '#71717a', mr: 1 }} />,
                sx: { color: '#fff' }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#8b5cf6' }
                },
                '& .MuiInputLabel-root': { color: '#71717a' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' }
              }}
            />
          </Box>

          <Box sx={{ mb: 4 }}>
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: <LockOpen sx={{ color: '#71717a', mr: 1 }} />,
                sx: { color: '#fff' }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#8b5cf6' }
                },
                '& .MuiInputLabel-root': { color: '#71717a' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' }
              }}
            />
          </Box>

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={loading}
            size="large"
            sx={{
              height: 50,
              fontSize: '1rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.3)',
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                boxShadow: '0 20px 25px -5px rgba(139, 92, 246, 0.4)',
              }
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#52525b' }}>
            Protected by Enterprise Guard
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
