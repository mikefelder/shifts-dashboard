import { useState, useEffect } from 'react';
import { Paper, Typography, Grid, Box, useTheme } from '@mui/material';
import { format, parseISO, isValid } from 'date-fns';
import { Shift, Account } from '../../types/shift.types';

interface DayViewProps {
    shifts: Shift[];
    accounts: Account[];
    date?: Date;
}

export const DayView = ({ shifts, accounts, date = new Date() }: DayViewProps) => {
    const theme = useTheme();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Calculate visible time window based on active shifts
    const getTimeWindow = () => {
        const now = new Date();

        // Find shifts that are currently active
        const activeShifts = shifts.filter(shift => {
            const start = parseISO(shift.local_start_date);
            const end = parseISO(shift.local_end_date);
            return start <= now && end >= now;
        });

        if (activeShifts.length === 0) {
            const currentHour = now.getHours();
            return {
                start: Math.max(currentHour - 1, 0),
                end: Math.min(currentHour + 2, 24)
            };
        }

        // Calculate start and end times using actual shift times
        let earliestStart = 24;
        let latestEnd = 0;

        activeShifts.forEach(shift => {
            const start = parseISO(shift.local_start_date);
            const end = parseISO(shift.local_end_date);
            const startHour = start.getHours() + (start.getMinutes() / 60);
            const endHour = end.getHours() + (end.getMinutes() / 60);

            earliestStart = Math.min(earliestStart, startHour);
            latestEnd = Math.max(latestEnd, endHour);
        });

        return {
            start: Math.max(Math.floor(earliestStart) - 1, 0),
            end: Math.min(Math.ceil(latestEnd) + 1, 24)
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

    const getShiftPosition = (shift: Shift, allShifts: Shift[]) => {
        try {
            const startDate = parseISO(shift.local_start_date);
            const endDate = parseISO(shift.local_end_date);
            const startHour = startDate.getHours() + startDate.getMinutes() / 60;
            const endHour = endDate.getHours() + endDate.getMinutes() / 60;
            
            // Show shift if it overlaps with the window
            if (endHour < timeWindow.start || startHour > timeWindow.end) {
                return null;
            }

            const windowDuration = timeWindow.end - timeWindow.start;
            const adjustedStart = Math.max(startHour - timeWindow.start, 0);
            const adjustedEnd = Math.min(endHour - timeWindow.start, windowDuration);
            const adjustedDuration = adjustedEnd - adjustedStart;

            const overlapping = getOverlappingShifts(shift, allShifts);
            const totalOverlapping = overlapping.length + 1;
            const width = `calc(100% / ${totalOverlapping})`;
            const position = overlapping.findIndex(s => s.id > shift.id) + 1;
            const index = position === 0 ? overlapping.length : position - 1;
            
            return {
                top: `${(adjustedStart / windowDuration) * 100}%`,
                height: `${(adjustedDuration / windowDuration) * 100}%`,
                left: `${(index / totalOverlapping) * 100}%`,
                width,
                zIndex: 1
            };
        } catch (error) {
            console.error('Error parsing shift times:', error);
            return null;
        }
    };

    const groupShifts = (shifts: Shift[]) => {
        const grouped = shifts.reduce((acc, shift) => {
            const key = `${shift.local_start_date}-${shift.use_time}-${shift.subject}-${shift.name}-${shift.location}`;
            
            if (!acc[key]) {
                acc[key] = {
                    ...shift,
                    covering_members: [shift.covering_member],
                    clock_statuses: [shift.clocked_in]
                };
            } else {
                acc[key].covering_members.push(shift.covering_member);
                acc[key].clock_statuses.push(shift.clocked_in);
            }
            return acc;
        }, {} as { [key: string]: Shift & { covering_members: string[], clock_statuses: boolean[] } });

        return Object.values(grouped);
    };

    const groupedShifts = groupShifts(shifts);

    return (
        <Paper 
            sx={{ 
                p: 2, 
                height: '80vh', 
                overflow: 'auto',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column'
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
                overflow: 'hidden'
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
                        const position = getShiftPosition(shift, groupedShifts);
                        if (!position) return null;

                        const assignedPeople = shift.covering_members
                            .map(memberId => accounts.find(acc => acc.id === memberId))
                            .filter(Boolean);

                        return (
                            <Paper
                                key={shift.id}
                                elevation={3}
                                sx={{
                                    position: 'absolute',
                                    padding: 1.5,
                                    backgroundColor: 'secondary.main',
                                    color: 'white',
                                    borderRadius: '4px',
                                    transition: 'all 0.2s ease',
                                    overflow: 'hidden',
                                    boxSizing: 'border-box',
                                    '&:hover': {
                                        backgroundColor: 'secondary.dark',
                                        transform: 'scale(1.02)',
                                        zIndex: 10
                                    },
                                    ...position,
                                }}
                            >
                                <Typography variant="subtitle2">
                                    {shift.name}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
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
                                {shift.location && (
                                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                                        {shift.location}
                                    </Typography>
                                )}
                            </Paper>
                        );
                    })}
                </Grid>
            </Grid>
        </Paper>
    );
};
