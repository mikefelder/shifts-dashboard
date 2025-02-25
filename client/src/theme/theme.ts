import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#0A2240',
      light: '#0d2b4f',
      dark: '#081a31',
      contrastText: '#fff',
    },
    secondary: {
      main: '#F06B23', // HLSR Orange
      light: '#f27a39',
      dark: '#d65e1f',
      contrastText: '#fff',
    },
    warning: {
      main: '#FFA300', // HLSR Gold/Yellow
      light: '#FFB733',
      dark: '#CC8200',
    },
    background: {
      default: '#FFFFFF',
      paper: '#F8F9FA',
    },
    text: {
      primary: '#041E42',
      secondary: '#4A5568',
    }
  },
  typography: {
    fontFamily: '"Titillium Web", "Roboto", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#041E42',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#041E42',
    },
    h6: {
      fontWeight: 600,
      color: '#FFFFFF',
    }
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#041E42',
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#041E42',
          color: '#FFFFFF',
        }
      }
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: '#FFFFFF',
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'none',
          fontWeight: 600,
        },
        contained: {
          boxShadow: 'none',
        }
      }
    }
  }
});
