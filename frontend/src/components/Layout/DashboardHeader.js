import React from 'react';
import { Box, Avatar, Typography, Button } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

const DashboardHeader = ({
    account,
    profile,
    onOpenProfile,
    onDisconnect,
    t
}) => {
    const theme = useTheme();

    const frameClass = profile?.equipped?.avatarFrame || '';
    const nickClass = profile?.equipped?.nickEffect || '';

    return (
        <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
            flexWrap: 'wrap',
            gap: 2
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }} onClick={onOpenProfile}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <div className={frameClass} style={{ padding: frameClass ? '4px' : '0', borderRadius: '50%' }}>
                        <Avatar
                            src={profile.avatarUrl ? profile.avatarUrl : undefined}
                            alt={profile.username || account}
                            sx={{
                                width: 56,
                                height: 56,
                                bgcolor: profile.avatarUrl ? 'transparent' : '#6366f1',
                                border: frameClass ? 'none' : `2px solid ${theme.palette.primary.main}`,
                                boxShadow: frameClass ? 'none' : `0 0 20px ${alpha(theme.palette.primary.main, 0.4)}`
                            }}
                        >
                            {!profile.avatarUrl && (account ? account.substring(0, 2).toUpperCase() : '??')}
                        </Avatar>
                    </div>
                </Box>
                <Box>
                    <Typography variant="h6" className={nickClass} sx={{ fontWeight: 'bold', color: '#fff' }}>
                        {profile.username || `${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {account.substring(0, 10)}...{account.substring(account.length - 8)}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                    variant="outlined"
                    onClick={onOpenProfile}
                    sx={{ borderRadius: '12px' }}
                >
                    {t('profile')}
                </Button>
                <Button
                    variant="outlined"
                    color="error"
                    onClick={onDisconnect}
                    sx={{ borderRadius: '12px' }}
                >
                    {t('disconnect')}
                </Button>
            </Box>
        </Box>
    );
};

export default DashboardHeader;
