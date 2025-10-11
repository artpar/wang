// Wang Language Mode for CodeMirror 6
import { StreamLanguage } from '@codemirror/language';

export const wangLanguage = StreamLanguage.define({
  name: 'wang',

  startState: () => ({
    tokenize: null,
    context: [],
    indented: 0,
    startOfLine: true,
  }),

  token(stream, state) {
    // Handle whitespace
    if (stream.eatSpace()) return null;

    // Comments
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'comment';
    }
    if (stream.match('/*')) {
      state.tokenize = tokenComment;
      return tokenComment(stream, state);
    }

    // Template literals
    if (stream.match('`')) {
      state.tokenize = tokenTemplate;
      return tokenTemplate(stream, state);
    }

    // Strings
    if (stream.match('"') || stream.match("'")) {
      state.tokenize = tokenString(stream.current());
      return state.tokenize(stream, state);
    }

    // Regular expressions
    if (stream.match(/^\/(?:[^\/\\]|\\.)+\/[gimsuy]*/)) {
      return 'regexp';
    }

    // Numbers
    if (stream.match(/^0x[0-9a-f]+/i) || stream.match(/^[0-9]+\.?[0-9]*(?:e[+-]?[0-9]+)?/i)) {
      return 'number';
    }


    // Operators
    if (
      stream.match(
        /^(?:===|!==|==|!=|<=|>=|<<|>>>|>>|&&|\|\||\\?\\?|\\?\\.|\\.\\.\\.|\+\+|--|\\*\\*|=>|[+\-*\/%=<>&|^~!?:])/,
      )
    ) {
      return 'operator';
    }

    // Keywords
    const keywords = {
      let: 'keyword',
      const: 'keyword',
      var: 'keyword',
      if: 'keyword',
      else: 'keyword',
      for: 'keyword',
      while: 'keyword',
      do: 'keyword',
      break: 'keyword',
      continue: 'keyword',
      return: 'keyword',
      function: 'keyword',
      class: 'keyword',
      extends: 'keyword',
      constructor: 'keyword',
      async: 'keyword',
      await: 'keyword',
      import: 'keyword',
      export: 'keyword',
      from: 'keyword',
      as: 'keyword',
      try: 'keyword',
      catch: 'keyword',
      finally: 'keyword',
      throw: 'keyword',
      new: 'keyword',
      this: 'keyword',
      super: 'keyword',
      typeof: 'operator',
      instanceof: 'operator',
      in: 'operator',
      of: 'operator',
      true: 'atom',
      false: 'atom',
      null: 'atom',
      undefined: 'atom',
    };

    // Identifiers and keywords
    if (stream.match(/^[a-zA-Z_$][\w$]*/)) {
      const word = stream.current();
      return keywords[word] || 'variable';
    }

    // Punctuation
    if (stream.match(/^[{}[\](),.;]/)) {
      return 'punctuation';
    }

    // Unknown character
    stream.next();
    return 'error';
  },

  indent(state, textAfter) {
    const firstChar = textAfter && textAfter.charAt(0);
    if (firstChar === '}' || firstChar === ']' || firstChar === ')') {
      return state.indented - 2;
    }
    return state.indented;
  },

  electricInput: /^\s*[}\]\)]$/,

  blockCommentStart: '/*',
  blockCommentEnd: '*/',
  lineComment: '//',

  fold: 'brace',
});

function tokenString(quote) {
  return function (stream, state) {
    let escaped = false,
      next;
    while ((next = stream.next()) != null) {
      if (next === quote && !escaped) {
        state.tokenize = null;
        return 'string';
      }
      escaped = !escaped && next === '\\';
    }
    return 'string';
  };
}

function tokenComment(stream, state) {
  let maybeEnd = false,
    ch;
  while ((ch = stream.next()) != null) {
    if (ch === '/' && maybeEnd) {
      state.tokenize = null;
      break;
    }
    maybeEnd = ch === '*';
  }
  return 'comment';
}

function tokenTemplate(stream, state) {
  let ch;
  while ((ch = stream.next()) != null) {
    if (ch === '`') {
      state.tokenize = null;
      return 'string template';
    }
    if (ch === '$' && stream.peek() === '{') {
      stream.next();
      state.tokenize = tokenTemplateExpression;
      return 'string template';
    }
    if (ch === '\\') stream.next();
  }
  return 'string template';
}

function tokenTemplateExpression(stream, state) {
  let depth = 1,
    ch;
  while ((ch = stream.next()) != null) {
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        state.tokenize = tokenTemplate;
        return 'string template';
      }
    }
  }
  return 'variable';
}
