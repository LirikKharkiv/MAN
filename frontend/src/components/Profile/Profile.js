import React, { useState } from 'react';
import Button from '@mui/material/Button';
import { AppBar, Container, IconButton, Menu, MenuItem, Toolbar, Typography, Divider } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useThemeToggle } from '../Home/ThemeContext';
import { useAuth } from '../Login-Signup/AuthContext';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const { toggleTheme, darkMode } = useThemeToggle();
  const { user, logout } = useAuth(); // Получаем данные пользователя и функцию выхода
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    console.log("Выход из аккаунта");
    logout(); // Полный выход из аккаунта
    navigate('/home'); // Переход на страницу /home
    handleMenuClose();
  };

  const handleCreateTest = () => {
    navigate('/testcreate');
    handleMenuClose();
  };

  const handleGoTest = () => {
    navigate('/testgo')
    handleMenuClose();
  }

  const handleReturnToHome = () => {
    navigate('/home'); // Переход на главную страницу без выхода из аккаунта
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: darkMode ? '#121212' : '#ffffff' }}>
      <AppBar position='fixed'>
        <Container fixed>
          <Toolbar sx={{ justifyContent: 'flex-start' }}>
            <IconButton edge='start' color="inherit" aria-label="menu" onClick={handleMenuClick}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 4, textAlign: 'center' }}>
              Профиль
            </Typography>
            <Button variant="contained" color="primary" sx={{ marginLeft: 2 }} onClick={handleCreateTest}>
              Создать Тест
            </Button>
            <Button variant="contained" color="primary" sx={{ marginLeft: 2 }} onClick={handleGoTest} >
              Войти в Тест
            </Button> {/* Исправлено: закрылся тег Button */}
          </Toolbar>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleMenuClose}>Профиль</MenuItem>
            <MenuItem onClick={() => { toggleTheme(); handleMenuClose(); }} sx={{ justifyContent: 'center' }}>
              Переключить тему
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>Выход</MenuItem>
          </Menu>
        </Container>
      </AppBar>
      <Container sx={{ marginTop: '80px', textAlign: 'center' }}>
        <Typography variant="h4" sx={{ marginBottom: '20px' }}>
          Дарова, {user ? user.name : "Гость"}!
        </Typography>
        <Divider sx={{ margin: '20px 0' }} />
        <Button variant="outlined" color="secondary" onClick={handleReturnToHome}>
          В главное меню
        </Button>
      </Container>
    </div>
  );
}

export default Profile;
