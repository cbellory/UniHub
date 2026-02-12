import React, { useState, useEffect, useCallback } from "react";
import { Container, Box, Modal, ThemeProvider, CssBaseline, Typography } from '@mui/material';
import { sounds } from './utils/SoundManager';
import { getTheme } from './theme';
import UserProfile from './components/UserProfile';
import GlobalChat from './components/GlobalChat';
import { connectWallet, disconnectWallet, fetchUserProfile } from './services/walletConnectService';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

// New Refactored Components
import { SettingsButton, SettingsMenu } from './components/Layout/SettingsMenu';
import DashboardHeader from './components/Layout/DashboardHeader';
import WelcomeScreen from './components/Layout/WelcomeScreen';
import MainDashboard from './components/Layout/MainDashboard';

function AppContent() {
  const { t, language, toggleLanguage } = useLanguage();
  const [account, setAccount] = useState(localStorage.getItem('walletAddress') || null);
  const [profile, setProfile] = useState({ username: '', avatarUrl: '', tokenBalance: 0, points: 0 });
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // Track which user's profile to view
  const [isChatOpen, setIsChatOpen] = useState(false); // Track if chat is open to hide other UI on mobile
  const [isMuted, setIsMuted] = useState(sounds.isMuted);
  const [themeMode, setThemeMode] = useState('blue'); // 'blue', 'pink', 'green'
  const [activeTheme, setActiveTheme] = useState(getTheme('blue'));
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null); // Settings Menu State
  const [isConnected, setIsConnected] = useState(!!account);
  const [error, setError] = useState(null);
  const [referralAddress, setReferralAddress] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralAddress(ref);
    }
  }, []);

  const fetchProfileOnLoad = useCallback(() => {
    if (account && !profile.username && isConnected) {
      fetchUserProfile(account, setProfile, setError);
    }
  }, [account, profile.username, isConnected]);

  useEffect(() => {
    fetchProfileOnLoad();
  }, [fetchProfileOnLoad]);

  const handleDisconnectWallet = async () => {
    await disconnectWallet(account, setAccount, setProfile, setIsConnected, setError);
  };

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(prevProfile => ({ ...prevProfile, ...updatedProfile }));
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    if (!muted) sounds.playClick();
  };

  const handleThemeChange = (mode) => {
    sounds.playClick();
    setThemeMode(mode);
    setActiveTheme(getTheme(mode));
  };

  const handleOpenProfile = (user) => {
    if (user.address === account || user.sender === account) {
      // It's me
      setSelectedUser(null);
    } else {
      // It's someone else
      // Map chat user object to profile structure if needed
      setSelectedUser({
        username: user.username,
        avatarUrl: user.avatar, // Chat uses 'avatar', profile uses 'avatarUrl'
        address: user.sender || user.address,
        // Default values for public view if not fully fetched yet (could fetch via API)
        battlePassLevel: '?',
        points: 0,
        tokenBalance: 0,
        ...user // Spread just in case
      });
    }
    setOpenProfileModal(true);
  };

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />

      {/* Background Effects */}
      <div className="cyber-grid-bg" />
      <div className="crt-overlay" />

      {/* --- SETTINGS BUTTON --- */}
      <SettingsButton
        onClick={(e) => setSettingsAnchorEl(e.currentTarget)}
        isChatOpen={isChatOpen}
      />

      {/* --- SETTINGS MENU --- */}
      <SettingsMenu
        anchorEl={settingsAnchorEl}
        onClose={() => setSettingsAnchorEl(null)}
        language={language}
        onToggleLanguage={toggleLanguage}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        themeMode={themeMode}
        onThemeChange={handleThemeChange}
      />

      <Container maxWidth="xl" sx={{ py: 6, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* --- GLOBAL ERROR DISPLAY --- */}
        {error && (
          <Box sx={{
            p: 2, mb: 4,
            borderRadius: 2,
            bgcolor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            textAlign: 'center'
          }}>
            <Typography color="error" variant="body1">{error}</Typography>
          </Box>
        )}

        {/* --- WELCOME SCREEN (NOT CONNECTED) --- */}
        {!isConnected ? (
          <WelcomeScreen
            t={t}
            onConnect={() => connectWallet(setAccount, setIsConnected, setProfile, setError, referralAddress)}
          />
        ) : (
          <>
            {/* --- DASHBOARD HEADER --- */}
            <DashboardHeader
              account={account}
              profile={profile}
              onOpenProfile={() => { setSelectedUser(null); setOpenProfileModal(true); }}
              onDisconnect={handleDisconnectWallet}
              t={t}
            />

            {/* --- MAIN DASHBOARD GRID --- */}
            <MainDashboard
              account={account}
              profile={profile}
              setProfile={setProfile}
              t={t}
              onOpenProfile={handleOpenProfile}
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
            />
          </>
        )}

        {/* --- PROFILE MODAL --- */}
        <Modal
          open={openProfileModal}
          onClose={() => setOpenProfileModal(false)}
          aria-labelledby="profile-modal"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '95%', sm: '90%', md: '70%', lg: '60%' },
            maxWidth: '900px',
            height: { xs: '90vh', sm: '85vh' },
            bgcolor: activeTheme.palette.background.default, // Hard dark bg for modal to ensure readability
            borderRadius: '24px',
            border: `1px solid ${activeTheme.palette.primary.main}`,
            boxShadow: '0 0 50px rgba(0,0,0,0.8)',
            outline: 'none',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <UserProfile
              account={selectedUser ? selectedUser.address : account}
              profile={selectedUser || profile}
              isReadOnly={!!selectedUser}
              onClose={() => setOpenProfileModal(false)}
              onProfileUpdate={handleProfileUpdate}
              refreshProfile={useCallback(() => {
                // Force refresh profile when modal is opened
                if (!selectedUser && account) {
                  fetchUserProfile(account, setProfile, setError);
                }
              }, [selectedUser, account])}
            />
          </Box>
        </Modal>

        {/* --- GLOBAL CHAT WIDGET --- */}
        {isConnected && (
          <GlobalChat
            account={account}
            profile={profile}
            onOpenProfile={handleOpenProfile}
            onStateChange={setIsChatOpen}
          />
        )}

      </Container>
    </ThemeProvider>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;