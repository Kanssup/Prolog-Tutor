/**
 * API Client for Prolog Tutor Backend
 * Handles all communication with the backend API
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Generic fetch wrapper with timeout and error handling
 */
async function fetchWithTimeout(url, options = {}, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `API error: ${response.status} ${response.statusText}`
      );
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: The server took too long to respond');
    }
    throw error;
  }
}

/**
 * Execute a Prolog query
 * @param {string} code - Prolog code
 * @param {string} query - Prolog query
 * @param {string} [input] - Optional stdin-like input for read/get0 predicates
 * @param {Array<{name: string, content: string}>} [runtimeFiles] - Optional auxiliary files to materialize in backend runtime
 * @returns {Promise<Object>} Execution result
 */
export async function executeQuery(code, query, input = '', runtimeFiles = []) {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/execute`, {
      method: 'POST',
      body: JSON.stringify({ code, query, input, runtimeFiles }),
    });

    const data = await response.json();
    
    // Handle backend errors
    if (!data.success) {
      throw new Error(data.error || 'Execution failed');
    }
    
    return data;
  } catch (error) {
    console.error('Execute query error:', error);
    throw error;
  }
}

/**
 * Check backend health
 * @returns {Promise<Object>} Health status
 */
export async function getHealth() {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/health`, {
      method: 'GET',
    }, 5000); // Shorter timeout for health check

    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get backend statistics
 * @returns {Promise<Object>} Statistics
 */
export async function getStats() {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/stats`, {
      method: 'GET',
    });

    return await response.json();
  } catch (error) {
    console.error('Get stats error:', error);
    return null;
  }
}

/**
 * Save knowledge base to backend (future feature)
 * @param {Object} knowledgeBase - Knowledge base data
 * @returns {Promise<Object>} Saved knowledge base
 */
export async function saveKnowledgeBase(knowledgeBase) {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/knowledge-bases`, {
      method: 'POST',
      body: JSON.stringify(knowledgeBase),
    });

    return await response.json();
  } catch (error) {
    console.error('Save knowledge base error:', error);
    throw error;
  }
}

/**
 * Load knowledge base from backend (future feature)
 * @param {string} id - Knowledge base ID
 * @returns {Promise<Object>} Knowledge base data
 */
export async function loadKnowledgeBase(id) {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/knowledge-bases/${id}`, {
      method: 'GET',
    });

    return await response.json();
  } catch (error) {
    console.error('Load knowledge base error:', error);
    throw error;
  }
}

/**
 * List knowledge bases from backend (future feature)
 * @returns {Promise<Array>} List of knowledge bases
 */
export async function listKnowledgeBases() {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/knowledge-bases`, {
      method: 'GET',
    });

    return await response.json();
  } catch (error) {
    console.error('List knowledge bases error:', error);
    throw error;
  }
}

/**
 * Test backend connection
 * @returns {Promise<boolean>} True if backend is reachable
 */
export async function testConnection() {
  try {
    const health = await getHealth();
    return health.status === 'healthy';
  } catch (error) {
    return false;
  }
}

/**
 * Get API base URL
 * @returns {string} API base URL
 */
export function getApiBase() {
  return API_BASE;
}

/**
 * Format execution time for display
 * @param {number} ms - Execution time in milliseconds
 * @returns {string} Formatted time
 */
export function formatExecutionTime(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * Format cache status for display
 * @param {boolean} cached - Whether result was cached
 * @param {number} executionTime - Execution time in ms
 * @returns {Object} Formatted cache info
 */
export function formatCacheInfo(cached, executionTime) {
  if (cached) {
    return {
      text: '⚡ Resultado desde caché',
      color: 'text-green-600 dark:text-green-400',
      icon: '⚡',
      time: formatExecutionTime(executionTime),
    };
  } else {
    return {
      text: '🔄 Ejecutado en backend',
      color: 'text-blue-600 dark:text-blue-400',
      icon: '🔄',
      time: formatExecutionTime(executionTime),
    };
  }
}

export default {
  executeQuery,
  getHealth,
  getStats,
  saveKnowledgeBase,
  loadKnowledgeBase,
  listKnowledgeBases,
  testConnection,
  getApiBase,
  formatExecutionTime,
  formatCacheInfo,
};