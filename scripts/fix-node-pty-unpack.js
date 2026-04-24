const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const resourcesDir = path.join(
  root,
  'dist',
  'BrainrotMaxxing-darwin-arm64',
  'BrainrotMaxxing.app',
  'Contents',
  'Resources'
);
const unpackedNodePty = path.join(resourcesDir, 'app.asar.unpacked', 'node_modules', 'node-pty');

const copies = [
  {
    from: path.join(root, 'node_modules', 'node-pty', 'build', 'Release', 'spawn-helper'),
    to: path.join(unpackedNodePty, 'build', 'Release', 'spawn-helper'),
  },
  {
    from: path.join(root, 'node_modules', 'node-pty', 'prebuilds', `${process.platform}-${process.arch}`, 'spawn-helper'),
    to: path.join(unpackedNodePty, 'prebuilds', `${process.platform}-${process.arch}`, 'spawn-helper'),
  },
];

let copied = 0;
for (const { from, to } of copies) {
  if (!fs.existsSync(from)) continue;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  fs.chmodSync(to, 0o755);
  copied++;
  console.log(`[brainrot] copied node-pty spawn-helper: ${path.relative(root, to)}`);
}

if (!copied) {
  console.error('[brainrot] failed to find node-pty spawn-helper to copy');
  process.exit(1);
}
