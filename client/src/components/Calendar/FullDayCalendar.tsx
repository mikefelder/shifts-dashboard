import React from 'react';
import { useState, useEffect } from 'react';
import { Paper, Typography, Grid, Box, useTheme } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { Shift, Account } from '../../types/shift.types';
import { ShiftDetailModal } from './ShiftDetailModal';

interface FullDayCalendarProps {
    shifts: Shift[];
    accounts: Account[];
    date?: Date;
}

export const FullDayCalendar = ({ shifts, accounts, date = new Date() }: FullDayCalendarProps) => {
    const theme = useTheme();
    const [currentTime, setCurrentTime] = useState(new Date());

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const HOUR_HEIGHT = 100; // Fixed height in pixels for each hour

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getCurrentTimePosition = () => {
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();
        return `${hours * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT}px`;
    };

    const groupShifts = (shifts: Shift[]) => {
        return shifts.reduce((acc, shift) => {
            // Group by shift properties excluding covering_member
            const key = `${shift.local_start_date}-${shift.local_end_date}-${shift.name}-${shift.subject}-${shift.location}-${shift.workgroup}`;
            
            if (!acc[key]) {
                acc[key] = {
                    ...shift,
                    groupId: key,
                    covering_members: [shift.covering_member],
                    clock_statuses: [shift.clocked_in]
                };
            } else {
                // Avoid duplicate members
                if (!acc[key].covering_members.includes(shift.covering_member)) {
                    acc[key].covering_members.push(shift.covering_member);
                    acc[key].clock_statuses.push(shift.clocked_in);
                }
            }
            return acc;
        }, {} as { [key: string]: Shift & { groupId: string, covering_members: string[], clock_statuses: boolean[] } });
    };

    const groupedShifts = React.useMemo(() => 
        Object.values(groupShifts(shifts)), 
        [shifts]
    );

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<(Shift & { 
        groupId: string, 
        covering_members: string[], 
        clock_statuses: boolean[] 
    }) | null>(null);

    const handleShiftClick = (shift: Shift & { 
        groupId: string, 
        covering_members: string[], 
        clock_statuses: boolean[] 
    }) => {
        setSelectedShift(shift);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    // Improved function to handle overlapping shifts
    const calculatePositionsForOverlappingGroups = (allShifts: (Shift & { groupId: string, covering_members: string[], clock_statuses: boolean[] })[]) => {
        // Create a map to store the position information for each shift
        const positionMap = new Map();
        
        // Group shifts by their overlapping time windows
        const timeWindows: {
            shifts: typeof allShifts,
            start: number,
            end: number
        }[] = [];
        
        allShifts.forEach(shift => {
            try {
                const startDate = parseISO(shift.local_start_date);
                const endDate = parseISO(shift.local_end_date);
                const startHour = startDate.getHours() + startDate.getMinutes() / 60;
                const endHour = endDate.getHours() + endDate.getMinutes() / 60;
                
                // Find a time window group this shift belongs to
                let foundGroup = false;
                for (const window of timeWindows) {
                    // Check if this shift overlaps with any shift in the window
                    const overlapsWithGroup = window.shifts.some(existingShift => {
                        const existingStart = parseISO(existingShift.local_start_date);
                        const existingEnd = parseISO(existingShift.local_end_date);
                        const existingStartHour = existingStart.getHours() + existingStart.getMinutes() / 60;
                        const existingEndHour = existingEnd.getHours() + existingEnd.getMinutes() / 60;
                        
                        return (startHour < existingEndHour && endHour > existingStartHour);
                    });
                    
                    if (overlapsWithGroup) {
                        window.shifts.push(shift);
                        window.start = Math.min(window.start, startHour);
                        window.end = Math.max(window.end, endHour);
                        foundGroup = true;
                        break;
                    }
                }
                
                // If no overlapping group found, create a new one
                if (!foundGroup) {
                    timeWindows.push({
                        shifts: [shift],
                        start: startHour,
                        end: endHour
                    });
                }
            } catch (error) {
                console.error('Error processing shift for overlap calculation:', error);
            }
        });
        
        // Process each group to assign positions
        timeWindows.forEach(window => {
            const totalShifts = window.shifts.length;
            
            // Sort shifts by start time and then by ID for consistent ordering
            window.shifts.sort((a, b) => {
                const aStart = parseISO(a.local_start_date);
                const bStart = parseISO(b.local_start_date);
                
                // Sort by start time
                if (aStart < bStart) return -1;
                if (aStart > bStart) return 1;
                
                // If same start time, sort by ID
                return a.id.localeCompare(b.id);
            });
            
            // Assign positions within the group
            window.shifts.forEach((shift, index) => {
                try {
                    const startDate = parseISO(shift.local_start_date);
                    const endDate = parseISO(shift.local_end_date);
                    const startHour = startDate.getHours() + startDate.getMinutes() / 60;
                    const endHour = endDate.getHours() + endDate.getMinutes() / 60;
                    
                    // Calculate z-index based on start time: later shifts get higher z-index
                    // This ensures shifts starting later are drawn on top
                    const zIndex = Math.floor(startHour * 10) + 1;
                    
                    positionMap.set(shift.groupId, {
                        top: `${startHour * HOUR_HEIGHT}px`,
                        height: `${(endHour - startHour) * HOUR_HEIGHT}px`,
                        left: `${(index / totalShifts) * 100}%`,
                        width: `calc(100% / ${totalShifts})`,
                        zIndex
                    });
                } catch (error) {
                    console.error('Error calculating position for shift:', error);
                }
            });
        });
        
        return positionMap;
    };

    // Calculate positions for all shifts once
    const positionMap = React.useMemo(() => 
        calculatePositionsForOverlappingGroups(groupedShifts), 
        [groupedShifts]
    );
    
    // Get position for an individual shift
    const getShiftPosition = (shift: Shift & { groupId: string }) => {
        return positionMap.get(shift.groupId);
    };

    // Count only shifts that have positions
    const visibleShifts = React.useMemo(() => {
        return groupedShifts.filter(shift => positionMap.has(shift.groupId));
    }, [groupedShifts, positionMap]);

    // Check visible shift count instead of raw shifts
    if (visibleShifts.length > 50) {
        return (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="primary" gutterBottom>
                    Too Many Shifts to Display
                </Typography>
                <Typography variant="body1">
                    Please use the workgroup filter to narrow down the shifts.
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Current shifts: {visibleShifts.length}
                </Typography>
            </Paper>
        );
    }

    return (
        <>
            <Box sx={{ 
                minHeight: '85vh',
                overflowY: 'auto', // Allow vertical scrolling
                overflowX: 'hidden', // Prevent horizontal scrolling
                width: '100%', // Take full width
                maxWidth: '100%' // Prevent overflow
            }}>
                <Paper sx={{ 
                    p: 2, 
                    borderRadius: '8px',
                    minHeight: `${24 * HOUR_HEIGHT}px`,
                    position: 'relative',
                    height: '100%',
                    width: '100%', // Take full width
                    maxWidth: '100%' // Prevent overflow
                }}>
                    <Typography variant="h6" sx={{ mb: 3, color: 'primary.main', fontWeight: 600 }}>
                        {format(date, 'EEEE, MMMM d, yyyy')} - Full Day Schedule
                        <Typography component="span" variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
                            ({visibleShifts.length} shifts)
                        </Typography>
                    </Typography>

                    <Grid container sx={{ 
                        position: 'relative', 
                        height: `${24 * HOUR_HEIGHT}px`,
                        maxWidth: '100%', // Prevent grid overflow
                        overflowX: 'hidden' // Hide horizontal overflow
                    }}>
                        <Grid item xs={1}>
                            {hours.map(hour => (
                                <Box key={hour} sx={{
                                    height: `${HOUR_HEIGHT}px`,
                                    borderBottom: '1px solid #eee',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    pr: 1
                                }}>
                                    {format(new Date().setHours(hour, 0), 'ha')}
                                </Box>
                            ))}
                        </Grid>

                        <Grid item xs={11} sx={{ position: 'relative' }}>
                            {/* Current time indicator */}
                            <Box sx={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                top: getCurrentTimePosition(),
                                height: '2px',
                                backgroundColor: theme.palette.primary.main,
                                zIndex: 2,
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    left: '-8px',
                                    top: '-4px',
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    backgroundColor: theme.palette.primary.main,
                                }
                            }} />

                            {visibleShifts.map(shift => {
                                const position = getShiftPosition(shift);
                                if (!position) return null;

                                const assignedPeople = shift.covering_members
                                    .map((memberId, index) => ({
                                        person: accounts.find(acc => acc.id === memberId),
                                        clockedIn: shift.clock_statuses[index]
                                    }))
                                    .filter(item => item.person !== undefined);

                                return (
                                    <Paper
                                        key={shift.groupId}
                                        elevation={3}
                                        onClick={() => handleShiftClick(shift)}
                                        sx={{
                                            cursor: 'pointer',
                                            padding: 1.5,
                                            backgroundColor: 'secondary.main',
                                            color: 'white',
                                            borderRadius: '4px',
                                            transition: 'all 0.2s ease',
                                            overflow: 'hidden',
                                            boxSizing: 'border-box',
                                            '&:hover': {
                                                backgroundColor: 'secondary.dark',
                                                transform: 'scale(1.1)',
                                                zIndex: 100,
                                                overflow: 'visible',
                                                maxHeight: 'none',
                                                minWidth: '250px',
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                                                '& .MuiTypography-root': {
                                                    whiteSpace: 'normal',
                                                    overflow: 'visible',
                                                    textOverflow: 'clip'
                                                }
                                            },
                                            '& .MuiTypography-root': {
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            },
                                            ...position,
                                        }}
                                    >
                                        <Typography variant="subtitle2" title={shift.name}>
                                            {shift.name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="caption" title={shift.subject}>
                                                {shift.subject}
                                            </Typography>
                                            <Typography variant="caption">• {shift.display_time}</Typography>
                                        </Box>
                                        {assignedPeople.map(({ person, clockedIn }, idx) => (
                                            <Typography key={`${person?.id || idx}`} variant="body2" sx={{ mt: 1 }}>
                                                {person?.screen_name || `${person?.first_name} ${person?.last_name}`}
                                                <Typography component="span" variant="caption" sx={{ opacity: 0.8, ml: 1 }}>
                                                    ({clockedIn ? 'Clocked In' : 'Not Clocked In'})
                                                </Typography>
                                            </Typography>
                                        ))}
                                        {/* Remove location display entirely */}
                                    </Paper>
                                );
                            })}
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
            
            {/* Add the detail modal */}
            {selectedShift && (
                <ShiftDetailModal
                    open={modalOpen}
                    onClose={handleCloseModal}
                    shift={selectedShift}
                    accounts={accounts}
                />
            )}
        </>
    );
};
