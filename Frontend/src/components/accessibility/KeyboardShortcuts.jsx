import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, ArrowUp, ArrowDown } from 'lucide-react';

const KeyboardShortcuts = () => {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    {
      category: 'Ejecución',
      shortcuts: [
        { keys: ['Ctrl', 'Enter'], description: 'Ejecutar consulta actual' },
        { keys: ['Escape'], description: 'Cancelar ejecución' },
        { keys: ['Alt', '1'], description: 'Enfocar editor de código' },
        { keys: ['Alt', '2'], description: 'Enfocar entrada de consulta' },
      ]
    },
    {
      category: 'Navegación',
      shortcuts: [
        { keys: ['Alt', '3'], description: 'Alternar sidebar' },
        { keys: ['Alt', '4'], description: 'Alternar tema claro/oscuro' },
        { keys: ['Tab'], description: 'Navegar entre elementos' },
        { keys: ['Shift', 'Tab'], description: 'Navegar hacia atrás' },
      ]
    },
    {
      category: 'Editor',
      shortcuts: [
        { keys: ['Ctrl', 'S'], description: 'Guardar código' },
        { keys: ['Ctrl', 'Z'], description: 'Deshacer' },
        { keys: ['Ctrl', 'Y'], description: 'Rehacer' },
        { keys: ['Ctrl', 'F'], description: 'Buscar en código' },
      ]
    },
    {
      category: 'Consola',
      shortcuts: [
        { keys: ['↑', '↓'], description: 'Navegar historial de comandos' },
        { keys: ['Ctrl', 'L'], description: 'Limpiar consola' },
        { keys: ['Ctrl', 'C'], description: 'Copiar selección' },
      ]
    }
  ];

  const renderKey = (key) => {
    const keyIcons = {
      'Ctrl': <span className="text-xs font-bold">Ctrl</span>,
      'Alt': <span className="text-xs font-bold">Alt</span>,
      'Shift': <span className="text-xs font-bold">Shift</span>,
      '↑': <ArrowUp className="w-3 h-3" />,
      '↓': <ArrowDown className="w-3 h-3" />,
      'Escape': <span className="text-xs font-bold">Esc</span>,
      'Enter': <span className="text-xs font-bold">↵</span>,
    };

    if (keyIcons[key]) {
      return (
        <span className="flex items-center justify-center w-6 h-6">
          {keyIcons[key]}
        </span>
      );
    }

    return <span className="text-xs font-bold">{key}</span>;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg z-40 transition-colors"
        aria-label="Mostrar atajos de teclado"
      >
        <Keyboard className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="keyboard-shortcuts-title"
              aria-modal="true"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Keyboard className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    <h2 id="keyboard-shortcuts-title" className="text-xl font-bold text-gray-900 dark:text-white">
                      Atajos de Teclado
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="Cerrar diálogo"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Atajos de teclado para mejorar la accesibilidad y productividad
                </p>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {shortcuts.map((category) => (
                    <div key={category.category} className="space-y-3">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                        {category.category}
                      </h3>
                      <div className="space-y-2">
                        {category.shortcuts.map((shortcut, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex items-center space-x-2">
                              {shortcut.keys.map((key, keyIndex) => (
                                <React.Fragment key={keyIndex}>
                                  <kbd className="inline-flex items-center justify-center min-w-6 h-6 px-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {renderKey(key)}
                                  </kbd>
                                  {keyIndex < shortcut.keys.length - 1 && (
                                    <span className="text-gray-400 dark:text-gray-500">+</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {shortcut.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-600 dark:text-gray-400">
                    <p>Presiona <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> para cerrar</p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default KeyboardShortcuts;