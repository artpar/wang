import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import { readFileSync } from 'fs';

// Read version from package.json
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/browser/wang.min.js',
    format: 'umd',
    name: 'Wang',
    sourcemap: true,
  },
  plugins: [
    replace({
      preventAssignment: true,
      delimiters: ['', ''],
      values: {
        "__WANG_VERSION__": pkg.version,
        "const VERSION = '0.21.0'": `const VERSION = '${pkg.version}'`,
        "export const VERSION = '0.21.0'": `export const VERSION = '${pkg.version}'`
      }
    }),
    nodeResolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      outputToFilesystem: false,
    }),
    terser(),
  ],
};
