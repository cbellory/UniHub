import React, { useState, useEffect } from 'react';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import {
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import theme from './theme';

import { ToastProvider } from './contexts/ToastContext';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || null);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    const role = localStorage.getItem('role');
    setUserRole(role);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role) {
      setIsAuthenticated(true);
      setUserRole(role);
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <CssBaseline />
        <Router basename="/admin">
          <div className="App">
            <Routes>
              <Route
                path="/"
                element={<Navigate to={isAuthenticated ? '/admin' : '/login'} replace />}
              />
              <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
              <Route
                path="/admin"
                element={
                  isAuthenticated ? (
                    <AdminPanel userRole={userRole} />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
            </Routes>
          </div>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
