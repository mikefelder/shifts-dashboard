/**
 * AppLayout Component
 *
 * Main application layout optimized for large-screen display viewing.
 * Designed for operations room monitoring at 5-15 feet viewing distance.
 *
 * Features:
 * - Refresh state management (manual + auto-refresh)
 * - Workgroup filtering integration
 * - Navigation structure
 * - Large typography for distance readability
 * - Prominent status indicators
 * - Outlet context for child routes
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Refresh as RefreshIcon,
  ViewWeek as ViewWeekIcon,
  TableChart as TableChartIcon,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useWorkgroup } from '../../contexts/WorkgroupContext';
import { getLastSyncFormatted } from '../../services/db.service';

// ============================================================================
// Constants
// ============================================================================

const DRAWER_WIDTH = 240;

const AUTO_REFRESH_OPTIONS = [
  { value: 0, label: 'Off' },
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
] as const;

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
  const { selectedWorkgroup, workgroups, setSelectedWorkgroup } = useWorkgroup();

  // State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshTimestamp, setRefreshTimestamp] = useState(Date.now());
  const [refreshInterval, setRefreshInterval] = useState(0); // 0 = off
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState('Never');

  // Update last sync timestamp periodically
  useEffect(() => {
    async function updateLastSync() {
      const formatted = await getLastSyncFormatted();
      setLastSync(formatted);
    }

    updateLastSync();
    const interval = setInterval(updateLastSync, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [refreshTimestamp]);

  // Manual refresh trigger
  const triggerRefresh = useCallback(() => {
    setRefreshTimestamp(Date.now());
  }, []);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval === 0) {
      return;
    }

    // Trigger immediate refresh when interval changes
    triggerRefresh();

    const intervalMs = refreshInterval * 60 * 1000;
    const timer = setInterval(() => {
      console.log(`[AppLayout] Auto-refresh triggered (${refreshInterval}min interval)`);
      triggerRefresh();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [refreshInterval, triggerRefresh]);

  // Handle workgroup selection
  const handleWorkgroupChange = (event: { target: { value: string } }) => {
    const value = event.target.value === '' ? null : event.target.value;
    setSelectedWorkgroup(value);
    triggerRefresh(); // Force refresh when workgroup changes
  };

  // Handle manual refresh button
  const handleRefreshClick = () => {
    setIsRefreshing(true);
    triggerRefresh();

    // Clear refreshing state after a delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Navigation items
  const navItems = [
    { label: 'Timeline View', path: '/calendar', icon: <ViewWeekIcon /> },
    { label: 'Table View', path: '/table', icon: <TableChartIcon /> },
  ];

  // Outlet context for child routes
  const outletContext: RefreshContext = {
    refreshTimestamp,
    refreshInterval,
    triggerRefresh,
    isRefreshing,
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: '72px', py: 1 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2 }}
            size="large"
          >
            <MenuIcon fontSize="large" />
          </IconButton>

          <Typography variant="h5" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Shift Dashboard
          </Typography>

          {/* Workgroup Filter */}
          <FormControl
            variant="outlined"
            size="medium"
            sx={{ minWidth: 220, mr: 3, bgcolor: 'rgba(255,255,255,0.1)' }}
          >
            <InputLabel sx={{ color: 'white', fontSize: '1.125rem' }}>Workgroup</InputLabel>
            <Select
              value={selectedWorkgroup || ''}
              onChange={handleWorkgroupChange}
              label="Workgroup"
              sx={{
                color: 'white',
                fontSize: '1.125rem',
                '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.5)',
                },
                '.MuiSvgIcon-root': { color: 'white' },
              }}
            >
              <MenuItem value="">All Workgroups</MenuItem>
              {workgroups.map((wg: { id: string; name: string }) => (
                <MenuItem key={wg.id} value={wg.id}>
                  {wg.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Last Sync Display */}
          <Typography variant="body1" sx={{ mr: 3, opacity: 0.9, fontWeight: 500 }}>
            Last sync: {lastSync}
          </Typography>

          {/* Refresh Button */}
          <Button
            color="inherit"
            size="large"
            startIcon={
              isRefreshing ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />
            }
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            sx={{ fontWeight: 600 }}
          >
            Refresh
          </Button>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            marginTop: '72px', // Height of AppBar
            transition: (theme) =>
              theme.transitions.create('transform', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            transform: drawerOpen ? 'translateX(0)' : `translateX(-${DRAWER_WIDTH}px)`,
          },
        }}
      >
        <Box sx={{ p: 2.5 }}>
          {/* Auto-refresh Selector */}
          <FormControl fullWidth size="medium">
            <InputLabel>Auto-refresh</InputLabel>
            <Select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              label="Auto-refresh"
            >
              {AUTO_REFRESH_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Divider />

        {/* Navigation */}
        <List>
          {navItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          marginTop: '72px', // Height of AppBar
          transition: (theme) =>
            theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          overflow: 'auto',
        }}
      >
        <Outlet context={outletContext} />
      </Box>
    </Box>
  );
}
