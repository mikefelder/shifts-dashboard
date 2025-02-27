import React, { useState, useEffect } from 'react';
import { Paper, Typography, Grid, Box, useTheme, Button } from '@mui/material';
import { format, parseISO, isValid } from 'date-fns';
import { Shift, Account } from '../../types/shift.types';
import { ShiftDetailModal } from './ShiftDetailModal';
import FilterListIcon from '@mui/icons-material/FilterList';

interface ActiveShiftsViewProps {
    shifts: Shift[];
    accounts: Account[];
    date?: Date;
    showFullDay?: boolean;
}

interface GroupedShift extends Shift {
    assignedPeople: string[];
    clockStatuses: boolean[];
}

export const ActiveShiftsView: React.FC<ActiveShiftsViewProps> = ({ 
    shifts, 
    accounts, 
    date = new Date(), 
    showFullDay = false 
}) => {
    const theme = useTheme();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<GroupedShift | null>(null);
    const [forceDisplay, setForceDisplay] = useState(false);

    const handleShiftClick = (shift: GroupedShift) => {
        setSelectedShift(shift);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    // Group shifts by common attributes (same shift with different people)
    const groupShiftsByAttributes = (inputShifts: Shift[]): GroupedShift[] => {
        const shiftGroups: { [key: string]: GroupedShift } = {};
        
        inputShifts.forEach(shift => {
            try {
                // Create a unique key for each distinct shift (excluding who is assigned)
                const shiftKey = `${shift.name}-${shift.local_start_date}-${shift.local_end_date}-${shift.workgroup}-${shift.subject}-${shift.location}`;
                
                if (!shiftGroups[shiftKey]) {
                    // Create a new group with the first person
                    shiftGroups[shiftKey] = {
                        ...shift,
                        assignedPeople: shift.covering_member ? [shift.covering_member] : [],
                        clockStatuses: shift.clocked_in !== undefined ? [shift.clocked_in] : []
                    };
                } else {
                    // Add this person to the existing group if they're not already included
                    if (shift.covering_member && !shiftGroups[shiftKey].assignedPeople.includes(shift.covering_member)) {
                        shiftGroups[shiftKey].assignedPeople.push(shift.covering_member);
                        shiftGroups[shiftKey].clockStatuses.push(shift.clocked_in !== undefined ? shift.clocked_in : false);
                    }
                }
            } catch (error) {
                console.error('Error grouping shifts:', error);
            }
        });
        
        return Object.values(shiftGroups);
    };
    
    // Group shifts by common attributes
    const groupedShifts = React.useMemo(() => {
        return groupShiftsByAttributes(shifts);
    }, [shifts]);

    const getTimeWindow = () => {
        if (showFullDay) {
            return {
                start: 0,
                end: 24
            };
        }

        const now = new Date();
        const currentHour = now.getHours();

        // Find currently active shifts
        const activeShifts = groupedShifts.filter(shift => {
            try {
                const start = parseISO(shift.local_start_date);
                const end = parseISO(shift.local_end_date);
                return start <= now && end >= now;
            } catch (error) {
                return false;
            }
        });

        if (activeShifts.length === 0) {
            return {
                start: Math.max(currentHour - 1, 0),
                end: Math.min(currentHour + 2, 24)
            };
        }

        // Find earliest start and latest end of active shifts
        const times = activeShifts.reduce((acc, shift) => {
            try {
                const start = parseISO(shift.local_start_date);
                const end = parseISO(shift.local_end_date);
                return {
                    earliest: Math.min(acc.earliest, start.getHours()),
                    latest: Math.max(acc.latest, end.getHours())
                };
            } catch (error) {
                return acc;
            }
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

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    const getCurrentTimePosition = () => {
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();
        const hoursSinceStart = hours - timeWindow.start + minutes / 60;
        const windowDuration = timeWindow.end - timeWindow.start;
        return `${(hoursSinceStart / windowDuration) * 100}%`;
    };

    // Position shifts with minimal overlap
    const positionShiftsWithMinimalOverlap = () => {
        // Track used horizontal space at different times
        const timeSlots: {[hour: number]: {left: number, shifts: GroupedShift[]}[]} = {};
        const positionedResults: {shift: GroupedShift, position: React.CSSProperties}[] = [];
        
        // Initialize time slots for each hour in our window
        for (let hour = timeWindow.start; hour < timeWindow.end; hour++) {
            timeSlots[hour] = [];
        }
        
        // Sort all shifts by start time first
        const sortedShifts = [...groupedShifts]
            .filter(shift => {
                try {
                    const startTime = parseISO(shift.local_start_date);
                    const endTime = parseISO(shift.local_end_date);
                    
                    if (!isValid(startTime) || !isValid(endTime)) {
                        return false;
                    }
                    
                    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
                    const endHour = endTime.getHours() + endTime.getMinutes() / 60;
                    
                    // Skip shifts outside visible window
                    return !(endHour < timeWindow.start || startHour > timeWindow.end);
                } catch (error) {
                    return false;
                }
            })
            .sort((a, b) => {
                try {
                    // Sort by duration (longer shifts first)
                    const aStart = parseISO(a.local_start_date);
                    const aEnd = parseISO(a.local_end_date);
                    const bStart = parseISO(b.local_start_date);
                    const bEnd = parseISO(b.local_end_date);
                    
                    const aDuration = aEnd.getTime() - aStart.getTime();
                    const bDuration = bEnd.getTime() - bStart.getTime();
                    
                    // Place longer shifts first
                    return bDuration - aDuration;
                } catch (error) {
                    return 0;
                }
            });
        
        // For each shift, find the best horizontal position
        sortedShifts.forEach(shift => {
            try {
                const startDate = parseISO(shift.local_start_date);
                const endDate = parseISO(shift.local_end_date);
                const startHour = Math.max(Math.floor(startDate.getHours()), timeWindow.start);
                const endHour = Math.min(Math.ceil(endDate.getHours()), timeWindow.end);
                
                // Calculate a sensible width based on content
                const nameLength = shift.name ? shift.name.length : 0;
                const subjectLength = shift.subject ? shift.subject.length : 0;
                const peopleCount = shift.assignedPeople ? shift.assignedPeople.length : 0;
                
                let contentBasedWidth = 150 + Math.min(nameLength * 8, 150) + 
                    Math.min(subjectLength * 5, 100) + (peopleCount * 30);
                
                const containerWidth = 1100; // estimated container width in px
                let widthPercentage = Math.min((contentBasedWidth / containerWidth) * 100, 30); // max 30% width
                
                // Find the best horizontal position with minimal overlap
                let bestPosition = 0;
                let minOverlap = Infinity;
                
                // Try different left positions to find minimal overlap
                for (let leftPos = 0; leftPos <= 70; leftPos += 5) {
                    let totalOverlap = 0;
                    
                    // Check overlap at each hour this shift spans
                    for (let hour = startHour; hour < endHour; hour++) {
                        if (!timeSlots[hour]) continue;
                        
                        // Check overlap with existing shifts at this hour
                        for (const occupiedSlot of timeSlots[hour]) {
                            // Calculate overlap between this potential position and existing shifts
                            const rightEdge = leftPos + widthPercentage;
                            const existingRightEdge = occupiedSlot.left + 
                                (occupiedSlot.shifts[0] ? calculateShiftWidth(occupiedSlot.shifts[0]) : 0);
                            
                            // If they overlap horizontally
                            if (leftPos < existingRightEdge && rightEdge > occupiedSlot.left) {
                                // Add to total overlap
                                totalOverlap += Math.min(rightEdge, existingRightEdge) - 
                                    Math.max(leftPos, occupiedSlot.left);
                            }
                        }
                    }
                    
                    // Update best position if this has less overlap
                    if (totalOverlap < minOverlap) {
                        minOverlap = totalOverlap;
                        bestPosition = leftPos;
                        
                        // If we found a position with no overlap, stop searching
                        if (minOverlap === 0) break;
                    }
                }
                
                // Calculate vertical position
                const windowDuration = timeWindow.end - timeWindow.start;
                const startMinutes = startDate.getMinutes() / 60;
                const adjustedStart = Math.max((startHour - timeWindow.start) + startMinutes, 0);
                const endMinutes = endDate.getMinutes() / 60;
                const adjustedEnd = Math.min((endHour - timeWindow.start) + endMinutes, windowDuration);
                const adjustedDuration = adjustedEnd - adjustedStart;
                
                // Create the position object
                const position = {
                    top: `${(adjustedStart / windowDuration) * 100}%`,
                    height: `${(adjustedDuration / windowDuration) * 100}%`,
                    left: `${bestPosition}%`,
                    width: `${widthPercentage}%`,
                    zIndex: 10 + positionedResults.length, // Ensure consistent stacking
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                };
                
                // Register this shift's position in all hours it spans
                for (let hour = startHour; hour < endHour; hour++) {
                    if (timeSlots[hour]) {
                        timeSlots[hour].push({
                            left: bestPosition,
                            shifts: [shift]
                        });
                    }
                }
                
                // Add to results
                positionedResults.push({
                    shift,
                    position
                });
                
            } catch (error) {
                console.error('Error positioning shift:', error);
            }
        });
        
        return positionedResults;
    };
    
    // Helper to calculate a shift's width percentage
    const calculateShiftWidth = (shift: GroupedShift): number => {
        if (!shift) return 20; // Default width
        
        const nameLength = shift.name ? shift.name.length : 0;
        const subjectLength = shift.subject ? shift.subject.length : 0;
        const peopleCount = shift.assignedPeople ? shift.assignedPeople.length : 0;
        
        let contentBasedWidth = 150 + Math.min(nameLength * 8, 150) + 
            Math.min(subjectLength * 5, 100) + (peopleCount * 30);
        
        const containerWidth = 1100;
        return Math.min((contentBasedWidth / containerWidth) * 100, 30);
    };
    
    // Get positioned shifts with minimal overlap
    const positionedShifts = React.useMemo(() => {
        return positionShiftsWithMinimalOverlap();
    }, [groupedShifts, timeWindow, showFullDay]);

    // Reset force display when shifts change
    useEffect(() => {
        setForceDisplay(false);
    }, [shifts]);

    // Check if there are too many shifts to display
    const tooManyShifts = !forceDisplay && positionedShifts.length > 25;

    // Fix the alignment by ensuring consistent calculation of hour positions
    const calculateHourPosition = (hour: number): string => {
        const hourPosition = (hour - timeWindow.start) / (timeWindow.end - timeWindow.start);
        return `${hourPosition * 100}%`;
    };

    // If there are too many shifts, render a message instead of the calendar
    if (tooManyShifts) {
        return (
            <Paper 
                sx={{ 
                    p: 4, 
                    textAlign: 'center', 
                    minHeight: '50vh', 
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                <FilterListIcon 
                    sx={{ 
                        fontSize: '4rem', 
                        color: 'primary.main',
                        mb: 2
                    }} 
                />
                
                <Typography 
                    variant="h5" 
                    color="primary" 
                    gutterBottom
                    sx={{ fontWeight: 'bold' }}
                >
                    Too Many Shifts to Display
                </Typography>
                
                <Typography variant="body1" sx={{ maxWidth: '600px', mb: 3 }}>
                    There are {positionedShifts.length} shifts currently in view. 
                    Please use the workgroup filter to narrow down the display 
                    for better performance and readability.
                </Typography>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button 
                        variant="outlined" 
                        color="primary"
                        onClick={() => setForceDisplay(true)}
                    >
                        Show Anyway
                    </Button>
                </Box>
                
                <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ mt: 4 }}
                >
                    Note: Displaying too many shifts at once may cause performance issues.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper 
            sx={{ 
                p: 2, 
                minHeight: '85vh',
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                maxWidth: '100%'
            }}
        >
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography 
                    variant="h6" 
                    sx={{ 
                        color: 'primary.main',
                        fontWeight: 600
                    }}
                >
                    {format(date, 'EEEE, MMMM d, yyyy')} - {showFullDay ? 'Full Day' : 'Active Shifts'}
                    <Typography component="span" variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
                        ({positionedShifts.length} shifts)
                    </Typography>
                </Typography>
                
                {forceDisplay && (
                    <Typography 
                        variant="caption" 
                        color="error" 
                        sx={{ fontWeight: 'bold' }}
                    >
                        Displaying {positionedShifts.length} shifts - Consider using filters for better performance
                    </Typography>
                )}
            </Box>

            <Grid container sx={{ 
                flex: 1,
                position: 'relative',
                height: '100%',
                minHeight: '70vh',
                maxWidth: '100%',
                overflowX: 'hidden',
                overflowY: 'auto'
            }}>
                <Grid item xs={1} sx={{ position: 'relative', pr: 1 }}>
                    <Box sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        bottom: 0, 
                        right: 0, 
                        width: '1px', 
                        backgroundColor: '#ddd' 
                    }} />
                    
                    {hours.map(hour => (
                        <Box
                            key={hour}
                            sx={{
                                position: 'absolute',
                                top: calculateHourPosition(hour),
                                transform: 'translateY(-50%)',
                                width: '100%',
                                pr: 2,
                                textAlign: 'right',
                                color: 'text.secondary',
                                fontSize: '0.8rem',
                                fontWeight: 500
                            }}
                        >
                            {format(new Date().setHours(hour, 0), 'ha')}
                        </Box>
                    ))}
                </Grid>
                
                <Grid item xs={11} sx={{ position: 'relative' }}>
                    {!showFullDay && (
                        <Box
                            sx={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                top: getCurrentTimePosition(),
                                height: '2px',
                                backgroundColor: theme.palette.primary.main,
                                zIndex: 1000,
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
                    )}
                    
                    {/* Hour lines for better visibility */}
                    {hours.map(hour => (
                        <Box
                            key={`line-${hour}`}
                            sx={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                top: calculateHourPosition(hour),
                                height: '1px',
                                backgroundColor: hour % 3 === 0 ? '#ddd' : '#eee',
                                zIndex: 1
                            }}
                        />
                    ))}
                    
                    {/* Half-hour markers */}
                    {hours.map(hour => (
                        <Box
                            key={`half-line-${hour}`}
                            sx={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                top: `calc(${calculateHourPosition(hour)} + ${50 / (timeWindow.end - timeWindow.start)}%)`,
                                height: '1px',
                                backgroundColor: '#f5f5f5',
                                zIndex: 1,
                                borderTop: '1px dashed #eee'
                            }}
                        />
                    ))}
                    
                    {positionedShifts.map(({ shift, position }) => {
                        // Get all assigned people for this shift
                        const assignedPeople = shift.assignedPeople
                            .map(memberId => accounts.find(acc => acc.id === memberId))
                            .filter(Boolean);
                        
                        // Theme colors for shadow effect
                        const shadowColor = theme.palette.primary.light;
                        const shadowAlpha = '0.5'; // Semi-transparent
                        
                        return (
                            <Paper
                                key={`${shift.id}-${shift.assignedPeople.join('-')}`}
                                elevation={0} // Remove default elevation
                                onClick={() => handleShiftClick(shift)}
                                sx={{
                                    position: 'absolute',
                                    padding: 1.5,
                                    backgroundColor: 'secondary.main',
                                    color: 'white',
                                    borderRadius: '4px',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                    overflow: 'hidden',
                                    boxSizing: 'border-box',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap', // Prevent text wrapping
                                    boxShadow: `
                                        0 1px 2px rgba(0,0,0,0.1),
                                        0 0 0 1px ${shadowColor}${shadowAlpha},
                                        0 2px 6px ${shadowColor}${shadowAlpha}
                                    `, // Themed shadow effect
                                    '&:hover': {
                                        backgroundColor: 'secondary.dark',
                                        transform: 'scale(1.05) translateY(-2px)',
                                        zIndex: 1000,
                                        overflow: 'visible',
                                        maxHeight: 'none',
                                        minWidth: 'auto',
                                        whiteSpace: 'normal',
                                        boxShadow: `
                                            0 4px 12px rgba(0,0,0,0.15),
                                            0 0 0 2px ${theme.palette.primary.main}${shadowAlpha},
                                            0 6px 15px ${theme.palette.primary.main}40
                                        `, // Enhanced shadow on hover
                                    },
                                    ...position,
                                }}
                            >
                                <Typography 
                                    variant="subtitle2" 
                                    noWrap 
                                    title={shift.name}
                                    sx={{ fontWeight: 600 }}
                                >
                                    {shift.name}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography 
                                        variant="caption" 
                                        noWrap 
                                        title={shift.subject}
                                        sx={{ maxWidth: '100%', flexGrow: 1 }}
                                    >
                                        {shift.subject}
                                    </Typography>
                                    <Typography 
                                        variant="caption" 
                                        sx={{ opacity: 0.9, flexShrink: 0 }}
                                    >
                                        • {shift.display_time}
                                    </Typography>
                                </Box>
                                <Box sx={{ mt: 1 }}>
                                    {assignedPeople.map((person, index) => (
                                        <Typography 
                                            key={person?.id}
                                            variant="body2" 
                                            noWrap
                                            title={person?.screen_name || `${person?.first_name} ${person?.last_name}`}
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
                                                ({shift.clockStatuses[index] ? 'Clocked In' : 'Not Clocked In'})
                                            </Typography>
                                        </Typography>
                                    ))}
                                    {assignedPeople.length === 0 && (
                                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                            No one assigned
                                        </Typography>
                                    )}
                                </Box>
                            </Paper>
                        );
                    })}
                </Grid>
            </Grid>
            
            {selectedShift && (
                <ShiftDetailModal
                    open={modalOpen}
                    onClose={handleCloseModal}
                    shift={selectedShift}
                    accounts={accounts}
                />
            )}
        </Paper>
    );
};
