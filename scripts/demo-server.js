/**
 * demo-server.js
 * Local preview server for OmniSign's interactive single-device testbed.
 * Hosts the web showcase & simulator on http://localhost:3000
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const HTTP_PORT = 3000;
const ROOT_DIR = path.resolve(__dirname, '..');

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const filePath = path.join(ROOT_DIR, reqPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found: ' + reqPath);
      return;
    }

    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.wasm': 'application/wasm',
      '.binarypb': 'application/octet-stream',
      '.tflite': 'application/octet-stream',
      '.data': 'application/octet-stream',
      '.task': 'application/octet-stream',
      '.gguf': 'application/octet-stream',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(HTTP_PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 OmniSign Single-Device Showcase is LIVE!`);
  console.log(`👉 http://localhost:${HTTP_PORT}`);
  console.log(`======================================================\n`);

  const cmd = process.platform === 'win32' ? `start http://localhost:${HTTP_PORT}` : `open http://localhost:${HTTP_PORT}`;
  exec(cmd);
});
