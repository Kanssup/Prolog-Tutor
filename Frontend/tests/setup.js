/**
 * Vitest Setup File
 * Configure testing environment and matchers
 */
import '@testing-library/jest-dom';

// Only run DOM mocks if we're in a browser-like environment
if (typeof window !== 'undefined') {
  // Mock window.matchMedia for theme preference tests
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock clipboard API
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
    },
    writable: true,
  });

  // Mock window.innerHeight and innerWidth
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    value: 768,
  });
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    value: 1024,
  });

  // Mock window.requestAnimationFrame
  window.requestAnimationFrame = vi.fn(callback => setTimeout(callback, 16));
  window.cancelAnimationFrame = vi.fn(id => clearTimeout(id));
}

// Mock localStorage - available in both node and browser
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(global, 'sessionStorage', {
  value: sessionStorageMock,
});

// Suppress specific console warnings in tests (optional)
const originalConsole = { ...console };
beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks();
  
  // Reset localStorage mock implementations
  localStorageMock.getItem.mockReturnValue(null);
  localStorageMock.setItem.mockReturnValue(undefined);
  localStorageMock.removeItem.mockReturnValue(undefined);
  
  sessionStorageMock.getItem.mockReturnValue(null);
  sessionStorageMock.setItem.mockReturnValue(undefined);
  sessionStorageMock.removeItem.mockReturnValue(undefined);
});

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation((message) => {
    // Suppress specific known warnings if needed
    if (message?.includes?.('Not implemented: navigation')) return;
    originalConsole.warn(message);
  });
});

afterEach(() => {
  // Clean up any DOM elements created during tests
  if (typeof document !== 'undefined' && document.body) {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  }
});