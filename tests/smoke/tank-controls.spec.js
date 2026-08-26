const { test, expect } = require('@playwright/test');

// The tank was a literal differential-track rig: A drove the left track, D the right, and W/S
// only chose which direction they turned. So W on its own did nothing at all — you could only
// move by holding a steering key, and the tank crabbed sideways the whole time. Every label in
// the game said otherwise ("W/S drive · A/D turn" in the HUD, the action panel, the first-tank
// prompt and the training course), and the touch stick carried a patch that pressed A+D for you.
// This pins the fix: W/S drive, A/D steer, A is left and D is right the same way as the ship.
const DRIVE = () => {
  try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
  const b = document.getElementById('storyBtn'), s = document.getElementById('story');
  if (b && s && s.style.display === 'flex') b.click();
  difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 0;
  startGame('destroyer'); skipBanner();

  // A wide, empty island: nothing to bump into, and 1.5 s at full speed stays well ashore.
    // capturable, NOT merely the biggest: the two HQ islands are the largest on the map, and
    // picking one put friendly guns on the enemy's home island — its garrison shot one down
    // inside a second, about one run in eight, which read as a flaky marker test.
  const isl = islands.filter(i => i.capturable).sort((a, c) => c.r - a.r)[0];
  landUnits.length = 0;                       // no garrison, so groundVehicleBlocked can't skew a run
  const spot = isl.pos.clone(); spot.y = groundHeightAt(spot, isl);
  buildGroundPlayerTank(spot, 'sherman', isl);
  const tk = playerTanks[playerTanks.length - 1];
  mountTank(tk);

  const DEG = 180 / Math.PI;
  const run = (held) => {
    ['KeyW', 'KeyA', 'KeyS', 'KeyD'].forEach(k => keys[k] = 0);
    tk.pos.copy(spot); tk.heading = 0; tk.parts = initTankParts(); tk.hp = tk.maxhp;
    held.forEach(k => keys[k] = 1);
    const from = tk.pos.clone();
    for (let i = 0; i < 90; i++) updateTank(1 / 60);      // 1.5 s
    held.forEach(k => keys[k] = 0);
    const d = tk.pos.clone().sub(from);
    return {
      dist: +d.length().toFixed(2),
      // heading 0 faces +Z, so +Z is "ahead" and this is signed: forward positive, reverse negative
      along: +d.z.toFixed(2),
      // heading grows to the LEFT (forward is sin/cos), so a positive turn here means left
      turnDeg: +(tk.heading * DEG).toFixed(1),
    };
  };
  return { W: run(['KeyW']), S: run(['KeyS']), A: run(['KeyA']), D: run(['KeyD']),
           WD: run(['KeyW', 'KeyD']), WA: run(['KeyW', 'KeyA']), none: run([]),
           driving: drivingTank === tk };
};

test('W and S drive the tank, A and D steer it', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof updateTank === 'function');
  const r = await page.evaluate(DRIVE);
  console.log('TANKPROBE ' + JSON.stringify(r));

  expect(r.driving, 'the fixture never got into the tank').toBe(true);
  expect(r.none.dist, 'the tank moved with no keys held').toBeLessThan(0.5);

  // W alone: the whole point. It used to be exactly 0.
  expect(r.W.along, 'W does not drive the tank forward').toBeGreaterThan(8);
  expect(Math.abs(r.W.turnDeg), 'W alone veers off line').toBeLessThan(1);

  // S alone: also 0 before, on the keyboard AND on the touch stick.
  expect(r.S.along, 'S does not reverse the tank').toBeLessThan(-5);
  expect(Math.abs(r.S.along), 'reverse should be slower than forward').toBeLessThan(r.W.along);
  expect(Math.abs(r.S.turnDeg), 'S alone veers off line').toBeLessThan(1);

  // A/D with no throttle pivot on the spot — the tracks still counter-rotate, that is kept.
  expect(r.A.turnDeg, 'A does not turn left').toBeGreaterThan(30);
  expect(r.D.turnDeg, 'D does not turn right').toBeLessThan(-30);
  expect(r.A.dist, 'a pivot should stay put, not drive off').toBeLessThan(0.5);
  expect(r.D.dist).toBeLessThan(0.5);

  // ...and under power they steer while still going somewhere.
  expect(r.WA.turnDeg, 'W+A does not steer left').toBeGreaterThan(10);
  expect(r.WD.turnDeg, 'W+D does not steer right').toBeLessThan(-10);
  expect(r.WD.dist, 'steering under throttle stopped the tank').toBeGreaterThan(5);
});

// The ship reads A = port, D = starboard. A vehicle that turned the other way round would be a
// trap every time you got out of one and into the other.
test('the tank turns the same way round as the ship', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(() => {
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    try { localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 0;
    startGame('destroyer'); skipBanner();
    driving = true; manning = null; player.heading = 0; player.throttle = 0.6;
    const ship = k => { player.heading = 0; keys[k] = 1;
      for (let i = 0; i < 60; i++) update(1 / 60, t2 += 1 / 60);
      keys[k] = 0; return Math.sign(+player.heading.toFixed(4)); };
    return { shipA: ship('KeyA'), shipD: ship('KeyD') };
  });
  console.log('SHIPTURN ' + JSON.stringify(r));
  // A raises heading on the ship; the tank's A must raise it too (asserted above as turnDeg > 0)
  expect(r.shipA, 'the ship no longer turns left on A').toBe(1);
  expect(r.shipD, 'the ship no longer turns right on D').toBe(-1);
});
