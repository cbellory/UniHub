
import React, { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemAvatar, ListItemText, Avatar, CircularProgress, useTheme, alpha } from '@mui/material';
import StudentProfileModal from './StudentProfileModal';

import { useLanguage } from '../contexts/LanguageContext';
import { getAvatarProps } from '../utils/avatarUtils';

const UserRating = ({ account }) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const [userRatings, setUserRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleUserClick = (address) => {
    setSelectedAddress(address);
    setModalOpen(true);
  };

  useEffect(() => {
    const fetchUserRating = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users/rating');
        if (!response.ok) {
          console.warn("API failed");
        } else {
          const data = await response.json();
          setUserRatings(data);
        }
      } catch (error) {
        setError(error.message || t('failedToLoadData'));
      } finally {
        setLoading(false);
      }
    };

    fetchUserRating();
  }, [t]);

  const truncateAddress = (address) => address ? `${address.slice(0, 6)}...${address.slice(-4)} ` : '';

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress color="secondary" /></Box>;
  }

  return (
    <Box sx={{ width: '100%', mx: 'auto' }}>
      <List disablePadding>
        {userRatings.length > 0 ? (
          userRatings.map((user, index) => {
            const isCurrentUser = account && user.address && user.address.toLowerCase() === account.toLowerCase();
            const avatarFrameClass = user.equipped?.avatarFrame || '';
            const nickEffectClass = user.equipped?.nickEffect || '';
            const profileBgClass = user.equipped?.profileBg || '';

            return (
              <React.Fragment key={user._id}>
                <ListItem
                  className={profileBgClass} // Apply Background Class to Item
                  sx={{
                    my: 1,
                    py: 1.5,
                    px: 1.5, // Reduced padding for better mobile fit
                    borderRadius: '16px',
                    background: isCurrentUser
                      ? `linear - gradient(90deg, ${alpha(theme.palette.primary.main, 0.1)} 0 %, transparent 100 %)`
                      : 'rgba(255,255,255,0.02)',
                    // If bg class is present, we might want to ensure default background doesn't override it, 
                    // but CSS classes usually have high specificity or use !important if needed.
                    border: '1px solid',
                    borderColor: isCurrentUser ? theme.palette.primary.main : 'transparent',
                    transition: 'all 0.3s ease',
                    cursor: 'default',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.05)',
                      transform: 'translateX(5px)',
                      borderColor: theme.palette.divider
                    }
                  }}
                  onClick={() => handleUserClick(user.address)}
                >
                  {/* Rank Badge */}
                  <Box sx={{
                    minWidth: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: index < 3 ? theme.palette.secondary.main : 'rgba(255,255,255,0.1)',
                    color: index < 3 ? '#000' : 'text.secondary',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    boxShadow: index < 3 ? `0 0 10px ${theme.palette.secondary.main} ` : 'none'
                  }}>
                    {index + 1}
                  </Box>

                  {/* Hybrid Stacked Layout: Row 1 (Name+XP), Row 2 (Address) */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    gap: 1.5
                  }}>
                    {/* Column 1: Avatar */}
                    <Box sx={{ display: 'flex' }}>
                      <ListItemAvatar sx={{ minWidth: 'auto', mr: 0 }}>
                        <Box sx={{ position: 'relative', display: 'inline-block' }}>
                          <Avatar
                            src={user.avatarUrl || undefined}
                            alt={user.username}
                            className={avatarFrameClass}
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: user.avatarUrl ? 'transparent' : (index < 3 ? theme.palette.secondary.main : theme.palette.primary.dark),
                              color: '#fff',
                              fontSize: '0.9rem',
                              fontWeight: 'bold',
                              border: avatarFrameClass ? 'none' : `2px solid ${index < 3 ? theme.palette.secondary.main : theme.palette.divider}`,
                              boxShadow: (!avatarFrameClass && index < 3) ? `0 0 10px ${alpha(theme.palette.secondary.main, 0.4)}` : 'none'
                            }}
                          >
                            {!user.avatarUrl && (user.address ? user.address.substring(0, 2).toUpperCase() : '??')}
                          </Avatar>
                        </Box>
                      </ListItemAvatar>
                    </Box>

                    {/* Column 2: Content Stack */}
                    <Box sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      flex: '1 1 auto',
                      minWidth: 0, // Critical for truncation
                      justifyContent: 'center'
                    }}>

                      {/* Row 1: Name (Left) + XP (Right) */}
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        mb: 0.2
                      }}>
                        <Typography
                          variant="body2"
                          className={nickEffectClass}
                          title={user.username || user.address}
                          sx={{
                            fontWeight: 'bold',
                            color: isCurrentUser ? 'primary.light' : 'text.primary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.2,
                            mr: 1 // Gap between Name and XP
                          }}
                        >
                          {user.username || truncateAddress(user.address)}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.primary.main,
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            fontSize: '0.7rem', // Reduced size
                            ml: 0.5,
                            display: 'flex',
                            alignItems: 'baseline'
                          }}
                        >
                          {user.points}
                          <span style={{ fontSize: '0.7em', marginLeft: '2px', opacity: 0.8 }}>XP</span>
                        </Typography>
                      </Box>

                      {/* Row 2: Address (Full Width) */}
                      <Typography
                        variant="caption"
                        title={user.address}
                        sx={{
                          color: 'text.secondary',
                          fontFamily: 'monospace',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          width: '100%',
                          fontSize: '0.7rem'
                        }}
                      >
                        {truncateAddress(user.address)}
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
              </React.Fragment>
            );
          })
        ) : (
          <Box sx={{ textAlign: 'center', py: 4, opacity: 0.6 }}>
            <Typography variant="body2">{error || t('noAgentsFound')}</Typography>
          </Box>
        )}
      </List>
      <StudentProfileModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        address={selectedAddress}
      />
    </Box>
  );
};

export default UserRating;