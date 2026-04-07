import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook for managing tree viewport (zoom, pan/drag, drag state)
 * Extracted from TreeVisualization.jsx
 * 
 * @param {number} initialZoom - Initial zoom level (default: 1)
 * @returns {object} Viewport state and handlers
 */
export const useTreeViewport = (initialZoom = 1) => {
  const containerRef = useRef(null);
  
  const [zoom, setZoom] = useState(initialZoom);
  const [translation, setTranslation] = useState({ x: 0, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState('interactive');

  /**
   * Handle zoom in
   */
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  }, []);

  /**
   * Handle zoom out
   */
  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  }, []);

  /**
   * Handle zoom reset to default
   */
  const handleZoomReset = useCallback(() => {
    setZoom(1);
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      setTranslation({ x: width / 2, y: 80 });
    } else {
      setTranslation({ x: 0, y: 80 });
    }
  }, []);

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback((e) => {
    if (viewMode === 'interactive') {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - translation.x,
        y: e.clientY - translation.y,
      });
    }
  }, [viewMode, translation]);

  /**
   * Handle drag move (pan)
   */
  const handleDragMove = useCallback((e) => {
    if (isDragging && viewMode === 'interactive') {
      setTranslation({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, viewMode, dragStart]);

  /**
   * Handle drag end
   */
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Center the tree in the viewport
   */
  const centerTree = useCallback(() => {
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      setTranslation({ x: width / 2, y: 80 });
    }
  }, []);

  /**
   * Reset viewport to initial state
   */
  const resetViewport = useCallback(() => {
    setZoom(1);
    setTranslation({ x: 0, y: 80 });
    setIsDragging(false);
    setDragStart({ x: 0, y: 0 });
  }, []);

  /**
   * Set container ref from parent component
   */
  const setContainerRef = useCallback((ref) => {
    containerRef.current = ref;
  }, []);

  return {
    // State
    zoom,
    translation,
    isDragging,
    dragStart,
    viewMode,
    containerRef,
    
    // Setters
    setZoom,
    setTranslation,
    setViewMode,
    
    // Handlers
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    
    // Utilities
    centerTree,
    resetViewport,
    setContainerRef,
  };
};

export default useTreeViewport;