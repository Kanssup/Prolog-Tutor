import React, { useState, useEffect } from 'react';
import { 
  FaPlay, 
  FaPause, 
  FaStop, 
  FaStepForward, 
  FaStepBackward,
  FaFastForward,
  FaFastBackward,
  FaTachometerAlt,
  FaHistory
} from 'react-icons/fa';
import useAppStore from '../../store/appStore';

const ExecutionControls = () => {
  const {
    isExecuting,
    currentStep,
    totalSteps,
    executionSpeed,
    setCurrentStep,
    nextStep,
    prevStep,
    setExecutionSpeed,
    executionHistory,
    treeData,
  } = useAppStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackInterval, setPlaybackInterval] = useState(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Speed options (multipliers)
  const speedOptions = [
    { label: '0.25x', value: 0.25, icon: '🐌' },
    { label: '0.5x', value: 0.5, icon: '🚶' },
    { label: '1x', value: 1, icon: '🚶‍♂️' },
    { label: '1.5x', value: 1.5, icon: '🚴' },
    { label: '2x', value: 2, icon: '🚗' },
    { label: '3x', value: 3, icon: '🚄' },
    { label: '5x', value: 5, icon: '✈️' },
  ];

  // Handle play/pause
  const handlePlayPause = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  const handlePlay = () => {
    if (currentStep >= totalSteps - 1) {
      setCurrentStep(0);
    }
    
    setIsPlaying(true);
    
    const interval = setInterval(() => {
      const { currentStep: current, totalSteps: total } = useAppStore.getState();
      if (current < total - 1) {
        nextStep();
      } else {
        handlePause();
      }
    }, 1000 / executionSpeed); // Adjust interval based on speed
    
    setPlaybackInterval(interval);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (playbackInterval) {
      clearInterval(playbackInterval);
      setPlaybackInterval(null);
    }
  };

  const handleStop = () => {
    handlePause();
    setCurrentStep(0);
  };

  const handleStepForward = () => {
    handlePause();
    nextStep();
  };

  const handleStepBackward = () => {
    handlePause();
    prevStep();
  };

  const handleJumpToStart = () => {
    handlePause();
    setCurrentStep(0);
  };

  const handleJumpToEnd = () => {
    handlePause();
    setCurrentStep(totalSteps - 1);
  };

  const handleSpeedChange = (speed) => {
    setExecutionSpeed(speed);
    setShowSpeedMenu(false);
    
    // Restart playback with new speed if currently playing
    if (isPlaying) {
      handlePause();
      setTimeout(() => handlePlay(), 10);
    }
  };

  const handleSliderChange = (e) => {
    const newStep = parseInt(e.target.value);
    handlePause();
    setCurrentStep(newStep);
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (playbackInterval) {
        clearInterval(playbackInterval);
      }
    };
  }, [playbackInterval]);

  // Auto-pause when reaching the end
  useEffect(() => {
    if (currentStep >= totalSteps - 1 && isPlaying) {
      handlePause();
    }
  }, [currentStep, totalSteps, isPlaying]);

  // Get current node info
  const getCurrentNodeInfo = () => {
    if (!treeData || currentStep === 0) return null;
    
    let currentNode = null;
    const findNode = (node) => {
      if (node.metadata?.step === currentStep) {
        currentNode = node;
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (findNode(child)) return true;
        }
      }
      return false;
    };
    
    findNode(treeData);
    return currentNode;
  };

  const currentNode = getCurrentNodeInfo();

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      
      {/* Controls Header */}
      <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Control de Ejecución
            </span>
          </div>
          
          {/* Execution Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isExecuting ? 'bg-yellow-500 animate-pulse' :
              isPlaying ? 'bg-green-500' :
              'bg-neutral-300 dark:bg-neutral-600'
            }`} />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {isExecuting ? 'Ejecutando consulta...' :
               isPlaying ? 'Reproduciendo' :
               'Pausado'}
            </span>
          </div>
        </div>
        
        {/* History Indicator */}
        {executionHistory.length > 0 && (
          <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
            <FaHistory className="w-3 h-3" />
            <span>{executionHistory.length} ejecuciones</span>
          </div>
        )}
      </div>

      {/* Main Controls */}
      <div className="p-3">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Paso {currentStep + 1} de {totalSteps}
            </span>
          </div>
          
          <div className="relative">
            <input
              type="range"
              min="0"
              max={Math.max(0, totalSteps - 1)}
              value={currentStep}
              onChange={handleSliderChange}
              className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:dark:border-neutral-800 [&::-webkit-slider-thumb]:shadow"
              disabled={totalSteps === 0}
            />
            
            {/* Step markers */}
            {totalSteps > 1 && totalSteps <= 20 && (
              <div className="absolute top-3 left-0 right-0 flex justify-between px-2">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-1 rounded-full ${
                      i <= currentStep
                        ? 'bg-primary-500'
                        : 'bg-neutral-300 dark:bg-neutral-600'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-3 mb-4">
          {/* Jump to start */}
          <button
            onClick={handleJumpToStart}
            disabled={currentStep === 0 || totalSteps === 0}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Ir al inicio"
          >
            <FaFastBackward className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>

          {/* Step backward */}
          <button
            onClick={handleStepBackward}
            disabled={currentStep === 0 || totalSteps === 0}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Paso anterior"
          >
            <FaStepBackward className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={handlePlayPause}
            disabled={totalSteps === 0 || isExecuting}
            className={`p-3 rounded-full ${
              isPlaying
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-primary-500 hover:bg-primary-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? (
              <FaPause className="w-6 h-6" />
            ) : (
              <FaPlay className="w-6 h-6" />
            )}
          </button>

          {/* Step forward */}
          <button
            onClick={handleStepForward}
            disabled={currentStep >= totalSteps - 1 || totalSteps === 0}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Paso siguiente"
          >
            <FaStepForward className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>

          {/* Jump to end */}
          <button
            onClick={handleJumpToEnd}
            disabled={currentStep >= totalSteps - 1 || totalSteps === 0}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Ir al final"
          >
            <FaFastForward className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>

          {/* Stop */}
          <button
            onClick={handleStop}
            disabled={currentStep === 0 || totalSteps === 0}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Detener y reiniciar"
          >
            <FaStop className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>

        {/* Speed Control */}
        <div className="relative">
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <FaTachometerAlt className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            <span className="text-sm">Velocidad: {executionSpeed}x</span>
          </button>

          {showSpeedMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-10 min-w-[120px]">
              {speedOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSpeedChange(option.value)}
                  className={`w-full text-left px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
                    executionSpeed === option.value
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    <span>{option.icon}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Current Step Info */}
      <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 min-h-[84px] max-h-[128px] overflow-y-auto">
        {currentNode ? (
          <>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                  Paso Actual
                </div>
                <pre className="mt-1 p-2 rounded bg-white/80 dark:bg-neutral-900/70 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm font-mono text-neutral-900 dark:text-white whitespace-pre-wrap break-words">
                  {currentNode.goal}
                </pre>
              </div>
              <div className="text-right">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Estado
                </div>
                <div className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                  currentNode.status === 'success'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : currentNode.status === 'fail'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                }`}>
                  {currentNode.status === 'success' && '✅ Éxito'}
                  {currentNode.status === 'fail' && '❌ Falla'}
                  {currentNode.status === 'pending' && '⏳ Pendiente'}
                </div>
              </div>
            </div>

            {/* Variable bindings if any */}
            {currentNode.bindings && Object.keys(currentNode.bindings).length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Unificaciones:
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(currentNode.bindings).map(([key, value]) => (
                    <span
                      key={key}
                      className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded"
                    >
                      {key} = {value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-between">
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                Paso Actual
              </div>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                Inicia la reproducción para ver detalles del nodo activo.
              </span>
            </div>
            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
              Sin datos
            </span>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts */}
      <div className="px-4 py-1 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center space-x-4">
          <span>Atajos:</span>
          <kbd className="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 rounded">
            Space
          </kbd>
          <span>Play/Pause</span>
          <kbd className="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 rounded">
            ←
          </kbd>
          <span>Anterior</span>
          <kbd className="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 rounded">
            →
          </kbd>
          <span>Siguiente</span>
        </div>
      </div>
    </div>
  );
};

export default ExecutionControls;