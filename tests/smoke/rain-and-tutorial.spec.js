const { test, expect } = require('@playwright/test');

const PRE = () => {
  try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
  const b = document.getElementById('storyBtn'), s = document.getElementById('story');
  if (b && s && s.style.display === 'flex') b.click();
};

// Reported as "the rain sound plays even when it is not raining". Two separate faults sat behind
// that, and neither was the rain layer itself — measured, that one decays to exactly 0 within 3 s.
//
// (1) The BOW WASH was a bare highpass at 1400 Hz with nothing above it, running to Nyquist —
//     brighter than the game's own rain (950-6200) and with no low end, which is what "static"
//     is. Worse, its level was min(1, speed/16), and 16 m/s is below every hull's cruising speed,
//     so it sat pinned at maximum the entire time the ship was moving.
// (2) The rain AUDIO asked for weather.type === 'storm' while the visible rain draws whenever
//     weatherForce() >= 0.9 — so a supercell or tornado poured rain down the screen in silence.
test('the rain you hear matches the rain you see', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof weatherForce === 'function');
  const r = await page.evaluate(([PRE_SRC]) => {
    eval('(' + PRE_SRC + ')()');
    sfxResume();
    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 4;
    startGame('destroyer'); skipBanner();
    if (!SFX.ctx || !SFX.rainGain) return { noAudio: true };
    const rows = [];
    for (const ty of Object.keys(WTYPES)) {
      // Read what the GAME decides, never a copy of the rule — SFX.rainLevel only climbs when the
      // engine's own storm flag is set. Restating `weatherForce() >= 0.9` here made this test pass
      // happily with the bug put back, which is how it slipped through the first time.
      weather.type = ty; weather.t = 9999;
      SFX.rainLevel = 0;                                     // from silence every time
      for (let i = 0; i < 200; i++) { t2 += 1 / 30; update(1 / 30, t2); }
      rows.push({ type: ty, seen: !!(rainGroup && rainGroup.visible), heard: SFX.rainLevel > 0.5,
                  level: +SFX.rainLevel.toFixed(3) });
    }
    return { rows };
  }, [PRE.toString()]);

  test.skip(!!r.noAudio, 'no AudioContext in this browser');
  // every weather type agrees: rain on screen and rain in the speakers are the same condition
  const mismatched = r.rows.filter(x => x.seen !== x.heard);
  expect(mismatched, `these disagree: ${JSON.stringify(mismatched)}`).toEqual([]);
  // and the fixture is meaningful — some types really do rain and some really do not
  expect(r.rows.some(x => x.seen)).toBe(true);
  expect(r.rows.some(x => !x.seen)).toBe(true);
  // specifically the two that were silent: they are the violent ones, and they were mute
  for (const ty of ['supercell', 'tornado']) {
    const row = r.rows.find(x => x.type === ty);
    expect(row, `${ty} missing from WTYPES`).toBeTruthy();
    expect(row.heard, `${ty} pours visible rain and must be audible`).toBe(true);
  }
});

test('the bow wash sounds like water, not like rain', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(async ([PRE_SRC]) => {
    eval('(' + PRE_SRC + ')()');
    sfxResume();
    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 4;
    startGame('destroyer'); skipBanner();
    if (!SFX.ctx || !SFX.washGain) return { noAudio: true };
    const frame = () => new Promise(res => requestAnimationFrame(res));
    weather.type = 'clear'; weather.t = 9999;      // explicitly NOT raining

    // Sample the whole acceleration curve, not just stopped-vs-flat-out. Both the old formula and
    // the new one give zero at zero speed, so a stopped reading proves nothing — the actual fault
    // was that min(1, speed/16) SATURATES below cruising speed, so the wash was already at maximum
    // through the entire range a ship normally travels at.
    driving = true; keys['KeyW'] = 0; player.throttle = 0;
    for (let i = 0; i < 90; i++) await frame();
    const idle = SFX.washGain.gain.value, idleSpeed = player.vel ? player.vel.length() : 0;
    keys['KeyW'] = 1;
    const curve = [];
    for (let i = 0; i < 260; i++) {
      await frame();
      if (i % 6 === 0) curve.push({ v: player.vel ? +player.vel.length().toFixed(2) : 0,
                                    g: +SFX.washGain.gain.value.toFixed(6) });
    }
    const full = SFX.washGain.gain.value;
    const top = Math.max(...curve.map(c => c.v));
    // the sample closest to half speed
    const half = curve.reduce((b, c) => Math.abs(c.v - top / 2) < Math.abs(b.v - top / 2) ? c : b, curve[0]);

    return { idle: +idle.toFixed(5), full: +full.toFixed(6), idleSpeed: +idleSpeed.toFixed(1),
             topSpeed: +top.toFixed(1), halfSpeed: half.v, halfGain: half.g,
             speed: player.vel ? +player.vel.length().toFixed(1) : 0,
             washTopHz: SFX.washFilt ? SFX.washFilt.frequency.value : null,
             washIsLowpass: SFX.washFilt ? SFX.washFilt.type : null,
             rainTopHz: SFX.rainFilt ? SFX.rainFilt.frequency.value : null,
             rainWhileClear: +SFX.rainGain.gain.value.toFixed(5) };
  }, [PRE.toString()]);

  test.skip(!!r.noAudio, 'no AudioContext in this browser');
  // the rain layer really is off — this is the "not raining" case
  expect(r.rainWhileClear).toBe(0);
  // the wash is BANDED now: it has a top end, so it can no longer be the brightest thing playing
  expect(r.washIsLowpass).toBe('lowpass');
  expect(r.washTopHz).toBeLessThan(3000);
  // ...and it must not sit pinned at full whenever the ship happens to be moving
  expect(r.speed).toBeGreaterThan(12);               // the ship really did get under way
  expect(r.idleSpeed).toBeLessThan(2);               // ...and really was stopped for the idle reading
  expect(r.full).toBeGreaterThan(0);                 // a real wash at speed, not silence
  expect(r.idle).toBeLessThan(r.full * 0.35);        // stopped, it all but disappears
  // ...and the level must still be CLIMBING at half speed rather than already maxed out, which
  // is the fault itself: saturated, it played flat out through every speed a ship really uses
  expect(r.halfSpeed).toBeGreaterThan(0);
  expect(r.halfGain, `at ${r.halfSpeed} of ${r.topSpeed} m/s the wash was already ${r.halfGain} of ${r.full}`)
    .toBeLessThan(r.full * 0.55);
});

// "there has to be a tutorial of how to click the tutorial." The course lives on the Training
// GROUND sandbox card, one of eight identical tiles a long scroll down the menu — while the big
// card at the top reads Training BAY, which is campaign operation 1 and teaches nothing.
test('a brand-new player is shown the tutorial and reaches it in one click', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof buildMenu === 'function' && typeof courseSeen === 'function');
  const r = await page.evaluate(() => {
    try { localStorage.clear(); } catch (e) {}
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    buildMenu();

    const btn = document.getElementById('learnBtn');
    const shownToNewPlayer = !!btn && btn.style.display !== 'none';
    // it must sit ABOVE the quick-battle button — a new player reads down, and one of these
    // teaches the game while the other drops them straight into a fight
    const qb = document.getElementById('quickBtn');
    const aboveQuickBattle = !!(btn && qb) &&
      (btn.compareDocumentPosition(qb) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    // and the course card is visually marked out from the seven sandbox maps beside it
    const cards = [...document.querySelectorAll('#maps div')].filter(d => /🎓/.test(d.textContent || ''));
    const cardLabelled = cards.some(d => /START HERE|从这里开始/.test(d.textContent || ''));

    // ONE click — no ship menu, no scrolling, no map picker
    btn.querySelector('span').click();
    skipBanner();
    const landed = { onTrainingMap: onTrainingMap(), tutIdx, steps: tutSteps ? tutSteps.length : 0,
                     ship: player && player.def ? player.def.name : null };

    // back at the menu it retires itself, having been taken
    phase = 'select'; buildMenu();
    const after = document.getElementById('learnBtn');
    return { shownToNewPlayer, aboveQuickBattle, cardLabelled, landed,
             seen: courseSeen(), retired: !after || after.style.display === 'none' };
  });

  expect(r.shownToNewPlayer).toBe(true);
  expect(r.aboveQuickBattle).toBe(true);
  expect(r.cardLabelled).toBe(true);
  // one click really did start the course, not merely select the map
  expect(r.landed.onTrainingMap).toBe(true);
  expect(r.landed.tutIdx).toBe(0);
  expect(r.landed.steps).toBeGreaterThan(20);        // the real course, not the 6-step first-battle hints
  expect(r.landed.ship).toBeTruthy();                // and they were given a ship rather than dumped in a picker
  // ...and having taken it once, the menu stops shouting
  expect(r.seen).toBe(true);
  expect(r.retired).toBe(true);
});
