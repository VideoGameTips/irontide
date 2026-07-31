const { test, expect } = require('@playwright/test');

// You used to need an island within 80 m before you could leave the ship at all — on foot or by
// tank. That contradicted the game's own tutorial ("a tank floats, but it cannot cross open sea")
// and made "can I get out here?" a question with a no for an answer nearly everywhere. Now you go
// over the side wherever you are: alongside land you step onto it, in open water you swim, and
// the tank floats in and drives ashore under its own power.
const PRE = () => {
  try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
  const b = document.getElementById('storyBtn'), s = document.getElementById('story');
  if (b && s && s.style.display === 'flex') b.click();
};
// shove the ship out to genuinely open water so nothing is within reach of a beach
const OFFSHORE = () => {
  for (let n = 0; n < 400; n++) {
    let nearest = 1e9;
    for (const i of islands) { const d = islandEdgeDistance(player.pos, i); if (d < nearest) nearest = d; }
    if (nearest > 600) return nearest;
    player.pos.x += 120;
  }
  return -1;
};
const boot = async page => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof toggleFoot === 'function' && typeof tankLandToggle === 'function');
};

test('you can go over the side in open water and swim, then climb back aboard', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(([PRE_SRC, OFF_SRC]) => {
    eval('(' + PRE_SRC + ')()');
    const offshore = eval('(' + OFF_SRC + ')');
    const dt = 1 / 30;
    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 4;
    startGame('destroyer'); skipBanner();
    for (let i = 0; i < 30; i++) { t2 += dt; update(dt, t2); }
    const toLand = offshore();

    toggleFoot();
    const got = { onFoot, swimming: onFoot && !footLand, hp: footHP };
    for (let i = 0; i < 90; i++) { t2 += dt; update(dt, t2); }
    const survived = { alive: footHP > 0, hp: Math.round(footHP), stillSwimming: onFoot && !footLand };
    // and you are put beside your own hull, close enough to climb back on
    const backAboard = (() => { toggleFoot(); return !onFoot; })();
    return { toLand, got, survived, backAboard };
  }, [PRE.toString(), OFFSHORE.toString()]);

  expect(r.toLand).toBeGreaterThan(600);      // genuinely open water, not a hidden shoreline
  expect(r.got.onFoot).toBe(true);            // it let you out at all — this is the whole change
  expect(r.got.swimming).toBe(true);          // no ground under you, so you're a swimmer
  expect(r.survived.alive).toBe(true);        // swimming is survivable, not a death sentence
  expect(r.survived.stillSwimming).toBe(true);
  expect(r.backAboard).toBe(true);            // dropped within reach of your own ship
});

test('the tank can be put over the side in open water and floats', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(([PRE_SRC, OFF_SRC]) => {
    eval('(' + PRE_SRC + ')()');
    const offshore = eval('(' + OFF_SRC + ')');
    const dt = 1 / 30;
    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 4;
    startGame('destroyer'); skipBanner();
    for (let i = 0; i < 30; i++) { t2 += dt; update(dt, t2); }
    const toLand = offshore();
    money = 99999; buyTank('sherman');
    const tk = playerTanks[0];
    if (!tk) return null;
    drivingTank = tk;
    tankLandToggle();
    const launched = { offDeck: !tk.onDeck, onIsland: !!tk.island, y: +tk.pos.y.toFixed(2),
                       clearOfHull: Math.hypot(tk.pos.x - player.pos.x, tk.pos.z - player.pos.z) };
    for (let i = 0; i < 90; i++) { t2 += dt; update(dt, t2); }
    const afloat = { alive: playerTanks.includes(tk) && tk.hp > 0, y: +tk.pos.y.toFixed(2) };
    return { toLand, launched, afloat, halfLen: player.build.halfLen };
  }, [PRE.toString(), OFFSHORE.toString()]);

  expect(r).not.toBeNull();
  expect(r.toLand).toBeGreaterThan(600);
  expect(r.launched.offDeck).toBe(true);          // she leaves the deck with no beach in sight
  expect(r.launched.onIsland).toBe(false);        // and knows she is not ashore
  expect(r.launched.y).toBeCloseTo(0.75, 1);      // floating, not sunk to the seabed
  expect(r.launched.clearOfHull).toBeGreaterThan(20);   // dropped beside the ship, not inside it
  expect(r.launched.clearOfHull).toBeLessThan(r.halfLen + 18);  // ...but still within re-embark reach
  expect(r.afloat.alive).toBe(true);              // three seconds in the water does not drown her
  expect(r.afloat.y).toBeCloseTo(0.75, 1);
});
