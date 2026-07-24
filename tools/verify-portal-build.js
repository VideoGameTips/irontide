// Verifies both portal zips boot, run, and behave (SW off; MP hidden in the portal build).
const { chromium } = require('@playwright/test');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'promo', 'builds', '.verify');
const MIME = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.png':'image/png' };

const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(file, (e, buf) => {
    if (e) { res.writeHead(404); return res.end('nope'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  });
});

(async () => {
  // unpack the zips this run is meant to verify — the script owns its own fixtures
  const { execSync } = require('child_process');
  const BUILDS = path.join(__dirname, '..', 'promo', 'builds');
  fs.rmSync(ROOT, { recursive: true, force: true });
  for (const [dir, zip] of [['itch', 'irontide-itch.zip'], ['portal', 'irontide-portal-singleplayer.zip']]) {
    const target = path.join(ROOT, dir);
    fs.mkdirSync(target, { recursive: true });
    execSync(`unzip -qo "${path.join(BUILDS, zip)}" -d "${target}"`);
  }

  await new Promise(r => server.listen(4599, r));
  const browser = await chromium.launch();
  let failures = 0;

  for (const variant of ['itch', 'portal']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    // Load inside an IFRAME — that is exactly how itch.io and CrazyGames serve it.
    await page.setContent(`<style>html,body{margin:0;height:100%}iframe{border:0;width:100%;height:100%}</style>
      <iframe src="http://localhost:4599/${variant}/index.html"></iframe>`);
    const f = page.frameLocator('iframe');
    await page.waitForTimeout(500);
    const frame = page.frames().find(fr => fr.url().includes(variant));
    await frame.waitForFunction(() => typeof startGame === 'function' && typeof SHIPS === 'object', { timeout: 30000 });

    // seed a career so the menu renders the war-log / medals / multiplayer button row
    await frame.evaluate(() => {
      localStorage.setItem('ironTideCareer', JSON.stringify({ wins: 3, losses: 1, sunk: 22, planes: 4, islands: 2, mapsUnlocked: 4, achievements: ['first_blood'] }));
    });
    await frame.evaluate(() => location.reload());
    await page.waitForTimeout(1200);
    const frame2 = page.frames().find(fr => fr.url().includes(variant));
    await frame2.waitForFunction(() => typeof startGame === 'function');
    const menuProbe = await frame2.evaluate(() => {
      const st = document.getElementById('story');
      if (st && st.style.display === 'flex') document.getElementById('storyBtn').click();
      const mp = document.querySelector('#mpBtn');
      return { mpPresent: !!mp, mpVisible: !!mp && mp.style.display !== 'none' };
    });

    const probe = await frame2.evaluate(() => {
      setLang('en');
      localStorage.setItem('ironTideDifficulty', 'normal');
      startGame('destroyer'); skipBanner();
      money = 50000; selectedWeapon = 'deckgun'; tryPlace();
      for (let i = 0; i < 60; i++) update(0.033, t2 + i * 0.033);
      return {
        phase, driving, guns: placed.length, hp: player.hp,
        ships: Object.keys(SHIPS).length,
        theaters: typeof CAMPAIGN !== 'undefined' ? CAMPAIGN.length : -1,
        terrain: typeof islandSurfaceY === 'function',
        bloom: typeof THREE.EffectComposer !== 'undefined',
        music: MUSIC.playing,
        swRegistered: !!(navigator.serviceWorker && navigator.serviceWorker.controller),
      };
    });

    const want = { mpVisible: false };   // both variants ship single-player (see build-portal.js)
    const checks = [
      ['boots to a live war',      probe.phase === 'play' && probe.driving],
      ['starter + bought guns',    probe.guns >= 3],
      ['31 theaters present',      probe.theaters === 31],
      ['terrain module loaded',    probe.terrain],
      ['bloom/postprocessing',     probe.bloom],
      ['procedural music running', probe.music],
      ['no service worker',        probe.swRegistered === false],
      ['multiplayer button rendered in menu', menuProbe.mpPresent],
      ['multiplayer hidden', menuProbe.mpVisible === want.mpVisible],
      ['no sw.js shipped (nothing registers it)', !fs.existsSync(path.join(ROOT, variant, 'sw.js'))],
      ['no console errors',        errors.length === 0],
    ];
    console.log(`\n=== ${variant} build (in iframe) ===`);
    for (const [name, ok] of checks) { console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`); if (!ok) failures++; }
    if (errors.length) console.log('  errors:', errors.slice(0, 3));
    console.log('  probe:', JSON.stringify({ ...probe, ...menuProbe }));
    await page.close();
  }

  await browser.close();
  server.close();
  console.log(failures ? `\n${failures} CHECK(S) FAILED` : '\nALL CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
