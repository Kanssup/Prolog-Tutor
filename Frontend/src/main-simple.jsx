import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppSimple from './App-simple.jsx'

console.log('main-simple.jsx: Starting React app');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  console.log('Root element found:', rootElement);
  const root = createRoot(rootElement);
  
  root.render(
    <StrictMode>
      <AppSimple />
    </StrictMode>
  );
  
  console.log('React app rendered successfully');
} catch (error) {
  console.error('Error rendering React app:', error);
  document.body.innerHTML = `
    <div style="padding: 40px; font-family: Arial, sans-serif; color: #d32f2f;">
      <h1>Error Loading Application</h1>
      <p><strong>Error:</strong> ${error.message}</p>
      <p>Check browser console for details.</p>
    </div>
  `;
}