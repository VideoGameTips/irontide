# Iron Tide Relay Server

This is the first multiplayer/Railway piece for Iron Tide.

It does not try to run the whole war simulation on the server yet. For now it gives the game:

- multiple named servers/rooms;
- blue, red, and spectator side selection;
- spawn points for both sides;
- WebSocket relay packets for player state, input, firing, and events;
- Railway-compatible `PORT` startup.

## Run locally

```bash
cd server
npm install
npm start
```

Open:

- `GET http://localhost:3000/health`
- `GET http://localhost:3000/servers`
- `WS  ws://localhost:3000/play`

## Deploy to Railway

1. Create a new Railway project.
2. Point it at this repository.
3. Set the service root to `server`.
4. Railway should run `npm install` and `npm start`.
5. The public WebSocket URL will be:

```text
wss://YOUR-RAILWAY-DOMAIN.up.railway.app/play
```

## Client packet examples

Join a server and choose a side:

```json
{
  "type": "join",
  "server": "Pacific One",
  "name": "Captain",
  "side": "blue"
}
```

Spawn as either side:

```json
{
  "type": "spawnPlayer",
  "side": "red",
  "ship": "battleship"
}
```

Send player state:

```json
{
  "type": "state",
  "state": {
    "x": 100,
    "y": 0,
    "z": -50,
    "heading": 1.57,
    "hp": 82
  }
}
```

## Phase 2 integration plan

1. Add a small multiplayer menu in `index.html`: Offline / Join Server / Host Room.
2. On join, connect to `/play`, select blue/red, then call the existing spawn code using the server-provided spawn point.
3. Start by syncing only human-controlled vehicles, not every AI shell and smoke puff.
4. Keep AI local/offline until the server becomes authoritative.
5. Later: move ship spawning, boss spawning, damage, and victory rules to the server so both players see the same war.
