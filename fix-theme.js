const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /\bbg-white\b/g, replacement: 'bg-background' },
  { regex: /\btext-gray-900\b/g, replacement: 'text-foreground' },
  { regex: /\btext-gray-800\b/g, replacement: 'text-foreground' },
  { regex: /\btext-gray-700\b/g, replacement: 'text-muted-foreground' },
  { regex: /\btext-gray-600\b/g, replacement: 'text-muted-foreground' },
  { regex: /\btext-gray-500\b/g, replacement: 'text-muted-foreground' },
  { regex: /\bbg-gray-50\b/g, replacement: 'bg-muted/50' },
  { regex: /\bbg-gray-100\b/g, replacement: 'bg-muted' },
  { regex: /\bbg-gray-200\b/g, replacement: 'bg-muted' },
  { regex: /\bborder-gray-100\b/g, replacement: 'border-border' },
  { regex: /\bborder-gray-200\b/g, replacement: 'border-border' },
  { regex: /\bborder-gray-300\b/g, replacement: 'border-border' },
  { regex: /\btext-black\b/g, replacement: 'text-foreground' }
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        processDirectory(fullPath);
      }
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { regex, replacement } of replacements) {
        content = content.replace(regex, replacement);
      }
      
      // Specifically fix some cases where we might have bg-background inside a card, where bg-card makes more sense,
      // but bg-background is generally safe for dark mode.
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory('./app');
processDirectory('./components');
console.log("Done.");
