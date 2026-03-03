/**
 * Sidebar Component Tests
 *
 * Tests for the Sidebar navigation and refresh controls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';

// Mock db.service so we don't need IndexedDB in tests
vi.mock('../../../services/db.service', () => ({
  getLastSyncFormatted: vi.fn().mockResolvedValue('5 minutes ago'),
}));

// Mock MUI useTheme - Sidebar uses it transitively via MenuProps styling only through Select;
// Since we wrap with MemoryRouter + ThemeProvider isn't needed here as Select styling
// doesn't break without it. We'll just let MUI use defaults.

// ============================================================================
// Helpers
// ============================================================================

function renderSidebar(props: Partial<Parameters<typeof Sidebar>[0]> = {}) {
  const defaults = {
    isRefreshing: false,
    refreshInterval: 5,
    onRefreshNow: vi.fn(),
    onIntervalChange: vi.fn(),
  };
  return render(
    <MemoryRouter>
      <Sidebar {...defaults} {...props} />
    </MemoryRouter>
  );
}

// ============================================================================
// Tests
// ============================================================================

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sidebar container', () => {
    renderSidebar();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('renders Current Shifts navigation link', () => {
    renderSidebar();
    expect(screen.getByTestId('nav-current-shifts')).toBeInTheDocument();
    expect(screen.getByText('Current Shifts')).toBeInTheDocument();
  });

  it('renders Tabular View navigation link', () => {
    renderSidebar();
    expect(screen.getByTestId('nav-tabular-view')).toBeInTheDocument();
    expect(screen.getByText('Tabular View')).toBeInTheDocument();
  });

  it('renders the Refresh Now button', () => {
    renderSidebar();
    expect(screen.getByTestId('refresh-now-button')).toBeInTheDocument();
    expect(screen.getByText('Refresh Now')).toBeInTheDocument();
  });

  it('calls onRefreshNow when Refresh Now button clicked', () => {
    const onRefreshNow = vi.fn();
    renderSidebar({ onRefreshNow });
    fireEvent.click(screen.getByTestId('refresh-now-button'));
    expect(onRefreshNow).toHaveBeenCalledTimes(1);
  });

  it('disables Refresh Now button when isRefreshing is true', () => {
    renderSidebar({ isRefreshing: true });
    expect(screen.getByTestId('refresh-now-button')).toBeDisabled();
  });

  it('shows "Refreshing..." text when isRefreshing is true', () => {
    renderSidebar({ isRefreshing: true });
    expect(screen.getByText('Refreshing...')).toBeInTheDocument();
  });

  it('renders the auto-refresh select dropdown', () => {
    renderSidebar();
    expect(screen.getByTestId('auto-refresh-select')).toBeInTheDocument();
  });

  it('renders last-sync label container', async () => {
    renderSidebar();
    await waitFor(() => {
      expect(screen.getByTestId('last-sync-label')).toBeInTheDocument();
    });
  });

  it('displays formatted last sync time from db.service', async () => {
    renderSidebar();
    await waitFor(() => {
      expect(screen.getByTestId('last-sync-label')).toHaveTextContent(
        'Last refreshed: 5 minutes ago'
      );
    });
  });

  it('shows Auto Refresh label for the dropdown section', () => {
    renderSidebar();
    expect(screen.getByText('Auto Refresh')).toBeInTheDocument();
  });
});
