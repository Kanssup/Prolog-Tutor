/**
 * CodeEditor Component Tests for Prolog-Tutor
 * Using source code verification approach
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';

describe('CodeEditor Component', () => {
  it('should have proper component structure', () => {
    const componentCode = fs.readFileSync('./src/components/editor/CodeEditor.jsx', 'utf8');
    
    expect(componentCode).toContain('import React');
    expect(componentCode).toContain('import useAppStore');
    expect(componentCode).toContain('import Editor from');
    expect(componentCode).toContain('export default CodeEditor');
  });

  it('should use Monaco editor', () => {
    const componentCode = fs.readFileSync('./src/components/editor/CodeEditor.jsx', 'utf8');
    
    expect(componentCode).toContain('@monaco-editor/react');
    expect(componentCode).toContain('handleEditorDidMount');
  });

  it('should use required store hooks', () => {
    const componentCode = fs.readFileSync('./src/components/editor/CodeEditor.jsx', 'utf8');
    
    expect(componentCode).toContain('code');
    expect(componentCode).toContain('setCode');
    expect(componentCode).toContain('theme');
    expect(componentCode).toContain('files');
    expect(componentCode).toContain('currentFile');
  });

  it('should have file management functions', () => {
    const componentCode = fs.readFileSync('./src/components/editor/CodeEditor.jsx', 'utf8');
    
    expect(componentCode).toContain('saveFile');
    expect(componentCode).toContain('createFile');
    expect(componentCode).toContain('loadFile');
    expect(componentCode).toContain('deleteFile');
  });

  it('should have Prolog language configuration', () => {
    const componentCode = fs.readFileSync('./src/components/editor/CodeEditor.jsx', 'utf8');
    
    expect(componentCode).toContain('prologLanguageConfig');
    expect(componentCode).toContain('lineComment');
    expect(componentCode).toContain('blockComment');
  });

  it('should have Prolog theme configuration', () => {
    const componentCode = fs.readFileSync('./src/components/editor/CodeEditor.jsx', 'utf8');
    
    expect(componentCode).toContain('prologTheme');
    expect(componentCode).toContain('keyword');
    expect(componentCode).toContain('variable');
    expect(componentCode).toContain('predicate');
  });

  it('should have fullscreen functionality', () => {
    const componentCode = fs.readFileSync('./src/components/editor/CodeEditor.jsx', 'utf8');
    
    expect(componentCode).toContain('isFullscreen');
    expect(componentCode).toContain('setIsFullscreen');
    expect(componentCode).toContain('FaExpand');
    expect(componentCode).toContain('FaCompress');
  });

  it('should handle code changes', () => {
    const componentCode = fs.readFileSync('./src/components/editor/CodeEditor.jsx', 'utf8');
    
    expect(componentCode).toContain('handleEditorChange');
    expect(componentCode).toContain('onChange');
  });

  it('should have copy functionality', () => {
    const componentCode = fs.readFileSync('./src/components/editor/CodeEditor.jsx', 'utf8');
    
    expect(componentCode).toContain('FaCopy');
    expect(componentCode).toContain('navigator.clipboard');
  });

  it('should have save feedback', () => {
    const componentCode = fs.readFileSync('./src/components/editor/CodeEditor.jsx', 'utf8');
    
    expect(componentCode).toContain('saveFeedback');
    expect(componentCode).toContain('showSaveFeedback');
  });
});

describe('TreeVisualization Component', () => {
  it('should have proper component structure', () => {
    const componentCode = fs.readFileSync('./src/components/visualization/TreeVisualization.jsx', 'utf8');
    
    expect(componentCode).toContain('import React');
    expect(componentCode).toContain('import useAppStore');
    expect(componentCode).toContain('import Tree from');
    expect(componentCode).toContain('export default TreeVisualization');
  });

  it('should use react-d3-tree', () => {
    const componentCode = fs.readFileSync('./src/components/visualization/TreeVisualization.jsx', 'utf8');
    
    expect(componentCode).toContain('react-d3-tree');
  });

  it('should use required store hooks', () => {
    const componentCode = fs.readFileSync('./src/components/visualization/TreeVisualization.jsx', 'utf8');
    
    expect(componentCode).toContain('treeData');
    expect(componentCode).toContain('currentStep');
    expect(componentCode).toContain('theme');
  });

  it('should have zoom functionality', () => {
    const componentCode = fs.readFileSync('./src/components/visualization/TreeVisualization.jsx', 'utf8');
    
    expect(componentCode).toContain('zoom');
    expect(componentCode).toContain('setZoom');
  });

  it('should have pan/drag functionality', () => {
    const componentCode = fs.readFileSync('./src/components/visualization/TreeVisualization.jsx', 'utf8');
    
    expect(componentCode).toContain('isDragging');
    expect(componentCode).toContain('setIsDragging');
    expect(componentCode).toContain('dragStart');
  });

  it('should have search functionality', () => {
    const componentCode = fs.readFileSync('./src/components/visualization/TreeVisualization.jsx', 'utf8');
    
    expect(componentCode).toContain('searchTerm');
    expect(componentCode).toContain('setSearchTerm');
    expect(componentCode).toContain('highlightedNodes');
  });

  it('should have fullscreen functionality', () => {
    const componentCode = fs.readFileSync('./src/components/visualization/TreeVisualization.jsx', 'utf8');
    
    expect(componentCode).toContain('isFullscreen');
    expect(componentCode).toContain('setIsFullscreen');
    expect(componentCode).toContain('FaExpand');
  });

  it('should handle node selection', () => {
    const componentCode = fs.readFileSync('./src/components/visualization/TreeVisualization.jsx', 'utf8');
    
    expect(componentCode).toContain('selectedNode');
    expect(componentCode).toContain('setSelectedNode');
  });

  it('should have view modes', () => {
    const componentCode = fs.readFileSync('./src/components/visualization/TreeVisualization.jsx', 'utf8');
    
    expect(componentCode).toContain('viewMode');
    expect(componentCode).toContain('interactive');
    expect(componentCode).toContain('presentation');
  });

  it('should have export functionality', () => {
    const componentCode = fs.readFileSync('./src/components/visualization/TreeVisualization.jsx', 'utf8');
    
    expect(componentCode).toContain('FaDownload');
    expect(componentCode).toContain('handleExport');
  });
});

describe('SplitPaneLayout Component', () => {
  it('should have proper component structure', () => {
    const componentCode = fs.readFileSync('./src/components/layout/SplitPaneLayout.jsx', 'utf8');
    
    expect(componentCode).toContain('import React');
    expect(componentCode).toContain('import useAppStore');
    expect(componentCode).toContain('export default SplitPaneLayout');
  });

  it('should use store for layout', () => {
    const componentCode = fs.readFileSync('./src/components/layout/SplitPaneLayout.jsx', 'utf8');
    
    expect(componentCode).toContain('layout');
    expect(componentCode).toContain('setLayout');
  });

  it('should have drag functionality', () => {
    const componentCode = fs.readFileSync('./src/components/layout/SplitPaneLayout.jsx', 'utf8');
    
    expect(componentCode).toContain('handleDragStart');
    expect(componentCode).toContain('isDragging');
  });
});

describe('AgentPanel Component', () => {
  it('should have proper component structure', () => {
    const componentCode = fs.readFileSync('./src/components/panels/AgentPanel.jsx', 'utf8');
    
    expect(componentCode).toContain('import React');
    expect(componentCode).toContain('import useAppStore');
    expect(componentCode).toContain('export default AgentPanel');
  });

  it('should use required store hooks', () => {
    const componentCode = fs.readFileSync('./src/components/panels/AgentPanel.jsx', 'utf8');
    
    expect(componentCode).toContain('agentInstances');
    expect(componentCode).toContain('addAgent');
    expect(componentCode).toContain('updateAgent');
    expect(componentCode).toContain('deleteAgent');
    expect(componentCode).toContain('setActiveAgent');
    expect(componentCode).toContain('activeAgentId');
  });

  it('should have search functionality', () => {
    const componentCode = fs.readFileSync('./src/components/panels/AgentPanel.jsx', 'utf8');
    
    expect(componentCode).toContain('searchTerm');
    expect(componentCode).toContain('setSearchTerm');
  });

  it('should have agent creation/editing', () => {
    const componentCode = fs.readFileSync('./src/components/panels/AgentPanel.jsx', 'utf8');
    
    expect(componentCode).toContain('isAdding');
    expect(componentCode).toContain('editingId');
    expect(componentCode).toContain('newName');
    expect(componentCode).toContain('newGoal');
  });

  it('should have strategy selection', () => {
    const componentCode = fs.readFileSync('./src/components/panels/AgentPanel.jsx', 'utf8');
    
    expect(componentCode).toContain('selectedStrategy');
    expect(componentCode).toContain('depth-first');
    expect(componentCode).toContain('breadth-first');
  });

  it('should have execution controls', () => {
    const componentCode = fs.readFileSync('./src/components/panels/AgentPanel.jsx', 'utf8');
    
    expect(componentCode).toContain('executeQuery');
    expect(componentCode).toContain('isExecuting');
  });
});

describe('KnowledgeBasePanel Component', () => {
  it('should have proper component structure', () => {
    const componentCode = fs.readFileSync('./src/components/panels/KnowledgeBasePanel.jsx', 'utf8');
    
    expect(componentCode).toContain('import React');
    expect(componentCode).toContain('import useAppStore');
    expect(componentCode).toContain('export default KnowledgeBasePanel');
  });

  it('should use required store hooks', () => {
    const componentCode = fs.readFileSync('./src/components/panels/KnowledgeBasePanel.jsx', 'utf8');
    
    expect(componentCode).toContain('knowledgeBases');
    expect(componentCode).toContain('addKnowledgeBase');
    expect(componentCode).toContain('updateKnowledgeBase');
    expect(componentCode).toContain('deleteKnowledgeBase');
    expect(componentCode).toContain('setActiveKnowledgeBase');
  });

  it('should have search functionality', () => {
    const componentCode = fs.readFileSync('./src/components/panels/KnowledgeBasePanel.jsx', 'utf8');
    
    expect(componentCode).toContain('searchTerm');
    expect(componentCode).toContain('setSearchTerm');
  });

  it('should have file management', () => {
    const componentCode = fs.readFileSync('./src/components/panels/KnowledgeBasePanel.jsx', 'utf8');
    
    expect(componentCode).toContain('File');
    expect(componentCode).toContain('Folder');
  });

  it('should handle add/update/delete operations', () => {
    const componentCode = fs.readFileSync('./src/components/panels/KnowledgeBasePanel.jsx', 'utf8');
    
    expect(componentCode).toContain('handleAddKnowledgeBase');
    expect(componentCode).toContain('handleUpdateKnowledgeBase');
    expect(componentCode).toContain('handleDeleteKnowledgeBase');
  });
});
