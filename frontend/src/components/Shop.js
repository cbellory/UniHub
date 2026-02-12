import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Grid, Paper, Button, Tabs, Tab, Box, Chip
} from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; // Frames
import BadgeIcon from '@mui/icons-material/Badge'; // Nicks
import WallpaperIcon from '@mui/icons-material/Wallpaper'; // Backgrounds

import apiService from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';

const Shop = ({ account, profile, setProfile }) => {
    const { t } = useLanguage();
    const [items, setItems] = useState([]);
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchShopItems();
    }, []);

    const fetchShopItems = async () => {
        try {
            const data = await apiService.getShopItems();
            setItems(data);
        } catch (error) {
            console.error("Failed to load shop", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBuy = async (item) => {
        if (!profile || profile.tokenBalance < item.price) {
            alert(t('insufficientTokens'));
            return;
        }
        if (!window.confirm(t('confirmPurchase').replace('{name}', item.name).replace('{price}', item.price))) return;

        try {
            setLoading(true); // Show loading state

            // 1. Perform Blockchain Transaction
            // Admin address to receive funds
            const adminAddress = "0x7FdCA82e2D1b4EA9cd94B5d22a5B6d872e473dCE";
            const ucnContractAddress = "0x101D7361767cA6C581974D8b54B62aa1ae230B50";

            // Import dynamically to avoid circular dependency issues if any, or just use the imported service
            const { sendTokenTransfer } = require('../services/walletConnectService');

            console.log("Initiating transfer...");
            // DEMO MODE: Bypass actual blockchain transaction for demonstration purposes
            // const txHash = await sendTokenTransfer(account, adminAddress, item.price, ucnContractAddress);
            const txHash = "0x_DEMO_BYPASS_" + Date.now();
            console.log("Transfer sent, txHash:", txHash);

            // 2. Report to Backend
            const res = await apiService.buyShopItem(item.id, account, txHash);

            if (res.success) {
                alert(t('purchaseSuccess').replace('{name}', item.name));
                // Update local profile
                setProfile(prev => ({
                    ...prev,
                    tokenBalance: res.balance,
                    inventory: res.inventory
                }));
            }
        } catch (error) {
            console.error(error);
            alert(error.message || t('purchaseError'));
        } finally {
            setLoading(false);
        }
    };

    const handleEquip = async (item) => {
        try {
            const res = await apiService.equipShopItem(item.id, item.type, account);
            if (res.success) {
                // Update local profile equipped state
                setProfile(prev => ({
                    ...prev,
                    equipped: res.equipped
                }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const filterItems = (type) => items.filter(i => i.type === type);

    const renderItemCard = (item) => {
        const owned = profile?.inventory?.includes(item.id);
        const equipped = profile?.equipped && (
            profile.equipped.avatarFrame === item.id ||
            profile.equipped.nickEffect === item.id ||
            profile.equipped.profileBg === item.id
        );

        return (
            <Grid item xs={6} sm={6} md={4} key={item.id}>
                <Paper
                    className="glass-card"
                    sx={{
                        p: { xs: 1.5, sm: 3 },
                        textAlign: 'center',
                        border: equipped ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.4)',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-5px)' },
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* PREVIEW AREA */}
                    <Box sx={{
                        height: { xs: 80, sm: 120 },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        bgcolor: '#0f172a',
                        borderRadius: 2
                    }}>
                        {item.type === 'frame' && (
                            <div className={`${item.cssClass}`} style={{
                                width: 'auto',
                                height: '80%',
                                aspectRatio: '1 / 1',
                                borderRadius: '50%',
                                background: '#333',
                                maxWidth: '100%'
                            }}></div>
                        )}
                        {item.type === 'nick' && (
                            <Typography variant="h6" className={`${item.cssClass}`} sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>Nickname</Typography>
                        )}
                        {item.type === 'bg' && (
                            <div className={`${item.cssClass}`} style={{
                                width: '100%',
                                height: '100%',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: '8px'
                            }}></div>
                        )}
                    </Box>



                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' }, lineHeight: 1.2, mb: 0.5 }}>{item.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{item.description}</Typography>

                    <Box sx={{ mt: 'auto' }}>
                        {owned ? (
                            equipped ? (
                                <Button variant="outlined" color="success" fullWidth disabled size="small">
                                    {t('equipped')}
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    size="small"
                                    onClick={() => handleEquip(item)}
                                    sx={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6)' }}
                                >
                                    {t('equip')}
                                </Button>
                            )
                        ) : (
                            <Button
                                variant="outlined"
                                fullWidth
                                size="small"
                                onClick={() => handleBuy(item)}
                                sx={{ borderColor: '#facc15', color: '#facc15' }}
                            >
                                {t('buy')} {item.price} T
                            </Button>
                        )}
                    </Box>
                </Paper>
            </Grid>
        );
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 5, mb: 10 }}>
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' }, // Stack on mobile
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                mb: 4,
                gap: 2
            }}>
                <Typography variant="h3" fontWeight="bold" sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    fontSize: { xs: '1.75rem', sm: '3rem' } // Smaller title on mobile
                }}>
                    <ShoppingBagIcon fontSize="inherit" sx={{ color: '#d946ef' }} />
                    {t('universeShop')}
                </Typography>
                {profile && (
                    <Chip
                        label={`${profile.tokenBalance} ${t('quantumTokens')}`}
                        sx={{
                            bgcolor: 'rgba(234, 179, 8, 0.1)',
                            color: '#facc15',
                            border: '1px solid #facc15',
                            fontSize: { xs: '1rem', sm: '1.2rem' },
                            py: 2.5,
                            px: 1,
                            width: { xs: '100%', sm: 'auto' }, // Full width balance on mobile
                            justifyContent: 'center'
                        }}
                    />
                )}
            </Box>

            <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{ mb: 4, '& .MuiTab-root': { color: '#94a3b8' }, '& .Mui-selected': { color: '#fff' } }}
            >
                <Tab label={t('avatarFrames')} icon={<AutoAwesomeIcon />} iconPosition="start" />
                <Tab label={t('nickEffects')} icon={<BadgeIcon />} iconPosition="start" />
                <Tab label={t('profileBackgrounds')} icon={<WallpaperIcon />} iconPosition="start" />
            </Tabs>

            {loading ? (
                <Typography>{t('loadingData')}</Typography>
            ) : (
                <Grid container spacing={3}>
                    {activeTab === 0 && filterItems('frame').map(renderItemCard)}
                    {activeTab === 1 && filterItems('nick').map(renderItemCard)}
                    {activeTab === 2 && filterItems('bg').map(renderItemCard)}
                </Grid>
            )}
        </Container>
    );
};

export default Shop;
