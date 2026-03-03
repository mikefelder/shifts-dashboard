/**
 * ShiftDetailModal Component
 *
 * MUI Dialog showing full details of a selected shift.
 *
 * Features:
 * - Shift header: name + formatted start time (MMM d, yyyy h:mm a)
 * - Shift details: subject, location
 * - Assigned people list with green/red clock-in status badges
 * - Close via ESC key, backdrop click, or close button (MUI Dialog native)
 * - Optional onPersonClick for US5 person detail integration
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  AccessTime,
  LocationOn,
  Subject as SubjectIcon,
  Group,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import type { GroupedShift } from '../../types/shift.types';

// ============================================================================
// Types
// ============================================================================

interface ShiftDetailModalProps {
  /** The shift to display. When null, modal is not rendered. */
  shift: GroupedShift | null;
  /** Controls modal visibility. */
  open: boolean;
  /** Called when the modal should close (ESC, backdrop click, or button). */
  onClose: () => void;
  /**
   * Optional: called when a person chip is clicked.
   * Used by US5 to open PersonDetailModal.
   */
  onPersonClick?: (personId: string, personName: string, isClockedIn: boolean) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format a date-string as "MMM d, yyyy h:mm a" (e.g. "Jan 5, 2025 2:30 pm").
 * Returns "Invalid date" on parse failure.
 */
function formatShiftDateTime(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format display time range: "h:mm a – h:mm a".
 */
function formatTimeRange(start: string, end: string): string {
  try {
    return `${format(parseISO(start), 'h:mm a')} – ${format(parseISO(end), 'h:mm a')}`;
  } catch {
    return '';
  }
}

function countClockedIn(statuses: boolean[]): number {
  return statuses.filter((s) => s).length;
}

// ============================================================================
// Component
// ============================================================================

export default function ShiftDetailModal({
  shift,
  open,
  onClose,
  onPersonClick,
}: ShiftDetailModalProps) {
  // Do not render content if no shift is selected.
  if (!shift) return null;

  const clockedIn = countClockedIn(shift.clockStatuses);
  const totalPeople = shift.assignedPeople.length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="shift-detail-title"
      // ESC key and backdrop click are handled natively by MUI Dialog via onClose.
    >
      {/* ── Title ── */}
      <DialogTitle id="shift-detail-title" sx={{ pr: 6 /* leave room for close button */ }}>
        <Typography variant="h5" fontWeight={700} component="span">
          {shift.name}
        </Typography>

        {/* Close button (top-right) */}
        <IconButton
          aria-label="close shift detail"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      {/* ── Content ── */}
      <DialogContent sx={{ pt: 2 }}>
        {/* Start Date/Time */}
        <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
          <AccessTime color="action" fontSize="small" />
          <Box>
            <Typography variant="body1" fontWeight={600} data-testid="shift-start-date">
              {formatShiftDateTime(shift.local_start_date)}
            </Typography>
            {shift.local_end_date && (
              <Typography variant="body2" color="text.secondary">
                {formatTimeRange(shift.local_start_date, shift.local_end_date)}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Location */}
        {shift.location && (
          <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
            <LocationOn color="action" fontSize="small" />
            <Typography variant="body1" data-testid="shift-location">
              {shift.location}
            </Typography>
          </Box>
        )}

        {/* Subject */}
        {shift.subject && (
          <Box display="flex" alignItems="flex-start" gap={1.5} mb={1.5}>
            <SubjectIcon color="action" fontSize="small" sx={{ mt: 0.3 }} />
            <Typography variant="body1" color="text.secondary" data-testid="shift-subject">
              {shift.subject}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Assigned People */}
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <Group color="action" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={600}>
            Assigned People
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
            ({clockedIn}/{totalPeople} clocked in)
          </Typography>
        </Box>

        {shift.assignedPersonNames.length === 0 ? (
          <Typography variant="body2" color="text.secondary" fontStyle="italic">
            No people assigned to this shift.
          </Typography>
        ) : (
          <Box display="flex" flexWrap="wrap" gap={1} data-testid="people-list">
            {shift.assignedPersonNames.map((name, idx) => {
              const isClockedIn = shift.clockStatuses[idx] ?? false;
              const personId = shift.assignedPeople[idx] ?? '';

              return (
                <Chip
                  key={`${shift.id}-person-${idx}`}
                  label={name}
                  size="medium"
                  color={isClockedIn ? 'success' : 'error'}
                  variant="outlined"
                  icon={isClockedIn ? <CheckCircle /> : <Cancel />}
                  onClick={
                    onPersonClick ? () => onPersonClick(personId, name, isClockedIn) : undefined
                  }
                  clickable={Boolean(onPersonClick)}
                  aria-label={`${name} – ${isClockedIn ? 'clocked in' : 'not clocked in'}`}
                  data-testid={`person-chip-${idx}`}
                />
              );
            })}
          </Box>
        )}
      </DialogContent>

      {/* ── Actions ── */}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
