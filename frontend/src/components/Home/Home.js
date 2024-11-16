import React, { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import { AppBar, Container, IconButton, Menu, MenuItem, Toolbar, Typography, Divider, Card, CardContent, CardActions } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useThemeToggle } from './ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from './assets/logo.png'; // Import the logo image
import backgroundLogo from './assets/fon.png'; // Import the background image
import './Home.css'; // Correct import for the CSS file

function Home() {
  const { toggleTheme, darkMode } = useThemeToggle();
  const [anchorEl, setAnchorEl] = useState(null);
  const [tests, setTests] = useState([]);
  const navigate = useNavigate();

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    console.log("Выход из аккаунта");
    toggleTheme(false); // Устанавливаем светлую тему при выходе
    navigate('/'); // Переход на главную страницу
    handleMenuClose();
  };

  const handleProfile = () => {
    navigate('/profile'); // Переход на страницу профиля
    handleMenuClose();
  };

  const handleCreateTest = () => {
    navigate('/testcreate'); // Переход на страницу создания теста
  };

  const handleGoTest = () => {
    navigate('/testgo');
  };

  useEffect(() => {
    // Получение тестов из базы данных
    axios.get('http://127.0.0.1:8081/api/tests')
      .then(response => {
        setTests(response.data);
      })
      .catch(error => {
        console.error("Error fetching tests:", error);
      });
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundImage: `url(${backgroundLogo})`, // Set the background image
        backgroundSize: 'cover', // Cover the entire area
        backgroundPosition: 'center', // Center the image
      }}
    >
      <AppBar position='fixed'>
        <Container fixed>
          <Toolbar sx={{ justifyContent: 'flex-start' }}>
            <IconButton edge='start' color="inherit" aria-label="menu" onClick={handleMenuClick}>
              <MenuIcon />
            </IconButton>
            <img src={logo} alt="Logo" style={{ height: 50, marginLeft: 'auto', marginRight: 'auto' }} /> {/* Logo in the AppBar */}
            <Button variant="contained" color="primary" sx={{ marginLeft: 2 }} onClick={handleCreateTest}>
              Создать Тест
            </Button>
            <Button variant="contained" color="primary" sx={{ marginLeft: 2 }} onClick={handleGoTest}>
              Войти в Тест
            </Button>
          </Toolbar>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleProfile}>Профиль</MenuItem>
            <MenuItem onClick={() => { toggleTheme(); handleMenuClose(); }} sx={{ justifyContent: 'center' }}>
              Переключить тему
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>Выход</MenuItem>
          </Menu>
        </Container>
      </AppBar>
      <Container sx={{ marginTop: '80px' }}>
        <Typography variant="h4" sx={{ textAlign: 'center', marginBottom: '20px' }}>
          Мои тесты
        </Typography>
        <div>
          {tests.length > 0 ? (
            tests.map(test => (
              <Card key={test.id} sx={{ marginBottom: 2 }}>
                <CardContent>
                  <Typography variant="h6">{test.title}</Typography>
                  <Typography variant="body2">{test.description}</Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => handleGoTest(test.id)}>Перейти к тесту</Button>
                </CardActions>
              </Card>
            ))
          ) : (
            <Typography variant="body1" sx={{ textAlign: 'center' }}>
              Тесты отсутствуют
            </Typography>
          )}
        </div>
      </Container>
    </div>
  );
}

export default Home;
