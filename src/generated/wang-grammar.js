// Bundled Nearley Runtime (19.6KB)
const nearley = (function() {
function Rule(name, symbols, postprocess) {
        this.id = ++Rule.highestId;
        this.name = name;
        this.symbols = symbols;        // a list of literal | regex class | nonterminal
        this.postprocess = postprocess;
        return this;
    }
    Rule.highestId = 0;

    Rule.prototype.toString = function(withCursorAt) {
        var symbolSequence = (typeof withCursorAt === "undefined")
                             ? this.symbols.map(getSymbolShortDisplay).join(' ')
                             : (   this.symbols.slice(0, withCursorAt).map(getSymbolShortDisplay).join(' ')
                                 + " ● "
                                 + this.symbols.slice(withCursorAt).map(getSymbolShortDisplay).join(' ')     );
        return this.name + " → " + symbolSequence;
    }


    // a State is a rule at a position from a given starting point in the input stream (reference)
    function State(rule, dot, reference, wantedBy) {
        this.rule = rule;
        this.dot = dot;
        this.reference = reference;
        this.data = [];
        this.wantedBy = wantedBy;
        this.isComplete = this.dot === rule.symbols.length;
    }

    State.prototype.toString = function() {
        return "{" + this.rule.toString(this.dot) + "}, from: " + (this.reference || 0);
    };

    State.prototype.nextState = function(child) {
        var state = new State(this.rule, this.dot + 1, this.reference, this.wantedBy);
        state.left = this;
        state.right = child;
        if (state.isComplete) {
            state.data = state.build();
            // Having right set here will prevent the right state and its children
            // form being garbage collected
            state.right = undefined;
        }
        return state;
    };

    State.prototype.build = function() {
        var children = [];
        var node = this;
        do {
            children.push(node.right.data);
            node = node.left;
        } while (node.left);
        children.reverse();
        return children;
    };

    State.prototype.finish = function() {
        if (this.rule.postprocess) {
            this.data = this.rule.postprocess(this.data, this.reference, Parser.fail);
        }
    };


    function Column(grammar, index) {
        this.grammar = grammar;
        this.index = index;
        this.states = [];
        this.wants = {}; // states indexed by the non-terminal they expect
        this.scannable = []; // list of states that expect a token
        this.completed = {}; // states that are nullable
    }


    Column.prototype.process = function(nextColumn) {
        var states = this.states;
        var wants = this.wants;
        var completed = this.completed;

        for (var w = 0; w < states.length; w++) { // nb. we push() during iteration
            var state = states[w];

            if (state.isComplete) {
                state.finish();
                if (state.data !== Parser.fail) {
                    // complete
                    var wantedBy = state.wantedBy;
                    for (var i = wantedBy.length; i--; ) { // this line is hot
                        var left = wantedBy[i];
                        this.complete(left, state);
                    }

                    // special-case nullables
                    if (state.reference === this.index) {
                        // make sure future predictors of this rule get completed.
                        var exp = state.rule.name;
                        (this.completed[exp] = this.completed[exp] || []).push(state);
                    }
                }

            } else {
                // queue scannable states
                var exp = state.rule.symbols[state.dot];
                if (typeof exp !== 'string') {
                    this.scannable.push(state);
                    continue;
                }

                // predict
                if (wants[exp]) {
                    wants[exp].push(state);

                    if (completed.hasOwnProperty(exp)) {
                        var nulls = completed[exp];
                        for (var i = 0; i < nulls.length; i++) {
                            var right = nulls[i];
                            this.complete(state, right);
                        }
                    }
                } else {
                    wants[exp] = [state];
                    this.predict(exp);
                }
            }
        }
    }

    Column.prototype.predict = function(exp) {
        var rules = this.grammar.byName[exp] || [];

        for (var i = 0; i < rules.length; i++) {
            var r = rules[i];
            var wantedBy = this.wants[exp];
            var s = new State(r, 0, this.index, wantedBy);
            this.states.push(s);
        }
    }

    Column.prototype.complete = function(left, right) {
        var copy = left.nextState(right);
        this.states.push(copy);
    }


    function Grammar(rules, start) {
        this.rules = rules;
        this.start = start || this.rules[0].name;
        var byName = this.byName = {};
        this.rules.forEach(function(rule) {
            if (!byName.hasOwnProperty(rule.name)) {
                byName[rule.name] = [];
            }
            byName[rule.name].push(rule);
        });
    }

    // So we can allow passing (rules, start) directly to Parser for backwards compatibility
    Grammar.fromCompiled = function(rules, start) {
        var lexer = rules.Lexer;
        if (rules.ParserStart) {
          start = rules.ParserStart;
          rules = rules.ParserRules;
        }
        var rules = rules.map(function (r) { return (new Rule(r.name, r.symbols, r.postprocess)); });
        var g = new Grammar(rules, start);
        g.lexer = lexer; // nb. storing lexer on Grammar is iffy, but unavoidable
        return g;
    }


    function StreamLexer() {
      this.reset("");
    }

    StreamLexer.prototype.reset = function(data, state) {
        this.buffer = data;
        this.index = 0;
        this.line = state ? state.line : 1;
        this.lastLineBreak = state ? -state.col : 0;
    }

    StreamLexer.prototype.next = function() {
        if (this.index < this.buffer.length) {
            var ch = this.buffer[this.index++];
            if (ch === '\n') {
              this.line += 1;
              this.lastLineBreak = this.index;
            }
            return {value: ch};
        }
    }

    StreamLexer.prototype.save = function() {
      return {
        line: this.line,
        col: this.index - this.lastLineBreak,
      }
    }

    StreamLexer.prototype.formatError = function(token, message) {
        // nb. this gets called after consuming the offending token,
        // so the culprit is index-1
        var buffer = this.buffer;
        if (typeof buffer === 'string') {
            var lines = buffer
                .split("\n")
                .slice(
                    Math.max(0, this.line - 5), 
                    this.line
                );

            var nextLineBreak = buffer.indexOf('\n', this.index);
            if (nextLineBreak === -1) nextLineBreak = buffer.length;
            var col = this.index - this.lastLineBreak;
            var lastLineDigits = String(this.line).length;
            message += " at line " + this.line + " col " + col + ":\n\n";
            message += lines
                .map(function(line, i) {
                    return pad(this.line - lines.length + i + 1, lastLineDigits) + " " + line;
                }, this)
                .join("\n");
            message += "\n" + pad("", lastLineDigits + col) + "^\n";
            return message;
        } else {
            return message + " at index " + (this.index - 1);
        }

        function pad(n, length) {
            var s = String(n);
            return Array(length - s.length + 1).join(" ") + s;
        }
    }

    function Parser(rules, start, options) {
        if (rules instanceof Grammar) {
            var grammar = rules;
            var options = start;
        } else {
            var grammar = Grammar.fromCompiled(rules, start);
        }
        this.grammar = grammar;

        // Read options
        this.options = {
            keepHistory: false,
            lexer: grammar.lexer || new StreamLexer,
        };
        for (var key in (options || {})) {
            this.options[key] = options[key];
        }

        // Setup lexer
        this.lexer = this.options.lexer;
        this.lexerState = undefined;

        // Setup a table
        var column = new Column(grammar, 0);
        var table = this.table = [column];

        // I could be expecting anything.
        column.wants[grammar.start] = [];
        column.predict(grammar.start);
        // TODO what if start rule is nullable?
        column.process();
        this.current = 0; // token index
    }

    // create a reserved token for indicating a parse fail
    Parser.fail = {};

    Parser.prototype.feed = function(chunk) {
        var lexer = this.lexer;
        lexer.reset(chunk, this.lexerState);

        var token;
        while (true) {
            try {
                token = lexer.next();
                if (!token) {
                    break;
                }
            } catch (e) {
                // Create the next column so that the error reporter
                // can display the correctly predicted states.
                var nextColumn = new Column(this.grammar, this.current + 1);
                this.table.push(nextColumn);
                var err = new Error(this.reportLexerError(e));
                err.offset = this.current;
                err.token = e.token;
                throw err;
            }
            // We add new states to table[current+1]
            var column = this.table[this.current];

            // GC unused states
            if (!this.options.keepHistory) {
                delete this.table[this.current - 1];
            }

            var n = this.current + 1;
            var nextColumn = new Column(this.grammar, n);
            this.table.push(nextColumn);

            // Advance all tokens that expect the symbol
            var literal = token.text !== undefined ? token.text : token.value;
            var value = lexer.constructor === StreamLexer ? token.value : token;
            var scannable = column.scannable;
            for (var w = scannable.length; w--; ) {
                var state = scannable[w];
                var expect = state.rule.symbols[state.dot];
                // Try to consume the token
                // either regex or literal
                if (expect.test ? expect.test(value) :
                    expect.type ? expect.type === token.type
                                : expect.literal === literal) {
                    // Add it
                    var next = state.nextState({data: value, token: token, isToken: true, reference: n - 1});
                    nextColumn.states.push(next);
                }
            }

            // Next, for each of the rules, we either
            // (a) complete it, and try to see if the reference row expected that
            //     rule
            // (b) predict the next nonterminal it expects by adding that
            //     nonterminal's start state
            // To prevent duplication, we also keep track of rules we have already
            // added

            nextColumn.process();

            // If needed, throw an error:
            if (nextColumn.states.length === 0) {
                // No states at all! This is not good.
                var err = new Error(this.reportError(token));
                err.offset = this.current;
                err.token = token;
                throw err;
            }

            // maybe save lexer state
            if (this.options.keepHistory) {
              column.lexerState = lexer.save()
            }

            this.current++;
        }
        if (column) {
          this.lexerState = lexer.save()
        }

        // Incrementally keep track of results
        this.results = this.finish();

        // Allow chaining, for whatever it's worth
        return this;
    };

    Parser.prototype.reportLexerError = function(lexerError) {
        var tokenDisplay, lexerMessage;
        // Planning to add a token property to moo's thrown error
        // even on erroring tokens to be used in error display below
        var token = lexerError.token;
        if (token) {
            tokenDisplay = "input " + JSON.stringify(token.text[0]) + " (lexer error)";
            lexerMessage = this.lexer.formatError(token, "Syntax error");
        } else {
            tokenDisplay = "input (lexer error)";
            lexerMessage = lexerError.message;
        }
        return this.reportErrorCommon(lexerMessage, tokenDisplay);
    };

    Parser.prototype.reportError = function(token) {
        var tokenDisplay = (token.type ? token.type + " token: " : "") + JSON.stringify(token.value !== undefined ? token.value : token);
        var lexerMessage = this.lexer.formatError(token, "Syntax error");
        return this.reportErrorCommon(lexerMessage, tokenDisplay);
    };

    Parser.prototype.reportErrorCommon = function(lexerMessage, tokenDisplay) {
        var lines = [];
        lines.push(lexerMessage);
        var lastColumnIndex = this.table.length - 2;
        var lastColumn = this.table[lastColumnIndex];
        var expectantStates = lastColumn.states
            .filter(function(state) {
                var nextSymbol = state.rule.symbols[state.dot];
                return nextSymbol && typeof nextSymbol !== "string";
            });

        if (expectantStates.length === 0) {
            lines.push('Unexpected ' + tokenDisplay + '. I did not expect any more input. Here is the state of my parse table:\n');
            this.displayStateStack(lastColumn.states, lines);
        } else {
            lines.push('Unexpected ' + tokenDisplay + '. Instead, I was expecting to see one of the following:\n');
            // Display a "state stack" for each expectant state
            // - which shows you how this state came to be, step by step.
            // If there is more than one derivation, we only display the first one.
            var stateStacks = expectantStates
                .map(function(state) {
                    return this.buildFirstStateStack(state, []) || [state];
                }, this);
            // Display each state that is expecting a terminal symbol next.
            stateStacks.forEach(function(stateStack) {
                var state = stateStack[0];
                var nextSymbol = state.rule.symbols[state.dot];
                var symbolDisplay = this.getSymbolDisplay(nextSymbol);
                lines.push('A ' + symbolDisplay + ' based on:');
                this.displayStateStack(stateStack, lines);
            }, this);
        }
        lines.push("");
        return lines.join("\n");
    }
    
    Parser.prototype.displayStateStack = function(stateStack, lines) {
        var lastDisplay;
        var sameDisplayCount = 0;
        for (var j = 0; j < stateStack.length; j++) {
            var state = stateStack[j];
            var display = state.rule.toString(state.dot);
            if (display === lastDisplay) {
                sameDisplayCount++;
            } else {
                if (sameDisplayCount > 0) {
                    lines.push('    ^ ' + sameDisplayCount + ' more lines identical to this');
                }
                sameDisplayCount = 0;
                lines.push('    ' + display);
            }
            lastDisplay = display;
        }
    };

    Parser.prototype.getSymbolDisplay = function(symbol) {
        return getSymbolLongDisplay(symbol);
    };

    /*
    Builds a the first state stack. You can think of a state stack as the call stack
    of the recursive-descent parser which the Nearley parse algorithm simulates.
    A state stack is represented as an array of state objects. Within a
    state stack, the first item of the array will be the starting
    state, with each successive item in the array going further back into history.

    This function needs to be given a starting state and an empty array representing
    the visited states, and it returns an single state stack.

    */
    Parser.prototype.buildFirstStateStack = function(state, visited) {
        if (visited.indexOf(state) !== -1) {
            // Found cycle, return null
            // to eliminate this path from the results, because
            // we don't know how to display it meaningfully
            return null;
        }
        if (state.wantedBy.length === 0) {
            return [state];
        }
        var prevState = state.wantedBy[0];
        var childVisited = [state].concat(visited);
        var childResult = this.buildFirstStateStack(prevState, childVisited);
        if (childResult === null) {
            return null;
        }
        return [state].concat(childResult);
    };

    Parser.prototype.save = function() {
        var column = this.table[this.current];
        column.lexerState = this.lexerState;
        return column;
    };

    Parser.prototype.restore = function(column) {
        var index = column.index;
        this.current = index;
        this.table[index] = column;
        this.table.splice(index + 1);
        this.lexerState = column.lexerState;

        // Incrementally keep track of results
        this.results = this.finish();
    };

    // nb. deprecated: use save/restore instead!
    Parser.prototype.rewind = function(index) {
        if (!this.options.keepHistory) {
            throw new Error('set option `keepHistory` to enable rewinding')
        }
        // nb. recall column (table) indicies fall between token indicies.
        //        col 0   --   token 0   --   col 1
        this.restore(this.table[index]);
    };

    Parser.prototype.finish = function() {
        // Return the possible parsings
        var considerations = [];
        var start = this.grammar.start;
        var column = this.table[this.table.length - 1]
        column.states.forEach(function (t) {
            if (t.rule.name === start
                    && t.dot === t.rule.symbols.length
                    && t.reference === 0
                    && t.data !== Parser.fail) {
                considerations.push(t);
            }
        });
        return considerations.map(function(c) {return c.data; });
    };

    function getSymbolLongDisplay(symbol) {
        var type = typeof symbol;
        if (type === "string") {
            return symbol;
        } else if (type === "object") {
            if (symbol.literal) {
                return JSON.stringify(symbol.literal);
            } else if (symbol instanceof RegExp) {
                return 'character matching ' + symbol;
            } else if (symbol.type) {
                return symbol.type + ' token';
            } else if (symbol.test) {
                return 'token matching ' + String(symbol.test);
            } else {
                throw new Error('Unknown symbol type: ' + symbol);
            }
        }
    }

    function getSymbolShortDisplay(symbol) {
        var type = typeof symbol;
        if (type === "string") {
            return symbol;
        } else if (type === "object") {
            if (symbol.literal) {
                return JSON.stringify(symbol.literal);
            } else if (symbol instanceof RegExp) {
                return symbol.toString();
            } else if (symbol.type) {
                return '%' + symbol.type;
            } else if (symbol.test) {
                return '<' + String(symbol.test) + '>';
            } else {
                throw new Error('Unknown symbol type: ' + symbol);
            }
        }
    }

return {
        Parser: Parser,
        Grammar: Grammar,
        Rule: Rule,
    };
})();

// Original Generated Grammar (extracted from IIFE, with exports replaced)
// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley

function id(x) { return x[0]; }

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

var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "Program", "symbols": ["StatementList"], "postprocess": d => createNode('Program', { body: d[0] })},
    {"name": "StatementList", "symbols": [], "postprocess": () => []},
    {"name": "StatementList", "symbols": ["Statement"], "postprocess": d => [d[0]]},
    {"name": "StatementList", "symbols": ["StatementList", (lexer.has("NL") ? {type: "NL"} : NL), "Statement"], "postprocess": d => [...d[0], d[2]]},
    {"name": "StatementList", "symbols": ["StatementList", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": d => d[0]},
    {"name": "Statement", "symbols": ["Declaration"], "postprocess": id},
    {"name": "Statement", "symbols": ["LabeledStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["ControlStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["ExpressionStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["Block"], "postprocess": id},
    {"name": "Statement", "symbols": ["PipelineContinuation"], "postprocess": id},
    {"name": "Statement", "symbols": ["MemberContinuation"], "postprocess": id},
    {"name": "PipelineContinuation$subexpression$1", "symbols": [{"literal":"|>"}]},
    {"name": "PipelineContinuation$subexpression$1", "symbols": [{"literal":"->"}]},
    {"name": "PipelineContinuation$ebnf$1", "symbols": []},
    {"name": "PipelineContinuation$ebnf$1", "symbols": ["PipelineContinuation$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "PipelineContinuation", "symbols": ["PipelineContinuation$subexpression$1", "PipelineContinuation$ebnf$1", "AssignmentExpression"], "postprocess":  d => {
          // This will be handled specially by the statement list processor
          return createNode('PipelineContinuation', {
            operator: d[0][0].value,
            right: d[2]
          });
        } },
    {"name": "MemberContinuation$ebnf$1", "symbols": ["Arguments"], "postprocess": id},
    {"name": "MemberContinuation$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "MemberContinuation", "symbols": [{"literal":"."}, (lexer.has("identifier") ? {type: "identifier"} : identifier), "MemberContinuation$ebnf$1"], "postprocess":  d => {
          return createNode('MemberContinuation', {
            property: createIdentifier(d[1].value),
            arguments: d[2] || null
          });
        } },
    {"name": "MemberContinuation$ebnf$2", "symbols": ["Arguments"], "postprocess": id},
    {"name": "MemberContinuation$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "MemberContinuation", "symbols": [{"literal":"?."}, (lexer.has("identifier") ? {type: "identifier"} : identifier), "MemberContinuation$ebnf$2"], "postprocess":  d => {
          return createNode('MemberContinuation', {
            property: createIdentifier(d[1].value),
            arguments: d[2] || null,
            optional: true
          });
        } },
    {"name": "LabeledStatement", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), {"literal":":"}, "LoopStatement"], "postprocess":  d => createNode('LabeledStatement', {
          label: createIdentifier(d[0].value),
          body: d[2]
        }) },
    {"name": "LoopStatement", "symbols": ["WhileStatement"], "postprocess": id},
    {"name": "LoopStatement", "symbols": ["DoWhileStatement"], "postprocess": id},
    {"name": "LoopStatement", "symbols": ["ForStatement"], "postprocess": id},
    {"name": "Declaration", "symbols": ["VariableDeclaration"], "postprocess": id},
    {"name": "Declaration", "symbols": ["FunctionDeclaration"], "postprocess": id},
    {"name": "Declaration", "symbols": ["ClassDeclaration"], "postprocess": id},
    {"name": "Declaration", "symbols": ["ImportDeclaration"], "postprocess": id},
    {"name": "Declaration", "symbols": ["ExportDeclaration"], "postprocess": id},
    {"name": "VariableDeclaration$subexpression$1", "symbols": [{"literal":"let"}]},
    {"name": "VariableDeclaration$subexpression$1", "symbols": [{"literal":"const"}]},
    {"name": "VariableDeclaration$subexpression$1", "symbols": [{"literal":"var"}]},
    {"name": "VariableDeclaration", "symbols": ["VariableDeclaration$subexpression$1", "VariableDeclaratorList"], "postprocess": d => createNode('VariableDeclaration', { kind: d[0][0].value, declarations: d[1] })},
    {"name": "VariableDeclaratorList", "symbols": ["VariableDeclarator"], "postprocess": d => [d[0]]},
    {"name": "VariableDeclaratorList", "symbols": ["VariableDeclaratorList", {"literal":","}, "VariableDeclarator"], "postprocess": d => [...d[0], d[2]]},
    {"name": "VariableDeclarator$ebnf$1$subexpression$1", "symbols": [{"literal":"="}, "AssignmentExpression"]},
    {"name": "VariableDeclarator$ebnf$1", "symbols": ["VariableDeclarator$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "VariableDeclarator$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "VariableDeclarator", "symbols": ["BindingPattern", "VariableDeclarator$ebnf$1"], "postprocess":  d => createNode('VariableDeclarator', { 
          id: d[0], 
          init: d[1] ? d[1][1] : null 
        }) },
    {"name": "BindingPattern", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => createIdentifier(d[0].value)},
    {"name": "BindingPattern", "symbols": ["ArrayPattern"], "postprocess": id},
    {"name": "BindingPattern", "symbols": ["ObjectPattern"], "postprocess": id},
    {"name": "ArrayPattern", "symbols": [{"literal":"["}, "ArrayPatternElementList", {"literal":"]"}], "postprocess": d => createNode('ArrayPattern', { elements: d[1] })},
    {"name": "ArrayPatternElementList", "symbols": [], "postprocess": () => []},
    {"name": "ArrayPatternElementList", "symbols": ["ArrayPatternElement"], "postprocess": d => [d[0]]},
    {"name": "ArrayPatternElementList", "symbols": ["ArrayPatternElementList", {"literal":","}, "ArrayPatternElement"], "postprocess": d => [...d[0], d[2]]},
    {"name": "ArrayPatternElementList", "symbols": ["ArrayPatternElementList", {"literal":","}], "postprocess": d => [...d[0], null]},
    {"name": "ArrayPatternElement", "symbols": ["BindingPattern"], "postprocess": id},
    {"name": "ArrayPatternElement", "symbols": [{"literal":"..."}, "BindingPattern"], "postprocess": d => createNode('RestElement', { argument: d[1] })},
    {"name": "ObjectPattern", "symbols": [{"literal":"{"}, "ObjectPatternPropertyList", {"literal":"}"}], "postprocess": d => createNode('ObjectPattern', { properties: d[1] })},
    {"name": "ObjectPatternPropertyList", "symbols": [], "postprocess": () => []},
    {"name": "ObjectPatternPropertyList", "symbols": ["ObjectPatternProperty"], "postprocess": d => [d[0]]},
    {"name": "ObjectPatternPropertyList", "symbols": ["ObjectPatternPropertyList", {"literal":","}, "ObjectPatternProperty"], "postprocess": d => [...d[0], d[2]]},
    {"name": "ObjectPatternProperty", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess":  d => createNode('Property', { 
          key: createIdentifier(d[0].value), 
          value: createIdentifier(d[0].value), 
          shorthand: true 
        }) },
    {"name": "ObjectPatternProperty", "symbols": ["PropertyKey", {"literal":":"}, "BindingPattern"], "postprocess":  d => createNode('Property', { 
          key: d[0], 
          value: d[2], 
          shorthand: false 
        }) },
    {"name": "FunctionDeclaration$ebnf$1", "symbols": [{"literal":"async"}], "postprocess": id},
    {"name": "FunctionDeclaration$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "FunctionDeclaration", "symbols": ["FunctionDeclaration$ebnf$1", {"literal":"function"}, (lexer.has("identifier") ? {type: "identifier"} : identifier), {"literal":"("}, "ParameterList", {"literal":")"}, "Block"], "postprocess":  d => createNode('FunctionDeclaration', {
          async: !!d[0],
          id: createIdentifier(d[2].value),
          params: d[4],
          body: d[6]
        }) },
    {"name": "ParameterList", "symbols": [], "postprocess": () => []},
    {"name": "ParameterList", "symbols": ["Parameter"], "postprocess": d => [d[0]]},
    {"name": "ParameterList", "symbols": ["ParameterList", {"literal":","}, "Parameter"], "postprocess": d => [...d[0], d[2]]},
    {"name": "Parameter", "symbols": ["BindingPattern"], "postprocess": id},
    {"name": "Parameter", "symbols": ["BindingPattern", {"literal":"="}, "AssignmentExpression"], "postprocess": d => createNode('AssignmentPattern', { left: d[0], right: d[2] })},
    {"name": "Parameter", "symbols": [{"literal":"..."}, "BindingPattern"], "postprocess": d => createNode('RestElement', { argument: d[1] })},
    {"name": "ClassDeclaration$ebnf$1$subexpression$1", "symbols": [{"literal":"extends"}, (lexer.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "ClassDeclaration$ebnf$1", "symbols": ["ClassDeclaration$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "ClassDeclaration$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "ClassDeclaration", "symbols": [{"literal":"class"}, (lexer.has("identifier") ? {type: "identifier"} : identifier), "ClassDeclaration$ebnf$1", "ClassBody"], "postprocess":  d => createNode('ClassDeclaration', {
          id: createIdentifier(d[1].value),
          superClass: d[2] ? createIdentifier(d[2][1].value) : null,
          body: d[3]
        }) },
    {"name": "ClassBody", "symbols": [{"literal":"{"}, "ClassMemberListWithNewlines", {"literal":"}"}], "postprocess": d => createNode('ClassBody', { body: d[1] })},
    {"name": "ClassMemberListWithNewlines$ebnf$1", "symbols": []},
    {"name": "ClassMemberListWithNewlines$ebnf$1", "symbols": ["ClassMemberListWithNewlines$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ClassMemberListWithNewlines$ebnf$2", "symbols": ["ClassMemberNonEmpty"], "postprocess": id},
    {"name": "ClassMemberListWithNewlines$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "ClassMemberListWithNewlines$ebnf$3", "symbols": []},
    {"name": "ClassMemberListWithNewlines$ebnf$3", "symbols": ["ClassMemberListWithNewlines$ebnf$3", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ClassMemberListWithNewlines", "symbols": ["ClassMemberListWithNewlines$ebnf$1", "ClassMemberListWithNewlines$ebnf$2", "ClassMemberListWithNewlines$ebnf$3"], "postprocess": d => d[1] ? d[1] : []},
    {"name": "ClassMemberNonEmpty", "symbols": ["ClassMember"], "postprocess": d => [d[0]]},
    {"name": "ClassMemberNonEmpty$ebnf$1", "symbols": [(lexer.has("NL") ? {type: "NL"} : NL)]},
    {"name": "ClassMemberNonEmpty$ebnf$1", "symbols": ["ClassMemberNonEmpty$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ClassMemberNonEmpty", "symbols": ["ClassMember", "ClassMemberNonEmpty$ebnf$1", "ClassMemberNonEmpty"], "postprocess": d => [d[0], ...d[2]]},
    {"name": "ClassMember", "symbols": ["MethodDefinition"], "postprocess": id},
    {"name": "ClassMember", "symbols": ["PropertyDefinition"], "postprocess": id},
    {"name": "MethodDefinition$ebnf$1", "symbols": [{"literal":"async"}], "postprocess": id},
    {"name": "MethodDefinition$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "MethodDefinition", "symbols": ["MethodDefinition$ebnf$1", "PropertyKey", {"literal":"("}, "ParameterList", {"literal":")"}, "Block"], "postprocess":  d => createNode('MethodDefinition', {
          async: !!d[0],
          kind: 'method',
          key: d[1],
          params: d[3],
          body: d[5]
        }) },
    {"name": "MethodDefinition", "symbols": [{"literal":"constructor"}, {"literal":"("}, "ParameterList", {"literal":")"}, "Block"], "postprocess":  d => createNode('MethodDefinition', {
          kind: 'constructor',
          key: createIdentifier('constructor'),
          params: d[2],
          body: d[4]
        }) },
    {"name": "PropertyDefinition", "symbols": ["PropertyKey", {"literal":"="}, "AssignmentExpression"], "postprocess":  d => createNode('PropertyDefinition', {
          key: d[0],
          value: d[2]
        }) },
    {"name": "ImportDeclaration", "symbols": [{"literal":"import"}, {"literal":"{"}, "ImportsList", {"literal":"}"}, {"literal":"from"}, (lexer.has("string") ? {type: "string"} : string)], "postprocess":  d => createNode('ImportDeclaration', { 
          specifiers: d[2], 
          source: createLiteral(d[5].value, d[5].text) 
        }) },
    {"name": "ImportsList", "symbols": [], "postprocess": () => []},
    {"name": "ImportsList", "symbols": ["ImportSpecifier"], "postprocess": d => [d[0]]},
    {"name": "ImportsList", "symbols": ["ImportsList", {"literal":","}, "ImportSpecifier"], "postprocess": d => [...d[0], d[2]]},
    {"name": "ImportSpecifier$ebnf$1$subexpression$1", "symbols": [{"literal":"as"}, (lexer.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "ImportSpecifier$ebnf$1", "symbols": ["ImportSpecifier$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "ImportSpecifier$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "ImportSpecifier", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "ImportSpecifier$ebnf$1"], "postprocess":  d => createNode('ImportSpecifier', {
          imported: createIdentifier(d[0].value),
          local: createIdentifier(d[1] ? d[1][1].value : d[0].value)
        }) },
    {"name": "ExportDeclaration", "symbols": [{"literal":"export"}, "Declaration"], "postprocess": d => createNode('ExportNamedDeclaration', { declaration: d[1] })},
    {"name": "ExportDeclaration", "symbols": [{"literal":"export"}, {"literal":"{"}, "ExportsList", {"literal":"}"}], "postprocess":  d => createNode('ExportNamedDeclaration', { 
          specifiers: d[2],
          source: null
        }) },
    {"name": "ExportsList", "symbols": [], "postprocess": () => []},
    {"name": "ExportsList", "symbols": ["ExportSpecifier"], "postprocess": d => [d[0]]},
    {"name": "ExportsList", "symbols": ["ExportsList", {"literal":","}, "ExportSpecifier"], "postprocess": d => [...d[0], d[2]]},
    {"name": "ExportSpecifier$ebnf$1$subexpression$1", "symbols": [{"literal":"as"}, (lexer.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "ExportSpecifier$ebnf$1", "symbols": ["ExportSpecifier$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "ExportSpecifier$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "ExportSpecifier", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "ExportSpecifier$ebnf$1"], "postprocess":  d => createNode('ExportSpecifier', {
          local: createIdentifier(d[0].value),
          exported: createIdentifier(d[1] ? d[1][1].value : d[0].value)
        }) },
    {"name": "ControlStatement", "symbols": ["IfStatement"], "postprocess": id},
    {"name": "ControlStatement", "symbols": ["WhileStatement"], "postprocess": id},
    {"name": "ControlStatement", "symbols": ["DoWhileStatement"], "postprocess": id},
    {"name": "ControlStatement", "symbols": ["ForStatement"], "postprocess": id},
    {"name": "ControlStatement", "symbols": ["TryStatement"], "postprocess": id},
    {"name": "ControlStatement", "symbols": ["ThrowStatement"], "postprocess": id},
    {"name": "ControlStatement", "symbols": ["ReturnStatement"], "postprocess": id},
    {"name": "ControlStatement", "symbols": ["BreakStatement"], "postprocess": id},
    {"name": "ControlStatement", "symbols": ["ContinueStatement"], "postprocess": id},
    {"name": "IfStatement$ebnf$1$subexpression$1", "symbols": [{"literal":"else"}, "Statement"]},
    {"name": "IfStatement$ebnf$1", "symbols": ["IfStatement$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "IfStatement$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "IfStatement", "symbols": [{"literal":"if"}, {"literal":"("}, "Expression", {"literal":")"}, "Statement", "IfStatement$ebnf$1"], "postprocess":  d => createNode('IfStatement', {
          test: d[2],
          consequent: d[4],
          alternate: d[5] ? d[5][1] : null
        }) },
    {"name": "WhileStatement", "symbols": [{"literal":"while"}, {"literal":"("}, "Expression", {"literal":")"}, "Statement"], "postprocess": d => createNode('WhileStatement', { test: d[2], body: d[4] })},
    {"name": "DoWhileStatement", "symbols": [{"literal":"do"}, "Statement", {"literal":"while"}, {"literal":"("}, "Expression", {"literal":")"}], "postprocess": d => createNode('DoWhileStatement', { body: d[1], test: d[4] })},
    {"name": "ForStatement$subexpression$1", "symbols": ["VariableDeclaration"]},
    {"name": "ForStatement$subexpression$1", "symbols": ["Expression"]},
    {"name": "ForStatement$subexpression$1", "symbols": []},
    {"name": "ForStatement$subexpression$2", "symbols": ["Expression"]},
    {"name": "ForStatement$subexpression$2", "symbols": []},
    {"name": "ForStatement$subexpression$3", "symbols": ["Expression"]},
    {"name": "ForStatement$subexpression$3", "symbols": []},
    {"name": "ForStatement", "symbols": [{"literal":"for"}, {"literal":"("}, "ForStatement$subexpression$1", {"literal":";"}, "ForStatement$subexpression$2", {"literal":";"}, "ForStatement$subexpression$3", {"literal":")"}, "Statement"], "postprocess":  d => createNode('ForStatement', {
          init: d[2] ? d[2][0] : null,
          test: d[4] ? d[4][0] : null,
          update: d[6] ? d[6][0] : null,
          body: d[8]
        }) },
    {"name": "ForStatement$subexpression$4", "symbols": [{"literal":"let"}]},
    {"name": "ForStatement$subexpression$4", "symbols": [{"literal":"const"}]},
    {"name": "ForStatement$subexpression$4", "symbols": [{"literal":"var"}]},
    {"name": "ForStatement", "symbols": [{"literal":"for"}, {"literal":"("}, "ForStatement$subexpression$4", "BindingPattern", {"literal":"of"}, "Expression", {"literal":")"}, "Statement"], "postprocess":  d => createNode('ForOfStatement', {
          left: createNode('VariableDeclaration', { 
            kind: d[2][0].value, 
            declarations: [createNode('VariableDeclarator', { id: d[3], init: null })] 
          }),
          right: d[5],
          body: d[7]
        }) },
    {"name": "TryStatement", "symbols": [{"literal":"try"}, "Block", "CatchFinally"], "postprocess":  d => createNode('TryStatement', {
          block: d[1],
          handler: d[2].handler,
          finalizer: d[2].finalizer
        }) },
    {"name": "CatchFinally$ebnf$1$subexpression$1", "symbols": [{"literal":"("}, "BindingPattern", {"literal":")"}]},
    {"name": "CatchFinally$ebnf$1", "symbols": ["CatchFinally$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "CatchFinally$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "CatchFinally$ebnf$2$subexpression$1", "symbols": [{"literal":"finally"}, "Block"]},
    {"name": "CatchFinally$ebnf$2", "symbols": ["CatchFinally$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "CatchFinally$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "CatchFinally", "symbols": [{"literal":"catch"}, "CatchFinally$ebnf$1", "Block", "CatchFinally$ebnf$2"], "postprocess":  d => ({ 
          handler: createNode('CatchClause', {
            param: d[1] ? d[1][1] : null,
            body: d[2]
          }),
          finalizer: d[3] ? d[3][1] : null
        }) },
    {"name": "CatchFinally", "symbols": [{"literal":"finally"}, "Block"], "postprocess": d => ({ handler: null, finalizer: d[1] })},
    {"name": "ThrowStatement", "symbols": [{"literal":"throw"}, "Expression"], "postprocess": d => createNode('ThrowStatement', { argument: d[1] })},
    {"name": "ReturnStatement$ebnf$1", "symbols": ["Expression"], "postprocess": id},
    {"name": "ReturnStatement$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "ReturnStatement", "symbols": [{"literal":"return"}, "ReturnStatement$ebnf$1"], "postprocess": d => createNode('ReturnStatement', { argument: d[1] })},
    {"name": "BreakStatement$ebnf$1", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": id},
    {"name": "BreakStatement$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "BreakStatement", "symbols": [{"literal":"break"}, "BreakStatement$ebnf$1"], "postprocess": d => createNode('BreakStatement', { label: d[1] ? createIdentifier(d[1].value) : null })},
    {"name": "ContinueStatement$ebnf$1", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": id},
    {"name": "ContinueStatement$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "ContinueStatement", "symbols": [{"literal":"continue"}, "ContinueStatement$ebnf$1"], "postprocess": d => createNode('ContinueStatement', { label: d[1] ? createIdentifier(d[1].value) : null })},
    {"name": "ExpressionStatement", "symbols": ["Expression"], "postprocess": d => createNode('ExpressionStatement', { expression: d[0] })},
    {"name": "Expression", "symbols": ["PipelineExpression"], "postprocess": id},
    {"name": "PipelineExpression", "symbols": ["AssignmentExpression"], "postprocess": id},
    {"name": "PipelineExpression$ebnf$1", "symbols": []},
    {"name": "PipelineExpression$ebnf$1", "symbols": ["PipelineExpression$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "PipelineExpression$subexpression$1", "symbols": [{"literal":"|>"}]},
    {"name": "PipelineExpression$subexpression$1", "symbols": [{"literal":"->"}]},
    {"name": "PipelineExpression$ebnf$2", "symbols": []},
    {"name": "PipelineExpression$ebnf$2", "symbols": ["PipelineExpression$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "PipelineExpression", "symbols": ["PipelineExpression", "PipelineExpression$ebnf$1", "PipelineExpression$subexpression$1", "PipelineExpression$ebnf$2", "AssignmentExpression"], "postprocess": d => createPipeline(d[0], d[2][0].value, d[4])},
    {"name": "AssignmentExpression", "symbols": ["ConditionalExpression"], "postprocess": id},
    {"name": "AssignmentExpression", "symbols": ["ArrowFunction"], "postprocess": id},
    {"name": "AssignmentExpression", "symbols": ["LeftHandSideExpression", {"literal":"="}, "AssignmentExpression"], "postprocess":  d => createNode('AssignmentExpression', {
          operator: '=',
          left: d[0],
          right: d[2]
        }) },
    {"name": "ArrowFunction", "symbols": ["ArrowParameters", {"literal":"=>"}, "ArrowBody"], "postprocess":  d => createNode('ArrowFunctionExpression', {
          async: false,
          params: d[0],
          body: d[2]
        }) },
    {"name": "ArrowFunction", "symbols": [{"literal":"async"}, "ArrowParameters", {"literal":"=>"}, "ArrowBody"], "postprocess":  d => createNode('ArrowFunctionExpression', {
          async: true,
          params: d[1],
          body: d[3]
        }) },
    {"name": "ArrowParameters", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => [createIdentifier(d[0].value)]},
    {"name": "ArrowParameters", "symbols": [{"literal":"("}, "ParameterList", {"literal":")"}], "postprocess": d => d[1]},
    {"name": "ArrowBody", "symbols": ["Block"], "postprocess": id},
    {"name": "ArrowBody", "symbols": ["AssignmentExpression"], "postprocess": id},
    {"name": "ConditionalExpression", "symbols": ["LogicalOrExpression"], "postprocess": id},
    {"name": "LogicalOrExpression", "symbols": ["LogicalAndExpression"], "postprocess": id},
    {"name": "LogicalOrExpression$subexpression$1", "symbols": [{"literal":"||"}]},
    {"name": "LogicalOrExpression$subexpression$1", "symbols": [{"literal":"??"}]},
    {"name": "LogicalOrExpression", "symbols": ["LogicalOrExpression", "LogicalOrExpression$subexpression$1", "LogicalAndExpression"], "postprocess": d => createBinaryOp(d[0], d[1][0].value, d[2])},
    {"name": "LogicalAndExpression", "symbols": ["EqualityExpression"], "postprocess": id},
    {"name": "LogicalAndExpression", "symbols": ["LogicalAndExpression", {"literal":"&&"}, "EqualityExpression"], "postprocess": d => createBinaryOp(d[0], d[1].value, d[2])},
    {"name": "EqualityExpression", "symbols": ["RelationalExpression"], "postprocess": id},
    {"name": "EqualityExpression$subexpression$1", "symbols": [{"literal":"=="}]},
    {"name": "EqualityExpression$subexpression$1", "symbols": [{"literal":"!="}]},
    {"name": "EqualityExpression$subexpression$1", "symbols": [{"literal":"==="}]},
    {"name": "EqualityExpression$subexpression$1", "symbols": [{"literal":"!=="}]},
    {"name": "EqualityExpression", "symbols": ["EqualityExpression", "EqualityExpression$subexpression$1", "RelationalExpression"], "postprocess": d => createBinaryOp(d[0], d[1][0].value, d[2])},
    {"name": "RelationalExpression", "symbols": ["AdditiveExpression"], "postprocess": id},
    {"name": "RelationalExpression$subexpression$1", "symbols": [{"literal":"<"}]},
    {"name": "RelationalExpression$subexpression$1", "symbols": [{"literal":">"}]},
    {"name": "RelationalExpression$subexpression$1", "symbols": [{"literal":"<="}]},
    {"name": "RelationalExpression$subexpression$1", "symbols": [{"literal":">="}]},
    {"name": "RelationalExpression", "symbols": ["RelationalExpression", "RelationalExpression$subexpression$1", "AdditiveExpression"], "postprocess": d => createBinaryOp(d[0], d[1][0].value, d[2])},
    {"name": "RelationalExpression$subexpression$2", "symbols": [{"literal":"instanceof"}]},
    {"name": "RelationalExpression$subexpression$2", "symbols": [{"literal":"in"}]},
    {"name": "RelationalExpression", "symbols": ["RelationalExpression", "RelationalExpression$subexpression$2", "AdditiveExpression"], "postprocess": d => createBinaryOp(d[0], d[1][0].value, d[2])},
    {"name": "AdditiveExpression", "symbols": ["MultiplicativeExpression"], "postprocess": id},
    {"name": "AdditiveExpression$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "AdditiveExpression$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "AdditiveExpression", "symbols": ["AdditiveExpression", "AdditiveExpression$subexpression$1", "MultiplicativeExpression"], "postprocess": d => createBinaryOp(d[0], d[1][0].value, d[2])},
    {"name": "MultiplicativeExpression", "symbols": ["ExponentiationExpression"], "postprocess": id},
    {"name": "MultiplicativeExpression$subexpression$1", "symbols": [{"literal":"*"}]},
    {"name": "MultiplicativeExpression$subexpression$1", "symbols": [{"literal":"/"}]},
    {"name": "MultiplicativeExpression$subexpression$1", "symbols": [{"literal":"%"}]},
    {"name": "MultiplicativeExpression", "symbols": ["MultiplicativeExpression", "MultiplicativeExpression$subexpression$1", "ExponentiationExpression"], "postprocess": d => createBinaryOp(d[0], d[1][0].value, d[2])},
    {"name": "ExponentiationExpression", "symbols": ["UnaryExpression"], "postprocess": id},
    {"name": "ExponentiationExpression", "symbols": ["UnaryExpression", {"literal":"**"}, "ExponentiationExpression"], "postprocess": d => createBinaryOp(d[0], d[1].value, d[2])},
    {"name": "UnaryExpression", "symbols": ["PostfixExpression"], "postprocess": id},
    {"name": "UnaryExpression$subexpression$1", "symbols": [{"literal":"!"}]},
    {"name": "UnaryExpression$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "UnaryExpression$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "UnaryExpression$subexpression$1", "symbols": [{"literal":"~"}]},
    {"name": "UnaryExpression$subexpression$1", "symbols": [{"literal":"typeof"}]},
    {"name": "UnaryExpression$subexpression$1", "symbols": [{"literal":"await"}]},
    {"name": "UnaryExpression", "symbols": ["UnaryExpression$subexpression$1", "UnaryExpression"], "postprocess": d => createUnaryOp(d[0][0].value, d[1])},
    {"name": "PostfixExpression", "symbols": ["LeftHandSideExpression"], "postprocess": id},
    {"name": "LeftHandSideExpression", "symbols": ["CallExpression"], "postprocess": id},
    {"name": "LeftHandSideExpression", "symbols": ["NewExpression"], "postprocess": id},
    {"name": "CallExpression", "symbols": ["MemberExpression", "Arguments"], "postprocess": d => createNode('CallExpression', { callee: d[0], arguments: d[1] })},
    {"name": "CallExpression", "symbols": ["CallExpression", "Arguments"], "postprocess": d => createNode('CallExpression', { callee: d[0], arguments: d[1] })},
    {"name": "CallExpression", "symbols": ["CallExpression", {"literal":"["}, "Expression", {"literal":"]"}], "postprocess": d => createNode('MemberExpression', { object: d[0], property: d[2], computed: true })},
    {"name": "CallExpression$ebnf$1", "symbols": []},
    {"name": "CallExpression$ebnf$1", "symbols": ["CallExpression$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "CallExpression", "symbols": ["CallExpression", "CallExpression$ebnf$1", {"literal":"."}, (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => createNode('MemberExpression', { object: d[0], property: createIdentifier(d[3].value), computed: false })},
    {"name": "CallExpression$ebnf$2", "symbols": []},
    {"name": "CallExpression$ebnf$2", "symbols": ["CallExpression$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "CallExpression", "symbols": ["CallExpression", "CallExpression$ebnf$2", {"literal":"?."}, (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => createNode('MemberExpression', { object: d[0], property: createIdentifier(d[3].value), computed: false, optional: true })},
    {"name": "NewExpression$ebnf$1", "symbols": ["Arguments"], "postprocess": id},
    {"name": "NewExpression$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "NewExpression", "symbols": [{"literal":"new"}, "MemberExpression", "NewExpression$ebnf$1"], "postprocess": d => createNode('NewExpression', { callee: d[1], arguments: d[2] || [] })},
    {"name": "NewExpression", "symbols": ["MemberExpression"], "postprocess": id},
    {"name": "MemberExpression", "symbols": ["PrimaryExpression"], "postprocess": id},
    {"name": "MemberExpression", "symbols": ["MemberExpression", {"literal":"["}, "Expression", {"literal":"]"}], "postprocess": d => createNode('MemberExpression', { object: d[0], property: d[2], computed: true })},
    {"name": "MemberExpression$ebnf$1", "symbols": []},
    {"name": "MemberExpression$ebnf$1", "symbols": ["MemberExpression$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "MemberExpression", "symbols": ["MemberExpression", "MemberExpression$ebnf$1", {"literal":"."}, (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => createNode('MemberExpression', { object: d[0], property: createIdentifier(d[3].value), computed: false })},
    {"name": "MemberExpression$ebnf$2", "symbols": []},
    {"name": "MemberExpression$ebnf$2", "symbols": ["MemberExpression$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "MemberExpression", "symbols": ["MemberExpression", "MemberExpression$ebnf$2", {"literal":"?."}, (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => createNode('MemberExpression', { object: d[0], property: createIdentifier(d[3].value), computed: false, optional: true })},
    {"name": "Arguments", "symbols": [{"literal":"("}, "ArgumentList", {"literal":")"}], "postprocess": d => d[1]},
    {"name": "ArgumentList", "symbols": [], "postprocess": () => []},
    {"name": "ArgumentList", "symbols": ["AssignmentExpression"], "postprocess": d => [d[0]]},
    {"name": "ArgumentList", "symbols": ["ArgumentList", {"literal":","}, "AssignmentExpression"], "postprocess": d => [...d[0], d[2]]},
    {"name": "ArgumentList", "symbols": [{"literal":"..."}, "AssignmentExpression"], "postprocess": d => [createNode('SpreadElement', { argument: d[1] })]},
    {"name": "ArgumentList", "symbols": ["ArgumentList", {"literal":","}, {"literal":"..."}, "AssignmentExpression"], "postprocess": d => [...d[0], createNode('SpreadElement', { argument: d[3] })]},
    {"name": "PrimaryExpression", "symbols": [{"literal":"this"}], "postprocess": () => createNode('ThisExpression')},
    {"name": "PrimaryExpression", "symbols": [{"literal":"super"}], "postprocess": () => createNode('Super')},
    {"name": "PrimaryExpression", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => createIdentifier(d[0].value)},
    {"name": "PrimaryExpression", "symbols": ["Literal"], "postprocess": id},
    {"name": "PrimaryExpression", "symbols": ["ArrayLiteral"], "postprocess": id},
    {"name": "PrimaryExpression", "symbols": ["ObjectLiteral"], "postprocess": id},
    {"name": "PrimaryExpression", "symbols": ["FunctionExpression"], "postprocess": id},
    {"name": "PrimaryExpression", "symbols": ["TemplateLiteral"], "postprocess": id},
    {"name": "PrimaryExpression", "symbols": [{"literal":"("}, "Expression", {"literal":")"}], "postprocess": d => d[1]},
    {"name": "FunctionExpression", "symbols": [{"literal":"function"}, {"literal":"("}, "ParameterList", {"literal":")"}, "Block"], "postprocess":  d => createNode('FunctionExpression', {
          async: false,
          id: null,
          params: d[2],
          body: d[4]
        }) },
    {"name": "FunctionExpression", "symbols": [{"literal":"async"}, {"literal":"function"}, {"literal":"("}, "ParameterList", {"literal":")"}, "Block"], "postprocess":  d => createNode('FunctionExpression', {
          async: true,
          id: null,
          params: d[3],
          body: d[5]
        }) },
    {"name": "Literal", "symbols": [(lexer.has("number") ? {type: "number"} : number)], "postprocess": d => createLiteral(d[0].value, d[0].text)},
    {"name": "Literal", "symbols": [(lexer.has("string") ? {type: "string"} : string)], "postprocess": d => createLiteral(d[0].value, d[0].text)},
    {"name": "Literal", "symbols": [{"literal":"true"}], "postprocess": () => createLiteral(true, 'true')},
    {"name": "Literal", "symbols": [{"literal":"false"}], "postprocess": () => createLiteral(false, 'false')},
    {"name": "Literal", "symbols": [{"literal":"null"}], "postprocess": () => createLiteral(null, 'null')},
    {"name": "Literal", "symbols": [{"literal":"undefined"}], "postprocess": () => createLiteral(undefined, 'undefined')},
    {"name": "TemplateLiteral", "symbols": [(lexer.has("templateLiteral") ? {type: "templateLiteral"} : templateLiteral)], "postprocess":  d => createNode('TemplateLiteral', { 
          quasis: [createNode('TemplateElement', { value: { cooked: d[0].value, raw: d[0].value } })], 
          expressions: [] 
        }) },
    {"name": "ArrayLiteral$ebnf$1", "symbols": []},
    {"name": "ArrayLiteral$ebnf$1", "symbols": ["ArrayLiteral$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ArrayLiteral$ebnf$2", "symbols": []},
    {"name": "ArrayLiteral$ebnf$2", "symbols": ["ArrayLiteral$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ArrayLiteral", "symbols": [{"literal":"["}, "ArrayLiteral$ebnf$1", "ElementList", "ArrayLiteral$ebnf$2", {"literal":"]"}], "postprocess": d => createNode('ArrayExpression', { elements: d[2] })},
    {"name": "ElementList", "symbols": [], "postprocess": () => []},
    {"name": "ElementList", "symbols": ["Element"], "postprocess": d => [d[0]]},
    {"name": "ElementList$ebnf$1", "symbols": []},
    {"name": "ElementList$ebnf$1", "symbols": ["ElementList$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ElementList$ebnf$2", "symbols": []},
    {"name": "ElementList$ebnf$2", "symbols": ["ElementList$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ElementList", "symbols": ["ElementList", "ElementList$ebnf$1", {"literal":","}, "ElementList$ebnf$2", "Element"], "postprocess": d => [...d[0], d[4]]},
    {"name": "ElementList$ebnf$3", "symbols": []},
    {"name": "ElementList$ebnf$3", "symbols": ["ElementList$ebnf$3", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ElementList", "symbols": ["ElementList", "ElementList$ebnf$3", {"literal":","}], "postprocess": d => [...d[0], null]},
    {"name": "Element", "symbols": ["AssignmentExpression"], "postprocess": id},
    {"name": "Element", "symbols": [{"literal":"..."}, "AssignmentExpression"], "postprocess": d => createNode('SpreadElement', { argument: d[1] })},
    {"name": "ObjectLiteral$ebnf$1", "symbols": []},
    {"name": "ObjectLiteral$ebnf$1", "symbols": ["ObjectLiteral$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ObjectLiteral", "symbols": [{"literal":"{"}, "ObjectLiteral$ebnf$1", {"literal":"}"}], "postprocess": () => createNode('ObjectExpression', { properties: [] })},
    {"name": "ObjectLiteral$ebnf$2", "symbols": []},
    {"name": "ObjectLiteral$ebnf$2", "symbols": ["ObjectLiteral$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ObjectLiteral$ebnf$3", "symbols": []},
    {"name": "ObjectLiteral$ebnf$3", "symbols": ["ObjectLiteral$ebnf$3", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ObjectLiteral", "symbols": [{"literal":"{"}, "ObjectLiteral$ebnf$2", "PropertyDefinitionList", "ObjectLiteral$ebnf$3", {"literal":"}"}], "postprocess": d => createNode('ObjectExpression', { properties: d[2] })},
    {"name": "PropertyDefinitionList", "symbols": ["PropertyDef"], "postprocess": d => [d[0]]},
    {"name": "PropertyDefinitionList$ebnf$1", "symbols": []},
    {"name": "PropertyDefinitionList$ebnf$1", "symbols": ["PropertyDefinitionList$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "PropertyDefinitionList$ebnf$2", "symbols": []},
    {"name": "PropertyDefinitionList$ebnf$2", "symbols": ["PropertyDefinitionList$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "PropertyDefinitionList", "symbols": ["PropertyDefinitionList", "PropertyDefinitionList$ebnf$1", {"literal":","}, "PropertyDefinitionList$ebnf$2", "PropertyDef"], "postprocess": d => [...d[0], d[4]]},
    {"name": "PropertyDefinitionList$ebnf$3", "symbols": []},
    {"name": "PropertyDefinitionList$ebnf$3", "symbols": ["PropertyDefinitionList$ebnf$3", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "PropertyDefinitionList", "symbols": ["PropertyDefinitionList", "PropertyDefinitionList$ebnf$3", {"literal":","}], "postprocess": d => d[0]},
    {"name": "PropertyDef$ebnf$1", "symbols": []},
    {"name": "PropertyDef$ebnf$1", "symbols": ["PropertyDef$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "PropertyDef$ebnf$2", "symbols": []},
    {"name": "PropertyDef$ebnf$2", "symbols": ["PropertyDef$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "PropertyDef", "symbols": ["PropertyKey", "PropertyDef$ebnf$1", {"literal":":"}, "PropertyDef$ebnf$2", "AssignmentExpression"], "postprocess": d => createNode('Property', { key: d[0], value: d[4], shorthand: false })},
    {"name": "PropertyDef", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess":  d => createNode('Property', { 
          key: createIdentifier(d[0].value), 
          value: createIdentifier(d[0].value), 
          shorthand: true 
        }) },
    {"name": "PropertyDef", "symbols": [{"literal":"..."}, "AssignmentExpression"], "postprocess": d => createNode('SpreadElement', { argument: d[1] })},
    {"name": "PropertyKey", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => createIdentifier(d[0].value)},
    {"name": "PropertyKey", "symbols": [(lexer.has("string") ? {type: "string"} : string)], "postprocess": d => createLiteral(d[0].value, d[0].text)},
    {"name": "PropertyKey", "symbols": [(lexer.has("number") ? {type: "number"} : number)], "postprocess": d => createLiteral(d[0].value, d[0].text)},
    {"name": "PropertyKey", "symbols": [{"literal":"["}, "Expression", {"literal":"]"}], "postprocess": d => d[1]},
    {"name": "Block", "symbols": [{"literal":"{"}, "StatementList", {"literal":"}"}], "postprocess": d => createNode('BlockStatement', { body: d[1] })}
]
  , ParserStart: "Program"
}

// Export both nearley runtime and grammar for ES modules
export { nearley };
export { grammar };
export default grammar;