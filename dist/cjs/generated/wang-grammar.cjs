// Bundled Moo and Nearley Runtime
// This file is self-contained and requires no external dependencies

// Inline Moo (18.2KB)
const moo = (() => {
  const module = { exports: {} };
  const exports = module.exports;
  
  (function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory) /* global define */
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory()
  } else {
    root.moo = factory()
  }
}(this, function() {
  'use strict';

  var hasOwnProperty = Object.prototype.hasOwnProperty
  var toString = Object.prototype.toString
  var hasSticky = typeof new RegExp().sticky === 'boolean'

  /***************************************************************************/

  function isRegExp(o) { return o && toString.call(o) === '[object RegExp]' }
  function isObject(o) { return o && typeof o === 'object' && !isRegExp(o) && !Array.isArray(o) }

  function reEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
  }
  function reGroups(s) {
    var re = new RegExp('|' + s)
    return re.exec('').length - 1
  }
  function reCapture(s) {
    return '(' + s + ')'
  }
  function reUnion(regexps) {
    if (!regexps.length) return '(?!)'
    var source =  regexps.map(function(s) {
      return "(?:" + s + ")"
    }).join('|')
    return "(?:" + source + ")"
  }

  function regexpOrLiteral(obj) {
    if (typeof obj === 'string') {
      return '(?:' + reEscape(obj) + ')'

    } else if (isRegExp(obj)) {
      // TODO: consider /u support
      if (obj.ignoreCase) throw new Error('RegExp /i flag not allowed')
      if (obj.global) throw new Error('RegExp /g flag is implied')
      if (obj.sticky) throw new Error('RegExp /y flag is implied')
      if (obj.multiline) throw new Error('RegExp /m flag is implied')
      return obj.source

    } else {
      throw new Error('Not a pattern: ' + obj)
    }
  }

  function pad(s, length) {
    if (s.length > length) {
      return s
    }
    return Array(length - s.length + 1).join(" ") + s
  }

  function lastNLines(string, numLines) {
    var position = string.length
    var lineBreaks = 0;
    while (true) {
      var idx = string.lastIndexOf("\n", position - 1)
      if (idx === -1) {
        break;
      } else {
        lineBreaks++
      }
      position = idx
      if (lineBreaks === numLines) {
        break;
      }
      if (position === 0) {
        break;
      }
    }
    var startPosition = 
      lineBreaks < numLines ?
      0 : 
      position + 1
    return string.substring(startPosition).split("\n")
  }

  function objectToRules(object) {
    var keys = Object.getOwnPropertyNames(object)
    var result = []
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]
      var thing = object[key]
      var rules = [].concat(thing)
      if (key === 'include') {
        for (var j = 0; j < rules.length; j++) {
          result.push({include: rules[j]})
        }
        continue
      }
      var match = []
      rules.forEach(function(rule) {
        if (isObject(rule)) {
          if (match.length) result.push(ruleOptions(key, match))
          result.push(ruleOptions(key, rule))
          match = []
        } else {
          match.push(rule)
        }
      })
      if (match.length) result.push(ruleOptions(key, match))
    }
    return result
  }

  function arrayToRules(array) {
    var result = []
    for (var i = 0; i < array.length; i++) {
      var obj = array[i]
      if (obj.include) {
        var include = [].concat(obj.include)
        for (var j = 0; j < include.length; j++) {
          result.push({include: include[j]})
        }
        continue
      }
      if (!obj.type) {
        throw new Error('Rule has no type: ' + JSON.stringify(obj))
      }
      result.push(ruleOptions(obj.type, obj))
    }
    return result
  }

  function ruleOptions(type, obj) {
    if (!isObject(obj)) {
      obj = { match: obj }
    }
    if (obj.include) {
      throw new Error('Matching rules cannot also include states')
    }

    // nb. error and fallback imply lineBreaks
    var options = {
      defaultType: type,
      lineBreaks: !!obj.error || !!obj.fallback,
      pop: false,
      next: null,
      push: null,
      error: false,
      fallback: false,
      value: null,
      type: null,
      shouldThrow: false,
    }

    // Avoid Object.assign(), so we support IE9+
    for (var key in obj) {
      if (hasOwnProperty.call(obj, key)) {
        options[key] = obj[key]
      }
    }

    // type transform cannot be a string
    if (typeof options.type === 'string' && type !== options.type) {
      throw new Error("Type transform cannot be a string (type '" + options.type + "' for token '" + type + "')")
    }

    // convert to array
    var match = options.match
    options.match = Array.isArray(match) ? match : match ? [match] : []
    options.match.sort(function(a, b) {
      return isRegExp(a) && isRegExp(b) ? 0
           : isRegExp(b) ? -1 : isRegExp(a) ? +1 : b.length - a.length
    })
    return options
  }

  function toRules(spec) {
    return Array.isArray(spec) ? arrayToRules(spec) : objectToRules(spec)
  }

  var defaultErrorRule = ruleOptions('error', {lineBreaks: true, shouldThrow: true})
  function compileRules(rules, hasStates) {
    var errorRule = null
    var fast = Object.create(null)
    var fastAllowed = true
    var unicodeFlag = null
    var groups = []
    var parts = []

    // If there is a fallback rule, then disable fast matching
    for (var i = 0; i < rules.length; i++) {
      if (rules[i].fallback) {
        fastAllowed = false
      }
    }

    for (var i = 0; i < rules.length; i++) {
      var options = rules[i]

      if (options.include) {
        // all valid inclusions are removed by states() preprocessor
        throw new Error('Inheritance is not allowed in stateless lexers')
      }

      if (options.error || options.fallback) {
        // errorRule can only be set once
        if (errorRule) {
          if (!options.fallback === !errorRule.fallback) {
            throw new Error("Multiple " + (options.fallback ? "fallback" : "error") + " rules not allowed (for token '" + options.defaultType + "')")
          } else {
            throw new Error("fallback and error are mutually exclusive (for token '" + options.defaultType + "')")
          }
        }
        errorRule = options
      }

      var match = options.match.slice()
      if (fastAllowed) {
        while (match.length && typeof match[0] === 'string' && match[0].length === 1) {
          var word = match.shift()
          fast[word.charCodeAt(0)] = options
        }
      }

      // Warn about inappropriate state-switching options
      if (options.pop || options.push || options.next) {
        if (!hasStates) {
          throw new Error("State-switching options are not allowed in stateless lexers (for token '" + options.defaultType + "')")
        }
        if (options.fallback) {
          throw new Error("State-switching options are not allowed on fallback tokens (for token '" + options.defaultType + "')")
        }
      }

      // Only rules with a .match are included in the RegExp
      if (match.length === 0) {
        continue
      }
      fastAllowed = false

      groups.push(options)

      // Check unicode flag is used everywhere or nowhere
      for (var j = 0; j < match.length; j++) {
        var obj = match[j]
        if (!isRegExp(obj)) {
          continue
        }

        if (unicodeFlag === null) {
          unicodeFlag = obj.unicode
        } else if (unicodeFlag !== obj.unicode && options.fallback === false) {
          throw new Error('If one rule is /u then all must be')
        }
      }

      // convert to RegExp
      var pat = reUnion(match.map(regexpOrLiteral))

      // validate
      var regexp = new RegExp(pat)
      if (regexp.test("")) {
        throw new Error("RegExp matches empty string: " + regexp)
      }
      var groupCount = reGroups(pat)
      if (groupCount > 0) {
        throw new Error("RegExp has capture groups: " + regexp + "\nUse (?: … ) instead")
      }

      // try and detect rules matching newlines
      if (!options.lineBreaks && regexp.test('\n')) {
        throw new Error('Rule should declare lineBreaks: ' + regexp)
      }

      // store regex
      parts.push(reCapture(pat))
    }


    // If there's no fallback rule, use the sticky flag so we only look for
    // matches at the current index.
    //
    // If we don't support the sticky flag, then fake it using an irrefutable
    // match (i.e. an empty pattern).
    var fallbackRule = errorRule && errorRule.fallback
    var flags = hasSticky && !fallbackRule ? 'ym' : 'gm'
    var suffix = hasSticky || fallbackRule ? '' : '|'

    if (unicodeFlag === true) flags += "u"
    var combined = new RegExp(reUnion(parts) + suffix, flags)
    return {regexp: combined, groups: groups, fast: fast, error: errorRule || defaultErrorRule}
  }

  function compile(rules) {
    var result = compileRules(toRules(rules))
    return new Lexer({start: result}, 'start')
  }

  function checkStateGroup(g, name, map) {
    var state = g && (g.push || g.next)
    if (state && !map[state]) {
      throw new Error("Missing state '" + state + "' (in token '" + g.defaultType + "' of state '" + name + "')")
    }
    if (g && g.pop && +g.pop !== 1) {
      throw new Error("pop must be 1 (in token '" + g.defaultType + "' of state '" + name + "')")
    }
  }
  function compileStates(states, start) {
    var all = states.$all ? toRules(states.$all) : []
    delete states.$all

    var keys = Object.getOwnPropertyNames(states)
    if (!start) start = keys[0]

    var ruleMap = Object.create(null)
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]
      ruleMap[key] = toRules(states[key]).concat(all)
    }
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]
      var rules = ruleMap[key]
      var included = Object.create(null)
      for (var j = 0; j < rules.length; j++) {
        var rule = rules[j]
        if (!rule.include) continue
        var splice = [j, 1]
        if (rule.include !== key && !included[rule.include]) {
          included[rule.include] = true
          var newRules = ruleMap[rule.include]
          if (!newRules) {
            throw new Error("Cannot include nonexistent state '" + rule.include + "' (in state '" + key + "')")
          }
          for (var k = 0; k < newRules.length; k++) {
            var newRule = newRules[k]
            if (rules.indexOf(newRule) !== -1) continue
            splice.push(newRule)
          }
        }
        rules.splice.apply(rules, splice)
        j--
      }
    }

    var map = Object.create(null)
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]
      map[key] = compileRules(ruleMap[key], true)
    }

    for (var i = 0; i < keys.length; i++) {
      var name = keys[i]
      var state = map[name]
      var groups = state.groups
      for (var j = 0; j < groups.length; j++) {
        checkStateGroup(groups[j], name, map)
      }
      var fastKeys = Object.getOwnPropertyNames(state.fast)
      for (var j = 0; j < fastKeys.length; j++) {
        checkStateGroup(state.fast[fastKeys[j]], name, map)
      }
    }

    return new Lexer(map, start)
  }

  function keywordTransform(map) {

    // Use a JavaScript Map to map keywords to their corresponding token type
    // unless Map is unsupported, then fall back to using an Object:
    var isMap = typeof Map !== 'undefined'
    var reverseMap = isMap ? new Map : Object.create(null)

    var types = Object.getOwnPropertyNames(map)
    for (var i = 0; i < types.length; i++) {
      var tokenType = types[i]
      var item = map[tokenType]
      var keywordList = Array.isArray(item) ? item : [item]
      keywordList.forEach(function(keyword) {
        if (typeof keyword !== 'string') {
          throw new Error("keyword must be string (in keyword '" + tokenType + "')")
        }
        if (isMap) {
          reverseMap.set(keyword, tokenType)
        } else {
          reverseMap[keyword] = tokenType
        }
      })
    }
    return function(k) {
      return isMap ? reverseMap.get(k) : reverseMap[k]
    }
  }

  /***************************************************************************/

  var Lexer = function(states, state) {
    this.startState = state
    this.states = states
    this.buffer = ''
    this.stack = []
    this.reset()
  }

  Lexer.prototype.reset = function(data, info) {
    this.buffer = data || ''
    this.index = 0
    this.line = info ? info.line : 1
    this.col = info ? info.col : 1
    this.queuedToken = info ? info.queuedToken : null
    this.queuedText = info ? info.queuedText: "";
    this.queuedThrow = info ? info.queuedThrow : null
    this.setState(info ? info.state : this.startState)
    this.stack = info && info.stack ? info.stack.slice() : []
    return this
  }

  Lexer.prototype.save = function() {
    return {
      line: this.line,
      col: this.col,
      state: this.state,
      stack: this.stack.slice(),
      queuedToken: this.queuedToken,
      queuedText: this.queuedText,
      queuedThrow: this.queuedThrow,
    }
  }

  Lexer.prototype.setState = function(state) {
    if (!state || this.state === state) return
    this.state = state
    var info = this.states[state]
    this.groups = info.groups
    this.error = info.error
    this.re = info.regexp
    this.fast = info.fast
  }

  Lexer.prototype.popState = function() {
    this.setState(this.stack.pop())
  }

  Lexer.prototype.pushState = function(state) {
    this.stack.push(this.state)
    this.setState(state)
  }

  var eat = hasSticky ? function(re, buffer) { // assume re is /y
    return re.exec(buffer)
  } : function(re, buffer) { // assume re is /g
    var match = re.exec(buffer)
    // will always match, since we used the |(?:) trick
    if (match[0].length === 0) {
      return null
    }
    return match
  }

  Lexer.prototype._getGroup = function(match) {
    var groupCount = this.groups.length
    for (var i = 0; i < groupCount; i++) {
      if (match[i + 1] !== undefined) {
        return this.groups[i]
      }
    }
    throw new Error('Cannot find token type for matched text')
  }

  function tokenToString() {
    return this.value
  }

  Lexer.prototype.next = function() {
    var index = this.index

    // If a fallback token matched, we don't need to re-run the RegExp
    if (this.queuedGroup) {
      var token = this._token(this.queuedGroup, this.queuedText, index)
      this.queuedGroup = null
      this.queuedText = ""
      return token
    }

    var buffer = this.buffer
    if (index === buffer.length) {
      return // EOF
    }

    // Fast matching for single characters
    var group = this.fast[buffer.charCodeAt(index)]
    if (group) {
      return this._token(group, buffer.charAt(index), index)
    }

    // Execute RegExp
    var re = this.re
    re.lastIndex = index
    var match = eat(re, buffer)

    // Error tokens match the remaining buffer
    var error = this.error
    if (match == null) {
      return this._token(error, buffer.slice(index, buffer.length), index)
    }

    var group = this._getGroup(match)
    var text = match[0]

    if (error.fallback && match.index !== index) {
      this.queuedGroup = group
      this.queuedText = text

      // Fallback tokens contain the unmatched portion of the buffer
      return this._token(error, buffer.slice(index, match.index), index)
    }

    return this._token(group, text, index)
  }

  Lexer.prototype._token = function(group, text, offset) {
    // count line breaks
    var lineBreaks = 0
    if (group.lineBreaks) {
      var matchNL = /\n/g
      var nl = 1
      if (text === '\n') {
        lineBreaks = 1
      } else {
        while (matchNL.exec(text)) { lineBreaks++; nl = matchNL.lastIndex }
      }
    }

    var token = {
      type: (typeof group.type === 'function' && group.type(text)) || group.defaultType,
      value: typeof group.value === 'function' ? group.value(text) : text,
      text: text,
      toString: tokenToString,
      offset: offset,
      lineBreaks: lineBreaks,
      line: this.line,
      col: this.col,
    }
    // nb. adding more props to token object will make V8 sad!

    var size = text.length
    this.index += size
    this.line += lineBreaks
    if (lineBreaks !== 0) {
      this.col = size - nl + 1
    } else {
      this.col += size
    }

    // throw, if no rule with {error: true}
    if (group.shouldThrow) {
      var err = new Error(this.formatError(token, "invalid syntax"))
      throw err;
    }

    if (group.pop) this.popState()
    else if (group.push) this.pushState(group.push)
    else if (group.next) this.setState(group.next)

    return token
  }

  if (typeof Symbol !== 'undefined' && Symbol.iterator) {
    var LexerIterator = function(lexer) {
      this.lexer = lexer
    }

    LexerIterator.prototype.next = function() {
      var token = this.lexer.next()
      return {value: token, done: !token}
    }

    LexerIterator.prototype[Symbol.iterator] = function() {
      return this
    }

    Lexer.prototype[Symbol.iterator] = function() {
      return new LexerIterator(this)
    }
  }

  Lexer.prototype.formatError = function(token, message) {
    if (token == null) {
      // An undefined token indicates EOF
      var text = this.buffer.slice(this.index)
      var token = {
        text: text,
        offset: this.index,
        lineBreaks: text.indexOf('\n') === -1 ? 0 : 1,
        line: this.line,
        col: this.col,
      }
    }
    
    var numLinesAround = 2
    var firstDisplayedLine = Math.max(token.line - numLinesAround, 1)
    var lastDisplayedLine = token.line + numLinesAround
    var lastLineDigits = String(lastDisplayedLine).length
    var displayedLines = lastNLines(
        this.buffer, 
        (this.line - token.line) + numLinesAround + 1
      )
      .slice(0, 5)
    var errorLines = []
    errorLines.push(message + " at line " + token.line + " col " + token.col + ":")
    errorLines.push("")
    for (var i = 0; i < displayedLines.length; i++) {
      var line = displayedLines[i]
      var lineNo = firstDisplayedLine + i
      errorLines.push(pad(String(lineNo), lastLineDigits) + "  " + line);
      if (lineNo === token.line) {
        errorLines.push(pad("", lastLineDigits + token.col + 1) + "^")
      }
    }
    return errorLines.join("\n")
  }

  Lexer.prototype.clone = function() {
    return new Lexer(this.states, this.state)
  }

  Lexer.prototype.has = function(tokenType) {
    return true
  }


  return {
    compile: compile,
    states: compileStates,
    error: Object.freeze({error: true}),
    fallback: Object.freeze({fallback: true}),
    keywords: keywordTransform,
  }

}));

  
  return module.exports;
})();

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

// Original Generated Grammar (with require statements removed)
// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley

function id(x) { return x[0]; }

// moo is already bundled above

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

var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "Program", "symbols": ["StatementList"], "postprocess": d => createNode('Program', { body: d[0] })},
    {"name": "StatementList", "symbols": [], "postprocess": () => []},
    {"name": "StatementList", "symbols": ["Statement"], "postprocess": d => [d[0]]},
    {"name": "StatementList", "symbols": ["StatementList", "StatementTerminator", "Statement"], "postprocess": d => [...d[0], d[2]]},
    {"name": "StatementList", "symbols": ["StatementList", "StatementTerminator"], "postprocess": d => d[0]},
    {"name": "StatementTerminator", "symbols": [(lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": id},
    {"name": "StatementTerminator", "symbols": [{"literal":";"}], "postprocess": id},
    {"name": "Statement", "symbols": ["Declaration"], "postprocess": id},
    {"name": "Statement", "symbols": ["LabeledStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["ControlStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["ExpressionStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["Block"], "postprocess": id},
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
    {"name": "BindingPattern", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => createIdentifier(d[0].value, d[0])},
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
    {"name": "FunctionDeclaration$ebnf$2", "symbols": []},
    {"name": "FunctionDeclaration$ebnf$2", "symbols": ["FunctionDeclaration$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "FunctionDeclaration$ebnf$3", "symbols": []},
    {"name": "FunctionDeclaration$ebnf$3", "symbols": ["FunctionDeclaration$ebnf$3", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "FunctionDeclaration", "symbols": ["FunctionDeclaration$ebnf$1", {"literal":"function"}, (lexer.has("identifier") ? {type: "identifier"} : identifier), {"literal":"("}, "FunctionDeclaration$ebnf$2", "ParameterList", "FunctionDeclaration$ebnf$3", {"literal":")"}, "Block"], "postprocess":  d => createNode('FunctionDeclaration', {
          async: !!d[0],
          id: createIdentifier(d[2].value),
          params: d[5],
          body: d[8]
        }) },
    {"name": "ParameterList", "symbols": [], "postprocess": () => []},
    {"name": "ParameterList", "symbols": ["Parameter"], "postprocess": d => [d[0]]},
    {"name": "ParameterList$ebnf$1", "symbols": []},
    {"name": "ParameterList$ebnf$1", "symbols": ["ParameterList$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ParameterList$ebnf$2", "symbols": []},
    {"name": "ParameterList$ebnf$2", "symbols": ["ParameterList$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ParameterList", "symbols": ["ParameterList", "ParameterList$ebnf$1", {"literal":","}, "ParameterList$ebnf$2", "Parameter"], "postprocess": d => [...d[0], d[4]]},
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
    {"name": "MethodDefinition$ebnf$2", "symbols": []},
    {"name": "MethodDefinition$ebnf$2", "symbols": ["MethodDefinition$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "MethodDefinition$ebnf$3", "symbols": []},
    {"name": "MethodDefinition$ebnf$3", "symbols": ["MethodDefinition$ebnf$3", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "MethodDefinition", "symbols": ["MethodDefinition$ebnf$1", "PropertyKey", {"literal":"("}, "MethodDefinition$ebnf$2", "ParameterList", "MethodDefinition$ebnf$3", {"literal":")"}, "Block"], "postprocess":  d => createNode('MethodDefinition', {
          async: !!d[0],
          kind: 'method',
          key: d[1],
          params: d[4],
          body: d[7]
        }) },
    {"name": "MethodDefinition$ebnf$4", "symbols": []},
    {"name": "MethodDefinition$ebnf$4", "symbols": ["MethodDefinition$ebnf$4", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "MethodDefinition$ebnf$5", "symbols": []},
    {"name": "MethodDefinition$ebnf$5", "symbols": ["MethodDefinition$ebnf$5", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "MethodDefinition", "symbols": [{"literal":"constructor"}, {"literal":"("}, "MethodDefinition$ebnf$4", "ParameterList", "MethodDefinition$ebnf$5", {"literal":")"}, "Block"], "postprocess":  d => createNode('MethodDefinition', {
          kind: 'constructor',
          key: createIdentifier('constructor'),
          params: d[3],
          body: d[6]
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
    {"name": "IfStatement$ebnf$1", "symbols": []},
    {"name": "IfStatement$ebnf$1", "symbols": ["IfStatement$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "IfStatement$ebnf$2", "symbols": []},
    {"name": "IfStatement$ebnf$2", "symbols": ["IfStatement$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "IfStatement$ebnf$3$subexpression$1", "symbols": [{"literal":"else"}, "Statement"]},
    {"name": "IfStatement$ebnf$3", "symbols": ["IfStatement$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "IfStatement$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "IfStatement", "symbols": [{"literal":"if"}, {"literal":"("}, "IfStatement$ebnf$1", "Expression", "IfStatement$ebnf$2", {"literal":")"}, "Statement", "IfStatement$ebnf$3"], "postprocess":  d => createNode('IfStatement', {
          test: d[3],
          consequent: d[6],
          alternate: d[7] ? d[7][1] : null
        }) },
    {"name": "WhileStatement$ebnf$1", "symbols": []},
    {"name": "WhileStatement$ebnf$1", "symbols": ["WhileStatement$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "WhileStatement$ebnf$2", "symbols": []},
    {"name": "WhileStatement$ebnf$2", "symbols": ["WhileStatement$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "WhileStatement", "symbols": [{"literal":"while"}, {"literal":"("}, "WhileStatement$ebnf$1", "Expression", "WhileStatement$ebnf$2", {"literal":")"}, "Statement"], "postprocess": d => createNode('WhileStatement', { test: d[3], body: d[6] })},
    {"name": "DoWhileStatement$ebnf$1", "symbols": []},
    {"name": "DoWhileStatement$ebnf$1", "symbols": ["DoWhileStatement$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "DoWhileStatement$ebnf$2", "symbols": []},
    {"name": "DoWhileStatement$ebnf$2", "symbols": ["DoWhileStatement$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "DoWhileStatement", "symbols": [{"literal":"do"}, "Statement", {"literal":"while"}, {"literal":"("}, "DoWhileStatement$ebnf$1", "Expression", "DoWhileStatement$ebnf$2", {"literal":")"}], "postprocess": d => createNode('DoWhileStatement', { body: d[1], test: d[5] })},
    {"name": "ForStatement$ebnf$1", "symbols": []},
    {"name": "ForStatement$ebnf$1", "symbols": ["ForStatement$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ForStatement$subexpression$1", "symbols": ["VariableDeclaration"]},
    {"name": "ForStatement$subexpression$1", "symbols": ["Expression"]},
    {"name": "ForStatement$subexpression$1", "symbols": []},
    {"name": "ForStatement$ebnf$2", "symbols": []},
    {"name": "ForStatement$ebnf$2", "symbols": ["ForStatement$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ForStatement$ebnf$3", "symbols": []},
    {"name": "ForStatement$ebnf$3", "symbols": ["ForStatement$ebnf$3", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ForStatement$subexpression$2", "symbols": ["Expression"]},
    {"name": "ForStatement$subexpression$2", "symbols": []},
    {"name": "ForStatement$ebnf$4", "symbols": []},
    {"name": "ForStatement$ebnf$4", "symbols": ["ForStatement$ebnf$4", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ForStatement$ebnf$5", "symbols": []},
    {"name": "ForStatement$ebnf$5", "symbols": ["ForStatement$ebnf$5", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ForStatement$subexpression$3", "symbols": ["Expression"]},
    {"name": "ForStatement$subexpression$3", "symbols": []},
    {"name": "ForStatement$ebnf$6", "symbols": []},
    {"name": "ForStatement$ebnf$6", "symbols": ["ForStatement$ebnf$6", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ForStatement", "symbols": [{"literal":"for"}, {"literal":"("}, "ForStatement$ebnf$1", "ForStatement$subexpression$1", "ForStatement$ebnf$2", {"literal":";"}, "ForStatement$ebnf$3", "ForStatement$subexpression$2", "ForStatement$ebnf$4", {"literal":";"}, "ForStatement$ebnf$5", "ForStatement$subexpression$3", "ForStatement$ebnf$6", {"literal":")"}, "Statement"], "postprocess":  d => createNode('ForStatement', {
          init: d[3] ? d[3][0] : null,
          test: d[7] ? d[7][0] : null,
          update: d[11] ? d[11][0] : null,
          body: d[14]
        }) },
    {"name": "ForStatement$ebnf$7", "symbols": []},
    {"name": "ForStatement$ebnf$7", "symbols": ["ForStatement$ebnf$7", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ForStatement$subexpression$4", "symbols": [{"literal":"let"}]},
    {"name": "ForStatement$subexpression$4", "symbols": [{"literal":"const"}]},
    {"name": "ForStatement$subexpression$4", "symbols": [{"literal":"var"}]},
    {"name": "ForStatement$ebnf$8", "symbols": []},
    {"name": "ForStatement$ebnf$8", "symbols": ["ForStatement$ebnf$8", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ForStatement$ebnf$9", "symbols": []},
    {"name": "ForStatement$ebnf$9", "symbols": ["ForStatement$ebnf$9", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ForStatement$ebnf$10", "symbols": []},
    {"name": "ForStatement$ebnf$10", "symbols": ["ForStatement$ebnf$10", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ForStatement", "symbols": [{"literal":"for"}, {"literal":"("}, "ForStatement$ebnf$7", "ForStatement$subexpression$4", "BindingPattern", "ForStatement$ebnf$8", {"literal":"of"}, "ForStatement$ebnf$9", "Expression", "ForStatement$ebnf$10", {"literal":")"}, "Statement"], "postprocess":  d => createNode('ForOfStatement', {
          left: createNode('VariableDeclaration', { 
            kind: d[3][0].value, 
            declarations: [createNode('VariableDeclarator', { id: d[4], init: null })] 
          }),
          right: d[8],
          body: d[11]
        }) },
    {"name": "ForStatement$ebnf$11", "symbols": []},
    {"name": "ForStatement$ebnf$11", "symbols": ["ForStatement$ebnf$11", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ForStatement$subexpression$5", "symbols": [{"literal":"let"}]},
    {"name": "ForStatement$subexpression$5", "symbols": [{"literal":"const"}]},
    {"name": "ForStatement$subexpression$5", "symbols": [{"literal":"var"}]},
    {"name": "ForStatement$ebnf$12", "symbols": []},
    {"name": "ForStatement$ebnf$12", "symbols": ["ForStatement$ebnf$12", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ForStatement$ebnf$13", "symbols": []},
    {"name": "ForStatement$ebnf$13", "symbols": ["ForStatement$ebnf$13", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ForStatement$ebnf$14", "symbols": []},
    {"name": "ForStatement$ebnf$14", "symbols": ["ForStatement$ebnf$14", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ForStatement", "symbols": [{"literal":"for"}, {"literal":"("}, "ForStatement$ebnf$11", "ForStatement$subexpression$5", "BindingPattern", "ForStatement$ebnf$12", {"literal":"in"}, "ForStatement$ebnf$13", "Expression", "ForStatement$ebnf$14", {"literal":")"}, "Statement"], "postprocess":  d => createNode('ForInStatement', {
          left: createNode('VariableDeclaration', { 
            kind: d[3][0].value, 
            declarations: [createNode('VariableDeclarator', { id: d[4], init: null })] 
          }),
          right: d[8],
          body: d[11]
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
    {"name": "Expression", "symbols": ["AssignmentExpression"], "postprocess": id},
    {"name": "AssignmentExpression", "symbols": ["ConditionalExpression"], "postprocess": id},
    {"name": "AssignmentExpression", "symbols": ["ArrowFunction"], "postprocess": id},
    {"name": "AssignmentExpression", "symbols": ["LeftHandSideExpression", "AssignmentOperator", "AssignmentExpression"], "postprocess":  d => createNode('AssignmentExpression', {
          operator: d[1],
          left: d[0],
          right: d[2]
        }) },
    {"name": "AssignmentOperator", "symbols": [{"literal":"="}], "postprocess": d => d[0].value},
    {"name": "AssignmentOperator", "symbols": [{"literal":"+="}], "postprocess": d => d[0].value},
    {"name": "AssignmentOperator", "symbols": [{"literal":"-="}], "postprocess": d => d[0].value},
    {"name": "AssignmentOperator", "symbols": [{"literal":"*="}], "postprocess": d => d[0].value},
    {"name": "AssignmentOperator", "symbols": [{"literal":"/="}], "postprocess": d => d[0].value},
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
    {"name": "ArrowParameters", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => [createIdentifier(d[0].value, d[0])]},
    {"name": "ArrowParameters$ebnf$1", "symbols": []},
    {"name": "ArrowParameters$ebnf$1", "symbols": ["ArrowParameters$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ArrowParameters$ebnf$2", "symbols": []},
    {"name": "ArrowParameters$ebnf$2", "symbols": ["ArrowParameters$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ArrowParameters", "symbols": [{"literal":"("}, "ArrowParameters$ebnf$1", "ParameterList", "ArrowParameters$ebnf$2", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "ArrowBody", "symbols": ["Block"], "postprocess": id},
    {"name": "ArrowBody", "symbols": ["AssignmentExpression"], "postprocess": id},
    {"name": "ConditionalExpression", "symbols": ["LogicalOrExpression"], "postprocess": id},
    {"name": "ConditionalExpression$ebnf$1", "symbols": []},
    {"name": "ConditionalExpression$ebnf$1", "symbols": ["ConditionalExpression$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ConditionalExpression$ebnf$2", "symbols": []},
    {"name": "ConditionalExpression$ebnf$2", "symbols": ["ConditionalExpression$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ConditionalExpression$ebnf$3", "symbols": []},
    {"name": "ConditionalExpression$ebnf$3", "symbols": ["ConditionalExpression$ebnf$3", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ConditionalExpression$ebnf$4", "symbols": []},
    {"name": "ConditionalExpression$ebnf$4", "symbols": ["ConditionalExpression$ebnf$4", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ConditionalExpression", "symbols": ["LogicalOrExpression", "ConditionalExpression$ebnf$1", {"literal":"?"}, "ConditionalExpression$ebnf$2", "AssignmentExpression", "ConditionalExpression$ebnf$3", {"literal":":"}, "ConditionalExpression$ebnf$4", "AssignmentExpression"], "postprocess":  d => createNode('ConditionalExpression', {
          test: d[0],
          consequent: d[4],
          alternate: d[8]
        }) },
    {"name": "LogicalOrExpression", "symbols": ["LogicalAndExpression"], "postprocess": id},
    {"name": "LogicalOrExpression$ebnf$1", "symbols": []},
    {"name": "LogicalOrExpression$ebnf$1", "symbols": ["LogicalOrExpression$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "LogicalOrExpression$subexpression$1", "symbols": [{"literal":"||"}]},
    {"name": "LogicalOrExpression$subexpression$1", "symbols": [{"literal":"??"}]},
    {"name": "LogicalOrExpression$ebnf$2", "symbols": []},
    {"name": "LogicalOrExpression$ebnf$2", "symbols": ["LogicalOrExpression$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "LogicalOrExpression", "symbols": ["LogicalOrExpression", "LogicalOrExpression$ebnf$1", "LogicalOrExpression$subexpression$1", "LogicalOrExpression$ebnf$2", "LogicalAndExpression"], "postprocess": d => createBinaryOp(d[0], d[2][0].value, d[4])},
    {"name": "LogicalAndExpression", "symbols": ["EqualityExpression"], "postprocess": id},
    {"name": "LogicalAndExpression$ebnf$1", "symbols": []},
    {"name": "LogicalAndExpression$ebnf$1", "symbols": ["LogicalAndExpression$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "LogicalAndExpression$ebnf$2", "symbols": []},
    {"name": "LogicalAndExpression$ebnf$2", "symbols": ["LogicalAndExpression$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "LogicalAndExpression", "symbols": ["LogicalAndExpression", "LogicalAndExpression$ebnf$1", {"literal":"&&"}, "LogicalAndExpression$ebnf$2", "EqualityExpression"], "postprocess": d => createBinaryOp(d[0], d[2].value, d[4])},
    {"name": "EqualityExpression", "symbols": ["RelationalExpression"], "postprocess": id},
    {"name": "EqualityExpression$ebnf$1", "symbols": []},
    {"name": "EqualityExpression$ebnf$1", "symbols": ["EqualityExpression$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "EqualityExpression$subexpression$1", "symbols": [{"literal":"=="}]},
    {"name": "EqualityExpression$subexpression$1", "symbols": [{"literal":"!="}]},
    {"name": "EqualityExpression$subexpression$1", "symbols": [{"literal":"==="}]},
    {"name": "EqualityExpression$subexpression$1", "symbols": [{"literal":"!=="}]},
    {"name": "EqualityExpression$ebnf$2", "symbols": []},
    {"name": "EqualityExpression$ebnf$2", "symbols": ["EqualityExpression$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "EqualityExpression", "symbols": ["EqualityExpression", "EqualityExpression$ebnf$1", "EqualityExpression$subexpression$1", "EqualityExpression$ebnf$2", "RelationalExpression"], "postprocess": d => createBinaryOp(d[0], d[2][0].value, d[4])},
    {"name": "RelationalExpression", "symbols": ["AdditiveExpression"], "postprocess": id},
    {"name": "RelationalExpression$ebnf$1", "symbols": []},
    {"name": "RelationalExpression$ebnf$1", "symbols": ["RelationalExpression$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "RelationalExpression$subexpression$1", "symbols": [{"literal":"<"}]},
    {"name": "RelationalExpression$subexpression$1", "symbols": [{"literal":">"}]},
    {"name": "RelationalExpression$subexpression$1", "symbols": [{"literal":"<="}]},
    {"name": "RelationalExpression$subexpression$1", "symbols": [{"literal":">="}]},
    {"name": "RelationalExpression$ebnf$2", "symbols": []},
    {"name": "RelationalExpression$ebnf$2", "symbols": ["RelationalExpression$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "RelationalExpression", "symbols": ["RelationalExpression", "RelationalExpression$ebnf$1", "RelationalExpression$subexpression$1", "RelationalExpression$ebnf$2", "AdditiveExpression"], "postprocess": d => createBinaryOp(d[0], d[2][0].value, d[4])},
    {"name": "RelationalExpression$ebnf$3", "symbols": []},
    {"name": "RelationalExpression$ebnf$3", "symbols": ["RelationalExpression$ebnf$3", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "RelationalExpression$subexpression$2", "symbols": [{"literal":"instanceof"}]},
    {"name": "RelationalExpression$subexpression$2", "symbols": [{"literal":"in"}]},
    {"name": "RelationalExpression$ebnf$4", "symbols": []},
    {"name": "RelationalExpression$ebnf$4", "symbols": ["RelationalExpression$ebnf$4", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "RelationalExpression", "symbols": ["RelationalExpression", "RelationalExpression$ebnf$3", "RelationalExpression$subexpression$2", "RelationalExpression$ebnf$4", "AdditiveExpression"], "postprocess": d => createBinaryOp(d[0], d[2][0].value, d[4])},
    {"name": "AdditiveExpression", "symbols": ["MultiplicativeExpression"], "postprocess": id},
    {"name": "AdditiveExpression$ebnf$1", "symbols": []},
    {"name": "AdditiveExpression$ebnf$1", "symbols": ["AdditiveExpression$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "AdditiveExpression$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "AdditiveExpression$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "AdditiveExpression$ebnf$2", "symbols": []},
    {"name": "AdditiveExpression$ebnf$2", "symbols": ["AdditiveExpression$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "AdditiveExpression", "symbols": ["AdditiveExpression", "AdditiveExpression$ebnf$1", "AdditiveExpression$subexpression$1", "AdditiveExpression$ebnf$2", "MultiplicativeExpression"], "postprocess": d => createBinaryOp(d[0], d[2][0].value, d[4])},
    {"name": "MultiplicativeExpression", "symbols": ["ExponentiationExpression"], "postprocess": id},
    {"name": "MultiplicativeExpression$ebnf$1", "symbols": []},
    {"name": "MultiplicativeExpression$ebnf$1", "symbols": ["MultiplicativeExpression$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "MultiplicativeExpression$subexpression$1", "symbols": [{"literal":"*"}]},
    {"name": "MultiplicativeExpression$subexpression$1", "symbols": [{"literal":"/"}]},
    {"name": "MultiplicativeExpression$subexpression$1", "symbols": [{"literal":"%"}]},
    {"name": "MultiplicativeExpression$ebnf$2", "symbols": []},
    {"name": "MultiplicativeExpression$ebnf$2", "symbols": ["MultiplicativeExpression$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "MultiplicativeExpression", "symbols": ["MultiplicativeExpression", "MultiplicativeExpression$ebnf$1", "MultiplicativeExpression$subexpression$1", "MultiplicativeExpression$ebnf$2", "ExponentiationExpression"], "postprocess": d => createBinaryOp(d[0], d[2][0].value, d[4])},
    {"name": "ExponentiationExpression", "symbols": ["UnaryExpression"], "postprocess": id},
    {"name": "ExponentiationExpression$ebnf$1", "symbols": []},
    {"name": "ExponentiationExpression$ebnf$1", "symbols": ["ExponentiationExpression$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ExponentiationExpression$ebnf$2", "symbols": []},
    {"name": "ExponentiationExpression$ebnf$2", "symbols": ["ExponentiationExpression$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ExponentiationExpression", "symbols": ["UnaryExpression", "ExponentiationExpression$ebnf$1", {"literal":"**"}, "ExponentiationExpression$ebnf$2", "ExponentiationExpression"], "postprocess": d => createBinaryOp(d[0], d[2].value, d[4])},
    {"name": "UnaryExpression", "symbols": ["PostfixExpression"], "postprocess": id},
    {"name": "UnaryExpression$subexpression$1", "symbols": [{"literal":"!"}]},
    {"name": "UnaryExpression$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "UnaryExpression$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "UnaryExpression$subexpression$1", "symbols": [{"literal":"~"}]},
    {"name": "UnaryExpression$subexpression$1", "symbols": [{"literal":"typeof"}]},
    {"name": "UnaryExpression$subexpression$1", "symbols": [{"literal":"await"}]},
    {"name": "UnaryExpression", "symbols": ["UnaryExpression$subexpression$1", "UnaryExpression"], "postprocess": d => createUnaryOp(d[0][0].value, d[1])},
    {"name": "UnaryExpression$subexpression$2", "symbols": [{"literal":"++"}]},
    {"name": "UnaryExpression$subexpression$2", "symbols": [{"literal":"--"}]},
    {"name": "UnaryExpression", "symbols": ["UnaryExpression$subexpression$2", "UnaryExpression"], "postprocess":  d => createNode('UpdateExpression', {
          operator: d[0][0].value,
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
    {"name": "CallExpression", "symbols": ["MemberExpression", "Arguments"], "postprocess": d => createNode('CallExpression', { callee: d[0], arguments: d[1] })},
    {"name": "CallExpression", "symbols": [{"literal":"new"}, "MemberExpression", "Arguments"], "postprocess": d => createNode('NewExpression', { callee: d[1], arguments: d[2] })},
    {"name": "CallExpression", "symbols": ["CallExpression", "Arguments"], "postprocess": d => createNode('CallExpression', { callee: d[0], arguments: d[1] })},
    {"name": "CallExpression", "symbols": ["CallExpression", {"literal":"["}, "Expression", {"literal":"]"}], "postprocess": d => createNode('MemberExpression', { object: d[0], property: d[2], computed: true })},
    {"name": "CallExpression$ebnf$1", "symbols": []},
    {"name": "CallExpression$ebnf$1", "symbols": ["CallExpression$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "CallExpression", "symbols": ["CallExpression", "CallExpression$ebnf$1", {"literal":"."}, "PropertyName"], "postprocess": d => createNode('MemberExpression', { object: d[0], property: createIdentifier(d[3].value), computed: false })},
    {"name": "CallExpression$ebnf$2", "symbols": []},
    {"name": "CallExpression$ebnf$2", "symbols": ["CallExpression$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "CallExpression", "symbols": ["CallExpression", "CallExpression$ebnf$2", {"literal":"?."}, "OptionalMemberAccess"], "postprocess":  d => createNode('MemberExpression', { 
          object: d[0], 
          property: d[3].property, 
          computed: d[3].computed, 
          optional: true 
        }) },
    {"name": "NewExpression", "symbols": [{"literal":"new"}, "MemberExpression"], "postprocess": d => createNode('NewExpression', { callee: d[1], arguments: [] })},
    {"name": "NewExpression", "symbols": ["MemberExpression"], "postprocess": id},
    {"name": "MemberExpression", "symbols": ["PrimaryExpression"], "postprocess": id},
    {"name": "MemberExpression", "symbols": ["MemberExpression", {"literal":"["}, "Expression", {"literal":"]"}], "postprocess": d => createNode('MemberExpression', { object: d[0], property: d[2], computed: true })},
    {"name": "MemberExpression$ebnf$1", "symbols": []},
    {"name": "MemberExpression$ebnf$1", "symbols": ["MemberExpression$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "MemberExpression", "symbols": ["MemberExpression", "MemberExpression$ebnf$1", {"literal":"."}, "PropertyName"], "postprocess": d => createNode('MemberExpression', { object: d[0], property: createIdentifier(d[3].value), computed: false })},
    {"name": "MemberExpression$ebnf$2", "symbols": []},
    {"name": "MemberExpression$ebnf$2", "symbols": ["MemberExpression$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "MemberExpression", "symbols": ["MemberExpression", "MemberExpression$ebnf$2", {"literal":"?."}, "OptionalMemberAccess"], "postprocess":  d => createNode('MemberExpression', { 
          object: d[0], 
          property: d[3].property, 
          computed: d[3].computed, 
          optional: true 
        }) },
    {"name": "OptionalMemberAccess", "symbols": ["PropertyName"], "postprocess": d => ({ property: createIdentifier(d[0].value), computed: false })},
    {"name": "OptionalMemberAccess", "symbols": [{"literal":"["}, "Expression", {"literal":"]"}], "postprocess": d => ({ property: d[1], computed: true })},
    {"name": "PropertyName", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => d[0]},
    {"name": "PropertyName", "symbols": ["ReservedKeyword"], "postprocess": d => d[0]},
    {"name": "ReservedKeyword", "symbols": [{"literal":"let"}], "postprocess": d => ({ value: 'let' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"const"}], "postprocess": d => ({ value: 'const' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"var"}], "postprocess": d => ({ value: 'var' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"if"}], "postprocess": d => ({ value: 'if' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"else"}], "postprocess": d => ({ value: 'else' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"for"}], "postprocess": d => ({ value: 'for' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"while"}], "postprocess": d => ({ value: 'while' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"do"}], "postprocess": d => ({ value: 'do' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"break"}], "postprocess": d => ({ value: 'break' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"continue"}], "postprocess": d => ({ value: 'continue' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"return"}], "postprocess": d => ({ value: 'return' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"function"}], "postprocess": d => ({ value: 'function' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"class"}], "postprocess": d => ({ value: 'class' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"extends"}], "postprocess": d => ({ value: 'extends' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"constructor"}], "postprocess": d => ({ value: 'constructor' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"async"}], "postprocess": d => ({ value: 'async' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"await"}], "postprocess": d => ({ value: 'await' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"import"}], "postprocess": d => ({ value: 'import' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"export"}], "postprocess": d => ({ value: 'export' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"from"}], "postprocess": d => ({ value: 'from' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"as"}], "postprocess": d => ({ value: 'as' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"try"}], "postprocess": d => ({ value: 'try' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"catch"}], "postprocess": d => ({ value: 'catch' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"finally"}], "postprocess": d => ({ value: 'finally' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"throw"}], "postprocess": d => ({ value: 'throw' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"true"}], "postprocess": d => ({ value: 'true' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"false"}], "postprocess": d => ({ value: 'false' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"null"}], "postprocess": d => ({ value: 'null' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"undefined"}], "postprocess": d => ({ value: 'undefined' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"this"}], "postprocess": d => ({ value: 'this' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"super"}], "postprocess": d => ({ value: 'super' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"new"}], "postprocess": d => ({ value: 'new' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"typeof"}], "postprocess": d => ({ value: 'typeof' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"instanceof"}], "postprocess": d => ({ value: 'instanceof' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"in"}], "postprocess": d => ({ value: 'in' })},
    {"name": "ReservedKeyword", "symbols": [{"literal":"of"}], "postprocess": d => ({ value: 'of' })},
    {"name": "Arguments$ebnf$1", "symbols": []},
    {"name": "Arguments$ebnf$1", "symbols": ["Arguments$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "Arguments$ebnf$2", "symbols": []},
    {"name": "Arguments$ebnf$2", "symbols": ["Arguments$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "Arguments", "symbols": [{"literal":"("}, "Arguments$ebnf$1", "ArgumentList", "Arguments$ebnf$2", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "ArgumentList", "symbols": [], "postprocess": () => []},
    {"name": "ArgumentList", "symbols": ["AssignmentExpression"], "postprocess": d => [d[0]]},
    {"name": "ArgumentList$ebnf$1", "symbols": []},
    {"name": "ArgumentList$ebnf$1", "symbols": ["ArgumentList$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ArgumentList$ebnf$2", "symbols": []},
    {"name": "ArgumentList$ebnf$2", "symbols": ["ArgumentList$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ArgumentList", "symbols": ["ArgumentList", "ArgumentList$ebnf$1", {"literal":","}, "ArgumentList$ebnf$2", "AssignmentExpression"], "postprocess": d => [...d[0], d[4]]},
    {"name": "ArgumentList", "symbols": [{"literal":"..."}, "AssignmentExpression"], "postprocess": d => [createNode('SpreadElement', { argument: d[1] })]},
    {"name": "ArgumentList$ebnf$3", "symbols": []},
    {"name": "ArgumentList$ebnf$3", "symbols": ["ArgumentList$ebnf$3", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ArgumentList$ebnf$4", "symbols": []},
    {"name": "ArgumentList$ebnf$4", "symbols": ["ArgumentList$ebnf$4", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ArgumentList", "symbols": ["ArgumentList", "ArgumentList$ebnf$3", {"literal":","}, "ArgumentList$ebnf$4", {"literal":"..."}, "AssignmentExpression"], "postprocess": d => [...d[0], createNode('SpreadElement', { argument: d[5] })]},
    {"name": "PrimaryExpression", "symbols": [{"literal":"this"}], "postprocess": () => createNode('ThisExpression')},
    {"name": "PrimaryExpression", "symbols": [{"literal":"super"}], "postprocess": () => createNode('Super')},
    {"name": "PrimaryExpression", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => createIdentifier(d[0].value, d[0])},
    {"name": "PrimaryExpression", "symbols": ["Literal"], "postprocess": id},
    {"name": "PrimaryExpression", "symbols": ["ArrayLiteral"], "postprocess": id},
    {"name": "PrimaryExpression", "symbols": ["ObjectLiteral"], "postprocess": id},
    {"name": "PrimaryExpression", "symbols": ["FunctionExpression"], "postprocess": id},
    {"name": "PrimaryExpression", "symbols": ["TemplateLiteral"], "postprocess": id},
    {"name": "PrimaryExpression$ebnf$1", "symbols": []},
    {"name": "PrimaryExpression$ebnf$1", "symbols": ["PrimaryExpression$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "PrimaryExpression$ebnf$2", "symbols": []},
    {"name": "PrimaryExpression$ebnf$2", "symbols": ["PrimaryExpression$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "PrimaryExpression", "symbols": [{"literal":"("}, "PrimaryExpression$ebnf$1", "Expression", "PrimaryExpression$ebnf$2", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "FunctionExpression$ebnf$1", "symbols": []},
    {"name": "FunctionExpression$ebnf$1", "symbols": ["FunctionExpression$ebnf$1", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "FunctionExpression$ebnf$2", "symbols": []},
    {"name": "FunctionExpression$ebnf$2", "symbols": ["FunctionExpression$ebnf$2", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "FunctionExpression", "symbols": [{"literal":"function"}, {"literal":"("}, "FunctionExpression$ebnf$1", "ParameterList", "FunctionExpression$ebnf$2", {"literal":")"}, "Block"], "postprocess":  d => createNode('FunctionExpression', {
          async: false,
          id: null,
          params: d[3],
          body: d[6]
        }) },
    {"name": "FunctionExpression$ebnf$3", "symbols": []},
    {"name": "FunctionExpression$ebnf$3", "symbols": ["FunctionExpression$ebnf$3", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "FunctionExpression$ebnf$4", "symbols": []},
    {"name": "FunctionExpression$ebnf$4", "symbols": ["FunctionExpression$ebnf$4", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "FunctionExpression", "symbols": [{"literal":"async"}, {"literal":"function"}, {"literal":"("}, "FunctionExpression$ebnf$3", "ParameterList", "FunctionExpression$ebnf$4", {"literal":")"}, "Block"], "postprocess":  d => createNode('FunctionExpression', {
          async: true,
          id: null,
          params: d[4],
          body: d[7]
        }) },
    {"name": "Literal", "symbols": [(lexer.has("number") ? {type: "number"} : number)], "postprocess": d => createLiteral(d[0].value, d[0].text)},
    {"name": "Literal", "symbols": [(lexer.has("string") ? {type: "string"} : string)], "postprocess": d => createLiteral(d[0].value, d[0].text)},
    {"name": "Literal", "symbols": [(lexer.has("regex") ? {type: "regex"} : regex)], "postprocess": d => createRegexLiteral(d[0].value.pattern, d[0].value.flags)},
    {"name": "Literal", "symbols": [{"literal":"true"}], "postprocess": () => createLiteral(true, 'true')},
    {"name": "Literal", "symbols": [{"literal":"false"}], "postprocess": () => createLiteral(false, 'false')},
    {"name": "Literal", "symbols": [{"literal":"null"}], "postprocess": () => createLiteral(null, 'null')},
    {"name": "Literal", "symbols": [{"literal":"undefined"}], "postprocess": () => createLiteral(undefined, 'undefined')},
    {"name": "TemplateLiteral", "symbols": [(lexer.has("templateLiteral") ? {type: "templateLiteral"} : templateLiteral)], "postprocess":  d => createNode('TemplateLiteral', { 
          raw: d[0].value,
          value: d[0].value 
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
    {"name": "PropertyDef", "symbols": ["ObjectPropertyKey", "PropertyDef$ebnf$1", {"literal":":"}, "PropertyDef$ebnf$2", "AssignmentExpression"], "postprocess": d => createNode('Property', { key: d[0], value: d[4], shorthand: false })},
    {"name": "PropertyDef", "symbols": ["PropertyName"], "postprocess":  d => createNode('Property', { 
          key: createIdentifier(d[0].value), 
          value: createIdentifier(d[0].value), 
          shorthand: true 
        }) },
    {"name": "PropertyDef", "symbols": [{"literal":"..."}, "AssignmentExpression"], "postprocess": d => createNode('SpreadElement', { argument: d[1] })},
    {"name": "ObjectPropertyKey", "symbols": ["PropertyName"], "postprocess": d => createIdentifier(d[0].value)},
    {"name": "ObjectPropertyKey", "symbols": [(lexer.has("string") ? {type: "string"} : string)], "postprocess": d => createLiteral(d[0].value, d[0].text)},
    {"name": "ObjectPropertyKey", "symbols": [(lexer.has("number") ? {type: "number"} : number)], "postprocess": d => createLiteral(d[0].value, d[0].text)},
    {"name": "ObjectPropertyKey", "symbols": [{"literal":"["}, "Expression", {"literal":"]"}], "postprocess": d => d[1]},
    {"name": "PropertyKey", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => createIdentifier(d[0].value, d[0])},
    {"name": "PropertyKey", "symbols": [(lexer.has("string") ? {type: "string"} : string)], "postprocess": d => createLiteral(d[0].value, d[0].text, d[0])},
    {"name": "PropertyKey", "symbols": [(lexer.has("number") ? {type: "number"} : number)], "postprocess": d => createLiteral(d[0].value, d[0].text)},
    {"name": "PropertyKey", "symbols": [{"literal":"["}, "Expression", {"literal":"]"}], "postprocess": d => d[1]},
    {"name": "Block", "symbols": [{"literal":"{"}, "StatementList", {"literal":"}"}], "postprocess": d => createNode('BlockStatement', { body: d[1] })}
]
  , ParserStart: "Program"
}

// Export both nearley runtime and grammar for ES modules



module.exports.nearley = nearley;
module.exports.grammar = grammar;
module.exports = { nearley, grammar };
