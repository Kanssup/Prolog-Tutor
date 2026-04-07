/**
 * Prolog theme configuration for Monaco Editor
 * Extracted from CodeEditor.jsx
 */

/**
 * Get Prolog theme configuration
 * @param {string} theme - App theme ('light' or 'dark')
 * @returns {object} Monaco theme definition
 */
export const getPrologTheme = (theme = 'light') => ({
  base: theme === 'dark' ? 'vs-dark' : 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A9955' },
    { token: 'keyword', foreground: '569CD6' },
    { token: 'variable', foreground: '9CDCFE' },
    { token: 'predicate', foreground: 'DCDCAA' },
    { token: 'atom', foreground: '4EC9B0' },
    { token: 'string', foreground: 'CE9178' },
    { token: 'number', foreground: 'B5CEA8' },
    { token: 'operator', foreground: 'D4D4D4' },
  ],
  colors: {
    'editor.background': theme === 'dark' ? '#1f2937' : '#ffffff',
    'editor.foreground': theme === 'dark' ? '#d1d5db' : '#374151',
    'editor.lineHighlightBackground': theme === 'dark' ? '#2d374850' : '#f3f4f650',
    'editorCursor.foreground': '#0ea5e9',
    'editor.selectionBackground': theme === 'dark' ? '#3b82f650' : '#0ea5e950',
  },
});

/**
 * Get dark theme specifically
 * @returns {object} Monaco dark theme
 */
export const getPrologDarkTheme = () => ({
  ...getPrologTheme('dark'),
  base: 'vs-dark',
  colors: {
    'editor.background': '#1f2937',
    'editor.foreground': '#d1d5db',
    'editor.lineHighlightBackground': '#2d374850',
    'editorCursor.foreground': '#0ea5e9',
    'editor.selectionBackground': '#3b82f650',
  },
});

/**
 * Get light theme specifically
 * @returns {object} Monaco light theme
 */
export const getPrologLightTheme = () => ({
  ...getPrologTheme('light'),
  base: 'vs',
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#374151',
    'editor.lineHighlightBackground': '#f3f4f650',
    'editorCursor.foreground': '#0ea5e9',
    'editor.selectionBackground': '#0ea5e950',
  },
});

// Default export
export default {
  getPrologTheme,
  getPrologDarkTheme,
  getPrologLightTheme,
};