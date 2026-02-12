import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, Grid, Avatar, TextField, Button,
  Divider, IconButton, Chip, LinearProgress, Tooltip, Tabs, Tab, Fade, CircularProgress
} from '@mui/material';
import {
  Edit, Save, ContentCopy, Share,
  AccountCircle, Inventory, People, History,
  CheckCircle, Cancel, CameraAlt, WorkspacePremium, School, Refresh as RefreshIcon
} from '@mui/icons-material';
import apiService from '../services/apiService';
import { shopItems } from '../data/shopItems';
import { useLanguage } from '../contexts/LanguageContext';
import { getAvatarProps } from '../utils/avatarUtils';
import DiplomaViewer from './DiplomaViewer';

// Helper to normalize IDs (handle mismatch between 'blue_neon' and 'blue-neon')
const normalizeId = (id) => id ? id.replace(/_/g, '-') : '';

const UserProfile = ({ account, profile, onProfileUpdate, onClose, refreshProfile }) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [referrals, setReferrals] = useState([]);

  const handleSyncBalance = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await apiService.syncBalance(account);
      if (refreshProfile) refreshProfile();
    } catch (error) {
      console.error("Sync error:", error);
      alert(t('syncError') || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };
  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsEditing(true); // Automatically enable edit mode if file selected
    }
  };

  // Initial state setup
  useEffect(() => {
    if (profile && !isEditing) {
      setUsername(profile.username || '');
    }
  }, [profile, isEditing]);

  // Load Referrals
  useEffect(() => {
    if (activeTab === 3 && account) { // Network tab
      loadReferrals();
    }
  }, [activeTab, account]);

  const [badges, setBadges] = useState([]);


  useEffect(() => {
    // Fetch all badges definitions
    apiService.getBadges().then(setBadges).catch(console.error);
  }, []);



  // Refresh profile when modal opens
  useEffect(() => {
    if (refreshProfile) {
      refreshProfile();
    }
  }, [refreshProfile]);

  const loadReferrals = async () => {
    try {
      const data = await apiService.getUserReferrals(account);
      setReferrals(data.referrals || []);
    } catch (error) {
      console.error("Referral load error", error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      let response;
      if (selectedFile) {
        // Send as FormData if file exists
        const formData = new FormData();
        formData.append('username', username);
        formData.append('address', account);
        formData.append('avatar', selectedFile);
        response = await apiService.updateProfile(formData);
      } else {
        // Send as JSON if no file
        const userData = {
          username: username,
          address: account
        };
        response = await apiService.updateProfile(userData);
      }
      console.log("Server Response:", response); // For console

      if (response.wallet) {
        onProfileUpdate(response.wallet);
        setIsEditing(false);
        // alert("Success! Name saved."); // Optional success feedback
      } else {
        alert("Error: Server did not return a wallet object. Response: " + JSON.stringify(response));
      }
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}?ref=${account}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEquip = async (item) => {
    try {
      const res = await apiService.equipShopItem(item.id, item.type, account);
      if (res.success) {
        onProfileUpdate({ equipped: res.equipped });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnequip = async (type) => {
    try {
      const res = await apiService.unequipShopItem(type, account);
      if (res.success) {
        onProfileUpdate({ equipped: res.equipped });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!profile) return null;

  // Visuals
  const frameClass = profile.equipped?.avatarFrame || '';
  const nickClass = profile.equipped?.nickEffect || '';
  const bgClass = profile.equipped?.profileBg || '';

  // Filter owned items
  const myItems = (profile.inventory || [])
    .map(itemId => shopItems.find(i => normalizeId(i.id) === normalizeId(itemId)))
    .filter(Boolean);

  return (
    <Container maxWidth="lg" sx={{
      mt: 0, // Remove margin top as it is inside modal
      mb: 0, // Remove margin bottom
      height: '100%', // Fill modal height
      overflowY: 'auto', // Enable scrolling
      p: { xs: 2, md: 4 } // Consistent padding
    }}>
      <Tooltip title="Close Profile">
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 10,
            bgcolor: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.2)',
            '&:hover': { bgcolor: 'rgba(239,68,68,0.2)', borderColor: '#ef4444' }
          }}
        >
          <Cancel sx={{ color: '#fff' }} />
        </IconButton>
      </Tooltip>

      {/* Dynamic Background */}
      {bgClass && <div className={`${bgClass} profile-bg-layer`} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, opacity: 0.7 }} />}

      <Paper className="glass-card" sx={{ p: { xs: 2, md: 4 }, mb: 4, position: 'relative', overflow: 'hidden' }}>
        <Grid container spacing={{ xs: 2, sm: 4 }} alignItems="center" direction={{ xs: 'column', sm: 'row' }} textAlign={{ xs: 'center', sm: 'left' }}>
          <Grid item>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <div className={frameClass} style={{ padding: frameClass ? '5px' : '0' }}>
                <Avatar
                  {...getAvatarProps(previewUrl || (profile.avatarUrl ? (profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `/${profile.avatarUrl.replace(/^\//, '')}`) : null), account)}
                  sx={{
                    ...getAvatarProps(previewUrl || (profile.avatarUrl ? (profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `/${profile.avatarUrl.replace(/^\//, '')}`) : null), account).sx,
                    width: { xs: 64, sm: 80, md: 120 }, // Smaller on mobile/tablet
                    height: { xs: 64, sm: 80, md: 120 },
                    border: '4px solid rgba(255,255,255,0.1)'
                  }}
                />
                {/* Upload Button Overlay */}
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="avatar-upload-file"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="avatar-upload-file">
                  <IconButton
                    color="primary"
                    aria-label="upload picture"
                    component="span"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: { xs: 30, md: 40 }, // Smaller button
                      height: { xs: 30, md: 40 },
                      bgcolor: 'background.paper',
                      boxShadow: 3,
                      '&:hover': { bgcolor: 'background.default' }
                    }}
                  >
                    <CameraAlt fontSize="small" />
                  </IconButton>
                </label>
              </div>
            </Box>
          </Grid>
          <Grid item xs>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'center' }, gap: { xs: 1, sm: 2 }, mb: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
              <Typography variant="h4" fontWeight="bold" className={nickClass} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' } }}>
                {profile.username || 'Agent'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip label={`Lvl ${profile.battlePassLevel}`} color="secondary" size="small" />
                {profile.group && <Chip label={`Group: ${profile.group}`} color="primary" size="small" />}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                {account}
              </Typography>
              <IconButton
                href={`https://testnet.bscscan.com/address/${account}`}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{
                  color: '#f0b90b',
                  bgcolor: 'rgba(240, 185, 11, 0.1)',
                  border: '1px solid rgba(240, 185, 11, 0.3)',
                  p: 0.5,
                  '&:hover': {
                    bgcolor: 'rgba(240, 185, 11, 0.2)',
                  }
                }}
                title="View on BscScan"
              >
                <img src="https://bscscan.com/images/brand/bscscan-logo-circle.png" alt="BscScan" style={{ width: 16, height: 16 }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }} />
                <Box component="span" sx={{ display: 'none', fontSize: '0.7rem', fontWeight: 'bold' }}>BSC</Box>
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', gap: { xs: 2, sm: 4 }, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
              <Box>
                <Typography variant="caption" color="text.secondary">{t('xpPoints')}</Typography>
                <Typography variant="h6" sx={{ color: '#10b981', fontSize: { xs: '1rem', md: '1.25rem' } }}>{profile.points.toLocaleString()}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{t('quantumTokens')}</Typography>
                <Typography variant="h6" sx={{ color: '#f59e0b', fontSize: { xs: '1rem', md: '1.25rem' }, display: 'flex', alignItems: 'center' }}>
                  {profile.tokenBalance.toLocaleString()}
                  <Typography component="span" variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
                    {t('internalBalance')}
                  </Typography>
                  <Tooltip title={t('syncBalance') || "Sync Balance"}>
                    <IconButton size="small" onClick={handleSyncBalance} disabled={syncing} sx={{ ml: 1 }}>
                      {syncing ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.7)' }} />}
                    </IconButton>
                  </Tooltip>
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        sx={{ mb: 3, borderBottom: '1px solid rgba(255,255,255,0.1)' }}
        variant="scrollable"
        scrollButtons="auto"
        textColor="secondary"
        indicatorColor="secondary"
      >
        <Tab icon={<AccountCircle />} label={t('identity')} iconPosition="start" />
        <Tab icon={<Inventory />} label={t('inventory')} iconPosition="start" />
        <Tab icon={<WorkspacePremium />} label={t('achievements') || 'Badges'} iconPosition="start" />
        <Tab icon={<People />} label={t('network')} iconPosition="start" />
        <Tab icon={<School />} label="Сертифікати" iconPosition="start" />
      </Tabs>

      {/* IDENTITY TAB */}
      {activeTab === 0 && (
        <Fade in={true}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Paper className="glass-card" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>{t('agentProfile')}</Typography>
                <Box sx={{ mt: 3 }}>
                  <Typography variant="caption" color="text.secondary">{t('codename')}</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      size="small"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={!isEditing}
                      sx={{
                        '& .MuiOutlinedInput-root': { color: '#fff' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' }
                      }}
                    />
                    {isEditing ? (
                      <Button variant="contained" color="secondary" onClick={handleSaveProfile} startIcon={<Save />}>
                        {t('saveChanges')}
                      </Button>
                    ) : (
                      <Button variant="outlined" color="inherit" onClick={() => setIsEditing(true)} startIcon={<Edit />}>
                        {t('edit')}
                      </Button>
                    )}
                  </Box>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper className="glass-card" sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="overline" color="text.secondary">{t('nicknamePreview')}</Typography>
                <Box sx={{ mt: 2, p: 4, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2 }}>
                  <Typography variant="h3" className={nickClass} sx={{ fontWeight: 'bold' }}>
                    {username || 'Agent'}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Fade>
      )}

      {/* INVENTORY TAB */}
      {activeTab === 1 && (
        <Fade in={true}>
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>{t('myCollection')}</Typography>
            {myItems.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5, opacity: 0.5 }}>
                <Inventory sx={{ fontSize: 60, mb: 1 }} />
                <Typography>{t('emptyInventory')}</Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {myItems.map((item, index) => {
                  const isEquipped = profile.equipped && (
                    profile.equipped.avatarFrame === item.id ||
                    profile.equipped.nickEffect === item.id ||
                    profile.equipped.profileBg === item.id
                  );

                  return (
                    <Grid item xs={6} sm={4} md={3} key={`${item.id}-${index}`}>
                      <Paper sx={{ p: 2, bgcolor: isEquipped ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)', border: isEquipped ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)' }}>
                        <Typography variant="subtitle2" fontWeight="bold">{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">{item.type.toUpperCase()}</Typography>
                        <Box sx={{ mt: 2 }}>
                          {isEquipped ? (
                            <Button size="small" variant="outlined" color="warning" fullWidth onClick={() => handleUnequip(item.type)}>
                              {t('unequip')}
                            </Button>
                          ) : (
                            <Button size="small" variant="contained" fullWidth onClick={() => handleEquip(item)}>
                              {t('equip')}
                            </Button>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        </Fade>
      )}

      {/* ACHIEVEMENTS TAB */}
      {activeTab === 2 && (
        <Fade in={true}>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">{t('achievements') || 'Achievements'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {profile.badges?.length || 0} / {badges.length} earned
              </Typography>
            </Box>

            {/* Scrollable Badge Grid */}
            <Box sx={{
              maxHeight: { xs: '400px', md: '500px' },
              overflowY: 'auto',
              pr: 1,
              '&::-webkit-scrollbar': { width: '8px' },
              '&::-webkit-scrollbar-track': { bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '10px' },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '10px', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }
            }}>
              <Grid container spacing={2}>
                {/* Earned Badges */}
                {profile.badges && profile.badges.map(b => {
                  const badgeInfo = badges.find(i => i.id === b.badgeId);
                  if (!badgeInfo) {
                    console.warn(`Badge definition not found for: ${b.badgeId}`);
                    return null;
                  }
                  return (
                    <Grid item xs={6} sm={4} md={3} key={b.badgeId}>
                      <Paper sx={{
                        p: 2, textAlign: 'center',
                        bgcolor: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid #f59e0b',
                        transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.05)' }
                      }}>
                        <Typography variant="h3" sx={{ mb: 1 }}>{badgeInfo?.iconUrl || '🏆'}</Typography>
                        <Typography variant="subtitle1" fontWeight="bold">{badgeInfo?.name?.ua || b.badgeId}</Typography>
                        <Typography variant="caption" sx={{ color: '#fbbf24' }}>
                          {new Date(b.date).toLocaleDateString()}
                        </Typography>
                      </Paper>
                    </Grid>
                  )
                })}

                {/* Locked Badges */}
                {badges.filter(allB => !profile.badges?.some(myB => myB.badgeId === allB.id)).map(locked => (
                  <Grid item xs={6} sm={4} md={3} key={locked.id}>
                    <Paper sx={{
                      p: 2, textAlign: 'center',
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      opacity: 0.5, filter: 'grayscale(1)'
                    }}>
                      <Typography variant="h3" sx={{ mb: 1 }}>{locked.iconUrl || '🔒'}</Typography>
                      <Typography variant="subtitle1" fontWeight="bold">{locked.name?.ua}</Typography>
                      <Tooltip title={locked.description?.ua || ''} placement="top">
                        <Typography variant="caption" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {locked.description?.ua}
                        </Typography>
                      </Tooltip>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        </Fade>
      )}

      {/* NETWORK TAB (Referrals) */}
      {activeTab === 3 && (
        <Fade in={true}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={5}>
              <Paper className="glass-card" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Share fontSize="small" /> {t('recruitmentLink')}
                </Typography>
                <Box
                  sx={{
                    p: 2, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    border: '1px dashed rgba(255,255,255,0.2)',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.4)', borderColor: '#fff' }
                  }}
                  onClick={handleCopyLink}
                >
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {window.location.origin}?ref=...{account.slice(-6)}
                  </Typography>
                  <ContentCopy fontSize="small" sx={{ color: copied ? '#10b981' : 'inherit' }} />
                </Box>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', color: copied ? '#10b981' : 'text.secondary' }}>
                  {copied ? t('linkCopied') : t('clickToCopy')}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={7}>
              <Typography variant="h6" gutterBottom>{t('recruits')} ({referrals.length})</Typography>
              {referrals.map(ref => (
                <Paper key={ref._id} sx={{ p: 2, mb: 1, bgcolor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      {...getAvatarProps(ref.avatarUrl, ref.address)}
                      sx={{ ...getAvatarProps(ref.avatarUrl, ref.address).sx, width: 32, height: 32 }}
                    />
                    <Typography variant="body2">{ref.username || 'Unknown Agent'}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(ref.createdAt).toLocaleDateString()}
                  </Typography>
                </Paper>
              ))}
            </Grid>
          </Grid>
        </Fade>
      )}

      {activeTab === 4 && (
        <Fade in={true}>
          <Paper className="glass-card" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Мої сертифікати</Typography>
            <DiplomaViewer userAddress={account} compact={true} />
          </Paper>
        </Fade>
      )}
    </Container>
  );
};

export default UserProfile;
