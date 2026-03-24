import React, { useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from 'framer-motion';

// Layout Components
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import SplitPaneLayout from './components/layout/SplitPaneLayout';
import ErrorBoundary from './components/layout/ErrorBoundary';

// Editor Components
import CodeEditor from './components/editor/CodeEditor';
import QueryInput from './components/editor/QueryInput';

// Visualization Components
import TreeVisualization from './components/visualization/TreeVisualization';
import ExecutionControls from './components/visualization/ExecutionControls';

// Panel Components
import ConsolePanel from './components/panels/ConsolePanel';

// Store and Theme
import useAppStore from './store/appStore';
import { applyTheme, getInitialTheme } from './themes/colors';

// Easter Egg
import { checkEasterEgg, createConfettiEffect } from './utils/easterEgg';

// Accessibility
import KeyboardShortcuts from './components/accessibility/KeyboardShortcuts';

function App() {
  const {
    theme,
    sidebarOpen,
    easterEggTriggered,
    checkBackendHealth,
    backendHealth,
    errors,
    clearErrors,
  } = useAppStore();

  // Initialize theme and accessibility
  useEffect(() => {
    const initialTheme = getInitialTheme();
    applyTheme(initialTheme);
    
    // Initialize accessibility features
    // Note: accessibility features are initialized through the store
  }, []);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
    
    // Periodic health check every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  // Handle backend health changes
  useEffect(() => {
    if (backendHealth) {
      if (backendHealth.status === 'unhealthy') {
        toast.error('Backend no disponible. Verifica que el servidor esté ejecutándose.', {
          autoClose: false,
        });
      }
    }
  }, [backendHealth]);

  // Handle errors
  useEffect(() => {
    if (errors.length > 0) {
      const latestError = errors[0];
      toast.error(latestError.message, {
        onClose: clearErrors,
      });
    }
  }, [errors, clearErrors]);

  // Easter egg effects
  useEffect(() => {
    if (easterEggTriggered) {
      // Create confetti effect
      const container = document.getElementById('app-container');
      if (container) {
        createConfettiEffect(container, 7000);
      }
      
      // Show special notification
      toast.success('🎉 ¡Easter Egg Activado!', {
        autoClose: 5000,
        theme: 'colored',
        style: {
          background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
        },
      });
    }
  }, [easterEggTriggered]);

  // Keyboard shortcuts and accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Enter to execute query
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const { code, query, isExecuting, executeQuery } = useAppStore.getState();
        
        // Check for Easter egg
        const easterEgg = checkEasterEgg(code, query);
        if (easterEgg.isEasterEgg) {
          useAppStore.getState().triggerEasterEgg(easterEgg);
          return;
        }
        
        if (code.trim() && query.trim() && !isExecuting) {
          executeQuery();
        }
      }
      
      // Escape to cancel execution
      if (e.key === 'Escape') {
        const { isExecuting, cancelExecution } = useAppStore.getState();
        if (isExecuting) {
          cancelExecution();
          toast.info('Ejecución cancelada');
        }
      }
      
      // Alt+1 to focus editor
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        const editor = document.querySelector('.monaco-editor textarea');
        if (editor) editor.focus();
      }
      
      // Alt+2 to focus query input
      if (e.altKey && e.key === '2') {
        e.preventDefault();
        const queryInput = document.querySelector('input[placeholder*="consulta"]');
        if (queryInput) queryInput.focus();
      }
      
      // Alt+3 to toggle sidebar
      if (e.altKey && e.key === '3') {
        e.preventDefault();
        useAppStore.getState().toggleSidebar();
      }
      
      // Alt+4 to toggle theme
      if (e.altKey && e.key === '4') {
        e.preventDefault();
        useAppStore.getState().toggleTheme();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div 
      id="app-container"
      className={`min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-200 ${
        theme === 'dark' ? 'dark' : ''
      }`}
    >
      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
      />

      {/* Header */}
      <Header />

      {/* Main Layout */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : ''
        }`}>
          <div className="container mx-auto p-4">
            
            {/* Split Pane Layout */}
            <SplitPaneLayout>
              {/* Left Pane: Editor */}
              <div className="h-full min-h-0 flex flex-col">
                <div className="flex-1 min-h-[260px] overflow-hidden">
                  <CodeEditor />
                </div>
                <div className="mt-2 shrink-0">
                  <QueryInput />
                </div>
                <div className="mt-2 min-h-[220px] h-[38%] overflow-hidden">
                  <ErrorBoundary>
                    <ConsolePanel />
                  </ErrorBoundary>
                </div>
              </div>

              {/* Right Pane: Visualization */}
              <div className="h-full min-h-0 flex flex-col">
                <div className="flex-1 min-h-[280px] overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                  <ErrorBoundary>
                    <TreeVisualization />
                  </ErrorBoundary>
                </div>
                <div className="mt-2 shrink-0">
                  <ErrorBoundary>
                    <ExecutionControls />
                  </ErrorBoundary>
                </div>
              </div>
            </SplitPaneLayout>

          </div>
        </main>
      </div>

      {/* Easter Egg Overlay */}
      <AnimatePresence>
        {easterEggTriggered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Accessibility */}
      <KeyboardShortcuts />
    </div>
  );
}

export default App;