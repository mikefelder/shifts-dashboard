import { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { AppHeader } from './AppHeader';

export const AppLayout = () => {
    const [refreshInterval, setRefreshInterval] = useState(5);

    const handleRefreshIntervalChange = (interval: number) => {
        setRefreshInterval(interval);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <AppHeader />
            <Sidebar 
                refreshInterval={refreshInterval}
                onRefreshIntervalChange={handleRefreshIntervalChange}
            />
            <Box 
                component="main" 
                sx={{ 
                    flexGrow: 1,
                    pt: 2, // Reduced padding top
                    pb: 2, // Reduced padding bottom
                    pl: 0, // No left padding
                    pr: 0, // No right padding
                    mt: '64px', 
                    ml: '8px',
                    mr: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'calc(100vh - 64px)'
                }}
            >
                <Outlet context={{ refreshInterval }} />
            </Box>
        </Box>
    );
};
