const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { humanizarVariables, parseTraceToTree } = require('./prologParser');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors()); // Permite peticiones desde el frontend
app.use(express.json()); // Permite leer JSON en el body de la petición


// Función que envuelve la ejecución de Prolog en una Promesa, para esperar a que termine y obtener el trace completo
function ejecutarProlog(codigoProlog, consulta) {
    return new Promise((resolve, reject) => {
        // 1. Crear un archivo temporal único para esta petición
        const tempFileName = `temp_${Date.now()}.pl`;
        const tempFilePath = path.join(__dirname, 'prolog', tempFileName);
        
        // Guardamos el código enviado por el usuario
        fs.writeFileSync(tempFilePath, codigoProlog);

        const swipl = spawn('swipl', ['-q', '--no-tty'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let traceData = '';

        // Capturamos el trace
        swipl.stderr.on('data', (data) => {
            traceData += data.toString();
        });

        // Cuando Prolog termina
        swipl.on('close', (code) => {
            // Limpieza: borramos el archivo temporal
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }

            if (code !== 0 && traceData.trim() === '') {
                return reject(new Error("Error al ejecutar Prolog"));
            }

            try {
                // 2. Limpiamos y convertimos a JSON
                const traceLimpio = humanizarVariables(traceData);
                const arbolJSON = parseTraceToTree(traceLimpio);
                resolve(arbolJSON);
            } catch (error) {
                reject(error);
            }
        });

        // 3. Comandos a ejecutar
        // Usamos el archivo temporal que acabamos de crear
        const comandos = [
            "leash(-all).",
            "visible(+all).",
            `consult('${tempFilePath.replace(/\\/g, '/')}').`, 
            "trace.",
            `${consulta}.`,
            "notrace.",
            "halt."
        ];

        swipl.stdin.write(comandos.join('\n'));
        swipl.stdin.end();
    });
}

// ENDPOINTS 

// Ruta para comprobar que el servidor está vivo
app.get('/api/status', (req, res) => {
    res.json({ status: 'OK', message: 'Servidor Prolog funcionando' });
});

// Ruta principal para generar el árbol
app.post('/api/generar-arbol', async (req, res) => {
    const { codigo, consulta } = req.body;

    if (!codigo || !consulta) {
        return res.status(400).json({ 
            error: 'Falta el "codigo" o la "consulta" en el cuerpo de la petición' 
        });
    }

    try {
        const arbol = await ejecutarProlog(codigo, consulta);
        res.json({ 
            success: true, 
            arbol: arbol 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            error: 'Ocurrió un error al procesar el código Prolog' 
        });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});