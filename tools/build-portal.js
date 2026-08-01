// Builds portal distribution zips from the live repo source.
//
// Both variants strip the service-worker registration: portals serve games from a
// sandboxed third-party origin where it cannot install, so shipping it would only
// advertise offline play that never works.
//
// Both also hide the multiplayer entry. That is not merely a CrazyGames requirement —
// defaultRelayUrl() derives the relay from location.host, so on any portal origin the
// button resolves to a URL that does not exist (wss://html-classic.itch.zone/play on
// itch.io) and every click ends in "Connection failed." Pointing it back at the family
// VPS instead would open an in-game chat channel between the kid and portal traffic,
// which is a deliberate decision, not a build flag.
//
//   irontide-itch.zip                  itch.io
//   irontide-portal-singleplayer.zip   CrazyGames / Newgrounds
// Identical in behaviour today; kept separate so a portal-specific tweak does not leak
// into the itch upload.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const REPO = path.join(__dirname, '..');
const STAGE = path.join(REPO, 'promo', 'builds', '.stage');
const OUT = path.join(REPO, 'promo', 'builds');

function reset(d) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
function copy(src, dst) { fs.cpSync(src, dst, { recursive: true }); }

fs.mkdirSync(OUT, { recursive: true });
reset(STAGE);
const html = fs.readFileSync(path.join(REPO, 'index.html'), 'utf8');

// --- shared transform: no service worker inside a third-party iframe origin
let itch = html.replace(
  // Matches the whole registration IIFE. Anchored on the 'serviceWorker' in navigator
  // guard and its closing })(); — deliberately strict, so that if upstream rewrites this
  // block again the build FAILS instead of silently shipping a registering service
  // worker into a sandboxed portal iframe. (It has been rewritten once already.)
  /\(\(\)=>\{\s*if\(!\('serviceWorker' in navigator\)[\s\S]{0,600}?\n\}\)\(\);/,
  "/* service worker registration removed for portal builds (sandboxed iframe origin) */"
);
if (itch === html) { console.error('FAIL: service-worker strip did not match'); process.exit(1); }

// --- hide the multiplayer entry point in the radio-log footer
const MP_ANCHOR = "log.querySelector('#mpBtn').onclick=openMultiplayer;";
if (!itch.includes(MP_ANCHOR)) { console.error('FAIL: mp anchor not found'); process.exit(1); }
const portal = itch.replace(MP_ANCHOR,
  "{const _mp=log.querySelector('#mpBtn'); if(_mp) _mp.style.display='none';}  /* portal build: single-player */");

// CrazyGames additionally forbids driving players off-platform, and an install prompt
// makes no sense inside their iframe. So its build also loses the shareable battle
// report's domain watermark, the PWA manifest link, and the Open Graph tags (which
// point at our own domain and are meaningless in an embed).
let crazygames = portal
  .replace("'⚓ IRON TIDE · game.boobank.com/irontide'", "'⚓ IRON TIDE'")
  .replace(/\n<link rel="manifest" href="manifest\.json">/, '')
  .replace(/\n<!-- Link previews:[\s\S]*?<meta name="twitter:image"[^>]*>/, '');
for (const [what, before, after] of [
  ['battle-report watermark', portal, crazygames],
]) {
  if (before === after) { console.error(`FAIL: ${what} strip did not match`); process.exit(1); }
}

// --- inline every local <script src> so the build is ONE file with no sibling fetches.
// CrazyGames' ingestion kept index.html and dropped the subdirectories: vendor/three.min.js
// and js/terrain.js both returned 404 from their CDN, so THREE never loaded and the game died
// on the first top-level `new THREE.Color(...)` with "THREE is not defined". Nothing in the
// page may depend on a second request, so we paste the sources in and the whole question goes
// away for every portal, not just this one.
function inlineScripts(src) {
  return src.replace(/<script src="([^"]+)"><\/script>/g, (tag, rel) => {
    if (/^https?:/.test(rel)) return tag;                       // leave any true remote alone
    const file = path.join(REPO, rel);
    if (!fs.existsSync(file)) { console.error('FAIL: cannot inline missing ' + rel); process.exit(1); }
    const code = fs.readFileSync(file, 'utf8');
    // a source ending in a line comment would swallow the closing tag
    return `<script>\n/* inlined: ${rel} */\n${code}\n</script>`;
  });
}
for (const [label, src] of [['itch/portal', portal], ['crazygames', crazygames]]) {
  if (/<script src="(?!https?:)/.test(inlineScripts(src))) {
    console.error(`FAIL: ${label} still has a local <script src> after inlining`); process.exit(1);
  }
}

const variants = [
  { name: 'irontide-itch', src: inlineScripts(portal), assets: ['icons', 'manifest.json'] },
  { name: 'irontide-portal-singleplayer', src: inlineScripts(portal), assets: ['icons', 'manifest.json'] },
  // The CrazyGames build references neither the icons nor the manifest — the manifest <link> is
  // stripped for their iframe — so shipping them is dead weight that only makes the archive look
  // more complicated than it is. This variant is literally one file, which leaves no room for
  // "we could not find index.html" to be about anything on our side.
  { name: 'irontide-crazygames', src: inlineScripts(crazygames), assets: [] },
];
for (const v of variants) {
  const dir = path.join(STAGE, v.name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), v.src);
  // vendor/ and js/ are inlined now, so they are deliberately NOT copied — a portal that
  // silently drops subdirectories can no longer break the game.
  for (const asset of v.assets) copy(path.join(REPO, asset), path.join(dir, asset));
  // zip ADDS to an existing archive rather than replacing it, so without this every rebuild
  // kept whatever the last one shipped — the vendor/ tree survived three rebuilds after it
  // stopped being copied, still dated from the build that last wrote it.
  fs.rmSync(path.join(OUT, `${v.name}.zip`), { force: true });
  execSync(`cd "${dir}" && zip -qr "${OUT}/${v.name}.zip" . -x '.*'`);
  const mb = (fs.statSync(`${OUT}/${v.name}.zip`).size / 1048576).toFixed(1);
  console.log(`${v.name}.zip  ${mb} MB`);
}
// --- CrazyGames: FLAT files, dragged in individually ---
// Two failures taught this shape. (1) A build with vendor/ and js/ subdirectories lost its
// folders on the way in: index.html served fine while vendor/three.min.js and js/terrain.js both
// 404'd. (2) Inlining everything into one file put a 603,352-character line (minified three.js is
// essentially one line) inside the HTML, and whatever re-serialises the page mangled that block —
// THREE ended up undefined while the later script blocks still ran and threw.
// So: every script stays its own file, every file sits at the root, and every src is a bare
// filename. Nothing to flatten, nothing enormous to re-serialise.
const CG_DIR = path.join(OUT, 'crazygames-upload');
reset(CG_DIR);
const CG_SCRIPTS = ['vendor/three.min.js', 'vendor/postprocessing/EffectComposer.js',
  'vendor/postprocessing/RenderPass.js', 'vendor/postprocessing/CopyShader.js',
  'vendor/postprocessing/ShaderPass.js', 'vendor/postprocessing/LuminosityHighPassShader.js',
  'vendor/postprocessing/UnrealBloomPass.js', 'js/terrain.js'];
let flat = crazygames;
for (const rel of CG_SCRIPTS) {
  const base = path.basename(rel);
  const before = flat;
  flat = flat.replace(`<script src="${rel}"></script>`, `<script src="${base}"></script>`);
  if (flat === before) { console.error(`FAIL: could not flatten script src ${rel}`); process.exit(1); }
  fs.copyFileSync(path.join(REPO, rel), path.join(CG_DIR, base));
}
if (/<script src="[^"]*\//.test(flat)) { console.error('FAIL: a script src still has a path separator'); process.exit(1); }
fs.writeFileSync(path.join(CG_DIR, 'index.html'), flat);
console.log(`crazygames-upload/  ${fs.readdirSync(CG_DIR).length} flat files — drag them all in`);
console.log('builds done');
