const { test, expect } = require('@playwright/test');

// Every theatre in the game, booted and played. Not a unit test of one rule — a sweep that asks
// of each map: does it build, does it run a real stretch of battle without throwing, does it field
// what its own table says it fields, and does its state stay finite. Cheap per map, and the only
// thing that catches a theatre nobody has opened in months.
const PLAY_SECONDS = 90;
const DT = 1 / 30;

const runOne = ([idx, isSandbox, secs, dt]) => {
  const errs = [];
  const oldErr = window.onerror;
  window.onerror = (m, s, l, c, e) => { errs.push(String(m)); return true; };
  try {
    try { localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    career.mapsUnlocked = 40;
    difficulty = 'normal';
    currentSandboxIdx = isSandbox ? idx : -1;
    currentMapIdx = isSandbox ? 0 : idx;
    startGame('destroyer');
    skipBanner();

    const M = window._MAP || {};
    const built = {
      name: M.name, ground: !!M.ground,
      islands: islands.length,
      enemies: enemies.filter(e => !e.proxy).length,
      allies: allies.length,
      wantEnemies: M.enemies == null ? null : M.enemies,
      wantIsles: M.isles == null ? null : M.isles,
      harbors: [!!friendlyHarbor, !!enemyHarbor],
    };

    // The first frames of a theatre carry the teardown of the PREVIOUS one plus the garbage it
    // left, so timing them measures the sweep, not the map: Omaha Beach reported a 117ms frame
    // here and 8.2ms max when run on its own. Warm-up frames are still RUN, just not timed.
    const WARMUP = 10;
    let frames = 0, worstFrame = 0, firstFrame = 0;
    const t0 = performance.now();
    for (let i = 0; i < secs / dt; i++) {
      const f0 = performance.now();
      t2 += dt; update(dt, t2);
      const el = performance.now() - f0;
      if (i === 0) firstFrame = el;
      if (i >= WARMUP && el > worstFrame) worstFrame = el;
      frames++;
      if (errs.length) break;
    }
    const wall = performance.now() - t0;

    // finiteness: a NaN anywhere in position/health quietly ruins a theatre
    const bad = [];
    const chkV = (v, w) => { if (!v || !Number.isFinite(v.x) || !Number.isFinite(v.y) || !Number.isFinite(v.z)) bad.push(w); };
    const chkN = (n, w) => { if (!Number.isFinite(n)) bad.push(w); };
    chkV(player.pos, 'player.pos'); chkN(player.hp, 'player.hp'); chkN(player.heading, 'player.heading');
    enemies.forEach((e, i) => { chkV(e.pos, 'enemy' + i); chkN(e.hp, 'enemyHp' + i); });
    allies.forEach((a, i) => { chkV(a.pos, 'ally' + i); chkN(a.hp, 'allyHp' + i); });
    islands.forEach((s2, i) => { chkV(s2.pos, 'isl' + i); chkN(s2.capture, 'islCap' + i); });
    shells.forEach((sh, i) => { if (sh.mesh) chkV(sh.mesh.position, 'shell' + i); });
    landUnits.forEach((u, i) => { chkV(u.pos, 'land' + i); chkN(u.hp, 'landHp' + i); });

    return { ok: !errs.length && !bad.length, idx, isSandbox, built, frames,
             simulated: +(frames * dt).toFixed(1),
             wallMs: Math.round(wall), worstFrameMs: +worstFrame.toFixed(1),
             firstFrameMs: +firstFrame.toFixed(1),
             phase, errs: errs.slice(0, 3), nan: bad.slice(0, 6),
             sceneMeshes: (() => { let n = 0; scene.traverse(x => { if (x.isMesh) n++; }); return n; })() };
  } finally { window.onerror = oldErr; }
};

const COUNTS = async (page) => page.evaluate(() =>
  ({ campaign: CAMPAIGN.length, sandbox: SANDBOX_MAPS.length }));

test('every theatre in the game boots, plays and stays finite', async ({ page }) => {
  test.setTimeout(15 * 60 * 1000);
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  // The leaderboard and account endpoints live on the production server, not on the local static
  // one, so they 404 here and nowhere else — verified 200 against sushigamelab.com. The game is
  // expected to shrug those off, which is itself worth not masking: anything ELSE still fails.
  const LOCAL_ONLY_404 = /sushi-api|irontide-api/;
  page.on('response', r => { if (r.status() >= 400 && !LOCAL_ONLY_404.test(r.url()))
    pageErrors.push('http ' + r.status() + ' ' + r.url()); });
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text()))
    pageErrors.push('console: ' + m.text()); });

  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const n = await COUNTS(page);
  console.log('THEATRES ' + JSON.stringify(n));

  const results = [];
  for (let i = 0; i < n.campaign; i++) results.push(await page.evaluate(runOne, [i, false, PLAY_SECONDS, DT]));
  for (let i = 0; i < n.sandbox; i++) results.push(await page.evaluate(runOne, [i, true, PLAY_SECONDS, DT]));

  results.forEach(r => console.log('MAP ' + JSON.stringify(r)));
  const broken = results.filter(r => !r.ok);
  console.log('SWEEP ' + JSON.stringify({ total: results.length, broken: broken.length,
    pageErrors: pageErrors.slice(0, 5) }));

  expect(results.length).toBe(n.campaign + n.sandbox);
  expect(broken.map(b => ({ name: b.built.name, errs: b.errs, nan: b.nan })), 'a theatre threw or went non-finite').toEqual([]);
  expect(pageErrors, 'an uncaught error escaped to the page').toEqual([]);
  // every theatre must actually field what its own table promises
  results.forEach(r => {
    expect(r.built.islands, r.built.name + ' built no islands').toBeGreaterThan(0);
    expect(r.built.harbors, r.built.name + ' is missing a harbour').toEqual([true, true]);
    if (r.built.wantEnemies > 0) expect(r.built.enemies, r.built.name + ' fielded no fleet').toBeGreaterThan(0);
    expect(r.simulated, r.built.name + ' stopped early').toBeGreaterThan(PLAY_SECONDS * 0.9);
  });
});
