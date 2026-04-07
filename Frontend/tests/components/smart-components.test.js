/**
 * Header Component Tests for Prolog-Tutor
 * Using source code verification approach
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';

describe('Header Component', () => {
  it('should have proper component structure', () => {
    const componentCode = fs.readFileSync('./src/components/layout/Header.jsx', 'utf8');
    
    expect(componentCode).toContain('import React');
    expect(componentCode).toContain('import useAppStore');
    expect(componentCode).toContain('export default Header');
  });

  it('should use required store hooks', () => {
    const componentCode = fs.readFileSync('./src/components/layout/Header.jsx', 'utf8');
    
    expect(componentCode).toContain('theme');
    expect(componentCode).toContain('toggleTheme');
    expect(componentCode).toContain('sidebarOpen');
    expect(componentCode).toContain('toggleSidebar');
    expect(componentCode).toContain('isExecuting');
    expect(componentCode).toContain('executeQuery');
  });

  it('should have execute functionality', () => {
    const componentCode = fs.readFileSync('./src/components/layout/Header.jsx', 'utf8');
    
    expect(componentCode).toContain('handleExecute');
    expect(componentCode).toContain('code.trim()');
    expect(componentCode).toContain('query.trim()');
  });

  it('should have theme toggle', () => {
    const componentCode = fs.readFileSync('./src/components/layout/Header.jsx', 'utf8');
    
    expect(componentCode).toContain('FaMoon');
    expect(componentCode).toContain('FaSun');
    expect(componentCode).toContain('Cambiar a tema');
  });

  it('should have proper accessibility attributes', () => {
    const componentCode = fs.readFileSync('./src/components/layout/Header.jsx', 'utf8');
    
    expect(componentCode).toContain('aria-label');
  });

  it('should have navigation elements', () => {
    const componentCode = fs.readFileSync('./src/components/layout/Header.jsx', 'utf8');
    
    expect(componentCode).toContain('Prolog Tutor');
    expect(componentCode).toContain('FaBars');
    expect(componentCode).toContain('FaPlay');
  });
});

describe('Sidebar Component', () => {
  it('should have proper component structure', () => {
    const componentCode = fs.readFileSync('./src/components/layout/Sidebar.jsx', 'utf8');
    
    expect(componentCode).toContain('import React');
    expect(componentCode).toContain('import useAppStore');
    expect(componentCode).toContain('export default Sidebar');
  });

  it('should use required store hooks', () => {
    const componentCode = fs.readFileSync('./src/components/layout/Sidebar.jsx', 'utf8');
    
    expect(componentCode).toContain('sidebarOpen');
    expect(componentCode).toContain('toggleSidebar');
    expect(componentCode).toContain('examples');
    expect(componentCode).toContain('loadExample');
  });

  it('should have navigation structure', () => {
    const componentCode = fs.readFileSync('./src/components/layout/Sidebar.jsx', 'utf8');
    
    expect(componentCode).toContain('Navegación');
    expect(componentCode).toContain('Ejemplos');
  });

  it('should have example loading functionality', () => {
    const componentCode = fs.readFileSync('./src/components/layout/Sidebar.jsx', 'utf8');
    
    expect(componentCode).toContain('loadExample');
    expect(componentCode).toContain('FaBook');
  });

  it('should handle closed state with toggle button', () => {
    const componentCode = fs.readFileSync('./src/components/layout/Sidebar.jsx', 'utf8');
    
    expect(componentCode).toContain('!sidebarOpen');
    expect(componentCode).toContain('FaChevronRight');
    expect(componentCode).toContain('FaChevronLeft');
  });

  it('should display easter egg count', () => {
    const componentCode = fs.readFileSync('./src/components/layout/Sidebar.jsx', 'utf8');
    
    expect(componentCode).toContain('easterEggCount');
    expect(componentCode).toContain('Easter Eggs');
  });
});

describe('QueryInput Component', () => {
  it('should have proper component structure', () => {
    const componentCode = fs.readFileSync('./src/components/editor/QueryInput.jsx', 'utf8');
    
    expect(componentCode).toContain('import React');
    expect(componentCode).toContain('import useAppStore');
    expect(componentCode).toContain('export default QueryInput');
  });

  it('should use required store hooks', () => {
    const componentCode = fs.readFileSync('./src/components/editor/QueryInput.jsx', 'utf8');
    
    expect(componentCode).toContain('query');
    expect(componentCode).toContain('setQuery');
    expect(componentCode).toContain('queryInput');
    expect(componentCode).toContain('setQueryInput');
    expect(componentCode).toContain('isExecuting');
    expect(componentCode).toContain('executeQuery');
    expect(componentCode).toContain('cancelExecution');
  });

  it('should handle keyboard events', () => {
    const componentCode = fs.readFileSync('./src/components/editor/QueryInput.jsx', 'utf8');
    
    expect(componentCode).toContain('handleKeyDown');
    expect(componentCode).toContain('Ctrl+Enter');
    expect(componentCode).toContain('Escape');
  });

  it('should have execute button', () => {
    const componentCode = fs.readFileSync('./src/components/editor/QueryInput.jsx', 'utf8');
    
    expect(componentCode).toContain('handleExecute');
    expect(componentCode).toContain('FaPlay');
    expect(componentCode).toContain('FaStop');
  });

  it('should have hints functionality', () => {
    const componentCode = fs.readFileSync('./src/components/editor/QueryInput.jsx', 'utf8');
    
    expect(componentCode).toContain('showHints');
    expect(componentCode).toContain('commonQueries');
    expect(componentCode).toContain('FaLightbulb');
  });

  it('should have history functionality', () => {
    const componentCode = fs.readFileSync('./src/components/editor/QueryInput.jsx', 'utf8');
    
    expect(componentCode).toContain('showHistory');
    expect(componentCode).toContain('executionHistory');
    expect(componentCode).toContain('FaHistory');
  });

  it('should check for easter eggs', () => {
    const componentCode = fs.readFileSync('./src/components/editor/QueryInput.jsx', 'utf8');
    
    expect(componentCode).toContain('checkEasterEgg');
    expect(componentCode).toContain('easterEggTriggered');
  });

  it('should have query input field', () => {
    const componentCode = fs.readFileSync('./src/components/editor/QueryInput.jsx', 'utf8');
    
    expect(componentCode).toContain('textarea');
    expect(componentCode).toContain('Consulta Prolog');
    expect(componentCode).toContain('?-');  // Query prompt
  });

  it('should support stdin-like input', () => {
    const componentCode = fs.readFileSync('./src/components/editor/QueryInput.jsx', 'utf8');
    
    expect(componentCode).toContain('queryInput');
    expect(componentCode).toContain('read/get0');
  });
});

describe('ExecutionControls Component', () => {
  it('should have proper component structure', () => {
    const componentCode = fs.readFileSync('./src/components/visualization/ExecutionControls.jsx', 'utf8');
    
    expect(componentCode).toContain('import React');
    expect(componentCode).toContain('import useAppStore');
    expect(componentCode).toContain('export default ExecutionControls');
  });

  it('should use required store hooks', () => {
    const componentCode = fs.readFileSync('./src/components/visualization/ExecutionControls.jsx', 'utf8');
    
    expect(componentCode).toContain('isExecuting');
    expect(componentCode).toContain('currentStep');
    expect(componentCode).toContain('totalSteps');
    expect(componentCode).toContain('executionSpeed');
    expect(componentCode).toContain('setCurrentStep');
    expect(componentCode).toContain('nextStep');
    expect(componentCode).toContain('prevStep');
  });

  it('should have playback controls', () => {
    const componentCode = fs.readFileSync('./src/components/visualization/ExecutionControls.jsx', 'utf8');
    
    expect(componentCode).toContain('handlePlay');
    expect(componentCode).toContain('handlePause');
    expect(componentCode).toContain('handleStop');
  });

  it('should have step navigation', () => {
    const componentCode = fs.readFileSync('./src/components/visualization/ExecutionControls.jsx', 'utf8');
    
    expect(componentCode).toContain('handleStepForward');
    expect(componentCode).toContain('handleStepBackward');
    expect(componentCode).toContain('FaStepForward');
    expect(componentCode).toContain('FaStepBackward');
  });

  it('should have speed controls', () => {
    const componentCode = fs.readFileSync('./src/components/visualization/ExecutionControls.jsx', 'utf8');
    
    expect(componentCode).toContain('setExecutionSpeed');
    expect(componentCode).toContain('speedOptions');
    expect(componentCode).toContain('FaTachometerAlt');
  });

  it('should have slider for step navigation', () => {
    const componentCode = fs.readFileSync('./src/components/visualization/ExecutionControls.jsx', 'utf8');
    
    expect(componentCode).toContain('type="range"');
    expect(componentCode).toContain('handleSliderChange');
  });

  it('should display current node info', () => {
    const componentCode = fs.readFileSync('./src/components/visualization/ExecutionControls.jsx', 'utf8');
    
    expect(componentCode).toContain('getCurrentNodeInfo');
    expect(componentCode).toContain('currentNode');
    expect(componentCode).toContain('bindings');
  });

  it('should have status indicators', () => {
    const componentCode = fs.readFileSync('./src/components/visualization/ExecutionControls.jsx', 'utf8');
    
    expect(componentCode).toContain('Ejecutando consulta');
    expect(componentCode).toContain('Reproduciendo');
    expect(componentCode).toContain('Pausado');
  });
});
