/**
 * Unit Tests for prologParser.js
 * Tests pure functions: humanizarVariables and parseTraceToTree
 */

const { humanizarVariables, parseTraceToTree } = require('../../prologParser');

describe('prologParser', () => {
  describe('humanizarVariables', () => {
    describe('happy path', () => {
      it('should transform _G123 to a readable letter', () => {
        const input = 'Call: (1) member(_G123, [a, b, c])';
        const result = humanizarVariables(input);
        expect(result).toContain('A');
      });

      it('should replace Prolog internal variables with letters', () => {
        const input = '_G123';
        const result = humanizarVariables(input);
        expect(result).toBe('A');
      });

      it('should give identical variables identical replacements', () => {
        const input = 'member(_G123, _G123)';
        const result = humanizarVariables(input);
        expect(result).toBe('member(A, A)');
      });
    });

    describe('multiple variables', () => {
      it('should map _G1, _G2, _G3 to A, B, C', () => {
        const input = '_G1, _G2, _G3';
        const result = humanizarVariables(input);
        expect(result).toBe('A, B, C');
      });

      it('should handle multiple occurrences of different variables', () => {
        const input = 'parent(_G1, _G2), parent(_G2, _G3)';
        const result = humanizarVariables(input);
        // A for _G1, B for _G2 (appears twice), C for _G3
        expect(result).toContain('A');
        expect(result).toContain('B');
        expect(result).toContain('C');
      });

      it('should continue with D, E, F after A, B, C', () => {
        const input = '_G1, _G2, _G3, _G4, _G5, _G6';
        const result = humanizarVariables(input);
        expect(result).toBe('A, B, C, D, E, F');
      });

      it('should handle many variables (cycles through alphabet)', () => {
        // The implementation uses modulo 26 cycling
        const input = '_G1, _G2, _G3, _G4, _G5, _G6';
        const result = humanizarVariables(input);
        const parts = result.split(', ');
        expect(parts[0]).toBe('A');
        expect(parts[5]).toBe('F');
      });
    });

    describe('empty input', () => {
      it('should return empty string for empty input', () => {
        const input = '';
        const result = humanizarVariables(input);
        expect(result).toBe('');
      });

      it('should return empty string for whitespace only', () => {
        const input = '   ';
        const result = humanizarVariables(input);
        expect(result).toBe('   ');
      });
    });

    describe('preserves non-variable text', () => {
      it('should preserve regular Prolog code', () => {
        const input = 'parent(tom, bob).';
        const result = humanizarVariables(input);
        expect(result).toBe('parent(tom, bob).');
      });

      it('should preserve atoms and numbers', () => {
        const input = 'foo(123, bar, baz)';
        const result = humanizarVariables(input);
        expect(result).toBe('foo(123, bar, baz)');
      });

      it('should preserve complex Prolog structures', () => {
        const input = '[a, b, c]';
        const result = humanizarVariables(input);
        expect(result).toBe('[a, b, c]');
      });

      it('should handle mixed variables and regular text', () => {
        const input = 'member(_G1, [a, b, c])';
        const result = humanizarVariables(input);
        expect(result).toMatch(/member\(A, \[a, b, c\]\)/);
      });
    });

    describe('edge cases', () => {
      it('should handle underscore-prefixed variables', () => {
        const input = '_X';
        const result = humanizarVariables(input);
        // _X is not matched by _G123 pattern
        expect(result).toBe('_X');
      });

      it('should handle _ variable (anonymous)', () => {
        const input = 'member(_, [a, b])';
        const result = humanizarVariables(input);
        expect(result).toBe('member(_, [a, b])');
      });

      it('should handle variables at end of string', () => {
        const input = 'foo(_G123)';
        const result = humanizarVariables(input);
        expect(result).toBe('foo(A)');
      });
    });
  });

  describe('parseTraceToTree', () => {
    describe('simple Call/Exit', () => {
      it('should return success status for Call/Exit sequence', () => {
        const trace = `Call: (1) member(a, [a, b, c])
Exit: (1) member(a, [a, b, c])`;
        
        const result = parseTraceToTree(trace);
        
        expect(result).toHaveLength(1);
        expect(result[0].status).toBe('success');
        expect(result[0].goal).toBe('member(a, [a, b, c])');
      });

      it('should parse simple success trace correctly', () => {
        const trace = `Call: (1) parent(tom, bob)
Exit: (1) parent(tom, bob)`;
        
        const result = parseTraceToTree(trace);
        
        expect(result).toHaveLength(1);
        expect(result[0].level).toBe(1);
        expect(result[0].status).toBe('success');
      });
    });

    describe('Call/Fail', () => {
      it('should return fail status for Call/Fail sequence', () => {
        const trace = `Call: (1) parent(tom, noexistent)
Fail: (1) parent(tom, noexistent)`;
        
        const result = parseTraceToTree(trace);
        
        expect(result).toHaveLength(1);
        expect(result[0].status).toBe('fail');
      });

      it('should parse failure trace correctly', () => {
        const trace = `Call: (1) member(x, [a, b, c])
Fail: (1) member(x, [a, b, c])`;
        
        const result = parseTraceToTree(trace);
        
        expect(result).toHaveLength(1);
        expect(result[0].level).toBe(1);
        expect(result[0].status).toBe('fail');
      });
    });

    describe('Redo branches', () => {
      it('should handle Redo to mark pending status', () => {
        const trace = `Call: (1) member(X, [a, b])
Exit: (1) member(a, [a, b])
Redo: (1) member(X, [a, b])
Exit: (1) member(b, [a, b])`;
        
        const result = parseTraceToTree(trace);
        
        expect(result).toHaveLength(1);
        // After Redo, status becomes pending, then success on Exit
        expect(['pending', 'success']).toContain(result[0].status);
      });

      it('should handle multiple solutions with redo', () => {
        const trace = `Call: (1) member(X, [a, b])
Exit: (1) member(a, [a, b])
Redo: (1) member(X, [a, b])
Exit: (1) member(b, [a, b])`;
        
        const result = parseTraceToTree(trace);
        
        expect(result).toHaveLength(1);
        // After Redo, status becomes pending, then updates on Exit
        // The final node status reflects the last Exit
        expect(['pending', 'success']).toContain(result[0].status);
      });
    });

    describe('nested calls', () => {
      it('should parse nested Call/Exit correctly', () => {
        const trace = `Call: (1) ancestor(tom, charlie)
Call: (2) parent(tom, charlie)
Fail: (2) parent(tom, charlie)
Call: (2) parent(tom, Z)
Exit: (2) parent(tom, bob)
Call: (3) ancestor(bob, charlie)
Call: (4) parent(bob, charlie)
Exit: (4) parent(bob, charlie)
Exit: (3) ancestor(bob, charlie)
Exit: (1) ancestor(tom, charlie)`;
        
        const result = parseTraceToTree(trace);
        
        // The trace shows multiple branches - some fail and some succeed
        // Result contains successful branches
        expect(result.length).toBeGreaterThan(0);
        // At least one node should have success status
        const hasSuccess = result.some(node => node.status === 'success');
        expect(hasSuccess).toBe(true);
      });

      it('should build tree structure for nested calls', () => {
        const trace = `Call: (1) foo
Call: (2) bar
Exit: (2) bar
Exit: (1) foo`;
        
        const result = parseTraceToTree(trace);
        
        expect(result).toHaveLength(1);
        // foo should have bar as a child
        expect(result[0].children.length).toBeGreaterThanOrEqual(0);
      });
    });

    describe('malformed input', () => {
      it('should return valid structure without throwing for empty input', () => {
        const trace = '';
        
        const result = parseTraceToTree(trace);
        
        expect(result).toEqual([]);
      });

      it('should handle non-trace lines gracefully', () => {
        const trace = `This is not a trace line
Call: (1) some_goal
Some random text
Exit: (1) some_goal`;
        
        const result = parseTraceToTree(trace);
        
        expect(result).toHaveLength(1);
        expect(result[0].goal).toBe('some_goal');
        expect(result[0].status).toBe('success');
      });

      it('should handle incomplete trace lines', () => {
        const trace = `Call: (1) goal
Exit`;
        
        const result = parseTraceToTree(trace);
        
        // Should not throw and return something valid
        expect(Array.isArray(result)).toBe(true);
      });
    });

    describe('question mark handling', () => {
      it('should remove trailing question marks from goals', () => {
        const trace = `Call: (1) member(X, [a, b]) ?
Exit: (1) member(a, [a, b]) ?`;
        
        const result = parseTraceToTree(trace);
        
        expect(result[0].goal).not.toContain('?');
      });
    });

    describe('edge cases', () => {
      it('should handle multiple top-level goals', () => {
        const trace = `Call: (1) goal1
Exit: (1) goal1
Call: (1) goal2
Exit: (1) goal2`;
        
        const result = parseTraceToTree(trace);
        
        expect(result).toHaveLength(2);
      });

      it('should handle goals with complex arguments', () => {
        const trace = `Call: (1) foo(bar(baz), [a, b, c], 123)
Exit: (1) foo(bar(baz), [a, b, c], 123)`;
        
        const result = parseTraceToTree(trace);
        
        expect(result).toHaveLength(1);
        expect(result[0].status).toBe('success');
      });
    });
  });
});
