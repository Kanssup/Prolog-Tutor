/**
 * Unit Tests for QueryService.js
 * Tests query execution with mocked dependencies
 */

// Mock dependencies
jest.mock('../../../prologParser', () => ({
  humanizarVariables: jest.fn((text) => text),
  parseTraceToTree: jest.fn((trace) => [{ level: 1, goal: 'test', status: 'success', children: [] }])
}));

jest.mock('../../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

jest.mock('../../../src/constants/execution', () => ({
  QUERY_TIMEOUT_MS: 30000,
  PROCESS_ACQUIRE_TIMEOUT_MS: 5000,
  MAX_FILES_TO_COLLECT: 10,
  MAX_FILE_SNAPSHOT_SIZE: 200 * 1024,
  SNAPSHOT_BEGIN: '__PT_SNAPSHOT_BEGIN__',
  SNAPSHOT_END: '__PT_SNAPSHOT_END__'
}));

jest.mock('../../../src/constants/server', () => ({
  MAX_CACHE_LOG_LENGTH: 100,
  MAX_ERROR_SNIPPET_LENGTH: 200
}));

const QueryService = require('../../../src/services/QueryService');

describe('QueryService', () => {
  let queryService;
  let mockProcessPool;
  let mockFileManager;
  let mockQueryCache;

  const mockProcessInfo = { id: 'proc-1', status: 'available' };
  const mockFileInfo = { id: 'file-123', filepath: '/tmp/test.pl' };

  const mockExecutionResult = {
    stdout: 'X = a',
    stderr: 'Call: (1) member(X, [a, b])\nExit: (1) member(a, [a, b])',
    exitCode: 0,
    executionTime: 100
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockProcessPool = {
      acquireWithTimeout: jest.fn().mockResolvedValue(mockProcessInfo),
      executeQuery: jest.fn().mockResolvedValue(mockExecutionResult),
      release: jest.fn()
    };
    
    mockFileManager = {
      createTempFile: jest.fn().mockResolvedValue(mockFileInfo),
      markForDeletion: jest.fn()
    };
    
    mockQueryCache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true)
    };
    
    queryService = new QueryService({
      processPool: mockProcessPool,
      fileManager: mockFileManager,
      queryCache: mockQueryCache
    });
  });

  describe('executeQuery', () => {
    describe('cache hit', () => {
      it('should return cached result when available', async () => {
        const cachedResult = { success: true, tree: [], cached: false };
        mockQueryCache.get.mockResolvedValue(cachedResult);
        
        const result = await queryService.executeQuery({
          code: 'parent(tom, bob).',
          query: 'parent(tom, X).'
        });
        
        expect(result.cached).toBe(true);
        expect(result.executionTime).toBeDefined();
        expect(mockProcessPool.acquireWithTimeout).not.toHaveBeenCalled();
      });

      it('should skip cache for mutable queries', async () => {
        await queryService.executeQuery({
          code: 'foo(X) :- asserta(bar(X)).',
          query: 'asserta(bar(1)).'
        });
        
        // Mutable queries skip the cache entirely
        expect(mockQueryCache.get).not.toHaveBeenCalled();
        expect(mockProcessPool.acquireWithTimeout).toHaveBeenCalled();
      });
    });

    describe('cache miss', () => {
      it('should create file and acquire process on cache miss', async () => {
        await queryService.executeQuery({
          code: 'parent(tom, bob).',
          query: 'parent(tom, X).'
        });
        
        expect(mockFileManager.createTempFile).toHaveBeenCalled();
        expect(mockProcessPool.acquireWithTimeout).toHaveBeenCalled();
        expect(mockProcessPool.release).toHaveBeenCalled();
      });

      it('should cache result after successful execution', async () => {
        await queryService.executeQuery({
          code: 'member(X, [a, b]).',
          query: 'member(X, [a, b]).'
        });
        
        expect(mockQueryCache.set).toHaveBeenCalled();
      });
    });

    describe('timeout handling', () => {
      it('should throw timeout error and cleanup process', async () => {
        mockProcessPool.acquireWithTimeout.mockRejectedValue(new Error('Process acquisition timeout after 5000ms'));
        
        await expect(queryService.executeQuery({
          code: 'parent(tom, bob).',
          query: 'parent(tom, X).'
        })).rejects.toThrow('timeout');
      });
    });

    describe('error handling', () => {
      it('should extract Prolog error from stderr', async () => {
        mockProcessPool.executeQuery.mockResolvedValue({
          stdout: '',
          stderr: 'ERROR: foo/0: Undefined procedure',
          exitCode: 1,
          executionTime: 100
        });
        
        await expect(queryService.executeQuery({
          code: 'undefined.',
          query: 'foo.'
        })).rejects.toThrow('Prolog runtime error');
      });
    });

    describe('runtime files', () => {
      it('should write runtime files before execution', async () => {
        const runtimeFiles = [{ name: 'test.pl', content: 'test_data(1).' }];
        await queryService.executeQuery({
          code: 'true.',
          query: 'true.',
          runtimeFiles
        });
        
        expect(mockFileManager.createTempFile).toHaveBeenCalled();
      });
    });
  });

  describe('helper methods', () => {
    describe('splitTopLevelArgs', () => {
      it('should split arguments at top level', () => {
        const result = queryService.splitTopLevelArgs('a, b, c');
        expect(result).toEqual(['a', 'b', 'c']);
      });

      it('should respect parentheses depth', () => {
        const result = queryService.splitTopLevelArgs('foo(a, bar(b, c), d)');
        expect(result).toEqual(['foo(a, bar(b, c), d)']);
      });

      it('should handle empty string', () => {
        const result = queryService.splitTopLevelArgs('');
        expect(result).toEqual([]);
      });
    });

    describe('extractPredicateIndicatorFromClause', () => {
      it('should extract name and arity from clause head', () => {
        const result = queryService.extractPredicateIndicatorFromClause('parent(X, Y) :- child(Y, X).');
        expect(result).toEqual({ name: 'parent', arity: 2 });
      });

      it('should handle fact with no body', () => {
        const result = queryService.extractPredicateIndicatorFromClause('parent(tom, bob).');
        expect(result).toEqual({ name: 'parent', arity: 2 });
      });

      it('should handle zero-arity predicate', () => {
        const result = queryService.extractPredicateIndicatorFromClause('hello.');
        expect(result).toEqual({ name: 'hello', arity: 0 });
      });
    });

    describe('normalizeClauseText', () => {
      it('should trim and remove trailing dots', () => {
        const result = queryService.normalizeClauseText('  parent(tom, bob)..  ');
        expect(result).toBe('parent(tom, bob)');
      });
    });

    describe('extractCommandAndArg', () => {
      it('should extract asserta command', () => {
        const result = queryService.extractCommandAndArg('asserta(bar(1)).');
        expect(result).toEqual({ command: 'asserta', arg: 'bar(1)' });
      });

      it('should extract retract command', () => {
        const result = queryService.extractCommandAndArg('retract(foo(X)).');
        expect(result).toEqual({ command: 'retract', arg: 'foo(X)' });
      });
    });

    describe('isMutableQuery', () => {
      it('should detect asserta as mutable', () => {
        expect(queryService.isMutableQuery('asserta(foo(1)).')).toBe(true);
      });

      it('should detect assertz as mutable', () => {
        expect(queryService.isMutableQuery('assertz(foo(1)).')).toBe(true);
      });

      it('should detect retract as mutable', () => {
        expect(queryService.isMutableQuery('retract(bar(_)).')).toBe(true);
      });

      it('should detect retractall as mutable', () => {
        expect(queryService.isMutableQuery('retractall(baz(_)).')).toBe(true);
      });

      it('should detect abolish as mutable', () => {
        expect(queryService.isMutableQuery('abolish(foo/1).')).toBe(true);
      });

      it('should return false for regular query', () => {
        expect(queryService.isMutableQuery('parent(tom, X).')).toBe(false);
      });
    });

    describe('prepareCodeForQuery', () => {
      it('should return code unchanged for non-mutable query', () => {
        const result = queryService.prepareCodeForQuery('parent(tom, bob).', 'parent(tom, X).');
        expect(result.mutable).toBe(false);
        expect(result.codeToRun).toBe('parent(tom, bob).');
      });

      it('should add dynamic declaration for assert', () => {
        const result = queryService.prepareCodeForQuery('', 'asserta(foo(1)).');
        expect(result.codeToRun).toContain(':- dynamic foo/1');
        expect(result.mutable).toBe(true);
      });

      it('should append asserted clause for assertz', () => {
        const result = queryService.prepareCodeForQuery('foo(1).', 'assertz(foo(2)).');
        expect(result.updatedCodeOnSuccess).toContain('foo(2).');
        expect(result.mutable).toBe(true);
      });
    });

    describe('cleanConsoleOutput', () => {
      it('should remove true. from output', () => {
        const result = queryService.cleanConsoleOutput('X = a\ntrue.\nY = b');
        expect(result).not.toContain('true.');
      });

      it('should trim lines', () => {
        const result = queryService.cleanConsoleOutput('  X = a  ');
        expect(result).toBe('X = a');
      });
    });

    describe('extractSnapshotFromStdout', () => {
      it('should extract snapshot between markers', () => {
        const stdout = 'output\n__PT_SNAPSHOT_BEGIN__snapshot code__PT_SNAPSHOT_END__more output';
        const result = queryService.extractSnapshotFromStdout(stdout);
        expect(result.snapshotCode).toBe('snapshot code');
        expect(result.stdoutWithoutSnapshot).toContain('more output');
      });

      it('should return original stdout if no markers', () => {
        const stdout = 'output without markers';
        const result = queryService.extractSnapshotFromStdout(stdout);
        expect(result.snapshotCode).toBeNull();
        expect(result.stdoutWithoutSnapshot).toBe(stdout);
      });
    });

    describe('extractPrologErrorSummary', () => {
      it('should extract first ERROR line', () => {
        const stderr = 'Warning: some warning\nERROR: foo/0: Undefined procedure\nAnother error';
        const result = queryService.extractPrologErrorSummary(stderr);
        expect(result).toBe('foo/0: Undefined procedure');
      });

      it('should return null if no ERROR line', () => {
        const stderr = 'Warning: some warning';
        const result = queryService.extractPrologErrorSummary(stderr);
        expect(result).toBeNull();
      });
    });

    describe('sanitizeRuntimeFilename', () => {
      it('should sanitize filename', () => {
        const result = queryService.sanitizeRuntimeFilename('../etc/passwd');
        expect(result).toBe('passwd');
      });

      it('should return null for invalid names', () => {
        expect(queryService.sanitizeRuntimeFilename('')).toBeNull();
        expect(queryService.sanitizeRuntimeFilename('..')).toBeNull();
      });
    });
  });
});
