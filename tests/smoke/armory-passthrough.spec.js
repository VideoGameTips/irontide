const { test, expect } = require('@playwright/test');

// The armory (Tab) is a BROWSING panel — unlike the harbour, build, map, chat and settings panels
// it does not freeze the war; the battle carries on behind it. But seven world actions guard on
// panelOpen(), which counts the armory, so E/G/C/R/V/Y/X were dead keys whenever it was up, and
// dead SILENTLY: no message, no clue. Meanwhile the armory itself says "walk over and press E to
// drive" and the HUD underneath says "Press E to crew ...". Reported from the live game as
// "按 E 还是没有反应" with the armory open in the screenshot.
const boot = (ground, ship) => {
  try { localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
  const b = document.getElementById('storyBtn'), s = document.getElementById('story');
  if (b && s && s.style.display === 'flex') b.click();
  career.mapsUnlocked = 40; difficulty = 'easy';
  if (ground) { currentSandboxIdx = SANDBOX_MAPS.findIndex(m => m.ground); currentMapIdx = 0; }
  else { currentSandboxIdx = -1; currentMapIdx = 3; }
  startGame(ship || (ground ? 'battleship' : 'destroyer')); skipBanner();
  for (let i = 0; i < 40; i++) { t2 += 0.05; update(0.05, t2); }
  money = 1e9;
};

// each case: set the world up, press the key, report whether the action happened
const CASES = {
  KeyE: { ground: true, setup: () => { buyTank('sherman');
      for (let i = 0; i < 6; i++) { t2 += 0.05; update(0.05, t2); }
      drivingTank = null; onFoot = true; },
    did: () => !!drivingTank },
  KeyG: { ground: false, setup: () => { driving = true; onFoot = false; manning = null; piloting = null; },
    did: () => onFoot === true },
  KeyC: { ground: false, ship: 'submarine', setup: () => { driving = true; onFoot = false; player.submerged = false; },
    did: () => player.submerged === true },
  KeyR: { ground: false, setup: () => { driving = true; onFoot = false; sonarCooldown = 0; sonarPulse = 0; },
    did: () => sonarPulse > 0 || sonarCooldown > 0 },
  KeyV: { ground: false, setup: () => { driving = true; onFoot = false; window._mineBefore = mines.length; },
    did: () => mines.length > window._mineBefore },
  KeyY: { ground: false, ship: 'carrier', setup: () => { buyPlane('f18');
      for (let i = 0; i < 6; i++) { t2 += 0.05; update(0.05, t2); }
      driving = false; onFoot = false; manning = null; piloting = null; drivingTank = null;
      const p = planes.find(q => q.parked); if (p) walkPos.set(p.group.position.x, deckEyeY(), p.group.position.z);
      window._yPlane = p; },
    // a dispatched aircraft does not join aiPlanes until its take-off run finishes, so the signal
    // is that it left the deck, not that it is airborne yet
    did: () => !!window._yPlane && window._yPlane.parked === false },
  KeyX: { ground: false, setup: () => { driving = false; onFoot = false; manning = null; piloting = null; drivingTank = null;
      const pl = placed[0]; if (pl) walkPos.set(pl.group.position.x, deckEyeY(), pl.group.position.z);
      window._gunsBefore = placed.length; },
    did: () => placed.length < window._gunsBefore },
};

const runCase = ([code, mode, SRC, CASES_SRC]) => {
  const CASES = eval('(' + CASES_SRC + ')');
  const c = CASES[code];
  try {
  eval('(' + SRC + ')(' + (c.ground ? 'true' : 'false') + ',' + JSON.stringify(c.ship || null) + ')');
  c.setup();
  if (mode === 'armory' && !shopOpen) toggleShop();
  if (mode === 'closed' && shopOpen) toggleShop();
  if (mode === 'freezing') { if (shopOpen) toggleShop(); if (!harborOpen) toggleHarbor(); }
  const armoryWasOpen = shopOpen, freezing = freezingPanelOpen();
  dispatchEvent(new KeyboardEvent('keydown', { code }));
  const out = { code, mode, armoryWasOpen, freezing, did: !!c.did(), armoryStillOpen: shopOpen };
  if (harborOpen) toggleHarbor();
  if (shopOpen) toggleShop();
  return out;
  } catch (e) { return { code, mode, err: e.message, did: false }; }
};

test('the armory does not silently swallow world-action keys', async ({ page }) => {
  test.setTimeout(240000);
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const codes = Object.keys(CASES);
  const S = boot.toString(), C = '(' + JSON.stringify(null) + ',0)';   // placeholder, replaced below
  const CS = '{' + codes.map(k => {
    const c = CASES[k];
    return `${k}:{ground:${!!c.ground},ship:${JSON.stringify(c.ship||null)},setup:${c.setup.toString()},did:${c.did.toString()}}`;
  }).join(',') + '}';

  const res = { closed: [], armory: [], freezing: [] };
  for (const mode of ['closed', 'armory', 'freezing']) {
    for (const code of codes) res[mode].push(await page.evaluate(runCase, [code, mode, S, CS]));
  }
  ['closed', 'armory', 'freezing'].forEach(m =>
    console.log(m.toUpperCase() + ' ' + JSON.stringify(res[m].map(r => r.code + ':' + (r.err ? 'ERR ' + r.err.slice(0,40) : (r.did ? 'ok' : 'DEAD'))))));

  // control: with no panel up, every one of these must work — otherwise the fixture proves nothing
  res.closed.forEach(r => expect(r.did, r.code + ' does not work even with no panel open').toBe(true));
  // the fix: the armory must not eat them
  res.armory.forEach(r => {
    expect(r.armoryWasOpen, 'the fixture failed to open the armory').toBe(true);
    expect(r.did, r.code + ' is still a dead key while the armory is open').toBe(true);
  });
  // ...and a panel that DOES freeze the war still owns its keys
  res.freezing.forEach(r => {
    expect(r.freezing, 'the fixture failed to open a freezing panel').toBe(true);
    expect(r.did, r.code + ' fired through a panel that pauses the war').toBe(false);
  });
});

// touchActionTap carried its own copy of the same panelOpen() guard, so on a phone or tablet the
// thumb buttons were dead behind the armory too — same bug, second input path.
test('the thumb buttons reach the world through the armory as well', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof touchActionTap === 'function');
  const r = await page.evaluate(([SRC]) => {
    eval('(' + SRC + ')(true)');
    buyTank('sherman');
    for (let i = 0; i < 6; i++) { t2 += 0.05; update(0.05, t2); }
    const tk = playerTanks[playerTanks.length - 1];
    const go = (openArmory, freezing) => {
      drivingTank = null; onFoot = true;
      if (shopOpen) toggleShop();
      if (harborOpen) toggleHarbor();
      if (openArmory) toggleShop();
      if (freezing) toggleHarbor();
      const state = { armory: shopOpen, freezing: freezingPanelOpen() };
      touchActionTap('action');
      const did = drivingTank === tk;
      drivingTank = null; onFoot = true;
      if (harborOpen) toggleHarbor();
      if (shopOpen) toggleShop();
      return { ...state, did };
    };
    return { closed: go(false, false), armory: go(true, false), freezing: go(false, true),
             // the panel's own buttons must still work while it is up, or you cannot close it
             shopBtnStillWorks: (() => { if (!shopOpen) toggleShop();
               const was = shopOpen; touchActionTap('shop'); const now = shopOpen;
               if (shopOpen) toggleShop(); return was && !now; })() };
  }, [boot.toString()]);
  console.log('TOUCH ' + JSON.stringify(r));

  expect(r.closed.did, 'the touch Use button does not crew a tank even with no panel open').toBe(true);
  expect(r.armory.armory, 'the fixture failed to open the armory').toBe(true);
  expect(r.armory.did, 'the touch Use button is still dead behind the armory').toBe(true);
  expect(r.freezing.freezing).toBe(true);
  expect(r.freezing.did, 'the touch Use button fired through a panel that pauses the war').toBe(false);
  expect(r.shopBtnStillWorks, 'the armory button stopped closing the armory').toBe(true);
});

// touchActionDown (the HOLD buttons) carried the guard too. On a keyboard the held-key flags are
// set before any guard, so holding R to repair a tank works with the armory up; on touch it did
// nothing. Fire is deliberately excluded — opening the armory drops pointer lock, so the desktop
// trigger releases as well.
test('hold-to-repair works through the armory on touch, matching the keyboard', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof touchActionDown === 'function');
  const r = await page.evaluate(([SRC]) => {
    eval('(' + SRC + ')(true)');
    buyTank('sherman');
    for (let i = 0; i < 6; i++) { t2 += 0.05; update(0.05, t2); }
    mountTank(playerTanks[playerTanks.length - 1]);
    const probe = (openArmory, freezing) => {
      if (shopOpen) toggleShop(); if (harborOpen) toggleHarbor();
      keys['KeyR'] = 0;
      if (openArmory) toggleShop();
      if (freezing) toggleHarbor();
      const state = { armory: shopOpen, freezing: freezingPanelOpen() };
      touchActionDown('special');
      const held = keys['KeyR'] === 1;
      touchActionUp('special');
      if (harborOpen) toggleHarbor(); if (shopOpen) toggleShop();
      return { ...state, held };
    };
    // the keyboard reference: the flag is set before any guard, armory or not
    const kbd = (openArmory) => { if (shopOpen) toggleShop(); keys['KeyR'] = 0;
      if (openArmory) toggleShop();
      dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' }));
      const held = keys['KeyR'] === 1;
      dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyR' }));
      if (shopOpen) toggleShop(); return held; };
    return { touchClosed: probe(false, false), touchArmory: probe(true, false),
             touchFreezing: probe(false, true), kbdArmory: kbd(true) };
  }, [boot.toString()]);
  console.log('HOLD ' + JSON.stringify(r));

  expect(r.touchClosed.held, 'hold-to-repair does not work even with no panel').toBe(true);
  expect(r.kbdArmory, 'the keyboard reference itself is blocked — premise wrong').toBe(true);
  expect(r.touchArmory.armory).toBe(true);
  expect(r.touchArmory.held, 'touch hold-to-repair is still dead behind the armory').toBe(true);
  expect(r.touchFreezing.held, 'touch hold fired through a panel that pauses the war').toBe(false);
});
