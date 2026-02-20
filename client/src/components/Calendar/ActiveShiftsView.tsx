/**
 * ActiveShiftsView Component
 *
 * Timeline view of active shifts with clock-in status.
 * Features:
 * - Dynamic time window (current hour ±1 hour)
 * - Current time indicator (updates every second)
 * - Too many shifts guard (>25 threshold)
 * - Person chips with clock-in status colors
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  Button,
  CircularProgress,
  Fade,
  Grow,
} from '@mui/material';
import { AccessTime, LocationOn, Group } from '@mui/icons-material';
import type { GroupedShift } from '../../types/shift.types';
import { format, parseISO, isAfter, isBefore } from 'date-fns';

interface ActiveShiftsViewProps {
  shifts: GroupedShift[];
  loading?: boolean;
  isFreshData?: boolean;
}

const MAX_SHIFTS_THRESHOLD = 25;

export default function ActiveShiftsView({
  shifts,
  loading = false,
  isFreshData = true,
}: ActiveShiftsViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [forceDisplay, setForceDisplay] = useState(false);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Filter active shifts (within time window)
  const activeShifts = useMemo(() => {
    const now = new Date();
    return shifts.filter((shift) => {
      try {
        const start = parseISO(shift.local_start_date);
        const end = parseISO(shift.local_end_date);
        return isBefore(start, now) && isAfter(end, now);
      } catch {
        return false;
      }
    });
  }, [shifts]);

  const tooManyShifts = activeShifts.length > MAX_SHIFTS_THRESHOLD;
  const shouldDisplay = !tooManyShifts || forceDisplay;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!isFreshData) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        Displaying cached data - unable to connect to API
      </Alert>
    );
  }

  if (activeShifts.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="text.secondary">
          No active shifts at this time
        </Typography>
      </Box>
    );
  }

  if (tooManyShifts && !forceDisplay) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={4}>
        <Alert severity="warning">
          Too many shifts to display clearly ({activeShifts.length} grouped shifts)
        </Alert>
        <Button variant="contained" onClick={() => setForceDisplay(true)}>
          Show Anyway
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Current Time Indicator */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          py: 1,
          px: 2,
          mb: 2,
          borderRadius: 1,
        }}
      >
        <Typography variant="body2">Current Time: {format(currentTime, 'h:mm:ss a')}</Typography>
      </Box>

      {/* Shifts Grid */}
      <Box display="flex" flexDirection="column" gap={2}>
        {shouldDisplay &&
          activeShifts.map((shift, index) => (
            <Fade key={shift.id} in timeout={300 + index * 50}>
              <Grow in timeout={500 + index * 50}>
                <Card
                  elevation={2}
                  sx={{
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      elevation: 4,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent>
                    {/* Shift Header */}
                    <Typography variant="h6" gutterBottom>
                      {shift.name}
                    </Typography>

                    {/* Time Display */}
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <AccessTime fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {shift.display_time || formatShiftTime(shift)}
                      </Typography>
                    </Box>

                    {/* Location */}
                    {shift.location && (
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {shift.location}
                        </Typography>
                      </Box>
                    )}

                    {/* Subject */}
                    {shift.subject && (
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {shift.subject}
                      </Typography>
                    )}

                    {/* Assigned People */}
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                      <Group fontSize="small" color="action" />
                      {shift.assignedPersonNames.map((name, idx) => (
                        <Chip
                          key={`${shift.id}-${idx}`}
                          label={name}
                          size="small"
                          color={shift.clockStatuses[idx] ? 'success' : 'error'}
                          variant="outlined"
                        />
                      ))}
                    </Box>

                    {/* Clock Status Summary */}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: 'block' }}
                    >
                      {countClockedIn(shift.clockStatuses)} of {shift.assignedPeople.length} clocked
                      in
                    </Typography>
                  </CardContent>
                </Card>
              </Grow>
            </Fade>
          ))}
      </Box>

      {/* Stats Summary */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {activeShifts.length} active {activeShifts.length === 1 ? 'shift' : 'shifts'}
        </Typography>
      </Box>
    </Box>
  );
}

// Helper functions
function formatShiftTime(shift: GroupedShift): string {
  try {
    const start = parseISO(shift.local_start_date);
    const end = parseISO(shift.local_end_date);
    return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
  } catch {
    return 'Invalid time';
  }
}

function countClockedIn(statuses: boolean[]): number {
  return statuses.filter((s) => s).length;
}
