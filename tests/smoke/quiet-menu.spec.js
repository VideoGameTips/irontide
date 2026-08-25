const { test, expect } = require('@playwright/test');

// The menu was 2132px — 2.7 screens at 800px tall — and half of that was fifty campaign
// blueprints a brand-new captain has ◈0 credits for. These tests hold the first screen
// down: it is very easy for a menu to grow back one useful-looking row at a time.

async function freshMenu(page) {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof buildCampaignPicker === 'function');
  await page.evaluate(() => {
    localStorage.clear();
    menuOpenSections = {};
    career.credits = 0; career.wins = 0; career.losses = 0; currentSandboxIdx = -1;
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    // A brand-new captain now meets the first-run screen (guarded separately below); these tests
    // are about the picker they reach from it, so step past it first.
    _firstRunOpen = false; buildMenu();
    buildCampaignPicker();
  });
}

// offsetParent is null for anything inside a display:none parent — checking the node
// exists is not the same as checking a player can see it, and the cards do still exist.
const VISIBLE = `sel => { const e = document.querySelector(sel); return !!(e && e.offsetParent !== null); }`;
const MARKET_CARD = '#maps div[style*="196px"]';
const SANDBOX_CARD = '#maps div[style*="164px"]';

test('a first-time captain gets a menu that fits on one screen', async ({ page }) => {
  await freshMenu(page);
  const r = await page.evaluate(([market, sandbox, visible]) => {
    const shown = eval(visible);
    return {
      height: document.getElementById('menu').scrollHeight,
      viewport: window.innerHeight,
      marketShown: shown(market),
      sandboxShown: shown(sandbox),
    };
  }, [MARKET_CARD, SANDBOX_CARD, VISIBLE]);

  expect(r.marketShown).toBe(false);            // fifty blueprints they cannot buy one of
  expect(r.sandboxShown).toBe(false);
  expect(r.height).toBeLessThan(r.viewport * 1.5);
});

const clickTab = (page, label) => page.evaluate(l =>
  [...document.querySelectorAll('#brTabs button')].find(b => new RegExp(l).test(b.textContent)).click(), label);

test('the armory is behind a tab, and stays where you put it', async ({ page }) => {
  await freshMenu(page);
  const marketVisible = () => page.evaluate(eval(VISIBLE), MARKET_CARD);

  expect(await marketVisible(), 'not stacked under the battlefield picker').toBe(false);
  await clickTab(page, 'Armory|军械库');
  expect(await marketVisible()).toBe(true);

  // Changing difficulty rebuilds the whole picker. The tab you opened must not snap shut.
  await page.evaluate(() => setDifficulty('hard'));
  expect(await marketVisible()).toBe(true);

  await clickTab(page, 'Campaign|战役');
  expect(await marketVisible()).toBe(false);
});

test('an armory with nothing affordable says how to earn it', async ({ page }) => {
  await freshMenu(page);
  await clickTab(page, 'Armory|军械库');
  const r = await page.evaluate(([market, visible]) => {
    const shown = eval(visible);
    const broke = { cards: shown(market),
                    hint: /credits|信用/.test(document.getElementById('maps').textContent) };
    career.credits = 1200; career.wins = 3;
    buildCampaignPicker();
    return { broke, rich: shown(market) };
  }, [MARKET_CARD, VISIBLE]);

  expect(r.broke.hint, 'a wall of things you cannot buy needs to say why').toBe(true);
  expect(r.rich, 'and the catalogue is there once you can').toBe(true);
});

test('clicking a hull picks it — the launch bar is what sails', async ({ page }) => {
  await freshMenu(page);
  const r = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#ships > div')];
    const target = cards[cards.length - 1];
    const name = target.querySelector('h3').textContent.trim();
    target.click();
    return { phase, started: phase !== 'select',
             dock: (document.querySelector('#brGo .gs') || {}).textContent || '',
             name };
  });
  expect(r.started, 'a card must not start a war on its own any more').toBe(false);
  // the dock names the hull you just picked, so the choice is visible before you commit
  expect(r.dock).toContain(r.name.replace(/\s*DEFAULT|\s*默认/, '').trim());
});

test('a stranger gets one sentence, three pictures and one button', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof buildMenu === 'function');
  const r = await page.evaluate(() => {
    localStorage.clear(); loadCareer();
    career.wins = 0; career.losses = 0; saveCareer();
    const sp = document.getElementById('splash'); if (sp) sp.remove();
    _firstRunOpen = true; buildMenu();
    const vis = el => !!(el && el.offsetParent !== null);
    const before = { pitch: vis(document.getElementById('firstrun')),
                     ctas: document.querySelectorAll('#firstrun .go').length,
                     picker: vis(document.getElementById('maps')),
                     ships: vis(document.getElementById('ships')) };
    document.getElementById('frMore').click();          // "choose your ship, difficulty, battlefield"
    const after = { pitch: vis(document.getElementById('firstrun')),
                    picker: vis(document.getElementById('maps')),
                    ships: vis(document.getElementById('ships')) };
    return { before, after };
  });
  expect(r.before.pitch, 'a brand-new captain meets the pitch').toBe(true);
  expect(r.before.ctas, 'exactly one thing to press').toBe(1);
  expect(r.before.picker, 'no battlefield picker yet').toBe(false);
  expect(r.before.ships, 'no hulls to compare yet').toBe(false);
  expect(r.after.pitch, 'opting in leaves the pitch behind').toBe(false);
  expect(r.after.picker).toBe(true);
  expect(r.after.ships).toBe(true);
});

// The pitch hides the whole menu, Continue included. Showing it to someone with a saved war
// would strand them one screen away from the battle they were in the middle of — silently.
test('a saved war beats the pitch, so Continue is never buried', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof buildMenu === 'function');
  const r = await page.evaluate(() => {
    localStorage.clear(); loadCareer();
    career.wins = 0; career.losses = 0; saveCareer();
    const sp = document.getElementById('splash'); if (sp) sp.remove();
    difficulty = 'easy'; quickMode = false; currentSandboxIdx = -1; currentMapIdx = 0;
    startGame('destroyer'); skipBanner(); saveWar();     // quit mid-first-war
    phase = 'select'; document.getElementById('menu').style.display = 'flex';
    _firstRunOpen = true; buildMenu();
    const vis = el => !!(el && el.offsetParent !== null);
    return { pitch: vis(document.getElementById('firstrun')),
             resume: vis(document.getElementById('resumeBtn')) };
  });
  expect(r.pitch, 'the pitch stands down once there is a war to resume').toBe(false);
  expect(r.resume, 'Continue is reachable').toBe(true);
});

// showRespawnMenu() raises this same #menu mid-battle to pick a replacement hull. A captain sunk
// in their first war still has 0 wins, 0 losses and no save — every other clause of the pitch's
// test — so without the phase check the pitch covers the picker and strands them in the fight.
test('being sunk mid-first-war raises the ship picker, not the pitch', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof buildMenu === 'function');
  const r = await page.evaluate(() => {
    localStorage.clear(); loadCareer();
    career.wins = 0; career.losses = 0; saveCareer();
    const sp = document.getElementById('splash'); if (sp) sp.remove();
    difficulty = 'easy'; quickMode = false; currentSandboxIdx = -1; currentMapIdx = 0;
    _firstRunOpen = true;
    startGame('destroyer'); skipBanner();
    showRespawnMenu('sunk');
    const vis = el => !!(el && el.offsetParent !== null);
    const onRespawn = { pitch: vis(document.getElementById('firstrun')), ships: vis(document.getElementById('ships')) };
    // ...and it must stay down through a full rebuild: the language toggle re-runs buildMenu, and
    // this captain still has 0 wins, 0 losses and no save.
    setLang(isZh() ? 'en' : 'zh');
    const afterLang = { pitch: vis(document.getElementById('firstrun')), ships: vis(document.getElementById('ships')) };
    return { phase, ...onRespawn, afterLang };
  });
  expect(r.phase).toBe('respawn');
  expect(r.pitch, 'the pitch must not cover a mid-battle picker').toBe(false);
  expect(r.ships, 'the replacement hulls are reachable').toBe(true);
  expect(r.afterLang.pitch, 'and a language switch does not raise it either').toBe(false);
  expect(r.afterLang.ships).toBe(true);
});
