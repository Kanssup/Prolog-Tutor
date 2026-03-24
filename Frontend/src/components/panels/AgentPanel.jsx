import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  MessageSquare, 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw,
  Settings,
  Zap,
  Brain,
  Clock,
  BarChart3,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Target,
  Plus,
  Edit2,
  Trash2,
  Search
} from 'lucide-react';
import useAppStore from '../../store/appStore';

const AgentPanel = () => {
  const { 
    agentInstances: agents, 
    addAgent, 
    updateAgent, 
    deleteAgent, 
    setActiveAgent, 
    activeAgentId,
    setQuery,
    executeQuery,
    isExecuting,
    executionProgress
  } = useAppStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const [selectedStrategy, setSelectedStrategy] = useState('depth-first');
  const [maxDepth, setMaxDepth] = useState(10);
  const [timeoutSeconds, setTimeoutSeconds] = useState(30);

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.goal?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const strategies = [
    { id: 'depth-first', name: 'Depth-First Search', description: 'Explores as deep as possible before backtracking' },
    { id: 'breadth-first', name: 'Breadth-First Search', description: 'Explores all nodes at current depth before moving deeper' },
    { id: 'iterative-deepening', name: 'Iterative Deepening', description: 'Combines depth-first with iterative depth limits' },
    { id: 'heuristic', name: 'Heuristic Search', description: 'Uses heuristics to guide search direction' },
    { id: 'random', name: 'Random Search', description: 'Randomly explores search space' }
  ];

  const handleAddAgent = () => {
    if (newName.trim() && newGoal.trim()) {
      const newAgent = {
        id: Date.now().toString(),
        name: newName.trim(),
        goal: newGoal.trim(),
        strategy: selectedStrategy,
        maxDepth,
        timeoutSeconds,
        status: 'idle',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: []
      };
      addAgent(newAgent);
      setNewName('');
      setNewGoal('');
      setIsAdding(false);
    }
  };

  const handleUpdateAgent = (id) => {
    if (newName.trim()) {
      updateAgent(id, { 
        name: newName.trim(),
        goal: newGoal.trim(),
        strategy: selectedStrategy,
        maxDepth,
        timeoutSeconds
      });
      setNewName('');
      setNewGoal('');
      setEditingId(null);
    }
  };

  const handleDeleteAgent = (id) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      deleteAgent(id);
    }
  };

  const handleRunAgent = async (agentId) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    setActiveAgent(agentId);
    updateAgent(agentId, { status: 'running' });

    try {
      setQuery(agent.goal);
      const result = await executeQuery();

      const countNodes = (node) => {
        if (!node) return 0;
        let total = 1;
        (node.children || []).forEach((child) => {
          total += countNodes(child);
        });
        return total;
      };

      const treeSize = countNodes(result?.tree);

      const historyEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        query: agent.goal,
        result: result?.success ? 'Success' : 'Failure',
        treeSize,
        executionTime: result?.executionTime || 0
      };

      const updatedAgent = {
        ...agent,
        status: result?.success ? 'completed' : 'error',
        history: [historyEntry, ...(agent.history || []).slice(0, 9)]
      };

      updateAgent(agentId, updatedAgent);
    } catch (error) {
      updateAgent(agentId, { status: 'error' });
      console.error('Agent execution failed:', error);
    }
  };

  const toggleExpand = (agentId) => {
    setExpandedItems(prev => ({
      ...prev,
      [agentId]: !prev[agentId]
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'text-amber-600 dark:text-amber-400';
      case 'completed': return 'text-emerald-600 dark:text-emerald-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return <Play className="w-4 h-4 animate-pulse" />;
      case 'completed': return <Sparkles className="w-4 h-4" />;
      case 'error': return <Target className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">AI Agents</h2>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Agent</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Agent name..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                />
                <textarea
                  placeholder="Agent goal (Prolog query)..."
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Search Strategy
                    </label>
                    <select
                      value={selectedStrategy}
                      onChange={(e) => setSelectedStrategy(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {strategies.map(strategy => (
                        <option key={strategy.id} value={strategy.id}>
                          {strategy.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Depth
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={maxDepth}
                      onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={timeoutSeconds}
                    onChange={(e) => setTimeoutSeconds(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleAddAgent}
                    className="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    Create Agent
                  </button>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setNewName('');
                      setNewGoal('');
                    }}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredAgents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No agents found</p>
            <p className="text-sm mt-1">Create your first AI agent to automate queries</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAgents.map((agent) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-lg overflow-hidden ${
                  activeAgentId === agent.id
                    ? 'border-primary-500 ring-2 ring-primary-500 ring-opacity-20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div
                  className={`p-4 cursor-pointer transition-colors ${
                    activeAgentId === agent.id
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveAgent(agent.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(agent.id);
                        }}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        {expandedItems[agent.id] ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      <div className={`p-2 rounded-full ${getStatusColor(agent.status)} bg-opacity-20`}>
                        {getStatusIcon(agent.status)}
                      </div>
                      <div>
                        {editingId === agent.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              autoFocus
                            />
                            <textarea
                              value={newGoal}
                              onChange={(e) => setNewGoal(e.target.value)}
                              rows={2}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleUpdateAgent(agent.id)}
                                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setNewName('');
                                  setNewGoal('');
                                }}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="font-medium text-gray-800 dark:text-gray-200">{agent.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-mono">
                              {agent.goal}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRunAgent(agent.id);
                        }}
                        disabled={agent.status === 'running' || isExecuting}
                        className={`p-1.5 rounded ${
                          agent.status === 'running' || isExecuting
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                        }`}
                        title="Run Agent"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(agent.id);
                          setNewName(agent.name);
                          setNewGoal(agent.goal);
                          setSelectedStrategy(agent.strategy);
                          setMaxDepth(agent.maxDepth);
                          setTimeoutSeconds(agent.timeoutSeconds);
                        }}
                        className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAgent(agent.id);
                        }}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <Brain className="w-3 h-3" />
                        <span>{strategies.find(s => s.id === agent.strategy)?.name}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Zap className="w-3 h-3" />
                        <span>Depth: {agent.maxDepth}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{agent.timeoutSeconds}s</span>
                      </span>
                    </div>
                    <span className={`font-medium ${getStatusColor(agent.status)}`}>
                      {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                    </span>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedItems[agent.id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                    >
                      <div className="p-4">
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Execution History</h4>
                          {agent.history?.length === 0 ? (
                            <p className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                              No execution history yet
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {agent.history?.map((entry) => (
                                <div
                                  key={entry.id}
                                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                      {new Date(entry.timestamp).toLocaleString()}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      entry.result === 'Success'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                    }`}>
                                      {entry.result}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono mb-1">
                                    {entry.query}
                                  </p>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                    <span>Tree: {entry.treeSize} nodes</span>
                                    <span>Time: {entry.executionTime}ms</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <BarChart3 className="w-4 h-4 text-primary-600" />
                              <h5 className="font-medium text-gray-700 dark:text-gray-300">Statistics</h5>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Total Runs:</span>
                                <span className="font-medium">{agent.history?.length || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Success Rate:</span>
                                 <span className="font-medium">
                                   {agent.history && Array.isArray(agent.history) && agent.history.length > 0
                                     ? `${Math.round((agent.history.filter(h => h.result === 'Success').length / agent.history.length) * 100)}%`
                                     : '0%'}
                                 </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Avg. Time:</span>
                                 <span className="font-medium">
                                   {agent.history && Array.isArray(agent.history) && agent.history.length > 0
                                     ? `${Math.round(agent.history.reduce((acc, h) => acc + h.executionTime, 0) / agent.history.length)}ms`
                                     : '0ms'}
                                 </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <HelpCircle className="w-4 h-4 text-primary-600" />
                              <h5 className="font-medium text-gray-700 dark:text-gray-300">Strategy Info</h5>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {strategies.find(s => s.id === agent.strategy)?.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{agents.length} agents</span>
          <span>{agents.filter(a => a.status === 'running').length} running</span>
        </div>
      </div>
    </div>
  );
};

export default AgentPanel;