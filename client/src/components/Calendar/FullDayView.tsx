import { useState, useEffect } from 'react';
import { Container, Box, Typography, CircularProgress } from '@mui/material';
import { format } from 'date-fns';
import { FullDayCalendar } from './FullDayCalendar';
import { WorkgroupFilter } from '../Filters/WorkgroupFilter';
import { WhosOnResponse } from '../../types/shift.types';
import { getWorkgroupShifts } from '../../services/api.service';
import { useWorkgroup } from '../../contexts/WorkgroupContext';
import { ActiveShiftsView } from './ActiveShiftsView'; // Updated import if needed

export const FullDayView = () => {
    const { selectedWorkgroup, setWorkgroups } = useWorkgroup();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<WhosOnResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    useEffect(() => {
        loadData();
    }, [selectedWorkgroup]); // Add selectedWorkgroup as dependency

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await getWorkgroupShifts(true);
            setData(response);
            setWorkgroups(response.result.referenced_objects.workgroup);
        } catch (err) {
            setError('Failed to load shifts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
            <CircularProgress />
        </Box>
    );
    
    if (error) return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
            <Typography color="error">{error}</Typography>
        </Box>
    );

    if (!data?.result) return null;

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
                maxWidth: '100%', // Prevent overflow
                overflowX: 'hidden' // Prevent horizontal scrolling
            }}
        >
            <Box sx={{ mb: 2, ml: 2 }}> {/* Add margin-left to timestamp */}
                <Typography variant="caption" color="textSecondary">
                    Last updated: {format(lastRefresh, 'h:mm:ss a')}
                </Typography>
            </Box>
            <FullDayCalendar 
                shifts={filteredShifts} 
                accounts={data.result.referenced_objects.account}
            />
        </Container>
    );
};
