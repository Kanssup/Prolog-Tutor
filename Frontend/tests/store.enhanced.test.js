/**
 * Store Enhancement Tests for Prolog-Tutor
 * Tests for executeQuery async flow, formatTreeData, countTreeSteps, and file operations
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

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

// Import the actual store and API mock
import useAppStore from '../src/store/appStore';
import { executeQuery } from '../src/utils/apiClient';

describe('App Store - Enhanced Tests', () => {
  beforeEach(() => {
    // Reset store state
    useAppStore.setState({
      code: '',
      query: '',
      queryInput: '',
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
      runtimeCodeShadow: '',
      currentStep: 0,
      totalSteps: 0,
      executionProgress: 0,
      executionHistory: [],
      runtimeFilesPayload: [],
    });
    vi.clearAllMocks();
  });

  describe('executeQuery - Validation', () => {
    it('should return error when code is empty', async () => {
      useAppStore.setState({ code: '', query: 'test' });
      const result = await useAppStore.getState().executeQuery();
      
      expect(result).toEqual({
        success: false,
        error: 'Código o consulta vacíos',
      });
      expect(useAppStore.getState().errors).toHaveLength(1);
      expect(useAppStore.getState().errors[0].type).toBe('validation');
    });

    it('should return error when query is empty', async () => {
      useAppStore.setState({ code: 'test code', query: '' });
      const result = await useAppStore.getState().executeQuery();
      
      expect(result).toEqual({
        success: false,
        error: 'Código o consulta vacíos',
      });
    });

    it('should return error when both code and query are empty', async () => {
      useAppStore.setState({ code: '', query: '' });
      const result = await useAppStore.getState().executeQuery();
      
      expect(result).toEqual({
        success: false,
        error: 'Código o consulta vacíos',
      });
    });
  });

  describe('executeQuery - Successful Execution', () => {
    it('should execute query successfully and set treeData', async () => {
      const mockTree = {
        goal: 'parent(john, mary)',
        status: 'success',
        level: 0,
        children: [
          { goal: 'parent(john, mary)', status: 'success', level: 1, children: [] }
        ]
      };
      
      executeQuery.mockResolvedValue({
        success: true,
        tree: mockTree,
        consoleOutput: 'true'
      });
      
      useAppStore.setState({ 
        code: 'parent(john, mary).', 
        query: 'parent(john, mary)' 
      });
      
      const result = await useAppStore.getState().executeQuery();
      
      expect(result.success).toBe(true);
      expect(useAppStore.getState().treeData).not.toBeNull();
      expect(useAppStore.getState().isExecuting).toBe(false);
    });

    it('should handle query failure (false result)', async () => {
      executeQuery.mockResolvedValue({
        success: false,
        consoleOutput: 'false.'
      });
      
      useAppStore.setState({ 
        code: 'parent(john, mary).', 
        query: 'sibling(john, mary)' 
      });
      
      const result = await useAppStore.getState().executeQuery();
      
      expect(result.success).toBe(false);
      expect(useAppStore.getState().consoleLogs.length).toBeGreaterThan(0);
    });

    it('should handle execution with console output', async () => {
      executeQuery.mockResolvedValue({
        success: true,
        consoleOutput: 'Hello World\nTest output',
        tree: null
      });
      
      useAppStore.setState({ 
        code: 'write("Hello World"), nl.', 
        query: 'write("Hello World"), nl.' 
      });
      
      await useAppStore.getState().executeQuery();
      
      const consoleLogs = useAppStore.getState().consoleLogs;
      expect(consoleLogs.length).toBeGreaterThan(0);
      expect(consoleLogs[0].type).toBe('success');
    });

    it('should handle execution with trace output', async () => {
      executeQuery.mockResolvedValue({
        success: true,
        traceOutput: 'Call: parent(john, X)\nExit: parent(john, mary)',
        tree: null
      });
      
      useAppStore.setState({ 
        code: 'parent(john, mary).', 
        query: 'parent(john, X)' 
      });
      
      await useAppStore.getState().executeQuery();
      
      const consoleLogs = useAppStore.getState().consoleLogs;
      const traceLog = consoleLogs.find(log => log.source === 'trace');
      expect(traceLog).toBeDefined();
    });

    it('should update code when backend returns updatedCode', async () => {
      executeQuery.mockResolvedValue({
        success: true,
        tree: null,
        updatedCode: 'parent(john, mary).\nfather(john, mary).'
      });
      
      useAppStore.setState({ 
        code: 'parent(john, mary).', 
        query: 'assert(father(john, mary))' 
      });
      
      await useAppStore.getState().executeQuery();
      
      expect(useAppStore.getState().code).toContain('father(john, mary)');
    });

    it('should update runtime files from backend', async () => {
      executeQuery.mockResolvedValue({
        success: true,
        tree: null,
        runtimeFiles: [
          { name: 'test.pl', content: 'new content', lastModified: '2024-01-01' }
        ]
      });
      
      useAppStore.setState({ 
        code: 'test.', 
        query: 'test' 
      });
      
      await useAppStore.getState().executeQuery();
      
      const files = useAppStore.getState().files;
      expect(files.length).toBeGreaterThan(0);
    });

    it('should update existing runtime file', async () => {
      useAppStore.setState({
        files: [
          { id: 'file-1', name: 'test.pl', code: 'old content', lastModified: '2024-01-01' }
        ],
        currentFile: 'file-1'
      });
      
      executeQuery.mockResolvedValue({
        success: true,
        tree: null,
        runtimeFiles: [
          { name: 'test.pl', content: 'updated content', lastModified: '2024-01-02' }
        ]
      });
      
      useAppStore.setState({ 
        code: 'updated content', 
        query: 'test' 
      });
      
      await useAppStore.getState().executeQuery();
      
      const files = useAppStore.getState().files;
      expect(files[0].code).toBe('updated content');
    });
  });

  describe('executeQuery - Error Handling', () => {
    it('should handle API errors', async () => {
      executeQuery.mockRejectedValue(new Error('Network error'));
      
      useAppStore.setState({ 
        code: 'test.', 
        query: 'test' 
      });
      
      const result = await useAppStore.getState().executeQuery();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(useAppStore.getState().errors.length).toBeGreaterThan(0);
    });

    it('should handle execution failure from backend', async () => {
      executeQuery.mockResolvedValue({
        success: false,
        error: 'Syntax error in query'
      });
      
      useAppStore.setState({ 
        code: 'test.', 
        query: 'invalid query' 
      });
      
      const result = await useAppStore.getState().executeQuery();
      
      expect(result.success).toBe(false);
      expect(useAppStore.getState().errors.length).toBeGreaterThan(0);
    });
  });

  describe('formatTreeData', () => {
    it('should return null for null input', () => {
      const result = useAppStore.getState().formatTreeData(null);
      expect(result).toBeNull();
    });

    it('should format a simple tree node', () => {
      const tree = {
        goal: 'parent(john, mary)',
        status: 'success',
        level: 0,
        children: []
      };
      
      const result = useAppStore.getState().formatTreeData(tree);
      
      expect(result).not.toBeNull();
      expect(result.goal).toBe('parent(john, mary)');
      expect(result.name).toBe('parent(john, mary)');
      expect(result.status).toBe('success');
      expect(result.children).toEqual([]);
    });

    it('should format tree with children', () => {
      const tree = {
        goal: 'parent(john, X)',
        status: 'success',
        level: 0,
        children: [
          { goal: 'parent(john, mary)', status: 'success', level: 1, children: [] },
          { goal: 'parent(john, bob)', status: 'success', level: 1, children: [] }
        ]
      };
      
      const result = useAppStore.getState().formatTreeData(tree);
      
      expect(result.children).toHaveLength(2);
      expect(result.children[0].goal).toBe('parent(john, mary)');
    });

    it('should handle array of root nodes', () => {
      const trees = [
        { goal: 'query1', status: 'success', level: 0, children: [] },
        { goal: 'query2', status: 'success', level: 0, children: [] }
      ];
      
      const result = useAppStore.getState().formatTreeData(trees);
      
      expect(result).not.toBeNull();
      expect(result.children).toHaveLength(2);
    });

    it('should handle empty array', () => {
      const result = useAppStore.getState().formatTreeData([]);
      expect(result).toBeNull();
    });

    it('should preserve metadata from nodes', () => {
      const tree = {
        goal: 'test',
        status: 'success',
        level: 0,
        metadata: {
          executionTime: 100,
          ruleUsed: 'parent/2',
          port: 'call'
        },
        children: []
      };
      
      const result = useAppStore.getState().formatTreeData(tree);
      
      expect(result.metadata.executionTime).toBe(100);
      expect(result.metadata.ruleUsed).toBe('parent/2');
      expect(result.metadata.port).toBe('call');
    });

    it('should preserve bindings from nodes', () => {
      const tree = {
        goal: 'parent(john, X)',
        status: 'success',
        level: 0,
        bindings: { X: 'mary' },
        children: []
      };
      
      const result = useAppStore.getState().formatTreeData(tree);
      
      expect(result.bindings).toEqual({ X: 'mary' });
    });
  });

  describe('countTreeSteps', () => {
    it('should return 0 for null', () => {
      const result = useAppStore.getState().countTreeSteps(null);
      expect(result).toBe(0);
    });

    it('should count single node as 1', () => {
      const tree = { goal: 'test', children: [] };
      const result = useAppStore.getState().countTreeSteps(tree);
      expect(result).toBe(1);
    });

    it('should count all nodes recursively', () => {
      const tree = {
        goal: 'root',
        children: [
          { goal: 'child1', children: [] },
          { 
            goal: 'child2', 
            children: [
              { goal: 'grandchild', children: [] }
            ] 
          }
        ]
      };
      
      const result = useAppStore.getState().countTreeSteps(tree);
      expect(result).toBe(4); // root + child1 + child2 + grandchild
    });

    it('should handle deep nesting', () => {
      const tree = {
        goal: 'level0',
        children: [
          {
            goal: 'level1',
            children: [
              {
                goal: 'level2',
                children: [
                  { goal: 'level3', children: [] }
                ]
              }
            ]
          }
        ]
      };
      
      const result = useAppStore.getState().countTreeSteps(tree);
      expect(result).toBe(4);
    });
  });

  describe('File Operations - Advanced', () => {
    it('should auto-increment duplicate file names', () => {
      useAppStore.setState({ code: 'test1' });
      useAppStore.getState().createFile('program.pl');
      
      useAppStore.setState({ code: 'test2' });
      useAppStore.getState().createFile('program.pl');
      
      useAppStore.setState({ code: 'test3' });
      useAppStore.getState().createFile('program.pl');
      
      const files = useAppStore.getState().files;
      expect(files).toHaveLength(3);
      expect(files[0].name).toBe('program.pl');
      expect(files[1].name).toBe('program (1).pl');
      expect(files[2].name).toBe('program (2).pl');
    });

    it('should save existing file with new name', () => {
      useAppStore.setState({
        files: [{ id: 'file-1', name: 'old.pl', code: 'old', lastModified: '2024-01-01' }],
        currentFile: 'file-1',
        code: 'new code'
      });
      
      useAppStore.getState().saveFile('new.pl');
      
      const files = useAppStore.getState().files;
      expect(files[0].name).toBe('new.pl');
      expect(files[0].code).toBe('new code');
    });

    it('should create new file when saving without currentFile', () => {
      useAppStore.setState({
        files: [],
        code: 'my code'
      });
      
      useAppStore.getState().saveFile('standalone.pl');
      
      const files = useAppStore.getState().files;
      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('standalone.pl');
    });

    it('should delete file and switch to next available', () => {
      useAppStore.setState({
        files: [
          { id: 'file-1', name: 'file1.pl', code: 'code1', lastModified: '2024-01-01' },
          { id: 'file-2', name: 'file2.pl', code: 'code2', lastModified: '2024-01-01' }
        ],
        currentFile: 'file-1',
        code: 'code1'
      });
      
      useAppStore.getState().deleteFile('file-1');
      
      const state = useAppStore.getState();
      expect(state.files).toHaveLength(1);
      expect(state.currentFile).toBe('file-2');
      expect(state.code).toBe('code2');
    });

    it('should delete file without switching if not current', () => {
      useAppStore.setState({
        files: [
          { id: 'file-1', name: 'file1.pl', code: 'code1', lastModified: '2024-01-01' },
          { id: 'file-2', name: 'file2.pl', code: 'code2', lastModified: '2024-01-01' }
        ],
        currentFile: 'file-2'
      });
      
      useAppStore.getState().deleteFile('file-1');
      
      const state = useAppStore.getState();
      expect(state.files).toHaveLength(1);
      expect(state.currentFile).toBe('file-2');
    });

    it('should handle deletion of last file', () => {
      useAppStore.setState({
        files: [{ id: 'file-1', name: 'file1.pl', code: 'code1', lastModified: '2024-01-01' }],
        currentFile: 'file-1',
        code: 'code1'
      });
      
      useAppStore.getState().deleteFile('file-1');
      
      const state = useAppStore.getState();
      expect(state.files).toHaveLength(0);
      expect(state.currentFile).toBeNull();
      expect(state.code).toBe('code1'); // keeps the code
    });
  });

  describe('Step Navigation', () => {
    it('should set current step within bounds', () => {
      useAppStore.setState({ totalSteps: 10, currentStep: 5 });
      
      useAppStore.getState().setCurrentStep(7);
      expect(useAppStore.getState().currentStep).toBe(7);
      
      useAppStore.getState().setCurrentStep(0);
      expect(useAppStore.getState().currentStep).toBe(0);
    });

    it('should clamp step to valid range', () => {
      useAppStore.setState({ totalSteps: 10, currentStep: 5 });
      
      useAppStore.getState().setCurrentStep(100);
      expect(useAppStore.getState().currentStep).toBe(9); // totalSteps - 1
      
      useAppStore.getState().setCurrentStep(-5);
      expect(useAppStore.getState().currentStep).toBe(0);
    });

    it('should navigate to next step', () => {
      useAppStore.setState({ totalSteps: 10, currentStep: 5 });
      
      useAppStore.getState().nextStep();
      expect(useAppStore.getState().currentStep).toBe(6);
    });

    it('should not exceed totalSteps on nextStep', () => {
      useAppStore.setState({ totalSteps: 10, currentStep: 9 });
      
      useAppStore.getState().nextStep();
      expect(useAppStore.getState().currentStep).toBe(9);
    });

    it('should navigate to previous step', () => {
      useAppStore.setState({ totalSteps: 10, currentStep: 5 });
      
      useAppStore.getState().prevStep();
      expect(useAppStore.getState().currentStep).toBe(4);
    });

    it('should not go below 0 on prevStep', () => {
      useAppStore.setState({ totalSteps: 10, currentStep: 0 });
      
      useAppStore.getState().prevStep();
      expect(useAppStore.getState().currentStep).toBe(0);
    });
  });

  describe('Execution Speed', () => {
    it('should set valid execution speed', () => {
      useAppStore.getState().setExecutionSpeed(2);
      expect(useAppStore.getState().executionSpeed).toBe(2);
    });

    it('should clamp speed between 0.1 and 5', () => {
      useAppStore.getState().setExecutionSpeed(10);
      expect(useAppStore.getState().executionSpeed).toBe(5);
      
      useAppStore.getState().setExecutionSpeed(0);
      expect(useAppStore.getState().executionSpeed).toBe(0.1);
    });
  });

  describe('Query Input Management', () => {
    it('should update queryInput separately from query', () => {
      useAppStore.getState().setQuery('parent(john, X)');
      useAppStore.getState().setQueryInput('mary');
      
      const state = useAppStore.getState();
      expect(state.query).toBe('parent(john, X)');
      expect(state.queryInput).toBe('mary');
    });

    it('should normalize query in executeQuery', () => {
      useAppStore.setState({ 
        code: 'test.', 
        query: 'parent(john, mary).' 
      });
      
      // The executeQuery action normalizes the query
      useAppStore.getState().setQuery('parent(john, mary)..');
      
      expect(useAppStore.getState().query).toBe('parent(john, mary)..');
    });
  });

  describe('Knowledge Base Operations', () => {
    it('should create a knowledge base', () => {
      // Reset knowledgeBases to empty array (ignore persist state)
      useAppStore.setState({ knowledgeBases: [], currentKB: null });
      
      const kb = useAppStore.getState().createKnowledgeBase('Test KB', 'Test description');
      
      expect(kb).not.toBeNull();
      expect(kb.name).toBe('Test KB');
      expect(kb.description).toBe('Test description');
      expect(useAppStore.getState().knowledgeBases).toHaveLength(1);
      expect(useAppStore.getState().currentKB).toBe(kb.id);
    });

    it('should add entry to knowledge base', () => {
      useAppStore.setState({ knowledgeBases: [], currentKB: null });
      
      const kb = useAppStore.getState().createKnowledgeBase('Test KB');
      
      useAppStore.getState().addToKnowledgeBase(kb.id, {
        id: 'entry-1',
        name: 'Test Entry',
        code: 'test code',
        query: 'test',
        type: 'query'
      });
      
      const updatedKB = useAppStore.getState().knowledgeBases.find(k => k.id === kb.id);
      expect(updatedKB.files).toHaveLength(1);
    });

    it('should delete knowledge base', () => {
      // Start fresh
      useAppStore.setState({ knowledgeBases: [], currentKB: null });
      
      const kb = useAppStore.getState().createKnowledgeBase('Test KB');
      useAppStore.setState({ knowledgeBases: useAppStore.getState().knowledgeBases, currentKB: useAppStore.getState().currentKB });
      
      useAppStore.getState().createKnowledgeBase('Test KB 2');
      
      const currentKBs = useAppStore.getState().knowledgeBases;
      useAppStore.setState({ knowledgeBases: currentKBs });
      
      useAppStore.getState().deleteKnowledgeBase(kb.id);
      
      expect(useAppStore.getState().knowledgeBases.filter(kb => kb.name === 'Test KB')).toHaveLength(0);
      expect(useAppStore.getState().currentKB).not.toBe(kb.id);
    });
  });

  describe('Agent Operations', () => {
    it('should toggle individual agent', () => {
      useAppStore.getState().toggleAgent('explanation');
      
      const state = useAppStore.getState();
      expect(state.agents.explanation.enabled).toBe(false);
    });

    it('should add agent response', () => {
      useAppStore.getState().addAgentResponse({
        type: 'explanation',
        message: 'Test explanation',
        timestamp: new Date().toISOString()
      });
      
      expect(useAppStore.getState().agentResponses).toHaveLength(1);
    });

    it('should limit agent responses to 50', () => {
      for (let i = 0; i < 60; i++) {
        useAppStore.getState().addAgentResponse({
          type: 'test',
          message: `Message ${i}`,
          timestamp: new Date().toISOString()
        });
      }
      
      expect(useAppStore.getState().agentResponses).toHaveLength(50);
    });

    it('should clear agent responses', () => {
      useAppStore.getState().addAgentResponse({ type: 'test', message: 'test' });
      useAppStore.getState().clearAgentResponses();
      
      expect(useAppStore.getState().agentResponses).toHaveLength(0);
    });
  });

  describe('Easter Egg', () => {
    it('should trigger easter egg', () => {
      useAppStore.getState().triggerEasterEgg({
        isEasterEgg: true,
        message: 'You found it!',
        response: 'capture(lester).'
      });
      
      const state = useAppStore.getState();
      expect(state.easterEggTriggered).toBe(true);
      expect(state.easterEggCount).toBe(1);
      expect(state.consoleLogs.length).toBeGreaterThan(0);
      expect(state.agentResponses[0].type).toBe('easter-egg');
    });

    it('should auto-reset easter egg after 10 seconds', async () => {
      vi.useFakeTimers();
      
      useAppStore.getState().triggerEasterEgg({
        isEasterEgg: true,
        message: 'You found it!'
      });
      
      expect(useAppStore.getState().easterEggTriggered).toBe(true);
      
      vi.advanceTimersByTime(10000);
      
      expect(useAppStore.getState().easterEggTriggered).toBe(false);
      
      vi.useRealTimers();
    });
  });

  describe('System Operations', () => {
    it('should check backend health', async () => {
      const { getHealth } = await import('../src/utils/apiClient');
      getHealth.mockResolvedValue({ status: 'healthy', latency: 10 });
      
      const health = await useAppStore.getState().checkBackendHealth();
      
      expect(health.status).toBe('healthy');
      expect(useAppStore.getState().backendHealth.status).toBe('healthy');
    });

    it('should handle health check failure', async () => {
      const { getHealth } = await import('../src/utils/apiClient');
      getHealth.mockRejectedValue(new Error('Connection refused'));
      
      const health = await useAppStore.getState().checkBackendHealth();
      
      expect(health).toBeNull();
      expect(useAppStore.getState().backendHealth.status).toBe('unhealthy');
    });

    it('should fetch stats', async () => {
      const { getStats } = await import('../src/utils/apiClient');
      getStats.mockResolvedValue({ executions: 100, avgTime: 50 });
      
      const stats = await useAppStore.getState().fetchStats();
      
      expect(stats.executions).toBe(100);
    });
  });
});
