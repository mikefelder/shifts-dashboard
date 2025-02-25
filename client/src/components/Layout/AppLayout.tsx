import { useState } from 'react';
import { Box, AppBar, Toolbar, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from '../ErrorBoundary';
import Sidebar from './Sidebar';

export const AppLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [refreshInterval, setRefreshInterval] = useState(5); // Default to 5 minutes

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.primary.main
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            HLSR Shiftboard
          </Typography>
        </Toolbar>
      </AppBar>
      
      {!isMobile && (
        <Sidebar 
          refreshInterval={refreshInterval}
          onRefreshIntervalChange={setRefreshInterval}
        />
      )}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 240px)` },
          mt: 8
        }}
      >
        <ErrorBoundary>
          <Outlet context={{ refreshInterval }} />
        </ErrorBoundary>
      </Box>
    </Box>
  );
};
