/**
 * Sidebar Component
 *
 * Permanent left navigation sidebar with refresh controls.
 * Extracted from AppLayout for better separation of concerns.
 *
 * Features:
 * - Navigation links (Current Shifts, Tabular View)
 * - Manual "Refresh Now" button with loading spinner
 * - Auto-refresh interval selector (Off / 5 / 10 / 15 min)
 * - Last sync timestamp display (updates after each refresh)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Select,
  MenuItem,
  FormControl,
  Typography,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  ViewDay as ViewDayIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { getLastSyncFormatted } from '../../services/db.service';

// ============================================================================
// Types
// ============================================================================

export interface SidebarProps {
  /** Whether a refresh is currently in progress — shows spinner on Refresh Now button */
  isRefreshing?: boolean;
  /** Current auto-refresh interval in minutes (0 = off) */
  refreshInterval?: number;
  /** Called when user clicks "Refresh Now" */
  onRefreshNow?: () => void;
  /** Called when user changes the auto-refresh interval selection */
  onIntervalChange?: (intervalMinutes: number) => void;
}

// ============================================================================
// Sidebar Component
// ============================================================================

export default function Sidebar({
  isRefreshing = false,
  refreshInterval = 5,
  onRefreshNow,
  onIntervalChange,
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const [lastSyncLabel, setLastSyncLabel] = useState<string>('Never');

  // Update "Last refreshed" label whenever isRefreshing transitions from true→false
  // or on mount.
  const refreshLabel = useCallback(async () => {
    const label = await getLastSyncFormatted();
    setLastSyncLabel(label);
  }, []);

  useEffect(() => {
    // Load initial label on mount and when refresh completes
    void refreshLabel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRefreshing]);

  // Refresh label every 60 seconds so "X minutes ago" text stays current
  useEffect(() => {
    const timer = setInterval(() => {
      refreshLabel();
    }, 60000);
    return () => clearInterval(timer);
  }, [refreshLabel]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <Box data-testid="sidebar" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Navigation Links */}
      <List>
        <ListItem disablePadding>
          <ListItemButton
            data-testid="nav-current-shifts"
            onClick={() => navigate('/')}
            selected={isActive('/') || isActive('/calendar')}
            sx={{
              color: 'white',
              '& .MuiListItemIcon-root': { color: 'white' },
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 255, 255, 0.16)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.24)' },
              },
            }}
          >
            <ListItemIcon>
              <ScheduleIcon />
            </ListItemIcon>
            <ListItemText primary="Current Shifts" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            data-testid="nav-tabular-view"
            onClick={() => navigate('/table')}
            selected={isActive('/table')}
            sx={{
              color: 'white',
              '& .MuiListItemIcon-root': { color: 'white' },
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 255, 255, 0.16)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.24)' },
              },
            }}
          >
            <ListItemIcon>
              <ViewDayIcon />
            </ListItemIcon>
            <ListItemText primary="Tabular View" />
          </ListItemButton>
        </ListItem>
      </List>

      {/* Refresh Controls */}
      <Box sx={{ p: 2, mt: 'auto' }}>
        {/* Last sync timestamp */}
        <Typography
          variant="caption"
          data-testid="last-sync-label"
          sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', mb: 1 }}
        >
          Last refreshed: {lastSyncLabel}
        </Typography>

        {/* Auto-refresh dropdown */}
        <Typography variant="subtitle2" gutterBottom sx={{ color: 'white' }}>
          Auto Refresh
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <Select
            data-testid="auto-refresh-select"
            value={refreshInterval}
            onChange={(e) => onIntervalChange?.(Number(e.target.value))}
            sx={{
              color: 'white',
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.8)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
              },
              '& .MuiSvgIcon-root': { color: 'white' },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: theme.palette.primary.main,
                  '& .MuiMenuItem-root': {
                    color: 'white',
                    '&:hover': { backgroundColor: theme.palette.primary.dark },
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.primary.dark,
                      '&:hover': { backgroundColor: theme.palette.primary.dark },
                    },
                  },
                },
              },
            }}
          >
            <MenuItem value={0}>Off</MenuItem>
            <MenuItem value={5}>Every 5 minutes</MenuItem>
            <MenuItem value={10}>Every 10 minutes</MenuItem>
            <MenuItem value={15}>Every 15 minutes</MenuItem>
          </Select>
        </FormControl>

        {/* Refresh Now button */}
        <Button
          data-testid="refresh-now-button"
          variant="outlined"
          startIcon={
            isRefreshing ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />
          }
          onClick={onRefreshNow}
          disabled={isRefreshing}
          fullWidth
          sx={{
            color: 'white',
            borderColor: 'white',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.8)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            },
            '&.Mui-disabled': {
              color: 'rgba(255, 255, 255, 0.5)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
          }}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
        </Button>
      </Box>
    </Box>
  );
}
