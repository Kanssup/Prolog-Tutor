import React from 'react';
import { 
  FaBook, 
  FaStar,
  FaChevronRight,
  FaChevronLeft
} from 'react-icons/fa';
import useAppStore from '../../store/appStore';

const Sidebar = () => {
  const {
    sidebarOpen,
    toggleSidebar,
    examples,
    loadExample,
    easterEggCount,
  } = useAppStore();

  if (!sidebarOpen) {
    return (
      <button
        onClick={toggleSidebar}
        className="fixed left-0 top-1/2 transform -translate-y-1/2 z-[60] p-2 bg-primary-500 text-white rounded-r-lg shadow-lg hover:bg-primary-600 transition-colors"
        aria-label="Abrir sidebar"
      >
        <FaChevronRight className="w-5 h-5" />
      </button>
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 z-[60] flex flex-col shadow-lg">
      
      {/* Sidebar header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <h2 id="sidebar-title" className="text-lg font-semibold text-neutral-900 dark:text-white">
          Navegación
        </h2>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          aria-label="Cerrar sidebar"
          aria-describedby="sidebar-title"
        >
          <FaChevronLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </button>
      </div>

      {/* Sidebar content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Examples Library */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
            Ejemplos
          </h3>
          <div className="space-y-2">
            {examples.slice(0, 3).map((example) => (
              <button
                key={example.id}
                onClick={() => loadExample(example)}
                className="w-full text-left p-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <FaBook className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-neutral-900 dark:text-white truncate">
                      {example.name}
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {example.description}
                    </p>
                    <div className="flex items-center mt-1">
                      <span className="text-xs px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded">
                        {example.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Easter Egg Status */}
        {easterEggCount > 0 && (
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
              Logros
            </h3>
            <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <FaStar className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    Easter Eggs Descubiertos
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {easterEggCount} encontrado{easterEggCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Sidebar footer */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Prolog Tutor v1.0.0
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            Inspirado en Python Tutor
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;