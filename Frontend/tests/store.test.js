/**
 * Store Tests for Prolog-Tutor
 * Tests for the actual appStore state management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the API client to avoid network calls
vi.mock('../src/utils/apiClient', () => ({
  executeQuery: vi.fn(),
  getHealth: vi.fn(),
  getStats: vi.fn()
}));

// Mock accessibility module (uses document which isn't available in node test env)
vi.mock('../src/utils/accessibility', () => ({
  default: {
    announceThemeChange: vi.fn(),
    announcePanelToggle: vi.fn(),
    announceExecutionStart: vi.fn(),
    announceExecutionComplete: vi.fn(),
    announceExecutionError: vi.fn(),
    announceBackendStatus: vi.fn(),
    announceEasterEgg: vi.fn(),
  },
  checkEasterEgg: vi.fn(() => ({ isEasterEgg: false })),
  createConfettiEffect: vi.fn(),
}));

// Mock easterEgg module
vi.mock('../src/utils/easterEgg', () => ({
  checkEasterEgg: vi.fn(() => ({ isEasterEgg: false })),
  createConfettiEffect: vi.fn(),
}));

// Mock themes/colors module
vi.mock('../src/themes/colors', () => ({
  applyTheme: vi.fn(),
  getInitialTheme: () => 'light',
  saveTheme: vi.fn(),
}));

// Import the actual store
import useAppStore from '../src/store/appStore';

describe('App Store', () => {
  // Use a fresh store state for each test
  beforeEach(() => {
    // Reset store state
    useAppStore.setState({
      code: '',
      query: '',
      treeData: null,
      isExecuting: false,
      errors: [],
      theme: 'light',
      sidebarOpen: true,
      panelStates: {
        knowledgeBase: false,
        agents: false,
        console: false,
      },
      consoleLogs: [],
      files: [],
      currentFile: null,
      unsavedChanges: false,
    });
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const state = useAppStore.getState();
      expect(state.code).toBe('');
      expect(state.query).toBe('');
      expect(state.treeData).toBeNull();
      expect(state.isExecuting).toBe(false);
      expect(state.errors).toEqual([]);
      expect(state.theme).toBe('light');
      expect(state.sidebarOpen).toBe(true);
    });
  });

  describe('Code Management', () => {
    it('should update code', () => {
      useAppStore.getState().setCode('parent(john, mary).');
      expect(useAppStore.getState().code).toBe('parent(john, mary).');
    });

    it('should replace existing code', () => {
      useAppStore.getState().setCode('first code');
      useAppStore.getState().setCode('second code');
      expect(useAppStore.getState().code).toBe('second code');
    });

    it('should mark unsaved changes when code is updated', () => {
      useAppStore.getState().setCode('new code');
      expect(useAppStore.getState().unsavedChanges).toBe(true);
    });
  });

  describe('Query Management', () => {
    it('should update query', () => {
      useAppStore.getState().setQuery('parent(john, X).');
      expect(useAppStore.getState().query).toBe('parent(john, X).');
    });
  });

  describe('Error Management', () => {
    it('should add errors', () => {
      useAppStore.getState().addError({ message: 'Test error 1' });
      useAppStore.getState().addError({ message: 'Test error 2' });
      expect(useAppStore.getState().errors).toHaveLength(2);
    });

    it('should clear errors', () => {
      useAppStore.getState().addError({ message: 'Test error' });
      useAppStore.getState().clearErrors();
      expect(useAppStore.getState().errors).toEqual([]);
    });
  });

  describe('Execution State', () => {
    it('should update execution state', () => {
      useAppStore.setState({ isExecuting: true, treeData: { id: 'test' } });
      expect(useAppStore.getState().isExecuting).toBe(true);
      expect(useAppStore.getState().treeData).toEqual({ id: 'test' });
    });

    it('should reset execution state', () => {
      useAppStore.setState({ isExecuting: true, treeData: { id: 'test' }, currentStep: 5, totalSteps: 10 });
      useAppStore.getState().resetExecution();
      // resetExecution doesn't reset isExecuting, only treeData and step-related fields
      expect(useAppStore.getState().treeData).toBeNull();
      expect(useAppStore.getState().currentStep).toBe(0);
      expect(useAppStore.getState().totalSteps).toBe(0);
      expect(useAppStore.getState().executionHistory).toEqual([]);
    });

    it('should reset all execution state with resetAll', () => {
      useAppStore.setState({ isExecuting: true, treeData: { id: 'test' }, errors: [{ message: 'error' }] });
      useAppStore.getState().resetAll();
      expect(useAppStore.getState().isExecuting).toBe(false);
      expect(useAppStore.getState().treeData).toBeNull();
      expect(useAppStore.getState().errors).toEqual([]);
    });
  });

  describe('Theme Management', () => {
    it('should toggle theme', () => {
      expect(useAppStore.getState().theme).toBe('light');
      useAppStore.getState().toggleTheme();
      expect(useAppStore.getState().theme).toBe('dark');
      useAppStore.getState().toggleTheme();
      expect(useAppStore.getState().theme).toBe('light');
    });

    it('should set theme directly', () => {
      useAppStore.getState().setTheme('dark');
      expect(useAppStore.getState().theme).toBe('dark');
    });
  });

  describe('Sidebar Management', () => {
    it('should toggle sidebar', () => {
      expect(useAppStore.getState().sidebarOpen).toBe(true);
      useAppStore.getState().toggleSidebar();
      expect(useAppStore.getState().sidebarOpen).toBe(false);
      useAppStore.getState().toggleSidebar();
      expect(useAppStore.getState().sidebarOpen).toBe(true);
    });
  });

  describe('Panel Management', () => {
    it('should toggle panel', () => {
      useAppStore.getState().togglePanel('console');
      expect(useAppStore.getState().panelStates.console).toBe(true);
      useAppStore.getState().togglePanel('console');
      expect(useAppStore.getState().panelStates.console).toBe(false);
    });
  });

  describe('Console Log Management', () => {
    it('should add console log', () => {
      useAppStore.getState().addConsoleLog({
        type: 'success',
        source: 'test',
        message: 'Test message'
      });
      expect(useAppStore.getState().consoleLogs).toHaveLength(1);
    });

    it('should clear console logs', () => {
      useAppStore.getState().addConsoleLog({
        type: 'success',
        source: 'test',
        message: 'Test message'
      });
      useAppStore.getState().clearConsoleLogs();
      expect(useAppStore.getState().consoleLogs).toHaveLength(0);
    });
  });

  describe('Execution Progress', () => {
    it('should set execution progress', () => {
      useAppStore.getState().setExecutionProgress(50);
      expect(useAppStore.getState().executionProgress).toBe(50);
    });

    it('should clamp execution progress between 0 and 100', () => {
      useAppStore.getState().setExecutionProgress(150);
      expect(useAppStore.getState().executionProgress).toBe(100);
      useAppStore.getState().setExecutionProgress(-10);
      expect(useAppStore.getState().executionProgress).toBe(0);
    });
  });

  describe('File Management', () => {
    it('should create a new file', () => {
      useAppStore.setState({ code: 'test code' });
      useAppStore.getState().createFile('test.pl');
      const { files } = useAppStore.getState();
      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('test.pl');
      expect(files[0].code).toBe('test code');
    });

    it('should load a file', () => {
      const fileId = 'test-file-id';
      useAppStore.setState({
        files: [{
          id: fileId,
          name: 'test.pl',
          code: 'loaded code',
          lastModified: new Date().toISOString()
        }]
      });
      useAppStore.getState().loadFile(fileId);
      expect(useAppStore.getState().code).toBe('loaded code');
      expect(useAppStore.getState().currentFile).toBe(fileId);
    });
  });

  describe('Subscription', () => {
    it('should notify subscribers on state change', () => {
      const calls = [];
      const unsubscribe = useAppStore.subscribe((state) => calls.push(state.code));
      
      useAppStore.getState().setCode('test1');
      useAppStore.getState().setCode('test2');
      
      unsubscribe();
      
      useAppStore.getState().setCode('test3');
      
      expect(calls).toEqual(['test1', 'test2']);
      expect(useAppStore.getState().code).toBe('test3');
    });
  });
});
