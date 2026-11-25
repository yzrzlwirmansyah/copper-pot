// serve.ts — a tiny static server for local playtesting of The Copper Pot.
// Serves game/ at http://localhost:8080 (or $PORT). No dependencies, Node 22.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const ROOT = new URL('./game/', import.meta.url).pathname;
const PORT = Number(process.env.PORT || 8080);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
    if (path === '/') path = '/index.html';
    if (path.includes('..')) { res.writeHead(400); res.end('bad path'); return; }
    const file = join(ROOT, path);
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});

server.listen(PORT, () => {
  console.log(`The Copper Pot is cooking at http://localhost:${PORT}/`);
  console.log('Screens: ?screen=title | kitchen | win | loss');
});
