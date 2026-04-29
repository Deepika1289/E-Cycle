import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { ThemeProvider as MUIThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { ThemeProvider } from './contexts/ThemeContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </MUIThemeProvider>
    </ThemeProvider>
  </StrictMode>
);