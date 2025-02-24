import { useState, useEffect } from 'react';
import { Container, CircularProgress, Alert, Box, Typography } from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { DayView } from '../components/Calendar/DayView';
import { getWorkgroupShifts, getAccountDetails } from '../services/api.service';
import { WhosOnResponse } from '../types/shift.types';
import { WorkgroupFilter } from '../components/Filters/WorkgroupFilter';

interface ContextType {
  refreshInterval: number;
}

export const CalendarPage = () => {
    console.log('Calendar page rendering...');
    const { refreshInterval } = useOutletContext<ContextType>();
    const [data, setData] = useState<WhosOnResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [selectedWorkgroup, setSelectedWorkgroup] = useState('');

    const fetchShifts = async () => {
        console.log('Fetching shifts at:', new Date().toISOString());
        try {
            setLastRefresh(new Date());
            const response = await getWorkgroupShifts();
            setData(response);
            setError(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load shifts';
            console.error('Error in fetchShifts:', errorMessage, err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShifts();
    }, []); // Initial fetch

    useEffect(() => {
        fetchShifts();
    }, [selectedWorkgroup]); // Add selectedWorkgroup as dependency

    useEffect(() => {
        if (!refreshInterval) return;
        
        const timer = setInterval(fetchShifts, refreshInterval * 60 * 1000);
        return () => clearInterval(timer);
    }, [refreshInterval]);

    if (loading) {
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
        : data.result.shifts.filter(shift => {
            const workgroup = data.result.referenced_objects.workgroup.find(
                wg => wg.id === shift.workgroup
            );
            return workgroup?.name.includes('Information Technology');
        });

    return (
        <Container maxWidth="lg">
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="textSecondary">
                    Last updated: {format(lastRefresh, 'h:mm:ss a')}
                </Typography>
                <WorkgroupFilter
                    selectedWorkgroup={selectedWorkgroup}
                    onWorkgroupChange={setSelectedWorkgroup}
                    workgroups={data?.result?.referenced_objects?.workgroup || []}
                />
            </Box>
            <DayView 
                shifts={filteredShifts || []} 
                accounts={data.result.referenced_objects?.account || []} 
            />
        </Container>
    );
};
