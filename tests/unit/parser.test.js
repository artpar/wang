#!/usr/bin/env node

/**
 * Unit tests for Wang parser
 */

import { TestContext, assertParseCount, assertEqual, runTest, runTests } from '../test-utils.js';

const tests = [
  runTest('Parser: Simple variable declaration', () => {
    const ctx = new TestContext();
    const results = ctx.parse('let x = 5');
    assertParseCount(results, 1, 'Variable declaration');
    
    const ast = results[0];
    assertEqual(ast.type, 'Program', 'Root node type');
    assertEqual(ast.body.length, 1, 'Statement count');
    assertEqual(ast.body[0].type, 'VariableDeclaration', 'Statement type');
    assertEqual(ast.body[0].kind, 'let', 'Declaration kind');
  }),

  runTest('Parser: Multiple statements', () => {
    const ctx = new TestContext();
    const results = ctx.parse(`
      let x = 5
      let y = 10
      x + y
    `);
    assertParseCount(results, 1, 'Multiple statements');
    
    const ast = results[0];
    assertEqual(ast.body.length, 3, 'Statement count');
    assertEqual(ast.body[0].type, 'VariableDeclaration', 'First statement');
    assertEqual(ast.body[1].type, 'VariableDeclaration', 'Second statement');
    assertEqual(ast.body[2].type, 'ExpressionStatement', 'Third statement');
  }),

  runTest('Parser: Binary expression precedence', () => {
    const ctx = new TestContext();
    const results = ctx.parse('a + b * c');
    assertParseCount(results, 1, 'Binary expression');
    
    const ast = results[0];
    const expr = ast.body[0].expression;
    assertEqual(expr.type, 'BinaryExpression', 'Expression type');
    assertEqual(expr.operator, '+', 'Outer operator');
    assertEqual(expr.right.type, 'BinaryExpression', 'Right side type');
    assertEqual(expr.right.operator, '*', 'Inner operator');
  }),

  runTest('Parser: Function declaration', () => {
    const ctx = new TestContext();
    const results = ctx.parse(`
      function add(a, b) {
        return a + b
      }
    `);
    assertParseCount(results, 1, 'Function declaration');
    
    const ast = results[0];
    const func = ast.body[0];
    assertEqual(func.type, 'FunctionDeclaration', 'Declaration type');
    assertEqual(func.id.name, 'add', 'Function name');
    assertEqual(func.params.length, 2, 'Parameter count');
    assertEqual(func.async, false, 'Async flag');
  }),

  runTest('Parser: Async function declaration', () => {
    const ctx = new TestContext();
    const results = ctx.parse(`
      async function fetchData() {
        return await getData()
      }
    `);
    assertParseCount(results, 1, 'Async function');
    
    const ast = results[0];
    const func = ast.body[0];
    assertEqual(func.type, 'FunctionDeclaration', 'Declaration type');
    assertEqual(func.async, true, 'Async flag');
  }),

  runTest('Parser: Arrow function', () => {
    const ctx = new TestContext();
    const results = ctx.parse('const square = x => x * x');
    assertParseCount(results, 1, 'Arrow function');
    
    const ast = results[0];
    const decl = ast.body[0];
    const arrow = decl.declarations[0].init;
    assertEqual(arrow.type, 'ArrowFunctionExpression', 'Arrow function type');
    assertEqual(arrow.params.length, 1, 'Parameter count');
    assertEqual(arrow.async, false, 'Async flag');
  }),

  runTest('Parser: Async arrow function', () => {
    const ctx = new TestContext();
    const results = ctx.parse('const fetch = async () => await getData()');
    assertParseCount(results, 1, 'Async arrow function');
    
    const ast = results[0];
    const arrow = ast.body[0].declarations[0].init;
    assertEqual(arrow.type, 'ArrowFunctionExpression', 'Arrow function type');
    assertEqual(arrow.async, true, 'Async flag');
  }),

  runTest('Parser: Object literal', () => {
    const ctx = new TestContext();
    const results = ctx.parse(`
      const obj = {
        name: "Alice",
        age: 30,
        active: true
      }
    `);
    assertParseCount(results, 1, 'Object literal');
    
    const ast = results[0];
    const obj = ast.body[0].declarations[0].init;
    assertEqual(obj.type, 'ObjectExpression', 'Object type');
    assertEqual(obj.properties.length, 3, 'Property count');
  }),

  runTest('Parser: Array literal', () => {
    const ctx = new TestContext();
    const results = ctx.parse('const arr = [1, 2, 3, 4, 5]');
    assertParseCount(results, 1, 'Array literal');
    
    const ast = results[0];
    const arr = ast.body[0].declarations[0].init;
    assertEqual(arr.type, 'ArrayExpression', 'Array type');
    assertEqual(arr.elements.length, 5, 'Element count');
  }),

  runTest('Parser: If statement', () => {
    const ctx = new TestContext();
    const results = ctx.parse(`
      if (x > 10) {
        log("big")
      } else {
        log("small")
      }
    `);
    assertParseCount(results, 1, 'If statement');
    
    const ast = results[0];
    const ifStmt = ast.body[0];
    assertEqual(ifStmt.type, 'IfStatement', 'Statement type');
    assertEqual(ifStmt.test.type, 'BinaryExpression', 'Test type');
    assertEqual(ifStmt.consequent.type, 'BlockStatement', 'Then block');
    assertEqual(ifStmt.alternate.type, 'BlockStatement', 'Else block');
  }),

  runTest('Parser: For loop', () => {
    const ctx = new TestContext();
    const results = ctx.parse(`
      for (let i = 0; i < 10; i++) {
        log(i)
      }
    `);
    assertParseCount(results, 1, 'For loop');
    
    const ast = results[0];
    const forStmt = ast.body[0];
    assertEqual(forStmt.type, 'ForStatement', 'Statement type');
    assertEqual(forStmt.init.type, 'VariableDeclaration', 'Init type');
    assertEqual(forStmt.test.type, 'BinaryExpression', 'Test type');
    assertEqual(forStmt.update.type, 'UpdateExpression', 'Update type');
  }),

  runTest('Parser: For-of loop', () => {
    const ctx = new TestContext();
    const results = ctx.parse(`
      for (let item of items) {
        process(item)
      }
    `);
    assertParseCount(results, 1, 'For-of loop');
    
    const ast = results[0];
    const forStmt = ast.body[0];
    assertEqual(forStmt.type, 'ForOfStatement', 'Statement type');
    assertEqual(forStmt.left.type, 'VariableDeclaration', 'Left type');
  }),

  runTest('Parser: Pipeline expression', () => {
    const ctx = new TestContext();
    const results = ctx.parse('data |> filter(_, active) |> sort()');
    assertParseCount(results, 1, 'Pipeline expression');
    
    const ast = results[0];
    const expr = ast.body[0].expression;
    assertEqual(expr.type, 'PipelineExpression', 'Expression type');
    assertEqual(expr.operator, '|>', 'Pipeline operator');
  }),

  runTest('Parser: Class declaration', () => {
    const ctx = new TestContext();
    const results = ctx.parse(`
      class Person {
        constructor(name) {
          this.name = name
        }
        
        greet() {
          return "Hello, " + this.name
        }
      }
    `);
    assertParseCount(results, 1, 'Class declaration');
    
    const ast = results[0];
    const cls = ast.body[0];
    assertEqual(cls.type, 'ClassDeclaration', 'Declaration type');
    assertEqual(cls.id.name, 'Person', 'Class name');
    assertEqual(cls.body.body.length, 2, 'Method count');
  }),

  runTest('Parser: Import statement', () => {
    const ctx = new TestContext();
    const results = ctx.parse('import { foo, bar } from "./module"');
    assertParseCount(results, 1, 'Import statement');
    
    const ast = results[0];
    const imp = ast.body[0];
    assertEqual(imp.type, 'ImportDeclaration', 'Statement type');
    assertEqual(imp.specifiers.length, 2, 'Specifier count');
    assertEqual(imp.source, './module', 'Module source');
  }),

  runTest('Parser: Export statement', () => {
    const ctx = new TestContext();
    const results = ctx.parse('export function helper() { return 42 }');
    assertParseCount(results, 1, 'Export statement');
    
    const ast = results[0];
    const exp = ast.body[0];
    assertEqual(exp.type, 'ExportNamedDeclaration', 'Statement type');
    assertEqual(exp.declaration.type, 'FunctionDeclaration', 'Declaration type');
  }),

  runTest('Parser: Try-catch statement', () => {
    const ctx = new TestContext();
    const results = ctx.parse(`
      try {
        riskyOperation()
      } catch (e) {
        handleError(e)
      }
    `);
    assertParseCount(results, 1, 'Try-catch statement');
    
    const ast = results[0];
    const tryStmt = ast.body[0];
    assertEqual(tryStmt.type, 'TryStatement', 'Statement type');
    assertEqual(tryStmt.block.type, 'BlockStatement', 'Try block');
    assertEqual(tryStmt.handler.type, 'CatchClause', 'Catch clause');
  }),

  runTest('Parser: Template literal', () => {
    const ctx = new TestContext();
    const results = ctx.parse('const msg = `Hello, world!`');
    assertParseCount(results, 1, 'Template literal');
    
    const ast = results[0];
    const tmpl = ast.body[0].declarations[0].init;
    assertEqual(tmpl.type, 'TemplateLiteral', 'Literal type');
  }),

  runTest('Parser: Destructuring assignment', () => {
    const ctx = new TestContext();
    const results = ctx.parse('const { name, age } = person');
    assertParseCount(results, 1, 'Object destructuring');
    
    const ast = results[0];
    const pattern = ast.body[0].declarations[0].id;
    assertEqual(pattern.type, 'ObjectPattern', 'Pattern type');
    assertEqual(pattern.properties.length, 2, 'Property count');
  }),

  runTest('Parser: Array destructuring', () => {
    const ctx = new TestContext();
    const results = ctx.parse('const [first, second, ...rest] = items');
    assertParseCount(results, 1, 'Array destructuring');
    
    const ast = results[0];
    const pattern = ast.body[0].declarations[0].id;
    assertEqual(pattern.type, 'ArrayPattern', 'Pattern type');
    assertEqual(pattern.elements.length, 3, 'Element count');
    assertEqual(pattern.elements[2].type, 'RestElement', 'Rest element');
  })
];

runTests(tests);