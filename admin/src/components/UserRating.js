import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Typography,
  Chip,
  Box,
  CircularProgress
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const UserRating = () => {
  const [userRatings, setUserRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserRating = async () => {
      try {
        // Assuming your proxy is set up correctly in package.json, otherwise use full URL
        const response = await fetch('https://cbellory.online/api/users/rating', {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Помилка при отриманні рейтингу');
        const data = await response.json();
        setUserRatings(data);
      } catch (error) {
        setError(error.message || 'Не вдалося завантажити дані');
      } finally {
        setLoading(false);
      }
    };
    fetchUserRating();
  }, []);

  const truncateAddress = (address) =>
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A';

  const getRankStyle = (index) => {
    switch (index) {
      case 0: return { color: '#fbbf24', icon: <EmojiEventsIcon sx={{ color: '#fbbf24' }} /> }; // Gold
      case 1: return { color: '#94a3b8', icon: <EmojiEventsIcon sx={{ color: '#94a3b8' }} /> }; // Silver
      case 2: return { color: '#b45309', icon: <EmojiEventsIcon sx={{ color: '#b45309' }} /> }; // Bronze
      default: return { color: '#fff', icon: <span style={{ fontWeight: 'bold', marginLeft: 8 }}>{index + 1}</span> };
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <TableContainer component={Paper} className="glass-panel" sx={{ background: 'transparent', boxShadow: 'none' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: '#94a3b8' }}>Місце</TableCell>
            <TableCell sx={{ color: '#94a3b8' }}>Студент</TableCell>
            <TableCell sx={{ color: '#94a3b8' }} align="right">Бали (XP)</TableCell>
            <TableCell sx={{ color: '#94a3b8' }} align="right">Рівень</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {userRatings.map((user, index) => {
            const rankStyle = getRankStyle(index);
            return (
              <TableRow key={user._id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { background: 'rgba(255,255,255,0.05)' } }}>
                <TableCell component="th" scope="row">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.2rem', color: rankStyle.color }}>
                    {rankStyle.icon}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={user.avatarUrl ? `https://cbellory.online${user.avatarUrl}` : ''}
                      sx={{ width: 40, height: 40, border: index < 3 ? `2px solid ${rankStyle.color}` : 'none' }}
                    >
                      {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#f8fafc' }}>
                        {user.username || 'Невідомий'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace' }}>
                        {truncateAddress(user.address)}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Chip label={`${user.points} XP`} sx={{ bgcolor: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', fontWeight: 'bold' }} />
                </TableCell>
                <TableCell align="right">
                  <span style={{ color: '#94a3b8' }}>Lvl 1</span> {/* Placeholder for Level calculation if needed */}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UserRating;
