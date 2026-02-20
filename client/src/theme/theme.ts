/**
 * Material-UI Theme Configuration
 *
 * Defines the application theme with navy primary color.
 * Supports Material Design principles with customizations for shift management.
 *
 * Features:
 * - Navy primary color palette
 * - Consistent typography scale
 * - Custom component overrides
 * - Responsive breakpoints
 * - WCAG AA compliant color contrasts
 */

import { createTheme } from '@mui/material/styles';

// ============================================================================
// Color Palette
// ============================================================================

const palette = {
  primary: {
    main: '#003d5b', // Navy blue
    light: '#005580',
    dark: '#002840',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#00a0dc', // Lighter blue for accents
    light: '#33b3e5',
    dark: '#0073a7',
    contrastText: '#ffffff',
  },
  error: {
    main: '#d32f2f',
    light: '#ef5350',
    dark: '#c62828',
  },
  warning: {
    main: '#ed6c02',
    light: '#ff9800',
    dark: '#e65100',
  },
  info: {
    main: '#0288d1',
    light: '#03a9f4',
    dark: '#01579b',
  },
  success: {
    main: '#2e7d32',
    light: '#4caf50',
    dark: '#1b5e20',
  },
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },
  divider: 'rgba(0, 0, 0, 0.12)',
};

// ============================================================================
// Typography
// ============================================================================

const typography = {
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
  ].join(','),
  h1: {
    fontSize: '2.5rem',
    fontWeight: 500,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 500,
    lineHeight: 1.3,
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.6,
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.5,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.43,
  },
  button: {
    textTransform: 'none' as const, // Disable uppercase transformation
    fontWeight: 500,
  },
};

// ============================================================================
// Spacing
// ============================================================================

// Material-UI default spacing unit is 8px
// spacing(1) = 8px, spacing(2) = 16px, etc.
const spacing = 8;

// ============================================================================
// Breakpoints
// ============================================================================

const breakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  },
};

// ============================================================================
// Component Overrides
// ============================================================================

const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        textTransform: 'none' as const,
        fontWeight: 500,
      },
      contained: {
        boxShadow: 'none',
        '&:hover': {
          boxShadow: 'none',
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 4,
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: {
        fontWeight: 600,
        backgroundColor: '#fafafa',
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 4,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 8,
      },
    },
  },
};

// ============================================================================
// Theme Creation
// ============================================================================

const theme = createTheme({
  palette,
  typography,
  spacing,
  breakpoints,
  components,
  shape: {
    borderRadius: 4,
  },
});

export default theme;

// ============================================================================
// Theme Helper Functions
// ============================================================================

/**
 * Get shift status color based on clock-in status
 */
export function getShiftStatusColor(status: 'all-clocked-in' | 'none-clocked-in' | 'partial') {
  switch (status) {
    case 'all-clocked-in':
      return theme.palette.success.main;
    case 'none-clocked-in':
      return theme.palette.error.main;
    case 'partial':
      return theme.palette.warning.main;
    default:
      return theme.palette.text.secondary;
  }
}

/**
 * Get text color with appropriate contrast for given background
 */
export function getContrastText(backgroundColor: string): string {
  // Simple luminance calculation
  const rgb = backgroundColor.match(/\d+/g);
  if (!rgb || rgb.length < 3) {
    return theme.palette.text.primary;
  }

  const [r, g, b] = rgb.map(Number);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? theme.palette.text.primary : '#ffffff';
}

/**
 * Format time for display in shift timeline
 */
export function formatShiftTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date for display
 */
export function formatShiftDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
