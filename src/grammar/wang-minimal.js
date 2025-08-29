// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

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

var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "Program", "symbols": ["StatementList"], "postprocess": d => createNode('Program', { body: d[0] })},
    {"name": "StatementList", "symbols": [], "postprocess": () => []},
    {"name": "StatementList", "symbols": ["Statement"], "postprocess": d => [d[0]]},
    {"name": "StatementList", "symbols": ["StatementList", (lexer.has("NL") ? {type: "NL"} : NL), "Statement"], "postprocess": d => [...d[0], d[2]]},
    {"name": "StatementList", "symbols": ["StatementList", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": d => d[0]},
    {"name": "Statement", "symbols": ["VariableDeclaration"], "postprocess": id},
    {"name": "Statement", "symbols": ["FunctionDeclaration"], "postprocess": id},
    {"name": "Statement", "symbols": ["IfStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["ForStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["WhileStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["ReturnStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["ExpressionStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["Block"], "postprocess": id},
    {"name": "VariableDeclaration$subexpression$1", "symbols": [{"literal":"let"}]},
    {"name": "VariableDeclaration$subexpression$1", "symbols": [{"literal":"const"}]},
    {"name": "VariableDeclaration$subexpression$1", "symbols": [{"literal":"var"}]},
    {"name": "VariableDeclaration$ebnf$1$subexpression$1", "symbols": [{"literal":"="}, "AssignmentExpression"]},
    {"name": "VariableDeclaration$ebnf$1", "symbols": ["VariableDeclaration$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "VariableDeclaration$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "VariableDeclaration", "symbols": ["VariableDeclaration$subexpression$1", (lexer.has("identifier") ? {type: "identifier"} : identifier), "VariableDeclaration$ebnf$1"], "postprocess":  d => createNode('VariableDeclaration', {
          kind: d[0][0].value,
          declarations: [createNode('VariableDeclarator', {
            id: createIdentifier(d[1].value),
            init: d[2] ? d[2][1] : null
          })]
        }) },
    {"name": "FunctionDeclaration", "symbols": [{"literal":"function"}, (lexer.has("identifier") ? {type: "identifier"} : identifier), {"literal":"("}, "ParameterList", {"literal":")"}, "Block"], "postprocess":  d => createNode('FunctionDeclaration', {
          id: createIdentifier(d[1].value),
          params: d[3],
          body: d[5]
        }) },
    {"name": "ParameterList", "symbols": [], "postprocess": () => []},
    {"name": "ParameterList", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => [createIdentifier(d[0].value)]},
    {"name": "ParameterList", "symbols": ["ParameterList", {"literal":","}, (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => [...d[0], createIdentifier(d[2].value)]},
    {"name": "IfStatement$ebnf$1$subexpression$1", "symbols": [{"literal":"else"}, "Statement"]},
    {"name": "IfStatement$ebnf$1", "symbols": ["IfStatement$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "IfStatement$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "IfStatement", "symbols": [{"literal":"if"}, {"literal":"("}, "Expression", {"literal":")"}, "Statement", "IfStatement$ebnf$1"], "postprocess":  d => createNode('IfStatement', {
          test: d[2],
          consequent: d[4],
          alternate: d[5] ? d[5][1] : null
        }) },
    {"name": "ForStatement$ebnf$1", "symbols": ["Expression"], "postprocess": id},
    {"name": "ForStatement$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "ForStatement$ebnf$2", "symbols": ["ForUpdate"], "postprocess": id},
    {"name": "ForStatement$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "ForStatement", "symbols": [{"literal":"for"}, {"literal":"("}, "ForInit", {"literal":";"}, "ForStatement$ebnf$1", {"literal":";"}, "ForStatement$ebnf$2", {"literal":")"}, "Statement"], "postprocess":  d => createNode('ForStatement', {
          init: d[2],
          test: d[4],
          update: d[6],
          body: d[8]
        }) },
    {"name": "ForInit", "symbols": [], "postprocess": () => null},
    {"name": "ForInit", "symbols": ["VariableDeclaration"], "postprocess": id},
    {"name": "ForInit", "symbols": ["Expression"], "postprocess": id},
    {"name": "ForUpdate", "symbols": [], "postprocess": () => null},
    {"name": "ForUpdate", "symbols": ["Expression"], "postprocess": id},
    {"name": "WhileStatement", "symbols": [{"literal":"while"}, {"literal":"("}, "Expression", {"literal":")"}, "Statement"], "postprocess":  d => createNode('WhileStatement', {
          test: d[2],
          body: d[4]
        }) },
    {"name": "ReturnStatement$ebnf$1", "symbols": ["Expression"], "postprocess": id},
    {"name": "ReturnStatement$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "ReturnStatement", "symbols": [{"literal":"return"}, "ReturnStatement$ebnf$1"], "postprocess": d => createNode('ReturnStatement', { argument: d[1] })},
    {"name": "ExpressionStatement", "symbols": ["Expression"], "postprocess": d => createNode('ExpressionStatement', { expression: d[0] })},
    {"name": "Expression", "symbols": ["AssignmentExpression"], "postprocess": id},
    {"name": "AssignmentExpression", "symbols": ["ConditionalExpression"], "postprocess": id},
    {"name": "AssignmentExpression", "symbols": ["LeftHandSideExpression", {"literal":"="}, "AssignmentExpression"], "postprocess":  d => createNode('AssignmentExpression', {
          operator: '=',
          left: d[0],
          right: d[2]
        }) },
    {"name": "AssignmentExpression$subexpression$1", "symbols": [{"literal":"+="}]},
    {"name": "AssignmentExpression$subexpression$1", "symbols": [{"literal":"-="}]},
    {"name": "AssignmentExpression", "symbols": ["LeftHandSideExpression", "AssignmentExpression$subexpression$1", "AssignmentExpression"], "postprocess":  d => createNode('AssignmentExpression', {
          operator: d[1][0].value,
          left: d[0],
          right: d[2]
        }) },
    {"name": "ConditionalExpression", "symbols": ["LogicalOrExpression"], "postprocess": id},
    {"name": "LogicalOrExpression", "symbols": ["LogicalAndExpression"], "postprocess": id},
    {"name": "LogicalOrExpression", "symbols": ["LogicalOrExpression", {"literal":"||"}, "LogicalAndExpression"], "postprocess": d => createBinaryOp(d[0], '||', d[2])},
    {"name": "LogicalAndExpression", "symbols": ["EqualityExpression"], "postprocess": id},
    {"name": "LogicalAndExpression", "symbols": ["LogicalAndExpression", {"literal":"&&"}, "EqualityExpression"], "postprocess": d => createBinaryOp(d[0], '&&', d[2])},
    {"name": "EqualityExpression", "symbols": ["RelationalExpression"], "postprocess": id},
    {"name": "EqualityExpression$subexpression$1", "symbols": [{"literal":"=="}]},
    {"name": "EqualityExpression$subexpression$1", "symbols": [{"literal":"!="}]},
    {"name": "EqualityExpression", "symbols": ["EqualityExpression", "EqualityExpression$subexpression$1", "RelationalExpression"], "postprocess": d => createBinaryOp(d[0], d[1][0].value, d[2])},
    {"name": "RelationalExpression", "symbols": ["AdditiveExpression"], "postprocess": id},
    {"name": "RelationalExpression$subexpression$1", "symbols": [{"literal":"<"}]},
    {"name": "RelationalExpression$subexpression$1", "symbols": [{"literal":">"}]},
    {"name": "RelationalExpression$subexpression$1", "symbols": [{"literal":"<="}]},
    {"name": "RelationalExpression$subexpression$1", "symbols": [{"literal":">="}]},
    {"name": "RelationalExpression", "symbols": ["RelationalExpression", "RelationalExpression$subexpression$1", "AdditiveExpression"], "postprocess": d => createBinaryOp(d[0], d[1][0].value, d[2])},
    {"name": "AdditiveExpression", "symbols": ["MultiplicativeExpression"], "postprocess": id},
    {"name": "AdditiveExpression$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "AdditiveExpression$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "AdditiveExpression", "symbols": ["AdditiveExpression", "AdditiveExpression$subexpression$1", "MultiplicativeExpression"], "postprocess": d => createBinaryOp(d[0], d[1][0].value, d[2])},
    {"name": "MultiplicativeExpression", "symbols": ["UnaryExpression"], "postprocess": id},
    {"name": "MultiplicativeExpression$subexpression$1", "symbols": [{"literal":"*"}]},
    {"name": "MultiplicativeExpression$subexpression$1", "symbols": [{"literal":"/"}]},
    {"name": "MultiplicativeExpression", "symbols": ["MultiplicativeExpression", "MultiplicativeExpression$subexpression$1", "UnaryExpression"], "postprocess": d => createBinaryOp(d[0], d[1][0].value, d[2])},
    {"name": "UnaryExpression", "symbols": ["PostfixExpression"], "postprocess": id},
    {"name": "UnaryExpression", "symbols": [{"literal":"!"}, "UnaryExpression"], "postprocess":  d => createNode('UnaryExpression', {
          operator: '!',
          argument: d[1],
          prefix: true
        }) },
    {"name": "UnaryExpression", "symbols": [{"literal":"++"}, "UnaryExpression"], "postprocess":  d => createNode('UpdateExpression', {
          operator: '++',
          argument: d[1],
          prefix: true
        }) },
    {"name": "UnaryExpression", "symbols": [{"literal":"--"}, "UnaryExpression"], "postprocess":  d => createNode('UpdateExpression', {
          operator: '--',
          argument: d[1],
          prefix: true
        }) },
    {"name": "PostfixExpression", "symbols": ["LeftHandSideExpression"], "postprocess": id},
    {"name": "PostfixExpression$subexpression$1", "symbols": [{"literal":"++"}]},
    {"name": "PostfixExpression$subexpression$1", "symbols": [{"literal":"--"}]},
    {"name": "PostfixExpression", "symbols": ["LeftHandSideExpression", "PostfixExpression$subexpression$1"], "postprocess":  d => createNode('UpdateExpression', {
          operator: d[1][0].value,
          argument: d[0],
          prefix: false
        }) },
    {"name": "LeftHandSideExpression", "symbols": ["CallExpression"], "postprocess": id},
    {"name": "LeftHandSideExpression", "symbols": ["NewExpression"], "postprocess": id},
    {"name": "CallExpression", "symbols": ["MemberExpression", "Arguments"], "postprocess":  d => createNode('CallExpression', {
          callee: d[0],
          arguments: d[1]
        }) },
    {"name": "CallExpression", "symbols": ["CallExpression", "Arguments"], "postprocess":  d => createNode('CallExpression', {
          callee: d[0],
          arguments: d[1]
        }) },
    {"name": "CallExpression", "symbols": ["CallExpression", {"literal":"["}, "Expression", {"literal":"]"}], "postprocess":  d => createNode('MemberExpression', {
          object: d[0],
          property: d[2],
          computed: true
        }) },
    {"name": "CallExpression", "symbols": ["CallExpression", {"literal":"."}, (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess":  d => createNode('MemberExpression', {
          object: d[0],
          property: createIdentifier(d[2].value),
          computed: false
        }) },
    {"name": "NewExpression$ebnf$1", "symbols": ["Arguments"], "postprocess": id},
    {"name": "NewExpression$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "NewExpression", "symbols": [{"literal":"new"}, "MemberExpression", "NewExpression$ebnf$1"], "postprocess":  d => createNode('NewExpression', {
          callee: d[1],
          arguments: d[2] || []
        }) },
    {"name": "NewExpression", "symbols": ["MemberExpression"], "postprocess": id},
    {"name": "MemberExpression", "symbols": ["PrimaryExpression"], "postprocess": id},
    {"name": "MemberExpression", "symbols": ["MemberExpression", {"literal":"["}, "Expression", {"literal":"]"}], "postprocess":  d => createNode('MemberExpression', {
          object: d[0],
          property: d[2],
          computed: true
        }) },
    {"name": "MemberExpression", "symbols": ["MemberExpression", {"literal":"."}, (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess":  d => createNode('MemberExpression', {
          object: d[0],
          property: createIdentifier(d[2].value),
          computed: false
        }) },
    {"name": "Arguments", "symbols": [{"literal":"("}, "ArgumentList", {"literal":")"}], "postprocess": d => d[1]},
    {"name": "ArgumentList", "symbols": [], "postprocess": () => []},
    {"name": "ArgumentList", "symbols": ["AssignmentExpression"], "postprocess": d => [d[0]]},
    {"name": "ArgumentList", "symbols": ["ArgumentList", {"literal":","}, "AssignmentExpression"], "postprocess": d => [...d[0], d[2]]},
    {"name": "PrimaryExpression", "symbols": [{"literal":"this"}], "postprocess": () => createNode('ThisExpression')},
    {"name": "PrimaryExpression", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => createIdentifier(d[0].value)},
    {"name": "PrimaryExpression", "symbols": ["Literal"], "postprocess": id},
    {"name": "PrimaryExpression", "symbols": ["ArrayLiteral"], "postprocess": id},
    {"name": "PrimaryExpression", "symbols": ["ObjectLiteral"], "postprocess": id},
    {"name": "PrimaryExpression", "symbols": [{"literal":"("}, "Expression", {"literal":")"}], "postprocess": d => d[1]},
    {"name": "Literal", "symbols": [(lexer.has("number") ? {type: "number"} : number)], "postprocess": d => createLiteral(d[0].value, d[0].text)},
    {"name": "Literal", "symbols": [(lexer.has("string") ? {type: "string"} : string)], "postprocess": d => createLiteral(d[0].value, d[0].text)},
    {"name": "Literal", "symbols": [{"literal":"true"}], "postprocess": () => createLiteral(true, 'true')},
    {"name": "Literal", "symbols": [{"literal":"false"}], "postprocess": () => createLiteral(false, 'false')},
    {"name": "Literal", "symbols": [{"literal":"null"}], "postprocess": () => createLiteral(null, 'null')},
    {"name": "ArrayLiteral", "symbols": [{"literal":"["}, "ElementList", {"literal":"]"}], "postprocess": d => createNode('ArrayExpression', { elements: d[1] })},
    {"name": "ElementList", "symbols": [], "postprocess": () => []},
    {"name": "ElementList", "symbols": ["AssignmentExpression"], "postprocess": d => [d[0]]},
    {"name": "ElementList", "symbols": ["ElementList", {"literal":","}, "AssignmentExpression"], "postprocess": d => [...d[0], d[2]]},
    {"name": "ObjectLiteral", "symbols": [{"literal":"{"}, {"literal":"}"}], "postprocess": () => createNode('ObjectExpression', { properties: [] })},
    {"name": "Block", "symbols": [{"literal":"{"}, "StatementList", {"literal":"}"}], "postprocess": d => createNode('BlockStatement', { body: d[1] })}
]
  , ParserStart: "Program"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
