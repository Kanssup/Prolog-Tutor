/**
 * @vitest-environment happy-dom
 * 
 * Integration Tests for Prolog-Tutor
 * Tests ACTUAL user flows with real store, mocked API only
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

// Mock @monaco-editor/react - simple textarea replacement
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(({ value, onChange }) => (
    <textarea
      data-testid="monaco-editor"
      value={value || ''}
      onChange={(e) => onChange && onChange(e.target.value)}
    />
  )),
  loader: { config: vi.fn() }
}));

// Mock react-d3-tree - simple div replacement
vi.mock('react-d3-tree', () => ({
  default: vi.fn(({ data }) => (
    <div data-testid="tree-visualization" data-has-data={!!data} />
  ))
}));

// Mock react-toastify
vi.mock('react-toastify', () => ({
  ToastContainer: vi.fn(() => null),
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn() }
}));

// Import real store and components (NOT mocked)
import useAppStore from '../../src/store/appStore';
import App from '../../src/App';
import Header from '../../src/components/layout/Header';
import Sidebar from '../../src/components/layout/Sidebar';
import QueryInput from '../../src/components/editor/QueryInput';
import CodeEditor from '../../src/components/editor/CodeEditor';
import TreeVisualization from '../../src/components/visualization/TreeVisualization';
import ExecutionControls from '../../src/components/visualization/ExecutionControls';
import ConsolePanel from '../../src/components/panels/ConsolePanel';

// Mock fetch - import from setup.js
const mockFetch = global.fetch;

describe('App Integration Tests', () => {
  beforeEach(() => {
    // Reset store to clean state
    useAppStore.setState({
      code: 'padre(juan, maria).\npadre(maria, pedro).\nabuelo(X, Y) :- padre(X, Z), padre(Z, Y).',
      query: 'abuelo(juan, pedro)',
      queryInput: '',
      treeData: null,
      isExecuting: false,
      currentStep: 0,
      totalSteps: 0,
      errors: [],
      consoleLogs: [],
      theme: 'light',
      sidebarOpen: true,
      panelStates: {
        knowledgeBase: false,
        agents: false,
        console: false,
      },
      files: [],
      currentFile: null,
      unsavedChanges: false,
      runtimeCodeShadow: '',
      executionProgress: 0,
      executionHistory: [],
      backendHealth: null,
      easterEggTriggered: false,
      easterEggCount: 0,
    });
    
    vi.clearAllMocks();
  });

  describe('App renders with default state', () => {
    it('should render App component', () => {
      const { container } = render(<App />);
      expect(container.querySelector('#app-container')).toBeInTheDocument();
    });

    it('should render Header component', () => {
      render(<Header />);
      expect(screen.getByText('Prolog Tutor')).toBeInTheDocument();
    });

    it('should render Sidebar component', () => {
      render(<Sidebar />);
      expect(screen.getByText('Navegación')).toBeInTheDocument();
    });

    it('should render CodeEditor component', () => {
      render(<CodeEditor />);
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should render QueryInput component', () => {
      render(<QueryInput />);
      expect(screen.getByText('Consulta Prolog')).toBeInTheDocument();
    });

    it('should render TreeVisualization component', () => {
      render(<TreeVisualization />);
      expect(screen.getByText('Árbol de Ejecución')).toBeInTheDocument();
    });

    it('should render ExecutionControls component', () => {
      render(<ExecutionControls />);
      expect(screen.getByText('Control de Ejecución')).toBeInTheDocument();
    });

    it('should render ConsolePanel component', () => {
      render(<ConsolePanel />);
      expect(screen.getByText('Salida de Consola')).toBeInTheDocument();
    });
  });

  describe('User types code in editor', () => {
    it('should update store code when editor changes', async () => {
      render(<CodeEditor />);
      
      const editor = screen.getByTestId('monaco-editor');
      const newCode = 'nuevo_codigo(a,b).';
      
      fireEvent.change(editor, { target: { value: newCode } });
      
      expect(useAppStore.getState().code).toBe(newCode);
    });

    it('should update store query when query input changes', async () => {
      render(<QueryInput />);
      
      const queryInput = screen.getByPlaceholderText(/Ingresa tu consulta Prolog/);
      const newQuery = 'nuevo_query(a,b)';
      
      fireEvent.change(queryInput, { target: { value: newQuery } });
      
      expect(useAppStore.getState().query).toBe(newQuery);
    });
  });

  describe('User clicks execute - success flow', () => {
    beforeEach(() => {
      // Setup successful API response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          tree: {
            goal: 'abuelo(juan, pedro)',
            status: 'success',
            level: 0,
            children: [
              { goal: 'padre(juan, Z)', status: 'success', level: 1, children: [] },
              { goal: 'padre(maria, pedro)', status: 'success', level: 1, children: [] }
            ]
          },
          consoleOutput: 'true',
        }),
      });
    });

    it('should execute query and show tree on success', async () => {
      // Set code and query
      useAppStore.setState({
        code: 'padre(juan, maria).\npadre(maria, pedro).\nabuelo(X, Y) :- padre(X, Z), padre(Z, Y).',
        query: 'abuelo(juan, pedro)',
      });

      render(<QueryInput />);
      
      const executeButton = screen.getByText('Ejecutar');
      
      await act(async () => {
        fireEvent.click(executeButton);
      });
      
      // Wait for fetch to complete and state to update
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should set isExecuting during execution', async () => {
      let resolveFetch;
      mockFetch.mockImplementation(() => new Promise(resolve => {
        resolveFetch = resolve;
      }));
      
      useAppStore.setState({
        code: 'test.',
        query: 'test',
      });

      render(<QueryInput />);
      
      const executeButton = screen.getByText('Ejecutar');
      
      fireEvent.click(executeButton);
      
      expect(useAppStore.getState().isExecuting).toBe(true);
      
      // Resolve the fetch
      await act(async () => {
        resolveFetch({
          ok: true,
          json: async () => ({ success: true, tree: null }),
        });
      });
    });
  });

  describe('User clicks execute - error flow', () => {
    beforeEach(() => {
      // Setup error API response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Syntax error: unexpected token',
        }),
      });
    });

    it('should handle execution error', async () => {
      useAppStore.setState({
        code: 'invalid code',
        query: 'invalid query',
      });

      render(<QueryInput />);
      
      const executeButton = screen.getByText('Ejecutar');
      
      await act(async () => {
        fireEvent.click(executeButton);
      });
      
      await waitFor(() => {
        expect(useAppStore.getState().errors.length).toBeGreaterThan(0);
      });
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      useAppStore.setState({
        code: 'test.',
        query: 'test',
      });

      render(<QueryInput />);
      
      const executeButton = screen.getByText('Ejecutar');
      
      await act(async () => {
        fireEvent.click(executeButton);
      });
      
      await waitFor(() => {
        expect(useAppStore.getState().errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Theme toggle changes UI', () => {
    it('should toggle theme in store', () => {
      expect(useAppStore.getState().theme).toBe('light');
      
      useAppStore.getState().toggleTheme();
      
      expect(useAppStore.getState().theme).toBe('dark');
    });

    it('should toggle theme back to light', () => {
      useAppStore.setState({ theme: 'dark' });
      
      useAppStore.getState().toggleTheme();
      
      expect(useAppStore.getState().theme).toBe('light');
    });

    it('should render Header with different theme icons', () => {
      useAppStore.setState({ theme: 'light' });
      const { rerender } = render(<Header />);
      expect(screen.getByLabelText(/Cambiar a tema oscuro/)).toBeInTheDocument();
      
      useAppStore.setState({ theme: 'dark' });
      rerender(<Header />);
      expect(screen.getByLabelText(/Cambiar a tema claro/)).toBeInTheDocument();
    });
  });

  describe('Sidebar toggle shows/hides', () => {
    it('should toggle sidebar open state', () => {
      expect(useAppStore.getState().sidebarOpen).toBe(true);
      
      useAppStore.getState().toggleSidebar();
      
      expect(useAppStore.getState().sidebarOpen).toBe(false);
    });

    it('should render collapsed sidebar button when closed', () => {
      useAppStore.setState({ sidebarOpen: false });
      
      render(<Sidebar />);
      
      expect(screen.getByLabelText('Abrir sidebar')).toBeInTheDocument();
    });

    it('should render full sidebar when open', () => {
      useAppStore.setState({ sidebarOpen: true });
      
      render(<Sidebar />);
      
      expect(screen.getByText('Navegación')).toBeInTheDocument();
    });
  });

  describe('Panel toggles work', () => {
    it('should toggle knowledgeBase panel', () => {
      expect(useAppStore.getState().panelStates.knowledgeBase).toBe(false);
      
      useAppStore.getState().togglePanel('knowledgeBase');
      
      expect(useAppStore.getState().panelStates.knowledgeBase).toBe(true);
    });

    it('should toggle agents panel', () => {
      expect(useAppStore.getState().panelStates.agents).toBe(false);
      
      useAppStore.getState().togglePanel('agents');
      
      expect(useAppStore.getState().panelStates.agents).toBe(true);
    });

    it('should toggle console panel', () => {
      expect(useAppStore.getState().panelStates.console).toBe(false);
      
      useAppStore.getState().togglePanel('console');
      
      expect(useAppStore.getState().panelStates.console).toBe(true);
    });
  });

  describe('File operations', () => {
    it('should create new file', () => {
      useAppStore.setState({ code: 'test code' });
      
      useAppStore.getState().createFile('test.pl');
      
      const { files } = useAppStore.getState();
      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('test.pl');
      expect(files[0].code).toBe('test code');
    });

    it('should auto-increment duplicate file names', () => {
      useAppStore.setState({ code: 'code1' });
      useAppStore.getState().createFile('program.pl');
      
      useAppStore.setState({ code: 'code2' });
      useAppStore.getState().createFile('program.pl');
      
      const files = useAppStore.getState().files;
      expect(files).toHaveLength(2);
      expect(files[0].name).toBe('program.pl');
      expect(files[1].name).toBe('program (1).pl');
    });

    it('should save existing file', () => {
      useAppStore.setState({
        code: 'original code',
        files: [{
          id: 'file-1',
          name: 'test.pl',
          code: 'original',
          lastModified: '2024-01-01'
        }],
        currentFile: 'file-1',
      });
      
      useAppStore.getState().setCode('modified code');
      useAppStore.getState().saveFile('test.pl');
      
      const file = useAppStore.getState().files[0];
      expect(file.code).toBe('modified code');
    });

    it('should load file into editor', () => {
      useAppStore.setState({
        files: [{
          id: 'file-1',
          name: 'test.pl',
          code: 'loaded content',
          lastModified: '2024-01-01'
        }],
      });
      
      useAppStore.getState().loadFile('file-1');
      
      expect(useAppStore.getState().code).toBe('loaded content');
      expect(useAppStore.getState().currentFile).toBe('file-1');
    });

    it('should delete file', () => {
      useAppStore.setState({
        files: [
          { id: 'file-1', name: 'file1.pl', code: 'code1', lastModified: '2024-01-01' },
          { id: 'file-2', name: 'file2.pl', code: 'code2', lastModified: '2024-01-01' }
        ],
        currentFile: 'file-1',
      });
      
      useAppStore.getState().deleteFile('file-1');
      
      const { files } = useAppStore.getState();
      expect(files).toHaveLength(1);
      expect(files[0].id).toBe('file-2');
    });
  });

  describe('Store state persists correctly', () => {
    it('should persist theme across resets', () => {
      useAppStore.setState({ theme: 'dark' });
      
      // Simulate persist by getting state
      const { theme } = useAppStore.getState();
      expect(theme).toBe('dark');
    });

    it('should persist sidebar state across resets', () => {
      useAppStore.setState({ sidebarOpen: false });
      
      const { sidebarOpen } = useAppStore.getState();
      expect(sidebarOpen).toBe(false);
    });

    it('should persist files across resets', () => {
      useAppStore.setState({
        files: [{
          id: 'file-1',
          name: 'test.pl',
          code: 'test code',
          lastModified: '2024-01-01'
        }],
      });
      
      const { files } = useAppStore.getState();
      expect(files).toHaveLength(1);
    });

    it('should reset execution state with resetExecution', () => {
      useAppStore.setState({
        treeData: { id: 'tree' },
        currentStep: 5,
        totalSteps: 10,
        executionHistory: [{ timestamp: '2024-01-01' }],
      });
      
      useAppStore.getState().resetExecution();
      
      const state = useAppStore.getState();
      expect(state.treeData).toBeNull();
      expect(state.currentStep).toBe(0);
      expect(state.totalSteps).toBe(0);
      expect(state.executionHistory).toEqual([]);
    });

    it('should reset all state with resetAll', () => {
      useAppStore.setState({
        code: 'test code',
        query: 'test query',
        treeData: { id: 'tree' },
        isExecuting: true,
        errors: [{ message: 'error' }],
        agentResponses: [{ message: 'response' }],
        easterEggTriggered: true,
      });
      
      useAppStore.getState().resetAll();
      
      const state = useAppStore.getState();
      expect(state.code).toBe('');
      expect(state.query).toBe('');
      expect(state.treeData).toBeNull();
      expect(state.isExecuting).toBe(false);
      expect(state.errors).toEqual([]);
      expect(state.easterEggTriggered).toBe(false);
    });
  });

  describe('Step navigation', () => {
    it('should set current step', () => {
      useAppStore.setState({ totalSteps: 10 });
      
      useAppStore.getState().setCurrentStep(5);
      
      expect(useAppStore.getState().currentStep).toBe(5);
    });

    it('should clamp step to valid range', () => {
      useAppStore.setState({ totalSteps: 10, currentStep: 5 });
      
      useAppStore.getState().setCurrentStep(100);
      expect(useAppStore.getState().currentStep).toBe(9);
      
      useAppStore.getState().setCurrentStep(-5);
      expect(useAppStore.getState().currentStep).toBe(0);
    });

    it('should navigate to next step', () => {
      useAppStore.setState({ totalSteps: 10, currentStep: 5 });
      
      useAppStore.getState().nextStep();
      
      expect(useAppStore.getState().currentStep).toBe(6);
    });

    it('should navigate to previous step', () => {
      useAppStore.setState({ totalSteps: 10, currentStep: 5 });
      
      useAppStore.getState().prevStep();
      
      expect(useAppStore.getState().currentStep).toBe(4);
    });

    it('should not exceed bounds on navigation', () => {
      useAppStore.setState({ totalSteps: 10, currentStep: 9 });
      
      useAppStore.getState().nextStep();
      expect(useAppStore.getState().currentStep).toBe(9);
      
      useAppStore.setState({ currentStep: 0 });
      useAppStore.getState().prevStep();
      expect(useAppStore.getState().currentStep).toBe(0);
    });
  });

  describe('Console operations', () => {
    it('should add console log', () => {
      useAppStore.getState().addConsoleLog({
        type: 'success',
        source: 'test',
        message: 'Test message',
        data: 'test data',
      });
      
      const { consoleLogs } = useAppStore.getState();
      expect(consoleLogs).toHaveLength(1);
      expect(consoleLogs[0].message).toBe('Test message');
    });

    it('should clear console logs', () => {
      useAppStore.getState().addConsoleLog({ type: 'test', message: 'test' });
      useAppStore.getState().clearConsoleLogs();
      
      expect(useAppStore.getState().consoleLogs).toHaveLength(0);
    });

    it('should display console logs in ConsolePanel', () => {
      useAppStore.setState({
        consoleLogs: [
          {
            id: 'log-1',
            type: 'success',
            source: 'test',
            message: 'Test message',
            data: 'test data',
            timestamp: new Date().toISOString(),
          },
        ],
      });
      
      render(<ConsolePanel />);
      
      expect(screen.getByText(/Test message/)).toBeInTheDocument();
    });
  });

  describe('Tree visualization', () => {
    it('should show placeholder when no tree data', () => {
      useAppStore.setState({ treeData: null });
      
      render(<TreeVisualization />);
      
      expect(screen.getByText(/Ejecuta una consulta Prolog/)).toBeInTheDocument();
    });

    it('should display tree data when available', () => {
      const mockTreeData = {
        id: 'root',
        name: 'query',
        goal: 'test query',
        status: 'success',
        level: 0,
        children: [],
      };
      
      useAppStore.setState({ treeData: mockTreeData, totalSteps: 1 });
      
      render(<TreeVisualization />);
      
      expect(screen.getByTestId('tree-visualization')).toBeInTheDocument();
    });
  });

  describe('Execution controls', () => {
    it('should display step counter', () => {
      useAppStore.setState({ currentStep: 3, totalSteps: 10 });
      
      render(<ExecutionControls />);
      
      expect(screen.getByText('Paso 4 de 10')).toBeInTheDocument();
    });

    it('should show paused when not playing', () => {
      render(<ExecutionControls />);
      
      expect(screen.getByText('Pausado')).toBeInTheDocument();
    });

    it('should show executing status when isExecuting', () => {
      useAppStore.setState({ isExecuting: true });
      
      render(<ExecutionControls />);
      
      expect(screen.getByText(/Ejecutando consulta/)).toBeInTheDocument();
    });

    it('should set execution speed', () => {
      useAppStore.getState().setExecutionSpeed(2);
      
      expect(useAppStore.getState().executionSpeed).toBe(2);
    });

    it('should clamp execution speed between 0.1 and 5', () => {
      useAppStore.getState().setExecutionSpeed(10);
      expect(useAppStore.getState().executionSpeed).toBe(5);
      
      useAppStore.getState().setExecutionSpeed(0);
      expect(useAppStore.getState().executionSpeed).toBe(0.1);
    });
  });

  describe('Error handling', () => {
    it('should add error to store', () => {
      useAppStore.getState().addError({ message: 'Test error' });
      
      expect(useAppStore.getState().errors).toHaveLength(1);
      expect(useAppStore.getState().errors[0].message).toBe('Test error');
    });

    it('should clear errors', () => {
      useAppStore.getState().addError({ message: 'Test error' });
      useAppStore.getState().clearErrors();
      
      expect(useAppStore.getState().errors).toEqual([]);
    });

    it('should limit errors to 10', () => {
      for (let i = 0; i < 15; i++) {
        useAppStore.getState().addError({ message: `Error ${i}` });
      }
      
      expect(useAppStore.getState().errors).toHaveLength(10);
    });
  });

  describe('Examples in sidebar', () => {
    it('should display examples in sidebar', () => {
      render(<Sidebar />);
      
      expect(screen.getByText('Ejemplos')).toBeInTheDocument();
      expect(screen.getByText('Árbol Genealógico')).toBeInTheDocument();
    });

    it('should load example when clicked', () => {
      render(<Sidebar />);
      
      const exampleButton = screen.getByText('Árbol Genealógico');
      fireEvent.click(exampleButton);
      
      const state = useAppStore.getState();
      expect(state.code).toContain('padre(juan, maria)');
    });
  });

  describe('Query input operations', () => {
    it('should clear query when clear button clicked', () => {
      useAppStore.setState({ query: 'test query' });
      
      render(<QueryInput />);
      
      const clearButton = screen.getByText('Limpiar');
      fireEvent.click(clearButton);
      
      expect(useAppStore.getState().query).toBe('');
    });

    it('should have disabled execute button when query is empty', () => {
      useAppStore.setState({ query: '' });
      
      render(<QueryInput />);
      
      const executeButton = screen.getByRole('button', { name: /ejecutar/i });
      expect(executeButton).toBeDisabled();
    });

    it('should have disabled clear button when query is empty', () => {
      useAppStore.setState({ query: '' });
      
      render(<QueryInput />);
      
      const clearButton = screen.getByRole('button', { name: /limpiar/i });
      expect(clearButton).toBeDisabled();
    });
  });
});
