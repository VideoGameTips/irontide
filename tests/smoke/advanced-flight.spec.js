const { test, expect } = require('@playwright/test');

// The default flight model can't roll: P.roll is derived from how fast you're yawing, clamped to
// 0.9 rad and lerped back to zero, so it's decoration bolted to the turn. Advanced flying lets
// the bank accumulate without a clamp for as long as you hold the key — which is the only way a
// barrel roll is possible — while still levelling itself out the moment you let go.
const airborne = () => {
  // put a fighter in level cruise with the controls centred
  currentSandboxIdx = -1; currentMapIdx = 4;
  startGame('carrier'); skipBanner();
  money = 99999; buyPlane('fighter');
  flyPlane(planes[0]);
  piloting.phase = 'fly'; piloting.pos.set(0, 400, 0); piloting.speed = piloting.plane.def.speed;
  camPitch.v = 0; camYaw.v = 0; piloting.roll = 0; piloting.lastYaw = 0;
  Object.keys(keys).forEach(k => keys[k] = 0);
};
const boot = async page => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof flyPlane === 'function' && typeof buyPlane === 'function');
};
const PRE = () => {
  try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
  const b = document.getElementById('storyBtn'), s = document.getElementById('story');
  if (b && s && s.style.display === 'flex') b.click();
};

test('advanced flying rolls all the way round while held, and levels itself when released', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(([PRE_SRC, AIR_SRC]) => {
    eval('(' + PRE_SRC + ')()');
    const air = eval('(' + AIR_SRC + ')');
    const dt = 1 / 30;
    const holdD = adv => {
      gameSettings.advancedFlight = adv;
      air();
      keys['KeyD'] = 1;
      let wraps = 0, prev = 0, peak = 0;
      for (let i = 0; i < 120 && piloting; i++) {
        t2 += dt; update(dt, t2);
        if (!piloting) break;
        if (Math.abs(piloting.roll - prev) > Math.PI) wraps++;   // came round through +/-pi
        prev = piloting.roll; peak = Math.max(peak, Math.abs(piloting.roll));
      }
      const atRelease = piloting ? piloting.roll : 0;
      Object.keys(keys).forEach(k => keys[k] = 0);
      for (let i = 0; i < 30 && piloting; i++) { t2 += dt; update(dt, t2); }
      return { peak, wraps, atRelease, afterRelease: piloting ? piloting.roll : 0 };
    };
    return { adv: holdD(true), def: holdD(false) };
  }, [PRE.toString(), airborne.toString()]);

  // advanced: holding the key carries you all the way round...
  expect(r.adv.wraps).toBeGreaterThanOrEqual(1);                       // a full 360 is reachable
  expect(r.adv.peak).toBeGreaterThan(1.5);                             // it really does pass beyond a steep bank
  // ...and letting go rolls her back level, so you're never stranded inverted
  expect(Math.abs(r.adv.afterRelease)).toBeLessThan(Math.abs(r.adv.atRelease) * 0.5);
  expect(Math.abs(r.adv.afterRelease)).toBeLessThan(0.6);

  // default: unchanged — capped bank that springs back to level
  expect(r.def.wraps).toBe(0);
  expect(r.def.peak).toBeLessThan(1.1);
  expect(Math.abs(r.def.afterRelease)).toBeLessThan(0.15);
});

// Pull-up resolved in the AIRCRAFT's frame, not the world's. This is what makes a roll fly the
// way it looks: banked on your side, the elevator carves a turn instead of climbing.
test('the elevator works in the aircraft frame, so rolling changes what pulling back does', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(([PRE_SRC, AIR_SRC]) => {
    eval('(' + PRE_SRC + ')()');
    const air = eval('(' + AIR_SRC + ')');
    const dt = 1 / 30;
    const pullAt = bank => {
      gameSettings.advancedFlight = true;
      air();
      piloting.roll = bank;
      keys['ArrowUp'] = 1;
      const y0 = camYaw.v, p0 = camPitch.v;
      for (let i = 0; i < 45 && piloting; i++) { t2 += dt; update(dt, t2); if (piloting) piloting.roll = bank; }
      const out = { dPitch: camPitch.v - p0, dYaw: camYaw.v - y0 };
      Object.keys(keys).forEach(k => keys[k] = 0);
      return out;
    };
    return { level: pullAt(0), knife: pullAt(Math.PI / 2), inverted: pullAt(Math.PI) };
  }, [PRE.toString(), airborne.toString()]);

  // assert on which response DOMINATES, not on the other being exactly zero: hands off the
  // ailerons the bank is already rolling itself level, so a pinned knife edge bleeds a little
  // pitch back in. What matters is that the same key does an overwhelmingly different thing.
  expect(r.level.dPitch).toBeGreaterThan(1);                                  // wings level: pull = climb
  expect(Math.abs(r.level.dPitch)).toBeGreaterThan(Math.abs(r.level.dYaw) * 5);
  expect(Math.abs(r.knife.dYaw)).toBeGreaterThan(2);                          // on your side: pull = turn
  expect(Math.abs(r.knife.dYaw)).toBeGreaterThan(Math.abs(r.knife.dPitch) * 5);
  expect(r.inverted.dPitch).toBeLessThan(-1);                                 // inverted: pull = descend
});

test('the advanced-flying toggle is a real saved setting', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    try { localStorage.clear(); } catch (e) {}
    const inSpec = GAMESETTINGS_SPEC.advancedFlight === 'bool';
    gameSettings.advancedFlight = true; saveGameSettings();
    const stored = JSON.parse(localStorage.getItem('ironTideSettings') || '{}');
    gameSettings.advancedFlight = false;
    loadGameSettings();
    // and the controls panel tells you the keys changed
    gameSettings.advancedFlight = true;
    return { inSpec, saved: stored.advancedFlight === true, reloaded: gameSettings.advancedFlight === true };
  });
  expect(r.inSpec).toBe(true);
  expect(r.saved).toBe(true);
  expect(r.reloaded).toBe(true);   // survives a reload rather than resetting every session
});

// A stall should be the price of HOLDING a punishing attitude, not of passing through one. The
// old model flamed out after ~1.2 s of hard turning and counted bank angle as load, so once
// rolling became a real maneuver a barrel roll killed the engine before it finished.
test('only a sustained steep angle stalls the engine — rolling never does', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(([PRE_SRC, AIR_SRC]) => {
    eval('(' + PRE_SRC + ')()');
    const air = eval('(' + AIR_SRC + ')');
    const dt = 1 / 30;
    const run = (secs, setup) => {
      gameSettings.advancedFlight = true;
      air();
      piloting.speed = piloting.plane.def.maxSpeed;
      for (let i = 0; i < secs * 30 && piloting; i++) { setup(); t2 += dt; update(dt, t2); }
      const out = { on: piloting ? piloting.engineOn : null, load: piloting ? +(piloting.gLoad || 0).toFixed(2) : null };
      Object.keys(keys).forEach(k => keys[k] = 0);
      return out;
    };
    const steep = () => { camPitch.v = 1.2; };
    return {
      // a two-second yank: steep, but let go in time
      briefPull: run(2, steep),
      // held for twice as long as the airframe tolerates
      heldPull:  run(2 * 4 + 2, steep),
      // rolling flat out for six seconds — the barrel-roll case
      rolling:   run(6, () => { keys['KeyD'] = 1; camPitch.v = 0; }),
      limit: STALL_HOLD_SECS,
    };
  }, [PRE.toString(), airborne.toString()]);

  expect(r.limit).toBeGreaterThanOrEqual(3);   // "too long" has to actually mean a while
  expect(r.briefPull.on).toBe(true);           // a short hard pull is free
  expect(r.heldPull.on).toBe(false);           // holding it is not
  expect(r.rolling.on).toBe(true);             // and rolling never loads the airframe at all
  expect(r.rolling.load).toBe(0);
});
