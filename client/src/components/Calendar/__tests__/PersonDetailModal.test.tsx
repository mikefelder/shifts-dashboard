/**
 * PersonDetailModal – Unit Tests
 *
 * Covers T052 (MUI Dialog + close handlers), T053 (name + clock badge),
 * T054 (formatted phone + Call/Text buttons).
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PersonDetailModal from '../PersonDetailModal';
import type { Account } from '../../../types/shift.types';

// ============================================================================
// Mock api.service
// ============================================================================

const mockGetAccountById = vi.fn();

vi.mock('../../../services/api.service', () => ({
  getAccountById: (...args: unknown[]) => mockGetAccountById(...args),
}));

// ============================================================================
// Fixtures
// ============================================================================

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 'acc-1',
    first_name: 'Alice',
    last_name: 'Smith',
    screen_name: undefined,
    mobile_phone: '5551234567',
    clocked_in: true,
    ...overrides,
  };
}

const DEFAULT_PROPS = {
  personId: 'acc-1',
  personName: 'Alice Smith',
  isClockedIn: true,
  open: true,
  onClose: vi.fn(),
};

// ============================================================================
// Tests
// ============================================================================

describe('PersonDetailModal', () => {
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
    mockGetAccountById.mockReset();
  });

  // ── T052: Rendering / close handlers ──────────────────────────────────────

  it('renders nothing when personId is null', () => {
    const { container } = render(
      <PersonDetailModal
        personId={null}
        personName=""
        isClockedIn={false}
        open={true}
        onClose={onClose}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders dialog when personId and open=true', () => {
    mockGetAccountById.mockResolvedValue(makeAccount());
    render(<PersonDetailModal {...DEFAULT_PROPS} onClose={onClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render dialog when open=false', () => {
    render(<PersonDetailModal {...DEFAULT_PROPS} open={false} onClose={onClose} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when the close icon button is clicked', () => {
    mockGetAccountById.mockResolvedValue(makeAccount());
    render(<PersonDetailModal {...DEFAULT_PROPS} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('close person detail'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the footer Close button is clicked', () => {
    mockGetAccountById.mockResolvedValue(makeAccount());
    render(<PersonDetailModal {...DEFAULT_PROPS} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /^close$/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ── T053: Name + clock badge ──────────────────────────────────────────────

  it('shows the fallback personName immediately before fetch resolves', () => {
    // Do not resolve immediately — simulates loading
    mockGetAccountById.mockReturnValue(new Promise(() => {}));
    render(<PersonDetailModal {...DEFAULT_PROPS} personName="Bob Jones" onClose={onClose} />);
    expect(screen.getByTestId('person-name').textContent).toBe('Bob Jones');
  });

  it('shows screen_name once account resolves (prefers over first+last)', async () => {
    mockGetAccountById.mockResolvedValue(
      makeAccount({ screen_name: 'ASmith', first_name: 'Alice', last_name: 'Smith' })
    );
    render(<PersonDetailModal {...DEFAULT_PROPS} onClose={onClose} />);
    await waitFor(() => expect(screen.getByTestId('person-name').textContent).toBe('ASmith'));
  });

  it('falls back to first + last when screen_name absent', async () => {
    mockGetAccountById.mockResolvedValue(
      makeAccount({ screen_name: undefined, first_name: 'Alice', last_name: 'Smith' })
    );
    render(
      <PersonDetailModal {...DEFAULT_PROPS} personName="Will be replaced" onClose={onClose} />
    );
    await waitFor(() => expect(screen.getByTestId('person-name').textContent).toBe('Alice Smith'));
  });

  it('shows "Clocked In" badge when isClockedIn=true', () => {
    mockGetAccountById.mockResolvedValue(makeAccount());
    render(<PersonDetailModal {...DEFAULT_PROPS} isClockedIn={true} onClose={onClose} />);
    expect(screen.getByTestId('clock-status-badge').textContent).toContain('Clocked In');
  });

  it('shows "Not Clocked In" badge when isClockedIn=false', () => {
    mockGetAccountById.mockResolvedValue(makeAccount());
    render(<PersonDetailModal {...DEFAULT_PROPS} isClockedIn={false} onClose={onClose} />);
    expect(screen.getByTestId('clock-status-badge').textContent).toContain('Not Clocked In');
  });

  // ── T054: Phone + Call/Text buttons ──────────────────────────────────────

  it('renders formatted US phone number (10 digits)', async () => {
    mockGetAccountById.mockResolvedValue(makeAccount({ mobile_phone: '5551234567' }));
    render(<PersonDetailModal {...DEFAULT_PROPS} onClose={onClose} />);
    await waitFor(() =>
      expect(screen.getByTestId('phone-number').textContent).toBe('(555) 123-4567')
    );
  });

  it('renders a tel: Call button with correct href', async () => {
    mockGetAccountById.mockResolvedValue(makeAccount({ mobile_phone: '5551234567' }));
    render(<PersonDetailModal {...DEFAULT_PROPS} onClose={onClose} />);
    await waitFor(() => {
      const callBtn = screen.getByTestId('call-button');
      expect(callBtn).toHaveAttribute('href', 'tel:5551234567');
    });
  });

  it('renders an sms: Text button with correct href', async () => {
    mockGetAccountById.mockResolvedValue(makeAccount({ mobile_phone: '5551234567' }));
    render(<PersonDetailModal {...DEFAULT_PROPS} onClose={onClose} />);
    await waitFor(() => {
      const textBtn = screen.getByTestId('text-button');
      expect(textBtn).toHaveAttribute('href', 'sms:5551234567');
    });
  });

  it('shows "No phone number on file" when account has no mobile_phone', async () => {
    mockGetAccountById.mockResolvedValue(makeAccount({ mobile_phone: undefined }));
    render(<PersonDetailModal {...DEFAULT_PROPS} onClose={onClose} />);
    await waitFor(() => expect(screen.getByTestId('no-phone-message')).toBeInTheDocument());
  });

  it('does not show Call/Text buttons when no phone', async () => {
    mockGetAccountById.mockResolvedValue(makeAccount({ mobile_phone: undefined }));
    render(<PersonDetailModal {...DEFAULT_PROPS} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.queryByTestId('call-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('text-button')).not.toBeInTheDocument();
    });
  });

  it('shows error alert when fetch fails', async () => {
    mockGetAccountById.mockRejectedValue(new Error('Network error'));
    render(<PersonDetailModal {...DEFAULT_PROPS} onClose={onClose} />);
    await waitFor(() => expect(screen.getByTestId('fetch-error')).toBeInTheDocument());
  });

  it('calls getAccountById with the correct personId', async () => {
    mockGetAccountById.mockResolvedValue(makeAccount());
    render(<PersonDetailModal {...DEFAULT_PROPS} personId="acc-42" onClose={onClose} />);
    await waitFor(() => expect(mockGetAccountById).toHaveBeenCalledWith('acc-42'));
  });
});
