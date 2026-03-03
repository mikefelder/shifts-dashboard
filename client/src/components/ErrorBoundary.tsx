/**
 * ErrorBoundary Component
 *
 * React class component that catches render errors from child components.
 * Provides graceful degradation per Constitution Principle VI.
 *
 * Features:
 * - Wraps any child tree and catches synchronous render errors
 * - Displays an MUI Alert with error details
 * - Offers a "Try Again" button to reset the error state
 * - Logs errors to console for debugging
 */

import React, { Component } from 'react';
import { Alert, AlertTitle, Box, Button, Typography } from '@mui/material';
import logger from '../utils/logger';

// ============================================================================
// Types
// ============================================================================

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional fallback to render instead of the default error UI */
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// ============================================================================
// ErrorBoundary Component
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('[ErrorBoundary] Caught render error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          data-testid="error-boundary-fallback"
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Alert
            severity="error"
            data-testid="error-boundary-alert"
            sx={{ width: '100%', maxWidth: 600 }}
          >
            <AlertTitle>Something went wrong</AlertTitle>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </Typography>
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <Typography
                variant="caption"
                component="pre"
                sx={{
                  mt: 1,
                  overflow: 'auto',
                  maxHeight: 200,
                  fontSize: '0.7rem',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {this.state.errorInfo.componentStack}
              </Typography>
            )}
          </Alert>
          <Button variant="outlined" data-testid="error-boundary-reset" onClick={this.handleReset}>
            Try Again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
