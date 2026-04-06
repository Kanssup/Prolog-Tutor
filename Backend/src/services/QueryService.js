/**
 * Query Service for Prolog-Tutor
 * Handles query execution business logic
 * 
 * This service is stateless and receives dependencies via constructor injection.
 */

const path = require('path');
const fs = require('fs');
const { humanizarVariables, parseTraceToTree } = require('../../prologParser');
const executionConstants = require('../constants/execution');
const serverConstants = require('../constants/server');
const logger = require('../config/logger');

class QueryService {
  /**
   * Create a QueryService with injected dependencies
   * @param {Object} dependencies - Injected dependencies
   * @param {Object} dependencies.processPool - Process pool instance
   * @param {Object} dependencies.fileManager - File manager instance
   * @param {Object} dependencies.queryCache - Query cache instance
   */
  constructor({ processPool, fileManager, queryCache }) {
    this.processPool = processPool;
    this.fileManager = fileManager;
    this.queryCache = queryCache;
  }

  /**
   * Execute a Prolog query with the given code
   * @param {Object} params - Query parameters
   * @param {string} params.code - Prolog code
   * @param {string} params.query - Prolog query
   * @param {string} [params.input=''] - Interactive input
   * @param {Array} [params.runtimeFiles=[]] - Runtime files
   * @returns {Promise<Object>} Execution result
   */
  async executeQuery({ code, query, input = '', runtimeFiles = [] }) {
    const startTime = Date.now();
    const prepResult = this.prepareCodeForQuery(code, query);
    const codeToRun = prepResult.codeToRun;
    const mutableQuery = prepResult.mutable;
    const hasInteractiveInput = typeof input === 'string' && input.length > 0;

    // Check cache first
    const cachedResult = (mutableQuery || hasInteractiveInput)
      ? null
      : await this.queryCache.get(codeToRun, query);

    if (cachedResult) {
      logger.debug('Cache hit for query', { query: query.substring(0, serverConstants.MAX_CACHE_LOG_LENGTH) });
      return {
        ...cachedResult,
        cached: true,
        executionTime: Date.now() - startTime
      };
    }

    logger.debug('Cache miss for query', { query: query.substring(0, serverConstants.MAX_CACHE_LOG_LENGTH) });

    let fileInfo = null;
    let processInfo = null;

    try {
      // Materialize runtime files
      await this.writeRuntimeFiles(runtimeFiles);

      // Create temporary file
      fileInfo = await this.fileManager.createTempFile(codeToRun);

      // Acquire process
      processInfo = await this.processPool.acquireWithTimeout(
        executionConstants.PROCESS_ACQUIRE_TIMEOUT_MS
      );

      // Execute query
      const result = await this.processPool.executeQuery(
        processInfo,
        fileInfo.filepath,
        query,
        executionConstants.QUERY_TIMEOUT_MS,
        { input }
      );

      // Check for Prolog errors
      const prologErrorSummary = this.extractPrologErrorSummary(result.stderr || '');
      if (prologErrorSummary) {
        throw new Error(`Prolog runtime error: ${prologErrorSummary}`);
      }

      // Parse results
      const traceLimpio = humanizarVariables(result.stderr);
      const stdoutLimpio = humanizarVariables(result.stdout || '');
      const { stdoutWithoutSnapshot } = this.extractSnapshotFromStdout(stdoutLimpio);
      const stdoutFiltrado = this.cleanConsoleOutput(stdoutWithoutSnapshot);
      const arbolJSON = parseTraceToTree(traceLimpio);
      const hasExplicitFalse = /(^|\n)\s*false\.\s*($|\n)/m.test(stdoutFiltrado);

      const executionResult = {
        success: !hasExplicitFalse,
        tree: arbolJSON,
        consoleOutput: this.cleanConsoleOutput(stdoutWithoutSnapshot),
        traceOutput: traceLimpio,
        executionTime: result.executionTime,
        processId: processInfo.id,
        cached: false,
        updatedCode: !hasExplicitFalse ? prepResult.updatedCodeOnSuccess : null
      };

      // Collect runtime files on success
      if (!hasExplicitFalse) {
        executionResult.runtimeFiles = await this.collectRuntimeFiles(code);
      }

      // Cache result async
      if (!mutableQuery && !hasInteractiveInput) {
        this.queryCache.set(codeToRun, query, executionResult).catch(() => {});
      }

      return executionResult;

    } finally {
      // Cleanup
      if (fileInfo) {
        this.fileManager.markForDeletion(fileInfo.id);
      }
      if (processInfo) {
        this.processPool.release(processInfo);
      }
    }
  }

  // Helper functions extracted from app.js

  splitTopLevelArgs(argsText = '') {
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

  extractPredicateIndicatorFromClause(rawClause = '') {
    const clause = String(rawClause).trim().replace(/\.+\s*$/, '');
    const head = clause.split(':-')[0].trim();
    const headMatch = head.match(/^([a-z][A-Za-z0-9_]*)\s*(?:\((.*)\))?$/);
    if (!headMatch) return null;
    const [, name, argsText] = headMatch;
    const arity = argsText ? this.splitTopLevelArgs(argsText).length : 0;
    return { name, arity };
  }

  normalizeClauseText(clause = '') {
    return String(clause).trim().replace(/\.+\s*$/, '');
  }

  extractCommandAndArg(query = '') {
    const match = query.trim().match(/^\s*(?:[a-zA-Z_][A-Za-z0-9_]*\s*:\s*)?([a-zA-Z_][A-Za-z0-9_]*)\s*\((.*)\)\s*\.?\s*$/s);
    if (!match) return null;
    return { command: match[1].toLowerCase(), arg: match[2].trim() };
  }

  removeMatchingClauses(code = '', predicateIndicator, onlyFirst = false, exactClause = null) {
    if (!predicateIndicator) return code;
    const { name, arity } = predicateIndicator;
    const lines = code.split('\n');
    const output = [];
    let removedOne = false;

    for (const line of lines) {
      const trimmed = line.trim();
      const normalizedLine = this.normalizeClauseText(trimmed);
      const lineIndicator = this.extractPredicateIndicatorFromClause(normalizedLine);
      if (!lineIndicator) { output.push(line); continue; }
      const samePredicate = lineIndicator.name === name && lineIndicator.arity === arity;
      if (!samePredicate) { output.push(line); continue; }
      if (exactClause && this.normalizeClauseText(exactClause) !== normalizedLine) { output.push(line); continue; }
      if (onlyFirst && removedOne) { output.push(line); continue; }
      removedOne = true;
    }
    return output.join('\n');
  }

  insertClauseAtPredicateStart(code = '', predicateIndicator, clauseLine = '') {
    if (!predicateIndicator || !clauseLine) return `${code.trimEnd()}\n${clauseLine}\n`;
    const { name, arity } = predicateIndicator;
    const lines = code.split('\n');
    let insertIndex = -1;
    for (let i = 0; i < lines.length; i += 1) {
      const indicator = this.extractPredicateIndicatorFromClause(this.normalizeClauseText(lines[i]));
      if (indicator && indicator.name === name && indicator.arity === arity) {
        insertIndex = i;
        break;
      }
    }
    if (insertIndex === -1) return `${code.trimEnd()}\n${clauseLine}\n`;
    const out = [...lines];
    out.splice(insertIndex, 0, clauseLine);
    return out.join('\n');
  }

  isMutableQuery(query = '') {
    return /^\s*(?:[a-zA-Z_][A-Za-z0-9_]*\s*:\s*)?(asserta?|assertz|retract|retractall|abolish)\s*\(/i.test(query.trim());
  }

  prepareCodeForQuery(code = '', query = '') {
    const parsed = this.extractCommandAndArg(query);
    if (!parsed) {
      return { codeToRun: code, updatedCodeOnSuccess: null, mutable: this.isMutableQuery(query) };
    }
    const { command, arg } = parsed;
    const mutable = this.isMutableQuery(query);
    if (!mutable) {
      return { codeToRun: code, updatedCodeOnSuccess: null, mutable: false };
    }

    const isAssert = ['assert', 'asserta', 'assertz'].includes(command);
    const isRetract = command === 'retract';
    const isRetractAll = command === 'retractall';
    const isAbolish = command === 'abolish';

    let indicator = null;
    let assertedClause = null;

    if (isAssert || isRetract || isRetractAll) {
      assertedClause = this.normalizeClauseText(arg);
      indicator = this.extractPredicateIndicatorFromClause(assertedClause);
    }

    if (isAbolish) {
      const abolishMatch = arg.match(/^\s*([a-z][A-Za-z0-9_]*)\s*\/\s*(\d+)\s*$/);
      if (abolishMatch) {
        indicator = { name: abolishMatch[1], arity: Number(abolishMatch[2]) };
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
          updatedCodeOnSuccess = this.insertClauseAtPredicateStart(updatedCodeOnSuccess, indicator, clauseLine);
        } else {
          updatedCodeOnSuccess = `${updatedCodeOnSuccess.trimEnd()}\n${clauseLine}\n`;
        }
      }
    }

    if (isRetract && indicator) {
      updatedCodeOnSuccess = this.removeMatchingClauses(updatedCodeOnSuccess, indicator, true, assertedClause);
    }
    if (isRetractAll && indicator) {
      updatedCodeOnSuccess = this.removeMatchingClauses(updatedCodeOnSuccess, indicator, false, null);
    }
    if (isAbolish && indicator) {
      updatedCodeOnSuccess = this.removeMatchingClauses(updatedCodeOnSuccess, indicator, false, null);
      const dynamicRegex = new RegExp(`^\\s*:-\\s*dynamic\\s+${indicator.name}\\s*\\/\\s*${indicator.arity}\\s*\\.\\s*$`, 'gm');
      updatedCodeOnSuccess = updatedCodeOnSuccess.replace(dynamicRegex, '');
    }

    return { codeToRun, updatedCodeOnSuccess: `${updatedCodeOnSuccess.trim()}\n`, mutable: true };
  }

  cleanConsoleOutput(stdout = '') {
    const lines = String(stdout).split('\n').map((line) => line.trimEnd());
    const filtered = lines.filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      return trimmed !== 'true.';
    });
    return filtered.join('\n').trim();
  }

  extractSnapshotFromStdout(stdout = '') {
    const beginMarker = executionConstants.SNAPSHOT_BEGIN;
    const endMarker = executionConstants.SNAPSHOT_END;
    const start = stdout.indexOf(beginMarker);
    if (start === -1) return { stdoutWithoutSnapshot: stdout, snapshotCode: null };
    const end = stdout.indexOf(endMarker, start + beginMarker.length);
    if (end === -1) return { stdoutWithoutSnapshot: stdout, snapshotCode: null };
    const before = stdout.slice(0, start);
    const snapshot = stdout.slice(start + beginMarker.length, end).trim();
    const after = stdout.slice(end + endMarker.length);
    return { stdoutWithoutSnapshot: `${before}${after}`, snapshotCode: snapshot || '' };
  }

  extractPrologErrorSummary(stderr = '') {
    const lines = String(stderr).split('\n').map((line) => line.trim()).filter(Boolean);
    const firstErrorLine = lines.find((line) => line.startsWith('ERROR:'));
    if (!firstErrorLine) return null;
    return firstErrorLine.replace(/^ERROR:\s*/, '').trim();
  }

  sanitizeRuntimeFilename(name = '') {
    const trimmed = String(name || '').trim();
    if (!trimmed) return null;
    const base = path.basename(trimmed);
    if (!base || base === '.' || base === '..') return null;
    return base;
  }

  async writeRuntimeFiles(runtimeFiles = []) {
    if (!Array.isArray(runtimeFiles) || runtimeFiles.length === 0) return;
    const filesDir = process.env.PROLOG_FILES_DIR || path.join(__dirname, '../../prolog_files');
    await fs.promises.mkdir(filesDir, { recursive: true });
    for (const file of runtimeFiles) {
      const name = this.sanitizeRuntimeFilename(file?.name);
      if (!name) continue;
      const content = typeof file?.content === 'string' ? file.content : '';
      const targetPath = path.join(filesDir, name);
      await fs.promises.writeFile(targetPath, content, 'utf8');
    }
  }

  extractTellTargets(code = '') {
    const targets = new Set();
    const tellRegex = /\btell\s*\(\s*'([^']+)'\s*\)/gi;
    let match;
    while ((match = tellRegex.exec(code)) !== null) {
      const raw = (match[1] || '').trim();
      if (!raw || raw.toLowerCase() === 'user') continue;
      const name = path.basename(raw);
      if (!name) continue;
      targets.add(name);
    }
    return [...targets];
  }

  async collectRuntimeFiles(code = '') {
    const filesDir = process.env.PROLOG_FILES_DIR || path.join(__dirname, '../../prolog_files');
    const targets = this.extractTellTargets(code);
    if (targets.length === 0) return [];
    const snapshots = [];
    for (const filename of targets.slice(0, executionConstants.MAX_FILES_TO_COLLECT)) {
      const targetPath = path.join(filesDir, filename);
      try {
        const stats = await fs.promises.stat(targetPath);
        if (!stats.isFile()) continue;
        const bytesToRead = Math.min(stats.size, executionConstants.MAX_FILE_SNAPSHOT_SIZE);
        const handle = await fs.promises.open(targetPath, 'r');
        const buffer = Buffer.alloc(bytesToRead);
        await handle.read(buffer, 0, bytesToRead, 0);
        await handle.close();
        snapshots.push({
          name: filename,
          content: buffer.toString('utf8'),
          truncated: stats.size > executionConstants.MAX_FILE_SNAPSHOT_SIZE,
          size: stats.size,
          lastModified: stats.mtime.toISOString()
        });
      } catch (_error) {
        // Non-blocking
      }
    }
    return snapshots;
  }
}

module.exports = QueryService;
