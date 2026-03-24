import React, { useMemo } from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import useAppStore from '../../store/appStore';

const ConsolePanel = () => {
  const { consoleLogs, clearConsoleLogs, isExecuting, executionProgress } = useAppStore();

  const [showTraceLogs, setShowTraceLogs] = React.useState(false);

  const visibleLogs = useMemo(() => {
    const logs = Array.isArray(consoleLogs)
      ? consoleLogs.filter((log) => log && typeof log === 'object')
      : [];

    const filtered = showTraceLogs
      ? logs
      : logs.filter((log) => log.source !== 'trace');

    return [...filtered].reverse();
  }, [consoleLogs, showTraceLogs]);

  const renderLogContent = (log) => {
    const parts = [];

    if (typeof log.message === 'string' && log.message.trim()) {
      parts.push(log.message.trim());
    }

    if (typeof log.data === 'string' && log.data.trim()) {
      parts.push(log.data.trim());
    }

    if (log.data && typeof log.data !== 'string') {
      try {
        parts.push(JSON.stringify(log.data, null, 2));
      } catch {
        parts.push(String(log.data));
      }
    }

    if (parts.length === 0) {
      return '(sin contenido)';
    }

    return parts.join('\n\n');
  };

  return (
    <div className="h-full min-h-0 flex flex-col rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
      <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Salida de Consola</h2>
          {isExecuting && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              Ejecutando... {executionProgress}%
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <label className="inline-flex items-center space-x-2 text-xs text-neutral-600 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={showTraceLogs}
              onChange={(e) => setShowTraceLogs(e.target.checked)}
              className="rounded border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
            />
            <span>Mostrar traza completa</span>
          </label>

          <button
            onClick={clearConsoleLogs}
            className="p-1.5 rounded text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title="Limpiar consola"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 bg-neutral-50 dark:bg-neutral-950/40">
        {visibleLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
            Sin salida todavia.
          </div>
        ) : (
          <div className="space-y-2">
            {visibleLogs.map((log, index) => (
              <pre
                key={log.id || `${log.timestamp || 'log'}-${index}`}
                className="p-2 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap break-words"
              >
                {renderLogContent(log)}
              </pre>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsolePanel;
