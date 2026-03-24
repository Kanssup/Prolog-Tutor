import React, { useState, useEffect } from 'react';
import { FaGripVertical } from 'react-icons/fa';
import useAppStore from '../../store/appStore';

const SplitPaneLayout = ({ children }) => {
  const { layout, setLayout } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [localLayout, setLocalLayout] = useState(layout);

  // Update local layout when store layout changes
  useEffect(() => {
    setLocalLayout(layout);
  }, [layout]);

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.preventDefault();
    
    const handleDrag = (e) => {
      const container = document.querySelector('.split-pane-container');
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const x = e.clientX - containerRect.left;
      const percentage = (x / containerRect.width) * 100;
      
      // Clamp between 20% and 80%
      const clampedPercentage = Math.max(20, Math.min(80, percentage));
      
      setLocalLayout({
        editor: clampedPercentage,
        visualization: 100 - clampedPercentage,
      });
    };
    
    const handleDragEnd = () => {
      setIsDragging(false);
      setLayout(localLayout);
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDrag);
      document.removeEventListener('touchend', handleDragEnd);
    };
    
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDrag);
    document.addEventListener('touchend', handleDragEnd);
  };

  // Handle touch events for mobile
  const handleTouchStart = (e) => {
    setIsDragging(true);
    e.preventDefault();
    
    const handleTouchMove = (e) => {
      const container = document.querySelector('.split-pane-container');
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const x = e.touches[0].clientX - containerRect.left;
      const percentage = (x / containerRect.width) * 100;
      
      // Clamp between 20% and 80%
      const clampedPercentage = Math.max(20, Math.min(80, percentage));
      
      setLocalLayout({
        editor: clampedPercentage,
        visualization: 100 - clampedPercentage,
      });
    };
    
    const handleTouchEnd = () => {
      setIsDragging(false);
      setLayout(localLayout);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  // Reset to default layout
  const handleResetLayout = () => {
    const defaultLayout = { editor: 40, visualization: 60 };
    setLocalLayout(defaultLayout);
    setLayout(defaultLayout);
  };

  // Responsive layout for mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    // Stack vertically on mobile
    return (
      <div className="split-pane-container flex flex-col space-y-4">
        {React.Children.map(children, (child, index) => (
          <div key={index} className="w-full">
            {child}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="split-pane-container relative h-[calc(100vh-6rem)] min-h-[620px]">
      {/* Dragging overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-40 cursor-col-resize" />
      )}
      
      <div className="flex h-full">
        {/* Left pane - Editor */}
        <div
          className="h-full overflow-hidden transition-all duration-150"
          style={{ width: `${localLayout.editor}%` }}
        >
          {children[0]}
        </div>
        
        {/* Divider */}
        <div
          className="relative w-4 flex items-center justify-center group cursor-col-resize hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
          onMouseDown={handleDragStart}
          onTouchStart={handleTouchStart}
        >
          <div className="absolute inset-0" />
          <div className="relative z-10 p-1 rounded-lg bg-neutral-200 dark:bg-neutral-700 group-hover:bg-primary-500 dark:group-hover:bg-primary-500 transition-colors">
            <FaGripVertical className="w-3 h-3 text-neutral-500 dark:text-neutral-400 group-hover:text-white transition-colors" />
          </div>
          
          {/* Tooltip */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-neutral-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              Arrastrar para ajustar
              <div className="text-[10px] text-neutral-300">Doble clic para resetear</div>
            </div>
          </div>
          
          {/* Double click to reset */}
          <div
            className="absolute inset-0"
            onDoubleClick={handleResetLayout}
            title="Doble clic para resetear el layout"
          />
        </div>
        
        {/* Right pane - Visualization */}
        <div
          className="h-full overflow-hidden transition-all duration-150"
          style={{ width: `${localLayout.visualization}%` }}
        >
          {children[1]}
        </div>
      </div>
      
      {/* Layout indicator */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        Editor: {Math.round(localLayout.editor)}% | Visualización: {Math.round(localLayout.visualization)}%
      </div>
    </div>
  );
};

SplitPaneLayout.defaultProps = {
  children: [],
};

export default SplitPaneLayout;