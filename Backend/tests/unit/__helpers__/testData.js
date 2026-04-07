/**
 * Test Data for Prolog-Tutor Unit Tests
 * Contains sample Prolog code, queries, and trace outputs
 */

// Sample Prolog code snippets
const samplePrologCode = {
  simpleFact: `parent(tom, bob).
parent(tom, alice).
parent(bob, charlie).`,

  simpleRules: `parent(tom, bob).
parent(tom, alice).
parent(bob, charlie).

ancestor(X, Y) :- parent(X, Y).
ancestor(X, Y) :- parent(X, Z), ancestor(Z, Y).`,

  listProcessing: `member(X, [X|_]).
member(X, [_|T]) :- member(X, T).

append([], L, L).
append([H|T], L, [H|R]) :- append(T, L, R).`,

  withDynamic: `:- dynamic foo/1.
foo(1).
foo(2).`,

  empty: '',

  withNullByte: 'parent(tom, bob).\0',

  tooLongLine: 'a'.repeat(10001)
};

// Sample Prolog queries
const sampleQueries = {
  simpleMember: 'member(X, [a, b, c]).',
  trueQuery: 'parent(tom, bob).',
  failQuery: 'parent(tom, noexistent).',
  ancestor: 'ancestor(tom, charlie).',
  listMember: 'member(a, [b, c, a]).',
  append: 'append([1,2], [3,4], R).',
  retract: 'asserta(foo(3)).',
  assertz: 'assertz(bar(1)).',
  retractAll: 'retractall(foo(_)).',
  abolish: 'abolish(bar/1).',
  empty: '',
  tooLong: 'a'.repeat(1001)
};

// Sample Prolog trace outputs
const sampleTraceOutput = {
  simpleSuccess: `Call: (1) member(X, [a, b, c])
Exit: (1) member(a, [a, b, c])
Call: (1) member(b, [a, b, c])
Exit: (1) member(b, [a, b, c])
Call: (1) member(c, [a, b, c])
Exit: (1) member(c, [a, b, c])`,

  simpleFail: `Call: (1) parent(tom, noexistent)
Fail: (1) parent(tom, noexistent)`,

  withRedo: `Call: (1) member(X, [a, b])
Exit: (1) member(a, [a, b])
Call: (1) member(b, [a, b])
Exit: (1) member(b, [a, b])
Redo: (1) member(X, [a, b])
Exit: (1) member(b, [a, b])`,

  nestedCall: `Call: (1) ancestor(tom, charlie)
Call: (2) parent(tom, charlie)
Fail: (2) parent(tom, charlie)
Call: (2) parent(tom, Z)
Exit: (2) parent(tom, bob)
Call: (3) ancestor(bob, charlie)
Call: (4) parent(bob, charlie)
Exit: (4) parent(bob, charlie)
Exit: (3) ancestor(bob, charlie)
Exit: (1) ancestor(tom, charlie)`,

  malformed: `Call: (1) some_predicate
This is not a valid trace line
Exit: (1) some_predicate`,

  empty: ''
};

// Sample execution results
const sampleExecutionResults = {
  success: {
    success: true,
    tree: [
      {
        level: 1,
        goal: 'member(X, [a, b, c])',
        status: 'success',
        children: []
      }
    ],
    consoleOutput: 'X = a',
    traceOutput: 'Call: (1) member(X, [a, b, c])\nExit: (1) member(a, [a, b, c])',
    executionTime: 150,
    processId: 1,
    cached: false
  },

  fail: {
    success: false,
    tree: [
      {
        level: 1,
        goal: 'parent(tom, noexistent)',
        status: 'fail',
        children: []
      }
    ],
    consoleOutput: 'false.',
    traceOutput: 'Call: (1) parent(tom, noexistent)\nFail: (1) parent(tom, noexistent)',
    executionTime: 50,
    processId: 1,
    cached: false
  }
};

// Sample cache entries
const sampleCacheEntries = {
  small: {
    code: 'parent(tom, bob).',
    query: 'parent(tom, bob).',
    result: sampleExecutionResults.success
  },

  large: {
    code: 'a'.repeat(2000),
    query: 'member(X, [a,b]).',
    result: {
      ...sampleExecutionResults.success,
      tree: Array(100).fill({ level: 1, goal: 'test', status: 'success', children: [] })
    }
  }
};

// Sample runtime files
const sampleRuntimeFiles = [
  { name: 'data.pl', content: 'test_data(1).\ntest_data(2).' },
  { name: 'config.pl', content: 'setting(timeout, 30000).' }
];

// Sample validation errors
const sampleValidationErrors = {
  missingCode: { query: 'member(X, [a,b,c]).' },
  missingQuery: { code: 'parent(tom, bob).' },
  codeTooLong: { code: 'a'.repeat(10001), query: 'true.' },
  queryTooLong: { code: 'parent(tom, bob).', query: 'a'.repeat(1001) },
  inputTooLong: { code: 'parent(tom, bob).', query: 'true.', input: 'a'.repeat(20001) },
  invalidRuntimeFiles: { code: 'true.', query: 'true.', runtimeFiles: [{ name: 'test.pl' }] },
  tooManyRuntimeFiles: {
    code: 'true.',
    query: 'true.',
    runtimeFiles: Array(21).fill({ name: 'test.pl', content: 'true.' })
  }
};

// Sample HTTP responses
const sampleHttpResponses = {
  success: {
    success: true,
    tree: [],
    consoleOutput: 'X = a',
    executionTime: 100,
    processId: 1,
    cached: false
  },

  validationError: {
    success: false,
    error: 'Validation failed',
    details: [
      { field: 'code', message: 'Code cannot be empty' }
    ]
  },

  timeoutError: {
    success: false,
    error: 'Query execution timeout'
  },

  serverError: {
    success: false,
    error: 'Internal server error'
  }
};

module.exports = {
  samplePrologCode,
  sampleQueries,
  sampleTraceOutput,
  sampleExecutionResults,
  sampleCacheEntries,
  sampleRuntimeFiles,
  sampleValidationErrors,
  sampleHttpResponses
};
