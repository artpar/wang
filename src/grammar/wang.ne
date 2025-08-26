# Wang Language Grammar for Nearley
# Modern JavaScript-like syntax with optional semicolons and Unicode support

@{%
const moo = require('moo');

// Unicode-aware lexer with automatic semicolon insertion support
const lexer = moo.compile({
  // Whitespace and comments
  WS: /[ \t\r]+/u,
  NL: { match: /\n/u, lineBreaks: true },
  lineComment: /\/\/.*$/u,
  blockComment: { match: /\/\*[^]*?\*\//u, lineBreaks: true },
  
  // String literals with better escape handling
  string: [
    { match: /"(?:[^"\\]|\\[^])*"/u, value: s => s.slice(1, -1).replace(/\\(.)/g, '$1') },
    { match: /'(?:[^'\\]|\\[^])*'/u, value: s => s.slice(1, -1).replace(/\\(.)/g, '$1') }
  ],
  
  // Template literals (simplified)
  templateLiteral: { match: /`(?:[^`\\]|\\[^])*`/u, value: s => s.slice(1, -1) },
  
  // Numbers with hex, octal, binary support
  number: {
    match: /(?:0[xX][0-9a-fA-F]+|0[oO][0-7]+|0[bB][01]+|(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/u,
    value: s => {
      if (s.startsWith('0x') || s.startsWith('0X')) return parseInt(s, 16);
      if (s.startsWith('0o') || s.startsWith('0O')) return parseInt(s, 8);
      if (s.startsWith('0b') || s.startsWith('0B')) return parseInt(s, 2);
      return parseFloat(s);
    }
  },
  
  // Identifiers with full Unicode support (ES2015+ compliant)
  identifier: {
    match: /[\p{L}\p{Nl}$_][\p{L}\p{Mn}\p{Mc}\p{Nd}\p{Pc}$_]*/u,
    type: moo.keywords({
      // Variable declarations
      let: 'let', const: 'const', var: 'var',
      // Control flow
      if: 'if', else: 'else', switch: 'switch', case: 'case', default: 'default',
      for: 'for', while: 'while', do: 'do',
      break: 'break', continue: 'continue', return: 'return',
      // Functions and classes
      function: 'function', class: 'class', extends: 'extends',
      constructor: 'constructor', static: 'static',
      get: 'get', set: 'set', async: 'async', await: 'await',
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
  
  // Operators (order matters for longest match) - all with /u flag for consistency
  '===': /===/u, '!==': /!==/u, '**=': /\*\*=/u,
  '<<=' : /<<=/u, '>>=' : />>=/u, '>>>=' : />>>=/u,
  '++': /\+\+/u, '--': /--/u, '**': /\*\*/u,
  '<=': /<=/u, '>=': />=/u, '==': /==/u, '!=': /!=/u,
  '<<': /<</u, '>>': />>/u, '>>>': />>>/u,
  '&&': /&&/u, '||': /\|\|/u, '??': /\?\?/u,
  '?.': /\?\./u, '...': /\.\.\./u,
  '+=': /\+=/u, '-=': /-=/u, '*=': /\*=/u, '/=': /\/=/u, '%=': /%=/u,
  '&=': /&=/u, '|=': /\|=/u, '^=': /\^=/u,
  
  // Pipeline operators (Wang-specific)
  '|>': /\|>/u,
  '->': /->/u,
  '=>': /=>/u,
  
  // Single character tokens - all with /u flag
  '=': /=/u, '<': /</u, '>': />/u,
  '+': /\+/u, '-': /-/u, '*': /\*/u, '/': /\//u, '%': /%/u,
  '&': /&/u, '|': /\|/u, '^': /\^/u, '~': /~/u, '!': /!/u,
  '?': /\?/u, ':': /:/u, ';': /;/u,
  '(': /\(/u, ')': /\)/u, '[': /\[/u, ']': /\]/u, '{': /\{/u, '}': /\}/u,
  ',': /,/u, '.': /\./u,
  '@': /@/u, '#': /#/u, '_': /_/u
});

// Skip whitespace and comments, preserve newlines for ASI
lexer.next = (next => () => {
  let tok;
  while ((tok = next.call(lexer)) && (tok.type === 'WS' || tok.type === 'lineComment' || tok.type === 'blockComment')) {
    // Skip whitespace and comments but preserve newlines
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

# Start rule
Program -> StatementList {% d => createNode('Program', { body: d[0] }) %}

# Statement list - handle separators with simple rules
StatementList ->
    null {% () => [] %}
  | Statement {% d => [d[0]] %}
  | StatementList ";" Statement {% d => [...d[0], d[2]] %}
  | StatementList %NL Statement {% d => [...d[0], d[2]] %}
  | StatementList ";" {% d => d[0] %}
  | StatementList %NL {% d => d[0] %}

Statement ->
    Declaration {% id %}
  | ControlStatement {% id %}
  | ExpressionStatement {% id %}
  | Block {% id %}
  | ";" {% () => createNode('EmptyStatement') %}

# Declarations
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
  | "..." BindingPattern {% d => createNode('RestElement', { argument: d[1] }) %}

# Function Declaration
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

# Class Declaration  
ClassDeclaration ->
    "class" %identifier ("extends" %identifier):? ClassBody
    {% d => createNode('ClassDeclaration', {
      id: createIdentifier(d[1].value),
      superClass: d[2] ? createIdentifier(d[2][1].value) : null,
      body: d[3]
    }) %}

ClassBody ->
    "{" ClassMemberList "}"
    {% d => createNode('ClassBody', { body: d[1] }) %}

# Simplified class member list to avoid ambiguity
ClassMemberList ->
    null {% () => [] %}
  | ClassMember {% d => d[0] ? [d[0]] : [] %}
  | ClassMemberList OptionalNewlines ClassMember 
    {% d => d[2] ? [...d[0], d[2]] : d[0] %}

# Optional newlines/semicolons in class body
OptionalNewlines -> (";" | %NL):+ {% () => null %}

ClassMember ->
    MethodDefinition {% id %}
  | PropertyDefinition {% id %}
  | ";" {% () => null %}

MethodDefinition ->
    ("static"):? ("async"):? ("get"|"set"):? PropertyKey "(" ParameterList ")" Block
    {% d => createNode('MethodDefinition', {
      static: !!d[0],
      async: !!d[1],
      kind: d[2] ? d[2][0].value : 'method',
      key: d[3],
      params: d[5],
      body: d[7]
    }) %}
  | "constructor" "(" ParameterList ")" Block
    {% d => createNode('MethodDefinition', {
      kind: 'constructor',
      key: createIdentifier('constructor'),
      params: d[2],
      body: d[4]
    }) %}

PropertyDefinition ->
    ("static"):? PropertyKey ("=" AssignmentExpression):?
    {% d => createNode('PropertyDefinition', {
      static: !!d[0],
      key: d[1],
      value: d[2] ? d[2][1] : null
    }) %}

# Import/Export
ImportDeclaration ->
    "import" ImportClause "from" %string
    {% d => createNode('ImportDeclaration', { 
      specifiers: d[1], 
      source: createLiteral(d[3].value, d[3].text) 
    }) %}
  | "import" %string
    {% d => createNode('ImportDeclaration', { 
      specifiers: [], 
      source: createLiteral(d[1].value, d[1].text) 
    }) %}

ImportClause ->
    "{" ImportsList "}" {% d => d[1] %}
  | "*" "as" %identifier {% d => [createNode('ImportNamespaceSpecifier', { local: createIdentifier(d[2].value) })] %}

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
  | "export" "{" ExportsList "}" ("from" %string):?
    {% d => createNode('ExportNamedDeclaration', { 
      specifiers: d[2],
      source: d[4] ? createLiteral(d[4][1].value, d[4][1].text) : null
    }) %}
  | "export" "default" (AssignmentExpression | Declaration)
    {% d => createNode('ExportDefaultDeclaration', { declaration: d[2][0] }) %}

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

# Control Statements
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
    "for" "(" (VariableDeclaration | Expression | null) ";" (Expression | null) ";" (Expression | null) ")" Statement
    {% d => createNode('ForStatement', {
      init: d[2] ? d[2][0] : null,
      test: d[4] ? d[4][0] : null,
      update: d[6] ? d[6][0] : null,
      body: d[8]
    }) %}
  | "for" "(" ("let" | "const" | "var") BindingPattern ("in" | "of") Expression ")" Statement
    {% d => createNode(d[4][0].value === 'in' ? 'ForInStatement' : 'ForOfStatement', {
      left: createNode('VariableDeclaration', { 
        kind: d[2][0].value, 
        declarations: [createNode('VariableDeclarator', { id: d[3], init: null })] 
      }),
      right: d[5],
      body: d[7]
    }) %}

SwitchStatement ->
    "switch" "(" Expression ")" "{" CaseClauses "}"
    {% d => createNode('SwitchStatement', { discriminant: d[2], cases: d[5] }) %}

CaseClauses ->
    null {% () => [] %}
  | CaseClause {% d => [d[0]] %}
  | CaseClauses CaseClause {% d => [...d[0], d[1]] %}

CaseClause ->
    "case" Expression ":" StatementList
    {% d => createNode('SwitchCase', { test: d[1], consequent: d[3] }) %}
  | "default" ":" StatementList
    {% d => createNode('SwitchCase', { test: null, consequent: d[2] }) %}

TryStatement ->
    "try" Block ("catch" ("(" BindingPattern ")"):? Block):? ("finally" Block):?
    {% d => createNode('TryStatement', {
      block: d[1],
      handler: d[2] ? createNode('CatchClause', {
        param: d[2][1] ? d[2][1][1] : null,
        body: d[2][2]
      }) : null,
      finalizer: d[3] ? d[3][1] : null
    }) %}

ThrowStatement ->
    "throw" Expression
    {% d => createNode('ThrowStatement', { argument: d[1] }) %}

ReturnStatement ->
    "return" (Expression):?
    {% d => createNode('ReturnStatement', { argument: d[1] ? d[1][0] : null }) %}

BreakStatement ->
    "break" (%identifier):?
    {% d => createNode('BreakStatement', { label: d[1] ? createIdentifier(d[1][0].value) : null }) %}

ContinueStatement ->
    "continue" (%identifier):?
    {% d => createNode('ContinueStatement', { label: d[1] ? createIdentifier(d[1][0].value) : null }) %}

# Expression Statement
ExpressionStatement ->
    Expression {% d => createNode('ExpressionStatement', { expression: d[0] }) %}

# Expression hierarchy (simplified)
Expression -> PipelineExpression {% id %}

PipelineExpression ->
    AssignmentExpression {% id %}
  | PipelineExpression ("|>" | "->") AssignmentExpression
    {% d => createPipeline(d[0], d[1][0].value, d[2]) %}

AssignmentExpression ->
    ConditionalExpression {% id %}
  | ArrowFunction {% id %}
  | ConditionalExpression AssignmentOperator AssignmentExpression
    {% d => createNode('AssignmentExpression', {
      operator: d[1],
      left: d[0],
      right: d[2]
    }) %}

AssignmentOperator ->
    ("=" | "+=" | "-=" | "*=" | "/=" | "%=" | "**=" | "<<=" | ">>=" | ">>>=" | "&=" | "|=" | "^=")
    {% d => d[0][0].value %}

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

ConditionalExpression ->
    LogicalOrExpression {% id %}
  | LogicalOrExpression "?" Expression ":" ConditionalExpression
    {% d => createNode('ConditionalExpression', {
      test: d[0],
      consequent: d[2],
      alternate: d[4]
    }) %}

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
  | CallExpression "." %identifier
    {% d => createNode('MemberExpression', { object: d[0], property: createIdentifier(d[2].value), computed: false }) %}
  | CallExpression "?." %identifier
    {% d => createNode('MemberExpression', { object: d[0], property: createIdentifier(d[2].value), computed: false, optional: true }) %}

NewExpression ->
    "new" MemberExpression Arguments:?
    {% d => createNode('NewExpression', { callee: d[1], arguments: d[2] || [] }) %}
  | MemberExpression {% id %}

MemberExpression ->
    PrimaryExpression {% id %}
  | MemberExpression "[" Expression "]"
    {% d => createNode('MemberExpression', { object: d[0], property: d[2], computed: true }) %}
  | MemberExpression "." %identifier
    {% d => createNode('MemberExpression', { object: d[0], property: createIdentifier(d[2].value), computed: false }) %}
  | MemberExpression "?." %identifier
    {% d => createNode('MemberExpression', { object: d[0], property: createIdentifier(d[2].value), computed: false, optional: true }) %}

Arguments ->
    "(" ArgumentList ")" {% d => d[1] %}

ArgumentList ->
    null {% () => [] %}
  | AssignmentExpression {% d => [d[0]] %}
  | ArgumentList "," AssignmentExpression {% d => [...d[0], d[2]] %}
  | "..." AssignmentExpression {% d => [createNode('SpreadElement', { argument: d[1] })] %}

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

FunctionExpression ->
    "function" %identifier:? "(" ParameterList ")" Block
    {% d => createNode('FunctionExpression', {
      async: false,
      id: d[1] ? createIdentifier(d[1].value) : null,
      params: d[3],
      body: d[5]
    }) %}
  | "async" "function" %identifier:? "(" ParameterList ")" Block
    {% d => createNode('FunctionExpression', {
      async: true,
      id: d[2] ? createIdentifier(d[2].value) : null,
      params: d[4],
      body: d[6]
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
      quasis: [createNode('TemplateElement', { value: { cooked: d[0].value, raw: d[0].text } })], 
      expressions: [] 
    }) %}

ArrayLiteral ->
    "[" ElementList "]" {% d => createNode('ArrayExpression', { elements: d[1] }) %}

ElementList ->
    null {% () => [] %}
  | Element {% d => [d[0]] %}
  | ElementList "," Element {% d => [...d[0], d[2]] %}
  | ElementList "," {% d => [...d[0], null] %}

Element ->
    AssignmentExpression {% id %}
  | "..." AssignmentExpression {% d => createNode('SpreadElement', { argument: d[1] }) %}

ObjectLiteral ->
    "{" %NL:* "}" {% () => createNode('ObjectExpression', { properties: [] }) %}
  | "{" %NL:* PropertyDefinitionList %NL:* "}" {% d => createNode('ObjectExpression', { properties: d[2] }) %}

# Simplified property list - allow newlines anywhere, single path through grammar
PropertyDefinitionList ->
    PropertyDefinition {% d => [d[0]] %}
  | PropertyDefinitionList PropertySeparator PropertyDefinition 
    {% d => [...d[0], d[2]] %}
  | PropertyDefinitionList PropertySeparator 
    {% d => d[0] %}

# Property separator - comma with optional newlines
PropertySeparator -> "," %NL:* {% () => null %}

PropertyDefinition ->
    PropertyKey ":" AssignmentExpression
    {% d => createNode('Property', { key: d[0], value: d[2], shorthand: false }) %}
  | %identifier
    {% d => createNode('Property', { 
      key: createIdentifier(d[0].value), 
      value: createIdentifier(d[0].value), 
      shorthand: true 
    }) %}
  | "..." AssignmentExpression
    {% d => createNode('SpreadElement', { argument: d[1] }) %}
  | MethodDefinition {% id %}

PropertyKey ->
    %identifier {% d => createIdentifier(d[0].value) %}
  | %string {% d => createLiteral(d[0].value, d[0].text) %}
  | %number {% d => createLiteral(d[0].value, d[0].text) %}
  | "[" Expression "]" {% d => d[1] %}

Block ->
    "{" StatementList "}" {% d => createNode('BlockStatement', { body: d[1] }) %}