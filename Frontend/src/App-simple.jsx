import React, { useState, useEffect } from 'react';

function AppSimple() {
  const [message, setMessage] = useState('Loading...');
  const [backendStatus, setBackendStatus] = useState('Checking backend...');

  useEffect(() => {
    console.log('AppSimple mounted');
    setMessage('React is working!');
    
    // Test backend connection
    fetch('/api/health')
      .then(response => {
        console.log('Backend response status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('Backend data:', data);
        setBackendStatus(`Backend: ${data.status}`);
      })
      .catch(error => {
        console.error('Backend error:', error);
        setBackendStatus(`Error: ${error.message}`);
      });
  }, []);

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1>Prolog Tutor - Simple Test</h1>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginTop: '20px'
      }}>
        <p style={{ fontSize: '18px', color: '#333' }}>{message}</p>
        <p style={{ fontSize: '16px', color: '#666' }}>{backendStatus}</p>
        <button 
          onClick={() => setMessage('Button clicked at ' + new Date().toLocaleTimeString())}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            marginTop: '10px'
          }}
        >
          Test Button
        </button>
      </div>
      <div style={{ marginTop: '30px', fontSize: '14px', color: '#888' }}>
        <p>If you can see this, React is working correctly.</p>
        <p>Check browser console for detailed logs.</p>
      </div>
    </div>
  );
}

export default AppSimple;