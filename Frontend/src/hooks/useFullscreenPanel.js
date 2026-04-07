import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for managing fullscreen state of a panel
 * Extracted from TreeVisualization.jsx
 * 
 * @param {React.RefObject} ref - React ref to the panel element
 * @returns {object} Fullscreen state and toggle function
 */
export const useFullscreenPanel = (ref) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === ref.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [ref]);

  /**
   * Toggle fullscreen mode
   */
  const toggleFullscreen = useCallback(async () => {
    if (!ref.current) return;

    if (document.fullscreenElement === ref.current) {
      await document.exitFullscreen();
    } else {
      await ref.current.requestFullscreen();
    }
  }, [ref]);

  /**
   * Enter fullscreen mode
   */
  const enterFullscreen = useCallback(async () => {
    if (!ref.current || document.fullscreenElement) return;
    await ref.current.requestFullscreen();
  }, [ref]);

  /**
   * Exit fullscreen mode
   */
  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  }, []);

  return {
    isFullscreen,
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
  };
};

/**
 * Create a ref and use fullscreen with it (convenience version)
 * @param {React.RefObject} externalRef - Optional external ref to use
 * @returns {object} Fullscreen state, toggle function, and ref
 */
export const useFullscreen = (externalRef = null) => {
  const internalRef = useRef(null);
  const ref = externalRef || internalRef;
  
  return {
    ...useFullscreenPanel(ref),
    ref,
  };
};

export default useFullscreenPanel;