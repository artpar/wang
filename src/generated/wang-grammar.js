// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

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

var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "Program", "symbols": ["Statements"], "postprocess": d => ({ type: 'Program', body: d[0] })},
    {"name": "Statements", "symbols": [], "postprocess": () => []},
    {"name": "Statements", "symbols": ["Statement"], "postprocess": d => [d[0]]},
    {"name": "Statements", "symbols": ["Statements", {"literal":";"}, "Statement"], "postprocess": d => [...d[0], d[2]]},
    {"name": "Statements", "symbols": ["Statements", {"literal":";"}], "postprocess": d => d[0]},
    {"name": "semicolon", "symbols": [{"literal":";"}]},
    {"name": "staticAsyncGetSet", "symbols": [{"literal":"static"}]},
    {"name": "staticAsyncGetSet", "symbols": [{"literal":"async"}]},
    {"name": "staticAsyncGetSet", "symbols": [{"literal":"get"}]},
    {"name": "staticAsyncGetSet", "symbols": [{"literal":"set"}]},
    {"name": "static", "symbols": [{"literal":"static"}]},
    {"name": "assignment", "symbols": [{"literal":"="}, "AssignmentExpression"]},
    {"name": "asIdentifier", "symbols": [{"literal":"as"}, (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => d[1].value},
    {"name": "defaultAssignment", "symbols": [{"literal":"="}, "AssignmentExpression"], "postprocess": d => d[1]},
    {"name": "async", "symbols": [{"literal":"async"}]},
    {"name": "extendsClause", "symbols": [{"literal":"extends"}, (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => d[1].value},
    {"name": "elseClause", "symbols": [{"literal":"else"}, "Statement"], "postprocess": d => d[1]},
    {"name": "catchParam", "symbols": [{"literal":"("}, "BindingPattern", {"literal":")"}], "postprocess": d => d[1]},
    {"name": "functionName", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => d[0].value},
    {"name": "Statement", "symbols": ["ImportStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["ExportStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["VariableDeclaration"], "postprocess": id},
    {"name": "Statement", "symbols": ["FunctionDeclaration"], "postprocess": id},
    {"name": "Statement", "symbols": ["ClassDeclaration"], "postprocess": id},
    {"name": "Statement", "symbols": ["IfStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["ForStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["WhileStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["TryStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["ThrowStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["ReturnStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["ExpressionStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["Block"], "postprocess": id},
    {"name": "ImportStatement", "symbols": [{"literal":"import"}, "ImportSpecifiers", {"literal":"from"}, (lexer.has("string") ? {type: "string"} : string)], "postprocess": d => ({ type: 'ImportDeclaration', specifiers: d[1], source: d[3].value })},
    {"name": "ImportStatement", "symbols": [{"literal":"import"}, (lexer.has("string") ? {type: "string"} : string)], "postprocess": d => ({ type: 'ImportDeclaration', specifiers: [], source: d[1].value })},
    {"name": "ImportSpecifiers", "symbols": [{"literal":"{"}, "ImportSpecifierList", {"literal":"}"}], "postprocess": d => d[1]},
    {"name": "ImportSpecifiers", "symbols": [{"literal":"*"}, {"literal":"as"}, (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => [{ type: 'ImportNamespaceSpecifier', local: d[2].value }]},
    {"name": "ImportSpecifierList", "symbols": ["ImportSpecifier"], "postprocess": d => [d[0]]},
    {"name": "ImportSpecifierList", "symbols": ["ImportSpecifierList", {"literal":","}, "ImportSpecifier"], "postprocess": d => [...d[0], d[2]]},
    {"name": "ImportSpecifier$ebnf$1", "symbols": ["asIdentifier"], "postprocess": id},
    {"name": "ImportSpecifier$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "ImportSpecifier", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "ImportSpecifier$ebnf$1"], "postprocess":  d => ({ 
          type: 'ImportSpecifier', 
          imported: d[0].value,
          local: d[1] ? d[1] : d[0].value 
        }) },
    {"name": "ExportStatement", "symbols": [{"literal":"export"}, "VariableDeclaration"], "postprocess": d => ({ type: 'ExportNamedDeclaration', declaration: d[1] })},
    {"name": "ExportStatement", "symbols": [{"literal":"export"}, "FunctionDeclaration"], "postprocess": d => ({ type: 'ExportNamedDeclaration', declaration: d[1] })},
    {"name": "ExportStatement", "symbols": [{"literal":"export"}, "ClassDeclaration"], "postprocess": d => ({ type: 'ExportNamedDeclaration', declaration: d[1] })},
    {"name": "ExportStatement", "symbols": [{"literal":"export"}, {"literal":"{"}, "ExportSpecifierList", {"literal":"}"}], "postprocess": d => ({ type: 'ExportNamedDeclaration', specifiers: d[2] })},
    {"name": "ExportSpecifierList", "symbols": ["ExportSpecifier"], "postprocess": d => [d[0]]},
    {"name": "ExportSpecifierList", "symbols": ["ExportSpecifierList", {"literal":","}, "ExportSpecifier"], "postprocess": d => [...d[0], d[2]]},
    {"name": "ExportSpecifier$ebnf$1", "symbols": ["asIdentifier"], "postprocess": id},
    {"name": "ExportSpecifier$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "ExportSpecifier", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "ExportSpecifier$ebnf$1"], "postprocess":  d => ({ 
          type: 'ExportSpecifier',
          local: d[0].value,
          exported: d[1] ? d[1] : d[0].value
        }) },
    {"name": "VariableDeclaration$subexpression$1", "symbols": [{"literal":"let"}]},
    {"name": "VariableDeclaration$subexpression$1", "symbols": [{"literal":"const"}]},
    {"name": "VariableDeclaration$subexpression$1", "symbols": [{"literal":"var"}]},
    {"name": "VariableDeclaration", "symbols": ["VariableDeclaration$subexpression$1", "VariableDeclaratorList"], "postprocess": d => ({ type: 'VariableDeclaration', kind: d[0][0].value, declarations: d[1] })},
    {"name": "VariableDeclaratorList", "symbols": ["VariableDeclarator"], "postprocess": d => [d[0]]},
    {"name": "VariableDeclaratorList", "symbols": ["VariableDeclaratorList", {"literal":","}, "VariableDeclarator"], "postprocess": d => [...d[0], d[2]]},
    {"name": "VariableDeclarator$ebnf$1", "symbols": ["defaultAssignment"], "postprocess": id},
    {"name": "VariableDeclarator$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "VariableDeclarator", "symbols": ["BindingPattern", "VariableDeclarator$ebnf$1"], "postprocess": d => ({ type: 'VariableDeclarator', id: d[0], init: d[1] ? d[1] : null })},
    {"name": "BindingPattern", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => ({ type: 'Identifier', name: d[0].value })},
    {"name": "BindingPattern", "symbols": ["ObjectPattern"], "postprocess": id},
    {"name": "BindingPattern", "symbols": ["ArrayPattern"], "postprocess": id},
    {"name": "ObjectPattern", "symbols": [{"literal":"{"}, "ObjectPatternProperties", {"literal":"}"}], "postprocess": d => ({ type: 'ObjectPattern', properties: d[1] })},
    {"name": "ObjectPatternProperties", "symbols": [], "postprocess": () => []},
    {"name": "ObjectPatternProperties", "symbols": ["ObjectPatternProperty"], "postprocess": d => [d[0]]},
    {"name": "ObjectPatternProperties", "symbols": ["ObjectPatternProperties", {"literal":","}, "ObjectPatternProperty"], "postprocess": d => [...d[0], d[2]]},
    {"name": "ObjectPatternProperty", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => ({ type: 'Property', key: d[0].value, value: d[0].value, shorthand: true })},
    {"name": "ObjectPatternProperty", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), {"literal":":"}, "BindingPattern"], "postprocess": d => ({ type: 'Property', key: d[0].value, value: d[2], shorthand: false })},
    {"name": "ObjectPatternProperty", "symbols": [{"literal":"..."}, (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => ({ type: 'RestElement', argument: d[1].value })},
    {"name": "ArrayPattern", "symbols": [{"literal":"["}, "ArrayPatternElements", {"literal":"]"}], "postprocess": d => ({ type: 'ArrayPattern', elements: d[1] })},
    {"name": "ArrayPatternElements", "symbols": [], "postprocess": () => []},
    {"name": "ArrayPatternElements", "symbols": ["ArrayPatternElement"], "postprocess": d => [d[0]]},
    {"name": "ArrayPatternElements", "symbols": ["ArrayPatternElements", {"literal":","}, "ArrayPatternElement"], "postprocess": d => [...d[0], d[2]]},
    {"name": "ArrayPatternElement", "symbols": ["BindingPattern"], "postprocess": id},
    {"name": "ArrayPatternElement", "symbols": [{"literal":"..."}, (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => ({ type: 'RestElement', argument: d[1].value })},
    {"name": "ArrayPatternElement", "symbols": [], "postprocess": () => null},
    {"name": "FunctionDeclaration", "symbols": [{"literal":"function"}, (lexer.has("identifier") ? {type: "identifier"} : identifier), {"literal":"("}, "ParameterList", {"literal":")"}, "Block"], "postprocess":  d => ({
          type: 'FunctionDeclaration',
          async: false,
          id: { type: 'Identifier', name: d[1].value },
          params: d[3],
          body: d[5]
        }) },
    {"name": "FunctionDeclaration", "symbols": [{"literal":"async"}, {"literal":"function"}, (lexer.has("identifier") ? {type: "identifier"} : identifier), {"literal":"("}, "ParameterList", {"literal":")"}, "Block"], "postprocess":  d => ({
          type: 'FunctionDeclaration',
          async: true,
          id: { type: 'Identifier', name: d[2].value },
          params: d[4],
          body: d[6]
        }) },
    {"name": "ParameterList", "symbols": [], "postprocess": () => []},
    {"name": "ParameterList", "symbols": ["Parameter"], "postprocess": d => [d[0]]},
    {"name": "ParameterList", "symbols": ["ParameterList", {"literal":","}, "Parameter"], "postprocess": d => [...d[0], d[2]]},
    {"name": "Parameter", "symbols": ["BindingPattern"], "postprocess": id},
    {"name": "Parameter", "symbols": [{"literal":"..."}, "BindingPattern"], "postprocess": d => ({ type: 'RestElement', argument: d[1] })},
    {"name": "ClassDeclaration$ebnf$1", "symbols": ["extendsClause"], "postprocess": id},
    {"name": "ClassDeclaration$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "ClassDeclaration", "symbols": [{"literal":"class"}, (lexer.has("identifier") ? {type: "identifier"} : identifier), "ClassDeclaration$ebnf$1", "ClassBody"], "postprocess":  d => ({
          type: 'ClassDeclaration',
          id: { type: 'Identifier', name: d[1].value },
          superClass: d[2] ? { type: 'Identifier', name: d[2] } : null,
          body: d[3]
        }) },
    {"name": "ClassBody", "symbols": [{"literal":"{"}, "ClassMembers", {"literal":"}"}], "postprocess": d => ({ type: 'ClassBody', body: d[1] })},
    {"name": "ClassMembers", "symbols": [], "postprocess": () => []},
    {"name": "ClassMembers", "symbols": ["ClassMembers", "ClassMember"], "postprocess": d => d[1] ? [...d[0], d[1]] : d[0]},
    {"name": "ClassMember", "symbols": ["MethodDefinition"], "postprocess": id},
    {"name": "ClassMember", "symbols": ["PropertyDefinition"], "postprocess": id},
    {"name": "ClassMember", "symbols": [{"literal":";"}], "postprocess": () => null},
    {"name": "MethodDefinition$ebnf$1", "symbols": []},
    {"name": "MethodDefinition$ebnf$1", "symbols": ["MethodDefinition$ebnf$1", "staticAsyncGetSet"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "MethodDefinition", "symbols": ["MethodDefinition$ebnf$1", (lexer.has("identifier") ? {type: "identifier"} : identifier), {"literal":"("}, "ParameterList", {"literal":")"}, "Block"], "postprocess":  d => ({
          type: 'MethodDefinition',
          static: d[0].some(k => k && k[0].value === 'static'),
          async: d[0].some(k => k && k[0].value === 'async'),
          kind: d[0].find(k => k && (k[0].value === 'get' || k[0].value === 'set'))?.[0].value || 'method',
          key: { type: 'Identifier', name: d[1].value },
          params: d[3],
          body: d[5]
        }) },
    {"name": "MethodDefinition", "symbols": [{"literal":"constructor"}, {"literal":"("}, "ParameterList", {"literal":")"}, "Block"], "postprocess":  d => ({
          type: 'MethodDefinition',
          kind: 'constructor',
          key: { type: 'Identifier', name: 'constructor' },
          params: d[2],
          body: d[4]
        }) },
    {"name": "PropertyDefinition$ebnf$1", "symbols": ["static"], "postprocess": id},
    {"name": "PropertyDefinition$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "PropertyDefinition$ebnf$2", "symbols": ["assignment"], "postprocess": id},
    {"name": "PropertyDefinition$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "PropertyDefinition", "symbols": ["PropertyDefinition$ebnf$1", (lexer.has("identifier") ? {type: "identifier"} : identifier), "PropertyDefinition$ebnf$2", "semicolon"], "postprocess":  d => ({
          type: 'PropertyDefinition',
          static: !!d[0],
          key: { type: 'Identifier', name: d[1].value },
          value: d[2] ? d[2] : null
        }) },
    {"name": "IfStatement$ebnf$1", "symbols": ["elseClause"], "postprocess": id},
    {"name": "IfStatement$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "IfStatement", "symbols": [{"literal":"if"}, {"literal":"("}, "Expression", {"literal":")"}, "Statement", "IfStatement$ebnf$1"], "postprocess":  d => ({
          type: 'IfStatement',
          test: d[2],
          consequent: d[4],
          alternate: d[5] ? d[5] : null
        }) },
    {"name": "ForStatement", "symbols": [{"literal":"for"}, {"literal":"("}, "ForInit", {"literal":";"}, "Expression", {"literal":";"}, "Expression", {"literal":")"}, "Statement"], "postprocess":  d => ({
          type: 'ForStatement',
          init: d[2],
          test: d[4],
          update: d[6],
          body: d[8]
        }) },
    {"name": "ForStatement", "symbols": [{"literal":"for"}, {"literal":"("}, "ForInit", {"literal":";"}, "Expression", {"literal":";"}, {"literal":")"}, "Statement"], "postprocess":  d => ({
          type: 'ForStatement',
          init: d[2],
          test: d[4],
          update: null,
          body: d[7]
        }) },
    {"name": "ForStatement", "symbols": [{"literal":"for"}, {"literal":"("}, "ForInit", {"literal":";"}, {"literal":";"}, "Expression", {"literal":")"}, "Statement"], "postprocess":  d => ({
          type: 'ForStatement',
          init: d[2],
          test: null,
          update: d[5],
          body: d[7]
        }) },
    {"name": "ForStatement", "symbols": [{"literal":"for"}, {"literal":"("}, "ForInit", {"literal":";"}, {"literal":";"}, {"literal":")"}, "Statement"], "postprocess":  d => ({
          type: 'ForStatement',
          init: d[2],
          test: null,
          update: null,
          body: d[6]
        }) },
    {"name": "ForStatement$subexpression$1", "symbols": [{"literal":"let"}]},
    {"name": "ForStatement$subexpression$1", "symbols": [{"literal":"const"}]},
    {"name": "ForStatement$subexpression$1", "symbols": [{"literal":"var"}]},
    {"name": "ForStatement", "symbols": [{"literal":"for"}, {"literal":"("}, "ForStatement$subexpression$1", "BindingPattern", {"literal":"of"}, "Expression", {"literal":")"}, "Statement"], "postprocess":  d => ({
          type: 'ForOfStatement',
          left: { type: 'VariableDeclaration', kind: d[2][0].value, declarations: [{ id: d[3], init: null }] },
          right: d[5],
          body: d[7]
        }) },
    {"name": "ForStatement$subexpression$2", "symbols": [{"literal":"let"}]},
    {"name": "ForStatement$subexpression$2", "symbols": [{"literal":"const"}]},
    {"name": "ForStatement$subexpression$2", "symbols": [{"literal":"var"}]},
    {"name": "ForStatement", "symbols": [{"literal":"for"}, {"literal":"("}, "ForStatement$subexpression$2", "BindingPattern", {"literal":"in"}, "Expression", {"literal":")"}, "Statement"], "postprocess":  d => ({
          type: 'ForInStatement',
          left: { type: 'VariableDeclaration', kind: d[2][0].value, declarations: [{ id: d[3], init: null }] },
          right: d[5],
          body: d[7]
        }) },
    {"name": "ForInit", "symbols": [], "postprocess": () => null},
    {"name": "ForInit", "symbols": ["VariableDeclaration"], "postprocess": id},
    {"name": "ForInit", "symbols": ["Expression"], "postprocess": id},
    {"name": "WhileStatement", "symbols": [{"literal":"while"}, {"literal":"("}, "Expression", {"literal":")"}, "Statement"], "postprocess":  d => ({
          type: 'WhileStatement',
          test: d[2],
          body: d[4]
        }) },
    {"name": "TryStatement$ebnf$1", "symbols": ["CatchClause"], "postprocess": id},
    {"name": "TryStatement$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "TryStatement$ebnf$2", "symbols": ["FinallyClause"], "postprocess": id},
    {"name": "TryStatement$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "TryStatement", "symbols": [{"literal":"try"}, "Block", "TryStatement$ebnf$1", "TryStatement$ebnf$2"], "postprocess":  d => ({
          type: 'TryStatement',
          block: d[1],
          handler: d[2],
          finalizer: d[3]
        }) },
    {"name": "CatchClause$ebnf$1", "symbols": ["catchParam"], "postprocess": id},
    {"name": "CatchClause$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "CatchClause", "symbols": [{"literal":"catch"}, "CatchClause$ebnf$1", "Block"], "postprocess":  d => ({
          type: 'CatchClause',
          param: d[1] ? d[1] : null,
          body: d[2]
        }) },
    {"name": "FinallyClause", "symbols": [{"literal":"finally"}, "Block"], "postprocess": d => d[1]},
    {"name": "ThrowStatement", "symbols": [{"literal":"throw"}, "Expression"], "postprocess": d => ({ type: 'ThrowStatement', argument: d[1] })},
    {"name": "ReturnStatement", "symbols": [{"literal":"return"}, "Expression"], "postprocess": d => ({ type: 'ReturnStatement', argument: d[1] })},
    {"name": "ReturnStatement", "symbols": [{"literal":"return"}], "postprocess": d => ({ type: 'ReturnStatement', argument: null })},
    {"name": "ExpressionStatement", "symbols": ["PipelineExpressionNoFunction"], "postprocess": d => ({ type: 'ExpressionStatement', expression: d[0] })},
    {"name": "PipelineExpressionNoFunction", "symbols": ["AssignmentExpressionNoFunction"], "postprocess": id},
    {"name": "PipelineExpressionNoFunction", "symbols": ["PipelineExpressionNoFunction", "pipelineOp", "AssignmentExpression"], "postprocess": d => buildPipeline(d[0], d[1], d[2])},
    {"name": "pipelineOp", "symbols": [(lexer.has("pipeline") ? {type: "pipeline"} : pipeline)], "postprocess": d => d[0].value},
    {"name": "pipelineOp", "symbols": [(lexer.has("arrow") ? {type: "arrow"} : arrow)], "postprocess": d => d[0].value},
    {"name": "AssignmentExpressionNoFunction", "symbols": ["ConditionalExpressionNoFunction"], "postprocess": id},
    {"name": "AssignmentExpressionNoFunction$subexpression$1", "symbols": [{"literal":"="}]},
    {"name": "AssignmentExpressionNoFunction$subexpression$1", "symbols": [{"literal":"+="}]},
    {"name": "AssignmentExpressionNoFunction$subexpression$1", "symbols": [{"literal":"-="}]},
    {"name": "AssignmentExpressionNoFunction$subexpression$1", "symbols": [{"literal":"*="}]},
    {"name": "AssignmentExpressionNoFunction$subexpression$1", "symbols": [{"literal":"/="}]},
    {"name": "AssignmentExpressionNoFunction", "symbols": ["ConditionalExpressionNoFunction", "AssignmentExpressionNoFunction$subexpression$1", "AssignmentExpression"], "postprocess":  d => ({
          type: 'AssignmentExpression',
          operator: d[1][0].value,
          left: d[0],
          right: d[2]
        }) },
    {"name": "ConditionalExpressionNoFunction", "symbols": ["LogicalOrExpressionNoFunction"], "postprocess": id},
    {"name": "ConditionalExpressionNoFunction", "symbols": ["LogicalOrExpressionNoFunction", {"literal":"?"}, "Expression", {"literal":":"}, "ConditionalExpression"], "postprocess":  d => ({
          type: 'ConditionalExpression',
          test: d[0],
          consequent: d[2],
          alternate: d[4]
        }) },
    {"name": "LogicalOrExpressionNoFunction", "symbols": ["LogicalAndExpressionNoFunction"], "postprocess": id},
    {"name": "LogicalOrExpressionNoFunction$subexpression$1", "symbols": [{"literal":"||"}]},
    {"name": "LogicalOrExpressionNoFunction$subexpression$1", "symbols": [{"literal":"??"}]},
    {"name": "LogicalOrExpressionNoFunction", "symbols": ["LogicalOrExpressionNoFunction", "LogicalOrExpressionNoFunction$subexpression$1", "LogicalAndExpression"], "postprocess": d => buildBinaryOp(d[0], d[1][0].value, d[2])},
    {"name": "LogicalAndExpressionNoFunction", "symbols": ["EqualityExpressionNoFunction"], "postprocess": id},
    {"name": "LogicalAndExpressionNoFunction", "symbols": ["LogicalAndExpressionNoFunction", {"literal":"&&"}, "EqualityExpression"], "postprocess": d => buildBinaryOp(d[0], d[1].value, d[2])},
    {"name": "EqualityExpressionNoFunction", "symbols": ["RelationalExpressionNoFunction"], "postprocess": id},
    {"name": "EqualityExpressionNoFunction$subexpression$1", "symbols": [{"literal":"=="}]},
    {"name": "EqualityExpressionNoFunction$subexpression$1", "symbols": [{"literal":"!="}]},
    {"name": "EqualityExpressionNoFunction$subexpression$1", "symbols": [{"literal":"==="}]},
    {"name": "EqualityExpressionNoFunction$subexpression$1", "symbols": [{"literal":"!=="}]},
    {"name": "EqualityExpressionNoFunction", "symbols": ["EqualityExpressionNoFunction", "EqualityExpressionNoFunction$subexpression$1", "RelationalExpression"], "postprocess": d => buildBinaryOp(d[0], d[1][0].value, d[2])},
    {"name": "RelationalExpressionNoFunction", "symbols": ["AdditiveExpressionNoFunction"], "postprocess": id},
    {"name": "RelationalExpressionNoFunction$subexpression$1", "symbols": [{"literal":"<"}]},
    {"name": "RelationalExpressionNoFunction$subexpression$1", "symbols": [{"literal":">"}]},
    {"name": "RelationalExpressionNoFunction$subexpression$1", "symbols": [{"literal":"<="}]},
    {"name": "RelationalExpressionNoFunction$subexpression$1", "symbols": [{"literal":">="}]},
    {"name": "RelationalExpressionNoFunction", "symbols": ["RelationalExpressionNoFunction", "RelationalExpressionNoFunction$subexpression$1", "AdditiveExpression"], "postprocess": d => buildBinaryOp(d[0], d[1][0].value, d[2])},
    {"name": "AdditiveExpressionNoFunction", "symbols": ["MultiplicativeExpressionNoFunction"], "postprocess": id},
    {"name": "AdditiveExpressionNoFunction$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "AdditiveExpressionNoFunction$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "AdditiveExpressionNoFunction", "symbols": ["AdditiveExpressionNoFunction", "AdditiveExpressionNoFunction$subexpression$1", "MultiplicativeExpression"], "postprocess": d => buildBinaryOp(d[0], d[1][0].value, d[2])},
    {"name": "MultiplicativeExpressionNoFunction", "symbols": ["ExponentiationExpressionNoFunction"], "postprocess": id},
    {"name": "MultiplicativeExpressionNoFunction$subexpression$1", "symbols": [{"literal":"*"}]},
    {"name": "MultiplicativeExpressionNoFunction$subexpression$1", "symbols": [{"literal":"/"}]},
    {"name": "MultiplicativeExpressionNoFunction$subexpression$1", "symbols": [{"literal":"%"}]},
    {"name": "MultiplicativeExpressionNoFunction", "symbols": ["MultiplicativeExpressionNoFunction", "MultiplicativeExpressionNoFunction$subexpression$1", "ExponentiationExpression"], "postprocess": d => buildBinaryOp(d[0], d[1][0].value, d[2])},
    {"name": "ExponentiationExpressionNoFunction", "symbols": ["UnaryExpressionNoFunction"], "postprocess": id},
    {"name": "ExponentiationExpressionNoFunction", "symbols": ["UnaryExpressionNoFunction", {"literal":"**"}, "ExponentiationExpression"], "postprocess": d => buildBinaryOp(d[0], d[1].value, d[2])},
    {"name": "UnaryExpressionNoFunction", "symbols": ["PostfixExpressionNoFunction"], "postprocess": id},
    {"name": "UnaryExpressionNoFunction$subexpression$1", "symbols": [{"literal":"!"}]},
    {"name": "UnaryExpressionNoFunction$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "UnaryExpressionNoFunction$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "UnaryExpressionNoFunction$subexpression$1", "symbols": [{"literal":"++"}]},
    {"name": "UnaryExpressionNoFunction$subexpression$1", "symbols": [{"literal":"--"}]},
    {"name": "UnaryExpressionNoFunction$subexpression$1", "symbols": [{"literal":"typeof"}]},
    {"name": "UnaryExpressionNoFunction$subexpression$1", "symbols": [{"literal":"await"}]},
    {"name": "UnaryExpressionNoFunction", "symbols": ["UnaryExpressionNoFunction$subexpression$1", "UnaryExpression"], "postprocess": d => buildUnaryOp(d[0][0].value, d[1])},
    {"name": "PostfixExpressionNoFunction", "symbols": ["MemberExpressionNoFunction"], "postprocess": id},
    {"name": "PostfixExpressionNoFunction$subexpression$1", "symbols": [{"literal":"++"}]},
    {"name": "PostfixExpressionNoFunction$subexpression$1", "symbols": [{"literal":"--"}]},
    {"name": "PostfixExpressionNoFunction", "symbols": ["MemberExpressionNoFunction", "PostfixExpressionNoFunction$subexpression$1"], "postprocess":  d => ({
          type: 'UpdateExpression',
          operator: d[1][0].value,
          argument: d[0],
          prefix: false
        }) },
    {"name": "MemberExpressionNoFunction", "symbols": ["CallExpressionNoFunction"], "postprocess": id},
    {"name": "MemberExpressionNoFunction$ebnf$1", "symbols": ["Arguments"], "postprocess": id},
    {"name": "MemberExpressionNoFunction$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "MemberExpressionNoFunction", "symbols": [{"literal":"new"}, "MemberExpressionNoFunction", "MemberExpressionNoFunction$ebnf$1"], "postprocess":  d => ({
          type: 'NewExpression',
          callee: d[1],
          arguments: d[2] || []
        }) },
    {"name": "CallExpressionNoFunction", "symbols": ["PrimaryExpressionNoFunction"], "postprocess": id},
    {"name": "CallExpressionNoFunction", "symbols": ["CallExpressionNoFunction", {"literal":"."}, (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess":  d => ({
          type: 'MemberExpression',
          object: d[0],
          property: { type: 'Identifier', name: d[2].value },
          computed: false
        }) },
    {"name": "CallExpressionNoFunction", "symbols": ["CallExpressionNoFunction", {"literal":"?."}, (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess":  d => ({
          type: 'MemberExpression',
          object: d[0],
          property: { type: 'Identifier', name: d[2].value },
          computed: false,
          optional: true
        }) },
    {"name": "CallExpressionNoFunction", "symbols": ["CallExpressionNoFunction", {"literal":"["}, "Expression", {"literal":"]"}], "postprocess":  d => ({
          type: 'MemberExpression',
          object: d[0],
          property: d[2],
          computed: true
        }) },
    {"name": "CallExpressionNoFunction", "symbols": ["CallExpressionNoFunction", "Arguments"], "postprocess":  d => ({
          type: 'CallExpression',
          callee: d[0],
          arguments: d[1]
        }) },
    {"name": "PrimaryExpressionNoFunction", "symbols": [{"literal":"this"}], "postprocess": d => ({ type: 'ThisExpression' })},
    {"name": "PrimaryExpressionNoFunction", "symbols": [{"literal":"super"}], "postprocess": d => ({ type: 'Super' })},
    {"name": "PrimaryExpressionNoFunction", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => ({ type: 'Identifier', name: d[0].value })},
    {"name": "PrimaryExpressionNoFunction", "symbols": [{"literal":"_"}], "postprocess": d => ({ type: 'Identifier', name: '_' })},
    {"name": "PrimaryExpressionNoFunction", "symbols": ["Literal"], "postprocess": id},
    {"name": "PrimaryExpressionNoFunction", "symbols": ["ArrayLiteralNoFunction"], "postprocess": id},
    {"name": "PrimaryExpressionNoFunction", "symbols": ["ObjectLiteralNoFunction"], "postprocess": id},
    {"name": "PrimaryExpressionNoFunction", "symbols": [{"literal":"("}, "PipelineExpressionNoFunction", {"literal":")"}], "postprocess": d => d[1]},
    {"name": "Expression", "symbols": ["AssignmentExpression"], "postprocess": id},
    {"name": "AssignmentExpression", "symbols": ["ArrowFunction"], "postprocess": id},
    {"name": "AssignmentExpression", "symbols": ["ConditionalExpression"], "postprocess": id},
    {"name": "AssignmentExpression$subexpression$1", "symbols": [{"literal":"="}]},
    {"name": "AssignmentExpression$subexpression$1", "symbols": [{"literal":"+="}]},
    {"name": "AssignmentExpression$subexpression$1", "symbols": [{"literal":"-="}]},
    {"name": "AssignmentExpression$subexpression$1", "symbols": [{"literal":"*="}]},
    {"name": "AssignmentExpression$subexpression$1", "symbols": [{"literal":"/="}]},
    {"name": "AssignmentExpression", "symbols": ["ConditionalExpression", "AssignmentExpression$subexpression$1", "AssignmentExpression"], "postprocess":  d => ({
          type: 'AssignmentExpression',
          operator: d[1][0].value,
          left: d[0],
          right: d[2]
        }) },
    {"name": "ConditionalExpression", "symbols": ["LogicalOrExpression"], "postprocess": id},
    {"name": "ConditionalExpression", "symbols": ["LogicalOrExpression", {"literal":"?"}, "Expression", {"literal":":"}, "ConditionalExpression"], "postprocess":  d => ({
          type: 'ConditionalExpression',
          test: d[0],
          consequent: d[2],
          alternate: d[4]
        }) },
    {"name": "LogicalOrExpression", "symbols": ["LogicalAndExpression"], "postprocess": id},
    {"name": "LogicalOrExpression$subexpression$1", "symbols": [{"literal":"||"}]},
    {"name": "LogicalOrExpression$subexpression$1", "symbols": [{"literal":"??"}]},
    {"name": "LogicalOrExpression", "symbols": ["LogicalOrExpression", "LogicalOrExpression$subexpression$1", "LogicalAndExpression"], "postprocess": d => buildBinaryOp(d[0], d[1][0].value, d[2])},
    {"name": "LogicalAndExpression", "symbols": ["EqualityExpression"], "postprocess": id},
    {"name": "LogicalAndExpression", "symbols": ["LogicalAndExpression", {"literal":"&&"}, "EqualityExpression"], "postprocess": d => buildBinaryOp(d[0], d[1].value, d[2])},
    {"name": "EqualityExpression", "symbols": ["RelationalExpression"], "postprocess": id},
    {"name": "EqualityExpression$subexpression$1", "symbols": [{"literal":"=="}]},
    {"name": "EqualityExpression$subexpression$1", "symbols": [{"literal":"!="}]},
    {"name": "EqualityExpression$subexpression$1", "symbols": [{"literal":"==="}]},
    {"name": "EqualityExpression$subexpression$1", "symbols": [{"literal":"!=="}]},
    {"name": "EqualityExpression", "symbols": ["EqualityExpression", "EqualityExpression$subexpression$1", "RelationalExpression"], "postprocess": d => buildBinaryOp(d[0], d[1][0].value, d[2])},
    {"name": "RelationalExpression", "symbols": ["AdditiveExpression"], "postprocess": id},
    {"name": "RelationalExpression$subexpression$1", "symbols": [{"literal":"<"}]},
    {"name": "RelationalExpression$subexpression$1", "symbols": [{"literal":">"}]},
    {"name": "RelationalExpression$subexpression$1", "symbols": [{"literal":"<="}]},
    {"name": "RelationalExpression$subexpression$1", "symbols": [{"literal":">="}]},
    {"name": "RelationalExpression", "symbols": ["RelationalExpression", "RelationalExpression$subexpression$1", "AdditiveExpression"], "postprocess": d => buildBinaryOp(d[0], d[1][0].value, d[2])},
    {"name": "AdditiveExpression", "symbols": ["MultiplicativeExpression"], "postprocess": id},
    {"name": "AdditiveExpression$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "AdditiveExpression$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "AdditiveExpression", "symbols": ["AdditiveExpression", "AdditiveExpression$subexpression$1", "MultiplicativeExpression"], "postprocess": d => buildBinaryOp(d[0], d[1][0].value, d[2])},
    {"name": "MultiplicativeExpression", "symbols": ["ExponentiationExpression"], "postprocess": id},
    {"name": "MultiplicativeExpression$subexpression$1", "symbols": [{"literal":"*"}]},
    {"name": "MultiplicativeExpression$subexpression$1", "symbols": [{"literal":"/"}]},
    {"name": "MultiplicativeExpression$subexpression$1", "symbols": [{"literal":"%"}]},
    {"name": "MultiplicativeExpression", "symbols": ["MultiplicativeExpression", "MultiplicativeExpression$subexpression$1", "ExponentiationExpression"], "postprocess": d => buildBinaryOp(d[0], d[1][0].value, d[2])},
    {"name": "ExponentiationExpression", "symbols": ["UnaryExpression"], "postprocess": id},
    {"name": "ExponentiationExpression", "symbols": ["UnaryExpression", {"literal":"**"}, "ExponentiationExpression"], "postprocess": d => buildBinaryOp(d[0], d[1].value, d[2])},
    {"name": "UnaryExpression", "symbols": ["PostfixExpression"], "postprocess": id},
    {"name": "UnaryExpression$subexpression$1", "symbols": [{"literal":"!"}]},
    {"name": "UnaryExpression$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "UnaryExpression$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "UnaryExpression$subexpression$1", "symbols": [{"literal":"++"}]},
    {"name": "UnaryExpression$subexpression$1", "symbols": [{"literal":"--"}]},
    {"name": "UnaryExpression$subexpression$1", "symbols": [{"literal":"typeof"}]},
    {"name": "UnaryExpression$subexpression$1", "symbols": [{"literal":"await"}]},
    {"name": "UnaryExpression", "symbols": ["UnaryExpression$subexpression$1", "UnaryExpression"], "postprocess": d => buildUnaryOp(d[0][0].value, d[1])},
    {"name": "PostfixExpression", "symbols": ["MemberExpression"], "postprocess": id},
    {"name": "PostfixExpression$subexpression$1", "symbols": [{"literal":"++"}]},
    {"name": "PostfixExpression$subexpression$1", "symbols": [{"literal":"--"}]},
    {"name": "PostfixExpression", "symbols": ["MemberExpression", "PostfixExpression$subexpression$1"], "postprocess":  d => ({
          type: 'UpdateExpression',
          operator: d[1][0].value,
          argument: d[0],
          prefix: false
        }) },
    {"name": "MemberExpression", "symbols": ["CallExpression"], "postprocess": id},
    {"name": "MemberExpression$ebnf$1", "symbols": ["Arguments"], "postprocess": id},
    {"name": "MemberExpression$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "MemberExpression", "symbols": [{"literal":"new"}, "MemberExpression", "MemberExpression$ebnf$1"], "postprocess":  d => ({
          type: 'NewExpression',
          callee: d[1],
          arguments: d[2] || []
        }) },
    {"name": "CallExpression", "symbols": ["PrimaryExpression"], "postprocess": id},
    {"name": "CallExpression", "symbols": ["CallExpression", {"literal":"."}, (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess":  d => ({
          type: 'MemberExpression',
          object: d[0],
          property: { type: 'Identifier', name: d[2].value },
          computed: false
        }) },
    {"name": "CallExpression", "symbols": ["CallExpression", {"literal":"?."}, (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess":  d => ({
          type: 'MemberExpression',
          object: d[0],
          property: { type: 'Identifier', name: d[2].value },
          computed: false,
          optional: true
        }) },
    {"name": "CallExpression", "symbols": ["CallExpression", {"literal":"["}, "Expression", {"literal":"]"}], "postprocess":  d => ({
          type: 'MemberExpression',
          object: d[0],
          property: d[2],
          computed: true
        }) },
    {"name": "CallExpression", "symbols": ["CallExpression", "Arguments"], "postprocess":  d => ({
          type: 'CallExpression',
          callee: d[0],
          arguments: d[1]
        }) },
    {"name": "Arguments", "symbols": [{"literal":"("}, "ArgumentList", {"literal":")"}], "postprocess": d => d[1]},
    {"name": "ArgumentList", "symbols": [], "postprocess": () => []},
    {"name": "ArgumentList", "symbols": ["AssignmentExpression"], "postprocess": d => [d[0]]},
    {"name": "ArgumentList", "symbols": ["ArgumentList", {"literal":","}, "AssignmentExpression"], "postprocess": d => [...d[0], d[2]]},
    {"name": "ArgumentList", "symbols": [{"literal":"..."}, "AssignmentExpression"], "postprocess": d => [{ type: 'SpreadElement', argument: d[1] }]},
    {"name": "PrimaryExpression", "symbols": [{"literal":"this"}], "postprocess": d => ({ type: 'ThisExpression' })},
    {"name": "PrimaryExpression", "symbols": [{"literal":"super"}], "postprocess": d => ({ type: 'Super' })},
    {"name": "PrimaryExpression", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => ({ type: 'Identifier', name: d[0].value })},
    {"name": "PrimaryExpression", "symbols": [{"literal":"_"}], "postprocess": d => ({ type: 'Identifier', name: '_' })},
    {"name": "PrimaryExpression", "symbols": ["Literal"], "postprocess": id},
    {"name": "PrimaryExpression", "symbols": ["ArrayLiteral"], "postprocess": id},
    {"name": "PrimaryExpression", "symbols": ["ObjectLiteral"], "postprocess": id},
    {"name": "PrimaryExpression", "symbols": ["FunctionExpression"], "postprocess": id},
    {"name": "PrimaryExpression", "symbols": [{"literal":"("}, "Expression", {"literal":")"}], "postprocess": d => d[1]},
    {"name": "Literal", "symbols": [(lexer.has("number") ? {type: "number"} : number)], "postprocess": d => ({ type: 'Literal', value: parseFloat(d[0].value), raw: d[0].value })},
    {"name": "Literal", "symbols": [(lexer.has("string") ? {type: "string"} : string)], "postprocess": d => ({ type: 'Literal', value: d[0].value, raw: d[0].text })},
    {"name": "Literal", "symbols": [(lexer.has("templateLiteral") ? {type: "templateLiteral"} : templateLiteral)], "postprocess": d => ({ type: 'TemplateLiteral', value: d[0].value, raw: d[0].text })},
    {"name": "Literal", "symbols": [{"literal":"true"}], "postprocess": d => ({ type: 'Literal', value: true, raw: 'true' })},
    {"name": "Literal", "symbols": [{"literal":"false"}], "postprocess": d => ({ type: 'Literal', value: false, raw: 'false' })},
    {"name": "Literal", "symbols": [{"literal":"null"}], "postprocess": d => ({ type: 'Literal', value: null, raw: 'null' })},
    {"name": "Literal", "symbols": [{"literal":"undefined"}], "postprocess": d => ({ type: 'Literal', value: undefined, raw: 'undefined' })},
    {"name": "ArrayLiteral", "symbols": [{"literal":"["}, {"literal":"]"}], "postprocess": d => ({ type: 'ArrayExpression', elements: [] })},
    {"name": "ArrayLiteral", "symbols": [{"literal":"["}, "ArrayElementList", {"literal":"]"}], "postprocess": d => ({ type: 'ArrayExpression', elements: d[1] })},
    {"name": "ArrayElementList", "symbols": ["ArrayElement"], "postprocess": d => [d[0]]},
    {"name": "ArrayElementList", "symbols": ["ArrayElementList", {"literal":","}], "postprocess": d => [...d[0], null]},
    {"name": "ArrayElementList", "symbols": ["ArrayElementList", {"literal":","}, "ArrayElement"], "postprocess": d => [...d[0], d[2]]},
    {"name": "ArrayElement", "symbols": ["AssignmentExpression"], "postprocess": id},
    {"name": "ArrayElement", "symbols": [{"literal":"..."}, "AssignmentExpression"], "postprocess": d => ({ type: 'SpreadElement', argument: d[1] })},
    {"name": "ArrayLiteralNoFunction", "symbols": [{"literal":"["}, {"literal":"]"}], "postprocess": d => ({ type: 'ArrayExpression', elements: [] })},
    {"name": "ArrayLiteralNoFunction", "symbols": [{"literal":"["}, "ArrayElementListNoFunction", {"literal":"]"}], "postprocess": d => ({ type: 'ArrayExpression', elements: d[1] })},
    {"name": "ArrayElementListNoFunction", "symbols": ["ArrayElementNoFunction"], "postprocess": d => [d[0]]},
    {"name": "ArrayElementListNoFunction", "symbols": ["ArrayElementListNoFunction", {"literal":","}], "postprocess": d => [...d[0], null]},
    {"name": "ArrayElementListNoFunction", "symbols": ["ArrayElementListNoFunction", {"literal":","}, "ArrayElementNoFunction"], "postprocess": d => [...d[0], d[2]]},
    {"name": "ArrayElementNoFunction", "symbols": ["AssignmentExpressionNoFunction"], "postprocess": id},
    {"name": "ArrayElementNoFunction", "symbols": [{"literal":"..."}, "AssignmentExpressionNoFunction"], "postprocess": d => ({ type: 'SpreadElement', argument: d[1] })},
    {"name": "ObjectLiteral", "symbols": [{"literal":"{"}, "PropertyList", {"literal":"}"}], "postprocess": d => ({ type: 'ObjectExpression', properties: d[1] })},
    {"name": "PropertyList", "symbols": [], "postprocess": () => []},
    {"name": "PropertyList", "symbols": ["Property"], "postprocess": d => [d[0]]},
    {"name": "PropertyList", "symbols": ["PropertyList", {"literal":","}, "Property"], "postprocess": d => [...d[0], d[2]]},
    {"name": "Property", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => ({ type: 'Property', key: d[0].value, value: d[0].value, shorthand: true })},
    {"name": "Property", "symbols": ["PropertyKey", {"literal":":"}, "AssignmentExpression"], "postprocess": d => ({ type: 'Property', key: d[0], value: d[2], shorthand: false })},
    {"name": "Property", "symbols": [{"literal":"..."}, "AssignmentExpression"], "postprocess": d => ({ type: 'SpreadElement', argument: d[1] })},
    {"name": "ObjectLiteralNoFunction", "symbols": [{"literal":"{"}, "PropertyListNoFunction", {"literal":"}"}], "postprocess": d => ({ type: 'ObjectExpression', properties: d[1] })},
    {"name": "PropertyListNoFunction", "symbols": [], "postprocess": () => []},
    {"name": "PropertyListNoFunction", "symbols": ["PropertyNoFunction"], "postprocess": d => [d[0]]},
    {"name": "PropertyListNoFunction", "symbols": ["PropertyListNoFunction", {"literal":","}, "PropertyNoFunction"], "postprocess": d => [...d[0], d[2]]},
    {"name": "PropertyNoFunction", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => ({ type: 'Property', key: d[0].value, value: d[0].value, shorthand: true })},
    {"name": "PropertyNoFunction", "symbols": ["PropertyKey", {"literal":":"}, "AssignmentExpressionNoFunction"], "postprocess": d => ({ type: 'Property', key: d[0], value: d[2], shorthand: false })},
    {"name": "PropertyNoFunction", "symbols": [{"literal":"..."}, "AssignmentExpressionNoFunction"], "postprocess": d => ({ type: 'SpreadElement', argument: d[1] })},
    {"name": "PropertyKey", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => ({ type: 'Identifier', name: d[0].value })},
    {"name": "PropertyKey", "symbols": [(lexer.has("string") ? {type: "string"} : string)], "postprocess": d => ({ type: 'Literal', value: d[0].value })},
    {"name": "PropertyKey", "symbols": [{"literal":"["}, "Expression", {"literal":"]"}], "postprocess": d => d[1]},
    {"name": "FunctionExpression$ebnf$1", "symbols": ["async"], "postprocess": id},
    {"name": "FunctionExpression$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "FunctionExpression$ebnf$2", "symbols": ["functionName"], "postprocess": id},
    {"name": "FunctionExpression$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "FunctionExpression", "symbols": ["FunctionExpression$ebnf$1", {"literal":"function"}, "FunctionExpression$ebnf$2", {"literal":"("}, "ParameterList", {"literal":")"}, "Block"], "postprocess":  d => ({
          type: 'FunctionExpression',
          async: !!d[0],
          id: d[2] ? { type: 'Identifier', name: d[2] } : null,
          params: d[4],
          body: d[6]
        }) },
    {"name": "ArrowFunction", "symbols": ["ArrowParameters", (lexer.has("fatArrow") ? {type: "fatArrow"} : fatArrow), "ArrowBody"], "postprocess":  d => ({
          type: 'ArrowFunctionExpression',
          async: false,
          params: d[0],
          body: d[2]
        }) },
    {"name": "ArrowFunction", "symbols": [{"literal":"async"}, "ArrowParameters", (lexer.has("fatArrow") ? {type: "fatArrow"} : fatArrow), "ArrowBody"], "postprocess":  d => ({
          type: 'ArrowFunctionExpression',
          async: true,
          params: d[1],
          body: d[3]
        }) },
    {"name": "ArrowParameters", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => [{ type: 'Identifier', name: d[0].value }]},
    {"name": "ArrowParameters", "symbols": [{"literal":"("}, "ParameterList", {"literal":")"}], "postprocess": d => d[1]},
    {"name": "ArrowBody", "symbols": ["Block"], "postprocess": id},
    {"name": "ArrowBody", "symbols": ["AssignmentExpression"], "postprocess": d => d[0]},
    {"name": "Block", "symbols": [{"literal":"{"}, "Statements", {"literal":"}"}], "postprocess": d => ({ type: 'BlockStatement', body: d[1] })}
]
  , ParserStart: "Program"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
