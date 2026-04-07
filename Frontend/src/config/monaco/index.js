/**
 * Monaco Editor configuration - Re-export all Monaco config modules
 */

// Language configuration
export {
  getPrologLanguageConfig,
  getPrologTokenizer,
  getPrologLanguageDefinition,
} from './prologLanguage.js';

// Theme configuration
export {
  getPrologTheme,
  getPrologDarkTheme,
  getPrologLightTheme,
} from './prologTheme.js';

// Default export
export * from './prologLanguage.js';
export * from './prologTheme.js';