/**
 * @vitest-environment happy-dom
 */

/**
 * KeyboardShortcuts Component Tests for Prolog-Tutor
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import KeyboardShortcuts from '../../src/components/accessibility/KeyboardShortcuts';

describe('KeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the keyboard shortcut button', () => {
    render(<KeyboardShortcuts />);
    
    expect(screen.getByRole('button', { name: /Mostrar atajos/ })).toBeInTheDocument();
  });

  it('should open the modal when button is clicked', async () => {
    render(<KeyboardShortcuts />);
    
    const button = screen.getByRole('button', { name: /Mostrar atajos/ });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Atajos de Teclado')).toBeInTheDocument();
    });
  });

  it('should display all shortcut categories', async () => {
    render(<KeyboardShortcuts />);
    
    fireEvent.click(screen.getByRole('button', { name: /Mostrar atajos/ }));
    
    await waitFor(() => {
      expect(screen.getByText('Ejecución')).toBeInTheDocument();
      expect(screen.getByText('Navegación')).toBeInTheDocument();
      expect(screen.getByText('Editor')).toBeInTheDocument();
      expect(screen.getByText('Consola')).toBeInTheDocument();
    });
  });

  it('should display Ctrl+Enter shortcut', async () => {
    render(<KeyboardShortcuts />);
    
    fireEvent.click(screen.getByRole('button', { name: /Mostrar atajos/ }));
    
    await waitFor(() => {
      expect(screen.getByText('Ejecutar consulta actual')).toBeInTheDocument();
    });
  });

  it('should display Ctrl+S shortcut for save', async () => {
    render(<KeyboardShortcuts />);
    
    fireEvent.click(screen.getByRole('button', { name: /Mostrar atajos/ }));
    
    await waitFor(() => {
      expect(screen.getByText('Guardar código')).toBeInTheDocument();
    });
  });

  it('should close modal when close button is clicked', async () => {
    render(<KeyboardShortcuts />);
    
    fireEvent.click(screen.getByRole('button', { name: /Mostrar atajos/ }));
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByRole('button', { name: /Cerrar diálogo/ });
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('should have proper accessibility attributes', async () => {
    render(<KeyboardShortcuts />);
    
    fireEvent.click(screen.getByRole('button', { name: /Mostrar atajos/ }));
    
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });
});
