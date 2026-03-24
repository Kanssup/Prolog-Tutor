import React, { useState, useEffect } from 'react';
import { 
  FaPlay, 
  FaStop, 
  FaHistory, 
  FaLightbulb,
  FaKeyboard,
  FaBolt
} from 'react-icons/fa';
import useAppStore from '../../store/appStore';
import { checkEasterEgg } from '../../utils/easterEgg';

const QueryInput = () => {
  const {
    query,
    setQuery,
    queryInput,
    setQueryInput,
    code,
    isExecuting,
    executeQuery,
    cancelExecution,
    executionHistory,
    easterEggTriggered,
  } = useAppStore();

  const [showHistory, setShowHistory] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  // Common Prolog queries for hints
  const commonQueries = [
    { query: 'member(X, [1,2,3]).', description: 'Buscar elemento en lista' },
    { query: 'append([1,2], [3,4], X).', description: 'Concatenar listas' },
    { query: 'length([a,b,c], N).', description: 'Longitud de lista' },
    { query: 'reverse([1,2,3], X).', description: 'Invertir lista' },
    { query: 'sort([3,1,2], X).', description: 'Ordenar lista' },
    { query: 'findall(X, member(X, [1,2,3]), Result).', description: 'Encontrar todas las soluciones' },
    { query: 'bagof(X, member(X, [1,2,3]), Result).', description: 'Agrupar soluciones' },
    { query: 'setof(X, member(X, [3,1,2,1]), Result).', description: 'Conjunto ordenado de soluciones' },
  ];

  // Check for Easter egg as user types
  useEffect(() => {
    const easterEgg = checkEasterEgg(code, query);
    if (easterEgg.isEasterEgg && !easterEggTriggered) {
      // Easter egg detected but not triggered yet
      // We could show a subtle hint here
    }
  }, [query, code, easterEggTriggered]);

  const handleExecute = () => {
    if (isExecuting) {
      cancelExecution();
      return;
    }

    if (query.trim()) {
      executeQuery();
    }
  };

  const handleKeyDown = (e) => {
    // Ctrl+Enter is handled at App level
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleExecute();
    }
    
    // Escape to clear or cancel
    if (e.key === 'Escape') {
      if (isExecuting) {
        cancelExecution();
      } else {
        setQuery('');
      }
    }
    
    // Arrow up/down for history
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      // History navigation would be implemented here
    }
  };

  const handleQuerySelect = (selectedQuery) => {
    setQuery(selectedQuery);
    setShowHints(false);
    setShowHistory(false);
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className="relative">
      <div className={`rounded-lg border transition-all duration-200 ${
        inputFocused 
          ? 'border-primary-500 ring-2 ring-primary-500/20' 
          : 'border-neutral-200 dark:border-neutral-800'
      } bg-white dark:bg-neutral-900`}>
        
        {/* Input Header */}
        <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Consulta Prolog
              </span>
            </div>
            
            {/* Easter egg indicator */}
            {checkEasterEgg(code, query).isEasterEgg && (
              <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full flex items-center space-x-1">
                <FaBolt className="w-3 h-3" />
                <span>¡Easter Egg Detectado!</span>
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowHints(!showHints)}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="Sugerencias de consultas"
            >
              <FaLightbulb className={`w-4 h-4 ${
                showHints ? 'text-yellow-500' : 'text-neutral-500 dark:text-neutral-400'
              }`} />
            </button>
            
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="Historial de consultas"
            >
              <FaHistory className={`w-4 h-4 ${
                showHistory ? 'text-primary-500' : 'text-neutral-500 dark:text-neutral-400'
              }`} />
            </button>
            
            <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700" />
            
            <button
              onClick={handleClear}
              disabled={!query.trim()}
              className="px-3 py-1 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Main Input Area */}
        <div className="p-4">
          <div className="relative">
            <div className="absolute left-3 top-3 text-neutral-400 dark:text-neutral-500 font-mono text-lg">
              ?-
            </div>
            
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Ingresa tu consulta Prolog (ej: padre(juan, X))"
              className="w-full pl-10 pr-24 py-3 font-mono text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
              rows="2"
              disabled={isExecuting}
            />
            
            {/* Execute Button */}
            <div className="absolute right-3 top-3">
              <button
                onClick={handleExecute}
                disabled={!query.trim() || isExecuting}
                className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-all ${
                  isExecuting
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : checkEasterEgg(code, query).isEasterEgg
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                    : 'bg-primary-500 hover:bg-primary-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isExecuting ? (
                  <>
                    <FaStop className="w-4 h-4" />
                    <span>Cancelar</span>
                  </>
                ) : (
                  <>
                    <FaPlay className="w-4 h-4" />
                    <span>Ejecutar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <FaKeyboard className="w-3 h-3" />
                <span>Atajos:</span>
              </div>
              <kbd className="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 rounded">
                Ctrl+Enter
              </kbd>
              <span>para ejecutar</span>
              <kbd className="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 rounded">
                Esc
              </kbd>
              <span>para {isExecuting ? 'cancelar' : 'limpiar'}</span>
            </div>
            
            <div className="text-right">
              {query.length > 0 && (
                <span>
                  {query.length} caracteres
                  {query.length > 200 && (
                    <span className="text-yellow-600 dark:text-yellow-400 ml-2">
                      (Consulta larga)
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Optional stdin-like input for interactive predicates */}
          <div className="mt-3">
            <label
              htmlFor="query-input-stream"
              className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1"
            >
              Entrada para read/get0 (opcional, una entrada por linea)
            </label>
            <textarea
              id="query-input-stream"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder={"Ejemplo:\n'Cancion favorita'.\n'autor favorito'."}
              className="w-full px-3 py-2 font-mono text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-y"
              rows="3"
              disabled={isExecuting}
            />
          </div>
        </div>
      </div>

      {/* Hints Dropdown */}
      {showHints && (
        <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 max-h-64 overflow-y-auto">
          <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="font-medium text-neutral-900 dark:text-white">
              Consultas Comunes
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Haz clic para usar
            </p>
          </div>
          <div className="py-2">
            {commonQueries.map((item, index) => (
              <button
                key={index}
                onClick={() => handleQuerySelect(item.query)}
                className="w-full text-left px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-b border-neutral-100 dark:border-neutral-700 last:border-0"
              >
                <code className="font-mono text-sm text-primary-600 dark:text-primary-400 block">
                  {item.query}
                </code>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* History Dropdown */}
      {showHistory && executionHistory.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 max-h-64 overflow-y-auto">
          <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="font-medium text-neutral-900 dark:text-white">
              Historial de Consultas
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Últimas {executionHistory.length} consultas
            </p>
          </div>
          <div className="py-2">
            {executionHistory.map((item, index) => (
              <button
                key={index}
                onClick={() => handleQuerySelect(item.query)}
                className="w-full text-left px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-b border-neutral-100 dark:border-neutral-700 last:border-0"
              >
                <div className="flex items-start justify-between">
                  <code className="font-mono text-sm text-neutral-900 dark:text-white flex-1 truncate">
                    {item.query}
                  </code>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap ml-2">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {item.result && (
                  <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {item.result.success ? '✅ Éxito' : '❌ Fallo'}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Easter Egg Preview */}
      {checkEasterEgg(code, query).isEasterEgg && !easterEggTriggered && (
        <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <FaBolt className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-purple-900 dark:text-purple-100">
                ¡Consulta especial detectada!
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Ejecuta esta consulta para descubrir un Easter egg secreto.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryInput;