/**
 * Custom color palette for Prolog Tutor
 * Education-focused color scheme with consistent branding
 */

export const colors = {
  // Primary - Sky Blue (Trust, Intelligence, Logic)
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main primary color
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Secondary - Emerald Green (Growth, Success, Learning)
  secondary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Success states
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Accent - Amber (Attention, Energy, Debugging)
  accent: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Warning/attention states
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Neutral - Gray (Balance, Readability)
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Semantic colors for Prolog-specific elements
  prolog: {
    // Execution states
    success: '#10b981',      // Green for successful execution
    error: '#ef4444',        // Red for failed execution
    warning: '#f59e0b',      // Amber for warnings
    info: '#3b82f6',         // Blue for information
    
    // Code syntax highlighting
    variable: '#8b5cf6',     // Purple for variables
    predicate: '#ec4899',    // Pink for predicates
    atom: '#0ea5e9',         // Blue for atoms
    comment: '#6b7280',      // Gray for comments
    operator: '#f59e0b',     // Amber for operators
    string: '#22c55e',       // Green for strings
    number: '#f97316',       // Orange for numbers
    
    // Tree visualization
    nodeSuccess: '#d1fae5',  // Light green for success nodes
    nodeError: '#fee2e2',    // Light red for error nodes
    nodePending: '#fef3c7',  // Light amber for pending nodes
    nodeBorderSuccess: '#10b981',
    nodeBorderError: '#ef4444',
    nodeBorderPending: '#f59e0b',
    
    // Easter egg special colors
    easterEgg: '#8b5cf6',    // Purple for Easter egg effects
    easterEggLight: '#ede9fe',
  },
  
  // UI component colors
  ui: {
    background: {
      light: '#ffffff',
      dark: '#111827',
    },
    surface: {
      light: '#f9fafb',
      dark: '#1f2937',
    },
    border: {
      light: '#e5e7eb',
      dark: '#374151',
    },
    text: {
      primary: {
        light: '#111827',
        dark: '#f9fafb',
      },
      secondary: {
        light: '#6b7280',
        dark: '#9ca3af',
      },
    },
  },
};

/**
 * Get color value with theme awareness
 * @param {string} colorPath - Dot notation path to color (e.g., 'primary.500')
 * @param {string} theme - 'light' or 'dark'
 * @returns {string} Color value
 */
export const getColor = (colorPath, theme = 'light') => {
  const path = colorPath.split('.');
  let current = colors;
  
  for (const key of path) {
    if (current[key] === undefined) {
      console.warn(`Color path "${colorPath}" not found`);
      return '#000000';
    }
    current = current[key];
  }
  
  // Handle theme-specific colors
  if (typeof current === 'object' && current[theme]) {
    return current[theme];
  }
  
  return current;
};

/**
 * CSS variables for theme switching
 */
export const cssVariables = {
  light: {
    '--color-primary': colors.primary[500],
    '--color-secondary': colors.secondary[500],
    '--color-accent': colors.accent[500],
    '--color-success': colors.prolog.success,
    '--color-error': colors.prolog.error,
    '--color-warning': colors.prolog.warning,
    '--color-info': colors.prolog.info,
    '--color-background': colors.ui.background.light,
    '--color-surface': colors.ui.surface.light,
    '--color-border': colors.ui.border.light,
    '--color-text-primary': colors.ui.text.primary.light,
    '--color-text-secondary': colors.ui.text.secondary.light,
  },
  dark: {
    '--color-primary': colors.primary[400],
    '--color-secondary': colors.secondary[400],
    '--color-accent': colors.accent[400],
    '--color-success': colors.prolog.success,
    '--color-error': colors.prolog.error,
    '--color-warning': colors.prolog.warning,
    '--color-info': colors.prolog.info,
    '--color-background': colors.ui.background.dark,
    '--color-surface': colors.ui.surface.dark,
    '--color-border': colors.ui.border.dark,
    '--color-text-primary': colors.ui.text.primary.dark,
    '--color-text-secondary': colors.ui.text.secondary.dark,
  },
};

/**
 * Apply theme to document
 * @param {string} theme - 'light' or 'dark'
 */
export const applyTheme = (theme) => {
  const variables = cssVariables[theme];
  const root = document.documentElement;
  
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  
  // Update data-theme attribute for CSS selectors
  root.setAttribute('data-theme', theme);
  
  // Update Tailwind dark mode class
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

/**
 * Get current theme from localStorage or system preference
 * @returns {string} 'light' or 'dark'
 */
export const getInitialTheme = () => {
  // Check localStorage first
  const savedTheme = localStorage.getItem('prolog-tutor-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }
  
  // Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  // Default to light
  return 'light';
};

/**
 * Save theme preference to localStorage
 * @param {string} theme - 'light' or 'dark'
 */
export const saveTheme = (theme) => {
  localStorage.setItem('prolog-tutor-theme', theme);
};

export default colors;