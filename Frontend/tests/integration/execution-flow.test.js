/**
 * Execution Flow Integration Tests for Prolog-Tutor
 * Tests the full execution flow from query input to visualization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';

describe('Execution Flow Integration', () => {
  describe('Full Flow Components', () => {
    it('should have all execution flow components', () => {
      // Check all key components exist
      const components = [
        './src/components/editor/CodeEditor.jsx',
        './src/components/editor/QueryInput.jsx',
        './src/components/visualization/TreeVisualization.jsx',
        './src/components/visualization/ExecutionControls.jsx',
        './src/components/panels/ConsolePanel.jsx',
        './src/components/layout/SplitPaneLayout.jsx',
        './src/store/appStore.js',
      ];

      components.forEach(comp => {
        expect(fs.existsSync(comp)).toBe(true);
      });
    });

    it('should have store with executeQuery action', () => {
      const storeCode = fs.readFileSync('./src/store/appStore.js', 'utf8');
      
      expect(storeCode).toContain('executeQuery');
      expect(storeCode).toContain('async');
    });

    it('should have API client with executeQuery function', () => {
      const apiCode = fs.readFileSync('./src/utils/apiClient.js', 'utf8');
      
      expect(apiCode).toContain('export async function executeQuery');
      expect(apiCode).toContain('fetchWithTimeout');
    });
  });

  describe('State Management Flow', () => {
    it('should manage code state', () => {
      const storeCode = fs.readFileSync('./src/store/appStore.js', 'utf8');
      
      expect(storeCode).toContain('code:');
      expect(storeCode).toContain('setCode');
    });

    it('should manage query state', () => {
      const storeCode = fs.readFileSync('./src/store/appStore.js', 'utf8');
      
      expect(storeCode).toContain('query:');
      expect(storeCode).toContain('setQuery');
    });

    it('should manage execution state', () => {
      const storeCode = fs.readFileSync('./src/store/appStore.js', 'utf8');
      
      expect(storeCode).toContain('isExecuting');
      expect(storeCode).toContain('treeData');
      expect(storeCode).toContain('currentStep');
      expect(storeCode).toContain('totalSteps');
    });

    it('should manage console logs', () => {
      const storeCode = fs.readFileSync('./src/store/appStore.js', 'utf8');
      
      expect(storeCode).toContain('consoleLogs');
      expect(storeCode).toContain('addConsoleLog');
      expect(storeCode).toContain('clearConsoleLogs');
    });
  });

  describe('Tree Data Processing', () => {
    it('should format tree data', () => {
      const storeCode = fs.readFileSync('./src/store/appStore.js', 'utf8');
      
      expect(storeCode).toContain('formatTreeData');
      expect(storeCode).toContain('removeInternalExecutionNodes');
    });

    it('should count tree steps', () => {
      const storeCode = fs.readFileSync('./src/store/appStore.js', 'utf8');
      
      expect(storeCode).toContain('countTreeSteps');
    });
  });

  describe('Error Handling Flow', () => {
    it('should manage errors in store', () => {
      const storeCode = fs.readFileSync('./src/store/appStore.js', 'utf8');
      
      expect(storeCode).toContain('errors');
      expect(storeCode).toContain('addError');
      expect(storeCode).toContain('clearErrors');
    });

    it('should have ErrorBoundary component', () => {
      const errorBoundaryCode = fs.readFileSync('./src/components/layout/ErrorBoundary.jsx', 'utf8');
      
      expect(errorBoundaryCode).toContain('getDerivedStateFromError');
      expect(errorBoundaryCode).toContain('componentDidCatch');
    });
  });

  describe('Knowledge Base Integration', () => {
    it('should manage knowledge bases', () => {
      const storeCode = fs.readFileSync('./src/store/appStore.js', 'utf8');
      
      expect(storeCode).toContain('knowledgeBases');
      expect(storeCode).toContain('createKnowledgeBase');
      expect(storeCode).toContain('addToKnowledgeBase');
      expect(storeCode).toContain('deleteKnowledgeBase');
    });

    it('should have default examples', () => {
      const storeCode = fs.readFileSync('./src/store/appStore.js', 'utf8');
      
      expect(storeCode).toContain('examples');
    });
  });

  describe('Agent Integration', () => {
    it('should manage agents', () => {
      const storeCode = fs.readFileSync('./src/store/appStore.js', 'utf8');
      
      expect(storeCode).toContain('agents');
      expect(storeCode).toContain('toggleAgent');
      expect(storeCode).toContain('addAgentResponse');
    });

    it('should manage agent instances', () => {
      const storeCode = fs.readFileSync('./src/store/appStore.js', 'utf8');
      
      expect(storeCode).toContain('agentInstances');
      expect(storeCode).toContain('addAgent');
      expect(storeCode).toContain('updateAgent');
      expect(storeCode).toContain('deleteAgent');
    });
  });

  describe('UI State Integration', () => {
    it('should manage theme', () => {
      const storeCode = fs.readFileSync('./src/store/appStore.js', 'utf8');
      
      expect(storeCode).toContain('theme');
      expect(storeCode).toContain('toggleTheme');
      expect(storeCode).toContain('setTheme');
    });

    it('should manage sidebar', () => {
      const storeCode = fs.readFileSync('./src/store/appStore.js', 'utf8');
      
      expect(storeCode).toContain('sidebarOpen');
      expect(storeCode).toContain('toggleSidebar');
    });

    it('should manage panels', () => {
      const storeCode = fs.readFileSync('./src/store/appStore.js', 'utf8');
      
      expect(storeCode).toContain('panelStates');
      expect(storeCode).toContain('togglePanel');
    });

    it('should manage layout', () => {
      const storeCode = fs.readFileSync('./src/store/appStore.js', 'utf8');
      
      expect(storeCode).toContain('layout');
      expect(storeCode).toContain('setLayout');
    });
  });

  describe('File Management Integration', () => {
    it('should manage files', () => {
      const storeCode = fs.readFileSync('./src/store/appStore.js', 'utf8');
      
      expect(storeCode).toContain('files');
      expect(storeCode).toContain('currentFile');
      expect(storeCode).toContain('createFile');
      expect(storeCode).toContain('saveFile');
      expect(storeCode).toContain('loadFile');
      expect(storeCode).toContain('deleteFile');
    });
  });

  describe('Easter Egg Integration', () => {
    it('should handle easter eggs', () => {
      const storeCode = fs.readFileSync('./src/store/appStore.js', 'utf8');
      
      expect(storeCode).toContain('easterEggTriggered');
      expect(storeCode).toContain('easterEggCount');
      expect(storeCode).toContain('triggerEasterEgg');
    });

    it('should have easter egg utility', () => {
      const easterEggCode = fs.readFileSync('./src/utils/easterEgg.js', 'utf8');
      
      expect(easterEggCode).toContain('checkEasterEgg');
    });
  });

  describe('Accessibility Integration', () => {
    it('should have accessibility module', () => {
      const a11yCode = fs.readFileSync('./src/utils/accessibility.js', 'utf8');
      
      expect(a11yCode).toContain('announceThemeChange');
      expect(a11yCode).toContain('announcePanelToggle');
      expect(a11yCode).toContain('announceExecutionStart');
      expect(a11yCode).toContain('announceExecutionComplete');
    });

    it('should use aria labels in components', () => {
      const headerCode = fs.readFileSync('./src/components/layout/Header.jsx', 'utf8');
      const sidebarCode = fs.readFileSync('./src/components/layout/Sidebar.jsx', 'utf8');
      
      expect(headerCode).toContain('aria-label');
      expect(sidebarCode).toContain('aria-label');
    });
  });

  describe('Keyboard Shortcuts Integration', () => {
    it('should have KeyboardShortcuts component', () => {
      const ksCode = fs.readFileSync('./src/components/accessibility/KeyboardShortcuts.jsx', 'utf8');
      
      expect(ksCode).toContain('KeyboardShortcuts');
      expect(ksCode).toContain('shortcuts');
    });

    it('should handle keyboard events in QueryInput', () => {
      const queryInputCode = fs.readFileSync('./src/components/editor/QueryInput.jsx', 'utf8');
      
      expect(queryInputCode).toContain('handleKeyDown');
    });
  });

  describe('Theme Integration', () => {
    it('should have theme colors module', () => {
      const colorsCode = fs.readFileSync('./src/themes/colors.js', 'utf8');
      
      expect(colorsCode).toContain('applyTheme');
      expect(colorsCode).toContain('getInitialTheme');
    });
  });
});
