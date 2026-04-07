/**
 * File utilities - Pure functions for file operations
 */

/**
 * Generate a unique filename for Prolog files
 * @param {Array} files - Array of existing files
 * @param {string} baseName - Base name for the file (default: 'archivo')
 * @returns {string} Unique filename (e.g., 'archivo.pl', 'archivo_1.pl')
 */
export const generateFilename = (files = [], baseName = 'archivo') => {
  // Normalize to array
  const fileList = Array.isArray(files) ? files : [];
  
  // Get existing names
  const existingNames = new Set(fileList.map((file) => file.name));
  
  // Check if baseName with .pl extension is available
  let finalName = baseName.endsWith('.pl') ? baseName : `${baseName}.pl`;
  
  if (!existingNames.has(finalName)) {
    return finalName;
  }
  
  // Try numbered versions: archivo_1.pl, archivo_2.pl, etc.
  let counter = 1;
  while (existingNames.has(`${baseName}_${counter}.pl`)) {
    counter++;
  }
  
  return `${baseName}_${counter}.pl`;
};

/**
 * Check if a filename already exists in the file list
 * @param {Array} files - Array of existing files
 * @param {string} filename - Filename to check
 * @returns {boolean} True if filename exists
 */
export const filenameExists = (files = [], filename) => {
  const fileList = Array.isArray(files) ? files : [];
  return fileList.some((file) => file.name === filename);
};

/**
 * Get file extension from filename
 * @param {string} filename - Filename
 * @returns {string} File extension (including dot) or empty string
 */
export const getFileExtension = (filename) => {
  if (!filename || typeof filename !== 'string') return '';
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.slice(lastDot) : '';
};

/**
 * Get filename without extension
 * @param {string} filename - Filename with extension
 * @returns {string} Filename without extension
 */
export const getBaseFilename = (filename) => {
  if (!filename || typeof filename !== 'string') return '';
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.slice(0, lastDot) : filename;
};

/**
 * Ensure filename has .pl extension
 * @param {string} filename - Filename
 * @returns {string} Filename with .pl extension
 */
export const ensurePlExtension = (filename) => {
  if (!filename || typeof filename !== 'string') return 'archivo.pl';
  return filename.endsWith('.pl') ? filename : `${filename}.pl`;
};

// Default export
export default {
  generateFilename,
  filenameExists,
  getFileExtension,
  getBaseFilename,
  ensurePlExtension,
};