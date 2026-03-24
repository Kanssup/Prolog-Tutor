# Educational Agents Specification

## Overview
This document specifies the rule-based educational agents for the Prolog Tutor system. These agents provide intelligent assistance to help users understand Prolog execution and debug their code.

## Agent Architecture

### Agent System Design
```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Interface                      │
├─────────────────────────────────────────────────────────────┤
│  Agent Panel                                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Explanation │ │   Hint      │ │  Debugging  │          │
│  │   Agent     │ │   Agent     │ │   Agent     │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Backend Agent Service                   │
├─────────────────────────────────────────────────────────────┤
│  Agent Manager                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Rule Engine                                         │  │
│  │  • Pattern Matching                                  │  │
│  │  • Inference Rules                                   │  │
│  │  • Knowledge Base                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Agent Specifications

### 1. Explanation Agent
**Purpose**: Provide step-by-step explanations of Prolog execution

#### Trigger Conditions
- Always active during execution
- Each step of tree visualization
- User clicks on node for details

#### Knowledge Base
```prolog
% Execution pattern explanations
explanation(call(Goal, Level), 
    "Prolog is attempting to prove: " + Goal + 
    " at recursion level " + Level).

explanation(exit(Goal, Level, Bindings),
    "Success! " + Goal + " succeeded with bindings: " + Bindings).

explanation(fail(Goal, Level),
    Goal + " failed. Prolog will now backtrack to try alternatives.").

explanation(redo(Goal, Level),
    "Backtracking to find another solution for: " + Goal).
```

#### Response Format
```json
{
  "agent": "explanation",
  "step": 5,
  "nodeId": "node_123",
  "explanation": "Prolog is attempting to prove: father(john, X) at recursion level 2",
  "details": {
    "goal": "father(john, X)",
    "level": 2,
    "type": "call",
    "suggestions": ["This will unify with facts in the knowledge base"]
  }
}
```

### 2. Hint Agent
**Purpose**: Provide hints when user is stuck or queries fail

#### Trigger Conditions
- Query fails with no solutions
- User requests hint explicitly
- Same query fails multiple times
- Execution timeout

#### Rule Categories

##### A. Syntax Error Hints
```javascript
{
  pattern: /Syntax error:.*/,
  hint: "Check for missing periods, commas, or parentheses",
  examples: [
    "father(john mary) should be father(john, mary)",
    "parent(X,Y):-father(X,Y) should be parent(X,Y):-father(X,Y)."
  ]
}
```

##### B. No Solution Hints
```javascript
{
  pattern: "no_solution",
  conditions: ["query_fails", "knowledge_base_not_empty"],
  hint: "Try these debugging steps:",
  steps: [
    "Check if your facts match the query pattern",
    "Verify variable names are consistent",
    "Try a simpler query first"
  ]
}
```

##### C. Infinite Loop Detection
```javascript
{
  pattern: "infinite_loop",
  conditions: ["recursion_depth > 10", "no_base_case"],
  hint: "Possible infinite recursion detected",
  suggestions: [
    "Add a base case to terminate recursion",
    "Check recursive rule order",
    "Add cut operator (!) if appropriate"
  ]
}
```

#### Response Format
```json
{
  "agent": "hint",
  "type": "syntax_error",
  "severity": "warning",
  "message": "Missing period at end of rule",
  "location": {
    "line": 5,
    "column": 15
  },
  "suggestions": [
    "Add a '.' at the end of line 5",
    "Check all rules end with periods"
  ],
  "codeSnippet": "parent(X,Y):-father(X,Y)  ← Add period here"
}
```

### 3. Debugging Agent
**Purpose**: Identify and explain logic errors

#### Detection Rules

##### A. Unification Failures
```prolog
% Rule: Variables not unifying as expected
debug_unification_failure(Goal, Expected, Actual) :-
    format("Goal ~w expected ~w but got ~w", [Goal, Expected, Actual]).
```

##### B. Missing Facts
```javascript
{
  pattern: "missing_fact",
  detection: "Query references predicate with no matching facts",
  suggestion: "Add facts for the predicate or check spelling"
}
```

##### C. Rule Order Issues
```javascript
{
  pattern: "rule_order_problem",
  detection: "Recursive rule before base case",
  fix: "Move base case before recursive case"
}
```

#### Response Format
```json
{
  "agent": "debugging",
  "issue": "missing_fact",
  "description": "Predicate 'grandparent/2' has no facts defined",
  "affectedQuery": "grandparent(X, Y)",
  "suggestions": [
    "Add grandparent facts: grandparent(anna, carl).",
    "Or define rules: grandparent(X, Z) :- parent(X, Y), parent(Y, Z)."
  ],
  "confidence": 0.85
}
```

### 4. Optimization Agent
**Purpose**: Suggest code improvements

#### Optimization Rules

##### A. Redundant Code
```javascript
{
  pattern: "redundant_fact",
  detection: "Fact can be derived from existing rules",
  example: "parent(X,Y) already defined as father(X,Y) or mother(X,Y)",
  suggestion: "Remove redundant fact"
}
```

##### B. Inefficient Recursion
```javascript
{
  pattern: "inefficient_recursion",
  detection: "Tail recursion not optimized",
  suggestion: "Use accumulator pattern for tail recursion optimization"
}
```

##### C. Better Predicate Design
```javascript
{
  pattern: "predicate_design",
  detection: "Predicate doing too much work",
  suggestion: "Split into smaller, reusable predicates"
}
```

## Agent Integration

### Backend API Endpoints

#### 1. Agent Analysis Endpoint
```http
POST /api/agents/analyze
Content-Type: application/json

{
  "code": "father(john, mary).\nparent(X, Y) :- father(X, Y).",
  "query": "parent(john, X)",
  "trace": [...],
  "tree": {...},
  "requestedAgents": ["explanation", "hint"]
}
```

Response:
```json
{
  "analyses": [
    {
      "agent": "explanation",
      "steps": [...]
    },
    {
      "agent": "hint",
      "hints": [...]
    }
  ]
}
```

#### 2. Agent Configuration
```http
PUT /api/agents/config
{
  "agents": {
    "explanation": { "enabled": true, "detailLevel": "detailed" },
    "hint": { "enabled": true, "autoTrigger": false },
    "debugging": { "enabled": true, "severity": "all" },
    "optimization": { "enabled": false }
  }
}
```

### Frontend Integration

#### Agent State Management
```javascript
// Agent store
const useAgentStore = create((set) => ({
  // Agent configurations
  agents: {
    explanation: { enabled: true, level: 'detailed' },
    hint: { enabled: true, auto: false },
    debugging: { enabled: true },
    optimization: { enabled: false }
  },
  
  // Current agent responses
  responses: [],
  
  // Agent UI state
  panelOpen: true,
  activeAgent: 'explanation',
  
  // Actions
  toggleAgent: (agent) => set((state) => ({
    agents: { ...state.agents, [agent]: { 
      ...state.agents[agent], 
      enabled: !state.agents[agent].enabled 
    }}
  })),
  
  addResponse: (response) => set((state) => ({
    responses: [...state.responses, response]
  }))
}));
```

#### Agent Visualization Components
```jsx
// Agent annotations on tree nodes
const AgentAnnotations = ({ nodeId, agentResponses }) => {
  const relevantResponses = agentResponses.filter(r => r.nodeId === nodeId);
  
  return (
    <div className="agent-annotations">
      {relevantResponses.map((response, idx) => (
        <AgentBadge 
          key={idx}
          agent={response.agent}
          message={response.summary}
          details={response.details}
        />
      ))}
    </div>
  );
};
```

## Rule Engine Implementation

### Rule Definition Format
```javascript
class AgentRule {
  constructor(name, conditions, action, priority = 1) {
    this.name = name;
    this.conditions = conditions; // Array of condition functions
    this.action = action;         // Function that generates response
    this.priority = priority;
  }
  
  evaluate(context) {
    return this.conditions.every(cond => cond(context));
  }
  
  execute(context) {
    return this.action(context);
  }
}
```

### Rule Engine
```javascript
class RuleEngine {
  constructor() {
    this.rules = new Map();
    this.facts = new Map();
  }
  
  addRule(agent, rule) {
    if (!this.rules.has(agent)) {
      this.rules.set(agent, []);
    }
    this.rules.get(agent).push(rule);
  }
  
  evaluate(context) {
    const results = {};
    
    for (const [agent, rules] of this.rules) {
      const agentResults = [];
      
      // Sort by priority (higher first)
      const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);
      
      for (const rule of sortedRules) {
        if (rule.evaluate(context)) {
          agentResults.push(rule.execute(context));
          // Stop after first matching rule per agent (unless specified)
          if (!rule.continueEvaluation) break;
        }
      }
      
      if (agentResults.length > 0) {
        results[agent] = agentResults;
      }
    }
    
    return results;
  }
}
```

## Knowledge Base for Agents

### Prolog Execution Patterns
```prolog
% Common execution patterns for explanation
execution_pattern(call_unification, 
    "Prolog tries to unify the goal with heads of clauses").

execution_pattern(backtracking,
    "When a goal fails, Prolog backtracks to try alternative solutions").

execution_pattern(cut_operation,
    "The cut operator '!' commits to choices made so far").
```

### Common Errors Database
```javascript
const commonErrors = {
  syntax: [
    {
      pattern: /Missing '\)'/,
      explanation: "Unclosed parenthesis",
      fix: "Add closing parenthesis"
    },
    {
      pattern: /Missing '\.'/,
      explanation: "Missing period at end of clause",
      fix: "Add period at end of line"
    }
  ],
  logic: [
    {
      pattern: "infinite_recursion",
      explanation: "No base case or incorrect recursive call",
      fix: "Add base case before recursive rule"
    },
    {
      pattern: "variable_scope",
      explanation: "Variable used in different contexts",
      fix: "Use different variable names or understand scope"
    }
  ]
};
```

## Testing Agent Rules

### Test Cases
```javascript
describe('Explanation Agent', () => {
  test('should explain call events', () => {
    const context = {
      event: { type: 'call', goal: 'father(john, X)', level: 1 },
      code: 'father(john, mary). father(john, tom).',
      query: 'father(john, X)'
    };
    
    const result = ruleEngine.evaluate(context);
    expect(result.explanation).toBeDefined();
    expect(result.explanation[0]).toContain('attempting to prove');
  });
  
  test('should explain failure with suggestions', () => {
    const context = {
      event: { type: 'fail', goal: 'parent(john, X)', level: 1 },
      code: 'father(john, mary).',
      query: 'parent(john, X)'
    };
    
    const result = ruleEngine.evaluate(context);
    expect(result.hint).toBeDefined();
    expect(result.hint[0].suggestions).toContain('Check predicate definition');
  });
});
```

## Performance Considerations

### Rule Evaluation Optimization
1. **Rule Indexing**: Index rules by trigger patterns
2. **Condition Caching**: Cache condition evaluation results
3. **Lazy Evaluation**: Only evaluate rules when needed
4. **Rule Priority**: Evaluate high-priority rules first

### Response Time Targets
- Agent analysis: <50ms
- Rule evaluation: <10ms per agent
- Total agent processing: <100ms

## Extensibility

### Adding New Agents
1. Define agent specification in this document
2. Implement rule set in backend
3. Add frontend UI components
4. Update agent configuration API

### Custom Rule Development
```javascript
// Example custom rule
const customRule = new AgentRule(
  'custom_hint',
  [
    (ctx) => ctx.code.includes('member/2'),
    (ctx) => ctx.query.includes('member')
  ],
  (ctx) => ({
    hint: 'Consider using SWI-Prolog built-in member/2 predicate',
    example: 'member(X, [1,2,3]) finds X in list'
  })
);

ruleEngine.addRule('hint', customRule);
```

## Future Enhancements

### Machine Learning Integration
- Train models on common student errors
- Personalized hint generation
- Adaptive difficulty adjustment

### Advanced Visualization
- Agent-guided tour of execution tree
- Interactive debugging sessions
- Collaborative agent assistance

### Natural Language Processing
- Parse student questions about code
- Generate natural language explanations
- Multi-language support for agents