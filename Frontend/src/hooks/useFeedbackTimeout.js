import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook for managing feedback timeout with auto-clear
 * Extracted from CodeEditor.jsx
 * 
 * @param {function} setFeedback - Function to set feedback message
 * @param {number} delay - Delay in milliseconds before clearing (default: 1800)
 * @returns {object} { showFeedback, clearFeedback }
 */
export const useFeedbackTimeout = (setFeedback, delay = 1800) => {
  const timeoutRef = useRef(null);

  /**
   * Show feedback message with auto-clear
   * @param {string} message - Feedback message to display
   */
  const showFeedback = useCallback((message) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set the feedback message
    setFeedback(message);
    
    // Set timeout to clear feedback
    timeoutRef.current = setTimeout(() => {
      setFeedback('');
    }, delay);
  }, [setFeedback, delay]);

  /**
   * Clear feedback immediately
   */
  const clearFeedback = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setFeedback('');
  }, [setFeedback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { showFeedback, clearFeedback };
};

/**
 * Legacy function-style feedback hook (for backward compatibility)
 * @param {function} setFeedback - Function to set feedback message
 * @param {number} delay - Delay in milliseconds
 * @returns {object} { showFeedback, clearFeedback }
 */
export const createFeedbackTimeout = (setFeedback, delay = 1800) => {
  const timeoutRef = useRef(null);

  const showFeedback = (message) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setFeedback(message);
    timeoutRef.current = setTimeout(() => {
      setFeedback('');
    }, delay);
  };

  const clearFeedback = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setFeedback('');
  };

  return { showFeedback, clearFeedback };
};

export default useFeedbackTimeout;