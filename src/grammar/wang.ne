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
    { match: /"(?:[^"\\]|\\[^])*"/u, value: s => s.slice(1, -1).replace(/\\(.)/g, '$1') },
    { match: /'(?:[^'\\]|\\[^])*'/u, value: s => s.slice(1, -1).replace(/\\(.)/g, '$1') }
  ],
  
  // Template literals (basic - no embedded expressions for now)
  templateLiteral: { match: /`(?:[^`\\]|\\[^])*`/u, value: s => s.slice(1, -1) },
  
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
      // Control flow (no switch)
      if: 'if', else: 'else',
      for: 'for', while: 'while', do: 'do',
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
  
  // Operators - Only what we're keeping
  '===': /===/u, '!==': /!==/u,
  '==': /==/u, '!=': /!=/u,
  '<=': /<=/u, '>=': />=/u,
  '<<': /<</u, '>>': />>/u, '>>>': />>>/u,
  '&&': /&&/u, '||': /\|\|/u, '??': /\?\?/u,
  '?.': /\?\./u, '...': /\.\.\./u,
  '++': /\+\+/u, '--': /--/u,
  '**': /\*\*/u,
  
  // Pipeline operators (Wang-specific)
  '|>': /\|>/u,
  '->': /->/u,
  '=>': /=>/u,
  
  // Single character tokens
  '=': /=/u, '<': /</u, '>': />/u,
  '+': /\+/u, '-': /-/u, '*': /\*/u, '/': /\//u, '%': /%/u,
  '&': /&/u, '|': /\|/u, '^': /\^/u, '~': /~/u, '!': /!/u,
  '?': /\?/u, ':': /:/u,
  '(': /\(/u, ')': /\)/u, '[': /\[/u, ']': /\]/u, '{': /\{/u, '}': /\}/u,
  ',': /,/u, '.': /\./u, ';': /;/u
});

// Skip whitespace and comments, preserve newlines
lexer.next = (next => () => {
  let tok;
  while ((tok = next.call(lexer)) && (tok.type === 'WS' || tok.type === 'lineComment' || tok.type === 'blockComment')) {
    // Skip whitespace and comments
  }
  return tok;
})(lexer.next);

// AST helper functions
function createNode(type, props = {}) {
  return { type, ...props };
}

function createBinaryOp(left, operator, right) {
  return createNode('BinaryExpression', { operator, left, right });
}

function createUnaryOp(operator, argument, prefix = true) {
  return createNode('UnaryExpression', { operator, argument, prefix });
}

function createPipeline(left, operator, right) {
  return createNode('PipelineExpression', { operator, left, right });
}

function createIdentifier(name) {
  return createNode('Identifier', { name });
}

function createLiteral(value, raw) {
  return createNode('Literal', { value, raw });
}

%}

@lexer lexer

# ============= PROGRAM STRUCTURE =============

# Start rule
Program -> StatementList {% d => createNode('Program', { body: d[0] }) %}

# Statements - NEWLINE SEPARATED ONLY (no semicolons)
StatementList ->
    null {% () => [] %}
  | Statement {% d => [d[0]] %}
  | StatementList %NL Statement {% d => [...d[0], d[2]] %}
  | StatementList %NL {% d => d[0] %}  # Allow trailing newlines

Statement ->
    Declaration {% id %}
  | LabeledStatement {% id %}
  | ControlStatement {% id %}
  | ExpressionStatement {% id %}
  | Block {% id %}
  | PipelineContinuation {% id %}
  | MemberContinuation {% id %}

# Handle pipeline operators at the start of a line as continuations
PipelineContinuation ->
    ("|>" | "->") %NL:* AssignmentExpression
    {% d => {
      // This will be handled specially by the statement list processor
      return createNode('PipelineContinuation', {
        operator: d[0][0].value,
        right: d[2]
      });
    } %}

# Handle member access at the start of a line as continuations  
MemberContinuation ->
    "." %identifier Arguments:?
    {% d => {
      return createNode('MemberContinuation', {
        property: createIdentifier(d[1].value),
        arguments: d[2] || null
      });
    } %}
  | "?." %identifier Arguments:?
    {% d => {
      return createNode('MemberContinuation', {
        property: createIdentifier(d[1].value),
        arguments: d[2] || null,
        optional: true
      });
    } %}

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
    %identifier {% d => createIdentifier(d[0].value) %}
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
    "async":? "function" %identifier "(" ParameterList ")" Block
    {% d => createNode('FunctionDeclaration', {
      async: !!d[0],
      id: createIdentifier(d[2].value),
      params: d[4],
      body: d[6]
    }) %}

ParameterList ->
    null {% () => [] %}
  | Parameter {% d => [d[0]] %}
  | ParameterList "," Parameter {% d => [...d[0], d[2]] %}

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
    "async":? PropertyKey "(" ParameterList ")" Block
    {% d => createNode('MethodDefinition', {
      async: !!d[0],
      kind: 'method',
      key: d[1],
      params: d[3],
      body: d[5]
    }) %}
  | "constructor" "(" ParameterList ")" Block
    {% d => createNode('MethodDefinition', {
      kind: 'constructor',
      key: createIdentifier('constructor'),
      params: d[2],
      body: d[4]
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
  | TryStatement {% id %}
  | ThrowStatement {% id %}
  | ReturnStatement {% id %}
  | BreakStatement {% id %}
  | ContinueStatement {% id %}

IfStatement ->
    "if" "(" Expression ")" Statement ("else" Statement):?
    {% d => createNode('IfStatement', {
      test: d[2],
      consequent: d[4],
      alternate: d[5] ? d[5][1] : null
    }) %}

WhileStatement ->
    "while" "(" Expression ")" Statement
    {% d => createNode('WhileStatement', { test: d[2], body: d[4] }) %}

DoWhileStatement ->
    "do" Statement "while" "(" Expression ")"
    {% d => createNode('DoWhileStatement', { body: d[1], test: d[4] }) %}

ForStatement ->
    # C-style for loop (no ++ operator)
    "for" "(" (VariableDeclaration | Expression | null) ";" (Expression | null) ";" (Expression | null) ")" Statement
    {% d => createNode('ForStatement', {
      init: d[2] ? d[2][0] : null,
      test: d[4] ? d[4][0] : null,
      update: d[6] ? d[6][0] : null,
      body: d[8]
    }) %}
  | # for-of loop (no for-in)
    "for" "(" ("let" | "const" | "var") BindingPattern "of" Expression ")" Statement
    {% d => createNode('ForOfStatement', {
      left: createNode('VariableDeclaration', { 
        kind: d[2][0].value, 
        declarations: [createNode('VariableDeclarator', { id: d[3], init: null })] 
      }),
      right: d[5],
      body: d[7]
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

Expression -> PipelineExpression {% id %}

# Pipeline operators (Wang-specific feature)
PipelineExpression ->
    AssignmentExpression {% id %}
  | PipelineExpression %NL:* ("|>" | "->") %NL:* AssignmentExpression
    {% d => createPipeline(d[0], d[2][0].value, d[4]) %}

# Assignment - ONLY SIMPLE = (no compound assignments)
AssignmentExpression ->
    ConditionalExpression {% id %}
  | ArrowFunction {% id %}
  | LeftHandSideExpression "=" AssignmentExpression
    {% d => createNode('AssignmentExpression', {
      operator: '=',
      left: d[0],
      right: d[2]
    }) %}

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
    %identifier {% d => [createIdentifier(d[0].value)] %}
  | "(" ParameterList ")" {% d => d[1] %}

ArrowBody ->
    Block {% id %}
  | AssignmentExpression {% id %}

# NO ternary operator (causes ambiguity with multiline expressions)
ConditionalExpression -> LogicalOrExpression {% id %}

LogicalOrExpression ->
    LogicalAndExpression {% id %}
  | LogicalOrExpression ("||" | "??") LogicalAndExpression
    {% d => createBinaryOp(d[0], d[1][0].value, d[2]) %}

LogicalAndExpression ->
    EqualityExpression {% id %}
  | LogicalAndExpression "&&" EqualityExpression
    {% d => createBinaryOp(d[0], d[1].value, d[2]) %}

EqualityExpression ->
    RelationalExpression {% id %}
  | EqualityExpression ("==" | "!=" | "===" | "!==") RelationalExpression
    {% d => createBinaryOp(d[0], d[1][0].value, d[2]) %}

RelationalExpression ->
    AdditiveExpression {% id %}
  | RelationalExpression ("<" | ">" | "<=" | ">=") AdditiveExpression
    {% d => createBinaryOp(d[0], d[1][0].value, d[2]) %}
  | RelationalExpression ("instanceof" | "in") AdditiveExpression
    {% d => createBinaryOp(d[0], d[1][0].value, d[2]) %}

AdditiveExpression ->
    MultiplicativeExpression {% id %}
  | AdditiveExpression ("+" | "-") MultiplicativeExpression
    {% d => createBinaryOp(d[0], d[1][0].value, d[2]) %}

MultiplicativeExpression ->
    ExponentiationExpression {% id %}
  | MultiplicativeExpression ("*" | "/" | "%") ExponentiationExpression
    {% d => createBinaryOp(d[0], d[1][0].value, d[2]) %}

ExponentiationExpression ->
    UnaryExpression {% id %}
  | UnaryExpression "**" ExponentiationExpression
    {% d => createBinaryOp(d[0], d[1].value, d[2]) %}

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
  | CallExpression Arguments {% d => createNode('CallExpression', { callee: d[0], arguments: d[1] }) %}
  | CallExpression "[" Expression "]"
    {% d => createNode('MemberExpression', { object: d[0], property: d[2], computed: true }) %}
  | CallExpression %NL:* "." %identifier
    {% d => createNode('MemberExpression', { object: d[0], property: createIdentifier(d[3].value), computed: false }) %}
  | CallExpression %NL:* "?." %identifier
    {% d => createNode('MemberExpression', { object: d[0], property: createIdentifier(d[3].value), computed: false, optional: true }) %}

NewExpression ->
    "new" MemberExpression Arguments:?
    {% d => createNode('NewExpression', { callee: d[1], arguments: d[2] || [] }) %}
  | MemberExpression {% id %}

MemberExpression ->
    PrimaryExpression {% id %}
  | MemberExpression "[" Expression "]"
    {% d => createNode('MemberExpression', { object: d[0], property: d[2], computed: true }) %}
  | MemberExpression %NL:* "." %identifier
    {% d => createNode('MemberExpression', { object: d[0], property: createIdentifier(d[3].value), computed: false }) %}
  | MemberExpression %NL:* "?." %identifier
    {% d => createNode('MemberExpression', { object: d[0], property: createIdentifier(d[3].value), computed: false, optional: true }) %}

Arguments ->
    "(" ArgumentList ")" {% d => d[1] %}

ArgumentList ->
    null {% () => [] %}
  | AssignmentExpression {% d => [d[0]] %}
  | ArgumentList "," AssignmentExpression {% d => [...d[0], d[2]] %}
  | "..." AssignmentExpression {% d => [createNode('SpreadElement', { argument: d[1] })] %}
  | ArgumentList "," "..." AssignmentExpression {% d => [...d[0], createNode('SpreadElement', { argument: d[3] })] %}

PrimaryExpression ->
    "this" {% () => createNode('ThisExpression') %}
  | "super" {% () => createNode('Super') %}
  | %identifier {% d => createIdentifier(d[0].value) %}
  | Literal {% id %}
  | ArrayLiteral {% id %}
  | ObjectLiteral {% id %}
  | FunctionExpression {% id %}
  | TemplateLiteral {% id %}
  | "(" Expression ")" {% d => d[1] %}

# Function expressions - ALWAYS ANONYMOUS
FunctionExpression ->
    "function" "(" ParameterList ")" Block
    {% d => createNode('FunctionExpression', {
      async: false,
      id: null,
      params: d[2],
      body: d[4]
    }) %}
  | "async" "function" "(" ParameterList ")" Block
    {% d => createNode('FunctionExpression', {
      async: true,
      id: null,
      params: d[3],
      body: d[5]
    }) %}

Literal ->
    %number {% d => createLiteral(d[0].value, d[0].text) %}
  | %string {% d => createLiteral(d[0].value, d[0].text) %}
  | "true" {% () => createLiteral(true, 'true') %}
  | "false" {% () => createLiteral(false, 'false') %}
  | "null" {% () => createLiteral(null, 'null') %}
  | "undefined" {% () => createLiteral(undefined, 'undefined') %}

TemplateLiteral ->
    %templateLiteral 
    {% d => createNode('TemplateLiteral', { 
      quasis: [createNode('TemplateElement', { value: { cooked: d[0].value, raw: d[0].value } })], 
      expressions: [] 
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
    PropertyKey %NL:* ":" %NL:* AssignmentExpression
    {% d => createNode('Property', { key: d[0], value: d[4], shorthand: false }) %}
  | %identifier
    {% d => createNode('Property', { 
      key: createIdentifier(d[0].value), 
      value: createIdentifier(d[0].value), 
      shorthand: true 
    }) %}
  | "..." AssignmentExpression
    {% d => createNode('SpreadElement', { argument: d[1] }) %}

PropertyKey ->
    %identifier {% d => createIdentifier(d[0].value) %}
  | %string {% d => createLiteral(d[0].value, d[0].text) %}
  | %number {% d => createLiteral(d[0].value, d[0].text) %}
  | "[" Expression "]" {% d => d[1] %}

Block ->
    "{" StatementList "}" {% d => createNode('BlockStatement', { body: d[1] }) %}