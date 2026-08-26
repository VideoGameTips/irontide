const { test, expect } = require('@playwright/test');

// The sweep in all-campaigns.spec.js proves every theatre BOOTS and RUNS. This asks the other
// half: can each one actually be finished, and does finishing it move the campaign forward.
// A theatre whose win condition can never fire is a dead end a player can sink hours into.
const winOne = ([idx]) => {
  try { localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
  const b = document.getElementById('storyBtn'), s = document.getElementById('story');
  if (b && s && s.style.display === 'flex') b.click();
  career.mapsUnlocked = 40; career.wins = 5;      // not a first war, so the HQ is the objective
  difficulty = 'normal'; currentSandboxIdx = -1; currentMapIdx = idx;
  startGame('destroyer'); skipBanner();

  const M = window._MAP || {};
  const before = career.mapsUnlocked;
  career.mapsUnlocked = idx + 1;                  // exactly this far: winning must unlock idx+2

  // Drive the theatre's OWN objective to completion rather than calling endGame directly.
  let how;
  if (M.ground) { how = 'islands'; islands.filter(i => i.capturable).forEach(i => setIslandOwner(i, 0, true)); }
  else if (firstWar) { how = 'sink'; sunk = FIRST_WAR_GOAL; }
  // through damageHarbor, not by writing hp: the win fires inside that function, and its
  // `if(h.hp<=0) return` guard means a harbour zeroed by hand can never trigger it again
  else { how = 'harbor'; damageHarbor(enemyHarbor, enemyHarbor.hp + 1); }

  // step until the game notices, but not forever
  let steps = 0;
  for (; steps < 400 && phase === 'play'; steps++) {
    t2 += 1 / 30; update(1 / 30, t2);
  }
  return { idx, name: M.name, how, phase, steps, unlocked: career.mapsUnlocked,
           expectUnlock: Math.min(CAMPAIGN.length, idx + 2), before };
};

test('every campaign theatre can be won, and winning unlocks the next one', async ({ page }) => {
  test.setTimeout(10 * 60 * 1000);
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const n = await page.evaluate(() => CAMPAIGN.length);

  const out = [];
  for (let i = 0; i < n; i++) out.push(await page.evaluate(winOne, [i]));
  out.forEach(r => console.log('WIN ' + JSON.stringify(r)));

  const stuck = out.filter(r => r.phase !== 'over');
  console.log('WINSWEEP ' + JSON.stringify({ total: out.length, stuck: stuck.length,
    stuckNames: stuck.map(s => s.name) }));

  expect(out.length).toBe(n);
  expect(stuck.map(s => ({ name: s.name, how: s.how, phase: s.phase })),
    'a theatre could not be finished through its own win condition').toEqual([]);
  out.forEach(r => expect(r.unlocked, r.name + ' did not unlock the next theatre').toBe(r.expectUnlock));
});
