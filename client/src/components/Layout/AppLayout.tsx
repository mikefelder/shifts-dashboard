import { useState, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { AppHeader } from './AppHeader';

export const AppLayout = () => {
    const [refreshInterval, setRefreshInterval] = useState(5);
    const [refreshTimestamp, setRefreshTimestamp] = useState(Date.now());

    // Function to manually trigger a refresh
    const triggerRefresh = useCallback(() => {
        console.log('Manual refresh triggered at:', new Date().toISOString());
        setRefreshTimestamp(Date.now());
    }, []);

    // Set up the interval for auto-refresh
    useEffect(() => {
        // If refresh interval is 0, no auto-refresh
        if (refreshInterval === 0) return;

        // Convert minutes to milliseconds
        const intervalMs = refreshInterval * 60 * 1000;
        
        console.log(`Setting up auto-refresh interval: ${refreshInterval} minutes`);
        const timer = setInterval(() => {
            console.log("Auto-refresh triggered at:", new Date().toISOString());
            setRefreshTimestamp(Date.now());
        }, intervalMs);

        // Cleanup on unmount or when interval changes
        return () => {
            console.log("Clearing auto-refresh interval");
            clearInterval(timer);
        };
    }, [refreshInterval]);

    const handleRefreshIntervalChange = (interval: number) => {
        setRefreshInterval(interval);
        
        // Immediately trigger a refresh when the interval is changed
        if (interval > 0) {
            triggerRefresh();
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* Pass triggerRefresh directly to AppHeader */}
            <AppHeader triggerRefresh={triggerRefresh} />
            <Sidebar 
                refreshInterval={refreshInterval}
                onRefreshIntervalChange={handleRefreshIntervalChange}
                onManualRefresh={triggerRefresh}
            />
            <Box 
                component="main" 
                sx={{ 
                    flexGrow: 1,
                    pt: 2,
                    pb: 2,
                    pl: 0,
                    pr: 0,
                    mt: '64px', 
                    ml: '8px',
                    mr: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'calc(100vh - 64px)'
                }}
            >
                <Outlet context={{ refreshInterval, refreshTimestamp, triggerRefresh }} />
            </Box>
        </Box>
    );
};
