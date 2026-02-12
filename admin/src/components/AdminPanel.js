import React, { useState, useEffect } from 'react';
import { Typography, Paper } from '@mui/material';
import TaskManager from './TaskManager';
import TaskVerification from './TaskVerification';
import StudentProfileModal from './StudentProfileModal';
import WalletManager from './WalletManager';
import UserRating from './UserRating';
import BattlePassAdmin from './BattlePassAdmin';
import UserManagement from './UserManagement';
import DaoManager from './DaoManager';
import GroupManager from './GroupManager';
import EducationManager from './EducationManager';
import BlockchainManager from './BlockchainManager';
import Dashboard from './Dashboard';
import BackupManager from './BackupManager';
import ServerMonitor from './ServerMonitor';
import {
  Drawer, AppBar, Toolbar, IconButton, Box, useTheme, useMediaQuery, CssBaseline
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';

import {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
} from '../services/adminApi';
import {
  getWallets,
  updateWallet,
  deleteWallet,
} from '../services/walletApi';
import './AdminPanel.css';

const AdminPanel = ({ userRole }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [tasks, setTasks] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [editingWallet, setEditingWallet] = useState(null);

  // Student Profile Modal State
  const [profileAddress, setProfileAddress] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Responsive Drawer State
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const openStudentProfile = (address) => {
    setProfileAddress(address);
    setProfileOpen(true);
  };

  useEffect(() => {
    fetchTasks();
    if (userRole === 'superadmin' || userRole === 'admin') {
      fetchWallets();
    }
  }, [userRole]);

  const fetchTasks = async () => {
    try {
      const result = await getTasks();
      setTasks(result);
    } catch (error) {
      console.error('Помилка під час отримання завдань.', error);
    }
  };

  const fetchWallets = async () => {
    try {
      const result = await getWallets();
      setWallets(result);
    } catch (error) {
      console.error('Помилка під час отримання гаманців.', error);
    }
  };

  const handleSaveTask = (task) => {
    const taskToSend = { ...task, points: Number(task.points || 0) };
    if (taskToSend._id) {
      updateTask(taskToSend._id, taskToSend).then(() => {
        fetchTasks();
        setEditingTask(null);
      });
    } else {
      addTask(taskToSend).then(() => {
        fetchTasks();
        setEditingTask(null);
      });
    }
  };

  const handleSaveWallet = async (wallet) => {
    if (wallet.address) {
      const updateData = {
        points: Number(wallet.points),
        tokenBalance: Number(wallet.tokenBalance),
        group: wallet.group,
      };
      await updateWallet(wallet.address, updateData);
      await fetchWallets();
      setEditingWallet(null);
    }
  };

  const handleDeleteTask = (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    console.log("Attempting to delete task with ID:", taskId);
    deleteTask(taskId)
      .then(() => {
        console.log("Task deleted successfully");
        fetchTasks();
      })
      .catch((error) => {
        console.error("Error deleting task:", error);
        alert(`Не вдалося видалити завдання: ${error.message || "Невідомя помилка"}`);
      });
  };
  const handleDeleteWallet = (walletAddress) =>
    deleteWallet(walletAddress).then(fetchWallets);
  const handleAddTask = () => setEditingTask({ name: '', url: '', points: 0, type: 'auto' });
  const handleEditTask = (task) => {
    setEditingTask(task);
    setEditingWallet(null);
  };
  const handleEditWallet = (wallet) => {
    setEditingWallet(wallet);
    setEditingTask(null);
  };
  const handleCancelTaskEdit = () => setEditingTask(null);
  const handleCancelWalletEdit = () => setEditingWallet(null);

  const drawerContent = (
    <div className="admin-sidebar" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="sidebar-brand">
        <span>Admin</span>Panel
      </div>

      {/* GROUP 1: DAILY WORK */}
      <div className="nav-group">
        <p className="nav-label">Робочий простір</p>

        <button
          className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setCurrentView('dashboard'); if (isMobile) setMobileOpen(false); }}
        >
          <span>🏠</span> Головна
        </button>

        {(userRole === 'superadmin' || userRole === 'admin') && (
          <button
            className={`nav-link ${currentView === 'monitor' ? 'active' : ''}`}
            onClick={() => { setCurrentView('monitor'); if (isMobile) setMobileOpen(false); }}
          >
            <span>🖥️</span> Моніторинг
          </button>
        )}

        <button
          className={`nav-link ${currentView === 'verification' ? 'active' : ''}`}
          onClick={() => { setCurrentView('verification'); if (isMobile) setMobileOpen(false); }}
        >
          <span>✅</span> Перевірка робіт
        </button>

        {(userRole === 'superadmin' || userRole === 'admin') && (
          <button
            className={`nav-link ${currentView === 'wallets' ? 'active' : ''}`}
            onClick={() => { setCurrentView('wallets'); if (isMobile) setMobileOpen(false); }}
          >
            <span>👨‍🎓</span> Студенти
          </button>
        )}

        {(userRole === 'superadmin' || userRole === 'admin') && (
          <button
            className={`nav-link ${currentView === 'groups' ? 'active' : ''}`}
            onClick={() => { setCurrentView('groups'); if (isMobile) setMobileOpen(false); }}
          >
            <span>🏫</span> Навчальні групи
          </button>
        )}

        <button
          className={`nav-link ${currentView === 'rating' ? 'active' : ''}`}
          onClick={() => { setCurrentView('rating'); if (isMobile) setMobileOpen(false); }}
        >
          <span>🏆</span> Рейтинг
        </button>
      </div>

      {/* GROUP 2: CURRICULUM */}
      <div className="nav-group" style={{ marginTop: 24 }}>
        <p className="nav-label">Навчальний процес</p>

        {(userRole === 'superadmin' || userRole === 'admin') && (
          <button
            className={`nav-link ${currentView === 'education' ? 'active' : ''}`}
            onClick={() => { setCurrentView('education'); if (isMobile) setMobileOpen(false); }}
          >
            <span>🌳</span> Дерево навичок
          </button>
        )}

        <button
          className={`nav-link ${currentView === 'tasks' ? 'active' : ''}`}
          onClick={() => { setCurrentView('tasks'); if (isMobile) setMobileOpen(false); }}
        >
          <span>📚</span> Бібліотека завдань
        </button>
      </div>

      {/* GROUP 3: PLATFORM */}
      <div className="nav-group" style={{ marginTop: 24, paddingBottom: 24 }}>
        <p className="nav-label">Платформа та Система</p>

        {(userRole === 'superadmin' || userRole === 'admin') && (
          <button
            className={`nav-link ${currentView === 'dao' ? 'active' : ''}`}
            onClick={() => { setCurrentView('dao'); if (isMobile) setMobileOpen(false); }}
          >
            <span>🏛️</span> DAO Голосування
          </button>
        )}

        {userRole === 'superadmin' && (
          <button
            className={`nav-link ${currentView === 'battlepass' ? 'active' : ''}`}
            onClick={() => { setCurrentView('battlepass'); if (isMobile) setMobileOpen(false); }}
          >
            <span>🎫</span> Battle Pass
          </button>
        )}

        {(userRole === 'superadmin' || userRole === 'admin') && (
          <button
            className={`nav-link ${currentView === 'blockchain' ? 'active' : ''}`}
            onClick={() => { setCurrentView('blockchain'); if (isMobile) setMobileOpen(false); }}
          >
            <span>🔗</span> Блокчейн
          </button>
        )}

        {(userRole === 'superadmin' || userRole === 'admin') && (
          <button
            className={`nav-link ${currentView === 'backups' ? 'active' : ''}`}
            onClick={() => { setCurrentView('backups'); if (isMobile) setMobileOpen(false); }}
          >
            <span>💾</span> Резервне копіювання
          </button>
        )}

        {userRole === 'superadmin' && (
          <button
            className={`nav-link ${currentView === 'users' ? 'active' : ''}`}
            onClick={() => { setCurrentView('users'); if (isMobile) setMobileOpen(false); }}
          >
            <span>🛡️</span> Адміністратори
          </button>
        )}
      </div>
    </div>
  );

  const drawerWidth = 280;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* Mobile Header */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          display: { md: 'none' }, // Mobile only
          bgcolor: 'rgba(9, 9, 11, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ color: '#fff' }}>
            Admin Panel
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="admin navigation"
      >
        {/* Mobile Drawer (Temporary) */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }} // Better open performance on mobile.
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: '#09090b',
              borderRight: '1px solid rgba(255,255,255,0.1)'
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer (Permanent) */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: 'rgba(9, 9, 11, 0.6)', // Match original sidebar
              borderRight: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)'
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'transparent'
        }}
      >
        {/* Top spacer for mobile AppBar */}
        <Toolbar sx={{ display: { md: 'none' } }} />

        {currentView === 'dashboard' && (
          <div className="animate-fade-in"><Dashboard /></div>
        )}
        {currentView === 'monitor' && (
          <div className="animate-fade-in"><ServerMonitor /></div>
        )}
        {currentView === 'tasks' && (
          <div className="animate-fade-in">
            <TaskManager
              tasks={tasks}
              onEditTask={handleEditTask}
              onAddTask={handleAddTask}
              onSaveTask={handleSaveTask}
              onDeleteTask={handleDeleteTask}
              onCancelTaskEdit={handleCancelTaskEdit}
              editingTask={editingTask}
            />
          </div>
        )}
        {currentView === 'verification' && (
          <div className="animate-fade-in">
            <TaskVerification onOpenProfile={openStudentProfile} />
          </div>
        )}
        {currentView === 'wallets' &&
          (userRole === 'superadmin' || userRole === 'admin') && (
            <div className="animate-fade-in">
              <WalletManager
                wallets={wallets}
                tasks={tasks}
                onEditWallet={handleEditWallet}
                onSaveWallet={handleSaveWallet}
                onDeleteWallet={handleDeleteWallet}
                onCancelWalletEdit={handleCancelWalletEdit}
                editingWallet={editingWallet}
                onOpenProfile={openStudentProfile}
              />
            </div>
          )}
        {currentView === 'groups' &&
          (userRole === 'superadmin' || userRole === 'admin') && (
            <div className="animate-fade-in">
              <GroupManager wallets={wallets} onOpenProfile={openStudentProfile} />
            </div>
          )}
        {currentView === 'education' &&
          (userRole === 'superadmin' || userRole === 'admin') && (
            <div className="animate-fade-in">
              <EducationManager />
            </div>
          )}
        {currentView === 'rating' && (
          <div className="animate-fade-in">
            <Paper className="glass-panel" style={{ padding: 24, background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
              <Typography variant="h4" className="section-title" gutterBottom style={{ color: '#fff', marginBottom: 20 }}>
                🏆 Загальний рейтинг студентів
              </Typography>
              <UserRating />
            </Paper>
          </div>
        )}
        {currentView === 'dao' &&
          (userRole === 'superadmin' || userRole === 'admin') &&
          <div className="animate-fade-in"><DaoManager /></div>}
        {currentView === 'battlepass' && userRole === 'superadmin' && (
          <div className="animate-fade-in"><BattlePassAdmin /></div>
        )}
        {currentView === 'users' && userRole === 'superadmin' && (
          <div className="animate-fade-in"><UserManagement /></div>
        )}
        {currentView === 'blockchain' &&
          (userRole === 'superadmin' || userRole === 'admin') && (
            <div className="animate-fade-in"><BlockchainManager /></div>
          )}

        {currentView === 'backups' &&
          (userRole === 'superadmin' || userRole === 'admin') && (
            <div className="animate-fade-in"><BackupManager /></div>
          )}
      </Box>

      <StudentProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        address={profileAddress}
      />
    </Box>
  );
};

export default AdminPanel;
