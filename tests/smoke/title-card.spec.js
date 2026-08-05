const { test, expect } = require('@playwright/test');

// A title card at launch, doubling as the loading screen — it lives in the static HTML so it
// paints before any game code runs, covering the three.js boot instead of a black canvas.
test('the title card shows the game and its author, and asks for a review', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForSelector('#splash', { timeout: 5000 });
  const r = await page.evaluate(() => {
    const sp = document.getElementById('splash');
    return {
      title: document.getElementById('splashTitle').textContent.trim(),
      by: document.getElementById('splashBy').textContent.trim(),
      stars: document.getElementById('splashStars').children.length,
      ask: document.getElementById('splashAsk').textContent,
      cta: document.getElementById('splashCta').textContent,
      // it must sit above everything, or it is a title card behind the game
      z: +getComputedStyle(sp).zIndex,
      inStaticHtml: !!document.querySelector('#splash'),
    };
  });
  expect(r.title).toBe('IRON TIDE');
  expect(r.by).toMatch(/VideoGameTips/i);
  expect(r.stars).toBe(5);
  expect(r.ask).toMatch(/5-star|五星/);
  expect(r.cta).toMatch(/REVIEW|好评/);
  expect(r.z).toBeGreaterThan(1000);
});

// Where "5 stars" points depends on where the game is running, and getting it wrong is worse than
// not asking. On CrazyGames the rating control is on the page around the iframe — there is nothing
// to link to. On the family VPS there is no review system at all, so it sends people to itch.
test('the review call-to-action matches the site it is running on', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof reviewTarget === 'function');
  const r = await page.evaluate(() => ({
    itchFrame:   reviewTarget('html-classic.itch.zone'),
    crazygames:  reviewTarget('iron-tide.game-files.crazygames.com'),
    newgrounds:  reviewTarget('uploads.ungrounded.net'),
    ownVps:      reviewTarget('game.boobank.com'),
  }));
  // portals that host their own rating widget get no link — the stars are already on the page
  expect(r.crazygames.kind).toBe('onpage');
  expect(r.newgrounds.kind).toBe('onpage');
  // everywhere else points at the itch page
  expect(r.itchFrame.kind).toBe('link');
  expect(r.ownVps.kind).toBe('link');
  expect(r.ownVps.url).toContain('itch.io');
});

// A splash you cannot skip is the most annoying thing a game can open with.
test('it can be skipped, and clears itself if you do nothing', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForSelector('#splash');
  await page.evaluate(() => document.getElementById('splash').click());
  await page.waitForTimeout(900);
  expect(await page.evaluate(() => !document.getElementById('splash')), 'a click did not dismiss it').toBe(true);

  // and a keypress works too, for anyone who never touches the mouse
  await page.goto('http://localhost:3000/');
  await page.waitForSelector('#splash');
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })));
  await page.waitForTimeout(900);
  expect(await page.evaluate(() => !document.getElementById('splash')), 'a key did not dismiss it').toBe(true);

  // left alone it must still go away on its own
  await page.goto('http://localhost:3000/');
  await page.waitForSelector('#splash');
  await page.waitForTimeout(6200);
  expect(await page.evaluate(() => !document.getElementById('splash')), 'it never cleared itself').toBe(true);
});
