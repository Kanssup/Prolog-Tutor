import React from 'react';
import { 
  FaCode, 
  FaPlay, 
  FaMoon, 
  FaSun, 
  FaBars, 
  FaCog,
  FaQuestionCircle,
  FaGithub
} from 'react-icons/fa';
import useAppStore from '../../store/appStore';

const Header = () => {
  const {
    theme,
    toggleTheme,
    sidebarOpen,
    toggleSidebar,
    isExecuting,
    executeQuery,
    code,
    query,
  } = useAppStore();

  const handleExecute = () => {
    if (code.trim() && query.trim() && !isExecuting) {
      executeQuery();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Left section: Logo and mobile menu */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <FaBars className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-500 rounded-lg">
              <FaCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
                Prolog Tutor
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Visualización interactiva de ejecución Prolog
              </p>
            </div>
          </div>
        </div>

        {/* Center section: Quick actions (desktop only) */}
        <div className="hidden md:flex items-center space-x-2">
          <button
            onClick={handleExecute}
            disabled={!code.trim() || !query.trim() || isExecuting}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FaPlay className="w-4 h-4" />
            <span>{isExecuting ? 'Ejecutando...' : 'Ejecutar Consulta'}</span>
          </button>
          
          <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />
          
          <button
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Documentación"
          >
            <FaQuestionCircle className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>

        {/* Right section: Theme toggle and user menu */}
        <div className="flex items-center space-x-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="GitHub repository"
          >
            <FaGithub className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </a>
          
          <button
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Configuración"
          >
            <FaCog className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}
            aria-live="polite"
          >
            {theme === 'light' ? (
              <FaMoon className="w-5 h-5 text-neutral-600" />
            ) : (
              <FaSun className="w-5 h-5 text-yellow-400" />
            )}
          </button>
          
          {/* Mobile execute button */}
          <button
            onClick={handleExecute}
            disabled={!code.trim() || !query.trim() || isExecuting}
            className="md:hidden p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Ejecutar consulta"
            aria-live="polite"
          >
            <FaPlay className="w-5 h-5" />
          </button>
        </div>
      </div>

    </header>
  );
};

export default Header;