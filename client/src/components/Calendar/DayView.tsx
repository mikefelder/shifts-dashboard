import React, { useState, useEffect } from 'react';
import { Paper, Typography, Grid, Box, useTheme } from '@mui/material';
import { format, parseISO, isValid } from 'date-fns';
import { Shift, Account } from '../../types/shift.types';
import { ShiftDetailModal } from './ShiftDetailModal';

interface DayViewProps {
    shifts: Shift[];
    accounts: Account[];
    date?: Date;
    showFullDay?: boolean;
}

export const DayView = ({ shifts, accounts, date = new Date(), showFullDay = false }: DayViewProps) => {
    const theme = useTheme();
    const [currentTime, setCurrentTime] = useState(new Date());
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

    const getTimeWindow = () => {
        // For full day view, always show full 24 hours
        if (showFullDay) {
            return {
                start: 0,
                end: 24
            };
        }

        // For active view, calculate dynamic window
        const now = new Date();
        const currentHour = now.getHours();

        // Find currently active shifts
        const activeShifts = shifts.filter(shift => {
            const start = parseISO(shift.local_start_date);
            const end = parseISO(shift.local_end_date);
            return start <= now && end >= now;
        });

        if (activeShifts.length === 0) {
            return {
                start: Math.max(currentHour - 1, 0),
                end: Math.min(currentHour + 2, 24)
            };
        }

        // Find earliest start and latest end of active shifts
        const times = activeShifts.reduce((acc, shift) => {
            const start = parseISO(shift.local_start_date);
            const end = parseISO(shift.local_end_date);
            return {
                earliest: Math.min(acc.earliest, start.getHours()),
                latest: Math.max(acc.latest, end.getHours())
            };
        }, { earliest: 24, latest: 0 });

        return {
            start: Math.max(times.earliest - 1, 0),
            end: Math.min(times.latest + 1, 24)
        };
    };

    const timeWindow = getTimeWindow();
    const hours = Array.from(
        { length: timeWindow.end - timeWindow.start }, 
        (_, i) => i + timeWindow.start
    );

    const hourHeight = 'calc((80vh - 120px) / ' + (timeWindow.end - timeWindow.start) + ')';

    // Update time window every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Modify position calculations to use window-relative positions
    const getCurrentTimePosition = () => {
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();
        const hoursSinceStart = hours - timeWindow.start + minutes / 60;
        const windowDuration = timeWindow.end - timeWindow.start;
        return `${(hoursSinceStart / windowDuration) * 100}%`;
    };

    const getOverlappingShifts = (shift: Shift, allShifts: Shift[]) => {
        const currentStart = parseISO(shift.local_start_date);
        const currentEnd = parseISO(shift.local_end_date);
        
        return allShifts
            .filter(s => {
                if (s.id === shift.id) return false;
                const start = parseISO(s.local_start_date);
                const end = parseISO(s.local_end_date);
                return (start < currentEnd && end > currentStart);
            })
            .sort((a, b) => a.id.localeCompare(b.id)); // Stable sorting by ID
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
                
                // Skip shifts outside the visible window
                if (endHour < timeWindow.start || startHour > timeWindow.end) {
                    return;
                }
                
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
                    
                    const windowDuration = timeWindow.end - timeWindow.start;
                    const adjustedStart = Math.max(startHour - timeWindow.start, 0);
                    const adjustedEnd = Math.min(endHour - timeWindow.start, windowDuration);
                    const adjustedDuration = adjustedEnd - adjustedStart;
                    
                    positionMap.set(shift.groupId, {
                        top: `${(adjustedStart / windowDuration) * 100}%`,
                        height: `${(adjustedDuration / windowDuration) * 100}%`,
                        left: `${(index / totalShifts) * 100}%`,
                        width: `calc(100% / ${totalShifts})`,
                        zIndex: 1
                    });
                } catch (error) {
                    console.error('Error calculating position for shift:', error);
                }
            });
        });
        
        return positionMap;
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

    // Calculate positions for all shifts once
    const positionMap = React.useMemo(() => 
        calculatePositionsForOverlappingGroups(groupedShifts), 
        [groupedShifts, timeWindow]
    );
    
    // Get position for an individual shift
    const getShiftPosition = (shift: Shift & { groupId: string }) => {
        return positionMap.get(shift.groupId);
    };

    if (shifts.length > 50) {
        return (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="primary" gutterBottom>
                    Too Many Shifts to Display
                </Typography>
                <Typography variant="body1">
                    Please use the workgroup filter to narrow down the shifts.
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Current shifts: {shifts.length}
                </Typography>
            </Paper>
        );
    }

    return (
        <>
            <Paper 
                sx={{ 
                    p: 2, 
                    minHeight: '85vh',
                    overflow: 'hidden', // Change from 'auto' to 'hidden'
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%', // Ensure full width
                    maxWidth: '100%' // Prevent overflow
                }}
            >
                <Box sx={{ mb: 3 }}>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            color: 'primary.main',
                            fontWeight: 600
                        }}
                    >
                        {format(date, 'EEEE, MMMM d, yyyy')}
                    </Typography>
                </Box>

                <Grid container sx={{ 
                    flex: 1,
                    position: 'relative',
                    height: '100%',
                    minHeight: '70vh',
                    maxWidth: '100%', // Prevent grid overflow
                    overflowX: 'hidden', // Hide horizontal overflow
                    overflowY: 'auto' // Allow vertical scrolling
                }}>
                    <Grid item xs={1}>
                        {hours.map(hour => (
                            <Box
                                key={hour}
                                sx={{
                                    height: hourHeight,
                                    borderBottom: '1px solid #eee',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    pr: 1
                                }}
                            >
                                {format(new Date().setHours(hour, 0), 'ha')}
                            </Box>
                        ))}
                    </Grid>
                    
                    <Grid item xs={11} sx={{ position: 'relative' }}>
                        <Box
                            sx={{
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
                            }}
                        />
                        
                        {groupedShifts.map(shift => {
                            const position = getShiftPosition(shift);
                            if (!position) return null;

                            const assignedPeople = shift.covering_members
                                .map(memberId => accounts.find(acc => acc.id === memberId))
                                .filter(Boolean);

                            return (
                                <Paper
                                    key={shift.groupId}
                                    elevation={3}
                                    onClick={() => handleShiftClick(shift)}
                                    sx={{
                                        position: 'absolute',
                                        padding: 1.5,
                                        backgroundColor: 'secondary.main',
                                        color: 'white',
                                        borderRadius: '4px',
                                        transition: 'all 0.2s ease',
                                        overflow: 'hidden',
                                        boxSizing: 'border-box',
                                        cursor: 'pointer', // Add pointer cursor
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
                                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                            • {shift.display_time}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        {assignedPeople.map((person, index) => (
                                            <Typography 
                                                key={person?.id} 
                                                variant="body2" 
                                                sx={{ 
                                                    fontWeight: 500,
                                                    mt: index > 0 ? 0.5 : 0
                                                }}
                                            >
                                                {person?.screen_name || `${person?.first_name} ${person?.last_name}`}
                                                {' '}
                                                <Typography 
                                                    component="span" 
                                                    variant="caption" 
                                                    sx={{ 
                                                        opacity: 0.9,
                                                        fontStyle: 'italic'
                                                    }}
                                                >
                                                    ({shift.clock_statuses[index] ? 'Clocked In' : 'Not Clocked In'})
                                                </Typography>
                                            </Typography>
                                        ))}
                                    </Box>
                                    {/* Remove location display entirely */}
                                </Paper>
                            );
                        })}
                    </Grid>
                </Grid>
            </Paper>
            
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
