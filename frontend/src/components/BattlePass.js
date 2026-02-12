import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, LinearProgress, useTheme, alpha } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';

const API_URL_PROGRESS = "/api/battlepass/progress";
const API_URL_LEVELS = "/api/battlepass/levels";

const BattlePass = ({ account }) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentXP, setCurrentXP] = useState(0);
  const [nextLevelXP, setNextLevelXP] = useState(1000);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBattlePassData = useCallback(async (walletAddress) => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [levelsResponse, progressResponse] = await Promise.all([
        fetch(API_URL_LEVELS),
        fetch(`${API_URL_PROGRESS}/${walletAddress}`)
      ]);

      if (!levelsResponse.ok) {
        throw new Error('Error fetching Battle Pass levels');
      }
      const levelsData = await levelsResponse.json();
      setLevels(levelsData);

      if (progressResponse.status === 404) {
        console.log("Battle Pass progress not found for new user. Using defaults.");
        setCurrentLevel(1);
        setCurrentProgress(0);
        setCurrentXP(0);
        setNextLevelXP(1000);
        setTokenBalance(0);
        return;
      }
      if (!progressResponse.ok) {
        throw new Error('Error fetching Battle Pass progress');
      }

      const progressData = await progressResponse.json();
      setTokenBalance(progressData.tokenBalance || 0);
      setCurrentLevel(progressData.battlePassLevel || 1);

      const currentLevelData = levelsData.find(level => level.level === progressData.battlePassLevel);
      const maxPointsPerLevel = currentLevelData ? currentLevelData.pointsRequired : 1000;
      const progressPercentage = (progressData.battlePassProgress / maxPointsPerLevel) * 100 || 0;

      setCurrentXP(progressData.battlePassProgress || 0);
      setNextLevelXP(maxPointsPerLevel);
      setCurrentProgress(progressPercentage);

    } catch (error) {
      console.error('Battle Pass fetch error:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBattlePassData(account);
  }, [account, fetchBattlePassData]);

  const progress = Math.min(100, Math.max(0, currentProgress)) || 0;

  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h6" sx={{
        mb: 2,
        letterSpacing: '3px',
        color: theme.palette.primary.light,
        textShadow: `0 0 12px ${alpha(theme.palette.primary.main, 0.6)}`
      }}>
        {t('battlePass')}
      </Typography>

      {/* Level Circle */}
      <Box sx={{
        position: 'relative',
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: `conic-gradient(${theme.palette.primary.main} ${progress}%, rgba(255,255,255,0.05) 0)`,
        boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.4)}`,
        mb: 2
      }}>
        <Box sx={{
          width: 70,
          height: 70,
          borderRadius: '50%',
          background: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography variant="h4" sx={{
            fontFamily: 'Orbitron',
            color: '#fff',
            fontWeight: 'bold'
          }}>
            {currentLevel}
          </Typography>
        </Box>
      </Box>

      {/* Progress Bar */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('xp')}</Typography>
          <Typography variant="caption" sx={{ color: 'text.primary' }}>
            {currentXP} / {nextLevelXP}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              boxShadow: `0 0 10px ${theme.palette.primary.main}`
            }
          }}
        />
      </Box>

      {/* Token Balance */}
      <Box sx={{
        mt: 3,
        p: 1.5,
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <Typography variant="caption" display="block" sx={{ color: 'text.secondary', mb: 0.5 }}>
          {t('balance')}
        </Typography>
        <Typography variant="h5" sx={{
          fontFamily: 'monospace',
          color: '#fff',
          letterSpacing: '1px'
        }}>
          {loading ? '...' : tokenBalance} <Typography component="span" variant="caption" sx={{ color: theme.palette.secondary.main }}>UCN</Typography>
        </Typography>
      </Box>
    </Box>
  );
};

export default BattlePass;
