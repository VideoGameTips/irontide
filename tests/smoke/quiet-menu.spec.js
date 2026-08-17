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

test('the sections open on demand and survive the picker re-rendering', async ({ page }) => {
  await freshMenu(page);
  const openMarket = () => page.evaluate(() =>
    [...document.querySelectorAll('#maps > div')].find(d => /CAMPAIGN MARKET|战役市场/.test(d.textContent)).click());

  await openMarket();
  expect(await page.evaluate(eval(VISIBLE), MARKET_CARD)).toBe(true);

  // Changing difficulty rebuilds the whole picker. An opened section must not snap shut.
  await page.evaluate(() => setDifficulty('hard'));
  expect(await page.evaluate(eval(VISIBLE), MARKET_CARD)).toBe(true);

  await openMarket();
  expect(await page.evaluate(eval(VISIBLE), MARKET_CARD)).toBe(false);
});

test('a captain with credits gets the market back without asking', async ({ page }) => {
  await freshMenu(page);
  const r = await page.evaluate(([market, visible]) => {
    const shown = eval(visible);
    const asNewbie = shown(market);
    menuOpenSections = {};                       // no manual choice recorded
    career.credits = 1200; career.wins = 3;
    buildCampaignPicker();
    return { asNewbie, asVeteran: shown(market) };
  }, [MARKET_CARD, VISIBLE]);

  expect(r.asNewbie).toBe(false);
  expect(r.asVeteran).toBe(true);               // it is useful now, so it is back
});

test('ship cards say that clicking one starts the battle, until you have played', async ({ page }) => {
  await freshMenu(page);
  const newbie = await page.evaluate(() =>
    [...document.querySelectorAll('#ships > div')].filter(d => /CLICK TO SET SAIL|点这张卡就出击/.test(d.textContent)).length);
  expect(newbie).toBeGreaterThan(0);

  const veteran = await page.evaluate(() => {
    career.wins = 2; buildMenu();
    return [...document.querySelectorAll('#ships > div')].filter(d => /CLICK TO SET SAIL|点这张卡就出击/.test(d.textContent)).length;
  });
  expect(veteran).toBe(0);                       // they know how it works now
});
