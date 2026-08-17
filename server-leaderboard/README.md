# Iron Tide Leaderboard

Anti-cheat leaderboard service for Iron Tide. SQLite, no framework, no accounts.

Full design and operations notes: [`../docs/LEADERBOARD.md`](../docs/LEADERBOARD.md).

## Run locally

```bash
npm install
ADMIN_TOKEN=devtoken npm start
node ../tools/dev-proxy.js          # in another terminal
```

Then play at <http://localhost:8080/irontide/>. Go through the proxy rather than
hitting :7781 directly — everything is same-origin in production, the accounts
service refuses cross-site POSTs, and a local setup that differs from the server
is a local setup that cannot reproduce its bugs. There is deliberately no CORS
handling here at all.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `GET`  | `/health` | liveness + schema version |
| `POST` | `/run/start` | opens a war, returns `{session_id, nonce, server_time}` |
| `POST` | `/run/finish` | needs `X-IT-Sig`: HMAC-SHA256 of the raw body, keyed by the session nonce |
| `GET`  | `/board` | `?type=theater\|war\|career\|mastery&diff=&map=&window=all\|week&limit=` |
| `POST` | `/forget` | hides every run from a device |
| `GET`  | `/admin` | the page; data calls need `X-Admin-Token` |

The caller's device id travels in the **`X-IT-Player` header**, never in the query
string — the reverse proxy logs whole URIs, and that identifier next to a client IP in
an access log is exactly the pairing this design avoids.

`handle_path` in Caddy strips the `/irontide-api` prefix; the server strips it again if
present, so the same URLs work through the proxy or straight against the port.

## Tests

Run from the repo root — they live with the game's other tests:

```bash
npm test        # tests/lb-scoring, tests/lb-drift, tests/lb-api
```

`tests/lb-api.test.js` boots this server in-process against a temp database. It skips
itself if `npm install` has not been run here, so a fresh clone of the game repo still
gets a green suite.
