import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT || 3000);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const GAME_INDEX = path.join(HERE, 'index.html');
const ROOM_IDLE_MS = 20 * 60 * 1000;
const CLIENT_IDLE_MS = 45 * 1000;
const MAX_ROOMS = 32;
const MAX_PLAYERS_PER_ROOM = 16;
const DEFAULT_ROOM_NAMES = [
  'Pacific One',
  'Iron Strait',
  'Storm Harbor',
  'Leviathan Sea',
];

/** @type {Map<string, Room>} */
const rooms = new Map();

class Room {
  constructor(name, mode = 'battle') {
    this.id = roomIdFrom(name);
    this.name = cleanText(name, 28) || 'Iron Tide Server';
    this.mode = cleanText(mode, 18) || 'battle';
    this.createdAt = Date.now();
    this.lastActiveAt = Date.now();
    this.clients = new Map();
    this.state = {
      seed: Math.floor(Math.random() * 1_000_000_000),
      weather: 'auto',
      allowBothSides: true,
      playerSpawns: {
        blue: { x: -1800, y: 0, z: 0, heading: Math.PI * 0.5 },
        red: { x: 1800, y: 0, z: 0, heading: -Math.PI * 0.5 },
        spectator: { x: 0, y: 450, z: 0, heading: 0 },
      },
    };
  }

  summary() {
    const sides = { blue: 0, red: 0, spectator: 0 };
    for (const c of this.clients.values()) sides[c.side] = (sides[c.side] || 0) + 1;
    return {
      id: this.id,
      name: this.name,
      mode: this.mode,
      players: this.clients.size,
      maxPlayers: MAX_PLAYERS_PER_ROOM,
      sides,
      seed: this.state.seed,
      ageSec: Math.round((Date.now() - this.createdAt) / 1000),
    };
  }
}

function roomIdFrom(name) {
  const base = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
  return base || `room-${randomUUID().slice(0, 8)}`;
}

function cleanText(value, max = 80) {
  return String(value ?? '').replace(/[^\w .:'-]/g, '').trim().slice(0, max);
}

function safeJson(data) {
  try {
    return JSON.stringify(data);
  } catch {
    return '{"type":"error","message":"Could not serialize packet"}';
  }
}

function send(ws, packet) {
  if (ws.readyState === ws.OPEN) ws.send(safeJson(packet));
}

function broadcast(room, packet, exceptWs = null) {
  const body = safeJson(packet);
  for (const client of room.clients.values()) {
    if (client.ws !== exceptWs && client.ws.readyState === client.ws.OPEN) client.ws.send(body);
  }
}

function getOrCreateRoom(name, mode) {
  if (rooms.size >= MAX_ROOMS && !rooms.has(roomIdFrom(name))) return null;
  const id = roomIdFrom(name || DEFAULT_ROOM_NAMES[0]);
  let room = rooms.get(id);
  if (!room) {
    room = new Room(name || DEFAULT_ROOM_NAMES[rooms.size % DEFAULT_ROOM_NAMES.length], mode);
    rooms.set(room.id, room);
  }
  return room;
}

function seedDefaultRooms() {
  for (const name of DEFAULT_ROOM_NAMES) getOrCreateRoom(name, 'battle');
}

function allRooms() {
  return [...rooms.values()].map(r => r.summary());
}

function parseBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 8192) req.destroy();
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

function writeJson(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
  });
  res.end(JSON.stringify(payload, null, 2));
}

async function serveGame(res) {
  try {
    const html = await readFile(GAME_INDEX, 'utf8');
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    });
    res.end(html);
  } catch (err) {
    writeJson(res, 500, {
      error: 'Game page missing from deployment.',
      expected: 'server/index.html',
      detail: err.message,
    });
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return writeJson(res, 204, {});
  if (req.url === '/' || req.url === '/index.html') return serveGame(res);
  if (req.url === '/health') {
    return writeJson(res, 200, {
      ok: true,
      service: 'iron-tide-relay',
      game: '/',
      rooms: rooms.size,
      players: [...rooms.values()].reduce((n, r) => n + r.clients.size, 0),
      websocket: '/play',
    });
  }
  if (req.url === '/servers' && req.method === 'GET') return writeJson(res, 200, { servers: allRooms() });
  if (req.url === '/servers' && req.method === 'POST') {
    const body = await parseBody(req);
    const room = getOrCreateRoom(body.name, body.mode);
    if (!room) return writeJson(res, 429, { error: 'Too many rooms are already active.' });
    return writeJson(res, 201, { server: room.summary() });
  }
  writeJson(res, 404, { error: 'Not found' });
});

const wss = new WebSocketServer({ server, path: '/play' });

wss.on('connection', ws => {
  const client = {
    id: randomUUID().slice(0, 8),
    name: 'Captain',
    side: 'spectator',
    room: null,
    ws,
    lastSeenAt: Date.now(),
    state: {},
  };

  send(ws, { type: 'welcome', id: client.id, servers: allRooms() });

  ws.on('message', raw => {
    client.lastSeenAt = Date.now();
    let msg;
    try { msg = JSON.parse(raw.toString()); }
    catch { return send(ws, { type: 'error', message: 'Bad JSON packet.' }); }

    if (msg.type === 'listServers') return send(ws, { type: 'servers', servers: allRooms() });

    if (msg.type === 'join') {
      const side = ['blue', 'red', 'spectator'].includes(msg.side) ? msg.side : 'spectator';
      const room = getOrCreateRoom(msg.server || msg.room || DEFAULT_ROOM_NAMES[0], msg.mode);
      if (!room) return send(ws, { type: 'error', message: 'No room slots available.' });
      if (!client.room && room.clients.size >= MAX_PLAYERS_PER_ROOM) {
        return send(ws, { type: 'error', message: 'That server is full.' });
      }
      leaveRoom(client);
      client.name = cleanText(msg.name, 24) || `Captain ${client.id}`;
      client.side = side;
      client.room = room;
      room.clients.set(client.id, client);
      room.lastActiveAt = Date.now();
      send(ws, {
        type: 'joined',
        id: client.id,
        server: room.summary(),
        side,
        spawn: room.state.playerSpawns[side],
        roomState: room.state,
        peers: [...room.clients.values()].filter(c => c.id !== client.id).map(peerPublic),
      });
      broadcast(room, { type: 'playerJoined', player: peerPublic(client), server: room.summary() }, ws);
      return;
    }

    if (!client.room) return send(ws, { type: 'error', message: 'Join a server before sending game packets.' });

    const room = client.room;
    room.lastActiveAt = Date.now();

    if (msg.type === 'switchSide') {
      if (!['blue', 'red', 'spectator'].includes(msg.side)) return;
      client.side = msg.side;
      send(ws, { type: 'sideChanged', side: client.side, spawn: room.state.playerSpawns[client.side] });
      return broadcast(room, { type: 'playerSideChanged', id: client.id, side: client.side }, ws);
    }

    if (msg.type === 'spawnPlayer') {
      const side = ['blue', 'red', 'spectator'].includes(msg.side) ? msg.side : client.side;
      client.side = side;
      const ship = cleanText(msg.ship || 'destroyer', 24);
      return broadcast(room, {
        type: 'spawnPlayer',
        id: client.id,
        name: client.name,
        side,
        ship,
        spawn: room.state.playerSpawns[side],
      });
    }

    if (msg.type === 'input' || msg.type === 'state' || msg.type === 'fire' || msg.type === 'event') {
      client.state = msg.type === 'state' && msg.state && typeof msg.state === 'object' ? msg.state : client.state;
      return broadcast(room, { ...msg, from: client.id, side: client.side, t: Date.now() }, ws);
    }

    send(ws, { type: 'error', message: `Unknown packet type: ${cleanText(msg.type, 32)}` });
  });

  ws.on('close', () => leaveRoom(client));
  ws.on('error', () => leaveRoom(client));
});

function peerPublic(client) {
  return {
    id: client.id,
    name: client.name,
    side: client.side,
    state: client.state,
  };
}

function leaveRoom(client) {
  const room = client.room;
  if (!room) return;
  room.clients.delete(client.id);
  client.room = null;
  room.lastActiveAt = Date.now();
  broadcast(room, { type: 'playerLeft', id: client.id, server: room.summary() });
}

setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    for (const client of room.clients.values()) {
      if (now - client.lastSeenAt > CLIENT_IDLE_MS) client.ws.terminate();
      else send(client.ws, { type: 'ping', t: now });
    }
    if (room.clients.size === 0 && now - room.lastActiveAt > ROOM_IDLE_MS && !DEFAULT_ROOM_NAMES.includes(room.name)) {
      rooms.delete(room.id);
    }
  }
}, 10_000).unref();

seedDefaultRooms();
server.listen(PORT, () => {
  console.log(`Iron Tide relay listening on :${PORT}`);
  console.log(`HTTP health: http://localhost:${PORT}/health`);
  console.log(`WebSocket: ws://localhost:${PORT}/play`);
});
