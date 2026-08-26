const { test, expect } = require('@playwright/test');

// There WAS an exit — #helpQuit — but it lived inside the `?` panel, on a key the action list
// labels "what should I do", and the touch pad has no `?` and no keyboard behind it: on a phone
// you got into a battle and there was no way out. The code's own comment said as much ("Being
// stuck and being unable to leave are the same problem twice") and then hid the cure.
const boot = () => {
  try { localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
  // a real player clicks the title card away before any of this; called directly, startGame()
  // leaves #splash (z-index 9000) sitting over the whole HUD
  if (typeof dismissSplash === 'function') dismissSplash();
  const sp = document.getElementById('splash'); if (sp && sp.parentNode) sp.parentNode.removeChild(sp);
  const b = document.getElementById('storyBtn'), s = document.getElementById('story');
  if (b && s && s.style.display === 'flex') b.click();
  career.mapsUnlocked = 40; difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 3;
  startGame('destroyer'); skipBanner();
  for (let i = 0; i < 20; i++) { t2 += 0.05; update(0.05, t2); }
};

const SIZES = [[360, 640, 'phone'], [667, 375, 'phone-landscape'], [768, 1024, 'tablet'], [1280, 800, 'laptop']];

for (const [w, h, name] of SIZES) {
  test(`the exit is visible and clickable at ${w}x${h} (${name})`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('http://localhost:3000/');
    await page.waitForFunction(() => typeof startGame === 'function');
    const r = await page.evaluate(([SRC]) => {
      eval('(' + SRC + ')()');
      const btn = document.getElementById('sysBtn');
      const box = btn.getBoundingClientRect();
      const cs = getComputedStyle(btn);
      // it has to be ON screen, big enough for a thumb, and actually hit-testable
      const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
      const hit = document.elementFromPoint(cx, cy);
      const onScreen = box.width > 0 && box.left >= 0 && box.top >= 0
        && box.right <= innerWidth + 1 && box.bottom <= innerHeight + 1;
      btn.click();
      const menu = document.getElementById('sysMenu');
      const items = [...menu.querySelectorAll('.sys-item')].map(b => ({ k: b.dataset.sys, t: b.textContent.trim() }));
      const open = menu.classList.contains('on');
      const mBox = menu.getBoundingClientRect();
      const menuOnScreen = mBox.right <= innerWidth + 1 && mBox.bottom <= innerHeight + 1 && mBox.left >= 0;
      // Esc must put it away — a menu you cannot dismiss is its own trap
      dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
      const closedByEsc = !menu.classList.contains('on');
      return { onScreen, w: Math.round(box.width), h: Math.round(box.height),
               display: cs.display, pointer: cs.pointerEvents,
               hitIsButton: !!(hit && (hit === btn || btn.contains(hit))),
               open, items, menuOnScreen, closedByEsc };
    }, [boot.toString()]);
    console.log(`SYSMENU ${w}x${h} ` + JSON.stringify(r));

    expect(r.onScreen, 'the menu button is off-screen').toBe(true);
    expect(r.w, 'the button is too small for a thumb').toBeGreaterThanOrEqual(30);
    expect(r.h).toBeGreaterThanOrEqual(30);
    expect(r.pointer, 'the button inherits the HUD pointer-events:none and cannot be clicked').toBe('auto');
    expect(r.hitIsButton, 'something is covering the menu button').toBe(true);
    expect(r.open, 'clicking the button did not open the menu').toBe(true);
    expect(r.menuOnScreen, 'the open menu runs off the screen').toBe(true);
    expect(r.items.map(i => i.k)).toEqual(['resume', 'settings', 'help', 'board', 'quit']);
    r.items.forEach(i => expect(i.t.length, i.k + ' has no label').toBeGreaterThan(0));
    expect(r.closedByEsc, 'Esc does not close the menu').toBe(true);
  });
}

test('every entry in the menu does what it says, and quit saves a resumable war', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(([SRC]) => {
    eval('(' + SRC + ')()');
    const open = () => { if (!sysMenuOpen) toggleSysMenu(true); };
    const click = k => { open(); document.querySelector(`.sys-item[data-sys="${k}"]`).click(); };
    const out = {};
    click('settings'); out.settings = settingsOpen; if (settingsOpen) toggleSettings();
    click('help');     out.help = helpOpen;        if (helpOpen) toggleHelp(false);
    click('board');    out.board = lbOpen;         if (lbOpen) closeLeaderboard();
    open(); click('resume'); out.resumeJustCloses = !sysMenuOpen && !settingsOpen && !helpOpen && !lbOpen;

    // quit: cancelling must change nothing at all
    try { localStorage.removeItem('ironTideSave'); } catch (e) {}
    const realConfirm = window.confirm;
    window.confirm = () => false;
    quitToMenu();
    out.cancelledSaved = (localStorage.getItem('ironTideSave') || '').length;
    window.confirm = realConfirm;
    return out;
  }, [boot.toString()]);
  console.log('SYSACT ' + JSON.stringify(r));

  expect(r.settings, 'Settings did not open').toBe(true);
  expect(r.help, 'Help did not open').toBe(true);
  expect(r.board, 'Leaderboard did not open').toBe(true);
  expect(r.resumeJustCloses, '"back to the battle" should only close the menu').toBe(true);
  expect(r.cancelledSaved, 'cancelling the quit still wrote a save').toBe(0);
});

test('the touch pad has a way into the menu too', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof touchActionTap === 'function');
  const r = await page.evaluate(([SRC]) => {
    eval('(' + SRC + ')()');
    const btn = document.querySelector('#touchControls .tbtn[data-act="menu"]');
    if (!btn) return { exists: false };
    refreshTouchControls();
    if (sysMenuOpen) toggleSysMenu(false);
    touchActionTap('menu');
    const opened = sysMenuOpen;
    refreshTouchControls();
    const lit = btn.classList.contains('on');
    // ...and it must still work with the armory up, like the other panel buttons
    toggleSysMenu(false); if (!shopOpen) toggleShop();
    touchActionTap('menu');
    const openedOverArmory = sysMenuOpen;
    toggleSysMenu(false); if (shopOpen) toggleShop();
    return { exists: true, label: btn.textContent.trim(), opened, lit, openedOverArmory };
  }, [boot.toString()]);
  console.log('TOUCHMENU ' + JSON.stringify(r));

  expect(r.exists, 'there is no MENU button on the touch pad — a phone still cannot leave').toBe(true);
  expect(r.label.length, 'the touch menu button has no label').toBeGreaterThan(0);
  expect(r.opened, 'tapping MENU did not open the menu').toBe(true);
  expect(r.lit, 'the MENU button does not light up while the menu is open').toBe(true);
  expect(r.openedOverArmory, 'MENU is dead while the armory is up').toBe(true);
});

// Quitting a campaign war must SAVE it (so "continue" works from the menu) and must actually
// reset the world. location.reload cannot be reliably stubbed, so this watches the real thing:
// a marker set on window is gone once the page has genuinely reloaded.
test('quitting a campaign war saves it and really resets the world', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  await page.evaluate(([SRC]) => {
    eval('(' + SRC + ')()');
    window.__stillHere = true;
    try { localStorage.removeItem('ironTideSave'); } catch (e) {}
    window.confirm = () => true;
    quitToMenu();
  }, [boot.toString()]);

  await page.waitForFunction(() => window.__stillHere === undefined, null, { timeout: 15000 });
  const after = await page.evaluate(() => ({
    saved: (localStorage.getItem('ironTideSave') || '').length,
    phase: typeof phase !== 'undefined' ? phase : null,
  }));
  console.log('QUIT ' + JSON.stringify(after));
  expect(after.saved, 'quitting a campaign war threw the war away instead of saving it').toBeGreaterThan(100);
  expect(after.phase, 'the world did not come back to the menu').not.toBe('play');
});

// #sysMenu lives inside #hud, so ending a battle with it open merely HIDES it — sysMenuOpen stays
// true and the .on class stays set, and it would be sitting open the moment the next battle began.
test('the menu does not carry over into the next battle', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(([SRC]) => {
    eval('(' + SRC + ')()');
    toggleSysMenu(true);
    const openedDuring = sysMenuOpen;
    endGame(false, 'test');                      // battle over with the menu still up
    const afterEnd = { flag: sysMenuOpen, cls: document.getElementById('sysMenu').classList.contains('on') };
    eval('(' + SRC + ')()');                     // ...and straight into the next one
    const nextBattle = { flag: sysMenuOpen,
      visible: getComputedStyle(document.getElementById('sysMenu')).display !== 'none' };
    return { openedDuring, afterEnd, nextBattle };
  }, [boot.toString()]);
  console.log('CARRYOVER ' + JSON.stringify(r));

  expect(r.openedDuring).toBe(true);
  expect(r.afterEnd.flag, 'the menu stayed open through the end of the battle').toBe(false);
  expect(r.afterEnd.cls).toBe(false);
  expect(r.nextBattle.visible, 'the next battle opened with the menu on screen').toBe(false);
});
