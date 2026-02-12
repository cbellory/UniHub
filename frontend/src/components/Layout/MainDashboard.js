import React, { useState } from 'react';
import { Grid, Box, Tabs, Tab } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { sounds } from '../../utils/SoundManager';
import Sidebar from './Sidebar';

import TaskSystem from '../TaskSystem';
import VotingComponent from '../VotingComponent';
import Shop from '../Shop';

const MainDashboard = ({
    account,
    profile,
    setProfile,
    t,
    onOpenProfile,
    currentTab,
    setCurrentTab
}) => {
    const theme = useTheme();

    const handleTabChange = (event, newValue) => {
        sounds.playClick();
        setCurrentTab(newValue);
    };

    return (
        <Grid container spacing={4}>
            {/* Left Sidebar */}
            <Grid item xs={12} md={3} order={{ xs: 2, md: 1 }}>
                <Sidebar account={account} t={t} onOpenProfile={onOpenProfile} />
            </Grid>

            {/* Main Content */}
            <Grid item xs={12} md={9} order={{ xs: 1, md: 2 }}>
                <Box sx={{
                    background: alpha(theme.palette.background.paper, 0.4),
                    backdropFilter: 'blur(20px)',
                    borderRadius: { xs: '16px', md: '24px' }, // Smaller radius on mobile
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    overflow: 'hidden',
                    minHeight: '600px',
                    mb: { xs: 4, md: 0 } // Margin bottom on mobile so it doesn't touch the sidebar below
                }}>
                    <Tabs
                        value={currentTab}
                        onChange={handleTabChange}
                        centered
                        sx={{
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            '& .MuiTabs-indicator': {
                                height: '3px',
                                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                boxShadow: `0 0 10px ${theme.palette.primary.main}`
                            }
                        }}
                    >
                        <Tab label={t('tasks')} />
                        <Tab label={t('voting')} />
                        <Tab label={t('shop')} />
                    </Tabs>

                    <Box sx={{ p: 4 }}>
                        {currentTab === 0 && <TaskSystem account={account} profile={profile} />}
                        {currentTab === 1 && <VotingComponent account={account} tokenBalance={profile.tokenBalance} />}
                        {currentTab === 2 && <Shop account={account} profile={profile} setProfile={setProfile} />}
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
};

export default MainDashboard;
