const { test, expect } = require('@playwright/test');

// The leaderboard has to be invisible when it cannot work. The game is installable and
// plays with no network at all, so every one of these paths runs with NO leaderboard
// server present: the board must degrade to the player's own records and the war itself
// must be completely unaffected.

test('the game plays normally with no leaderboard server, and the board falls back to local bests', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof LB !== 'undefined' && typeof openLeaderboard === 'function');

  const r = await page.evaluate(async () => {
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();

    // An identity exists locally from the first boot, but nothing has been sent: the
    // consent question has not been asked yet.
    const identity = {
      hasId: /^[a-zA-Z0-9_-]{8,64}$/.test(LB.id || ''),
      validCallsign: callsignValid(LB.callsign.a, LB.callsign.b),
      consent: LB.consent,
      nameHasTag: /#[0-9A-F]{4}$/.test(lbMyName()),
    };

    // A war starts and ends with no server reachable.
    career.wins = 2; career.losses = 1;
    startGame('destroyer'); skipBanner();
    const startedClean = LB.session === null;      // consent not given -> no handshake at all

    endGame(true, 'test');
    const survivedEndGame = phase === 'over';

    // Seed a best time AFTER the war: endGame legitimately rewrites career.theaters with
    // the run it just scored, which in a synthetic test is zero seconds long.
    career.theaters = { 0: { stars: 3, bestT: 275 } };

    // Point the client at a dead port so "offline" is a fact rather than an assumption.
    // Without this the test would quietly pass or fail depending on whether a dev
    // leaderboard server happened to be running on this machine.
    lbBase = () => 'http://127.0.0.1:9';

    // The board opens and shows what the game knows locally.
    openLeaderboard();
    await new Promise((res) => setTimeout(res, 400));
    const body = document.getElementById('lbBody').textContent;
    const paused = gamePaused();
    closeLeaderboard();

    return {
      identity, startedClean, survivedEndGame, paused,
      offlineCopyShown: /offline|连不上/.test(body),
      localBestShown: /4:35/.test(body),            // 275s, straight out of career.theaters
      closedCleanly: gamePaused() === false && lbOpen === false,
    };
  });

  expect(r.identity.hasId).toBe(true);
  expect(r.identity.validCallsign).toBe(true);
  expect(r.identity.consent).toBe(null);           // nothing sent before the player agrees
  expect(r.identity.nameHasTag).toBe(true);
  expect(r.startedClean).toBe(true);
  expect(r.survivedEndGame).toBe(true);
  expect(r.paused).toBe(true);                     // the war freezes behind the panel
  expect(r.offlineCopyShown).toBe(true);
  expect(r.localBestShown).toBe(true);
  expect(r.closedCleanly).toBe(true);
  expect(errors).toEqual([]);
});

test('the consent question is asked once, on the results screen, and is remembered', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof LB !== 'undefined');

  const r = await page.evaluate(() => {
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();

    startGame('destroyer'); skipBanner();
    endGame(true, 'test');
    const askedOnFirstBattle = !!document.getElementById('lbConsent');

    document.getElementById('lbNo').click();
    const afterNo = { consent: LB.consent, boxGone: !document.getElementById('lbConsent') };

    // Declining is remembered, so the next battle neither asks again nor sends anything.
    phase = 'play';
    startGame('destroyer'); skipBanner();
    endGame(true, 'test');
    const asksAgain = !!document.getElementById('lbConsent');

    return { askedOnFirstBattle, afterNo, asksAgain, sessionAfterDecline: LB.session };
  });

  expect(r.askedOnFirstBattle).toBe(true);
  expect(r.afterNo.consent).toBe(false);
  expect(r.afterNo.boxGone).toBe(true);
  expect(r.asksAgain).toBe(false);
  expect(r.sessionAfterDecline).toBe(null);
  expect(errors).toEqual([]);
});

test('the money cheat turns the battle into a practice run and says so at the keypress', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof LB !== 'undefined');

  const r = await page.evaluate(() => {
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    startGame('destroyer'); skipBanner();

    lbSetConsent(true);
    const before = { practice: LB.practice, money };
    backslashMoneyCode(); backslashMoneyCode(); backslashMoneyCode();
    const after = { practice: LB.practice, money, prompt: promptMsg };

    // ...and a fresh war clears the mark rather than punishing the next one.
    startGame('destroyer'); skipBanner();
    return { before, after, clearedOnNewWar: LB.practice };
  });

  expect(r.before.practice).toBe(false);
  expect(r.after.practice).toBe(true);
  expect(r.after.money).toBe(r.before.money + 10000);       // the secret still pays out
  expect(r.after.prompt).toMatch(/practice|练习/);
  expect(r.clearedOnNewWar).toBe(false);
});

test('per-war tallies reset between battles so the board never inherits the last war', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');

  const r = await page.evaluate(() => {
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    startGame('destroyer'); skipBanner();
    sessBosses = 3; sessIslands = 5;
    startGame('destroyer'); skipBanner();
    return { bosses: sessBosses, islands: sessIslands };
  });

  expect(r.bosses).toBe(0);
  expect(r.islands).toBe(0);
});

test('the results screen does not accumulate leaderboard leftovers battle after battle', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof LB !== 'undefined');

  const r = await page.evaluate(() => {
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();

    // #over is reused for every battle, so anything added to it survives into the next one.
    const counts = [];
    for (let i = 0; i < 3; i++) {
      phase = 'play';
      startGame('destroyer'); skipBanner();
      endGame(true, 'test');
      counts.push(document.querySelectorAll('#over #lbConsent, #over #lbRankLine').length);
      // answer on the first pass so later passes take the submit path instead
      const yes = document.getElementById('lbYes');
      if (yes) yes.click();
    }
    return { counts };
  });

  expect(r.counts).toEqual([1, 0, 0]);   // asked once, then nothing left behind
});

test('the board panel follows the language switch', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof openLeaderboard === 'function');

  const r = await page.evaluate(async () => {
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    const read = () => document.getElementById('lbCloseBtn').textContent;
    setLang('en'); openLeaderboard(); const en = read(); closeLeaderboard();
    setLang('zh'); openLeaderboard(); const zh = read(); closeLeaderboard();
    return { en, zh };
  });

  expect(r.en).toBe('CLOSE');
  expect(r.zh).toBe('关闭');      // the cached panel is rebuilt, not left in the old language
});
