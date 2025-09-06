# Wang Language Syntax Highlighting

This guide provides detailed instructions for setting up Wang language syntax highlighting in various code editors.

## Table of Contents
- [Monaco Editor (Web)](#monaco-editor-web)
- [VS Code Extension](#vs-code-extension)
- [CodeMirror](#codemirror)
- [Features](#features)
- [Customization](#customization)

## Monaco Editor (Web)

Monaco Editor is the code editor that powers VS Code, perfect for web applications.

### Installation

```javascript
import { registerWangLanguage, wangLanguage } from 'wang-lang/editor/monaco'

// Register Wang language with Monaco
registerWangLanguage(monaco)

// Create an editor instance
const editor = monaco.editor.create(document.getElementById('container'), {
  value: `// Wang code here
let data = [1, 2, 3]
  |> map(_, n => n * 2)
  -> result`,
  language: 'wang',
  theme: 'vs-dark',
  automaticLayout: true
})
```

### Custom Theme

Create a Wang-specific theme with enhanced pipeline operator highlighting:

```javascript
monaco.editor.defineTheme('wang-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'keyword.operator.pipeline.wang', foreground: 'ff79c6', fontStyle: 'bold' },
    { token: 'string.template.wang', foreground: '50fa7b' },
    { token: 'keyword.control.wang', foreground: 'ff79c6' },
    { token: 'storage.type.wang', foreground: '8be9fd' }
  ],
  colors: {
    'editor.background': '#282a36',
    'editor.foreground': '#f8f8f2'
  }
})

monaco.editor.setTheme('wang-dark')
```

### Live Demo

Open `examples/monaco-editor.html` in your browser to see a live demo with syntax highlighting.

## VS Code Extension

### Installation Methods

#### Method 1: Build from Source

```bash
# Install vsce (Visual Studio Code Extension manager)
npm install -g vsce

# Build the extension
vsce package

# This creates wang-lang-1.0.0.vsix
# Install in VS Code: Extensions → ... → Install from VSIX
```

#### Method 2: Manual Installation

1. Create extension folder:
```bash
# Windows
mkdir %USERPROFILE%\.vscode\extensions\wang-lang

# macOS/Linux
mkdir -p ~/.vscode/extensions/wang-lang
```

2. Copy these files to the extension folder:
   - `package.vscode-extension.json` → `package.json`
   - `syntaxes/wang.tmLanguage.json`
   - `language-configuration.json`
   - `snippets/wang.json`

3. Restart VS Code

### Features

- **Syntax Highlighting**: Keywords, operators, strings, comments, regex, templates
- **Bracket Matching**: Automatic bracket pairing and highlighting
- **Code Folding**: Fold/unfold code blocks
- **Auto-indentation**: Smart indentation based on context
- **Snippets**: Quick code templates (type `pipe`, `class`, `afn`, etc.)

### Available Snippets

| Prefix | Description | Expands to |
|--------|-------------|------------|
| `pipe` | Pipeline expression | Multi-line pipeline with `\|>` and `->` |
| `class` | Class definition | Full class with constructor and methods |
| `imp` | Import statement | `import { name } from "module"` |
| `afn` | Async function | `async function name(params) { }` |
| `arrow` | Arrow function | `(params) => expression` |
| `try` | Try-catch block | Try-catch with error handling |
| `tpl` | Template literal | `` \`text ${expression}\` `` |
| `opt` | Optional chaining | `object?.property?.[index]` |

## CodeMirror

CodeMirror 6 integration for web-based code editors.

### Installation

```bash
npm install @codemirror/language
```

### Usage

```javascript
import { EditorView, basicSetup } from 'codemirror'
import { StreamLanguage } from '@codemirror/language'
import { wangLanguage } from 'wang-lang/editor/codemirror'

const wangMode = StreamLanguage.define(wangLanguage)

const view = new EditorView({
  extensions: [
    basicSetup,
    wangMode,
    EditorView.theme({
      '&': { height: '100%' },
      '.cm-content': { fontFamily: 'monospace' }
    })
  ],
  parent: document.body,
  doc: `// Wang code
import { process } from "./workflow.wang"

let results = data
  |> filter(_, active)
  -> process`
})
```

## Features

All syntax highlighters support:

### Core Language Elements

- **Keywords**: `let`, `const`, `var`, `if`, `else`, `for`, `while`, `class`, `function`, etc.
- **Operators**: All arithmetic, logical, comparison, and assignment operators
- **Pipeline Operators**: `|>` (pipe) and `->` (arrow) with special highlighting
- **Comments**: Line (`//`) and block (`/* */`) comments
- **Strings**: Single, double quotes, and template literals with interpolation
- **Numbers**: Integers, floats, hex numbers, scientific notation
- **Regex**: Regular expression literals with flags

### Wang-Specific Features

1. **Pipeline Operators** - Special highlighting for `|>` and `->`
2. **Template Literals** - Full support with `${expression}` interpolation
3. **Optional Chaining** - Highlights `?.` operator
4. **Spread Operator** - Highlights `...` in arrays and objects
5. **Async/Await** - Keywords highlighted appropriately
6. **Import/Export** - Module syntax highlighting

### Editor Features

- **Auto-closing**: Automatic closing of brackets, quotes, and template literals
- **Bracket Matching**: Highlights matching brackets
- **Indentation**: Smart indentation based on context
- **Folding**: Code folding for blocks and functions
- **Word Pattern**: Proper word selection for Wang identifiers

## Customization

### Monaco Editor

Customize token colors by modifying the theme:

```javascript
{
  rules: [
    { token: 'keyword', foreground: 'ff79c6' },
    { token: 'string', foreground: '50fa7b' },
    { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
    { token: 'number', foreground: 'bd93f9' },
    { token: 'operator', foreground: 'ffb86c' }
  ]
}
```

### VS Code

Create a custom theme in your `settings.json`:

```json
{
  "editor.tokenColorCustomizations": {
    "textMateRules": [
      {
        "scope": "keyword.operator.pipeline.wang",
        "settings": {
          "foreground": "#ff79c6",
          "fontStyle": "bold"
        }
      }
    ]
  }
}
```

### CodeMirror

Apply custom styles with CSS:

```css
.cm-wang-pipeline { color: #ff79c6; font-weight: bold; }
.cm-wang-keyword { color: #8be9fd; }
.cm-wang-string { color: #50fa7b; }
.cm-wang-comment { color: #6272a4; font-style: italic; }
```

## Testing

### Monaco Editor
1. Open `examples/monaco-editor.html` in a browser
2. The editor should show syntax highlighting for Wang code
3. Test features like auto-completion, bracket matching, and folding

### VS Code
1. Install the extension
2. Open any `.wang` file
3. Verify syntax highlighting and snippets work

### CodeMirror
1. Run your web application with CodeMirror integration
2. Load Wang code and verify highlighting

## Troubleshooting

### Monaco Editor
- **No highlighting**: Ensure `registerWangLanguage()` is called after Monaco loads
- **Theme not applied**: Call `setTheme()` after defining the custom theme

### VS Code
- **Extension not loading**: Check extension is in the correct folder
- **No `.wang` file association**: Restart VS Code after installation

### CodeMirror
- **Import errors**: Ensure correct module paths for CodeMirror 6
- **No highlighting**: Verify the StreamLanguage is properly defined and added to extensions

## Contributing

To improve syntax highlighting:

1. **Monaco**: Edit `src/editor/wang-monaco.js`
2. **VS Code**: Edit `syntaxes/wang.tmLanguage.json`
3. **CodeMirror**: Edit `src/editor/wang-codemirror.js`

Submit pull requests with:
- Description of improvements
- Test cases showing the highlighting
- Screenshots of before/after if visual changes

## License

MIT License - See [LICENSE](./LICENSE) for details