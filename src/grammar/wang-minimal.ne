# Wang Language Grammar - Minimal Working Version
# Start with what works, add features one by one

@{%
const moo = require('moo');

// Minimal lexer - only proven working tokens
const lexer = moo.compile({
  // Whitespace and comments
  WS: /[ \t\r]+/,
  NL: { match: /\n/, lineBreaks: true },
  lineComment: /\/\/.*$/,
  
  // String literals - simplified
  string: {
    match: /"(?:[^"\\]|\\.)*"/,
    value: s => s.slice(1, -1).replace(/\\(.)/g, (m, c) => {
      switch(c) {
        case 'n': return '\n';
        case 't': return '\t';
        case '\\': return '\\';
        case '"': return '"';
        default: return c;
      }
    })
  },
  
  // Numbers - basic
  number: {
    match: /\d+(?:\.\d+)?/,
    value: s => parseFloat(s)
  },
  
  // Identifiers and keywords
  identifier: {
    match: /[a-zA-Z_$][a-zA-Z0-9_$]*/,
    type: moo.keywords({
      // Core keywords only
      let: 'let', const: 'const', var: 'var',
      if: 'if', else: 'else',
      for: 'for', while: 'while',
      function: 'function',
      return: 'return',
      true: 'true', false: 'false', null: 'null',
      new: 'new', this: 'this'
    })
  },
  
  // Basic operators only
  '==': '==', '!=': '!=',
  '<=': '<=', '>=': '>=',
  '&&': '&&', '||': '||',
  '++': '++', '--': '--',
  '+=': '+=', '-=': '-=',
  
  // Single chars
  '=': '=', '<': '<', '>': '>',
  '+': '+', '-': '-', '*': '*', '/': '/',
  '!': '!', 
  '(': '(', ')': ')', '[': '[', ']': ']', '{': '{', '}': '}',
  ',': ',', '.': '.', ';': ';', ':': ':'
});

// Skip whitespace and comments
lexer.next = (next => () => {
  let tok;
  while ((tok = next.call(lexer)) && (tok.type === 'WS' || tok.type === 'lineComment')) {
    // Skip
  }
  return tok;
})(lexer.next);

// Minimal AST helpers
function createNode(type, props = {}) {
  return { type, ...props };
}

function createBinaryOp(left, operator, right) {
  return createNode('BinaryExpression', { operator, left, right });
}

function createIdentifier(name) {
  return createNode('Identifier', { name });
}

function createLiteral(value, raw) {
  return createNode('Literal', { value, raw });
}

%}

@lexer lexer

# ============= PROGRAM =============

Program -> StatementList {% d => createNode('Program', { body: d[0] }) %}

StatementList ->
    null {% () => [] %}
  | Statement {% d => [d[0]] %}
  | StatementList %NL Statement {% d => [...d[0], d[2]] %}
  | StatementList %NL {% d => d[0] %}

Statement ->
    VariableDeclaration {% id %}
  | FunctionDeclaration {% id %}
  | IfStatement {% id %}
  | ForStatement {% id %}
  | WhileStatement {% id %}
  | ReturnStatement {% id %}
  | ExpressionStatement {% id %}
  | Block {% id %}

# ============= DECLARATIONS =============

VariableDeclaration ->
    ("let" | "const" | "var") %identifier ("=" AssignmentExpression):?
    {% d => createNode('VariableDeclaration', {
      kind: d[0][0].value,
      declarations: [createNode('VariableDeclarator', {
        id: createIdentifier(d[1].value),
        init: d[2] ? d[2][1] : null
      })]
    }) %}

FunctionDeclaration ->
    "function" %identifier "(" ParameterList ")" Block
    {% d => createNode('FunctionDeclaration', {
      id: createIdentifier(d[1].value),
      params: d[3],
      body: d[5]
    }) %}

ParameterList ->
    null {% () => [] %}
  | %identifier {% d => [createIdentifier(d[0].value)] %}
  | ParameterList "," %identifier {% d => [...d[0], createIdentifier(d[2].value)] %}

# ============= CONTROL FLOW =============

IfStatement ->
    "if" "(" Expression ")" Statement ("else" Statement):?
    {% d => createNode('IfStatement', {
      test: d[2],
      consequent: d[4],
      alternate: d[5] ? d[5][1] : null
    }) %}

ForStatement ->
    "for" "(" ForInit ";" Expression:? ";" ForUpdate:? ")" Statement
    {% d => createNode('ForStatement', {
      init: d[2],
      test: d[4],
      update: d[6],
      body: d[8]
    }) %}

ForInit ->
    null {% () => null %}
  | VariableDeclaration {% id %}
  | Expression {% id %}

ForUpdate ->
    null {% () => null %}
  | Expression {% id %}

WhileStatement ->
    "while" "(" Expression ")" Statement
    {% d => createNode('WhileStatement', {
      test: d[2],
      body: d[4]
    }) %}

ReturnStatement ->
    "return" Expression:?
    {% d => createNode('ReturnStatement', { argument: d[1] }) %}

# ============= EXPRESSIONS =============

ExpressionStatement ->
    Expression {% d => createNode('ExpressionStatement', { expression: d[0] }) %}

Expression -> AssignmentExpression {% id %}

AssignmentExpression ->
    ConditionalExpression {% id %}
  | LeftHandSideExpression "=" AssignmentExpression
    {% d => createNode('AssignmentExpression', {
      operator: '=',
      left: d[0],
      right: d[2]
    }) %}
  | LeftHandSideExpression ("+=" | "-=") AssignmentExpression
    {% d => createNode('AssignmentExpression', {
      operator: d[1][0].value,
      left: d[0],
      right: d[2]
    }) %}

ConditionalExpression ->
    LogicalOrExpression {% id %}

LogicalOrExpression ->
    LogicalAndExpression {% id %}
  | LogicalOrExpression "||" LogicalAndExpression
    {% d => createBinaryOp(d[0], '||', d[2]) %}

LogicalAndExpression ->
    EqualityExpression {% id %}
  | LogicalAndExpression "&&" EqualityExpression
    {% d => createBinaryOp(d[0], '&&', d[2]) %}

EqualityExpression ->
    RelationalExpression {% id %}
  | EqualityExpression ("==" | "!=") RelationalExpression
    {% d => createBinaryOp(d[0], d[1][0].value, d[2]) %}

RelationalExpression ->
    AdditiveExpression {% id %}
  | RelationalExpression ("<" | ">" | "<=" | ">=") AdditiveExpression
    {% d => createBinaryOp(d[0], d[1][0].value, d[2]) %}

AdditiveExpression ->
    MultiplicativeExpression {% id %}
  | AdditiveExpression ("+" | "-") MultiplicativeExpression
    {% d => createBinaryOp(d[0], d[1][0].value, d[2]) %}

MultiplicativeExpression ->
    UnaryExpression {% id %}
  | MultiplicativeExpression ("*" | "/") UnaryExpression
    {% d => createBinaryOp(d[0], d[1][0].value, d[2]) %}

UnaryExpression ->
    PostfixExpression {% id %}
  | "!" UnaryExpression
    {% d => createNode('UnaryExpression', {
      operator: '!',
      argument: d[1],
      prefix: true
    }) %}
  | "++" UnaryExpression
    {% d => createNode('UpdateExpression', {
      operator: '++',
      argument: d[1],
      prefix: true
    }) %}
  | "--" UnaryExpression
    {% d => createNode('UpdateExpression', {
      operator: '--',
      argument: d[1],
      prefix: true
    }) %}

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
    MemberExpression Arguments
    {% d => createNode('CallExpression', {
      callee: d[0],
      arguments: d[1]
    }) %}
  | CallExpression Arguments
    {% d => createNode('CallExpression', {
      callee: d[0],
      arguments: d[1]
    }) %}
  | CallExpression "[" Expression "]"
    {% d => createNode('MemberExpression', {
      object: d[0],
      property: d[2],
      computed: true
    }) %}
  | CallExpression "." %identifier
    {% d => createNode('MemberExpression', {
      object: d[0],
      property: createIdentifier(d[2].value),
      computed: false
    }) %}

NewExpression ->
    "new" MemberExpression Arguments:?
    {% d => createNode('NewExpression', {
      callee: d[1],
      arguments: d[2] || []
    }) %}
  | MemberExpression {% id %}

MemberExpression ->
    PrimaryExpression {% id %}
  | MemberExpression "[" Expression "]"
    {% d => createNode('MemberExpression', {
      object: d[0],
      property: d[2],
      computed: true
    }) %}
  | MemberExpression "." %identifier
    {% d => createNode('MemberExpression', {
      object: d[0],
      property: createIdentifier(d[2].value),
      computed: false
    }) %}

Arguments ->
    "(" ArgumentList ")" {% d => d[1] %}

ArgumentList ->
    null {% () => [] %}
  | AssignmentExpression {% d => [d[0]] %}
  | ArgumentList "," AssignmentExpression {% d => [...d[0], d[2]] %}

PrimaryExpression ->
    "this" {% () => createNode('ThisExpression') %}
  | %identifier {% d => createIdentifier(d[0].value) %}
  | Literal {% id %}
  | ArrayLiteral {% id %}
  | ObjectLiteral {% id %}
  | "(" Expression ")" {% d => d[1] %}

Literal ->
    %number {% d => createLiteral(d[0].value, d[0].text) %}
  | %string {% d => createLiteral(d[0].value, d[0].text) %}
  | "true" {% () => createLiteral(true, 'true') %}
  | "false" {% () => createLiteral(false, 'false') %}
  | "null" {% () => createLiteral(null, 'null') %}

ArrayLiteral ->
    "[" ElementList "]"
    {% d => createNode('ArrayExpression', { elements: d[1] }) %}

ElementList ->
    null {% () => [] %}
  | AssignmentExpression {% d => [d[0]] %}
  | ElementList "," AssignmentExpression {% d => [...d[0], d[2]] %}

# Simplified object literal - step by step build
ObjectLiteral ->
    "{" "}"
    {% () => createNode('ObjectExpression', { properties: [] }) %}

Block ->
    "{" StatementList "}"
    {% d => createNode('BlockStatement', { body: d[1] }) %}