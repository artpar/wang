# Wang Language Grammar - Simplified Version
# Based on FEATURE_DECISIONS.md - No ambiguity, cleaner syntax

@{%
const moo = require('moo');

// Simplified lexer - only what we need
const lexer = moo.compile({
  // Whitespace and comments (skip, but preserve newlines)
  WS: /[ \t\r]+/u,
  NL: { match: /\n/u, lineBreaks: true },
  lineComment: /\/\/.*$/u,
  blockComment: { match: /\/\*[^]*?\*\//u, lineBreaks: true },
  
  // String literals
  string: [
    { match: /"(?:[^"\\]|\\[^])*"/u, value: s => {
      return s.slice(1, -1).replace(/\\(.)/g, (match, char) => {
        switch (char) {
          case 'n': return '\n';
          case 't': return '\t';
          case 'r': return '\r';
          case '\\': return '\\';
          case '"': return '"';
          case "'": return "'";
          default: return char;
        }
      });
    }},
    { match: /'(?:[^'\\]|\\[^])*'/u, value: s => {
      return s.slice(1, -1).replace(/\\(.)/g, (match, char) => {
        switch (char) {
          case 'n': return '\n';
          case 't': return '\t';
          case 'r': return '\r';
          case '\\': return '\\';
          case '"': return '"';
          case "'": return "'";
          default: return char;
        }
      });
    }}
  ],
  
  // Template literals - capture the entire template including expressions
  templateLiteral: { 
    match: /`(?:[^`\\]|\\[^])*`/u, 
    value: s => {
      // Process escape sequences but keep ${...} for interpolation
      const content = s.slice(1, -1);
      // Only process escape sequences, not ${...} expressions
      return content.replace(/\\(.)/g, (match, char) => {
        switch (char) {
          case 'n': return '\n';
          case 't': return '\t';
          case 'r': return '\r';
          case '\\': return '\\';
          case '`': return '`';
          case '$': return '$';  // Allow escaping $ to prevent interpolation
          default: return char;
        }
      });
    }
  },
  
  // Regular expression literals - allow backslashes and non-space first characters
  regex: { 
    match: /\/(?:\\[^]|[^\s\/])(?:[^\/\\\r\n]|\\[^])*\/[gimsuy]*/u,
    value: s => {
      const lastSlash = s.lastIndexOf('/');
      const pattern = s.slice(1, lastSlash);
      const flags = s.slice(lastSlash + 1);
      return { pattern, flags };
    }
  },
  
  // Numbers (simplified - decimal only for now)
  number: {
    match: /(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/u,
    value: s => parseFloat(s)
  },
  
  // Identifiers with Unicode support
  identifier: {
    match: /[\p{L}\p{Nl}$_][\p{L}\p{Mn}\p{Mc}\p{Nd}\p{Pc}$_]*/u,
    type: moo.keywords({
      // Variable declarations
      let: 'let', const: 'const', var: 'var',
      // Control flow
      if: 'if', else: 'else',
      for: 'for', while: 'while', do: 'do',
      switch: 'switch', case: 'case', default: 'default',
      break: 'break', continue: 'continue', return: 'return',
      // Functions and classes
      function: 'function', class: 'class', extends: 'extends',
      constructor: 'constructor',
      async: 'async', await: 'await',
      // Modules
      import: 'import', export: 'export', from: 'from', as: 'as',
      // Error handling
      try: 'try', catch: 'catch', finally: 'finally', throw: 'throw',
      // Literals
      true: 'true', false: 'false', null: 'null', undefined: 'undefined',
      // Special
      this: 'this', super: 'super', new: 'new',
      typeof: 'typeof', instanceof: 'instanceof', in: 'in', of: 'of'
    })
  },
  
  // Compound assignment operators (basic math only)
  '+=': /\+=/u, '-=': /-=/u, '*=': /\*=/u, '/=': /\/=/u,
  
  // Operators - Only what we're keeping
  '===': /===/u, '!==': /!==/u,
  '==': /==/u, '!=': /!=/u,
  '<=': /<=/u, '>=': />=/u,
  '<<': /<</u, '>>': />>/u, '>>>': />>>/u,
  '&&': /&&/u, '||': /\|\|/u, '??': /\?\?/u,
  '?.': /\?\./u, '...': /\.\.\./u,
  '++': /\+\+/u, '--': /--/u,
  '**': /\*\*/u,
  
  // Arrow function operator (JavaScript compatible)
  '=>': /=>/u,
  
  // Single character tokens
  '=': /=/u, '<': /</u, '>': />/u,
  '+': /\+/u, '-': /-/u, '*': /\*/u, '/': /\//u, '%': /%/u,
  '&': /&/u, '|': /\|/u, '^': /\^/u, '~': /~/u, '!': /!/u,
  '?': /\?/u, ':': /:/u,
  '(': /\(/u, ')': /\)/u, '[': /\[/u, ']': /\]/u, '{': /\{/u, '}': /\}/u,
  ',': /,/u, '.': /\./u, ';': /;/u
});

// Simple whitespace and comment skipping 
lexer.next = (next => () => {
  let tok;
  while ((tok = next.call(lexer)) && (tok.type === 'WS' || tok.type === 'lineComment' || tok.type === 'blockComment')) {
    // Skip whitespace and comments
  }
  return tok;
})(lexer.next);

// AST helper functions
function createNode(type, props = {}, data) {
  const node = { type, ...props };
  
  // Try to extract location info from data (nearley provides this)
  if (data) {
    // Find the first token with location info
    const findLocation = (item) => {
      if (!item) return null;
      if (item.line !== undefined) {
        return { line: item.line, col: item.col, offset: item.offset };
      }
      if (Array.isArray(item)) {
        for (const sub of item) {
          const loc = findLocation(sub);
          if (loc) return loc;
        }
      }
      if (item.type && item.value !== undefined && item.line !== undefined) {
        // This is a moo token
        return { line: item.line, col: item.col, offset: item.offset };
      }
      return null;
    };
    
    const loc = findLocation(data);
    if (loc) {
      node.loc = {
        start: { line: loc.line, column: loc.col },
        offset: loc.offset
      };
    }
  }
  
  return node;
}

function createBinaryOp(left, operator, right, data) {
  return createNode('BinaryExpression', { operator, left, right }, data);
}

function createUnaryOp(operator, argument, prefix = true, data) {
  return createNode('UnaryExpression', { operator, argument, prefix }, data);
}

// Pipeline functions removed - not JavaScript compatible

function createIdentifier(name, data) {
  return createNode('Identifier', { name }, data);
}

function createLiteral(value, raw, data) {
  return createNode('Literal', { value, raw }, data);
}

function createRegexLiteral(pattern, flags) {
  return createNode('RegexLiteral', { pattern, flags });
}

%}

@lexer lexer

# ============= PROGRAM STRUCTURE =============

# Start rule
Program -> StatementList {% d => createNode('Program', { body: d[0] }) %}

# Statements - Support both newlines and semicolons (JavaScript-compatible)
# Semicolons are optional statement terminators
# Fixed: Removed ambiguity by simplifying terminator rules
StatementList ->
    null {% () => [] %}
  | Statement {% d => [d[0]] %}
  | StatementList StatementTerminator Statement {% d => [...d[0], d[2]] %}
  | StatementList StatementTerminator {% d => d[0] %}  # Allow trailing terminators

# Statement terminator - simplified to reduce ambiguity
# Either newline OR semicolon (optionally followed by newline)
StatementTerminator ->
    %NL {% id %}
  | ";" {% id %}

Statement ->
    Declaration {% id %}
  | LabeledStatement {% id %}
  | ControlStatement {% id %}
  | ExpressionStatement {% id %}
  | Block {% id %}
  # PipelineContinuation removed - not JavaScript compatible

# PipelineContinuation removed - not JavaScript compatible
# MemberContinuation removed - not JavaScript compatible

LabeledStatement ->
    %identifier ":" LoopStatement
    {% d => createNode('LabeledStatement', {
      label: createIdentifier(d[0].value),
      body: d[2]
    }) %}

LoopStatement ->
    WhileStatement {% id %}
  | DoWhileStatement {% id %}
  | ForStatement {% id %}

# ============= DECLARATIONS =============

Declaration ->
    VariableDeclaration {% id %}
  | FunctionDeclaration {% id %}
  | ClassDeclaration {% id %}
  | ImportDeclaration {% id %}
  | ExportDeclaration {% id %}

# Variable Declaration
VariableDeclaration ->
    ("let" | "const" | "var") VariableDeclaratorList
    {% d => createNode('VariableDeclaration', { kind: d[0][0].value, declarations: d[1] }) %}

VariableDeclaratorList ->
    VariableDeclarator {% d => [d[0]] %}
  | VariableDeclaratorList "," VariableDeclarator {% d => [...d[0], d[2]] %}

VariableDeclarator ->
    BindingPattern ("=" AssignmentExpression):?
    {% d => createNode('VariableDeclarator', { 
      id: d[0], 
      init: d[1] ? d[1][1] : null 
    }) %}

# Binding patterns (simplified destructuring)
BindingPattern ->
    %identifier {% d => createIdentifier(d[0].value, d[0]) %}
  | ArrayPattern {% id %}
  | ObjectPattern {% id %}

ArrayPattern ->
    "[" ArrayPatternElementList "]"
    {% d => createNode('ArrayPattern', { elements: d[1] }) %}

ArrayPatternElementList ->
    null {% () => [] %}
  | ArrayPatternElement {% d => [d[0]] %}
  | ArrayPatternElementList "," ArrayPatternElement {% d => [...d[0], d[2]] %}
  | ArrayPatternElementList "," {% d => [...d[0], null] %}

ArrayPatternElement ->
    BindingPattern {% id %}
  | "..." BindingPattern {% d => createNode('RestElement', { argument: d[1] }) %}

ObjectPattern ->
    "{" ObjectPatternPropertyList "}"
    {% d => createNode('ObjectPattern', { properties: d[1] }) %}

ObjectPatternPropertyList ->
    null {% () => [] %}
  | ObjectPatternProperty {% d => [d[0]] %}
  | ObjectPatternPropertyList "," ObjectPatternProperty {% d => [...d[0], d[2]] %}

ObjectPatternProperty ->
    %identifier {% d => createNode('Property', { 
      key: createIdentifier(d[0].value), 
      value: createIdentifier(d[0].value), 
      shorthand: true 
    }) %}
  | PropertyKey ":" BindingPattern {% d => createNode('Property', { 
      key: d[0], 
      value: d[2], 
      shorthand: false 
    }) %}

# Function Declaration - ONLY NAMED FUNCTIONS
FunctionDeclaration ->
    "async":? "function" %identifier "(" %NL:* ParameterList %NL:* ")" Block
    {% d => createNode('FunctionDeclaration', {
      async: !!d[0],
      id: createIdentifier(d[2].value),
      params: d[5],
      body: d[8]
    }) %}

ParameterList ->
    null {% () => [] %}
  | Parameter {% d => [d[0]] %}
  | ParameterList %NL:* "," %NL:* Parameter {% d => [...d[0], d[4]] %}

Parameter ->
    BindingPattern {% id %}
  | BindingPattern "=" AssignmentExpression 
    {% d => createNode('AssignmentPattern', { left: d[0], right: d[2] }) %}
  | "..." BindingPattern 
    {% d => createNode('RestElement', { argument: d[1] }) %}

# Class Declaration (simplified - no static, getters, setters, private)
ClassDeclaration ->
    "class" %identifier ("extends" %identifier):? ClassBody
    {% d => createNode('ClassDeclaration', {
      id: createIdentifier(d[1].value),
      superClass: d[2] ? createIdentifier(d[2][1].value) : null,
      body: d[3]
    }) %}

ClassBody ->
    "{" ClassMemberListWithNewlines "}"
    {% d => createNode('ClassBody', { body: d[1] }) %}

# Class members - handle all newlines upfront
ClassMemberListWithNewlines ->
    %NL:* ClassMemberNonEmpty:? %NL:*
    {% d => d[1] ? d[1] : [] %}

ClassMemberNonEmpty ->
    ClassMember
    {% d => [d[0]] %}
  | ClassMember %NL:+ ClassMemberNonEmpty
    {% d => [d[0], ...d[2]] %}

ClassMember ->
    MethodDefinition {% id %}
  | PropertyDefinition {% id %}

MethodDefinition ->
    "async":? PropertyKey "(" %NL:* ParameterList %NL:* ")" Block
    {% d => createNode('MethodDefinition', {
      async: !!d[0],
      kind: 'method',
      key: d[1],
      params: d[4],
      body: d[7]
    }) %}
  | "constructor" "(" %NL:* ParameterList %NL:* ")" Block
    {% d => createNode('MethodDefinition', {
      kind: 'constructor',
      key: createIdentifier('constructor'),
      params: d[3],
      body: d[6]
    }) %}

PropertyDefinition ->
    PropertyKey "=" AssignmentExpression
    {% d => createNode('PropertyDefinition', {
      key: d[0],
      value: d[2]
    }) %}

# Import/Export (simplified - named only, no default)
ImportDeclaration ->
    "import" "{" ImportsList "}" "from" %string
    {% d => createNode('ImportDeclaration', { 
      specifiers: d[2], 
      source: createLiteral(d[5].value, d[5].text) 
    }) %}

ImportsList ->
    null {% () => [] %}
  | ImportSpecifier {% d => [d[0]] %}
  | ImportsList "," ImportSpecifier {% d => [...d[0], d[2]] %}

ImportSpecifier ->
    %identifier ("as" %identifier):?
    {% d => createNode('ImportSpecifier', {
      imported: createIdentifier(d[0].value),
      local: createIdentifier(d[1] ? d[1][1].value : d[0].value)
    }) %}

ExportDeclaration ->
    "export" Declaration {% d => createNode('ExportNamedDeclaration', { declaration: d[1] }) %}
  | "export" "{" ExportsList "}"
    {% d => createNode('ExportNamedDeclaration', { 
      specifiers: d[2],
      source: null
    }) %}

ExportsList ->
    null {% () => [] %}
  | ExportSpecifier {% d => [d[0]] %}
  | ExportsList "," ExportSpecifier {% d => [...d[0], d[2]] %}

ExportSpecifier ->
    %identifier ("as" %identifier):?
    {% d => createNode('ExportSpecifier', {
      local: createIdentifier(d[0].value),
      exported: createIdentifier(d[1] ? d[1][1].value : d[0].value)
    }) %}

# ============= CONTROL STATEMENTS =============

ControlStatement ->
    IfStatement {% id %}
  | WhileStatement {% id %}
  | DoWhileStatement {% id %}
  | ForStatement {% id %}
  | SwitchStatement {% id %}
  | TryStatement {% id %}
  | ThrowStatement {% id %}
  | ReturnStatement {% id %}
  | BreakStatement {% id %}
  | ContinueStatement {% id %}

IfStatement ->
    "if" "(" %NL:* Expression %NL:* ")" Statement (StatementTerminator:? %NL:* "else" Statement):?
    {% d => createNode('IfStatement', {
      test: d[3],
      consequent: d[6],
      alternate: d[7] ? d[7][3] : null
    }) %}

WhileStatement ->
    "while" "(" %NL:* Expression %NL:* ")" Statement
    {% d => createNode('WhileStatement', { test: d[3], body: d[6] }) %}

DoWhileStatement ->
    "do" Statement "while" "(" %NL:* Expression %NL:* ")"
    {% d => createNode('DoWhileStatement', { body: d[1], test: d[5] }) %}

ForStatement ->
    # C-style for loop  
    "for" "(" %NL:* (VariableDeclaration | Expression | null) %NL:* ";" %NL:* (Expression | null) %NL:* ";" %NL:* (Expression | null) %NL:* ")" Statement
    {% d => createNode('ForStatement', {
      init: d[3] ? d[3][0] : null,
      test: d[7] ? d[7][0] : null,
      update: d[11] ? d[11][0] : null,
      body: d[14]
    }) %}
  | # for-of loop
    "for" "(" %NL:* ("let" | "const" | "var") BindingPattern %NL:* "of" %NL:* Expression %NL:* ")" Statement
    {% d => createNode('ForOfStatement', {
      left: createNode('VariableDeclaration', { 
        kind: d[3][0].value, 
        declarations: [createNode('VariableDeclarator', { id: d[4], init: null })] 
      }),
      right: d[8],
      body: d[11]
    }) %}
  | # for-in loop
    "for" "(" %NL:* ("let" | "const" | "var") BindingPattern %NL:* "in" %NL:* Expression %NL:* ")" Statement
    {% d => createNode('ForInStatement', {
      left: createNode('VariableDeclaration', { 
        kind: d[3][0].value, 
        declarations: [createNode('VariableDeclarator', { id: d[4], init: null })] 
      }),
      right: d[8],
      body: d[11]
    }) %}

SwitchStatement ->
    "switch" "(" %NL:* Expression %NL:* ")" %NL:* "{" %NL:* SwitchCaseList %NL:* "}"
    {% d => createNode('SwitchStatement', {
      discriminant: d[3],
      cases: d[9]
    }) %}

SwitchCaseList ->
    null {% () => [] %}
  | SwitchCase {% d => [d[0]] %}
  | SwitchCaseList %NL:+ SwitchCase {% d => [...d[0], d[2]] %}

SwitchCase ->
    "case" Expression %NL:* ":" %NL:* StatementList
    {% d => createNode('SwitchCase', {
      test: d[1],
      consequent: d[5]
    }) %}
  | "default" %NL:* ":" %NL:* StatementList
    {% d => createNode('SwitchCase', {
      test: null,
      consequent: d[4]
    }) %}

TryStatement ->
    "try" Block CatchFinally
    {% d => createNode('TryStatement', {
      block: d[1],
      handler: d[2].handler,
      finalizer: d[2].finalizer
    }) %}

CatchFinally ->
    "catch" ("(" BindingPattern ")"):? Block ("finally" Block):?
    {% d => ({ 
      handler: createNode('CatchClause', {
        param: d[1] ? d[1][1] : null,
        body: d[2]
      }),
      finalizer: d[3] ? d[3][1] : null
    }) %}
  | "finally" Block
    {% d => ({ handler: null, finalizer: d[1] }) %}

ThrowStatement ->
    "throw" Expression
    {% d => createNode('ThrowStatement', { argument: d[1] }) %}

ReturnStatement ->
    "return" Expression:?
    {% d => createNode('ReturnStatement', { argument: d[1] }) %}

BreakStatement ->
    "break" %identifier:?
    {% d => createNode('BreakStatement', { label: d[1] ? createIdentifier(d[1].value) : null }) %}

ContinueStatement ->
    "continue" %identifier:?
    {% d => createNode('ContinueStatement', { label: d[1] ? createIdentifier(d[1].value) : null }) %}

# ============= EXPRESSIONS =============

ExpressionStatement ->
    Expression {% d => createNode('ExpressionStatement', { expression: d[0] }) %}

Expression -> AssignmentExpression {% id %}

# Assignment - simple and compound
AssignmentExpression ->
    ConditionalExpression {% id %}
  | ArrowFunction {% id %}
  | LeftHandSideExpression AssignmentOperator AssignmentExpression
    {% d => createNode('AssignmentExpression', {
      operator: d[1],
      left: d[0],
      right: d[2]
    }) %}

# Pipeline operators removed - not JavaScript compatible

AssignmentOperator ->
    "=" {% d => d[0].value %}
  | "+=" {% d => d[0].value %}
  | "-=" {% d => d[0].value %}
  | "*=" {% d => d[0].value %}
  | "/=" {% d => d[0].value %}

# Arrow functions (always anonymous)
ArrowFunction ->
    ArrowParameters "=>" ArrowBody
    {% d => createNode('ArrowFunctionExpression', {
      async: false,
      params: d[0],
      body: d[2]
    }) %}
  | "async" ArrowParameters "=>" ArrowBody
    {% d => createNode('ArrowFunctionExpression', {
      async: true,
      params: d[1],
      body: d[3]
    }) %}

ArrowParameters ->
    %identifier {% d => [createIdentifier(d[0].value, d[0])] %}
  | "(" %NL:* ParameterList %NL:* ")" {% d => d[2] %}

ArrowBody ->
    Block {% id %}
  | AssignmentExpression {% id %}

# Ternary operator (single-line only to avoid ambiguity)
# Fixed: Changed right-recursive ConditionalExpression to AssignmentExpression to prevent exponential parsing complexity
ConditionalExpression ->
    LogicalOrExpression {% id %}
  | LogicalOrExpression %NL:* "?" %NL:* AssignmentExpression %NL:* ":" %NL:* AssignmentExpression
    {% d => createNode('ConditionalExpression', {
      test: d[0],
      consequent: d[4],
      alternate: d[8]
    }) %}

LogicalOrExpression ->
    LogicalAndExpression {% id %}
  | LogicalOrExpression %NL:* ("||" | "??") %NL:* LogicalAndExpression
    {% d => createBinaryOp(d[0], d[2][0].value, d[4]) %}

LogicalAndExpression ->
    EqualityExpression {% id %}
  | LogicalAndExpression %NL:* "&&" %NL:* EqualityExpression
    {% d => createBinaryOp(d[0], d[2].value, d[4]) %}

EqualityExpression ->
    RelationalExpression {% id %}
  | EqualityExpression %NL:* ("==" | "!=" | "===" | "!==") %NL:* RelationalExpression
    {% d => createBinaryOp(d[0], d[2][0].value, d[4]) %}

RelationalExpression ->
    AdditiveExpression {% id %}
  | RelationalExpression %NL:* ("<" | ">" | "<=" | ">=") %NL:* AdditiveExpression
    {% d => createBinaryOp(d[0], d[2][0].value, d[4]) %}
  | RelationalExpression %NL:* ("instanceof" | "in") %NL:* AdditiveExpression
    {% d => createBinaryOp(d[0], d[2][0].value, d[4]) %}

AdditiveExpression ->
    MultiplicativeExpression {% id %}
  | AdditiveExpression %NL:* ("+" | "-") %NL:* MultiplicativeExpression
    {% d => createBinaryOp(d[0], d[2][0].value, d[4]) %}

MultiplicativeExpression ->
    ExponentiationExpression {% id %}
  | MultiplicativeExpression %NL:* ("*" | "/" | "%") %NL:* ExponentiationExpression
    {% d => createBinaryOp(d[0], d[2][0].value, d[4]) %}

ExponentiationExpression ->
    UnaryExpression {% id %}
  | UnaryExpression %NL:* "**" %NL:* ExponentiationExpression
    {% d => createBinaryOp(d[0], d[2].value, d[4]) %}

UnaryExpression ->
    PostfixExpression {% id %}
  | ("!" | "+" | "-" | "~" | "typeof" | "await") UnaryExpression
    {% d => createUnaryOp(d[0][0].value, d[1]) %}
  | ("++" | "--") UnaryExpression
    {% d => createNode('UpdateExpression', {
      operator: d[0][0].value,
      argument: d[1],
      prefix: true
    }) %}

# Postfix ++ and --
PostfixExpression ->
    LeftHandSideExpression {% id %}
  | LeftHandSideExpression ("++" | "--")
    {% d => createNode('UpdateExpression', {
      operator: d[1][0].value,
      argument: d[0],
      prefix: false
    }) %}

LeftHandSideExpression ->
    CallExpression {% id %}
  | NewExpression {% id %}

CallExpression ->
    MemberExpression Arguments {% d => createNode('CallExpression', { callee: d[0], arguments: d[1] }) %}
  | "new" MemberExpression Arguments
    {% d => createNode('NewExpression', { callee: d[1], arguments: d[2] }) %}
  | CallExpression Arguments {% d => createNode('CallExpression', { callee: d[0], arguments: d[1] }) %}
  | CallExpression "[" Expression "]"
    {% d => createNode('MemberExpression', { object: d[0], property: d[2], computed: true }) %}
  | CallExpression %NL:* "." PropertyName
    {% d => createNode('MemberExpression', { object: d[0], property: createIdentifier(d[3].value), computed: false }) %}
  | CallExpression %NL:* "?." OptionalMemberAccess
    {% d => createNode('MemberExpression', { 
      object: d[0], 
      property: d[3].property, 
      computed: d[3].computed, 
      optional: true 
    }) %}

NewExpression ->
    "new" MemberExpression
    {% d => createNode('NewExpression', { callee: d[1], arguments: [] }) %}
  | MemberExpression {% id %}

MemberExpression ->
    PrimaryExpression {% id %}
  | MemberExpression "[" Expression "]"
    {% d => createNode('MemberExpression', { object: d[0], property: d[2], computed: true }) %}
  | MemberExpression %NL:* "." PropertyName
    {% d => createNode('MemberExpression', { object: d[0], property: createIdentifier(d[3].value), computed: false }) %}
  | MemberExpression %NL:* "?." OptionalMemberAccess
    {% d => createNode('MemberExpression', { 
      object: d[0], 
      property: d[3].property, 
      computed: d[3].computed, 
      optional: true 
    }) %}

# Optional member access after ?. - handles both identifier and computed access
OptionalMemberAccess ->
    PropertyName
    {% d => ({ property: createIdentifier(d[0].value), computed: false }) %}
  | "[" Expression "]"
    {% d => ({ property: d[1], computed: true }) %}

# Allow keywords as property names in member expressions
PropertyName ->
    %identifier {% d => d[0] %}
  | ReservedKeyword {% d => d[0] %}

ReservedKeyword ->
    "let" {% d => ({ value: 'let' }) %}
  | "const" {% d => ({ value: 'const' }) %}
  | "var" {% d => ({ value: 'var' }) %}
  | "if" {% d => ({ value: 'if' }) %}
  | "else" {% d => ({ value: 'else' }) %}
  | "for" {% d => ({ value: 'for' }) %}
  | "while" {% d => ({ value: 'while' }) %}
  | "do" {% d => ({ value: 'do' }) %}
  | "switch" {% d => ({ value: 'switch' }) %}
  | "case" {% d => ({ value: 'case' }) %}
  | "default" {% d => ({ value: 'default' }) %}
  | "break" {% d => ({ value: 'break' }) %}
  | "continue" {% d => ({ value: 'continue' }) %}
  | "return" {% d => ({ value: 'return' }) %}
  | "function" {% d => ({ value: 'function' }) %}
  | "class" {% d => ({ value: 'class' }) %}
  | "extends" {% d => ({ value: 'extends' }) %}
  | "constructor" {% d => ({ value: 'constructor' }) %}
  | "async" {% d => ({ value: 'async' }) %}
  | "await" {% d => ({ value: 'await' }) %}
  | "import" {% d => ({ value: 'import' }) %}
  | "export" {% d => ({ value: 'export' }) %}
  | "from" {% d => ({ value: 'from' }) %}
  | "as" {% d => ({ value: 'as' }) %}
  | "try" {% d => ({ value: 'try' }) %}
  | "catch" {% d => ({ value: 'catch' }) %}
  | "finally" {% d => ({ value: 'finally' }) %}
  | "throw" {% d => ({ value: 'throw' }) %}
  | "true" {% d => ({ value: 'true' }) %}
  | "false" {% d => ({ value: 'false' }) %}
  | "null" {% d => ({ value: 'null' }) %}
  | "undefined" {% d => ({ value: 'undefined' }) %}
  | "this" {% d => ({ value: 'this' }) %}
  | "super" {% d => ({ value: 'super' }) %}
  | "new" {% d => ({ value: 'new' }) %}
  | "typeof" {% d => ({ value: 'typeof' }) %}
  | "instanceof" {% d => ({ value: 'instanceof' }) %}
  | "in" {% d => ({ value: 'in' }) %}
  | "of" {% d => ({ value: 'of' }) %}

Arguments ->
    "(" %NL:* ArgumentList %NL:* ")" {% d => d[2] %}

ArgumentList ->
    null {% () => [] %}
  | AssignmentExpression {% d => [d[0]] %}
  | ArgumentList %NL:* "," %NL:* AssignmentExpression {% d => [...d[0], d[4]] %}
  | "..." AssignmentExpression {% d => [createNode('SpreadElement', { argument: d[1] })] %}
  | ArgumentList %NL:* "," %NL:* "..." AssignmentExpression {% d => [...d[0], createNode('SpreadElement', { argument: d[5] })] %}

PrimaryExpression ->
    "this" {% () => createNode('ThisExpression') %}
  | "super" {% () => createNode('Super') %}
  | %identifier {% d => createIdentifier(d[0].value, d[0]) %}
  | Literal {% id %}
  | ArrayLiteral {% id %}
  | ObjectLiteral {% id %}
  | FunctionExpression {% id %}
  | TemplateLiteral {% id %}
  | "(" %NL:* Expression %NL:* ")" {% d => d[2] %}

# Function expressions - ALWAYS ANONYMOUS
FunctionExpression ->
    "function" "(" %NL:* ParameterList %NL:* ")" Block
    {% d => createNode('FunctionExpression', {
      async: false,
      id: null,
      params: d[3],
      body: d[6]
    }) %}
  | "async" "function" "(" %NL:* ParameterList %NL:* ")" Block
    {% d => createNode('FunctionExpression', {
      async: true,
      id: null,
      params: d[4],
      body: d[7]
    }) %}

Literal ->
    %number {% d => createLiteral(d[0].value, d[0].text) %}
  | %string {% d => createLiteral(d[0].value, d[0].text) %}
  | %regex {% d => createRegexLiteral(d[0].value.pattern, d[0].value.flags) %}
  | "true" {% () => createLiteral(true, 'true') %}
  | "false" {% () => createLiteral(false, 'false') %}
  | "null" {% () => createLiteral(null, 'null') %}
  | "undefined" {% () => createLiteral(undefined, 'undefined') %}

TemplateLiteral ->
    %templateLiteral 
    {% d => createNode('TemplateLiteral', { 
      raw: d[0].value,
      value: d[0].value 
    }) %}

ArrayLiteral ->
    "[" %NL:* ElementList %NL:* "]" {% d => createNode('ArrayExpression', { elements: d[2] }) %}

ElementList ->
    null {% () => [] %}
  | Element {% d => [d[0]] %}
  | ElementList %NL:* "," %NL:* Element {% d => [...d[0], d[4]] %}
  | ElementList %NL:* "," {% d => [...d[0], null] %}

Element ->
    AssignmentExpression {% id %}
  | "..." AssignmentExpression {% d => createNode('SpreadElement', { argument: d[1] }) %}

# Object literals - ALWAYS objects (never blocks with labels)
# Allow newlines before/after braces and around commas
ObjectLiteral ->
    "{" %NL:* "}" {% () => createNode('ObjectExpression', { properties: [] }) %}
  | "{" %NL:* PropertyDefinitionList %NL:* "}" {% d => createNode('ObjectExpression', { properties: d[2] }) %}

PropertyDefinitionList ->
    PropertyDef {% d => [d[0]] %}
  | PropertyDefinitionList %NL:* "," %NL:* PropertyDef {% d => [...d[0], d[4]] %}
  | PropertyDefinitionList %NL:* "," {% d => d[0] %}

PropertyDef ->
    ObjectPropertyKey %NL:* ":" %NL:* AssignmentExpression
    {% d => createNode('Property', { key: d[0], value: d[4], shorthand: false }) %}
  | PropertyName
    {% d => createNode('Property', { 
      key: createIdentifier(d[0].value), 
      value: createIdentifier(d[0].value), 
      shorthand: true 
    }) %}
  | "..." AssignmentExpression
    {% d => createNode('SpreadElement', { argument: d[1] }) %}

# Object property keys can include reserved words
ObjectPropertyKey ->
    PropertyName {% d => createIdentifier(d[0].value) %}
  | %string {% d => createLiteral(d[0].value, d[0].text) %}
  | %number {% d => createLiteral(d[0].value, d[0].text) %}
  | "[" Expression "]" {% d => d[1] %}

PropertyKey ->
    %identifier {% d => createIdentifier(d[0].value, d[0]) %}
  | %string {% d => createLiteral(d[0].value, d[0].text, d[0]) %}
  | %number {% d => createLiteral(d[0].value, d[0].text) %}
  | "[" Expression "]" {% d => d[1] %}

Block ->
    "{" StatementList "}" {% d => createNode('BlockStatement', { body: d[1] }) %}