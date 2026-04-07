/**
 * @vitest-environment happy-dom
 */

/**
 * ErrorBoundary Component Tests for Prolog-Tutor
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock toast
vi.mock('react-toastify', () => ({
  ToastContainer: () => <div data-testid="toast-container" />,
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}));

import ErrorBoundary from '../../src/components/layout/ErrorBoundary';

describe('ErrorBoundary', () => {
  // Mock console.error to prevent test noise
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  const ErrorThrowingComponent = () => {
    throw new Error('Test error');
  };

  it('should render children when there is no error', () => {
    const { container } = render(
      <ErrorBoundary>
        <div data-testid="child-content">Working content</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByTestId('child-content').textContent).toBe('Working content');
  });

  it('should catch render errors and show fallback UI', async () => {
    const { container } = render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText(/Se produjo un error/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Recarga la pagina/)).toBeInTheDocument();
  });

  it('should display error message when available', async () => {
    const ErrorWithMessage = () => {
      throw new Error('Specific error message');
    };

    const { container } = render(
      <ErrorBoundary>
        <ErrorWithMessage />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText(/Specific error message/)).toBeInTheDocument();
    });
  });

  it('should not show error details when error has no message', async () => {
    const ErrorNoMessage = () => {
      throw new Error();
    };

    const { container } = render(
      <ErrorBoundary>
        <ErrorNoMessage />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText(/Se produjo un error/)).toBeInTheDocument();
    });

    // Should not have detail text for empty messages
    const detailsText = screen.queryByText(/Detalle:/);
    expect(detailsText).not.toBeInTheDocument();
  });

  it('should handle different error types', async () => {
    const TypeErrorComponent = () => {
      const err = new TypeError('Type error test');
      throw err;
    };

    const { container } = render(
      <ErrorBoundary>
        <TypeErrorComponent />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText(/Type error test/)).toBeInTheDocument();
    });
  });

  it('should have proper styling classes for error display', async () => {
    const { container } = render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    await waitFor(() => {
      const errorDiv = screen.getByText(/Se produjo un error/).closest('div');
      expect(errorDiv).toHaveClass('rounded-lg', 'border', 'border-red-200');
    });
  });
});
