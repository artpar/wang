#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distEsmDir = path.join(__dirname, '..', 'dist', 'esm');

function addJsExtension(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      addJsExtension(filePath);
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const updatedContent = content
        .replace(/from\s+["'](\.\.?\/[^"']+)["']/g, (match, p1) => {
          if (!p1.endsWith('.js') && !p1.endsWith('.json')) {
            // Check if the path corresponds to a directory with index.js
            const fullPath = path.join(dir, p1);
            const indexPath = path.join(fullPath, 'index.js');
            
            if (fs.existsSync(indexPath)) {
              return match.replace(p1, p1 + '/index.js');
            } else {
              return match.replace(p1, p1 + '.js');
            }
          }
          return match;
        })
        .replace(/import\s+["'](\.\.?\/[^"']+)["']/g, (match, p1) => {
          if (!p1.endsWith('.js') && !p1.endsWith('.json')) {
            // Check if the path corresponds to a directory with index.js
            const fullPath = path.join(dir, p1);
            const indexPath = path.join(fullPath, 'index.js');
            
            if (fs.existsSync(indexPath)) {
              return match.replace(p1, p1 + '/index.js');
            } else {
              return match.replace(p1, p1 + '.js');
            }
          }
          return match;
        });
      
      if (content !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent);
      }
    }
  });
}

if (fs.existsSync(distEsmDir)) {
  addJsExtension(distEsmDir);
  console.log('Fixed ESM import extensions');
} else {
  console.log('No ESM dist directory found');
}