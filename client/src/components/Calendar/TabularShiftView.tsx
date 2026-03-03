/**
 * TabularShiftView Component
 *
 * Sortable table view of all shifts optimized for large-screen display.
 * Designed for operations room monitoring at 5-15 feet viewing distance.
 *
 * Features:
 * - 8-column sortable table (Start, End, Name, Subject, Location, People, Status, Actions)
 * - Person chips with clock-in status (color + icons)
 * - Status summary chips (All/None/Partial clocked in)
 * - Column sorting (click header toggles asc/desc)
 * - Animations (Fade/Grow on data update)
 * - Loading states (initial load, refresh)
 * - Large typography for distance readability (18px+ body text)
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Fade,
  Grow,
  TableSortLabel,
} from '@mui/material';
import { Info as InfoIcon, CheckCircle, Cancel, Person as PersonIcon } from '@mui/icons-material';
import type { GroupedShift } from '../../types/shift.types';
import { format, parseISO } from 'date-fns';

// ============================================================================
// Types
// ============================================================================

interface TabularShiftViewProps {
  shifts: GroupedShift[];
  loading?: boolean;
  isFreshData?: boolean;
  lastSync?: string;
  /** Called when the Info icon button is clicked to open the shift detail modal. */
  onShiftClick?: (shift: GroupedShift) => void;
  /** Called when a person name chip is clicked to open the person detail modal. */
  onPersonClick?: (personId: string, personName: string, isClockedIn: boolean) => void;
}

type SortColumn = 'start' | 'end' | 'name' | 'subject' | 'location' | 'people' | 'status';
type SortDirection = 'asc' | 'desc';

// ============================================================================
// Helper Functions
// ============================================================================

function formatTime(dateString: string): string {
  try {
    return format(parseISO(dateString), 'h:mm a');
  } catch {
    return 'Invalid time';
  }
}

function countClockedIn(statuses: boolean[]): number {
  return statuses.filter((s) => s).length;
}

function getStatusType(clockStatuses: boolean[]): 'all' | 'none' | 'partial' {
  const clockedInCount = countClockedIn(clockStatuses);
  if (clockedInCount === clockStatuses.length) return 'all';
  if (clockedInCount === 0) return 'none';
  return 'partial';
}

// ============================================================================
// TabularShiftView Component
// ============================================================================

export default function TabularShiftView({
  shifts,
  loading = false,
  isFreshData = true,
  lastSync = 'Never',
  onShiftClick,
  onPersonClick,
}: TabularShiftViewProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('start');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Handle sort column change
  const handleSortChange = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort shifts
  const sortedShifts = useMemo(() => {
    const sorted = [...shifts].sort((a, b) => {
      let compareValue = 0;

      switch (sortColumn) {
        case 'start':
          compareValue =
            new Date(a.local_start_date).getTime() - new Date(b.local_start_date).getTime();
          break;
        case 'end':
          compareValue =
            new Date(a.local_end_date).getTime() - new Date(b.local_end_date).getTime();
          break;
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'subject':
          compareValue = (a.subject || '').localeCompare(b.subject || '');
          break;
        case 'location':
          compareValue = (a.location || '').localeCompare(b.location || '');
          break;
        case 'people':
          compareValue = a.assignedPersonNames.length - b.assignedPersonNames.length;
          break;
        case 'status': {
          const aClocked = countClockedIn(a.clockStatuses);
          const bClocked = countClockedIn(b.clockStatuses);
          const aRatio = a.clockStatuses.length > 0 ? aClocked / a.clockStatuses.length : 0;
          const bRatio = b.clockStatuses.length > 0 ? bClocked / b.clockStatuses.length : 0;
          compareValue = aRatio - bRatio;
          break;
        }
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

    return sorted;
  }, [shifts, sortColumn, sortDirection]);

  // Loading state
  if (loading && shifts.length === 0) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="400px"
      >
        <CircularProgress size={48} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading shifts...
        </Typography>
      </Box>
    );
  }

  // No data state
  if (!loading && shifts.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h5" color="text.secondary">
          No shifts found
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with sync status */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={600}>
          All Shifts
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          {loading && <CircularProgress size={24} />}
          <Typography variant="body1" color="text.secondary" fontWeight={500}>
            Last sync: {lastSync}
          </Typography>
          {!isFreshData && (
            <Chip label="Cached Data" color="warning" size="medium" icon={<InfoIcon />} />
          )}
        </Box>
      </Box>

      {/* Stale data warning */}
      {!isFreshData && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Displaying cached data - unable to connect to API
        </Alert>
      )}

      {/* Table */}
      <Fade in timeout={300}>
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow>
                {/* Start Time */}
                <TableCell>
                  <TableSortLabel
                    active={sortColumn === 'start'}
                    direction={sortColumn === 'start' ? sortDirection : 'asc'}
                    onClick={() => handleSortChange('start')}
                  >
                    <Typography variant="subtitle1" fontWeight={600}>
                      Start Time
                    </Typography>
                  </TableSortLabel>
                </TableCell>

                {/* End Time */}
                <TableCell>
                  <TableSortLabel
                    active={sortColumn === 'end'}
                    direction={sortColumn === 'end' ? sortDirection : 'asc'}
                    onClick={() => handleSortChange('end')}
                  >
                    <Typography variant="subtitle1" fontWeight={600}>
                      End Time
                    </Typography>
                  </TableSortLabel>
                </TableCell>

                {/* Shift Name */}
                <TableCell>
                  <TableSortLabel
                    active={sortColumn === 'name'}
                    direction={sortColumn === 'name' ? sortDirection : 'asc'}
                    onClick={() => handleSortChange('name')}
                  >
                    <Typography variant="subtitle1" fontWeight={600}>
                      Shift Name
                    </Typography>
                  </TableSortLabel>
                </TableCell>

                {/* Subject */}
                <TableCell>
                  <TableSortLabel
                    active={sortColumn === 'subject'}
                    direction={sortColumn === 'subject' ? sortDirection : 'asc'}
                    onClick={() => handleSortChange('subject')}
                  >
                    <Typography variant="subtitle1" fontWeight={600}>
                      Subject
                    </Typography>
                  </TableSortLabel>
                </TableCell>

                {/* Location */}
                <TableCell>
                  <TableSortLabel
                    active={sortColumn === 'location'}
                    direction={sortColumn === 'location' ? sortDirection : 'asc'}
                    onClick={() => handleSortChange('location')}
                  >
                    <Typography variant="subtitle1" fontWeight={600}>
                      Location
                    </Typography>
                  </TableSortLabel>
                </TableCell>

                {/* Assigned People */}
                <TableCell>
                  <TableSortLabel
                    active={sortColumn === 'people'}
                    direction={sortColumn === 'people' ? sortDirection : 'asc'}
                    onClick={() => handleSortChange('people')}
                  >
                    <Typography variant="subtitle1" fontWeight={600}>
                      Assigned People
                    </Typography>
                  </TableSortLabel>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <TableSortLabel
                    active={sortColumn === 'status'}
                    direction={sortColumn === 'status' ? sortDirection : 'asc'}
                    onClick={() => handleSortChange('status')}
                  >
                    <Typography variant="subtitle1" fontWeight={600}>
                      Status
                    </Typography>
                  </TableSortLabel>
                </TableCell>

                {/* Actions */}
                <TableCell align="center">
                  <Typography variant="subtitle1" fontWeight={600}>
                    Actions
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {sortedShifts.map((shift, index) => {
                const statusType = getStatusType(shift.clockStatuses);
                const clockedInCount = countClockedIn(shift.clockStatuses);

                return (
                  <Grow
                    key={shift.id}
                    in
                    timeout={300 + index * 30}
                    style={{ transformOrigin: '0 0 0' }}
                  >
                    <TableRow
                      hover
                      sx={{
                        '&:hover': {
                          bgcolor: 'action.hover',
                          cursor: 'pointer',
                        },
                      }}
                    >
                      {/* Start Time */}
                      <TableCell>
                        <Typography variant="body1">
                          {formatTime(shift.local_start_date)}
                        </Typography>
                      </TableCell>

                      {/* End Time */}
                      <TableCell>
                        <Typography variant="body1">{formatTime(shift.local_end_date)}</Typography>
                      </TableCell>

                      {/* Shift Name */}
                      <TableCell>
                        <Typography variant="body1" fontWeight={600}>
                          {shift.name}
                        </Typography>
                      </TableCell>

                      {/* Subject */}
                      <TableCell>
                        <Typography variant="body1" color="text.secondary">
                          {shift.subject || '—'}
                        </Typography>
                      </TableCell>

                      {/* Location */}
                      <TableCell>
                        <Typography variant="body1" color="text.secondary">
                          {shift.location || '—'}
                        </Typography>
                      </TableCell>

                      {/* Assigned People */}
                      <TableCell>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {shift.assignedPersonNames.map((name, idx) => {
                            const isClockedIn = shift.clockStatuses[idx] ?? false;
                            const personId = shift.assignedPeople[idx] ?? '';
                            return (
                              <Chip
                                key={`${shift.id}-${idx}`}
                                label={name}
                                size="medium"
                                color={isClockedIn ? 'success' : 'error'}
                                variant="outlined"
                                icon={isClockedIn ? <CheckCircle /> : <Cancel />}
                                onClick={
                                  onPersonClick
                                    ? () => onPersonClick(personId, name, isClockedIn)
                                    : undefined
                                }
                                clickable={Boolean(onPersonClick)}
                                aria-label={`${name} – ${isClockedIn ? 'clocked in' : 'not clocked in'}`}
                                sx={{
                                  '&:hover': {
                                    transform: 'scale(1.05)',
                                    transition: 'transform 0.2s',
                                  },
                                }}
                              />
                            );
                          })}
                        </Box>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {statusType === 'all' && (
                          <Chip
                            label="All Clocked In"
                            color="success"
                            size="medium"
                            icon={<CheckCircle />}
                          />
                        )}
                        {statusType === 'none' && (
                          <Chip
                            label="Not Clocked In"
                            color="error"
                            size="medium"
                            icon={<Cancel />}
                          />
                        )}
                        {statusType === 'partial' && (
                          <Chip
                            label={`${clockedInCount}/${shift.clockStatuses.length} Clocked In`}
                            color="warning"
                            size="medium"
                            icon={<PersonIcon />}
                          />
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          size="large"
                          aria-label="View shift details"
                          onClick={onShiftClick ? () => onShiftClick(shift) : undefined}
                        >
                          <InfoIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  </Grow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Fade>

      {/* Summary Footer */}
      <Box sx={{ mt: 3, p: 2.5, bgcolor: 'grey.100', borderRadius: 2 }}>
        <Typography variant="body1" color="text.secondary" fontWeight={500}>
          Showing {sortedShifts.length} {sortedShifts.length === 1 ? 'shift' : 'shifts'}
        </Typography>
      </Box>
    </Box>
  );
}
