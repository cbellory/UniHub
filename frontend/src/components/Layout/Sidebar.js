import React from 'react';
import { Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import BattlePass from '../BattlePass';
import UserRating from '../UserRating';

const Sidebar = ({ account, t, onOpenProfile }) => {
    const theme = useTheme();

    return (
        <Box sx={{
            position: { md: 'sticky' },
            top: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 3
        }}>
            {/* Battle Pass Card */}
            <Box sx={{
                background: alpha(theme.palette.background.paper, 0.6),
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                overflow: 'hidden'
            }}>
                <BattlePass account={account} />
            </Box>

            {/* User Rating Card */}
            <Box sx={{
                background: alpha(theme.palette.background.paper, 0.6),
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                p: { xs: 2, md: 3 }, // Smaller padding on mobile
                overflow: 'hidden'
            }}>
                <Typography variant="h6" sx={{
                    mb: 2,
                    textAlign: 'center',
                    letterSpacing: '2px',
                    color: theme.palette.secondary.light,
                    textShadow: `0 0 10px ${alpha(theme.palette.secondary.main, 0.5)}`
                }}>
                    {t('topAgents')}
                </Typography>
                <UserRating account={account} onUserClick={onOpenProfile} />
            </Box>
        </Box>
    );
};

export default Sidebar;
