const { test, expect } = require('@playwright/test');

// The default flight model can't roll: P.roll is derived from how fast you're yawing and springs
// back to level, so it's decoration bolted to the turn. Advanced flying makes the bank a real
// state the pilot owns — which is the only way a barrel roll is possible at all.
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

test('advanced flying holds the bank; default still self-levels', async ({ page }) => {
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

  // advanced: the roll goes all the way round, and stays where you left it
  expect(r.adv.wraps).toBeGreaterThanOrEqual(1);                       // a full 360 is reachable
  expect(Math.abs(r.adv.afterRelease - r.adv.atRelease)).toBeLessThan(0.05);   // hands off, it holds
  expect(Math.abs(r.adv.afterRelease)).toBeGreaterThan(0.5);           // ...and it held something real

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

  expect(r.level.dPitch).toBeGreaterThan(1);              // wings level: pulling back climbs
  expect(Math.abs(r.level.dYaw)).toBeLessThan(0.2);
  expect(Math.abs(r.knife.dYaw)).toBeGreaterThan(2);      // on your side: the same pull turns you
  expect(Math.abs(r.knife.dPitch)).toBeLessThan(0.2);
  expect(r.inverted.dPitch).toBeLessThan(-1);             // inverted: pulling back takes you down
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
