import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  FaExpand, 
  FaCompress,
  FaDownload, 
  FaSearch, 
  FaMousePointer,
  FaHandPaper,
  FaInfoCircle
} from 'react-icons/fa';
import Tree from 'react-d3-tree';
import useAppStore from '../../store/appStore';

const TreeVisualization = () => {
  const {
    treeData,
    currentStep,
    theme,
  } = useAppStore();

  const [zoom, setZoom] = useState(1);
  const [translation, setTranslation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);
  const [viewMode, setViewMode] = useState('interactive'); // 'interactive' or 'presentation'
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const panelRef = useRef(null);
  const treeContainerRef = useRef(null);
  const treeRef = useRef(null);
  const renderedTreeData = useMemo(() => buildRecursiveFocusedTree(treeData), [treeData]);
  const recursionFunctor = useMemo(() => detectRecursionFunctor(renderedTreeData), [renderedTreeData]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === panelRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Reset view when new tree data arrives
  useEffect(() => {
    if (renderedTreeData) {
      setZoom(1);
      const container = treeContainerRef.current;
      if (container) {
        const { width } = container.getBoundingClientRect();
        setTranslation({ x: width / 2, y: 80 });
      } else {
        setTranslation({ x: 0, y: 80 });
      }
      setSelectedNode(null);
      setHighlightedNodes(new Set());
    }
  }, [renderedTreeData]);

  // Handle zoom
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleZoomReset = () => {
    setZoom(1);
    const container = treeContainerRef.current;
    if (container) {
      const { width } = container.getBoundingClientRect();
      setTranslation({ x: width / 2, y: 80 });
    } else {
      setTranslation({ x: 0, y: 80 });
    }
  };

  // Handle drag
  const handleDragStart = (e) => {
    if (viewMode === 'interactive') {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - translation.x,
        y: e.clientY - translation.y,
      });
    }
  };

  const handleDragMove = (e) => {
    if (isDragging && viewMode === 'interactive') {
      setTranslation({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setHighlightedNodes(new Set());
      return;
    }

    const highlight = new Set();
    const searchLower = term.toLowerCase();

    const searchInTree = (node) => {
      if (node.goal.toLowerCase().includes(searchLower)) {
        highlight.add(node.id);
      }
      if (node.children) {
        node.children.forEach(searchInTree);
      }
    };

    if (renderedTreeData) {
      searchInTree(renderedTreeData);
    }
    setHighlightedNodes(highlight);
  };

  // Handle node click
  const handleNodeClick = (nodeData) => {
    setSelectedNode(nodeData);
  };

  // Export tree as SVG
  const handleExportSVG = () => {
    const svgElement = treeContainerRef.current?.querySelector('svg');
    if (!svgElement) return;

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
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `prolog-tree-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Export tree as PNG
  const handleExportPNG = () => {
    const svgElement = treeContainerRef.current?.querySelector('svg');
    if (!svgElement) return;

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
        return;
      }

      ctx.scale(scale, scale);
      ctx.fillStyle = theme === 'dark' ? '#0f172a' : '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (!blob) {
          URL.revokeObjectURL(svgUrl);
          return;
        }

        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `prolog-tree-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(pngUrl);
        URL.revokeObjectURL(svgUrl);
      }, 'image/png');
    };

    image.onerror = () => {
      URL.revokeObjectURL(svgUrl);
    };

    image.src = svgUrl;
  };

  const handleToggleFullscreen = async () => {
    if (!panelRef.current) return;

    if (document.fullscreenElement === panelRef.current) {
      await document.exitFullscreen();
      return;
    }

    await panelRef.current.requestFullscreen();
  };

  // Custom node rendering
  const renderCustomNode = ({ nodeDatum, toggleNode }) => {
    const isHighlighted = highlightedNodes.has(nodeDatum.id);
    const isSelected = selectedNode?.id === nodeDatum.id;
    const isCurrentStep = nodeDatum.metadata?.step === currentStep;
    const isBaseCase = isRecursionBaseCase(nodeDatum, recursionFunctor);

    // Determine node color based on status
    let backgroundColor, borderColor, textColor;
    
    switch (nodeDatum.status) {
      case 'success':
        backgroundColor = theme === 'dark' ? '#064e3b' : '#d1fae5';
        borderColor = theme === 'dark' ? '#10b981' : '#10b981';
        textColor = theme === 'dark' ? '#d1fae5' : '#065f46';
        break;
      case 'fail':
        backgroundColor = theme === 'dark' ? '#7f1d1d' : '#fee2e2';
        borderColor = theme === 'dark' ? '#ef4444' : '#ef4444';
        textColor = theme === 'dark' ? '#fee2e2' : '#991b1b';
        break;
      default: // pending
        backgroundColor = theme === 'dark' ? '#78350f' : '#fef3c7';
        borderColor = theme === 'dark' ? '#f59e0b' : '#f59e0b';
        textColor = theme === 'dark' ? '#fef3c7' : '#92400e';
    }

    const strokeWidth = isSelected ? '3px' : '2px';
    const nodeFilter = isCurrentStep
      ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.5))'
      : 'none';

    // Highlight styles
    if (isHighlighted) {
      backgroundColor = theme === 'dark' ? '#3730a3' : '#e0e7ff';
      borderColor = theme === 'dark' ? '#6366f1' : '#6366f1';
    }

    // Selected styles
    if (isSelected) {
      borderColor = theme === 'dark' ? '#0ea5e9' : '#0ea5e9';
    }

    // Current step styles
    if (isCurrentStep) {
      borderColor = theme === 'dark' ? '#f59e0b' : '#f59e0b';
    }

    return (
      <g>
        {/* Node background */}
        <rect
          width="180"
          height="60"
          x="-90"
          y="-30"
          rx="8"
          ry="8"
          fill={backgroundColor}
          stroke={borderColor}
          strokeWidth={strokeWidth}
          style={{ 
            filter: nodeFilter,
            cursor: 'pointer',
          }}
          onClick={() => handleNodeClick(nodeDatum)}
        />

        {/* Node content */}
        <text
          fill={textColor}
          strokeWidth="0"
          x="0"
          y="-10"
          textAnchor="middle"
          style={{
            fontFamily: '"Fira Code", monospace',
            fontSize: '12px',
            fontWeight: '500',
            pointerEvents: 'none',
          }}
          onClick={() => handleNodeClick(nodeDatum)}
        >
          {nodeDatum.goal.length > 25
            ? `${nodeDatum.goal.substring(0, 22)}...`
            : nodeDatum.goal}
        </text>

        {/* Node status and info */}
        <text
          fill={textColor}
          strokeWidth="0"
          x="0"
          y="10"
          textAnchor="middle"
          style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: '10px',
            opacity: 0.8,
            pointerEvents: 'none',
          }}
        >
          {nodeDatum.status === 'success' && '✅ '}
          {nodeDatum.status === 'fail' && '❌ '}
          {nodeDatum.status === 'pending' && '⏳ '}
        </text>

        {isBaseCase && (
          <text
            fill={theme === 'dark' ? '#fbbf24' : '#92400e'}
            strokeWidth="0"
            x="0"
            y={nodeDatum.bindings && Object.keys(nodeDatum.bindings).length > 0 ? '36' : '25'}
            textAnchor="middle"
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: '10px',
              fontWeight: '700',
              pointerEvents: 'none',
            }}
          >
            Caso base
          </text>
        )}

        {/* Variable bindings (if any) */}
        {nodeDatum.bindings && Object.keys(nodeDatum.bindings).length > 0 && (
          <text
            fill={theme === 'dark' ? '#93c5fd' : '#1d4ed8'}
            strokeWidth="0"
            x="0"
            y="25"
            textAnchor="middle"
            style={{
              fontFamily: '"Fira Code", monospace',
              fontSize: '10px',
              fontStyle: 'italic',
              pointerEvents: 'none',
            }}
          >
            {Object.entries(nodeDatum.bindings)
              .map(([key, value]) => `${key} = ${value}`)
              .join(', ')}
          </text>
        )}

        {/* Expand/collapse indicator */}
        {nodeDatum.children && nodeDatum.children.length > 0 && (
          <circle
            r="10"
            cx="70"
            cy="0"
            fill={theme === 'dark' ? '#374151' : '#e5e7eb'}
            stroke={theme === 'dark' ? '#4b5563' : '#9ca3af'}
            strokeWidth="1"
            onClick={() => toggleNode()}
            style={{ cursor: 'pointer' }}
          >
            <title>{nodeDatum.__rd3t?.collapsed ? 'Expandir' : 'Colapsar'}</title>
          </circle>
        )}

        {/* Search highlight indicator */}
        {isHighlighted && (
          <circle
            r="6"
            cx="-70"
            cy="0"
            fill="#6366f1"
            opacity="0.8"
          >
            <title>Coincidencia de búsqueda</title>
          </circle>
        )}
      </g>
    );
  };

  // If no tree data, show placeholder
  if (!renderedTreeData) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 mb-6 opacity-20">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
          Árbol de Ejecución
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400 max-w-md">
          Ejecuta una consulta Prolog para visualizar el árbol de deducción SLD.
          Cada nodo representa un objetivo durante la ejecución.
        </p>
        <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg max-w-md">
          <div className="flex items-start space-x-3">
            <FaInfoCircle className="w-5 h-5 text-primary-500 dark:text-primary-400 mt-0.5" />
            <div className="text-sm text-primary-700 dark:text-primary-300">
              <p className="font-medium">Tipos de nodos:</p>
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <span>✅ Éxito (objetivo probado)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded bg-red-500" />
                  <span>❌ Falla (backtracking)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded bg-yellow-500" />
                  <span>⏳ Pendiente (en ejecución)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={panelRef} className="h-full flex flex-col bg-neutral-50 dark:bg-slate-800/30">
      {/* Tree Controls */}
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
            <button
              onClick={handleZoomIn}
              className="p-2 rounded hover:bg-white dark:hover:bg-neutral-700"
              title="Acercar"
            >
              <span className="font-bold text-neutral-700 dark:text-neutral-300">+</span>
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 rounded hover:bg-white dark:hover:bg-neutral-700"
              title="Alejar"
            >
              <span className="font-bold text-neutral-700 dark:text-neutral-300">-</span>
            </button>
            <button
              onClick={handleZoomReset}
              className="px-3 py-2 text-sm rounded hover:bg-white dark:hover:bg-neutral-700"
              title="Restablecer zoom"
            >
              100%
            </button>
          </div>

          <div className="flex items-center space-x-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('interactive')}
              className={`p-2 rounded ${
                viewMode === 'interactive'
                  ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400'
                  : 'hover:bg-white dark:hover:bg-neutral-700'
              }`}
              title="Modo interactivo"
            >
              <FaMousePointer className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('presentation')}
              className={`p-2 rounded ${
                viewMode === 'presentation'
                  ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400'
                  : 'hover:bg-white dark:hover:bg-neutral-700'
              }`}
              title="Modo presentación"
            >
              <FaHandPaper className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar en árbol..."
              className="pl-9 pr-4 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 w-48"
            />
            <FaSearch className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportSVG}
            className="px-3 py-2 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center space-x-2"
            title="Exportar como SVG"
          >
            <FaDownload className="w-4 h-4" />
            <span className="hidden sm:inline">SVG</span>
          </button>
          <button
            onClick={handleExportPNG}
            className="px-3 py-2 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center space-x-2"
            title="Exportar como PNG"
          >
            <FaDownload className="w-4 h-4" />
            <span className="hidden sm:inline">PNG</span>
          </button>
          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title="Pantalla completa"
          >
            {isFullscreen ? <FaCompress className="w-4 h-4" /> : <FaExpand className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Tree Visualization Area */}
      <div 
        ref={treeContainerRef}
        className="flex-1 relative overflow-hidden"
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="absolute inset-0">
          <Tree
            ref={treeRef}
            data={renderedTreeData}
            orientation="vertical"
            translate={translation}
            scaleExtent={{ min: 0.1, max: 3 }}
            zoom={zoom}
            renderCustomNodeElement={renderCustomNode}
            pathFunc="step"
            pathClassFunc={() => (theme === 'dark' ? 'tree-link-dark' : 'tree-link-light')}
            collapsible={true}
            initialDepth={2}
            separation={{ siblings: 1.5, nonSiblings: 2 }}
            nodeSize={{ x: 200, y: 100 }}
          />
        </div>

        {/* Zoom and position indicator */}
        <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-3 py-2 rounded-lg">
          <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
          <div className="mt-1">
            {viewMode === 'interactive' ? '🖱️ Arrastrar para mover' : '👆 Modo presentación'}
          </div>
        </div>

        {/* Node info panel */}
        {selectedNode && (
          <div className="absolute top-4 left-4 max-w-xs bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-neutral-900 dark:text-white">
                Detalles del Nodo
              </h4>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Objetivo
                </div>
                <code className="font-mono text-sm text-neutral-900 dark:text-white break-all">
                  {selectedNode.goal}
                </code>
              </div>
              
              <div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Estado
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded ${
                    selectedNode.status === 'success' ? 'bg-green-500' :
                    selectedNode.status === 'fail' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`} />
                  <span className="text-sm">
                    {selectedNode.status === 'success' ? 'Éxito' :
                     selectedNode.status === 'fail' ? 'Falla' :
                     'Pendiente'}
                  </span>
                </div>
              </div>
              
              <div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Nivel de Recursión
                </div>
                <div className="text-sm">{selectedNode.level}</div>
              </div>
              
              {selectedNode.metadata && (
                <>
                  {selectedNode.metadata.ruleUsed && (
                    <div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Regla Usada
                      </div>
                      <code className="font-mono text-sm">
                        {selectedNode.metadata.ruleUsed}
                      </code>
                    </div>
                  )}
                </>
              )}
              
              {selectedNode.bindings && Object.keys(selectedNode.bindings).length > 0 && (
                <div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Unificaciones
                  </div>
                  <div className="space-y-1">
                    {Object.entries(selectedNode.bindings).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <code className="font-mono text-xs bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded">
                          {key} = {value}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tree Stats */}
      <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>Nodos: {countNodes(renderedTreeData)}</span>
          <span>Profundidad máxima: {getMaxDepth(renderedTreeData)}</span>
          <span>Nodos exitosos: {countNodesByStatus(renderedTreeData, 'success')}</span>
          <span>Nodos fallidos: {countNodesByStatus(renderedTreeData, 'fail')}</span>
        </div>
        <div>
          {highlightedNodes.size > 0 && (
            <span className="text-primary-600 dark:text-primary-400">
              {highlightedNodes.size} coincidencia(s)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions
const extractFunctor = (goal = '') => {
  const trimmed = String(goal).trim();
  const match = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
  return match ? match[1] : null;
};

const countFunctorOccurrences = (node, functor) => {
  if (!node || !functor) return 0;

  let total = extractFunctor(node.goal) === functor ? 1 : 0;
  if (node.children) {
    node.children.forEach((child) => {
      total += countFunctorOccurrences(child, functor);
    });
  }
  return total;
};

const detectRecursionFunctor = (node) => {
  if (!node) return null;

  const root = node.goal === 'query' && node.children?.length ? node.children[0] : node;
  const candidate = extractFunctor(root.goal);
  if (!candidate) return null;

  return countFunctorOccurrences(root, candidate) > 1 ? candidate : null;
};

const pickMainRootChild = (root) => {
  if (!root?.children?.length) return null;

  const ranked = root.children
    .filter((child) => child.status !== 'fail')
    .map((child) => {
      const functor = extractFunctor(child.goal);
      const recursiveScore = functor ? countFunctorOccurrences(child, functor) * 5 : 0;
      return {
        child,
        score: countNodes(child) + recursiveScore,
      };
    })
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.child || root.children[0];
};

const buildRecursiveFocusedTree = (tree) => {
  if (!tree) return null;

  const sourceRoot = tree.goal === 'query' ? pickMainRootChild(tree) : tree;
  if (!sourceRoot) return tree;

  const functor = detectRecursionFunctor(sourceRoot);
  if (!functor) return tree;

  const transform = (node) => {
    const children = node.children || [];
    const recursiveChildren = children.filter((child) => extractFunctor(child.goal) === functor);
    const mainRecursiveChild = recursiveChildren[0] || null;

    // Keep successful/meaningful side steps and the main recursive descent.
    const sideSteps = children.filter(
      (child) => child !== mainRecursiveChild && child.status !== 'fail'
    );

    const newChildren = [...sideSteps];
    if (mainRecursiveChild) {
      newChildren.push(transform(mainRecursiveChild));
    }

    return {
      ...node,
      children: newChildren,
    };
  };

  const focusedRoot = transform(sourceRoot);

  if (tree.goal === 'query') {
    return {
      ...tree,
      children: [focusedRoot],
      status: focusedRoot.status,
    };
  }

  return focusedRoot;
};

const isRecursionBaseCase = (node, recursionFunctor) => {
  if (!recursionFunctor || extractFunctor(node.goal) !== recursionFunctor) return false;

  const hasRecursiveChild = (node.children || []).some(
    (child) => extractFunctor(child.goal) === recursionFunctor
  );

  return !hasRecursiveChild && node.status === 'success';
};

const countNodes = (node) => {
  let count = 1;
  if (node.children) {
    node.children.forEach(child => {
      count += countNodes(child);
    });
  }
  return count;
};

const getMaxDepth = (node, currentDepth = 0) => {
  let maxDepth = currentDepth;
  if (node.children) {
    node.children.forEach(child => {
      const childDepth = getMaxDepth(child, currentDepth + 1);
      maxDepth = Math.max(maxDepth, childDepth);
    });
  }
  return maxDepth;
};

const countNodesByStatus = (node, status, count = 0) => {
  if (node.status === status) {
    count++;
  }
  if (node.children) {
    node.children.forEach(child => {
      count = countNodesByStatus(child, status, count);
    });
  }
  return count;
};

export default TreeVisualization;