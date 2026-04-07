// @vitest-environment happy-dom
/**
 * Shared component mocks for Prolog-Tutor tests
 * This file provides consistent mocks for all component tests
 */

import React from 'react';
import { vi } from 'vitest';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div data-testid="motion-div" {...props}>{children}</div>,
    button: ({ children, ...props }) => <button data-testid="motion-button" {...props}>{children}</button>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    header: ({ children, ...props }) => <header {...props}>{children}</header>,
    aside: ({ children, ...props }) => <aside {...props}>{children}</aside>,
    nav: ({ children, ...props }) => <nav {...props}>{children}</nav>,
    main: ({ children, ...props }) => <main {...props}>{children}</main>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    ul: ({ children, ...props }) => <ul {...props}>{children}</ul>,
    li: ({ children, ...props }) => <li {...props}>{children}</li>,
    svg: ({ children, ...props }) => <svg {...props}>{children}</svg>,
    path: ({ children, ...props }) => <path {...props}>{children}</path>,
  },
  AnimatePresence: ({ children }) => <>{children}</>
}));

// Mock react-toastify
vi.mock('react-toastify', () => ({
  ToastContainer: () => <div data-testid="toast-container" />,
  toast: { 
    error: vi.fn(), 
    success: vi.fn(), 
    info: vi.fn(), 
    warning: vi.fn(),
    dismiss: vi.fn() 
  }
}));

// Mock @monaco-editor/react
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(({ value, onChange, language }) => (
    <div data-testid="monaco-editor" data-language={language}>
      <textarea 
        data-testid="monaco-textarea" 
        value={value || ''} 
        onChange={(e) => onChange && onChange(e.target.value)} 
      />
    </div>
  )),
  loader: { config: vi.fn() }
}));

// Mock react-d3-tree
vi.mock('react-d3-tree', () => ({
  default: vi.fn(({ data, renderCustomNodeElement }) => (
    <div data-testid="tree-visualization" data-nodes={data ? JSON.stringify(data) : null}>
      {data && <div data-testid="tree-data">{JSON.stringify(data)}</div>}
    </div>
  ))
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Terminal: () => <span data-testid="icon-terminal" />,
  Trash2: () => <span data-testid="icon-trash" />,
  Bot: () => <span data-testid="icon-bot" />,
  MessageSquare: () => <span data-testid="icon-message" />,
  Play: () => <span data-testid="icon-play" />,
  Pause: () => <span data-testid="icon-pause" />,
  SkipForward: () => <span data-testid="icon-skip-forward" />,
  RotateCcw: () => <span data-testid="icon-reset" />,
  Settings: () => <span data-testid="icon-settings" />,
  Zap: () => <span data-testid="icon-zap" />,
  Brain: () => <span data-testid="icon-brain" />,
  Clock: () => <span data-testid="icon-clock" />,
  BarChart3: () => <span data-testid="icon-chart" />,
  HelpCircle: () => <span data-testid="icon-help" />,
  ChevronRight: () => <span data-testid="icon-chevron-right" />,
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  Sparkles: () => <span data-testid="icon-sparkles" />,
  Target: () => <span data-testid="icon-target" />,
  Plus: () => <span data-testid="icon-plus" />,
  Edit2: () => <span data-testid="icon-edit" />,
  Search: () => <span data-testid="icon-search" />,
  BookOpen: () => <span data-testid="icon-book" />,
  FileText: () => <span data-testid="icon-file" />,
  Save: () => <span data-testid="icon-save" />,
  X: () => <span data-testid="icon-x" />,
  Folder: () => <span data-testid="icon-folder" />,
  File: () => <span data-testid="icon-file" />,
  Upload: () => <span data-testid="icon-upload" />,
  Download: () => <span data-testid="icon-download" />,
  Keyboard: () => <span data-testid="icon-keyboard" />,
  ArrowUp: () => <span data-testid="icon-arrow-up" />,
  ArrowDown: () => <span data-testid="icon-arrow-down" />,
}));

// Mock react-icons/fa
vi.mock('react-icons/fa', () => ({
  FaPlay: () => <span data-testid="icon-play" />,
  FaStop: () => <span data-testid="icon-stop" />,
  FaPause: () => <span data-testid="icon-pause" />,
  FaStepForward: () => <span data-testid="icon-step-forward" />,
  FaStepBackward: () => <span data-testid="icon-step-backward" />,
  FaFastForward: () => <span data-testid="icon-fast-forward" />,
  FaFastBackward: () => <span data-testid="icon-fast-backward" />,
  FaCode: () => <span data-testid="icon-code" />,
  FaTree: () => <span data-testid="icon-tree" />,
  FaTerminal: () => <span data-testid="icon-terminal" />,
  FaRobot: () => <span data-testid="icon-robot" />,
  FaBook: () => <span data-testid="icon-book" />,
  FaSun: () => <span data-testid="icon-sun" />,
  FaMoon: () => <span data-testid="icon-moon" />,
  FaBars: () => <span data-testid="icon-bars" />,
  FaTimes: () => <span data-testid="icon-times" />,
  FaChevronDown: () => <span data-testid="icon-chevron-down" />,
  FaChevronRight: () => <span data-testid="icon-chevron-right" />,
  FaChevronLeft: () => <span data-testid="icon-chevron-left" />,
  FaChevronUp: () => <span data-testid="icon-chevron-up" />,
  FaSave: () => <span data-testid="icon-save" />,
  FaTrash: () => <span data-testid="icon-trash" />,
  FaDownload: () => <span data-testid="icon-download" />,
  FaUpload: () => <span data-testid="icon-upload" />,
  FaInfoCircle: () => <span data-testid="icon-info" />,
  FaExclamationTriangle: () => <span data-testid="icon-warning" />,
  FaCheck: () => <span data-testid="icon-check" />,
  FaExpand: () => <span data-testid="icon-expand" />,
  FaCompress: () => <span data-testid="icon-compress" />,
  FaCopy: () => <span data-testid="icon-copy" />,
  FaQuestionCircle: () => <span data-testid="icon-question" />,
  FaLightbulb: () => <span data-testid="icon-lightbulb" />,
  FaCog: () => <span data-testid="icon-cog" />,
  FaGithub: () => <span data-testid="icon-github" />,
  FaStar: () => <span data-testid="icon-star" />,
  FaHistory: () => <span data-testid="icon-history" />,
  FaKeyboard: () => <span data-testid="icon-keyboard" />,
  FaBolt: () => <span data-testid="icon-bolt" />,
  FaSearch: () => <span data-testid="icon-search" />,
  FaMousePointer: () => <span data-testid="icon-mouse-pointer" />,
  FaHandPaper: () => <span data-testid="icon-hand" />,
  FaTachometerAlt: () => <span data-testid="icon-speed" />,
}));

// Create mock store factory
export const createMockStore = (overrides = {}) => ({
  // Theme & UI
  theme: 'light',
  sidebarOpen: true,
  panelStates: { knowledgeBase: false, agents: false, console: false },
  layout: { editor: 40, visualization: 60 },
  
  // Code & Execution
  code: '',
  query: '',
  queryInput: '',
  files: [],
  currentFile: null,
  unsavedChanges: false,
  
  // Execution State
  treeData: null,
  isExecuting: false,
  currentStep: 0,
  totalSteps: 0,
  executionSpeed: 1,
  executionHistory: [],
  
  // Knowledge Base
  knowledgeBases: [],
  examples: [
    { id: 'example-1', name: 'Test Example', description: 'Test description', difficulty: 'Easy', code: 'test.', query: 'test.' }
  ],
  currentKB: null,
  
  // Agents
  agentInstances: [],
  activeAgentId: null,
  
  // Easter Eggs
  easterEggTriggered: false,
  easterEggCount: 0,
  
  // System
  errors: [],
  consoleLogs: [],
  executionProgress: 0,
  backendHealth: { status: 'healthy' },
  
  // Actions
  toggleTheme: vi.fn(),
  setTheme: vi.fn(),
  toggleSidebar: vi.fn(),
  togglePanel: vi.fn(),
  setLayout: vi.fn(),
  setCode: vi.fn(),
  setQuery: vi.fn(),
  setQueryInput: vi.fn(),
  loadExample: vi.fn(),
  createFile: vi.fn(),
  saveFile: vi.fn(),
  loadFile: vi.fn(),
  deleteFile: vi.fn(),
  executeQuery: vi.fn(),
  cancelExecution: vi.fn(),
  setCurrentStep: vi.fn(),
  nextStep: vi.fn(),
  prevStep: vi.fn(),
  setExecutionSpeed: vi.fn(),
  addKnowledgeBase: vi.fn(),
  updateKnowledgeBase: vi.fn(),
  deleteKnowledgeBase: vi.fn(),
  setActiveKnowledgeBase: vi.fn(),
  addAgent: vi.fn(),
  updateAgent: vi.fn(),
  deleteAgent: vi.fn(),
  setActiveAgent: vi.fn(),
  triggerEasterEgg: vi.fn(),
  addConsoleLog: vi.fn(),
  clearConsoleLogs: vi.fn(),
  addError: vi.fn(),
  clearErrors: vi.fn(),
  setExecutionProgress: vi.fn(),
  checkBackendHealth: vi.fn(),
  resetExecution: vi.fn(),
  resetAll: vi.fn(),
  
  ...overrides
});

// Mock appStore
vi.mock('../src/store/appStore', () => ({
  default: vi.fn(() => createMockStore())
}));

// Mock apiClient
vi.mock('../src/utils/apiClient', () => ({
  executeQuery: vi.fn(),
  getHealth: vi.fn(),
  getStats: vi.fn(),
  formatExecutionTime: vi.fn((ms) => `${ms}ms`),
  formatCacheInfo: vi.fn((cached, time) => cached ? `cached (${time}ms)` : `${time}ms`),
  getApiBase: vi.fn(() => 'http://localhost:3000/api')
}));

// Mock easterEgg
vi.mock('../src/utils/easterEgg', () => ({
  checkEasterEgg: vi.fn(() => ({ isEasterEgg: false })),
  createConfettiEffect: vi.fn()
}));

// Mock accessibility
vi.mock('../src/utils/accessibility', () => ({
  default: {
    announceThemeChange: vi.fn(),
    announcePanelToggle: vi.fn(),
    announceExecutionStart: vi.fn(),
    announceExecutionComplete: vi.fn(),
    announceExecutionError: vi.fn(),
    announceBackendStatus: vi.fn(),
    announceEasterEgg: vi.fn(),
    init: vi.fn(),
    focusElement: vi.fn()
  }
}));

// Mock themes/colors
vi.mock('../src/themes/colors', () => ({
  applyTheme: vi.fn(),
  getInitialTheme: () => 'light',
  saveTheme: vi.fn()
}));

export default {};