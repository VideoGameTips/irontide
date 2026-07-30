const { test, expect } = require('@playwright/test');

// A burning ship used to light nothing: each blaze rolled its own PointLight at intensity 2 with
// a life of 0.11 s, capped at six across the battle. Most frames there was no light at all. The
// lights are pooled and persistent now — same budget, continuous glow.
const setup = async page => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof updateFireLights === 'function' && typeof startGame === 'function');
};

test('burning ships hold a steady light instead of blinking', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    difficulty = 'easy'; quickMode = false; currentSandboxIdx = -1; currentMapIdx = 6;
    startGame('battleship'); skipBanner();

    // three blazes, close enough that none of them proxies out (a proxied hull emits no fire FX
    // at all, which would make this measure the proxy system instead of the lights)
    const burn = enemies.slice(0, 3);
    burn.forEach((e, i) => { e.crit = e.crit || {}; e.pos.set(-110 + i * 110, 0, -260 - i * 30); e.vel = new THREE.Vector3(); e.sinkT = 0; });
    const keep = () => burn.forEach(e => { e.hp = e.maxhp * 0.4; e.crit.fire = 3.2; });
    const dt = 1 / 30;
    for (let i = 0; i < 90; i++) { keep(); t2 += dt; update(dt, t2); }

    // sample every frame for two seconds: how often is a real light actually burning?
    let litFrames = 0, peak = 0, distinctPeak = 0;
    // count the FIRE pool, not every PointLight in the scene: explosions and muzzle flashes make
    // their own short-lived ones, and counting those made this fail about one run in three
    const before = _fireLights.length;
    for (let i = 0; i < 60; i++) {
      keep(); t2 += dt; update(dt, t2);
      const on = _fireLights.filter(e => e.light.visible && e.light.intensity > 1);
      if (on.length) litFrames++;
      peak = Math.max(peak, on.length);
      // how many different ships are lit — one long hull must not hoard every lamp
      const owners = new Set(on.map(e => { let bi = -1, bd = 1e9;
        burn.forEach((sh, k) => { const d = sh.pos.distanceTo(e.light.position); if (d < bd) { bd = d; bi = k; } }); return bi; }));
      distinctPeak = Math.max(distinctPeak, owners.size);
    }
    const during = _fireLights.length;

    // the pool must not grow when the fires do
    for (const e of enemies) { e.crit = e.crit || {}; e.crit.fire = 3; e.hp = e.maxhp * 0.4; }
    for (let i = 0; i < 60; i++) { t2 += dt; update(dt, t2); }
    const manyFires = _fireLights.length;

    // and a new battle must not inherit the last one's blaze
    startGame('battleship'); skipBanner();
    const afterRestart = _fireLights.length;

    return { litFrames, peak, distinctPeak, ships: burn.length, before, during, manyFires, afterRestart, budget: fireLightBudget() };
  });

  // continuous, not a blink: the old design lit up on a small fraction of frames
  expect(r.litFrames).toBeGreaterThanOrEqual(57);      // 57+ of 60 frames
  expect(r.peak).toBeGreaterThanOrEqual(2);
  expect(r.distinctPeak).toBeGreaterThanOrEqual(2);    // separate ships do get their own light
  // bounded: setting EVERY enemy alight must not grow the pool by one lamp
  expect(r.during).toBe(r.before);
  expect(r.manyFires).toBe(r.before);
  expect(r.during).toBeLessThanOrEqual(r.budget);
  // teardown returns them
  expect(r.afterRestart).toBeLessThanOrEqual(r.budget);
});

// The de-duplication rule on its own. fireFx() emits from up to four seats along one hull every
// frame, and ranking discounts by range — so a straight top-N hands the whole pool to the nearest
// ship and leaves every other blaze dark. Driven with synthetic sources because in a real battle
// distant hulls proxy out and stop emitting entirely, which would measure the wrong system.
test('one burning hull cannot hoard the whole light pool', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    currentSandboxIdx = -1; currentMapIdx = 6; startGame('battleship'); skipBanner();
    camera.position.set(0, 60, 0); camera.lookAt(0, 0, -300);

    const clusters = [
      [new THREE.Vector3(0, 3, -200), 1.4],     // one long hull: four seats, the HEAVIEST blaze
      [new THREE.Vector3(0, 3, -215), 1.4],
      [new THREE.Vector3(0, 3, -230), 1.4],
      [new THREE.Vector3(0, 3, -245), 1.4],
      [new THREE.Vector3(260, 3, -200), 1.0],   // three other ships, all lighter
      [new THREE.Vector3(-260, 3, -200), 1.0],
      [new THREE.Vector3(0, 3, -430), 1.0],
    ];
    for (let f = 0; f < 30; f++) {
      _fireSources.length = 0;
      for (const [pos, w] of clusters) _fireSources.push({ pos: pos.clone(), w });
      updateFireLights(1 / 30);
    }
    const on = _fireLights.filter(e => e.light.visible && e.light.intensity > 1);
    // how many of the four separate ships ended up with a lamp?
    const sites = [new THREE.Vector3(0, 3, -222), new THREE.Vector3(260, 3, -200),
                   new THREE.Vector3(-260, 3, -200), new THREE.Vector3(0, 3, -430)];
    const covered = sites.filter(sp => on.some(e => e.light.position.distanceTo(sp) < 120)).length;
    return { budget: fireLightBudget(), lit: on.length, covered };
  });

  expect(r.budget).toBe(4);
  expect(r.lit).toBe(4);
  expect(r.covered).toBe(4);   // all four ships lit — not four lamps on the one big hull
});
