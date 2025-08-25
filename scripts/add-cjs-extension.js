#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distCjsDir = path.join(__dirname, '..', 'dist', 'cjs');

function addCjsExtension(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      addCjsExtension(filePath);
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const updatedContent = content
        .replace(/require\(["'](\.\.?\/[^"']+)["']\)/g, (match, p1) => {
          if (!p1.endsWith('.cjs') && !p1.endsWith('.js') && !p1.endsWith('.json')) {
            // Check if the path corresponds to a directory with index.cjs
            const fullPath = path.join(dir, p1);
            const indexPath = path.join(fullPath, 'index.cjs');
            
            if (fs.existsSync(indexPath)) {
              return `require("${p1}/index.cjs")`;
            } else {
              return `require("${p1}.cjs")`;
            }
          }
          return match;
        });
      
      const newPath = filePath.replace(/\.js$/, '.cjs');
      fs.writeFileSync(newPath, updatedContent);
      fs.unlinkSync(filePath);
    }
  });
}

if (fs.existsSync(distCjsDir)) {
  addCjsExtension(distCjsDir);
  console.log('Added .cjs extension to CommonJS files');
} else {
  console.log('No CommonJS dist directory found');
}