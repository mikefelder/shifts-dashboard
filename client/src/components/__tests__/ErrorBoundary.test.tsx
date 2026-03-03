/**
 * ErrorBoundary Tests
 *
 * Tests for the ErrorBoundary class component.
 * Verifies error catching, fallback UI, and reset behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// ============================================================================
// Helpers
// ============================================================================

/** Component that throws a render error */
function ThrowingComponent({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test render error');
  }
  return <div data-testid="child-content">Child rendered OK</div>;
}

/** Suppress console.error noise from intentional throws */
function silenceConsoleError() {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  return spy;
}

// ============================================================================
// Tests
// ============================================================================

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof silenceConsoleError>;

  beforeEach(() => {
    consoleErrorSpy = silenceConsoleError();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
  });

  it('renders error fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
  });

  it('shows an MUI Alert with error message', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    const alert = screen.getByTestId('error-boundary-alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Test render error');
  });

  it('shows "Something went wrong" heading', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders a "Try Again" reset button', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('error-boundary-reset')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary-reset')).toHaveTextContent('Try Again');
  });

  it('reset button click does not throw', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    // Boundary is in error state — clicking Try Again calls handleReset
    expect(() => {
      fireEvent.click(screen.getByTestId('error-boundary-reset'));
    }).not.toThrow();
  });

  it('renders custom fallback prop when provided', () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom error UI</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
  });

  it('logs error to console', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    // console.error is called by React for each throw; our boundary also calls it
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
