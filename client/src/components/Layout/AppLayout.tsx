/**
 * AppLayout Component
 *
 * Main application layout with always-visible sidebar navigation.
 * Matches the reference UI from commit 894389c.
 *
 * Features:
 * - Refresh state management (manual + auto-refresh)
 * - Workgroup filtering integration
 * - Permanent sidebar with navigation and controls
 * - Outlet context for child routes
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Select,
  MenuItem,
  FormControl,
  useTheme,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  ViewDay as ViewDayIcon,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useWorkgroup } from '../../contexts/WorkgroupContext';
import { WorkgroupFilter } from '../Filters/WorkgroupFilter';

// ============================================================================
// Constants
// ============================================================================

const DRAWER_WIDTH = 240;
const APPBAR_HEIGHT = 64;

// ============================================================================
// Outlet Context Type
// ============================================================================

export interface RefreshContext {
  refreshTimestamp: number;
  refreshInterval: number;
  triggerRefresh: () => void;
  isRefreshing: boolean;
}

// ============================================================================
// AppLayout Component
// ============================================================================

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { selectedWorkgroup, workgroups, setSelectedWorkgroup } = useWorkgroup();

  // State
  const [refreshTimestamp, setRefreshTimestamp] = useState(Date.now());
  const [refreshInterval, setRefreshInterval] = useState(5); // Default 5 min
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Manual refresh trigger
  const triggerRefresh = useCallback(() => {
    console.log('Manual refresh triggered at:', new Date().toISOString());
    setRefreshTimestamp(Date.now());
  }, []);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval === 0) return;

    const intervalMs = refreshInterval * 60 * 1000;
    console.log(`Setting up auto-refresh interval: ${refreshInterval} minutes`);
    const timer = setInterval(() => {
      console.log('Auto-refresh triggered at:', new Date().toISOString());
      setRefreshTimestamp(Date.now());
    }, intervalMs);

    return () => {
      console.log('Clearing auto-refresh interval');
      clearInterval(timer);
    };
  }, [refreshInterval]);

  const handleRefreshIntervalChange = (interval: number) => {
    setRefreshInterval(interval);
    if (interval > 0) {
      triggerRefresh();
    }
  };

  // Navigation active check
  const isActive = (path: string) => location.pathname === path;

  // Outlet context for child routes
  const outletContext: RefreshContext = {
    refreshTimestamp,
    refreshInterval,
    triggerRefresh,
    isRefreshing,
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          left: 0,
          width: '100%',
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            px: 2,
          }}
        >
          <Typography variant="h6" noWrap component="div">
            Shiftboard Reporting
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WorkgroupFilter
              selectedWorkgroup={selectedWorkgroup || ''}
              onWorkgroupChange={setSelectedWorkgroup}
              workgroups={workgroups || []}
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar — always visible */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            top: `${APPBAR_HEIGHT}px`,
            height: `calc(100% - ${APPBAR_HEIGHT}px)`,
            backgroundColor: theme.palette.primary.main,
            color: 'white',
          },
        }}
      >
        <List>
          <ListItem
            onClick={() => navigate('/')}
            selected={isActive('/') || isActive('/calendar')}
            sx={{
              cursor: 'pointer',
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
          </ListItem>
          <ListItem
            onClick={() => navigate('/table')}
            selected={isActive('/table')}
            sx={{
              cursor: 'pointer',
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
          </ListItem>
        </List>

        <Box sx={{ p: 2, mt: 'auto' }}>
          <Typography variant="subtitle2" gutterBottom sx={{ color: 'white' }}>
            Auto Refresh
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Select
              value={refreshInterval}
              onChange={(e) => handleRefreshIntervalChange(Number(e.target.value))}
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

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={triggerRefresh}
            fullWidth
            sx={{
              color: 'white',
              borderColor: 'white',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.8)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            Refresh Now
          </Button>
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 2,
          pb: 2,
          pl: 0,
          pr: 0,
          mt: `${APPBAR_HEIGHT}px`,
          ml: '8px',
          mr: '8px',
          display: 'flex',
          flexDirection: 'column',
          height: `calc(100vh - ${APPBAR_HEIGHT}px)`,
        }}
      >
        <Outlet context={outletContext} />
      </Box>
    </Box>
  );
}
