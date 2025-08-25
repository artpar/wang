# Wang Language Grammar for Nearley
# Generates a standalone parser with no runtime dependencies

@{%
const moo = require('moo');

// Define the lexer using Moo (lightweight, works great with Nearley)
const lexer = moo.compile({
  // Whitespace and comments
  WS: /[ \t]+/,
  NL: { match: /\n/, lineBreaks: true },
  comment: /\/\/.*?$/,
  blockComment: /\/\*[\s\S]*?\*\//,
  
  // String literals
  string: [
    {match: /"(?:\\["\\]|[^\n"\\])*"/, value: s => s.slice(1, -1)},
    {match: /'(?:\\['\\]|[^\n'\\])*'/, value: s => s.slice(1, -1)}
  ],
  
  // Template literals
  templateLiteral: {match: /`(?:\\[`\\]|[^`\\])*`/, value: s => s.slice(1, -1)},
  
  // Numbers
  number: /0|[1-9][0-9]*(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/,
  
  // Identifiers (must come before keywords in moo)
  identifier: {
    match: /[a-zA-Z_$][a-zA-Z0-9_$]*/,
    type: moo.keywords({
      keywords: [
        'let', 'const', 'var',
        'if', 'else', 'for', 'while', 'do',
        'function', 'class', 'extends', 'new',
        'return', 'break', 'continue',
        'import', 'export', 'from', 'as',
        'async', 'await',
        'try', 'catch', 'finally', 'throw',
        'true', 'false', 'null', 'undefined',
        'this', 'super',
        'typeof', 'instanceof', 'in', 'of',
        'static', 'private', 'protected', 'public',
        'constructor', 'get', 'set'
      ]
    })
  },
  
  // Pipeline operators
  pipeline: '|>',
  arrow: '->',
  fatArrow: '=>',
  
  // Operators
  '++': '++',
  '--': '--',
  '**': '**',
  '?.': '?.',
  '??': '??',
  '...': '...',
  
  // Comparison
  '===': '===',
  '!==': '!==',
  '==': '==',
  '!=': '!=',
  '<=': '<=',
  '>=': '>=',
  '<': '<',
  '>': '>',
  
  // Logical
  '&&': '&&',
  '||': '||',
  '!': '!',
  
  // Assignment
  '+=': '+=',
  '-=': '-=',
  '*=': '*=',
  '/=': '/=',
  '=': '=',
  
  // Arithmetic
  '+': '+',
  '-': '-',
  '*': '*',
  '/': '/',
  '%': '%',
  
  // Punctuation
  '(': '(',
  ')': ')',
  '[': '[',
  ']': ']',
  '{': '{',
  '}': '}',
  ',': ',',
  '.': '.',
  ':': ':',
  ';': ';',
  '?': '?',
  '_': '_',
  '@': '@'
});

// Skip whitespace and comments, and newlines in most contexts
lexer.next = (next => () => {
  let tok;
  while ((tok = next.call(lexer)) && (tok.type === 'WS' || tok.type === 'NL' || tok.type === 'comment' || tok.type === 'blockComment')) {
    // Skip whitespace, newlines, and comments
  }
  return tok;
})(lexer.next);

// Helper functions for AST building
function buildBinaryOp(left, op, right) {
  return {
    type: 'BinaryExpression',
    operator: op,
    left: left,
    right: right
  };
}

function buildUnaryOp(op, argument) {
  return {
    type: 'UnaryExpression',
    operator: op,
    argument: argument
  };
}

function buildPipeline(left, op, right) {
  return {
    type: 'PipelineExpression',
    operator: op,
    left: left,
    right: right
  };
}

%}

@lexer lexer

# Main program (start rule)
Program -> Statements {% d => ({ type: 'Program', body: d[0] }) %}

# Statements with semicolon separators
Statements ->
    null {% () => [] %}
  | Statement {% d => [d[0]] %}
  | Statements ";" Statement {% d => [...d[0], d[2]] %}
  | Statements ";" {% d => d[0] %}

# Helper rules
semicolon -> ";"
staticAsyncGetSet -> "static" | "async" | "get" | "set"
static -> "static"
assignment -> "=" AssignmentExpression
asIdentifier -> "as" %identifier {% d => d[1].value %}
defaultAssignment -> "=" Expression {% d => d[1] %}
async -> "async"
extendsClause -> "extends" %identifier {% d => d[1].value %}
elseClause -> "else" Statement {% d => d[1] %}
catchParam -> "(" BindingPattern ")" {% d => d[1] %}
functionName -> %identifier {% d => d[0].value %}

# Statements
Statement ->
    ImportStatement {% id %}
  | ExportStatement {% id %}
  | VariableDeclaration {% id %}
  | FunctionDeclaration {% id %}
  | ClassDeclaration {% id %}
  | IfStatement {% id %}
  | ForStatement {% id %}
  | WhileStatement {% id %}
  | TryStatement {% id %}
  | ThrowStatement {% id %}
  | ReturnStatement {% id %}
  | ExpressionStatement {% id %}
  | Block {% id %}

# Import/Export
ImportStatement ->
    "import" ImportSpecifiers "from" %string
    {% d => ({ type: 'ImportDeclaration', specifiers: d[1], source: d[3].value }) %}
  | "import" %string
    {% d => ({ type: 'ImportDeclaration', specifiers: [], source: d[1].value }) %}

ImportSpecifiers ->
    "{" ImportSpecifierList "}" {% d => d[1] %}
  | "*" "as" %identifier {% d => [{ type: 'ImportNamespaceSpecifier', local: d[2].value }] %}

ImportSpecifierList ->
    ImportSpecifier {% d => [d[0]] %}
  | ImportSpecifierList "," ImportSpecifier {% d => [...d[0], d[2]] %}

ImportSpecifier ->
    %identifier asIdentifier:?
    {% d => ({ 
      type: 'ImportSpecifier', 
      imported: d[0].value,
      local: d[1] ? d[1] : d[0].value 
    }) %}

ExportStatement ->
    "export" VariableDeclaration {% d => ({ type: 'ExportNamedDeclaration', declaration: d[1] }) %}
  | "export" FunctionDeclaration {% d => ({ type: 'ExportNamedDeclaration', declaration: d[1] }) %}
  | "export" ClassDeclaration {% d => ({ type: 'ExportNamedDeclaration', declaration: d[1] }) %}
  | "export" "{" ExportSpecifierList "}" {% d => ({ type: 'ExportNamedDeclaration', specifiers: d[2] }) %}

ExportSpecifierList ->
    ExportSpecifier {% d => [d[0]] %}
  | ExportSpecifierList "," ExportSpecifier {% d => [...d[0], d[2]] %}

ExportSpecifier ->
    %identifier asIdentifier:?
    {% d => ({ 
      type: 'ExportSpecifier',
      local: d[0].value,
      exported: d[1] ? d[1] : d[0].value
    }) %}

# Variable Declarations
VariableDeclaration ->
    ("let" | "const" | "var") VariableDeclaratorList
    {% d => ({ type: 'VariableDeclaration', kind: d[0][0].value, declarations: d[1] }) %}

VariableDeclaratorList ->
    VariableDeclarator {% d => [d[0]] %}
  | VariableDeclaratorList "," VariableDeclarator {% d => [...d[0], d[2]] %}

VariableDeclarator ->
    BindingPattern defaultAssignment:?
    {% d => ({ type: 'VariableDeclarator', id: d[0], init: d[1] ? d[1] : null }) %}

BindingPattern ->
    %identifier {% d => ({ type: 'Identifier', name: d[0].value }) %}
  | ObjectPattern {% id %}
  | ArrayPattern {% id %}

ObjectPattern ->
    "{" ObjectPatternProperties "}"
    {% d => ({ type: 'ObjectPattern', properties: d[1] }) %}

ObjectPatternProperties ->
    null {% () => [] %}
  | ObjectPatternProperty {% d => [d[0]] %}
  | ObjectPatternProperties "," ObjectPatternProperty {% d => [...d[0], d[2]] %}

ObjectPatternProperty ->
    %identifier {% d => ({ type: 'Property', key: d[0].value, value: d[0].value, shorthand: true }) %}
  | %identifier ":" BindingPattern {% d => ({ type: 'Property', key: d[0].value, value: d[2], shorthand: false }) %}
  | "..." %identifier {% d => ({ type: 'RestElement', argument: d[1].value }) %}

ArrayPattern ->
    "[" ArrayPatternElements "]"
    {% d => ({ type: 'ArrayPattern', elements: d[1] }) %}

ArrayPatternElements ->
    null {% () => [] %}
  | ArrayPatternElement {% d => [d[0]] %}
  | ArrayPatternElements "," ArrayPatternElement {% d => [...d[0], d[2]] %}

ArrayPatternElement ->
    BindingPattern {% id %}
  | "..." %identifier {% d => ({ type: 'RestElement', argument: d[1].value }) %}
  | null {% () => null %}

# Functions
FunctionDeclaration ->
    "function" %identifier "(" ParameterList ")" Block
    {% d => ({
      type: 'FunctionDeclaration',
      async: false,
      id: { type: 'Identifier', name: d[1].value },
      params: d[3],
      body: d[5]
    }) %}
  | "async" "function" %identifier "(" ParameterList ")" Block
    {% d => ({
      type: 'FunctionDeclaration',
      async: true,
      id: { type: 'Identifier', name: d[2].value },
      params: d[4],
      body: d[6]
    }) %}

ParameterList ->
    null {% () => [] %}
  | Parameter {% d => [d[0]] %}
  | ParameterList "," Parameter {% d => [...d[0], d[2]] %}

Parameter ->
    BindingPattern {% id %}
  | "..." BindingPattern {% d => ({ type: 'RestElement', argument: d[1] }) %}

# Classes
ClassDeclaration ->
    "class" %identifier extendsClause:? ClassBody
    {% d => ({
      type: 'ClassDeclaration',
      id: { type: 'Identifier', name: d[1].value },
      superClass: d[2] ? { type: 'Identifier', name: d[2] } : null,
      body: d[3]
    }) %}

ClassBody ->
    "{" ClassMembers "}"
    {% d => ({ type: 'ClassBody', body: d[1] }) %}

ClassMembers ->
    null {% () => [] %}
  | ClassMembers ClassMember {% d => d[1] ? [...d[0], d[1]] : d[0] %}

ClassMember ->
    MethodDefinition {% id %}
  | PropertyDefinition {% id %}
  | ";" {% () => null %}

MethodDefinition ->
    staticAsyncGetSet:* %identifier "(" ParameterList ")" Block
    {% d => ({
      type: 'MethodDefinition',
      static: d[0].some(k => k && k[0].value === 'static'),
      async: d[0].some(k => k && k[0].value === 'async'),
      kind: d[0].find(k => k && (k[0].value === 'get' || k[0].value === 'set'))?.[0].value || 'method',
      key: { type: 'Identifier', name: d[1].value },
      params: d[3],
      body: d[5]
    }) %}
  | "constructor" "(" ParameterList ")" Block
    {% d => ({
      type: 'MethodDefinition',
      kind: 'constructor',
      key: { type: 'Identifier', name: 'constructor' },
      params: d[2],
      body: d[4]
    }) %}

PropertyDefinition ->
    static:? %identifier assignment:? semicolon
    {% d => ({
      type: 'PropertyDefinition',
      static: !!d[0],
      key: { type: 'Identifier', name: d[1].value },
      value: d[2] ? d[2] : null
    }) %}

# Control Flow
IfStatement ->
    "if" "(" Expression ")" Statement elseClause:?
    {% d => ({
      type: 'IfStatement',
      test: d[2],
      consequent: d[4],
      alternate: d[5] ? d[5] : null
    }) %}

ForStatement ->
    "for" "(" ForInit ";" Expression ";" Expression ")" Statement
    {% d => ({
      type: 'ForStatement',
      init: d[2],
      test: d[4],
      update: d[6],
      body: d[8]
    }) %}
  | "for" "(" ForInit ";" Expression ";" ")" Statement
    {% d => ({
      type: 'ForStatement',
      init: d[2],
      test: d[4],
      update: null,
      body: d[7]
    }) %}
  | "for" "(" ForInit ";" ";" Expression ")" Statement
    {% d => ({
      type: 'ForStatement',
      init: d[2],
      test: null,
      update: d[5],
      body: d[7]
    }) %}
  | "for" "(" ForInit ";" ";" ")" Statement
    {% d => ({
      type: 'ForStatement',
      init: d[2],
      test: null,
      update: null,
      body: d[6]
    }) %}
  | "for" "(" ("let" | "const" | "var") BindingPattern "of" Expression ")" Statement
    {% d => ({
      type: 'ForOfStatement',
      left: { type: 'VariableDeclaration', kind: d[2][0].value, declarations: [{ id: d[3], init: null }] },
      right: d[5],
      body: d[7]
    }) %}
  | "for" "(" ("let" | "const" | "var") BindingPattern "in" Expression ")" Statement
    {% d => ({
      type: 'ForInStatement',
      left: { type: 'VariableDeclaration', kind: d[2][0].value, declarations: [{ id: d[3], init: null }] },
      right: d[5],
      body: d[7]
    }) %}

ForInit ->
    null {% () => null %}
  | VariableDeclaration {% id %}
  | Expression {% id %}

WhileStatement ->
    "while" "(" Expression ")" Statement
    {% d => ({
      type: 'WhileStatement',
      test: d[2],
      body: d[4]
    }) %}

TryStatement ->
    "try" Block CatchClause:? FinallyClause:?
    {% d => ({
      type: 'TryStatement',
      block: d[1],
      handler: d[2],
      finalizer: d[3]
    }) %}

CatchClause ->
    "catch" catchParam:? Block
    {% d => ({
      type: 'CatchClause',
      param: d[1] ? d[1] : null,
      body: d[2]
    }) %}

FinallyClause ->
    "finally" Block {% d => d[1] %}

ThrowStatement ->
    "throw" Expression
    {% d => ({ type: 'ThrowStatement', argument: d[1] }) %}

ReturnStatement ->
    "return" Expression
    {% d => ({ type: 'ReturnStatement', argument: d[1] }) %}
  | "return"
    {% d => ({ type: 'ReturnStatement', argument: null }) %}

# Expressions (disallow function expressions as statements to avoid ambiguity)
ExpressionStatement ->
    PipelineExpressionNoFunction {% d => ({ type: 'ExpressionStatement', expression: d[0] }) %}

# Pipeline without function expressions  
PipelineExpressionNoFunction ->
    AssignmentExpressionNoFunction {% id %}
  | PipelineExpressionNoFunction pipelineOp AssignmentExpression
    {% d => buildPipeline(d[0], d[1], d[2]) %}

pipelineOp -> %pipeline {% d => d[0].value %} | %arrow {% d => d[0].value %}

AssignmentExpressionNoFunction ->
    ConditionalExpressionNoFunction {% id %}
  | ConditionalExpressionNoFunction ("=" | "+=" | "-=" | "*=" | "/=") AssignmentExpression
    {% d => ({
      type: 'AssignmentExpression',
      operator: d[1][0].value,
      left: d[0],
      right: d[2]
    }) %}

ConditionalExpressionNoFunction ->
    LogicalOrExpressionNoFunction {% id %}
  | LogicalOrExpressionNoFunction "?" Expression ":" ConditionalExpression
    {% d => ({
      type: 'ConditionalExpression',
      test: d[0],
      consequent: d[2],
      alternate: d[4]
    }) %}

LogicalOrExpressionNoFunction ->
    LogicalAndExpressionNoFunction {% id %}
  | LogicalOrExpressionNoFunction ("||" | "??") LogicalAndExpression
    {% d => buildBinaryOp(d[0], d[1][0].value, d[2]) %}

LogicalAndExpressionNoFunction ->
    EqualityExpressionNoFunction {% id %}
  | LogicalAndExpressionNoFunction "&&" EqualityExpression
    {% d => buildBinaryOp(d[0], d[1].value, d[2]) %}

EqualityExpressionNoFunction ->
    RelationalExpressionNoFunction {% id %}
  | EqualityExpressionNoFunction ("==" | "!=" | "===" | "!==") RelationalExpression
    {% d => buildBinaryOp(d[0], d[1][0].value, d[2]) %}

RelationalExpressionNoFunction ->
    AdditiveExpressionNoFunction {% id %}
  | RelationalExpressionNoFunction ("<" | ">" | "<=" | ">=") AdditiveExpression
    {% d => buildBinaryOp(d[0], d[1][0].value, d[2]) %}

AdditiveExpressionNoFunction ->
    MultiplicativeExpressionNoFunction {% id %}
  | AdditiveExpressionNoFunction ("+" | "-") MultiplicativeExpression
    {% d => buildBinaryOp(d[0], d[1][0].value, d[2]) %}

MultiplicativeExpressionNoFunction ->
    ExponentiationExpressionNoFunction {% id %}
  | MultiplicativeExpressionNoFunction ("*" | "/" | "%") ExponentiationExpression
    {% d => buildBinaryOp(d[0], d[1][0].value, d[2]) %}

ExponentiationExpressionNoFunction ->
    UnaryExpressionNoFunction {% id %}
  | UnaryExpressionNoFunction "**" ExponentiationExpression
    {% d => buildBinaryOp(d[0], d[1].value, d[2]) %}

UnaryExpressionNoFunction ->
    PostfixExpressionNoFunction {% id %}
  | ("!" | "+" | "-" | "++" | "--" | "typeof" | "await") UnaryExpression
    {% d => buildUnaryOp(d[0][0].value, d[1]) %}

PostfixExpressionNoFunction ->
    MemberExpressionNoFunction {% id %}
  | MemberExpressionNoFunction ("++" | "--")
    {% d => ({
      type: 'UpdateExpression',
      operator: d[1][0].value,
      argument: d[0],
      prefix: false
    }) %}

MemberExpressionNoFunction ->
    CallExpressionNoFunction {% id %}
  | "new" MemberExpressionNoFunction Arguments:?
    {% d => ({
      type: 'NewExpression',
      callee: d[1],
      arguments: d[2] || []
    }) %}
    
CallExpressionNoFunction ->
    PrimaryExpressionNoFunction {% id %}
  | CallExpressionNoFunction "." %identifier
    {% d => ({
      type: 'MemberExpression',
      object: d[0],
      property: { type: 'Identifier', name: d[2].value },
      computed: false
    }) %}
  | CallExpressionNoFunction "?." %identifier
    {% d => ({
      type: 'MemberExpression',
      object: d[0],
      property: { type: 'Identifier', name: d[2].value },
      computed: false,
      optional: true
    }) %}
  | CallExpressionNoFunction "[" Expression "]"
    {% d => ({
      type: 'MemberExpression',
      object: d[0],
      property: d[2],
      computed: true
    }) %}
  | CallExpressionNoFunction Arguments
    {% d => ({
      type: 'CallExpression',
      callee: d[0],
      arguments: d[1]
    }) %}

PrimaryExpressionNoFunction ->
    "this" {% d => ({ type: 'ThisExpression' }) %}
  | "super" {% d => ({ type: 'Super' }) %}
  | %identifier {% d => ({ type: 'Identifier', name: d[0].value }) %}
  | "_" {% d => ({ type: 'Identifier', name: '_' }) %}
  | Literal {% id %}
  | ArrayLiteralNoFunction {% id %}
  | ObjectLiteralNoFunction {% id %}
  | "(" PipelineExpressionNoFunction ")" {% d => d[1] %}

Expression ->
    PipelineExpression {% id %}

PipelineExpression ->
    AssignmentExpression {% id %}
  | PipelineExpression pipelineOp AssignmentExpression
    {% d => buildPipeline(d[0], d[1], d[2]) %}

AssignmentExpression ->
    ArrowFunction {% id %}
  | ConditionalExpression {% id %}
  | ConditionalExpression ("=" | "+=" | "-=" | "*=" | "/=") AssignmentExpression
    {% d => ({
      type: 'AssignmentExpression',
      operator: d[1][0].value,
      left: d[0],
      right: d[2]
    }) %}

ConditionalExpression ->
    LogicalOrExpression {% id %}
  | LogicalOrExpression "?" Expression ":" ConditionalExpression
    {% d => ({
      type: 'ConditionalExpression',
      test: d[0],
      consequent: d[2],
      alternate: d[4]
    }) %}

LogicalOrExpression ->
    LogicalAndExpression {% id %}
  | LogicalOrExpression ("||" | "??") LogicalAndExpression
    {% d => buildBinaryOp(d[0], d[1][0].value, d[2]) %}

LogicalAndExpression ->
    EqualityExpression {% id %}
  | LogicalAndExpression "&&" EqualityExpression
    {% d => buildBinaryOp(d[0], d[1].value, d[2]) %}

EqualityExpression ->
    RelationalExpression {% id %}
  | EqualityExpression ("==" | "!=" | "===" | "!==") RelationalExpression
    {% d => buildBinaryOp(d[0], d[1][0].value, d[2]) %}

RelationalExpression ->
    AdditiveExpression {% id %}
  | RelationalExpression ("<" | ">" | "<=" | ">=") AdditiveExpression
    {% d => buildBinaryOp(d[0], d[1][0].value, d[2]) %}

AdditiveExpression ->
    MultiplicativeExpression {% id %}
  | AdditiveExpression ("+" | "-") MultiplicativeExpression
    {% d => buildBinaryOp(d[0], d[1][0].value, d[2]) %}

MultiplicativeExpression ->
    ExponentiationExpression {% id %}
  | MultiplicativeExpression ("*" | "/" | "%") ExponentiationExpression
    {% d => buildBinaryOp(d[0], d[1][0].value, d[2]) %}

ExponentiationExpression ->
    UnaryExpression {% id %}
  | UnaryExpression "**" ExponentiationExpression
    {% d => buildBinaryOp(d[0], d[1].value, d[2]) %}

UnaryExpression ->
    PostfixExpression {% id %}
  | ("!" | "+" | "-" | "++" | "--" | "typeof" | "await") UnaryExpression
    {% d => buildUnaryOp(d[0][0].value, d[1]) %}

PostfixExpression ->
    MemberExpression {% id %}
  | MemberExpression ("++" | "--")
    {% d => ({
      type: 'UpdateExpression',
      operator: d[1][0].value,
      argument: d[0],
      prefix: false
    }) %}

MemberExpression ->
    CallExpression {% id %}
  | "new" MemberExpression Arguments:?
    {% d => ({
      type: 'NewExpression',
      callee: d[1],
      arguments: d[2] || []
    }) %}
    
CallExpression ->
    PrimaryExpression {% id %}
  | CallExpression "." %identifier
    {% d => ({
      type: 'MemberExpression',
      object: d[0],
      property: { type: 'Identifier', name: d[2].value },
      computed: false
    }) %}
  | CallExpression "?." %identifier
    {% d => ({
      type: 'MemberExpression',
      object: d[0],
      property: { type: 'Identifier', name: d[2].value },
      computed: false,
      optional: true
    }) %}
  | CallExpression "[" Expression "]"
    {% d => ({
      type: 'MemberExpression',
      object: d[0],
      property: d[2],
      computed: true
    }) %}
  | CallExpression Arguments
    {% d => ({
      type: 'CallExpression',
      callee: d[0],
      arguments: d[1]
    }) %}

Arguments ->
    "(" ArgumentList ")"
    {% d => d[1] %}

ArgumentList ->
    null {% () => [] %}
  | AssignmentExpression {% d => [d[0]] %}
  | ArgumentList "," AssignmentExpression {% d => [...d[0], d[2]] %}
  | "..." AssignmentExpression {% d => [{ type: 'SpreadElement', argument: d[1] }] %}

PrimaryExpression ->
    "this" {% d => ({ type: 'ThisExpression' }) %}
  | "super" {% d => ({ type: 'Super' }) %}
  | %identifier {% d => ({ type: 'Identifier', name: d[0].value }) %}
  | "_" {% d => ({ type: 'Identifier', name: '_' }) %}
  | Literal {% id %}
  | ArrayLiteral {% id %}
  | ObjectLiteral {% id %}
  | FunctionExpression {% id %}
  | "(" Expression ")" {% d => d[1] %}

Literal ->
    %number {% d => ({ type: 'Literal', value: parseFloat(d[0].value), raw: d[0].value }) %}
  | %string {% d => ({ type: 'Literal', value: d[0].value, raw: d[0].text }) %}
  | %templateLiteral {% d => ({ type: 'TemplateLiteral', value: d[0].value, raw: d[0].text }) %}
  | "true" {% d => ({ type: 'Literal', value: true, raw: 'true' }) %}
  | "false" {% d => ({ type: 'Literal', value: false, raw: 'false' }) %}
  | "null" {% d => ({ type: 'Literal', value: null, raw: 'null' }) %}
  | "undefined" {% d => ({ type: 'Literal', value: undefined, raw: 'undefined' }) %}

ArrayLiteral ->
    "[" "]" {% d => ({ type: 'ArrayExpression', elements: [] }) %}
  | "[" ArrayElementList "]" {% d => ({ type: 'ArrayExpression', elements: d[1] }) %}

ArrayElementList ->
    ArrayElement {% d => [d[0]] %}
  | ArrayElementList "," {% d => [...d[0], null] %}
  | ArrayElementList "," ArrayElement {% d => [...d[0], d[2]] %}

ArrayElement ->
    AssignmentExpression {% id %}
  | "..." AssignmentExpression {% d => ({ type: 'SpreadElement', argument: d[1] }) %}

ArrayLiteralNoFunction ->
    "[" "]" {% d => ({ type: 'ArrayExpression', elements: [] }) %}
  | "[" ArrayElementListNoFunction "]" {% d => ({ type: 'ArrayExpression', elements: d[1] }) %}

ArrayElementListNoFunction ->
    ArrayElementNoFunction {% d => [d[0]] %}
  | ArrayElementListNoFunction "," {% d => [...d[0], null] %}
  | ArrayElementListNoFunction "," ArrayElementNoFunction {% d => [...d[0], d[2]] %}

ArrayElementNoFunction ->
    AssignmentExpressionNoFunction {% id %}
  | "..." AssignmentExpressionNoFunction {% d => ({ type: 'SpreadElement', argument: d[1] }) %}

ObjectLiteral ->
    "{" PropertyList "}"
    {% d => ({ type: 'ObjectExpression', properties: d[1] }) %}

PropertyList ->
    null {% () => [] %}
  | Property {% d => [d[0]] %}
  | PropertyList "," Property {% d => [...d[0], d[2]] %}

Property ->
    %identifier {% d => ({ type: 'Property', key: d[0].value, value: d[0].value, shorthand: true }) %}
  | PropertyKey ":" AssignmentExpression {% d => ({ type: 'Property', key: d[0], value: d[2], shorthand: false }) %}
  | "..." AssignmentExpression {% d => ({ type: 'SpreadElement', argument: d[1] }) %}

ObjectLiteralNoFunction ->
    "{" PropertyListNoFunction "}"
    {% d => ({ type: 'ObjectExpression', properties: d[1] }) %}

PropertyListNoFunction ->
    null {% () => [] %}
  | PropertyNoFunction {% d => [d[0]] %}
  | PropertyListNoFunction "," PropertyNoFunction {% d => [...d[0], d[2]] %}

PropertyNoFunction ->
    %identifier {% d => ({ type: 'Property', key: d[0].value, value: d[0].value, shorthand: true }) %}
  | PropertyKey ":" AssignmentExpressionNoFunction {% d => ({ type: 'Property', key: d[0], value: d[2], shorthand: false }) %}
  | "..." AssignmentExpressionNoFunction {% d => ({ type: 'SpreadElement', argument: d[1] }) %}

PropertyKey ->
    %identifier {% d => ({ type: 'Identifier', name: d[0].value }) %}
  | %string {% d => ({ type: 'Literal', value: d[0].value }) %}
  | "[" Expression "]" {% d => d[1] %}

FunctionExpression ->
    async:? "function" functionName:? "(" ParameterList ")" Block
    {% d => ({
      type: 'FunctionExpression',
      async: !!d[0],
      id: d[2] ? { type: 'Identifier', name: d[2] } : null,
      params: d[4],
      body: d[6]
    }) %}

ArrowFunction ->
    ArrowParameters %fatArrow ArrowBody
    {% d => ({
      type: 'ArrowFunctionExpression',
      async: false,
      params: d[0],
      body: d[2]
    }) %}
  | "async" ArrowParameters %fatArrow ArrowBody
    {% d => ({
      type: 'ArrowFunctionExpression',
      async: true,
      params: d[1],
      body: d[3]
    }) %}

ArrowParameters ->
    %identifier {% d => [{ type: 'Identifier', name: d[0].value }] %}
  | "(" ParameterList ")" {% d => d[1] %}

ArrowBody ->
    Block {% id %}
  | AssignmentExpression {% d => d[0] %}

Block ->
    "{" Statements "}" {% d => ({ type: 'BlockStatement', body: d[1] }) %}