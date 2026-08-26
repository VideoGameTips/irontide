const { test, expect } = require('@playwright/test');

// The map used to be the R-36M's targeting screen, and when the silo was removed the panel was
// closed off with an early `return` — leaving six live entrances to something that could not
// open: N, the minimap, the touch MAP button, /map (which replied "strategic map toggled"), a
// row in the action panel, and two steps of the training course teaching the key. This pins it
// open again, and pins the two gates that must NOT come back: a chart of the sea is not a
// nuclear weapon, so neither kid-safe mode nor a warm-up theater may block it.
const boot = async page => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof toggleTacticalMap === 'function');
  await page.evaluate(() => {
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    try { localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
  });
};

test('the tactical map opens from every entrance that advertises it', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    career.mapsUnlocked = 30; currentSandboxIdx = -1; currentMapIdx = 3;
    startGame('destroyer'); skipBanner();
    for (let i = 0; i < 60; i++) { t2 += 0.05; update(0.05, t2); }
    const out = { closedAtStart: tacticalOpen };

    const press = code => dispatchEvent(new KeyboardEvent('keydown', { code }));
    press('KeyN');
    out.viaKeyN = tacticalOpen;
    out.display = document.getElementById('tactical').style.display;
    out.paused = gamePaused();                    // the war must freeze behind it
    out.hint = document.getElementById('tacticalHint').textContent;
    out.panelTitle = actionPlan().t;              // the action panel knows where you are

    press('Escape');                              // Esc closes the panel it is over
    out.viaEsc = tacticalOpen;

    document.getElementById('minimap').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    out.viaMinimap = tacticalOpen;
    press('KeyN');

    runChatCommand('/map');                       // it says it toggled — so it has to toggle
    out.viaChat = tacticalOpen;
    press('KeyN');

    touchActionTap('map');                        // the thumb button on a phone
    out.viaTouchButton = tacticalOpen;
    press('KeyN');

    // ...and the row the action panel prints has to be a key that works
    out.panelListsN = (() => { const p = actionPlan(); return p.rows.concat(p.more).some(x => x[0] === 'N'); })();
    return out;
  });

  expect(r.closedAtStart).toBe(false);
  expect(r.viaKeyN, 'N did not open the map').toBe(true);
  expect(r.display).toBe('flex');
  expect(r.paused, 'the war kept running behind a full-screen map').toBe(true);
  expect(r.hint.length, 'the map has no caption').toBeGreaterThan(10);
  expect(r.viaEsc, 'Esc did not close the map').toBe(false);
  expect(r.viaMinimap, 'clicking the minimap did not open the map').toBe(true);
  expect(r.viaChat, '/map says it toggled the map — it has to toggle it').toBe(true);
  expect(r.viaTouchButton, 'the touch MAP button did not open the map').toBe(true);
  expect(r.panelListsN, 'the action panel stopped offering N').toBe(true);
});

test('a chart of the sea is not a nuclear weapon — no kid-safe or theater gate', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    // Operation 1 is a warm-up theater: nukesBannedHere() is true there, and that used to be one
    // of the two conditions that refused to open this panel.
    career.mapsUnlocked = 30; currentSandboxIdx = -1; currentMapIdx = 0;
    startGame('destroyer'); skipBanner();
    for (let i = 0; i < 40; i++) { t2 += 0.05; update(0.05, t2); }
    const out = { nukesBanned: nukesBannedHere() };

    SETTINGS.contentFilter = true;                       // kid-safe mode on
    out.kidSafe = contentFilterOn();
    dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyN' }));
    out.openUnderBothGates = tacticalOpen;
    dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyN' }));

    // and the thumb button must not be hidden for it either
    refreshTouchControls();
    const btn = document.querySelector('#touchControls .tbtn[data-act="map"]');
    out.touchButtonVisible = btn ? btn.style.visibility !== 'hidden' : null;
    SETTINGS.contentFilter = false;
    return out;
  });

  expect(r.nukesBanned, 'the fixture picked a theater where nukes are allowed').toBe(true);
  expect(r.kidSafe).toBe(true);
  expect(r.openUnderBothGates, 'kid-safe mode or the theater still blocks the map').toBe(true);
  expect(r.touchButtonVisible, 'the touch MAP button is hidden on a theater that allows the map').toBe(true);
});
