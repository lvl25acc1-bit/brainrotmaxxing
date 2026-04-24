const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');

const jsFiles = [
  'main.js',
  'preload.js',
  'layout-engine.js',
  'renderer.js',
  'webview-preload.js',
  'scripts/check.js',
  'scripts/fix-node-pty-unpack.js',
  'scripts/security-scan.js',
];

for (const file of jsFiles) {
  execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'inherit' });
}

const jsonFiles = [
  'package.json',
  ...fs.readdirSync(path.join(root, 'modules'))
    .filter(file => file.endsWith('.json'))
    .map(file => path.join('modules', file)),
];

for (const file of jsonFiles) {
  JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
}

console.log(`[brainrot] checked ${jsFiles.length} JavaScript files and ${jsonFiles.length} JSON files`);
