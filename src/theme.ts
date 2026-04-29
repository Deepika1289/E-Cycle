import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { 
      main: '#6A11CB', // More vibrant purple
      light: '#8E2DE2', // Lighter purple
      dark: '#4A00E0', // Darker purple
      contrastText: '#ffffff'
    },
    secondary: { 
      main: '#2575FC', // Vibrant blue
      light: '#5B8DFD', // Lighter blue
      dark: '#1A56B8', // Darker blue
      contrastText: '#ffffff'
    },
    success: {
      main: '#2ECC71', // Vibrant green
      light: '#55D98D', // Lighter green
      dark: '#239D57', // Darker green
      contrastText: '#ffffff'
    },
    warning: {
      main: '#F1C40F', // Vibrant yellow
      light: '#F4D03F', // Lighter yellow
      dark: '#B8970B', // Darker yellow
      contrastText: '#1A1526'
    },
    error: {
      main: '#E74C3C', // Vibrant red
      light: '#EC7063', // Lighter red
      dark: '#B03A2E', // Darker red
      contrastText: '#ffffff'
    },
    info: {
      main: '#3498DB', // Vibrant blue
      light: '#5DADE2', // Lighter blue
      dark: '#2874A6', // Darker blue
      contrastText: '#ffffff'
    },
    background: { 
      default: '#0F0C29', // Darker gradient background
      paper: '#1F1D36' // Darker paper background
    },
    text: {
      primary: '#FFFFFF', // White text for better contrast
      secondary: '#E0E0FF' // Light blue-gray for secondary text
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.4,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
          padding: '10px 24px',
        },
        contained: {
          boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 6px 20px 0 rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
});

export default theme;