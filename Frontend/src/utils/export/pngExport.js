/**
 * PNG export utilities for Prolog-Tutor tree visualization
 * Extracted from TreeVisualization.jsx
 */

/**
 * Export an SVG element as PNG image
 * @param {SVGElement} svgElement - The SVG element to export
 * @param {string} theme - Theme ('dark' or 'light') for background color
 * @param {string} filename - Filename for the download (default: 'prolog-tree-{timestamp}.png')
 * @returns {Promise<void>} Promise that resolves when export is complete
 */
export const exportPNG = (svgElement, theme = 'light', filename) => {
  return new Promise((resolve, reject) => {
    if (!svgElement) {
      console.error('No SVG element provided for PNG export');
      reject(new Error('No SVG element provided'));
      return;
    }

    // Clone the SVG
    const clone = svgElement.cloneNode(true);
    const rect = svgElement.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    // Set required attributes
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    if (!clone.getAttribute('viewBox')) {
      clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }
    
    clone.setAttribute('width', `${width}`);
    clone.setAttribute('height', `${height}`);

    // Convert SVG to data URL
    const svgText = `<?xml version="1.0" encoding="UTF-8"?>\n${clone.outerHTML}`;
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create image and draw to canvas
    const image = new Image();
    
    image.onload = () => {
      const scale = 2; // 2x resolution for better quality
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(svgUrl);
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Fill background based on theme
      ctx.scale(scale, scale);
      ctx.fillStyle = theme === 'dark' ? '#0f172a' : '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // Draw the SVG image
      ctx.drawImage(image, 0, 0, width, height);

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          URL.revokeObjectURL(svgUrl);
          reject(new Error('Could not create PNG blob'));
          return;
        }

        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = filename || `prolog-tree-${Date.now()}.png`;
        
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        // Clean up
        URL.revokeObjectURL(pngUrl);
        URL.revokeObjectURL(svgUrl);
        
        resolve();
      }, 'image/png');
    };

    image.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error('Failed to load SVG image'));
    };

    image.src = svgUrl;
  });
};

/**
 * Export SVG to PNG synchronously (uses callback instead of promise)
 * @param {SVGElement} svgElement - The SVG element to export
 * @param {string} theme - Theme for background color
 * @param {string} filename - Filename for download
 * @param {function} onComplete - Callback on success
 * @param {function} onError - Callback on error
 */
export const exportPNGSync = (svgElement, theme = 'light', filename, onComplete, onError) => {
  if (!svgElement) {
    onError?.(new Error('No SVG element provided'));
    return;
  }

  const clone = svgElement.cloneNode(true);
  const rect = svgElement.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  
  if (!clone.getAttribute('viewBox')) {
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }
  
  clone.setAttribute('width', `${width}`);
  clone.setAttribute('height', `${height}`);

  const svgText = `<?xml version="1.0" encoding="UTF-8"?>\n${clone.outerHTML}`;
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  const image = new Image();
  
  image.onload = () => {
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      URL.revokeObjectURL(svgUrl);
      onError?.(new Error('Could not get canvas context'));
      return;
    }

    ctx.scale(scale, scale);
    ctx.fillStyle = theme === 'dark' ? '#0f172a' : '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

    canvas.toBlob((blob) => {
      if (!blob) {
        URL.revokeObjectURL(svgUrl);
        onError?.(new Error('Could not create PNG blob'));
        return;
      }

      const pngUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = filename || `prolog-tree-${Date.now()}.png`;
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      URL.revokeObjectURL(pngUrl);
      URL.revokeObjectURL(svgUrl);
      
      onComplete?.();
    }, 'image/png');
  };

  image.onerror = () => {
    URL.revokeObjectURL(svgUrl);
    onError?.(new Error('Failed to load SVG image'));
  };

  image.src = svgUrl;
};

export default {
  exportPNG,
  exportPNGSync,
};