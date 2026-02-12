import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, CircularProgress, Paper, useTheme, Card, CardContent, CardActions, LinearProgress, Chip } from '@mui/material';
import { HowToVote, Poll } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';

const VotingComponent = ({ account, tokenBalance }) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [votedProposals, setVotedProposals] = useState(new Set());

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dao/proposals');
      if (!response.ok) {
        throw new Error('Не вдалося завантажити пропозиції'); // Message might come from backend, keep or replace? Using generic
      }
      const data = await response.json();

      const newVotedSet = new Set();
      data.forEach(prop => {
        if (prop.voters && prop.voters.includes(account)) {
          newVotedSet.add(prop._id);
        }
      });
      setVotedProposals(newVotedSet);
      setProposals(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleVote = async (proposalId, choiceIndex) => {
    if (!account) {
      alert(t('connectWalletToVote'));
      return;
    }
    if (tokenBalance <= 0) {
      alert(t('needTokensToVote'));
      return;
    }
    if (votedProposals.has(proposalId)) {
      alert(t('alreadyVoted'));
      return;
    }

    try {
      const response = await fetch('/api/dao/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: proposalId,
          choiceIndex: choiceIndex,
          address: account,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('voteError'));
      }

      alert(t('voteCastSuccess').replace('{power}', tokenBalance));
      setVotedProposals(prev => new Set(prev).add(proposalId));
      setProposals(proposals.map(p => (p._id === proposalId ? data.proposal : p)));

    } catch (err) {
      console.error(err);
      alert(`${t('voteError')}: ${err.message}`);
    }
  };

  const getPercentage = (votes, totalVotes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="secondary" /></Box>;
  if (error) return <Typography color="error" align="center" sx={{ p: 5 }}>{error}</Typography>;

  return (
    <Box sx={{ width: '100%', maxWidth: 800, margin: '0 auto' }}>

      {/* Header Widget */}
      <Box sx={{
        p: 3, mb: 4,
        textAlign: 'center',
        borderRadius: '24px',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, rgba(15, 23, 42, 0.8) 100%)`,
        border: `1px solid ${theme.palette.primary.main}`,
        boxShadow: `0 0 20px rgba(99, 102, 241, 0.2)`
      }}>
        <Typography variant="overline" sx={{ letterSpacing: '3px', color: theme.palette.primary.light }}>
          {t('decentralizedGovernance')}
        </Typography>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
          {t('daoVoting')}
        </Typography>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(0,0,0,0.3)', px: 2, py: 1, borderRadius: '12px' }}>
          <HowToVote sx={{ color: theme.palette.secondary.main }} />
          <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
            {t('yourVotingPower')}: <span style={{ color: theme.palette.secondary.main, fontWeight: 'bold' }}>{tokenBalance || 0}</span>
          </Typography>
        </Box>
      </Box>

      {proposals.length === 0 && (
        <Box sx={{ p: 8, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 4 }}>
          <Typography variant="h6" color="text.secondary">{t('noActiveProposals')}</Typography>
        </Box>
      )}

      {proposals.map(prop => {
        const totalVotes = prop.choices.reduce((acc, curr) => acc + curr.votes, 0);
        const hasVoted = votedProposals.has(prop._id);

        return (
          <Card key={prop._id} sx={{ mb: 3, position: 'relative', overflow: 'visible' }}>
            {!prop.isActive && (
              <Chip
                label={t('closed')}
                color="error"
                size="small"
                sx={{ position: 'absolute', top: -10, right: 10, zIndex: 1, boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)' }}
              />
            )}
            {prop.isActive && (
              <Chip
                label={t('active')}
                color="success"
                size="small"
                sx={{ position: 'absolute', top: -10, right: 10, zIndex: 1, boxShadow: '0 0 10px rgba(34, 197, 94, 0.4)' }}
              />
            )}

            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ color: '#fff', fontWeight: 'bold' }}>
                {prop.title}
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', lineHeight: 1.6 }}>
                {prop.description}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {prop.choices.map((choice, index) => {
                  const percent = getPercentage(choice.votes, totalVotes);
                  return (
                    <Box key={index} sx={{ position: 'relative' }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => handleVote(prop._id, index)}
                        disabled={!prop.isActive || hasVoted || !account}
                        sx={{
                          justifyContent: 'space-between',
                          p: 2,
                          height: 'auto',
                          borderRadius: '16px',
                          borderColor: 'rgba(255,255,255,0.1)',
                          background: 'rgba(255,255,255,0.02)',
                          color: '#fff',
                          '&:hover': {
                            borderColor: theme.palette.secondary.main,
                            background: 'rgba(255,255,255,0.05)',
                            transform: 'translateY(-2px)'
                          },
                          '&:disabled': {
                            borderColor: 'rgba(255,255,255,0.05)',
                            color: 'text.disabled'
                          }
                        }}
                      >
                        <Typography variant="body1" sx={{ zIndex: 2 }}>{choice.name}</Typography>
                        <Typography variant="body2" sx={{ zIndex: 2, opacity: 0.7 }}>{percent}% ({choice.votes})</Typography>

                        {/* Progress Bar Background */}
                        <Box sx={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          height: '100%',
                          width: `${percent}%`,
                          background: `linear-gradient(90deg, rgba(99, 102, 241, 0.1) 0%, rgba(217, 70, 239, 0.1) 100%)`,
                          borderRadius: '16px',
                          transition: 'width 0.5s ease-in-out',
                          opacity: hasVoted ? 1 : 0
                        }} />
                      </Button>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
            <Box sx={{ px: 4, pb: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('totalVotes')}: {totalVotes}
              </Typography>
            </Box>
          </Card>
        );
      })}
    </Box>
  );
};

export default VotingComponent;