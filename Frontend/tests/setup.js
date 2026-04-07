/**
 * Vitest Setup File
 * Configure testing environment for integration tests
 * 
 * MOCKING STRATEGY:
 * - Only mock heavy dependencies that can't work in tests (@monaco-editor/react, react-d3-tree)
 * - Mock fetch globally to intercept API calls
 * - DO NOT mock: store, framer-motion, react-icons, utils
 */
import '@testing-library/jest-dom';

// Mock fetch globally - MUST be before any imports
const mockFetch = vi.fn();
global.fetch = mockFetch;
global.fetch.mockResolvedValue = mockFetch.mockResolvedValue;
global.fetch.mockRejectedValue = mockFetch.mockRejectedValue;

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
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i) => Object.keys(store)[i] ?? null),
  };
})();
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i) => Object.keys(store)[i] ?? null),
  };
})();
Object.defineProperty(global, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock react-toastify to avoid popup issues in tests
vi.mock('react-toastify', () => ({
  ToastContainer: vi.fn(() => null),
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Setup global mocks before each test
beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks();
  
  // Reset localStorage mock implementations
  localStorageMock.getItem.mockReturnValue(null);
  localStorageMock.setItem.mockReturnValue(undefined);
  localStorageMock.removeItem.mockReturnValue(undefined);
  localStorageMock.clear.mockImplementation(() => {});
  
  sessionStorageMock.getItem.mockReturnValue(null);
  sessionStorageMock.setItem.mockReturnValue(undefined);
  sessionStorageMock.removeItem.mockReturnValue(undefined);
  sessionStorageMock.clear.mockImplementation(() => {});
  
  // Reset fetch mock
  mockFetch.mockReset();
});

// Suppress specific console warnings in tests (optional)
const originalConsole = { ...console };
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

// Export mockFetch for tests to configure
export { mockFetch };
