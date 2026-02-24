/**
 * ShiftDetail Page
 *
 * Displays detailed view of a single shift with two modes:
 * 1. Responsive mode (default) - mobile/desktop friendly
 * 2. Large screen mode - optimized for 50"+ displays in ops rooms
 *
 * Toggle between modes is only visible on large screens (xl breakpoint)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Button,
  Divider,
  Paper,
  Switch,
  FormControlLabel,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBack,
  AccessTime,
  LocationOn,
  Group,
  CheckCircle,
  Cancel,
  TvOutlined,
  PhoneAndroid,
  Schedule,
} from '@mui/icons-material';
import { getShifts, getUpcomingShifts } from '../services/api.service';
import type { GroupedShift } from '../types/shift.types';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import logger from '../utils/logger';

// Get upcoming shift preview window from env (default 30 minutes)
const UPCOMING_SHIFT_PREVIEW_MINUTES = parseInt(
  import.meta.env.VITE_UPCOMING_SHIFT_PREVIEW_MINUTES || '30',
  10
);

export default function ShiftDetail() {
  const { shiftId } = useParams<{ shiftId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isXlScreen = useMediaQuery(theme.breakpoints.up('xl'));

  const [shift, setShift] = useState<GroupedShift | null>(null);
  const [upcomingShift, setUpcomingShift] = useState<GroupedShift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [largeScreenMode, setLargeScreenMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch shift data
  useEffect(() => {
    async function loadShift() {
      try {
        setLoading(true);
        setError(null);

        logger.debug('[ShiftDetail] Fetching shifts to find:', { shiftId });

        const result = await getShifts({ forceSync: true });

        // Find the shift by ID
        const foundShift = result.data.find((s) => s.id === shiftId);

        if (!foundShift) {
          setError('Shift not found');
          setLoading(false);
          return;
        }

        setShift(foundShift);

        // Fetch upcoming shifts using the new endpoint
        try {
          const upcomingResult = await getUpcomingShifts({
            minutes: UPCOMING_SHIFT_PREVIEW_MINUTES,
          });

          // Get the first upcoming shift (if any)
          const upcoming = upcomingResult.data.length > 0 ? upcomingResult.data[0] : null;
          setUpcomingShift(upcoming);

          logger.debug('[ShiftDetail] Loaded upcoming shifts', {
            count: upcomingResult.data.length,
            hasUpcoming: !!upcoming,
          });
        } catch (upcomingError) {
          logger.error('[ShiftDetail] Failed to fetch upcoming shifts', upcomingError);
          // Don't fail the whole page if upcoming shifts fail
          setUpcomingShift(null);
        }

        setLoading(false);

        logger.info('[ShiftDetail] Loaded shift:', { shift: foundShift.name });
      } catch (err) {
        logger.error('[ShiftDetail] Failed to load shift:', err);
        setError(err instanceof Error ? err.message : 'Failed to load shift');
        setLoading(false);
      }
    }

    if (shiftId) {
      loadShift();
    }
  }, [shiftId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !shift) {
    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>
        <Alert severity="error">{error || 'Shift not found'}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Back Button and Toggle (only on large screens) */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <IconButton onClick={() => navigate(-1)} size="large">
          <ArrowBack />
        </IconButton>

        {/* Large Screen Mode Toggle - Only visible on XL screens */}
        {isXlScreen && (
          <FormControlLabel
            control={
              <Switch
                checked={largeScreenMode}
                onChange={(e) => setLargeScreenMode(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={1}>
                {largeScreenMode ? (
                  <>
                    <TvOutlined /> Large Screen Mode
                  </>
                ) : (
                  <>
                    <PhoneAndroid /> Responsive Mode
                  </>
                )}
              </Box>
            }
          />
        )}
      </Box>

      {/* Content */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: largeScreenMode ? 4 : 2,
          maxWidth: largeScreenMode ? '100%' : '1400px',
          mx: 'auto',
          width: '100%',
        }}
      >
        {largeScreenMode ? (
          <LargeScreenView shift={shift} upcomingShift={upcomingShift} currentTime={currentTime} />
        ) : (
          <ResponsiveView shift={shift} upcomingShift={upcomingShift} currentTime={currentTime} />
        )}
      </Box>
    </Box>
  );
}

// ============================================================================
// Responsive View (Mobile/Desktop Friendly)
// ============================================================================

interface ViewProps {
  shift: GroupedShift;
  upcomingShift: GroupedShift | null;
  currentTime: Date;
}

function ResponsiveView({ shift, upcomingShift, currentTime }: ViewProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const clockedInCount = countClockedIn(shift.clockStatuses);
  const totalCount = shift.assignedPeople.length;
  const clockedInPercentage = totalCount > 0 ? Math.round((clockedInCount / totalCount) * 100) : 0;

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
      {/* Current Time */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="h5" fontWeight={600}>
          {format(currentTime, 'h:mm:ss a')}
        </Typography>
        <Typography variant="body1">{format(currentTime, 'EEEE, MMMM d, yyyy')}</Typography>
      </Paper>

      {/* Desktop Grid Layout */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: isDesktop ? '2fr 1fr' : '1fr',
          gap: 3,
          mb: 3,
        }}
      >
        {/* Main Shift Info Card */}
        <Card>
          <CardContent>
            <Badge
              badgeContent="ACTIVE"
              color="success"
              sx={{
                mb: 2,
                '& .MuiBadge-badge': {
                  fontSize: '0.75rem',
                  height: '24px',
                  minWidth: '60px',
                  right: -12,
                },
              }}
            >
              <Typography variant="h4" fontWeight={700}>
                {shift.name}
              </Typography>
            </Badge>

            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
              <AccessTime color="action" />
              <Typography variant="h6">{shift.display_time || formatShiftTime(shift)}</Typography>
            </Box>

            {shift.location && (
              <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                <LocationOn color="action" />
                <Typography variant="h6">{shift.location}</Typography>
              </Box>
            )}

            {shift.subject && (
              <Typography variant="body1" color="text.secondary" mb={2}>
                {shift.subject}
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Team Members */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <Group color="action" />
                <Typography variant="h6" fontWeight={600}>
                  Team Members
                </Typography>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={1.5}>
                {shift.assignedPersonNames.map((name, idx) => (
                  <Chip
                    key={`${shift.id}-${idx}`}
                    label={name}
                    size="medium"
                    color={shift.clockStatuses[idx] ? 'success' : 'error'}
                    variant="filled"
                    icon={shift.clockStatuses[idx] ? <CheckCircle /> : <Cancel />}
                  />
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Clock Status Card - Sidebar on Desktop */}
        <Card
          sx={{
            bgcolor: clockedInPercentage === 100 ? 'success.main' : 'error.main',
            color: 'white',
            height: 'fit-content',
          }}
        >
          <CardContent
            sx={{
              textAlign: 'center',
              py: 4,
            }}
          >
            <Typography variant="h6" fontWeight={600} mb={2} sx={{ opacity: 0.9 }}>
              Clock Status
            </Typography>
            <Typography variant="h2" fontWeight={700} mb={1}>
              {clockedInCount} / {totalCount}
            </Typography>
            <Typography variant="h6" fontWeight={500}>
              Clocked In
            </Typography>
            <Typography variant="h4" fontWeight={700} mt={1}>
              {clockedInPercentage}%
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Upcoming Shift Preview */}
      {upcomingShift && (
        <Card sx={{ border: 2, borderColor: 'warning.main' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Schedule color="warning" />
              <Typography variant="h5" fontWeight={700} color="warning.main">
                Next Shift Starting Soon
              </Typography>
            </Box>

            <Typography variant="h6" fontWeight={600} gutterBottom>
              {upcomingShift.name}
            </Typography>

            <Typography variant="body1" color="text.secondary" mb={1}>
              Starts in {differenceInMinutes(parseISO(upcomingShift.local_start_date), currentTime)}{' '}
              minutes
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {upcomingShift.assignedPeople.length} team members assigned
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

// ============================================================================
// Large Screen View (50"+ Display for Ops Rooms)
// ============================================================================

function LargeScreenView({ shift, upcomingShift, currentTime }: ViewProps) {
  const clockedInCount = countClockedIn(shift.clockStatuses);
  const totalCount = shift.assignedPeople.length;
  const clockedInPercentage = totalCount > 0 ? Math.round((clockedInCount / totalCount) * 100) : 0;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Current Time - Large and Prominent */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          py: 4,
          px: 5,
          mb: 4,
          borderRadius: 3,
          boxShadow: 4,
        }}
      >
        <Typography variant="h1" fontWeight={700} fontSize="4rem">
          {format(currentTime, 'h:mm:ss a')}
        </Typography>
        <Typography variant="h4" sx={{ opacity: 0.9, mt: 1 }}>
          {format(currentTime, 'EEEE, MMMM d, yyyy')}
        </Typography>
      </Box>

      {/* Two Column Layout for Current Shift */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 4,
          mb: 4,
          flexGrow: 1,
        }}
      >
        {/* Main Shift Info and Team Members */}
        <Card
          elevation={6}
          sx={{ border: 3, borderColor: 'success.main', display: 'flex', flexDirection: 'column' }}
        >
          <CardContent sx={{ p: 4, flexGrow: 1 }}>
            <Badge
              badgeContent="ACTIVE"
              color="success"
              sx={{
                mb: 3,
                '& .MuiBadge-badge': {
                  fontSize: '1.2rem',
                  height: '36px',
                  minWidth: '90px',
                  right: -20,
                },
              }}
            >
              <Typography variant="h2" fontWeight={700} fontSize="3rem">
                {shift.name}
              </Typography>
            </Badge>

            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <AccessTime sx={{ fontSize: '2.5rem', color: 'action.active' }} />
              <Typography variant="h4" fontSize="2rem" fontWeight={500}>
                {shift.display_time || formatShiftTime(shift)}
              </Typography>
            </Box>

            {shift.location && (
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <LocationOn sx={{ fontSize: '2.5rem', color: 'action.active' }} />
                <Typography variant="h4" fontSize="2rem" fontWeight={500}>
                  {shift.location}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 4, borderWidth: 2 }} />

            {/* Team Members - Large Display */}
            <Box>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Group sx={{ fontSize: '3rem', color: 'action.active' }} />
                <Typography variant="h3" fontWeight={700} fontSize="2.5rem">
                  Team Members
                </Typography>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={3}>
                {shift.assignedPersonNames.map((name, idx) => (
                  <Chip
                    key={`${shift.id}-${idx}`}
                    label={name}
                    size="medium"
                    color={shift.clockStatuses[idx] ? 'success' : 'error'}
                    variant="filled"
                    icon={shift.clockStatuses[idx] ? <CheckCircle /> : <Cancel />}
                    sx={{
                      fontSize: '1.8rem',
                      height: '70px',
                      px: 3,
                      fontWeight: 600,
                      '& .MuiChip-icon': { fontSize: '2.5rem' },
                      '& .MuiChip-label': { px: 2 },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Clock Status - Large Sidebar */}
        <Card
          elevation={6}
          sx={{
            bgcolor: clockedInPercentage === 100 ? 'success.main' : 'error.main',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <CardContent
            sx={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexGrow: 1,
              p: 5,
            }}
          >
            <Typography variant="h4" fontWeight={600} mb={3} sx={{ opacity: 0.9 }}>
              Clock Status
            </Typography>
            <Typography variant="h1" fontWeight={700} fontSize="6rem" mb={2}>
              {clockedInCount}
            </Typography>
            <Divider sx={{ width: '80%', bgcolor: 'white', opacity: 0.5, my: 2 }} />
            <Typography variant="h1" fontWeight={700} fontSize="6rem" mb={3}>
              {totalCount}
            </Typography>
            <Typography variant="h3" fontWeight={600} mb={2}>
              Clocked In
            </Typography>
            <Box
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                px: 4,
                py: 3,
                borderRadius: 3,
                mt: 2,
              }}
            >
              <Typography variant="h2" fontWeight={700} fontSize="4rem">
                {clockedInPercentage}%
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Upcoming Shift - Full Width Banner */}
      {upcomingShift && (
        <Card elevation={6} sx={{ border: 4, borderColor: 'warning.main' }}>
          <CardContent sx={{ p: 5 }}>
            <Box display="flex" alignItems="center" gap={3} mb={3}>
              <Schedule sx={{ fontSize: '4rem', color: 'warning.main' }} />
              <Typography variant="h2" fontWeight={700} fontSize="3rem" color="warning.main">
                NEXT SHIFT STARTING SOON
              </Typography>
            </Box>

            <Typography variant="h3" fontWeight={600} gutterBottom fontSize="2.5rem" mb={3}>
              {upcomingShift.name}
            </Typography>

            <Box
              sx={{
                bgcolor: 'warning.main',
                color: 'warning.contrastText',
                px: 5,
                py: 3,
                borderRadius: 3,
                mb: 3,
                display: 'inline-block',
              }}
            >
              <Typography variant="h3" fontWeight={700} fontSize="2.5rem">
                STARTS IN{' '}
                {differenceInMinutes(parseISO(upcomingShift.local_start_date), currentTime)} MINUTES
              </Typography>
            </Box>

            <Typography variant="h4" color="text.secondary" fontSize="1.8rem">
              {upcomingShift.assignedPeople.length} team members assigned
            </Typography>
          </CardContent>
        </Card>
      )}
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
