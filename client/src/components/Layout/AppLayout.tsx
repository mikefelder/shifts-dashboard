/**
 * AppLayout Component
 *
 * Main application layout with always-visible sidebar navigation.
 * Matches the reference UI from commit 894389c.
 *
 * Features:
 * - Refresh state management (manual + auto-refresh)
 * - Workgroup filtering integration
 * - Permanent sidebar with navigation and controls (via Sidebar component)
 * - Outlet context for child routes
 */

import { useState, useEffect, useCallback } from 'react';
import { Box, AppBar, Toolbar, Typography, Drawer, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useWorkgroup } from '../../contexts/WorkgroupContext';
import { WorkgroupFilter } from '../Filters/WorkgroupFilter';
import Sidebar from './Sidebar';
import logger from '../../utils/logger';

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
  const theme = useTheme();
  const { selectedWorkgroup, workgroups, setSelectedWorkgroup } = useWorkgroup();

  // State
  const [refreshTimestamp, setRefreshTimestamp] = useState(() => Date.now());
  const [refreshInterval, setRefreshInterval] = useState(5); // Default 5 min
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Manual refresh trigger
  const triggerRefresh = useCallback(() => {
    logger.debug('Manual refresh triggered at:', new Date().toISOString());
    setIsRefreshing(true);
    setRefreshTimestamp(Date.now());
    // isRefreshing is reset by child pages after data loads
    setTimeout(() => setIsRefreshing(false), 3000);
  }, []);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval === 0) return;

    const intervalMs = refreshInterval * 60 * 1000;
    logger.debug(`Setting up auto-refresh interval: ${refreshInterval} minutes`);
    const timer = setInterval(() => {
      logger.debug('Auto-refresh triggered at:', new Date().toISOString());
      setRefreshTimestamp(Date.now());
    }, intervalMs);

    return () => {
      logger.debug('Clearing auto-refresh interval');
      clearInterval(timer);
    };
  }, [refreshInterval]);

  const handleRefreshIntervalChange = (interval: number) => {
    setRefreshInterval(interval);
    if (interval > 0) {
      triggerRefresh();
    }
  };

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

      {/* Sidebar — always visible, delegated to Sidebar component */}
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
        <Sidebar
          isRefreshing={isRefreshing}
          refreshInterval={refreshInterval}
          onRefreshNow={triggerRefresh}
          onIntervalChange={handleRefreshIntervalChange}
        />
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
