/**
 * SVG export utilities for Prolog-Tutor tree visualization
 * Extracted from TreeVisualization.jsx
 */

/**
 * Export an SVG element to a file
 * @param {SVGElement} svgElement - The SVG element to export
 * @param {string} filename - Filename for the download (default: 'prolog-tree-{timestamp}.svg')
 * @returns {void}
 */
export const exportSVG = (svgElement, filename) => {
  if (!svgElement) {
    console.error('No SVG element provided for export');
    return;
  }

  // Clone the SVG to avoid modifying the original
  const clone = svgElement.cloneNode(true);
  const rect = svgElement.getBoundingClientRect();

  // Set required attributes for valid SVG
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  if (!clone.getAttribute('viewBox')) {
    clone.setAttribute('viewBox', `0 0 ${Math.max(1, Math.round(rect.width))} ${Math.max(1, Math.round(rect.height))}`);
  }

  clone.setAttribute('width', `${Math.max(1, Math.round(rect.width))}`);
  clone.setAttribute('height', `${Math.max(1, Math.round(rect.height))}`);

  // Create the SVG string with proper XML declaration
  const svgText = `<?xml version="1.0" encoding="UTF-8"?>\n${clone.outerHTML}`;
  
  // Create blob and download
  const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `prolog-tree-${Date.now()}.svg`;
  
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  // Clean up
  URL.revokeObjectURL(url);
};

/**
 * Get SVG as data URL
 * @param {SVGElement} svgElement - The SVG element
 * @returns {string} Data URL of the SVG
 */
export const getSVGDataURL = (svgElement) => {
  if (!svgElement) return null;

  const clone = svgElement.cloneNode(true);
  const rect = svgElement.getBoundingClientRect();

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  if (!clone.getAttribute('viewBox')) {
    clone.setAttribute('viewBox', `0 0 ${Math.max(1, Math.round(rect.width))} ${Math.max(1, Math.round(rect.height))}`);
  }

  clone.setAttribute('width', `${Math.max(1, Math.round(rect.width))}`);
  clone.setAttribute('height', `${Math.max(1, Math.round(rect.height))}`);

  const svgText = `<?xml version="1.0" encoding="UTF-8"?>\n${clone.outerHTML}`;
  const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  
  return URL.createObjectURL(blob);
};

export default {
  exportSVG,
  getSVGDataURL,
};