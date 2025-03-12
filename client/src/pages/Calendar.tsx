import { useState, useEffect } from 'react';
import { Container, CircularProgress, Alert, Box, Typography } from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { ActiveShiftsView } from '../components/Calendar/ActiveShiftsView';
import { getWorkgroupShifts } from '../services/api.service';
import { WhosOnResponse } from '../types/shift.types';
import { useWorkgroup } from '../contexts/WorkgroupContext';
import { dbService } from '../services/db.service';

interface ContextType {
  refreshInterval: number;
  refreshTimestamp: number;
  triggerRefresh: () => void;
}

export const CalendarPage = () => {
    const { refreshTimestamp } = useOutletContext<ContextType>();
    const { selectedWorkgroup, setWorkgroups } = useWorkgroup();
    const [data, setData] = useState<WhosOnResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [lastApiRefresh, setLastApiRefresh] = useState<string>('Never');
    
    // Get the last API sync time when component mounts
    useEffect(() => {
        async function loadLastSyncTime() {
            const syncTime = await dbService.getLastSyncFormatted();
            setLastApiRefresh(syncTime);
        }
        loadLastSyncTime();
    }, []);

    const fetchShifts = async (forceSync = true) => {
        console.log(`Fetching shifts at: ${new Date().toISOString()}, workgroup: ${selectedWorkgroup || 'All'}`);
        try {
            setLoading(true);
            // Always force sync to ensure we get fresh data on every refresh
            const response = await getWorkgroupShifts(forceSync, selectedWorkgroup);
            setData(response);
            
            // Update workgroups list but keep selected workgroup from context
            if (response.result?.referenced_objects?.workgroup) {
                setWorkgroups(response.result.referenced_objects.workgroup);
            }
            
            setError(null);
            
            // Update last refresh time
            setLastRefresh(new Date());
            
            // Update API sync time if data is fresh
            if (response.isFreshData) {
                const syncTime = await dbService.getLastSyncFormatted();
                setLastApiRefresh(syncTime);
            }
            
            console.log('Shifts data refreshed successfully at:', new Date().toISOString());
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load shifts';
            console.error('Error in fetchShifts:', errorMessage, err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Initial data fetch
    useEffect(() => {
        fetchShifts(true);
    }, []); 

    // When workgroup changes
    useEffect(() => {
        if (data) { // Only refetch if we've already loaded data once
            fetchShifts(true);
        }
    }, [selectedWorkgroup]);

    // Handle auto-refresh from refreshTimestamp
    useEffect(() => {
        // Skip the initial render
        if (refreshTimestamp) {
            console.log('Auto refresh triggered by timestamp change:', new Date(refreshTimestamp).toISOString());
            fetchShifts(true);
        }
    }, [refreshTimestamp]);

    // Format a nice timestamp display that shows both refresh time and sync status
    const getTimestampDisplay = () => {
        // If we just refreshed from API, show that info
        if (lastApiRefresh && lastApiRefresh.includes('Today')) {
            return `Last refreshed: ${format(lastRefresh, 'h:mm:ss a')} (API sync completed)`;
        }
        
        // Otherwise, show both times
        return `Last refreshed: ${format(lastRefresh, 'h:mm:ss a')}`;
    };

    if (loading && !data) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    if (!data?.result) {
        return <Alert severity="warning">No data available</Alert>;
    }

    const filteredShifts = selectedWorkgroup
        ? data.result.shifts.filter(shift => shift.workgroup === selectedWorkgroup)
        : data.result.shifts;

    return (
        <Container 
            maxWidth={false}
            disableGutters
            sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                maxWidth: '100%',
                overflowX: 'hidden'
            }}
        >
            <Box sx={{ 
                mb: 2, 
                ml: 2,
                mr: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Typography variant="caption" color="textSecondary">
                    {getTimestampDisplay()}
                </Typography>
                
                {loading && (
                    <Typography variant="caption" color="primary" sx={{ mr: 2 }}>
                        Refreshing...
                    </Typography>
                )}
            </Box>
            <ActiveShiftsView
                shifts={filteredShifts || []} 
                accounts={data.result.referenced_objects?.account || []} 
                loading={loading}
            />
        </Container>
    );
};
