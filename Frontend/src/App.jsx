import React, { useState } from 'react';
import Tree from 'react-d3-tree';
import './App.css'; // Asegúrate de tener este archivo para unos estilos básicos

function App() {
  const [codigo, setCodigo] = useState(
    'padre(juan, maria).\npadre(maria, pedro).\nabuelo(X, Y) :- padre(X, Z), padre(Z, Y).'
  );
  const [consulta, setConsulta] = useState('abuelo(juan, pedro)');
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Adaptamos nuestro JSON al formato que espera react-d3-tree
  const formatTreeData = (node) => {
    return {
      name: node.goal,
      attributes: {
        estado: node.status,
        nivel: node.level
      },
      // Recursividad para formatear a los hijos
      children: node.children ? node.children.map(formatTreeData) : []
    };
  };

  const generarArbol = async () => {
    setLoading(true);
    try {
      // Petición a tu backend
      const response = await fetch('http://localhost:3000/api/generar-arbol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, consulta })
      });
      
      const data = await response.json();
      
      if (data.success && data.arbol.length > 0) {
        // Formateamos y guardamos el nodo raíz en el estado
        setTreeData(formatTreeData(data.arbol[0]));
      }
    } catch (error) {
      console.error("Error al conectar con el backend:", error);
      alert("Error al generar el árbol. Asegúrate de que el backend esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  // Renderizador personalizado para pintar los nodos de verde (éxito) o rojo (falla)
  const renderCustomNode = ({ nodeDatum }) => {
    const isSuccess = nodeDatum.attributes.estado === 'success';
    return (
      <g>
        <rect 
          width="160" height="40" x="-80" y="-20" 
          fill={isSuccess ? '#d4edda' : '#f8d7da'} 
          stroke={isSuccess ? '#28a745' : '#dc3545'} 
          strokeWidth="2" rx="5" 
        />
        <text fill="#333" strokeWidth="0" x="0" y="5" textAnchor="middle" style={{ fontFamily: 'monospace', fontSize: '14px' }}>
          {nodeDatum.name}
        </text>
      </g>
    );
  };

  return (
    <div className="App" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '20px', backgroundColor: '#282c34', color: 'white', display: 'flex', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <label>Código Prolog:</label>
          <textarea 
            value={codigo} 
            onChange={e => setCodigo(e.target.value)} 
            rows="5" 
            style={{ fontFamily: 'monospace', padding: '10px' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-start' }}>
          <label>Consulta:</label>
          <input 
            value={consulta} 
            onChange={e => setConsulta(e.target.value)} 
            style={{ fontFamily: 'monospace', padding: '10px', marginBottom: '10px' }}
          />
          <button 
            onClick={generarArbol} 
            disabled={loading}
            style={{ padding: '10px', fontSize: '16px', cursor: 'pointer' }}
          >
            {loading ? 'Generando...' : 'Generar Árbol SLD'}
          </button>
        </div>
      </header>
      
      {/* Contenedor del Árbol */}
      <div style={{ flex: 1, backgroundColor: '#f4f4f9', borderTop: '2px solid #ccc' }}>
        {treeData ? (
          <Tree 
            data={treeData} 
            orientation="vertical"
            renderCustomNodeElement={renderCustomNode}
            pathFunc="step" // Usa líneas rectas con ángulos de 90 grados
            translate={{ x: window.innerWidth / 2, y: 100 }}
            zoomable={true}
            collapsible={true}
          />
        ) : (
          <p style={{ textAlign: 'center', marginTop: '50px', color: '#666' }}>
            Ingresa tu código y consulta para visualizar la deducción lógica.
          </p>
        )}
      </div>
    </div>
  );
}

export default App;