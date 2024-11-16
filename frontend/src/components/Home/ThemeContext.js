import React, { createContext, useContext, useState } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

const ThemeToggleContext = createContext();

export const useThemeToggle = () => {
    return useContext(ThemeToggleContext);
};

export const ThemeToggleProvider = ({ children }) => {
    const [darkMode, setDarkMode] = useState(false);

    const theme = createTheme({
    palette: {
        mode: darkMode ? 'dark' : 'light',
    },
    });

    const toggleTheme = () => setDarkMode(prevMode => !prevMode);


    return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Добавьте для корректной работы темы */}
        <ThemeToggleContext.Provider value={{darkMode, toggleTheme}}>
        {children}
        </ThemeToggleContext.Provider>
    </ThemeProvider>
    );
};
