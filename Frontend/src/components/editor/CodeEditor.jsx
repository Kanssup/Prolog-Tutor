import React, { useState, useEffect, useRef } from 'react';
import { FaCopy, FaSave, FaFolderOpen, FaExpand, FaCompress, FaTrash } from 'react-icons/fa';
import Editor from '@monaco-editor/react';
import useAppStore from '../../store/appStore';
import { getPrologLanguageConfig, getPrologTokenizer, getPrologLanguageDefinition } from '../../config/monaco/prologLanguage';
import { getPrologTheme } from '../../config/monaco/prologTheme';
import { useFeedbackTimeout } from '../../hooks/useFeedbackTimeout';

const CodeEditor = () => {
  const { code, setCode, theme, files, currentFile, saveFile, createFile, loadFile, deleteFile } = useAppStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');
  const editorRef = useRef(null);
  
  // Use extracted hook for feedback timeout
  const { showFeedback } = useFeedbackTimeout(setSaveFeedback);
  
  // Use extracted config for Prolog language
  const prologLanguageConfig = getPrologLanguageConfig(theme);
  const prologTheme = getPrologTheme(theme);
  
  // Get tokenizer for Monaco
  const prologTokenizer = getPrologTokenizer();

  // Initialize Monaco editor
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Register Prolog language
    monaco.languages.register({ id: 'prolog' });
    monaco.languages.setMonarchTokensProvider('prolog', prologTokenizer);

    // Set editor configuration
    editor.updateOptions({
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      fontFamily: '"Fira Code", "Monaco", "Courier New", monospace',
      lineNumbers: 'on',
      folding: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      wordWrap: 'on',
      wrappingIndent: 'indent',
      renderWhitespace: 'boundary',
      renderLineHighlight: 'all',
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        useShadows: false,
      },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
      wordBasedSuggestions: true,
      parameterHints: { enabled: true },
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      // Execution handled at App level
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, (e) => {
      e.preventDefault();
      handleSave();
    });
  };

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      // Show success feedback (would be integrated with toast system)
      console.log('Code copied to clipboard');
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleSave = () => {
    const filename = currentFile 
      ? files.find(f => f.id === currentFile)?.name 
      : `program-${Date.now()}.pl`;
    
    if (!currentFile) {
      const newFilename = prompt('Nombre del archivo:', filename);
      if (newFilename) {
        saveFile(newFilename);
        showFeedback('Archivo guardado');
      }
    } else {
      saveFile(filename);
      showFeedback('Cambios guardados');
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleLoadFile = (fileId) => {
    loadFile(fileId);
    setShowFiles(false);
  };

  return (
    <div className={`h-full flex flex-col rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 ${
      isFullscreen ? 'fixed inset-0 z-50' : ''
    }`}>
      
      {/* Editor Header */}
      <div className="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFiles(!showFiles)}
              className="px-3 py-1 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center space-x-2"
            >
              <FaFolderOpen className="w-4 h-4" />
              <span>Archivos</span>
              {files.length > 0 && (
                <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {files.length}
                </span>
              )}
            </button>
            
            {currentFile && (
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {files.find(f => f.id === currentFile)?.name}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title="Copiar código"
          >
            <FaCopy className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          </button>
          
          <button
            onClick={handleSave}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title="Guardar archivo"
          >
            <FaSave className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          </button>

          {saveFeedback && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {saveFeedback}
            </span>
          )}
          
          <button
            onClick={handleFullscreen}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? (
              <FaCompress className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            ) : (
              <FaExpand className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            )}
          </button>
        </div>
      </div>

      {/* Files Dropdown */}
      {showFiles && (
        <div className="absolute top-12 left-4 z-10 w-64 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 max-h-64 overflow-y-auto">
          <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="font-medium text-neutral-900 dark:text-white">Archivos Guardados</h3>
          </div>
          {files.length === 0 ? (
            <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
              No hay archivos guardados
            </div>
          ) : (
            <div className="py-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`w-full px-2 py-1 ${
                    currentFile === file.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLoadFile(file.id)}
                      className="flex-1 text-left px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
                    >
                      <div className="font-medium text-neutral-900 dark:text-white">
                        {file.name}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {new Date(file.lastModified).toLocaleDateString()}
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        const confirmed = window.confirm(`Borrar \"${file.name}\"? Esta accion no se puede deshacer.`);
                        if (confirmed) {
                          deleteFile(file.id);
                        }
                      }}
                      className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                      title={`Borrar ${file.name}`}
                      aria-label={`Borrar ${file.name}`}
                    >
                      <FaTrash className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="p-3 border-t border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => {
                const filename = prompt('Nombre del nuevo archivo:', `program-${Date.now()}.pl`);
                if (filename) {
                  createFile(filename);
                  setShowFiles(false);
                }
              }}
              className="w-full px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm"
            >
              + Nuevo Archivo
            </button>
          </div>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          key={currentFile || 'scratch'}
          height="100%"
          language="prolog"
          value={code}
          path={currentFile ? `files/${currentFile}.pl` : 'files/scratch.pl'}
          theme={theme === 'dark' ? 'prolog-dark' : 'prolog-light'}
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
          options={{
            automaticLayout: true,
            formatOnPaste: true,
            formatOnType: true,
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: true,
            },
          }}
          beforeMount={(monaco) => {
            // Register custom theme
            monaco.editor.defineTheme('prolog-light', prologTheme);
            monaco.editor.defineTheme('prolog-dark', {
              ...prologTheme,
              base: 'vs-dark',
              colors: {
                ...prologTheme.colors,
                'editor.background': '#1f2937',
                'editor.foreground': '#d1d5db',
                'editor.lineHighlightBackground': '#2d374850',
              },
            });
          }}
        />
      </div>

      {/* Editor Footer */}
      <div className="px-3 py-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          <span className="text-neutral-500 dark:text-neutral-400">
            {code.split('\n').length} líneas
          </span>
          <span className="text-neutral-500 dark:text-neutral-400">
            {code.length} caracteres
          </span>
          <span className="text-neutral-500 dark:text-neutral-400">
            Prolog
          </span>
        </div>
        <div className="text-neutral-500 dark:text-neutral-400">
          UTF-8
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;