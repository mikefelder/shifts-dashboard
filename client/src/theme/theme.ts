/**
 * Material-UI Theme Configuration
 *
 * Defines the application theme optimized for large-screen display viewing.
 * Designed for 5-15 foot viewing distance in operations room context.
 *
 * Features:
 * - Navy primary color palette with WCAG AAA contrast
 * - Large-screen typography (18px+ body, 24px+ headers)
 * - Enhanced letter-spacing for distance readability
 * - Custom component overrides optimized for display viewing
 * - Responsive breakpoints
 * - WCAG AAA compliant color contrasts (7:1 for text)
 * - Dark mode support
 */

import { createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';

// ============================================================================
// Color Palette - Light Mode
// ============================================================================

const lightPalette = {
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
    primary: 'rgba(0, 0, 0, 0.95)', // Increased from 0.87 for WCAG AAA
    secondary: 'rgba(0, 0, 0, 0.75)', // Increased from 0.6 for better readability
    disabled: 'rgba(0, 0, 0, 0.45)', // Increased from 0.38
  },
  divider: 'rgba(0, 0, 0, 0.15)', // Slightly increased for visibility
};

// ============================================================================
// Color Palette - Dark Mode
// ============================================================================

const darkPalette = {
  primary: {
    main: '#1976d2', // Lighter blue for dark mode
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#00a0dc',
    light: '#33b3e5',
    dark: '#0073a7',
    contrastText: '#ffffff',
  },
  error: {
    main: '#f44336',
    light: '#e57373',
    dark: '#d32f2f',
  },
  warning: {
    main: '#ffa726',
    light: '#ffb74d',
    dark: '#f57c00',
  },
  info: {
    main: '#29b6f6',
    light: '#4fc3f7',
    dark: '#0288d1',
  },
  success: {
    main: '#66bb6a',
    light: '#81c784',
    dark: '#388e3c',
  },
  background: {
    default: '#121212',
    paper: '#1e1e1e',
  },
  text: {
    primary: 'rgba(255, 255, 255, 0.95)',
    secondary: 'rgba(255, 255, 255, 0.75)',
    disabled: 'rgba(255, 255, 255, 0.45)',
  },
  divider: 'rgba(255, 255, 255, 0.15)',
};

// ============================================================================
// Typography - Optimized for Large-Screen Display (5-15 feet)
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
  // Headers - Minimum 24px for distance viewing
  h1: {
    fontSize: '3rem', // 48px - Large display headers
    fontWeight: 600, // Medium weight for better visibility
    lineHeight: 1.3,
    letterSpacing: '0.01em',
  },
  h2: {
    fontSize: '2.5rem', // 40px
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '0.01em',
  },
  h3: {
    fontSize: '2rem', // 32px
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '0.01em',
  },
  h4: {
    fontSize: '1.75rem', // 28px - Shift names, critical info
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '0.01em',
  },
  h5: {
    fontSize: '1.5rem', // 24px - Minimum for headers
    fontWeight: 600,
    lineHeight: 1.5,
    letterSpacing: '0.01em',
  },
  h6: {
    fontSize: '1.25rem', // 20px
    fontWeight: 600,
    lineHeight: 1.6,
    letterSpacing: '0.01em',
  },
  // Body text - Minimum 18px for distance readability
  body1: {
    fontSize: '1.125rem', // 18px - Standard body text
    lineHeight: 1.7, // Increased for readability
    fontWeight: 400,
    letterSpacing: '0.015em', // Enhanced spacing
  },
  body2: {
    fontSize: '1rem', // 16px - Minimum for secondary text
    lineHeight: 1.65,
    fontWeight: 400,
    letterSpacing: '0.015em',
  },
  button: {
    fontSize: '1.125rem', // 18px - Larger buttons for distance viewing
    textTransform: 'none' as const,
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
  caption: {
    fontSize: '0.875rem', // 14px - Minimum, use sparingly
    lineHeight: 1.6,
    letterSpacing: '0.02em',
  },
  subtitle1: {
    fontSize: '1.125rem', // 18px
    fontWeight: 500,
    lineHeight: 1.65,
    letterSpacing: '0.015em',
  },
  subtitle2: {
    fontSize: '1rem', // 16px
    fontWeight: 500,
    lineHeight: 1.6,
    letterSpacing: '0.015em',
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
// Component Overrides - Optimized for Large-Screen Display
// ============================================================================

const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        textTransform: 'none' as const,
        fontWeight: 600,
        fontSize: '1.125rem', // 18px
        padding: '10px 24px', // Larger touch targets
      },
      contained: {
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        },
      },
      sizeSmall: {
        fontSize: '1rem',
        padding: '8px 16px',
      },
      sizeLarge: {
        fontSize: '1.25rem',
        padding: '12px 32px',
      },
    },
    defaultProps: {
      disableElevation: false,
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12, // More prominent rounded corners
        boxShadow: '0 4px 8px rgba(0,0,0,0.12)',
        '&:hover': {
          boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
        },
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: '20px', // Increased from default 16px
        '&:last-child': {
          paddingBottom: '20px',
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        fontSize: '1rem', // 16px - Increased from default
        height: '36px', // Increased from 32px
        fontWeight: 500,
      },
      sizeSmall: {
        fontSize: '0.875rem',
        height: '28px',
      },
      sizeMedium: {
        fontSize: '1rem',
        height: '36px',
      },
      icon: {
        fontSize: '1.25rem', // 20px for chip icons
      },
      deleteIcon: {
        fontSize: '1.25rem',
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        padding: '12px', // Increased from 8px for larger touch target
      },
      sizeSmall: {
        padding: '8px',
      },
      sizeLarge: {
        padding: '16px',
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        fontSize: '1rem', // 16px
        padding: '16px', // Increased from default 12px
      },
      head: {
        fontWeight: 600,
        backgroundColor: '#fafafa',
        fontSize: '1.125rem', // 18px for headers
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        fontSize: '1rem',
        padding: '12px 16px',
      },
      icon: {
        fontSize: '1.5rem', // 24px for alert icons
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 12,
      },
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        fontSize: '1.5rem', // 24px
        fontWeight: 600,
        padding: '20px 24px',
      },
    },
  },
  MuiDialogContent: {
    styleOverrides: {
      root: {
        padding: '20px 24px',
        fontSize: '1.125rem',
      },
    },
  },
  MuiTypography: {
    defaultProps: {
      variantMapping: {
        h1: 'h1',
        h2: 'h2',
        h3: 'h3',
        h4: 'h4',
        h5: 'h5',
        h6: 'h6',
        subtitle1: 'h6',
        subtitle2: 'h6',
        body1: 'p',
        body2: 'p',
      },
    },
  },
  MuiSvgIcon: {
    styleOverrides: {
      root: {
        fontSize: '1.5rem', // 24px default - increased from 20px
      },
      fontSizeSmall: {
        fontSize: '1.25rem', // 20px
      },
      fontSizeLarge: {
        fontSize: '2rem', // 32px
      },
    },
  },
};

// ============================================================================
// Theme Creation
// ============================================================================

/**
 * Creates a theme based on the specified mode (light or dark)
 */
export function createAppTheme(mode: 'light' | 'dark'): Theme {
  const palette = mode === 'light' ? lightPalette : darkPalette;

  return createTheme({
    palette: {
      mode,
      ...palette,
    },
    typography,
    spacing,
    breakpoints,
    components,
    shape: {
      borderRadius: 4,
    },
  });
}

// Default theme export (light mode for backward compatibility)
const theme = createAppTheme('light');
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
