/**
 * PersonDetailModal Component
 *
 * MUI Dialog showing contact details for a specific person.
 *
 * Features:
 * - Displays person name (screen_name preferred, else first + last)
 * - Clock-in status badge (green = clocked in, red = not clocked in)
 * - Formatted phone number (e.g. (555) 123-4567)
 * - Call button (tel: link) and Text button (sms: link)
 * - Fetches full account record from backend on open
 * - ESC / backdrop close handled natively by MUI Dialog
 */

import { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle,
  Cancel,
  Phone as PhoneIcon,
  Sms as SmsIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { getAccountById } from '../../services/api.service';
import type { Account } from '../../types/shift.types';

// ============================================================================
// Types
// ============================================================================

interface PersonDetailModalProps {
  /** Account ID to look up. When null, modal is not rendered. */
  personId: string | null;
  /** Display name shown immediately (before account fetch resolves). */
  personName: string;
  /** Clock-in status from the shift data. */
  isClockedIn: boolean;
  /** Controls modal visibility. */
  open: boolean;
  /** Called when the modal should close. */
  onClose: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Resolve the best display name from an account record.
 * Prefers screen_name, then first + last, then the passed-in name.
 */
function resolveDisplayName(account: Account | null, fallbackName: string): string {
  if (!account) return fallbackName;
  if (account.screen_name) return account.screen_name;
  const full = [account.first_name, account.last_name].filter(Boolean).join(' ');
  return full || fallbackName;
}

/**
 * Format a raw phone number string into US format: (XXX) XXX-XXXX.
 * Returns the original string if it cannot be formatted.
 */
function formatPhoneNumber(raw: string): string {
  // Strip all non-digit characters
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return raw;
}

// ============================================================================
// Component
// ============================================================================

export default function PersonDetailModal({
  personId,
  personName,
  isClockedIn,
  open,
  onClose,
}: PersonDetailModalProps) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch account details when modal opens with a personId
  useEffect(() => {
    if (!open || !personId) {
      setAccount(null);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchAccount() {
      setLoading(true);
      setError(null);
      try {
        const data = await getAccountById(personId!);
        if (!cancelled) {
          setAccount(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load contact details');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAccount();

    return () => {
      cancelled = true;
    };
  }, [open, personId]);

  // Do not render when no person ID is provided
  if (!personId) return null;

  const displayName = resolveDisplayName(account, personName);
  const phone = account?.mobile_phone;
  const formattedPhone = phone ? formatPhoneNumber(phone) : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="person-detail-title"
    >
      {/* ── Title ── */}
      <DialogTitle id="person-detail-title" sx={{ pr: 6 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <PersonIcon color="action" />
          <Typography variant="h6" fontWeight={700} component="span" data-testid="person-name">
            {displayName}
          </Typography>
        </Box>

        {/* Close button */}
        <IconButton
          aria-label="close person detail"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      {/* ── Content ── */}
      <DialogContent sx={{ pt: 2 }}>
        {/* Clock Status Badge – T053 */}
        <Box display="flex" alignItems="center" gap={1.5} mb={2}>
          <Chip
            label={isClockedIn ? 'Clocked In' : 'Not Clocked In'}
            color={isClockedIn ? 'success' : 'error'}
            icon={isClockedIn ? <CheckCircle /> : <Cancel />}
            size="medium"
            data-testid="clock-status-badge"
          />
        </Box>

        {/* Loading State */}
        {loading && (
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Loading contact details…
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert severity="warning" sx={{ mb: 2 }} data-testid="fetch-error">
            {error}
          </Alert>
        )}

        {/* Phone + Contact Buttons – T054 */}
        {!loading && formattedPhone && (
          <Box data-testid="contact-section">
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <PhoneIcon color="action" fontSize="small" />
              <Typography variant="body1" data-testid="phone-number">
                {formattedPhone}
              </Typography>
            </Box>

            <Box display="flex" gap={1.5} flexWrap="wrap">
              {/* Call Button */}
              <Button
                variant="contained"
                color="success"
                startIcon={<PhoneIcon />}
                href={`tel:${phone}`}
                component="a"
                data-testid="call-button"
              >
                Call
              </Button>

              {/* Text Button */}
              <Button
                variant="outlined"
                color="primary"
                startIcon={<SmsIcon />}
                href={`sms:${phone}`}
                component="a"
                data-testid="text-button"
              >
                Text
              </Button>
            </Box>
          </Box>
        )}

        {/* No phone – show helpful message */}
        {!loading && !formattedPhone && !error && account && (
          <Typography
            variant="body2"
            color="text.secondary"
            fontStyle="italic"
            data-testid="no-phone-message"
          >
            No phone number on file.
          </Typography>
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
