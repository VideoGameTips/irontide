const { test, expect } = require('@playwright/test');

// Reported from the live game: the top-left notifications overlap, some vanish before you can
// read them, and unimportant ones crowd out the rest. Three separate faults:
//   * the radio log kept a flat six lines and shifted the oldest out the moment a seventh
//     arrived, so a burst of fleet chatter pushed messages off unread;
//   * every ally status change ("moving to secure X", "threat clear") was radioed at the same
//     weight as a distress call;
//   * every shell that connected minted its own kill-feed line, so holding the trigger on one
//     tank produced five copies of "HIT · TANK" and shoved the actual kill off the top.
const boot = () => {
  try { localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
  if (typeof dismissSplash === 'function') dismissSplash();
  const sp = document.getElementById('splash'); if (sp && sp.parentNode) sp.parentNode.removeChild(sp);
  career.wins = 5; career.mapsUnlocked = 40; SETTINGS.simpleHud = false;
  difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 3;
  startGame('destroyer'); skipBanner();
  for (let i = 0; i < 20; i++) { t2 += 0.05; update(0.05, t2); }
  _commsLines.length = 0;
};

test('routine chatter never pushes a real message off the radio', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof comms === 'function');
  const r = await page.evaluate(([SRC]) => {
    eval('(' + SRC + ')()');
    const out = {};
    // a real message, then a flood of fleet chatter
    comms('COMMAND', 'Enemy flagship sighted to the north.', '#fff', 1);
    for (let i = 0; i < 12; i++) comms('ALPHA-' + i, 'Moving to secure the island.', '#7fd0a0', 0);
    out.realSurvived = _commsLines.some(L => /flagship/.test(L.msg));
    out.chatterShown = _commsLines.filter(L => L.prio < 1).length;
    out.total = _commsLines.length;

    // with the board clear, chatter IS allowed — the radio should still feel alive
    _commsLines.length = 0;
    comms('ALPHA-1', 'Threat clear — resuming patrol.', '#a8d4f0', 0);
    out.chatterAloneShows = _commsLines.length;

    // a burst of REAL traffic must not drop anything nobody has had time to read
    _commsLines.length = 0;
    for (let i = 0; i < 8; i++) comms('SHIP-' + i, 'Urgent message ' + i, '#fff', 1);
    out.burstKept = _commsLines.length;
    out.burstAllFresh = _commsLines.every(L => L.life - L.t < 3.0);

    // ...but once they have been up a while, the feed trims back down
    _commsLines.forEach(L => { L.t -= 4; });
    comms('SHIP-X', 'One more', '#fff', 1);
    out.afterAging = _commsLines.length;

    // urgent messages live longer than filler
    _commsLines.length = 0;
    comms('A', 'urgent', '#fff', 2); comms('B', 'normal', '#fff', 1);
    out.urgentLife = _commsLines.find(L => L.msg === 'urgent').life;
    out.normalLife = _commsLines.find(L => L.msg === 'normal').life;
    return out;
  }, [boot.toString()]);
  console.log('RADIO ' + JSON.stringify(r));

  expect(r.realSurvived, 'chatter buried the message that mattered').toBe(true);
  expect(r.chatterShown, 'chatter got on screen while a real message was up').toBe(0);
  expect(r.chatterAloneShows, 'the radio went silent when nothing else was happening').toBe(1);
  expect(r.burstKept, 'a burst of real traffic dropped messages nobody had read').toBe(8);
  expect(r.burstAllFresh).toBe(true);
  expect(r.afterAging, 'the feed never trims back down once messages have been read').toBeLessThan(8);
  expect(r.urgentLife).toBeGreaterThan(r.normalLife);
});

test('repeated hits on the same target collapse into one line', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(([SRC]) => {
    eval('(' + SRC + ')()');
    const feed = document.getElementById('killfeed');
    feed.innerHTML = '';
    const lines = () => [...feed.children].map(c => c.textContent);
    // five shells into the same tank
    for (let i = 0; i < 5; i++) showHit('TANK', false, '');
    const afterHits = lines();
    // then it dies — the kill must be its OWN line, not folded into the hit counter
    showHit('TANK', true, '');
    const afterKill = lines();
    // a different target starts a new line
    showHit('BUNKER', false, '');
    const afterOther = lines();
    return { afterHits, afterKill, afterOther };
  }, [boot.toString()]);
  console.log('KILLFEED ' + JSON.stringify(r));

  expect(r.afterHits.length, 'five hits on one target still make five lines').toBe(1);
  expect(r.afterHits[0], 'the repeat counter is missing').toMatch(/[×x]\s*5/);
  expect(r.afterKill.length, 'the kill was folded into the hit line').toBe(2);
  expect(r.afterKill[0], 'the kill is not on top').toMatch(/DESTROYED|击毁|摧毁/i);
  expect(r.afterOther.length, 'a different target did not start its own line').toBe(3);
});
