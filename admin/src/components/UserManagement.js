import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Select,
  MenuItem,
} from '@mui/material';
import { getUsers, createUser, updateUser, deleteUser } from '../services/adminApi';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setUsers(await getUsers());
    } catch (error) {
      console.error('Помилка при отриманні списку користувачів:', error);
    }
  };

  const handleOpenDialog = (user = null) => {
    setEditingUser(user);
    setLoginName(user ? user.loginName : '');
    setPassword('');
    setRole(user ? user.role : 'admin');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setLoginName('');
    setPassword('');
    setRole('admin');
  };

  const handleSaveUser = async () => {
    const userData = { loginName, password, role };
    try {
      if (editingUser) {
        await updateUser(editingUser._id, userData);
      } else {
        await createUser(userData);
      }
      fetchUsers();
      handleCloseDialog();
    } catch (error) {
      console.error('Помилка при збереженні користувача:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
      fetchUsers();
    } catch (error) {
      console.error('Помилка при видаленні користувача:', error);
    }
  };

  return (
    <Container sx={{ px: 0 }}>
      <Typography variant="h6" className="section-title">
        Керування користувачами
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={() => handleOpenDialog()}
      >
        Додати користувача
      </Button>

      <TableContainer component={Paper} className="surface" style={{ marginTop: '16px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Логін</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell align="right">Дії</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.loginName}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell align="right">
                  <Button
                    variant="outlined"
                    onClick={() => handleOpenDialog(user)}
                  >
                    Редагувати
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleDeleteUser(user._id)}
                    style={{ marginLeft: '10px' }}
                  >
                    Видалити
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Модалка создания/редактирования */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editingUser ? 'Редагувати користувача' : 'Додати користувача'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Логін"
            fullWidth
            margin="dense"
            value={loginName}
            onChange={(e) => setLoginName(e.target.value)}
          />
          <TextField
            label="Пароль"
            fullWidth
            margin="dense"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Select
            fullWidth
            margin="dense"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <MenuItem value="superadmin">superadmin</MenuItem>
            <MenuItem value="admin">admin</MenuItem>
            <MenuItem value="moderator">moderator</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Скасувати</Button>
          <Button
            variant="contained"
            onClick={handleSaveUser}
          >
            {editingUser ? 'Зберегти' : 'Створити'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement;
