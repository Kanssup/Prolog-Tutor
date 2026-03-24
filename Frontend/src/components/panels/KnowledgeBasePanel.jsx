import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  FileText, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  Upload,
  Download
} from 'lucide-react';
import useAppStore from '../../store/appStore';

const KnowledgeBasePanel = () => {
  const { knowledgeBases, addKnowledgeBase, updateKnowledgeBase, deleteKnowledgeBase, setActiveKnowledgeBase, activeKnowledgeBaseId } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const [uploading, setUploading] = useState(false);

  const filteredBases = knowledgeBases.filter(kb => 
    kb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kb.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddKnowledgeBase = () => {
    if (newName.trim()) {
      const newBase = {
        id: Date.now().toString(),
        name: newName.trim(),
        description: '',
        files: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      addKnowledgeBase(newBase);
      setNewName('');
      setIsAdding(false);
    }
  };

  const handleUpdateKnowledgeBase = (id) => {
    if (newName.trim()) {
      updateKnowledgeBase(id, { name: newName.trim() });
      setNewName('');
      setEditingId(null);
    }
  };

  const handleDeleteKnowledgeBase = (id) => {
    if (window.confirm('Are you sure you want to delete this knowledge base?')) {
      deleteKnowledgeBase(id);
    }
  };

  const handleFileUpload = async (kbId, event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const content = await file.text();
      const kb = knowledgeBases.find(k => k.id === kbId);
      const updatedFiles = [...(kb?.files || []), {
        id: Date.now().toString(),
        name: file.name,
        content,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      }];
      
      updateKnowledgeBase(kbId, { files: updatedFiles });
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadFile = (kbId, fileId) => {
    const kb = knowledgeBases.find(k => k.id === kbId);
    const file = kb?.files.find(f => f.id === fileId);
    if (!file) return;

    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (kbId) => {
    setExpandedItems(prev => ({
      ...prev,
      [kbId]: !prev[kbId]
    }));
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Knowledge Bases</h2>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search knowledge bases..."
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
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Enter knowledge base name..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                />
                <button
                  onClick={handleAddKnowledgeBase}
                  className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewName('');
                  }}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredBases.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No knowledge bases found</p>
            <p className="text-sm mt-1">Create your first knowledge base to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBases.map((kb) => (
              <motion.div
                key={kb.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-lg overflow-hidden ${
                  activeKnowledgeBaseId === kb.id
                    ? 'border-primary-500 ring-2 ring-primary-500 ring-opacity-20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div
                  className={`p-4 cursor-pointer transition-colors ${
                    activeKnowledgeBaseId === kb.id
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveKnowledgeBase(kb.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(kb.id);
                        }}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        {expandedItems[kb.id] ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      <Folder className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      <div>
                        {editingId === kb.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateKnowledgeBase(kb.id)}
                              className="p-1 text-green-600 hover:text-green-700"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setNewName('');
                              }}
                              className="p-1 text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <h3 className="font-medium text-gray-800 dark:text-gray-200">{kb.name}</h3>
                        )}
                        {kb.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{kb.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(kb.id);
                          setNewName(kb.name);
                        }}
                        className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteKnowledgeBase(kb.id);
                        }}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>{kb.files?.length || 0} files</span>
                    <span>Updated {new Date(kb.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedItems[kb.id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-700 dark:text-gray-300">Files</h4>
                          <label className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer transition-colors">
                            <Upload className="w-4 h-4" />
                            <span>Upload File</span>
                            <input
                              type="file"
                              accept=".pl,.prolog,.txt"
                              onChange={(e) => handleFileUpload(kb.id, e)}
                              className="hidden"
                              disabled={uploading}
                            />
                          </label>
                        </div>

                        {kb.files?.length === 0 ? (
                          <p className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                            No files uploaded yet
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {kb.files?.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                              >
                                <div className="flex items-center space-x-3">
                                  <File className="w-4 h-4 text-gray-500" />
                                  <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {(file.size / 1024).toFixed(2)} KB • {file.type}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleDownloadFile(kb.id, file.id)}
                                    className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                    title="Download"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                  <button
                                     onClick={() => {
                                       const updatedFiles = (kb.files || []).filter(f => f.id !== file.id);
                                       updateKnowledgeBase(kb.id, { files: updatedFiles });
                                     }}
                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
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
          <span>{knowledgeBases.length} knowledge bases</span>
          <span>{knowledgeBases.reduce((acc, kb) => acc + (kb.files?.length || 0), 0)} total files</span>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBasePanel;