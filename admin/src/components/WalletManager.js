import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Typography,
  TableSortLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Tooltip,
  Autocomplete,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { Download, Search, AssignmentTurnedIn, AssignmentLate } from '@mui/icons-material';

const WalletManager = ({
  wallets,
  tasks = [], // New prop with default empty array
  onEditWallet,
  onDeleteWallet,
  editingWallet,
  onCancelWalletEdit,
  onSaveWallet,
  onOpenProfile
}) => {
  const [walletData, setWalletData] = useState(editingWallet || {});
  const [referralsModalOpen, setReferralsModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);

  // Sorting and Filtering State
  const [sortConfig, setSortConfig] = useState({ key: 'points', direction: 'desc' });
  const [filterGroup, setFilterGroup] = useState('');
  const [filterTask, setFilterTask] = useState(null); // Changed to object
  const [filterTaskInverted, setFilterTaskInverted] = useState(false); // New state
  const [searchQuery, setSearchQuery] = useState('');


  useEffect(() => {
    setWalletData(editingWallet || {});
  }, [editingWallet]);

  // Derive unique groups for Filter Dropdown
  const availableGroups = useMemo(() => {
    const groups = new Set(wallets.map(w => w.group).filter(Boolean));
    return Array.from(groups).sort();
  }, [wallets]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setWalletData((prevData) => ({
      ...prevData,
      [name]: (name === 'points' || name === 'tokenBalance') && value !== '' ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    if (walletData.points !== undefined && walletData.tokenBalance !== undefined) {
      try {
        await onSaveWallet(walletData);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleOpenReferralsModal = (wallet) => {
    setSelectedWallet(wallet);
    setReferralsModalOpen(true);
  };
  const handleCloseReferralsModal = () => {
    setReferralsModalOpen(false);
    setSelectedWallet(null);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const truncateAddress = (address) =>
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A';

  // --- FILTERING & SORTING LOGIC ---
  const processedWallets = useMemo(() => {
    let data = [...wallets];

    // 1. Search (Username or Address)
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter(w =>
        (w.username && w.username.toLowerCase().includes(lowerQuery)) ||
        (w.address && w.address.toLowerCase().includes(lowerQuery))
      );
    }

    // 2. Filter by Group
    if (filterGroup) {
      data = data.filter(wallet => wallet.group === filterGroup);
    }

    // 3. Filter by Task (Completed / Not Completed)
    if (filterTask) {
      data = data.filter(wallet => {
        const taskId = filterTask._id || filterTask;
        let hasTask = false;

        if (wallet.tasks) {
          const val = wallet.tasks[taskId];
          hasTask = val === true || val === 'true';
        }

        return filterTaskInverted ? !hasTask : hasTask;
      });
    }

    // 3. Sort
    if (sortConfig.key) {
      data.sort((a, b) => {
        const aValue = a[sortConfig.key] || (typeof a[sortConfig.key] === 'number' ? 0 : '');
        const bValue = b[sortConfig.key] || (typeof b[sortConfig.key] === 'number' ? 0 : '');

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [wallets, filterGroup, searchQuery, sortConfig, filterTask, filterTaskInverted]);

  // --- EXPORT TO CSV ---
  const handleExportCSV = () => {
    // 1. Define Headers
    const headers = ['Username', 'Address', 'Group', 'XP', 'Tokens', 'Referrals'];

    // 2. Map Data
    const csvRows = processedWallets.map(w => [
      `"${w.username || ''}"`,
      w.address,
      `"${w.group || ''}"`,
      w.points || 0,
      w.tokenBalance || 0,
      w.referrals ? w.referrals.length : 0
    ]);

    // 3. Join with commas and newlines
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    // 4. Create and download File
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `students_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="wallet-manager">
      {/* HEADER & FILTERS */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>Керування студентами</Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {/* SEARCH */}
          <TextField
            placeholder="Пошук (Ім'я / Адреса)"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-panel"
            InputProps={{
              startAdornment: <Search sx={{ color: '#94a3b8', mr: 1 }} />,
            }}
            sx={{
              minWidth: 220,
              '& .MuiOutlinedInput-root': { color: '#fff' }
            }}
          />

          {/* GROUP FILTER */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              displayEmpty
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="glass-panel"
              sx={{ color: filterGroup ? '#fff' : '#94a3b8', '& .MuiSelect-icon': { color: '#fff' } }}
            >
              <MenuItem value=""><em>Всі Групи</em></MenuItem>
              {availableGroups.map(g => (
                <MenuItem key={g} value={g}>{g}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* TASK FILTER with Autocomplete & Invert */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Autocomplete
              options={tasks}
              getOptionLabel={(option) => option.name || ''}
              value={filterTask}
              onChange={(event, newValue) => setFilterTask(newValue)}
              sx={{ minWidth: 250 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Фільтр по завданню..."
                  size="small"
                  className="glass-panel"
                  sx={{
                    '& .MuiOutlinedInput-root': { color: '#fff' },
                    '& .MuiInputLabel-root': { color: '#94a3b8' }
                  }}
                />
              )}
              PaperComponent={({ children }) => (
                <Paper sx={{ bgcolor: '#1e1e24', color: '#fff' }}>{children}</Paper>
              )}
            />

            {filterTask && (
              <Tooltip title={filterTaskInverted ? "Показати тих, хто НЕ виконав" : "Показати тих, хто ВИКОНАВ"}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filterTaskInverted}
                      onChange={(e) => setFilterTaskInverted(e.target.checked)}
                      icon={<AssignmentTurnedIn sx={{ color: '#34d399' }} />}
                      checkedIcon={<AssignmentLate sx={{ color: '#ef4444' }} />}
                    />
                  }
                  label={filterTaskInverted ? "Не здали" : "Здали"}
                  sx={{ color: filterTaskInverted ? '#ef4444' : '#34d399', whiteSpace: 'nowrap' }}
                />
              </Tooltip>
            )}
          </Box>

          {/* EXPORT BUTTON */}
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExportCSV}
            sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.3)' } }}
          >
            Експорт CSV
          </Button>
        </Box>
      </Box>

      {/* DATA TABLE */}
      <TableContainer component={Paper} className="glass-panel" sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#94a3b8' }}>Студент (Адреса)</TableCell>
              <TableCell sx={{ color: '#94a3b8' }}>
                <TableSortLabel
                  active={sortConfig.key === 'group'}
                  direction={sortConfig.key === 'group' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('group')}
                  sx={{ color: '#94a3b8 !important' }}
                >
                  Група
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: '#94a3b8' }}>
                <TableSortLabel
                  active={sortConfig.key === 'points'}
                  direction={sortConfig.key === 'points' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('points')}
                  sx={{ color: '#94a3b8 !important' }}
                >
                  Бали (XP)
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: '#94a3b8' }}>
                <TableSortLabel
                  active={sortConfig.key === 'tokenBalance'}
                  direction={sortConfig.key === 'tokenBalance' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('tokenBalance')}
                  sx={{ color: '#94a3b8 !important' }}
                >
                  Токени
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: '#94a3b8' }}>Запрошений ким</TableCell>
              <TableCell sx={{ color: '#94a3b8' }}>Реферали</TableCell>
              <TableCell align="right" sx={{ color: '#94a3b8' }}>Дії</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processedWallets.map((wallet) => (
              <TableRow key={wallet.address} hover sx={{ '&:last-child td, &:last-child th': { border: 0 }, transition: '0.2s' }}>
                <TableCell
                  onClick={() => onOpenProfile && onOpenProfile(wallet.address)}
                  sx={{
                    cursor: 'pointer',
                    color: '#c084fc',
                    fontWeight: 600,
                    '&:hover': { textDecoration: 'underline', color: '#d8b4fe' }
                  }}
                >
                  {wallet.username ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#f1f5f9' }}>{wallet.username}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace' }}>
                        {truncateAddress(wallet.address)}
                      </Typography>
                    </Box>
                  ) : (
                    truncateAddress(wallet.address)
                  )}
                </TableCell>
                <TableCell sx={{ color: '#cbd5e1' }}>{wallet.group || '-'}</TableCell>
                <TableCell sx={{ color: '#fbbf24', fontWeight: 'bold' }}>{wallet.points}</TableCell>
                <TableCell sx={{ color: '#34d399', fontWeight: 'bold' }}>{wallet.tokenBalance}</TableCell>
                <TableCell sx={{ color: '#94a3b8' }} title={wallet.invitedBy}>
                  {truncateAddress(wallet.invitedBy)}
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleOpenReferralsModal(wallet)}
                    disabled={!wallet.referrals || wallet.referrals.length === 0}
                    size="small"
                    sx={{ minWidth: 0, px: 2, color: '#f1f5f9', bgcolor: 'rgba(255,255,255,0.05)' }}
                  >
                    {wallet.referrals ? wallet.referrals.length : 0}
                  </Button>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button size="small" onClick={() => onEditWallet(wallet)} sx={{ color: '#38bdf8' }}>Ред.</Button>
                    <Button size="small" onClick={() => onDeleteWallet(wallet.address)} color="error">Вид.</Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {processedWallets.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#64748b' }}>
                  <Search sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                  <Typography>За вашим запитом нічого не знайдено</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Form Area */}
      {editingWallet && (
        <Paper className="glass-panel" sx={{ mt: 3, p: 3, border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Редагувати гаманець: {truncateAddress(editingWallet.address)}</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
            <TextField
              label="Група (напр. КН-21)"
              name="group"
              size="small"
              value={walletData.group || ''}
              onChange={handleChange}
              sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, flex: 1, minWidth: 200 }}
            />
            <TextField
              label="Бали (XP)"
              name="points"
              type="number"
              size="small"
              value={walletData.points || ''}
              onChange={handleChange}
              sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, flex: 1 }}
            />
            <TextField
              label="Баланс токенів"
              name="tokenBalance"
              type="number"
              size="small"
              value={walletData.tokenBalance || ''}
              onChange={handleChange}
              sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, flex: 1 }}
            />
          </Box>
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={onCancelWalletEdit} sx={{ color: '#94a3b8' }}>Скасувати</Button>
            <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#8b5cf6' }}>Зберегти</Button>
          </Box>
        </Paper>
      )}

      {/* Referrals Modal */}
      <Dialog open={referralsModalOpen} onClose={handleCloseReferralsModal} fullWidth maxWidth="sm" PaperProps={{ sx: { bgcolor: '#1e1e24', color: '#fff' } }}>
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          Реферали: {selectedWallet ? truncateAddress(selectedWallet.address) : ''}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedWallet && selectedWallet.referrals && selectedWallet.referrals.length > 0 ? (
            <List>
              {selectedWallet.referrals.map((refAddress, index) => (
                <ListItem key={index} divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <ListItemText primary={refAddress} sx={{ color: '#e2e8f0' }} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography sx={{ color: '#94a3b8', textAlign: 'center', py: 2 }}>Немає рефералів</Typography>
          )}
        </DialogContent>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button onClick={handleCloseReferralsModal} sx={{ color: '#fff' }}>Закрити</Button>
        </Box>
      </Dialog>
    </div>
  );
};

export default WalletManager;
