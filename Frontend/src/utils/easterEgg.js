/**
 * Easter Egg Utility for Prolog Tutor
 * Handles the special "free(guapo)" → "capture(lesther)" Easter egg
 */

/**
 * Check if the query triggers the Easter egg
 * @param {string} code - Prolog code (not used currently, but kept for future extensions)
 * @param {string} query - Prolog query to check
 * @returns {Object} Easter egg detection result
 */
export function checkEasterEgg(code, query) {
  // Normalize the query: remove whitespace, convert to lowercase
  const normalizedQuery = query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/\.$/, ''); // Remove trailing period if present
  
  // Check for the Easter egg pattern
  // Matches: free(guapo), free( guapo ), FREE(GUAPO), etc.
  const easterEggPattern = /^free\s*\(\s*guapo\s*\)$/i;
  
  if (easterEggPattern.test(normalizedQuery)) {
    return {
      isEasterEgg: true,
      message: '🎉 ¡Easter egg activado! Has descubierto un secreto especial.',
      response: 'capture(lesther).',
      specialEffect: 'confetti',
      sound: 'chime',
      duration: 7000, // 7 seconds
      theme: 'special',
    };
  }
  
  // Check for variations (future expansion)
  const variations = [
    'free(guapo).',
    'free( guapo ).',
    'FREE(GUAPO)',
    'free(guapo)',
  ];
  
  if (variations.includes(normalizedQuery)) {
    return {
      isEasterEgg: true,
      message: '🎉 ¡Easter egg activado!',
      response: 'capture(lesther).',
      specialEffect: 'confetti',
      sound: 'chime',
      duration: 5000,
      theme: 'special',
    };
  }
  
  // No Easter egg detected
  return {
    isEasterEgg: false,
    message: '',
    response: '',
  };
}

/**
 * Create confetti effect for Easter egg
 * @param {HTMLElement} container - Container element for confetti
 * @param {number} duration - Duration in milliseconds
 */
export function createConfettiEffect(container, duration = 5000) {
  if (!container) return;
  
  const colors = [
    '#8b5cf6', // Purple
    '#0ea5e9', // Blue
    '#22c55e', // Green
    '#f59e0b', // Amber
    '#ec4899', // Pink
  ];
  
  const confettiCount = 150;
  const confettiPieces = [];
  
  // Create confetti pieces
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'absolute w-2 h-2 rounded-full';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.top = '-20px';
    confetti.style.opacity = '0.9';
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    confetti.style.zIndex = '9999';
    
    container.appendChild(confetti);
    confettiPieces.push(confetti);
    
    // Animate confetti
    const animation = confetti.animate(
      [
        {
          transform: `translate(0, 0) rotate(0deg)`,
          opacity: 1,
        },
        {
          transform: `translate(${Math.random() * 100 - 50}px, ${window.innerHeight + 100}px) rotate(${Math.random() * 720}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: duration + Math.random() * 2000,
        easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
      }
    );
    
    // Remove confetti after animation
    animation.onfinish = () => {
      confetti.remove();
    };
  }
  
  // Clean up any remaining confetti after duration
  setTimeout(() => {
    confettiPieces.forEach((confetti) => {
      if (confetti.parentNode) {
        confetti.remove();
      }
    });
  }, duration + 2000);
}

/**
 * Play Easter egg sound
 * @param {string} soundType - Type of sound to play
 */
export function playEasterEggSound(soundType = 'chime') {
  // In a real implementation, you would play actual audio files
  // For now, we'll use the Web Audio API to generate a chime
  
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configure the chime sound
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
    
    // Clean up
    setTimeout(() => {
      oscillator.disconnect();
      gainNode.disconnect();
    }, 1000);
  } catch (error) {
    console.warn('Could not play Easter egg sound:', error);
    // Fallback: just log that we would play a sound
    console.log('🎵 Easter egg sound would play here');
  }
}

/**
 * Create Easter egg notification
 * @param {Object} easterEgg - Easter egg data from checkEasterEgg
 * @param {Function} onClose - Callback when notification closes
 * @returns {HTMLElement} Notification element
 */
export function createEasterEggNotification(easterEgg, onClose = () => {}) {
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 z-50 max-w-md';
  notification.innerHTML = `
    <div class="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-2xl p-4 animate-pulse border-2 border-white/30">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <span class="text-2xl">🎉</span>
          <div>
            <h3 class="font-bold text-white text-lg">¡Easter Egg Descubierto!</h3>
            <p class="text-white/90 text-sm">${easterEgg.message}</p>
            <div class="mt-2 p-2 bg-black/20 rounded">
              <code class="text-white font-mono">${easterEgg.response}</code>
            </div>
          </div>
        </div>
        <button class="text-white/80 hover:text-white text-xl" aria-label="Cerrar">
          ×
        </button>
      </div>
      <div class="mt-3 text-xs text-white/70">
        Has activado ${easterEggCount + 1} Easter egg(s) en esta sesión
      </div>
    </div>
  `;
  
  // Add close button handler
  const closeButton = notification.querySelector('button');
  closeButton.addEventListener('click', () => {
    notification.remove();
    onClose();
  });
  
  // Auto-remove after duration
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
      onClose();
    }
  }, easterEgg.duration);
  
  return notification;
}

/**
 * Get Easter egg count from localStorage
 * @returns {number} Easter egg count
 */
export function getEasterEggCount() {
  try {
    return parseInt(localStorage.getItem('prolog-tutor-easter-egg-count') || '0');
  } catch {
    return 0;
  }
}

/**
 * Increment Easter egg count in localStorage
 * @returns {number} New count
 */
export function incrementEasterEggCount() {
  const count = getEasterEggCount() + 1;
  localStorage.setItem('prolog-tutor-easter-egg-count', count.toString());
  return count;
}

/**
 * Reset Easter egg count
 */
export function resetEasterEggCount() {
  localStorage.removeItem('prolog-tutor-easter-egg-count');
}

/**
 * Check if user has discovered any Easter eggs
 * @returns {boolean} True if Easter eggs have been discovered
 */
export function hasDiscoveredEasterEggs() {
  return getEasterEggCount() > 0;
}

/**
 * Get Easter egg achievement level
 * @returns {string} Achievement level
 */
export function getEasterEggAchievement() {
  const count = getEasterEggCount();
  
  if (count === 0) return 'Novato';
  if (count === 1) return 'Descubridor';
  if (count <= 3) return 'Cazador de Secretos';
  if (count <= 5) return 'Maestro de los Easter Eggs';
  return 'Leyenda de Prolog';
}

export default {
  checkEasterEgg,
  createConfettiEffect,
  playEasterEggSound,
  createEasterEggNotification,
  getEasterEggCount,
  incrementEasterEggCount,
  resetEasterEggCount,
  hasDiscoveredEasterEggs,
  getEasterEggAchievement,
};