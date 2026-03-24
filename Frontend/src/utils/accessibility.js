// Accessibility utilities for screen reader support

class AccessibilityManager {
  constructor() {
    this.liveRegion = null;
    this.init();
  }

  init() {
    // Create live region for screen reader announcements
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.setAttribute('class', 'sr-only');
    document.body.appendChild(this.liveRegion);
  }

  announce(message, priority = 'polite') {
    if (!this.liveRegion) {
      this.init();
    }

    // Update aria-live attribute based on priority
    this.liveRegion.setAttribute('aria-live', priority);

    // Clear previous message
    this.liveRegion.textContent = '';

    // Use setTimeout to ensure screen reader picks up the change
    setTimeout(() => {
      this.liveRegion.textContent = message;
    }, 100);

    // Clear message after announcement
    setTimeout(() => {
      this.liveRegion.textContent = '';
    }, 3000);
  }

  announceUrgent(message) {
    this.announce(message, 'assertive');
  }

  // Common announcements for the application
  announceExecutionStart() {
    this.announce('Ejecución de consulta iniciada');
  }

  announceExecutionComplete() {
    this.announce('Ejecución completada correctamente');
  }

  announceExecutionError(error) {
    this.announceUrgent(`Error en ejecución: ${error}`);
  }

  announceThemeChange(theme) {
    this.announce(`Tema cambiado a ${theme === 'dark' ? 'oscuro' : 'claro'}`);
  }

  announcePanelToggle(panelName, isOpen) {
    const panelNames = {
      knowledgeBase: 'bases de conocimiento',
      agents: 'agentes educativos',
      console: 'historial'
    };
    this.announce(`${isOpen ? 'Mostrando' : 'Ocultando'} ${panelNames[panelName] || panelName}`);
  }

  announceEasterEgg() {
    this.announceUrgent('¡Easter egg activado! ¡Captura a Lester!');
  }

  announceBackendStatus(status) {
    if (status === 'healthy') {
      this.announce('Backend conectado correctamente');
    } else if (status === 'unhealthy') {
      this.announceUrgent('Backend desconectado. Verifica que el servidor esté ejecutándose.');
    }
  }

  // Focus management
  focusElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.focus();
      return true;
    }
    return false;
  }

  focusFirstInteractive() {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    const focusableElements = document.querySelectorAll(focusableSelectors);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      return true;
    }
    return false;
  }

  // Skip to main content
  createSkipLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Saltar al contenido principal';
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-primary-600 focus:rounded-lg';
    
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
      const main = document.querySelector('main');
      if (main) {
        main.id = 'main-content';
      }
    }
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }
}

// Singleton instance
const accessibility = new AccessibilityManager();

export default accessibility;