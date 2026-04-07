/**
 * Prolog language configuration for Monaco Editor
 * Extracted from CodeEditor.jsx
 */

/**
 * Get Prolog language configuration
 * @param {string} theme - Theme ('light' or 'dark')
 * @returns {object} Monaco language configuration
 */
export const getPrologLanguageConfig = (theme = 'light') => ({
  comments: {
    lineComment: '%',
    blockComment: ['/*', '*/'],
  },
  brackets: [
    ['(', ')'],
    ['[', ']'],
    ['{', '}'],
  ],
  autoClosingPairs: [
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '{', close: '}' },
    { open: "'", close: "'", notIn: ['string', 'comment'] },
    { open: '"', close: '"', notIn: ['string', 'comment'] },
  ],
  surroundingPairs: [
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '{', close: '}' },
    { open: "'", close: "'" },
    { open: '"', close: '"' },
  ],
});

/**
 * Get Prolog tokenizer rules for Monaco
 * @returns {object} Monaco monarch tokenizer configuration
 */
export const getPrologTokenizer = () => ({
  defaultToken: '',
  tokenPostfix: '.pl',
  
  keywords: [
    'true', 'false', 'fail', 'repeat', 'call', 'catch', 'throw',
    'not', 'once', 'ignore', 'assert', 'asserta', 'assertz',
    'retract', 'retractall', 'abolish', 'clause', 'current_predicate',
    'dynamic', 'multifile', 'discontiguous', 'public', 'volatile',
    'initialization', 'include', 'ensure_loaded', 'use_module',
    'module', 'export', 'import', 'reexport', 'meta_predicate',
    'mode', 'op', 'char_conversion', 'current_op', 'set_prolog_flag',
    'current_prolog_flag', 'set_stream', 'current_stream', 'stream_property',
    'open', 'close', 'flush_output', 'current_input', 'current_output',
    'set_input', 'set_output', 'nl', 'put', 'put_byte', 'put_char',
    'put_code', 'tab', 'get', 'get_byte', 'get_char', 'get_code',
    'peek', 'peek_byte', 'peek_char', 'peek_code', 'skip', 'read',
    'read_term', 'write', 'writeq', 'write_canonical', 'write_term',
    'format', 'atom_length', 'atom_concat', 'sub_atom', 'char_code',
    'number_chars', 'number_codes', 'atom_chars', 'atom_codes',
    'name', 'functor', 'arg', '=..', 'copy_term', 'term_variables',
    'var', 'nonvar', 'atom', 'integer', 'float', 'number', 'atomic',
    'compound', 'callable', 'ground', '==', '\==', '@<', '@=<', '@>', '@>=',
    '=:=', '=\=', '<', '=<', '>', '>=', 'is', '=',
    'between', 'succ', 'plus', 'minus', 'mult', 'div', 'mod', 'rem',
    'abs', 'sign', 'max', 'min', 'random', 'round', 'truncate', 'floor',
    'ceiling', 'sqrt', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
    'log', 'exp', '**', '^', 'pi', 'e', 'cputime', 'statistics',
    'halt', 'abort', 'break', 'trace', 'debug', 'nodebug', 'spy',
    'nospy', 'leash', 'visible', 'unknown', 'style_check',
    'consult', 'reconsult', 'compile', 'ensure_loaded', 'use_module',
  ],
  
  operators: [
    ':-', '-->', '->', ';', ',', '\\+', '=', '\\=', '==', '\\==',
    '@<', '@=<', '@>', '@>=', '=:=', '=\\=', '<', '=<', '>', '>=',
    'is', '=..', '?=', '?\\=', '?@<', '?@=<', '?@>', '?@>=',
  ],
  
  tokenizer: {
    root: [
      [/%.*/, 'comment'],
      [/\/\*/, 'comment', '@comment'],
      [/\d+\.\d+/, 'number'],
      [/\d+/, 'number'],
      [/[A-Z_][A-Za-z0-9_]*/, 'variable'],
      [/[a-z][A-Za-z0-9_]*/, { cases: { '@keywords': 'keyword', '@default': 'predicate' } }],
      [/[\[\](){}]/, '@brackets'],
      [/["](?:(?:\\.)|(?:[^"\\]))*["]/, 'string'],
      [/['](?:(?:\\.)|(?:[^'\\]))*[']/, 'string'],
      [/[@?\\=<>:;,+*\/-]+/, { cases: { '@operators': 'operator', '@default': '' } }],
    ],
    comment: [
      [/[^\/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[\/*]/, 'comment'],
    ],
  },
});

/**
 * Get complete Prolog language definition for Monaco
 * @param {string} theme - Theme ('light' or 'dark')
 * @returns {object} Complete language definition
 */
export const getPrologLanguageDefinition = (theme = 'light') => ({
  languageConfig: getPrologLanguageConfig(theme),
  tokenizer: getPrologTokenizer(),
});

// Default export
export default {
  getPrologLanguageConfig,
  getPrologTokenizer,
  getPrologLanguageDefinition,
};