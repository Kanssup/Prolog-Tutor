
//Transforma variables internas de Prolog (_1234) en letras legibles (A, B, C...)

function humanizarVariables(text) {
    const variablesMap = new Map();
    let variableCount = 0;
    
    const generarNombre = (index) => {
        const char = String.fromCharCode(65 + (index % 26));
        const num = Math.floor(index / 26);
        return num > 0 ? `${char}${num}` : char;
    };

    return text.replace(/_([G0-9]+)/g, (match) => {
        if (!variablesMap.has(match)) {
            variablesMap.set(match, generarNombre(variableCount++));
        }
        return variablesMap.get(match);
    });
}

// Convierte el trace (texto secuencial) en un árbol JSON (jerárquico)

function parseTraceToTree(traceText) {
    const lines = traceText.split('\n');

    // Raíz virtual para agrupar todas las consultas/top goals.
    const root = { level: -1, goal: 'Root', status: 'pending', children: [] };

    // Pila de activación real: el último elemento representa el contexto actual.
    // Cada nodo guarda _traceLevel para emparejar puertos de forma robusta.
    let activePath = [root];
    const allNodes = [];

    // Regex para capturar: Puerto, Nivel y Meta.
    const regex = /(Call|Exit|Fail|Redo):\s*\(\s*(\d+)\s*\)\s*(.*)/;

    const cleanGoal = (rawGoal) => rawGoal.replace(/\s*\?$/, '').trim();

    const findLastIndex = (arr, predicate) => {
        for (let i = arr.length - 1; i >= 0; i -= 1) {
            if (predicate(arr[i])) return i;
        }
        return -1;
    };

    const findLatestNodeByLevel = (level, goal) => {
        for (let i = allNodes.length - 1; i >= 0; i -= 1) {
            const n = allNodes[i];
            if (n._traceLevel === level && (!goal || n.goal === goal || n._originalGoal === goal)) {
                return n;
            }
        }
        return null;
    };

    lines.forEach((line) => {
        const match = line.match(regex);
        if (!match) return;

        const [, port, levelStr, rawGoal] = match;
        const level = parseInt(levelStr, 10);
        const goal = cleanGoal(rawGoal);

        if (port === 'Call') {
            // Si el nivel no es más profundo, subimos hasta encontrar el padre correcto.
            while (
                activePath.length > 1 &&
                activePath[activePath.length - 1]._traceLevel >= level
            ) {
                activePath.pop();
            }

            const parent = activePath[activePath.length - 1];
            const newNode = {
                level,
                _traceLevel: level,
                _originalGoal: goal,
                goal,
                status: 'pending',
                children: [],
            };

            parent.children.push(newNode);
            allNodes.push(newNode);
            activePath.push(newNode);
            return;
        }

        // Para Exit/Fail/Redo, buscamos el nodo activo más reciente en ese nivel.
        let idx = findLastIndex(activePath, (n) => n._traceLevel === level);
        let node = idx >= 0 ? activePath[idx] : null;

        if (!node) {
            // Fallback para traces incompletos o desordenados.
            node = findLatestNodeByLevel(level, goal);
            idx = node ? findLastIndex(activePath, (n) => n === node) : -1;
        }

        if (!node) return;

        if (port === 'Exit') {
            node.status = 'success';
            node.goal = goal;

            // Al salir, volvemos al padre del nodo cerrado.
            if (idx >= 0) {
                activePath = activePath.slice(0, idx);
                if (activePath.length === 0) activePath = [root];
            }
            return;
        }

        if (port === 'Fail') {
            if (node.status !== 'success') {
                node.status = 'fail';
                node.goal = goal || node.goal;
            }

            // Al fallar, también se cierra ese frame y se vuelve al padre.
            if (idx >= 0) {
                activePath = activePath.slice(0, idx);
                if (activePath.length === 0) activePath = [root];
            }
            return;
        }

        if (port === 'Redo') {
            // Redo reactiva el frame para explorar alternativas.
            node.status = 'pending';
            node.goal = goal || node.goal;

            if (idx >= 0) {
                activePath = activePath.slice(0, idx + 1);
            }
        }
    });

    return root.children;
}

module.exports = { 
    humanizarVariables,
    parseTraceToTree
};