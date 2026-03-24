import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { executeQuery, getHealth, getStats } from '../utils/apiClient';
import { checkEasterEgg } from '../utils/easterEgg';
import { applyTheme, getInitialTheme, saveTheme } from '../themes/colors';
import accessibility from '../utils/accessibility';

function isInternalExecutionGoal(goal = '') {
  const normalized = String(goal || '').trim().toLowerCase();

  if (!normalized) return false;

  // Hide only runtime plumbing injected by the backend for read/get0 isolation.
  return (
    normalized.includes('setup_call_cleanup(') ||
    normalized.includes('open_string("",') ||
    (normalized.includes('set_stream(') && normalized.includes('alias(pt_input)')) ||
    normalized.includes('current_input(<stream>') ||
    normalized.includes('set_input(pt_input)') ||
    normalized.includes('close(pt_input)') ||
    normalized.includes('call(user:(set_input(')
  );
}

function removeInternalExecutionNodes(rawNode) {
  if (!rawNode) return null;

  const processNode = (node) => {
    if (!node) return [];

    const rawChildren = Array.isArray(node.children) ? node.children : [];
    const normalizedChildren = rawChildren.flatMap(processNode);

    if (isInternalExecutionGoal(node.goal)) {
      // Drop internal wrapper nodes but keep user-facing descendants.
      return normalizedChildren;
    }

    return [
      {
        ...node,
        children: normalizedChildren,
      },
    ];
  };

  if (Array.isArray(rawNode)) {
    return rawNode.flatMap(processNode);
  }

  const normalized = processNode(rawNode);
  if (normalized.length === 0) return null;
  if (normalized.length === 1) return normalized[0];
  return normalized;
}

/**
 * Main application store for Prolog Tutor
 * Manages global state with persistence
 */
const useAppStore = create(
  persist(
    (set, get) => ({
      // ===== THEME & UI STATE =====
      theme: getInitialTheme(),
      sidebarOpen: true,
      panelStates: {
        knowledgeBase: false,
        agents: false,
        console: false,
      },
      layout: {
        editor: 40,
        visualization: 60,
      },
      
      // ===== CODE & EXECUTION STATE =====
      code: 'padre(juan, maria).\npadre(maria, pedro).\nabuelo(X, Y) :- padre(X, Z), padre(Z, Y).',
      runtimeCodeShadow: '',
      query: 'abuelo(juan, pedro)',
      queryInput: '',
      files: [],
      currentFile: null,
      unsavedChanges: false,
      
      // ===== EXECUTION STATE =====
      treeData: null,
      isExecuting: false,
      currentStep: 0,
      totalSteps: 0,
      executionSpeed: 1, // 1x normal speed
      executionHistory: [],
      breakpoints: new Set(),
      
      // ===== KNOWLEDGE BASE STATE =====
      knowledgeBases: [],
      examples: [
        {
          id: 'family-tree',
          name: 'Árbol Genealógico',
          code: 'padre(juan, maria).\npadre(maria, pedro).\nmadre(ana, maria).\nabuelo(X, Y) :- padre(X, Z), padre(Z, Y).\nabuela(X, Y) :- madre(X, Z), padre(Z, Y).',
          query: 'abuelo(juan, X)',
          category: 'Básico',
          difficulty: 'Fácil',
          description: 'Ejemplo básico de relaciones familiares y recursividad.',
        },
        {
          id: 'list-operations',
          name: 'Operaciones con Listas',
          code: 'miembro(X, [X|_]).\nmiembro(X, [_|Cola]) :- miembro(X, Cola).\n\nconcatenar([], L, L).\nconcatenar([X|L1], L2, [X|L3]) :- concatenar(L1, L2, L3).\n\nlongitud([], 0).\nlongitud([_|Cola], N) :- longitud(Cola, M), N is M + 1.',
          query: 'miembro(pedro, [juan, maria, pedro])',
          category: 'Listas',
          difficulty: 'Intermedio',
          description: 'Operaciones comunes con listas en Prolog.',
        },
        {
          id: 'arithmetic',
          name: 'Aritmética y Recursividad',
          code: 'factorial(0, 1).\nfactorial(N, F) :- N > 0, N1 is N - 1, factorial(N1, F1), F is N * F1.\n\nfibonacci(0, 0).\nfibonacci(1, 1).\nfibonacci(N, F) :- N > 1, N1 is N - 1, N2 is N - 2, fibonacci(N1, F1), fibonacci(N2, F2), F is F1 + F2.',
          query: 'factorial(5, X)',
          category: 'Matemáticas',
          difficulty: 'Intermedio',
          description: 'Ejemplos de recursividad con cálculos matemáticos.',
        },
      ],
      currentKB: null,
      
      // ===== AGENT STATE =====
      agents: {
        explanation: { enabled: true, detailLevel: 'detailed' },
        hint: { enabled: true, autoTrigger: false },
        debugging: { enabled: true, severity: 'all' },
        optimization: { enabled: false },
      },
      agentResponses: [],
      // Agent instances for AgentPanel
      agentInstances: [],
      activeAgentId: null,
      
      // ===== EASTER EGG STATE =====
      easterEggTriggered: false,
      easterEggCount: 0,
      
      // ===== SYSTEM STATE =====
      backendHealth: null,
      stats: null,
      errors: [],
      consoleLogs: [],
      executionProgress: 0,
      
      // ===== ACTIONS =====
      
      // Theme actions
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        applyTheme(newTheme);
        saveTheme(newTheme);
        accessibility.announceThemeChange(newTheme);
      },
      
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
        saveTheme(theme);
      },
      
      // UI actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      togglePanel: (panelName) =>
        set((state) => {
          const newState = !state.panelStates[panelName];
          accessibility.announcePanelToggle(panelName, newState);
          return {
            panelStates: {
              ...state.panelStates,
              [panelName]: newState,
            },
          };
        }),
      
      setLayout: (newLayout) => set({ layout: newLayout }),
      
      // Code actions
      setCode: (code) => set({ code, runtimeCodeShadow: '', unsavedChanges: true }),
      
      setQuery: (query) => set({ query }),
      setQueryInput: (queryInput) => set({ queryInput }),
      
      loadExample: (example) => {
        set({
          code: example.code,
          runtimeCodeShadow: '',
          query: example.query,
          // Examples are templates, not saved files.
          currentFile: null,
          unsavedChanges: false,
        });
      },

      createFile: (filename) => {
        const { code, files } = get();
        const requestedName = (filename || '').trim() || `program-${Date.now()}.pl`;

        const existingNames = new Set(files.map((file) => file.name));
        let finalName = requestedName;
        if (existingNames.has(finalName)) {
          const dotIndex = requestedName.lastIndexOf('.');
          const hasExt = dotIndex > 0;
          const base = hasExt ? requestedName.slice(0, dotIndex) : requestedName;
          const ext = hasExt ? requestedName.slice(dotIndex) : '';

          let suffix = 1;
          while (existingNames.has(`${base} (${suffix})${ext}`)) {
            suffix += 1;
          }
          finalName = `${base} (${suffix})${ext}`;
        }

        const newFile = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: finalName,
          code,
          lastModified: new Date().toISOString(),
        };

        set({
          files: [...files, newFile],
          currentFile: newFile.id,
          unsavedChanges: false,
        });
      },
      
      saveFile: (filename) => {
        const { code, files, currentFile } = get();

        const existingFile = currentFile ? files.find((file) => file.id === currentFile) : null;

        if (existingFile) {
          const updatedFiles = files.map((file) =>
            file.id === currentFile
              ? {
                  ...file,
                  name: filename || file.name,
                  code,
                  lastModified: new Date().toISOString(),
                }
              : file
          );

          set({
            files: updatedFiles,
            currentFile,
            unsavedChanges: false,
          });
          return;
        }

        const newFile = {
          id: Date.now().toString(),
          name: filename,
          code,
          lastModified: new Date().toISOString(),
        };

        set({
          files: [...files, newFile],
          currentFile: newFile.id,
          unsavedChanges: false,
        });
      },
      
      loadFile: (fileId) => {
        const { files } = get();
        const file = files.find((f) => f.id === fileId);
        if (file) {
          set({
            code: file.code,
            runtimeCodeShadow: '',
            currentFile: fileId,
            unsavedChanges: false,
          });
        }
      },
      
      deleteFile: (fileId) => {
        const { files, currentFile, code } = get();
        const newFiles = files.filter((f) => f.id !== fileId);

        if (currentFile !== fileId) {
          set({ files: newFiles });
          return;
        }

        const fallbackFile = newFiles[0] || null;
        set({
          files: newFiles,
          currentFile: fallbackFile ? fallbackFile.id : null,
          code: fallbackFile ? fallbackFile.code : code,
          runtimeCodeShadow: '',
          unsavedChanges: false,
        });
      },
      
      // Execution actions
      executeQuery: async () => {
        const { code, query, queryInput, files, currentFile } = get();
        const normalizedQuery = query.trim().replace(/\.+\s*$/, '');
        const effectiveCode = code;

        const filesWithCurrentBuffer = files.map((file) => {
          if (currentFile && file.id === currentFile) {
            return {
              ...file,
              code,
            };
          }
          return file;
        });

        const runtimeFilesPayload = filesWithCurrentBuffer
          .filter((file) => typeof file?.name === 'string')
          .map((file) => ({
            name: file.name,
            content: String(file.code || ''),
          }));

        if (!effectiveCode.trim() || !normalizedQuery) {
          set({
            errors: [...get().errors, { message: 'Código o consulta vacíos', type: 'validation' }],
            isExecuting: false,
          });
          return {
            success: false,
            error: 'Código o consulta vacíos',
          };
        }
        
        // Check for Easter egg
        const easterEgg = checkEasterEgg(code, query);
        if (easterEgg.isEasterEgg) {
          get().triggerEasterEgg(easterEgg);
          return;
        }
        
        set({
          isExecuting: true,
          errors: [],
          executionProgress: 0,
          // Clear previous visualization while a new execution is in flight.
          treeData: null,
          currentStep: 0,
          totalSteps: 0,
        });
        accessibility.announceExecutionStart();
        
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          const { isExecuting, executionProgress } = get();
          if (isExecuting && executionProgress < 90) {
            get().setExecutionProgress(executionProgress + 10);
          }
        }, 200);
        
        try {
          const result = await executeQuery(effectiveCode, normalizedQuery, queryInput, runtimeFilesPayload);
          clearInterval(progressInterval);
          get().setExecutionProgress(100);
          
          const hasExecutionPayload =
            result &&
            (
              result.tree ||
              typeof result.consoleOutput === 'string' ||
              typeof result.traceOutput === 'string'
            );

          if (result.success || hasExecutionPayload) {
            const treeData = get().formatTreeData(result.tree);
            const totalSteps = get().countTreeSteps(treeData);
            const consoleLogs = [...get().consoleLogs];
            const runtimeFiles = Array.isArray(result.runtimeFiles) ? result.runtimeFiles : [];
            const nextCode = result.updatedCode || code;

            let synchronizedFiles = [...get().files];

            // If backend mutated predicates (assert/retract/etc), reflect resulting code in the active file.
            if (result.updatedCode && currentFile) {
              const activeIndex = synchronizedFiles.findIndex((file) => file.id === currentFile);
              if (activeIndex !== -1) {
                synchronizedFiles[activeIndex] = {
                  ...synchronizedFiles[activeIndex],
                  code: nextCode,
                  lastModified: new Date().toISOString(),
                };
              }
            }
            for (const runtimeFile of runtimeFiles) {
              if (!runtimeFile?.name) continue;

              const normalizedName = String(runtimeFile.name).trim();
              if (!normalizedName) continue;

              const content = String(runtimeFile.content || '');
              const existingIndex = synchronizedFiles.findIndex((file) => file.name === normalizedName);

              if (existingIndex !== -1) {
                synchronizedFiles[existingIndex] = {
                  ...synchronizedFiles[existingIndex],
                  code: content,
                  lastModified: runtimeFile.lastModified || new Date().toISOString(),
                };
              } else {
                synchronizedFiles.push({
                  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                  name: normalizedName,
                  code: content,
                  lastModified: runtimeFile.lastModified || new Date().toISOString(),
                });
              }
            }

            if (result.consoleOutput && result.consoleOutput.trim()) {
              consoleLogs.unshift({
                id: `${Date.now()}-stdout`,
                type: 'success',
                source: 'prolog',
                message: 'Salida completa de Prolog (stdout)',
                data: result.consoleOutput,
                timestamp: new Date().toISOString(),
              });
            }

            if (result.success === false) {
              consoleLogs.unshift({
                id: `${Date.now()}-no-solution`,
                type: 'info',
                source: 'prolog',
                message: 'Consulta sin soluciones (false).',
                data: result.consoleOutput || 'false.',
                timestamp: new Date().toISOString(),
              });
            }

            if (result.traceOutput && result.traceOutput.trim()) {
              consoleLogs.unshift({
                id: `${Date.now()}-trace`,
                type: 'info',
                source: 'trace',
                message: 'Traza completa de ejecución',
                data: result.traceOutput,
                timestamp: new Date().toISOString(),
              });
            }

            set({
              treeData,
              currentStep: 0,
              totalSteps,
              code: nextCode,
              runtimeCodeShadow: '',
              unsavedChanges:
                (result.updatedCode && result.updatedCode !== code) || get().unsavedChanges,
              files: synchronizedFiles,
              consoleLogs: consoleLogs.slice(0, 100),
              panelStates: {
                ...get().panelStates,
                console: true,
              },
              executionHistory: [
                {
                  timestamp: new Date().toISOString(),
                  code,
                  query: normalizedQuery,
                  result,
                  treeData,
                },
                ...get().executionHistory.slice(0, 9), // Keep last 10
              ],
              isExecuting: false,
            });
            
            accessibility.announceExecutionComplete();
            
            // Add to knowledge base if successful
            if (result.success && get().currentKB) {
              get().addToKnowledgeBase(get().currentKB, {
                id: Date.now().toString(),
                name: `Query ${new Date().toLocaleTimeString()}`,
                code,
                query,
                result,
                timestamp: new Date().toISOString(),
                type: 'query',
              });
            }

            return result;
          } else {
            set({
              errors: [...get().errors, { message: result.error || 'Execution failed', type: 'execution' }],
              isExecuting: false,
            });
            accessibility.announceExecutionError(result.error || 'Error desconocido');

            return result;
          }
        } catch (error) {
          clearInterval(progressInterval);
          set({
            errors: [...get().errors, { message: error.message, type: 'network' }],
            isExecuting: false,
          });
          accessibility.announceExecutionError(error.message);

          return {
            success: false,
            error: error.message,
          };
        }
      },
      
      cancelExecution: () => {
        set({ isExecuting: false });
      },
      
      setCurrentStep: (step) => {
        const { totalSteps } = get();
        const newStep = Math.max(0, Math.min(step, totalSteps - 1));
        set({ currentStep: newStep });
      },
      
      nextStep: () => {
        const { currentStep, totalSteps } = get();
        if (currentStep < totalSteps - 1) {
          set({ currentStep: currentStep + 1 });
        }
      },
      
      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 });
        }
      },
      
      setExecutionSpeed: (speed) => {
        set({ executionSpeed: Math.max(0.1, Math.min(5, speed)) });
      },
      
      // Tree formatting helper
      formatTreeData: (node) => {
        if (!node) return null;

        const cleanedTree = removeInternalExecutionNodes(node);
        if (!cleanedTree) return null;

        let stepCounter = 0;

        const formatNode = (n) => ({
          id: `${n?.level ?? 0}-${n?.goal ?? 'goal'}-${Date.now()}-${Math.random()}`,
          goal: String(n?.goal ?? 'goal'),
          // react-d3-tree uses `name` as the canonical node label field.
          name: String(n?.goal ?? 'goal'),
          status: n.status || 'pending',
          level: n.level || 0,
          bindings: n.bindings || {},
          children: (n.children || []).map(formatNode),
          metadata: {
            executionTime: n.metadata?.executionTime || 0,
            ruleUsed: n.metadata?.ruleUsed || null,
            port: n.metadata?.port || 'call',
            // Assign stable sequential steps for playback controls.
            step: n.metadata?.step ?? stepCounter++,
          },
        });

        // Backend can return an array of root nodes; normalize it for the tree component.
        if (Array.isArray(cleanedTree)) {
          if (cleanedTree.length === 0) return null;
          if (cleanedTree.length === 1) return formatNode(cleanedTree[0]);

          return {
            id: `root-${Date.now()}`,
            goal: 'query',
            name: 'query',
            status: 'pending',
            level: 0,
            bindings: {},
            children: cleanedTree.map(formatNode),
            metadata: {
              executionTime: 0,
              ruleUsed: null,
              port: 'call',
              step: stepCounter++,
            },
          };
        }

        return formatNode(cleanedTree);
      },
      
      countTreeSteps: (node) => {
        if (!node) return 0;

        let count = 1; // Count the current node
        
        if (node.children && node.children.length > 0) {
          node.children.forEach((child) => {
            count += get().countTreeSteps(child);
          });
        }
        
        return count;
      },
      
      // Knowledge base actions
      createKnowledgeBase: (name, description = '') => {
        const newKB = {
          id: Date.now().toString(),
          name,
          description,
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          files: [],
        };
        
        set({
          knowledgeBases: [...get().knowledgeBases, newKB],
          currentKB: newKB.id,
        });
        
        return newKB;
      },
      
      addToKnowledgeBase: (kbId, entry) => {
        const { knowledgeBases } = get();
        const updatedKBs = knowledgeBases.map((kb) => {
          if (kb.id === kbId) {
            return {
              ...kb,
              files: [...(kb.files || []), entry],
              modified: new Date().toISOString(),
            };
          }
          return kb;
        });
        
        set({ knowledgeBases: updatedKBs });
      },
      
      deleteKnowledgeBase: (kbId) => {
        const { knowledgeBases, currentKB } = get();
        const newKBs = knowledgeBases.filter((kb) => kb.id !== kbId);
        
        set({
          knowledgeBases: newKBs,
          currentKB: currentKB === kbId ? null : currentKB,
        });
      },
      
      // Agent actions
      toggleAgent: (agentName) => {
        set((state) => ({
          agents: {
            ...state.agents,
            [agentName]: {
              ...state.agents[agentName],
              enabled: !state.agents[agentName].enabled,
            },
          },
        }));
      },
      
      addAgentResponse: (response) => {
        set((state) => ({
          agentResponses: [response, ...state.agentResponses.slice(0, 49)], // Keep last 50
        }));
      },
      
      clearAgentResponses: () => {
        set({ agentResponses: [] });
      },
      
      // Agent instances actions for AgentPanel
      addAgent: (agent) => {
        set((state) => ({
          agentInstances: [...state.agentInstances, agent],
        }));
      },
      
      updateAgent: (id, updates) => {
        set((state) => ({
          agentInstances: state.agentInstances.map(agent =>
            agent.id === id ? { ...agent, ...updates, updatedAt: new Date().toISOString() } : agent
          ),
        }));
      },
      
      deleteAgent: (id) => {
        set((state) => ({
          agentInstances: state.agentInstances.filter(agent => agent.id !== id),
          activeAgentId: state.activeAgentId === id ? null : state.activeAgentId,
        }));
      },
      
      setActiveAgent: (id) => {
        set({ activeAgentId: id });
      },
      
      // Easter egg actions
      triggerEasterEgg: (easterEgg) => {
        set((state) => ({
          easterEggTriggered: true,
          easterEggCount: state.easterEggCount + 1,
          agentResponses: [
            {
              type: 'easter-egg',
              message: easterEgg.message,
              response: easterEgg.response,
              timestamp: new Date().toISOString(),
            },
            ...state.agentResponses,
          ],
        }));
        
        accessibility.announceEasterEgg();
        
        // Auto-reset after 10 seconds
        setTimeout(() => {
          set({ easterEggTriggered: false });
        }, 10000);
      },
      
      // System actions
      checkBackendHealth: async () => {
        try {
          const health = await getHealth();
          set({ backendHealth: health });
          accessibility.announceBackendStatus(health.status);
          return health;
        } catch (error) {
          set({
            backendHealth: { status: 'unhealthy', error: error.message },
            errors: [...get().errors, { message: 'Backend health check failed', type: 'health' }],
          });
          accessibility.announceBackendStatus('unhealthy');
          return null;
        }
      },
      
      fetchStats: async () => {
        try {
          const stats = await getStats();
          set({ stats });
          return stats;
        } catch (error) {
          console.error('Failed to fetch stats:', error);
          return null;
        }
      },
      
      addError: (error) => {
        set((state) => ({
          errors: [{ message: error.message, type: 'user', timestamp: new Date().toISOString() }, ...state.errors.slice(0, 9)],
        }));
      },
      
      clearErrors: () => {
        set({ errors: [] });
      },
      
      // Console actions
      addConsoleLog: (log) => {
        set((state) => ({
          consoleLogs: [
            { ...log, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) },
            ...state.consoleLogs.slice(0, 99), // Keep last 100 logs
          ],
        }));
      },
      
      clearConsoleLogs: () => {
        set({ consoleLogs: [] });
      },
      
      setExecutionProgress: (progress) => {
        set({ executionProgress: Math.max(0, Math.min(100, progress)) });
      },
      
      // Reset actions
      resetExecution: () => {
        set({
          treeData: null,
          currentStep: 0,
          totalSteps: 0,
          executionHistory: [],
        });
      },
      
      resetAll: () => {
        set({
          code: '',
          runtimeCodeShadow: '',
          query: '',
          queryInput: '',
          treeData: null,
          isExecuting: false,
          currentStep: 0,
          totalSteps: 0,
          executionHistory: [],
          errors: [],
          agentResponses: [],
          easterEggTriggered: false,
        });
      },
    }),
    {
      name: 'prolog-tutor-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        panelStates: state.panelStates,
        layout: state.layout,
        code: state.code,
        query: state.query,
        queryInput: state.queryInput,
        files: state.files,
        currentFile: state.currentFile,
        knowledgeBases: state.knowledgeBases,
        examples: state.examples,
        currentKB: state.currentKB,
        agents: state.agents,
        easterEggCount: state.easterEggCount,
      }),
    }
  )
);

export default useAppStore;