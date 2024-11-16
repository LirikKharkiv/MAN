import React, { useState } from 'react';
import { Container, Button, TextField, CircularProgress, Typography, Box } from '@mui/material';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import { useThemeToggle } from '../Home/ThemeContext'; // Import the theme context hook
import axios from 'axios';
import './TestGo.css'; // Import custom styles
import logo from './assets/logo.png'; // Import the logo image
import backgroundImage from './assets/fon.png'; // Import the background image

function TestGo() {
  const { toggleTheme, darkMode } = useThemeToggle(); // Use custom theme toggle context
  const [testCode, setTestCode] = useState(''); // State for test code input
  const [name, setName] = useState(''); // State for name input
  const [loading, setLoading] = useState(false); // Loading state for button
  const [testCodeGlow, setTestCodeGlow] = useState(false); // State for input glow effect
  const [nameGlow, setNameGlow] = useState(false); // State for name input glow effect

  // Handler for entering a test
  const handleEnterTest = async () => {
    if (testCode) {
      try {
        const response = await axios.get(`http://127.0.0.1:8081/check_test_code/${testCode}`);
        if (response.data.exists) {
          fetchTestDetails(testCode);
        } else {
          alert("Код теста не найден.");
        }
      } catch (error) {
        console.error("Error checking test existence:", error);
        alert("Произошла ошибка при проверке кода теста.");
      }
    } else {
      alert("Пожалуйста, введите код теста.");
    }
  };

  // Fetch test details based on the code
  const fetchTestDetails = async (code) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://127.0.0.1:8081/api/testDetails/${code}`);
      // Handle test details here; redirect or display the test details as needed
    } catch (error) {
      console.error("Error fetching test details:", error);
      alert("Произошла ошибка при загрузке деталей теста.");
    } finally {
      setLoading(false);
    }
  };

  // Render the component
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundImage: `url(${backgroundImage})`, // Set the background image
        backgroundSize: 'cover', // Cover the entire area
        backgroundPosition: 'center', // Center the image
      }}
    >
      <Container
        maxWidth="sm"
        sx={{
          padding: 4,
          borderRadius: 2,
          boxShadow: 5,
          backgroundColor: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <img src={logo} alt="Logo" className="Logo" sx={{ display: 'block', margin: '0 auto', width: 100, height: 50, marginBottom: 20 }} />
        <Box
          className="input-container"
          sx={{
            marginTop: 0,
            padding: 2,
            borderRadius: 10,
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontSize: 18, fontWeight: 'bold', marginBottom: 1, color: '#000' }}>
            Код теста
          </Typography>
          <TextField
            variant="outlined"
            value={testCode}
            onChange={(e) => setTestCode(e.target.value)}
            multiline
            rows={1}
            placeholder="Введите код теста здесь..."
            sx={{
              marginBottom: 2,
              width: '100%',
              '& .MuiOutlinedInput-root': {
                borderRadius: 2, // Minimal rounded corners
                boxShadow: testCodeGlow ? '0 0 20px rgba(75, 0, 130, 1), 0 0 30px rgba(75, 0, 130, 0.8)' : 'none',
                '&.Mui-focused fieldset': {
                  borderColor: '#4B0082',
                },
              },
              '& .MuiInputBase-input': {
                fontWeight: 'bold',
                fontSize: '12px', // Smaller font size
                padding: '4px', // Reduced padding
                color: '#000', // Set text color to black
                '&::placeholder': {
                  color: '#666', // Placeholder color
                },
              },
            }}
            fullWidth
            onMouseEnter={() => setTestCodeGlow(true)}
            onMouseLeave={() => setTestCodeGlow(false)}
          />
          <Typography variant="subtitle1" sx={{ fontSize: 18, fontWeight: 'bold', marginBottom: 1, color: '#000' }}>
            Имя
          </Typography>
          <TextField
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            multiline
            rows={1}
            placeholder="Введите ваше имя..."
            sx={{
              marginBottom: 2,
              width: '100%',
              '& .MuiOutlinedInput-root': {
                borderRadius: 2, // Minimal rounded corners
                boxShadow: nameGlow ? '0 0 20px rgba(75, 0, 130, 1), 0 0 30px rgba(75, 0, 130, 0.8)' : 'none',
                '&.Mui-focused fieldset': {
                  borderColor: '#4B0082',
                },
              },
              '& .MuiInputBase-input': {
                fontWeight: 'bold',
                fontSize: '12px', // Smaller font size
                padding: '4px', // Reduced padding
                color: '#000', // Set text color to black
                '&::placeholder': {
                  color: '#666', // Placeholder color
                },
              },
            }}
            fullWidth
            onMouseEnter={() => setNameGlow(true)}
            onMouseLeave={() => setNameGlow(false)}
          />
        </Box>
        <Button
          variant="contained"
          onClick={handleEnterTest}
          sx={{
            padding: '12px 24px', // Increase the padding
            backgroundColor: '#6a1b9a', // Darker purple
            '&:hover': {
              backgroundColor: '#ab47bc', // Lighter purple on hover
            },
            color: '#fff', // Text color
            fontWeight: 'bold', // Make the text bold
            fontSize: '16px', // Increase the font size
          }}
        >
          {loading ? <CircularProgress size={24} /> : 'Войти'}
        </Button>
        <Typography
          variant="body2" // Set text style
          sx={{
            marginTop: 2,
            color: '#000', // Set text color to black
            textAlign: 'center', // Center the text
            fontSize: '14px', // Font size
          }}
        >
          Если вы хотите создать свой тест, переходите по{' '}
          <Link to="/testcreate" style={{ color: '#6a1b9a', textDecoration: 'underline' }}>
            этой ссылке
          </Link>
        </Typography>
      </Container>
    </Box>
  );
}

export default TestGo;
