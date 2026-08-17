#!/usr/bin/env node
// One origin for local development, because the leaderboard cannot be tested from more
// than one.
//
// WHY THIS EXISTS
// Sushi ID rejects a cross-site POST, its session cookie is SameSite=lax, and it sends
// no CORS headers — all correct for production, and all of it makes "game on :3000,
// accounts on :3030" fail outright rather than merely being awkward. Serving everything
// from a single origin is not a workaround; it is what production actually does, so it
// is the only local setup where the cookie, CSRF and origin logic behave the same way
// they will when it matters.
//
// This project has already been bitten by the gap: the X-IT-Player header was missing
// from a dev-only CORS allow-list, which broke local work while production was fine.
// Every difference between the two is somewhere a bug can hide.
//
//   node tools/dev-proxy.js
//   → http://localhost:8080/irontide/     the game (files straight from this checkout)
//   → http://localhost:8080/sushi-api/*   accounts and site leaderboards  (:3030)
//   → http://localhost:8080/irontide-api/* Iron Tide's scoring server     (:7781)
//
// Nothing here is used in production; Caddy does this job on the server.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT || 8080);
const GAME_ROOT = path.join(__dirname, '..');
const PORTAL_ROOT = process.env.PORTAL_ROOT || '';   // optional: a sushigamelab checkout

const UPSTREAMS = [
  { prefix: '/sushi-api', port: Number(process.env.SUSHI_PORT || 3030), name: 'sushi-id' },
  { prefix: '/irontide-api', port: Number(process.env.SCORER_PORT || 7781), name: 'scorer' },
];

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
};

function proxy(req, res, upstream) {
  const forward = http.request({
    host: '127.0.0.1', port: upstream.port, path: req.url, method: req.method,
    // Every header passes through untouched, Host included. Caddy preserves Host, and
    // Sushi ID derives the origin it expects from it — rewriting Host to the upstream's
    // address would make it expect 127.0.0.1:3030 while the browser sends localhost:8080,
    // and every POST would 403. Which is the exact class of bug this proxy exists to
    // stop happening only in development.
    headers: req.headers,
  }, (up) => {
    res.writeHead(up.statusCode || 502, up.headers);
    up.pipe(res);
  });
  forward.on('error', (e) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: `${upstream.name} is not running on :${upstream.port}`, detail: e.code || e.message,
    }));
  });
  req.pipe(forward);
}

function serveFile(res, file) {
  fs.readFile(file, (err, body) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('not found'); }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      // No caching locally: a stale index.html while debugging is its own afternoon.
      'Cache-Control': 'no-store',
    });
    res.end(body);
  });
}

function serveStatic(res, root, rel) {
  const target = path.join(root, rel);
  // Refuse anything that escapes the root even in a dev tool — path traversal habits
  // are the kind of thing that get copied into something that ships.
  if (!path.resolve(target).startsWith(path.resolve(root))) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('forbidden');
  }
  fs.stat(target, (err, stat) => {
    if (!err && stat.isDirectory()) return serveFile(res, path.join(target, 'index.html'));
    serveFile(res, target);
  });
}

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(req.url.split('?')[0]);

  const upstream = UPSTREAMS.find(u => pathname === u.prefix || pathname.startsWith(`${u.prefix}/`));
  if (upstream) return proxy(req, res, upstream);

  if (pathname === '/irontide' ) { res.writeHead(302, { Location: '/irontide/' }); return res.end(); }
  if (pathname.startsWith('/irontide/')) return serveStatic(res, GAME_ROOT, pathname.slice('/irontide/'.length) || 'index.html');

  if (PORTAL_ROOT) return serveStatic(res, PORTAL_ROOT, pathname === '/' ? 'index.html' : pathname.slice(1));

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><meta charset=utf-8><title>Iron Tide dev</title>
<body style="font:14px/1.7 system-ui;max-width:40rem;margin:3rem auto;padding:0 1rem">
<h1>Iron Tide dev proxy</h1>
<p>One origin, same shape as production.</p>
<ul>
  <li><a href="/irontide/">/irontide/</a> — the game, from this checkout</li>
  <li><code>/sushi-api/*</code> → :${UPSTREAMS[0].port} — accounts and site leaderboards</li>
  <li><code>/irontide-api/*</code> → :${UPSTREAMS[1].port} — Iron Tide's scoring server</li>
</ul>
<p>Set <code>PORTAL_ROOT=/path/to/sushigamelab</code> to serve the portal at <code>/</code> too.</p>`);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`dev proxy on http://localhost:${PORT}`);
  console.log(`  /irontide/      → ${GAME_ROOT}`);
  for (const u of UPSTREAMS) console.log(`  ${u.prefix}/*  → 127.0.0.1:${u.port} (${u.name})`);
  if (PORTAL_ROOT) console.log(`  /               → ${PORTAL_ROOT}`);
});
