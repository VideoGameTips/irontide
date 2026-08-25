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
    // No server here, so there is still no session — but the reason changed: it is the
    // dead port, not a withheld consent. On by default now.
    const startedClean = LB.session === null;

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
  expect(r.identity.consent).toBe(null);           // 'never told yet', not 'opted out'
  expect(r.identity.nameHasTag).toBe(true);
  expect(r.startedClean).toBe(true);
  expect(r.survivedEndGame).toBe(true);
  expect(r.paused).toBe(true);                     // the war freezes behind the panel
  expect(r.offlineCopyShown).toBe(true);
  expect(r.localBestShown).toBe(true);
  expect(r.closedCleanly).toBe(true);
  expect(errors).toEqual([]);
});

test('a first win goes on the board and says so, and opting out takes it back off', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof LB !== 'undefined');

  const r = await page.evaluate(async () => {
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();

    // On by default: the very first battle opens a handshake, so the very first win can
    // rank. Waiting for consent meant two finished battles before anything appeared,
    // and a player who finished one saw an empty board and assumed it was broken.
    const before = LB.consent;
    startGame('destroyer'); skipBanner();
    endGame(true, 'test');

    // Read it BEFORE the send resolves. The notice is written synchronously on purpose —
    // the result is already on its way and the player should be told now, not after a
    // round trip that may never come back.
    const notice = document.getElementById('lbConsent');
    const told = !!notice;
    const t = notice ? notice.textContent : '';
    const statesItIsDone = /on the leaderboard|已经上榜/.test(t);
    const offersNoChoice = !/lbYes|lbNo/.test(notice ? notice.innerHTML : '');

    // ...and when the send does NOT land — which is the case here, there is no leaderboard
    // server in these tests — the claim has to be taken back. Saying "you are on the board"
    // to somebody who is not sends them looking for a name that was never uploaded.
    await new Promise(res => setTimeout(res, 400));
    const afterFailedSend = document.getElementById('lbConsent').textContent;
    const retracted = /could not be sent|没能上传/.test(afterFailedSend);
    const stillStatesItIsDone = /on the leaderboard|已经上榜/.test(afterFailedSend);

    // Retracting must not take the opt-out control down with it: that link is the only
    // way off the board on this screen.
    const hasOptOut = !!document.getElementById('lbOptOut');

    document.getElementById('lbOptOut').click();
    await new Promise(res => setTimeout(res, 300));

    // Opting out must stop the NEXT battle too, not just this one.
    phase = 'play';
    startGame('destroyer'); skipBanner();
    return { before, told, statesItIsDone, offersNoChoice, hasOptOut,
             retracted, stillStatesItIsDone,
             consentAfterOptOut: LB.consent, sessionAfterOptOut: LB.session };
  });

  expect(r.before).toBe(null);
  expect(r.told).toBe(true);
  expect(r.statesItIsDone).toBe(true);   // their time is already up there
  expect(r.offersNoChoice).toBe(true);   // so it states that, instead of offering a yes/no
  expect(r.hasOptOut).toBe(true);          // and survives the retraction above
  expect(r.retracted).toBe(true);          // the send failed, so the claim is withdrawn
  expect(r.stillStatesItIsDone).toBe(false);
  expect(r.consentAfterOptOut).toBe(false);
  expect(r.sessionAfterOptOut).toBe(null);
  expect(errors).toEqual([]);
});

test('a player who already said no stays off the board', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof LB !== 'undefined');
  const r = await page.evaluate(() => {
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    // Somebody who declined under the old opt-in flow has a stored '0'. Flipping the
    // default must not quietly re-enrol them — that would break a promise made to a
    // real person.
    localStorage.setItem('ironTideLbConsent', '0');
    lbLoad();
    const consent = LB.consent;
    startGame('destroyer'); skipBanner();
    endGame(true, 'test');
    return { consent, session: LB.session, noticeShown: !!document.getElementById('lbConsent') };
  });
  expect(r.consent).toBe(false);
  expect(r.session).toBe(null);
  expect(r.noticeShown).toBe(false);
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
      const out = document.getElementById('lbOptOut');
      if (out && i === 2) out.click();   // opt out on the last pass, so the cleanup path runs too
    }
    return { counts };
  });

  // What this guards is stacking, not frequency: #over is reused, so a notice or rank
  // line left behind would sit under the next one. At most one of each per screen —
  // how many battles show the notice is the enrolment policy's business, tested in
  // lb-defaults.spec.js.
  for (const n of r.counts) expect(n).toBeLessThanOrEqual(1);
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

test('a resumed save is never submitted, even if a war handshake is still open', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof LB !== 'undefined' && typeof resumeWar === 'function');

  const r = await page.evaluate(() => {
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();

    // Fight a war, save it, and fake an open handshake for THAT war.
    lbSetConsent(true);
    startGame('destroyer'); skipBanner();
    LB.session = { session_id: 'war-A-session', nonce: 'deadbeef' };
    LB.practice = true;
    saveWar();
    const hadSession = !!LB.session;

    // Resuming must drop it. Otherwise the resumed fight would be submitted under the
    // handshake of a different war — wrong theater and difficulty on the board.
    resumeWar();
    return { hadSession, sessionAfterResume: LB.session, practiceAfterResume: LB.practice };
  });

  expect(r.hadSession).toBe(true);
  expect(r.sessionAfterResume).toBe(null);
  expect(r.practiceAfterResume).toBe(false);
});

test('a war abandoned to pick another ship is remembered, and the panel says why it is not ranked', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof LB !== 'undefined' && typeof openLeaderboard === 'function');

  const r = await page.evaluate(async () => {
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();

    // Every ship pick opens a handshake, and only endGame submits. Going back to the menu
    // and picking a different ship therefore throws the war away silently — six of those
    // in a row is what a real player did before deciding the leaderboard was broken.
    startGame('destroyer'); skipBanner();
    LB.session = { session_id: 'war-in-progress', nonce: 'deadbeef' };   // stand in for the handshake
    startGame('destroyer'); skipBanner();                                // ...and abandon it
    const outcome = LB.lastOutcome;

    // The panel is where that answer has to surface — an empty board with no explanation
    // is exactly what sent the player looking for a bug.
    openLeaderboard();
    await new Promise(res => setTimeout(res, 400));
    const why = document.getElementById('lbWhy');
    const shown = why ? why.textContent : '';
    const optOutStillThere = !!document.getElementById('lbForget') || !!document.getElementById('lbJoin');
    closeLeaderboard();
    return { reason: outcome && outcome.reason, shown, optOutStillThere };
  });

  expect(r.reason).toBe('abandoned');
  expect(r.shown).toMatch(/not finished|never finished|没打完/);
  expect(r.optOutStillThere).toBe(true);   // the warning is prepended, it does not replace the identity block
  expect(errors).toEqual([]);
});

test('a counted run leaves no why-not-ranked warning behind', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof LB !== 'undefined' && typeof openLeaderboard === 'function');
  const r = await page.evaluate(async () => {
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    LB.lastOutcome = { at: Date.now(), win: true, mode: 'campaign', reason: 'counted' };
    openLeaderboard();
    await new Promise(res => setTimeout(res, 400));
    const has = !!document.getElementById('lbWhy');
    closeLeaderboard();
    return { has };
  });
  expect(r.has).toBe(false);
});

test('the board name the results screen promises is the name the board actually shows', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof LB !== 'undefined' && typeof lbBoardName === 'function');
  const r = await page.evaluate(() => {
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();

    // Signed out: the callsign is the board name, and the copy explains where it came from.
    LB.sushi.user = null;
    startGame('destroyer'); skipBanner();
    endGame(true, 'test');
    const anon = { name: lbBoardName(), copy: document.getElementById('lbConsent').textContent };

    // Signed in: the server ranks the ACCOUNT, so the callsign never appears on the board.
    // Promising it is a name the player will never find.
    LB.sushi.user = { displayName: 'Brave Sushi 85069' };
    lbShowEnrolledNotice();
    const signedIn = { name: lbBoardName(), copy: document.getElementById('lbConsent').textContent };
    return { anon, signedIn, callsign: lbMyName() };
  });

  expect(r.anon.name).toBe(r.callsign);
  expect(r.anon.copy).toContain(r.callsign);
  expect(r.signedIn.name).toBe('Brave Sushi 85069');
  expect(r.signedIn.copy).toContain('Brave Sushi 85069');
  expect(r.signedIn.copy).not.toContain(r.callsign);      // the promise matches the board
});
