import React from 'react';
import { 
  Box, IconButton, Tooltip, Menu, MenuItem, ListItemIcon, 
  ListItemText, Switch, Divider, Typography 
} from '@mui/material';
import { 
  Settings, Language, VolumeUp, VolumeOff 
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { sounds } from '../../utils/SoundManager';

export const SettingsButton = ({ onClick, isChatOpen }) => {
  const theme = useTheme();
  
  return (
    <Tooltip title="Settings">
      <IconButton
        onClick={onClick}
        sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          display: { xs: isChatOpen ? 'none' : 'flex', md: 'flex' },
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          color: theme.palette.text.primary,
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.2),
            borderColor: theme.palette.primary.main,
            transform: 'rotate(90deg)',
            transition: 'transform 0.5s ease'
          },
          transition: 'all 0.3s ease'
        }}
      >
        <Settings />
      </IconButton>
    </Tooltip>
  );
};

export const SettingsMenu = ({ 
  anchorEl, 
  onClose, 
  language, 
  onToggleLanguage, 
  isMuted, 
  onToggleMute, 
  themeMode, 
  onThemeChange 
}) => {
  const theme = useTheme();

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      PaperProps={{
        sx: {
          mt: 1.5,
          bgcolor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          borderRadius: '16px',
          minWidth: 220,
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          '& .MuiMenuItem-root': {
            borderRadius: '8px',
            mx: 1,
            my: 0.5,
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.1)
            }
          }
        }
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {/* Language Toggle */}
      <MenuItem onClick={() => { sounds.playClick(); onToggleLanguage(); }}>
        <ListItemIcon sx={{ color: theme.palette.primary.main }}>
          <Language fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={language === 'en' ? 'English' : 'Українська'} secondary="Switch Language" />
      </MenuItem>

      {/* Sound Toggle */}
      <MenuItem onClick={() => { onToggleMute(); }}>
        <ListItemIcon sx={{ color: theme.palette.secondary.main }}>
          {isMuted ? <VolumeOff fontSize="small" /> : <VolumeUp fontSize="small" />}
        </ListItemIcon>
        <ListItemText primary={isMuted ? "Sound: Off" : "Sound: On"} />
        <Switch checked={!isMuted} size="small" color="secondary" />
      </MenuItem>

      <Divider sx={{ my: 1, borderColor: alpha(theme.palette.divider, 0.1) }} />

      {/* Theme Selection */}
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1, mb: 1, display: 'block' }}>
          THEME SELECT
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
          {['blue', 'pink', 'green'].map((mode) => (
            <Tooltip key={mode} title={mode.charAt(0).toUpperCase() + mode.slice(1)}>
              <Box
                onClick={() => onThemeChange(mode)}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  bgcolor: mode === 'blue' ? '#6366f1' : mode === 'pink' ? '#ec4899' : '#10b981',
                  border: themeMode === mode ? `2px solid ${theme.palette.text.primary}` : '2px solid transparent',
                  boxShadow: themeMode === mode ? `0 0 15px ${theme.palette.primary.main}` : 'none',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'scale(1.2)' }
                }}
              />
            </Tooltip>
          ))}
        </Box>
      </Box>
    </Menu>
  );
};
