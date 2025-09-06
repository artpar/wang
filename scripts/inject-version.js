#!/usr/bin/env node

/**
 * Script to inject the version from package.json into the built files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const version = packageJson.version;

console.log(`Injecting version ${version} into build files...`);

// Update dist/esm/index.js
const esmIndexPath = path.join(rootDir, 'dist/esm/index.js');
if (fs.existsSync(esmIndexPath)) {
  let content = fs.readFileSync(esmIndexPath, 'utf8');
  // Replace the VERSION export - handle any string value
  content = content.replace(/export const VERSION = ['"][^'"]*['"];/, `export const VERSION = '${version}';`);
  fs.writeFileSync(esmIndexPath, content);
  console.log('Updated ESM index.js');
}

// Update dist/cjs/index.cjs
const cjsIndexPath = path.join(rootDir, 'dist/cjs/index.cjs');
if (fs.existsSync(cjsIndexPath)) {
  let content = fs.readFileSync(cjsIndexPath, 'utf8');
  // Replace the VERSION export - handle any string value
  content = content.replace(/exports\.VERSION = ['"][^'"]*['"];/, `exports.VERSION = '${version}';`);
  fs.writeFileSync(cjsIndexPath, content);
  console.log('Updated CJS index.cjs');
}

// Update dist/esm/interpreter/index.js
const esmInterpreterPath = path.join(rootDir, 'dist/esm/interpreter/index.js');
if (fs.existsSync(esmInterpreterPath)) {
  let content = fs.readFileSync(esmInterpreterPath, 'utf8');
  // Replace the VERSION const - handle any string value
  content = content.replace(/const VERSION = ['"][^'"]*['"];/, `const VERSION = '${version}';`);
  fs.writeFileSync(esmInterpreterPath, content);
  console.log('Updated ESM interpreter/index.js');
}

// Update dist/cjs/interpreter/index.cjs
const cjsInterpreterPath = path.join(rootDir, 'dist/cjs/interpreter/index.cjs');
if (fs.existsSync(cjsInterpreterPath)) {
  let content = fs.readFileSync(cjsInterpreterPath, 'utf8');
  // Replace the VERSION const - handle any string value
  content = content.replace(/const VERSION = ['"][^'"]*['"];/, `const VERSION = '${version}';`);
  fs.writeFileSync(cjsInterpreterPath, content);
  console.log('Updated CJS interpreter/index.cjs');
}

// Update dist/browser/wang.min.js (if needed for UMD build)
const browserPath = path.join(rootDir, 'dist/browser/wang.min.js');
if (fs.existsSync(browserPath)) {
  let content = fs.readFileSync(browserPath, 'utf8');
  // For minified version, we need to be more careful with replacement
  // Since it's minified, we might need a different approach
  console.log('Browser build detected - version will be embedded via rollup plugin');
}

console.log('Version injection complete!');