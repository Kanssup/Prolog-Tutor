const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const TempFileManager = require('./fileManager');
const PrologProcessPool = require('./prologPool');
const QueryCache = require('./queryCache');
const { humanizarVariables, parseTraceToTree } = require('./prologParser');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize core services
const fileManager = new TempFileManager();
const processPool = new PrologProcessPool({ poolSize: 5 });
const queryCache = new QueryCache({ maxSize: 100 });

function splitTopLevelArgs(argsText = '') {
  const args = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < argsText.length; i += 1) {
    const ch = argsText[i];
    if (ch === '(') depth += 1;
    if (ch === ')') depth = Math.max(0, depth - 1);

    if (ch === ',' && depth === 0) {
      args.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  if (current.trim()) args.push(current.trim());
  return args;
}

function extractPredicateIndicatorFromClause(rawClause = '') {
  const clause = String(rawClause).trim().replace(/\.+\s*$/, '');
  const head = clause.split(':-')[0].trim();
  const headMatch = head.match(/^([a-z][A-Za-z0-9_]*)\s*(?:\((.*)\))?$/);
  if (!headMatch) return null;

  const [, name, argsText] = headMatch;
  const arity = argsText ? splitTopLevelArgs(argsText).length : 0;
  return { name, arity };
}

function normalizeClauseText(clause = '') {
  return String(clause).trim().replace(/\.+\s*$/, '');
}

function extractCommandAndArg(query = '') {
  const match = query.trim().match(/^\s*(?:[a-zA-Z_][A-Za-z0-9_]*\s*:\s*)?([a-zA-Z_][A-Za-z0-9_]*)\s*\((.*)\)\s*\.?\s*$/s);
  if (!match) return null;
  return {
    command: match[1].toLowerCase(),
    arg: match[2].trim(),
  };
}

function removeMatchingClauses(code = '', predicateIndicator, onlyFirst = false, exactClause = null) {
  if (!predicateIndicator) return code;

  const { name, arity } = predicateIndicator;
  const lines = code.split('\n');
  const output = [];
  let removedOne = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const normalizedLine = normalizeClauseText(trimmed);
    const lineIndicator = extractPredicateIndicatorFromClause(normalizedLine);

    if (!lineIndicator) {
      output.push(line);
      continue;
    }

    const samePredicate = lineIndicator.name === name && lineIndicator.arity === arity;
    if (!samePredicate) {
      output.push(line);
      continue;
    }

    if (exactClause && normalizeClauseText(exactClause) !== normalizedLine) {
      output.push(line);
      continue;
    }

    if (onlyFirst && removedOne) {
      output.push(line);
      continue;
    }

    removedOne = true;
  }

  return output.join('\n');
}

function insertClauseAtPredicateStart(code = '', predicateIndicator, clauseLine = '') {
  if (!predicateIndicator || !clauseLine) return `${code.trimEnd()}\n${clauseLine}\n`;

  const { name, arity } = predicateIndicator;
  const lines = code.split('\n');
  let insertIndex = -1;

  for (let i = 0; i < lines.length; i += 1) {
    const indicator = extractPredicateIndicatorFromClause(normalizeClauseText(lines[i]));
    if (indicator && indicator.name === name && indicator.arity === arity) {
      insertIndex = i;
      break;
    }
  }

  if (insertIndex === -1) {
    return `${code.trimEnd()}\n${clauseLine}\n`;
  }

  const out = [...lines];
  out.splice(insertIndex, 0, clauseLine);
  return out.join('\n');
}

function isMutableQuery(query = '') {
  return /^\s*(?:[a-zA-Z_][A-Za-z0-9_]*\s*:\s*)?(asserta?|assertz|retract|retractall|abolish)\s*\(/i.test(query.trim());
}

function prepareCodeForQuery(code = '', query = '') {
  const parsed = extractCommandAndArg(query);
  if (!parsed) {
    return {
      codeToRun: code,
      updatedCodeOnSuccess: null,
      mutable: isMutableQuery(query),
    };
  }

  const { command, arg } = parsed;
  const mutable = isMutableQuery(query);
  if (!mutable) {
    return {
      codeToRun: code,
      updatedCodeOnSuccess: null,
      mutable: false,
    };
  }

  const isAssert = ['assert', 'asserta', 'assertz'].includes(command);
  const isRetract = command === 'retract';
  const isRetractAll = command === 'retractall';
  const isAbolish = command === 'abolish';

  let indicator = null;
  let assertedClause = null;

  if (isAssert || isRetract || isRetractAll) {
    assertedClause = normalizeClauseText(arg);
    indicator = extractPredicateIndicatorFromClause(assertedClause);
  }

  if (isAbolish) {
    const abolishMatch = arg.match(/^\s*([a-z][A-Za-z0-9_]*)\s*\/\s*(\d+)\s*$/);
    if (abolishMatch) {
      indicator = {
        name: abolishMatch[1],
        arity: Number(abolishMatch[2]),
      };
    }
  }

  let codeToRun = code;
  let updatedCodeOnSuccess = code;

  if (indicator) {
    const indicatorRegex = new RegExp(`\\b${indicator.name}\\s*\\/\\s*${indicator.arity}\\b`);
    const dynamicLine = `:- dynamic ${indicator.name}/${indicator.arity}.`;

    if (!indicatorRegex.test(codeToRun)) {
      codeToRun = `${dynamicLine}\n${codeToRun}`;
      updatedCodeOnSuccess = `${dynamicLine}\n${updatedCodeOnSuccess}`;
    }
  }

  if (isAssert && assertedClause) {
    const clauseLine = `${assertedClause}.`;
    if (!updatedCodeOnSuccess.includes(clauseLine)) {
      if (command === 'asserta') {
        updatedCodeOnSuccess = insertClauseAtPredicateStart(updatedCodeOnSuccess, indicator, clauseLine);
      } else {
        updatedCodeOnSuccess = `${updatedCodeOnSuccess.trimEnd()}\n${clauseLine}\n`;
      }
    }
  }

  if (isRetract && indicator) {
    updatedCodeOnSuccess = removeMatchingClauses(updatedCodeOnSuccess, indicator, true, assertedClause);
  }

  if (isRetractAll && indicator) {
    updatedCodeOnSuccess = removeMatchingClauses(updatedCodeOnSuccess, indicator, false, null);
  }

  if (isAbolish && indicator) {
    updatedCodeOnSuccess = removeMatchingClauses(updatedCodeOnSuccess, indicator, false, null);
    const dynamicRegex = new RegExp(`^\\s*:-\\s*dynamic\\s+${indicator.name}\\s*\\/\\s*${indicator.arity}\\s*\\.\\s*$`, 'gm');
    updatedCodeOnSuccess = updatedCodeOnSuccess.replace(dynamicRegex, '');
  }

  return {
    codeToRun,
    updatedCodeOnSuccess: `${updatedCodeOnSuccess.trim()}\n`,
    mutable: true,
  };
}

function cleanConsoleOutput(stdout = '') {
  const lines = String(stdout)
    .split('\n')
    .map((line) => line.trimEnd());

  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    return trimmed !== 'true.';
  });

  return filtered.join('\n').trim();
}

function extractSnapshotFromStdout(stdout = '') {
  const beginMarker = '__PT_SNAPSHOT_BEGIN__';
  const endMarker = '__PT_SNAPSHOT_END__';

  const start = stdout.indexOf(beginMarker);
  if (start === -1) {
    return { stdoutWithoutSnapshot: stdout, snapshotCode: null };
  }

  const end = stdout.indexOf(endMarker, start + beginMarker.length);
  if (end === -1) {
    return { stdoutWithoutSnapshot: stdout, snapshotCode: null };
  }

  const before = stdout.slice(0, start);
  const snapshot = stdout.slice(start + beginMarker.length, end).trim();
  const after = stdout.slice(end + endMarker.length);

  return {
    stdoutWithoutSnapshot: `${before}${after}`,
    snapshotCode: snapshot || '',
  };
}

function extractPrologErrorSummary(stderr = '') {
  const lines = String(stderr).split('\n').map((line) => line.trim()).filter(Boolean);
  const firstErrorLine = lines.find((line) => line.startsWith('ERROR:'));
  if (!firstErrorLine) return null;
  return firstErrorLine.replace(/^ERROR:\s*/, '').trim();
}

function sanitizeRuntimeFilename(name = '') {
  const trimmed = String(name || '').trim();
  if (!trimmed) return null;
  const base = path.basename(trimmed);
  if (!base || base === '.' || base === '..') return null;
  return base;
}

async function writeRuntimeFiles(runtimeFiles = []) {
  if (!Array.isArray(runtimeFiles) || runtimeFiles.length === 0) return;

  const filesDir = process.env.PROLOG_FILES_DIR || path.join(__dirname, 'prolog_files');
  await fs.promises.mkdir(filesDir, { recursive: true });

  for (const file of runtimeFiles) {
    const name = sanitizeRuntimeFilename(file?.name);
    if (!name) continue;

    const content = typeof file?.content === 'string' ? file.content : '';
    const targetPath = path.join(filesDir, name);
    await fs.promises.writeFile(targetPath, content, 'utf8');
  }
}

function extractTellTargets(code = '') {
  const targets = new Set();
  const tellRegex = /\btell\s*\(\s*'([^']+)'\s*\)/gi;
  let match;

  while ((match = tellRegex.exec(code)) !== null) {
    const raw = (match[1] || '').trim();
    if (!raw || raw.toLowerCase() === 'user') continue;
    // Restrict to basename so no path traversal can be requested from code.
    const name = path.basename(raw);
    if (!name) continue;
    targets.add(name);
  }

  return [...targets];
}

async function collectRuntimeFiles(code = '') {
  const filesDir = process.env.PROLOG_FILES_DIR || path.join(__dirname, 'prolog_files');
  const targets = extractTellTargets(code);
  if (targets.length === 0) return [];

  const maxFiles = 10;
  const maxBytes = 200 * 1024;
  const snapshots = [];

  for (const filename of targets.slice(0, maxFiles)) {
    const targetPath = path.join(filesDir, filename);

    try {
      const stats = await fs.promises.stat(targetPath);
      if (!stats.isFile()) continue;

      const bytesToRead = Math.min(stats.size, maxBytes);
      const handle = await fs.promises.open(targetPath, 'r');
      const buffer = Buffer.alloc(bytesToRead);
      await handle.read(buffer, 0, bytesToRead, 0);
      await handle.close();

      snapshots.push({
        name: filename,
        content: buffer.toString('utf8'),
        truncated: stats.size > maxBytes,
        size: stats.size,
        lastModified: stats.mtime.toISOString(),
      });
    } catch (_error) {
      // Non-blocking: if file does not exist yet, execution result should still be returned.
    }
  }

  return snapshots;
}

// Middlewares
app.use(helmet()); // Security headers
app.use(cors()); // Allow frontend requests
app.use(compression()); // Response compression
app.use(express.json({ limit: '1mb' })); // JSON body parsing with size limit

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      fileManager: fileManager.getStats(),
      processPool: processPool.getStats(),
      queryCache: queryCache.getStats()
    }
  };
  
  res.json(health);
});

// Stats endpoint (admin)
app.get('/api/stats', (req, res) => {
  res.json({
    fileManager: fileManager.getStats(),
    processPool: processPool.getStats(),
    queryCache: queryCache.getStats(),
    uptime: process.uptime()
  });
});

// Optimized query execution
async function executeQueryOptimized(code, query, input = '', runtimeFiles = []) {
  const startTime = Date.now();
  const preparation = prepareCodeForQuery(code, query);
  const codeToRun = preparation.codeToRun;
  const mutableQuery = preparation.mutable;
  const hasInteractiveInput = typeof input === 'string' && input.length > 0;
  
  // 1. Check cache first
  const cachedResult = (mutableQuery || hasInteractiveInput)
    ? null
    : await queryCache.get(codeToRun, query);
  if (cachedResult) {
    console.log(`[Execution] Cache hit for query: ${query}`);
    return {
      ...cachedResult,
      cached: true,
      executionTime: Date.now() - startTime
    };
  }
  
  console.log(`[Execution] Cache miss for query: ${query}`);
  
  let fileInfo = null;
  let processInfo = null;
  
  try {
    // 1.5 Materialize optional runtime files (e.g. letra.txt) before running query.
    await writeRuntimeFiles(runtimeFiles);

    // 2. Create temporary file
    fileInfo = await fileManager.createTempFile(codeToRun);
    
    // 3. Acquire process from pool
    processInfo = await processPool.acquireWithTimeout(100);
    
    // 4. Execute query with timeout
    const result = await processPool.executeQuery(
      processInfo,
      fileInfo.filepath,
      query,
      30000, // 30 second timeout for complex queries
      { input }
    );

    const prologErrorSummary = extractPrologErrorSummary(result.stderr || '');
    if (prologErrorSummary) {
      throw new Error(`Prolog runtime error: ${prologErrorSummary}`);
    }
    
    // 5. Parse trace to tree
    const traceLimpio = humanizarVariables(result.stderr);
    const stdoutLimpio = humanizarVariables(result.stdout || '');
    const { stdoutWithoutSnapshot } = extractSnapshotFromStdout(stdoutLimpio);
    const stdoutFiltrado = cleanConsoleOutput(stdoutWithoutSnapshot);
    const arbolJSON = parseTraceToTree(traceLimpio);
    const hasExplicitFalse = /(^|\n)\s*false\.\s*($|\n)/m.test(stdoutFiltrado);
    
    const executionResult = {
      success: !hasExplicitFalse,
      tree: arbolJSON,
      consoleOutput: cleanConsoleOutput(stdoutWithoutSnapshot),
      traceOutput: traceLimpio,
      executionTime: result.executionTime,
      processId: processInfo.id,
      cached: false,
      updatedCode: !hasExplicitFalse ? preparation.updatedCodeOnSuccess : null,
    };

    if (!hasExplicitFalse) {
      executionResult.runtimeFiles = await collectRuntimeFiles(code);
    }
    
    // 6. Cache the result (async, don't wait)
    if (!mutableQuery && !hasInteractiveInput) {
      queryCache.set(codeToRun, query, executionResult).catch(err => {
        console.warn(`[Execution] Failed to cache result: ${err.message}`);
      });
    }
    
    return executionResult;
    
  } catch (error) {
    console.error(`[Execution] Error: ${error.message}`);
    throw error;
    
  } finally {
    // 7. Cleanup resources
    if (fileInfo) {
      fileManager.markForDeletion(fileInfo.id);
    }
    
    if (processInfo) {
      processPool.release(processInfo);
    }
  }
}

// Main execution endpoint
app.post('/api/execute', async (req, res) => {
  const { code, query, input = '', runtimeFiles = [] } = req.body;

  if (!code || !query) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: code and query'
    });
  }

  if (typeof input !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid input field: must be a string'
    });
  }

  if (!Array.isArray(runtimeFiles)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid runtimeFiles field: must be an array'
    });
  }

  const maxRuntimeFiles = 20;
  const maxRuntimeFileSize = 200 * 1024;
  if (runtimeFiles.length > maxRuntimeFiles) {
    return res.status(400).json({
      success: false,
      error: `Too many runtime files. Max ${maxRuntimeFiles}.`
    });
  }

  for (const file of runtimeFiles) {
    if (typeof file !== 'object' || file === null) {
      return res.status(400).json({
        success: false,
        error: 'Invalid runtime file entry: each item must be an object'
      });
    }

    const safeName = sanitizeRuntimeFilename(file.name);
    if (!safeName) {
      return res.status(400).json({
        success: false,
        error: 'Invalid runtime file name'
      });
    }

    if (typeof file.content !== 'string') {
      return res.status(400).json({
        success: false,
        error: `Invalid content for runtime file ${safeName}`
      });
    }

    if (Buffer.byteLength(file.content, 'utf8') > maxRuntimeFileSize) {
      return res.status(400).json({
        success: false,
        error: `Runtime file ${safeName} exceeds ${maxRuntimeFileSize} bytes`
      });
    }
  }

  // Validate input size
  if (code.length > 10000 || query.length > 1000 || input.length > 20000) {
    return res.status(400).json({
      success: false,
      error: 'Input too large. Code max 10000 chars, query max 1000 chars, input max 20000 chars.'
    });
  }

  try {
    const result = await executeQueryOptimized(code, query, input, runtimeFiles);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error(`[API] Execution error: ${error.message}`);
    
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error.message.includes('timeout')) {
      statusCode = 408;
      errorMessage = 'Query execution timeout';
    } else if (error.message.includes('File size exceeds')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('Prolog execution failed') || error.message.includes('Prolog runtime error')) {
      statusCode = 400;
      errorMessage = error.message;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Knowledge base management endpoints
app.post('/api/knowledge-bases', async (req, res) => {
  // TODO: Implement knowledge base storage
  res.status(501).json({
    success: false,
    error: 'Not implemented yet'
  });
});

// Graceful shutdown handler
function gracefulShutdown(signal) {
  console.log(`\n[Shutdown] Received ${signal}, shutting down gracefully...`);
  
  const shutdownPromises = [
    fileManager.shutdown(),
    processPool.drain(),
    queryCache.shutdown()
  ];
  
  Promise.allSettled(shutdownPromises)
    .then(() => {
      console.log('[Shutdown] All services stopped');
      process.exit(0);
    })
    .catch(error => {
      console.error('[Shutdown] Error during shutdown:', error);
      process.exit(1);
    });
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const server = app.listen(PORT, () => {
  console.log(`[Server] Prolog Tutor backend running on http://localhost:${PORT}`);
  console.log(`[Server] Process pool initialized with ${processPool.getStats().processesByStatus.total} processes`);
  console.log(`[Server] File manager ready in ${fileManager.getStats().tempDir}`);
  console.log(`[Server] Query cache ready (max ${queryCache.getStats().maxSize} entries)`);
});

// Handle server errors
server.on('error', (error) => {
  console.error(`[Server] Error: ${error.message}`);
  if (error.code === 'EADDRINUSE') {
    console.error(`[Server] Port ${PORT} is already in use`);
    process.exit(1);
  }
});

module.exports = { app, server, fileManager, processPool, queryCache };