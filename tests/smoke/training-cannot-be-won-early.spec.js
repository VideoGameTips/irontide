const { test, expect } = require('@playwright/test');

// The Training Ground is a lesson, not a battle to be won. Its enemy HQ sits 900 m off the bow and
// is the softest harbour in the game — sandbox maps carry reinforce 0, so the theater-scaled hqHp
// bottoms out — which meant a player who shoots straight could flatten it around the "here is how
// a deck gun works" step and be handed a victory screen with two thirds of the course unplayed.
test('the enemy HQ cannot be destroyed into a win while the course is still running', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startTrainingCourse === 'function' && typeof damageHarbor === 'function');
  const r = await page.evaluate(() => {
    try { localStorage.clear(); } catch (e) {}
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();

    const idx = SANDBOX_MAPS.findIndex(m => m.training);
    currentSandboxIdx = idx; currentMapIdx = 0; difficulty = 'easy';
    startGame('destroyer'); skipBanner();
    startTrainingCourse();

    let ended = null;
    const real = window.endGame;
    // record only a REAL ending: the wrapper used to log the attempt, so a refused endGame(true)
    // still looked like the game had ended and the test failed itself
    window.endGame = (win, msg) => { real(win, msg); if (ended === null && phase === 'over') ended = { win, msg }; };

    const steps = tutSteps ? tutSteps.length : 0;
    const hqStart = enemyHarbor.maxhp, atStep = tutIdx;
    // empty the magazine into it, several times over
    for (let i = 0; i < 200; i++) damageHarbor(enemyHarbor, 500);
    const during = { hq: Math.round(enemyHarbor.hp), ended: ended !== null, phase, stillTeaching: tutIdx >= 0 };

    // And the refusal must live in endGame itself, not only in the harbour floor. Otherwise any
    // OTHER win path — capturing every island, a quick-battle kill goal, anything added later —
    // still ends the course early. Call it directly to prove the guard is the thing stopping it.
    endGame(true, 'direct call during the course');
    const direct = { ended: ended !== null, phase };

    // now let the course be over and try again — the level must be winnable normally
    tutIdx = -1;
    for (let i = 0; i < 200; i++) damageHarbor(enemyHarbor, 500);
    const after = { ended: ended !== null, won: !!(ended && ended.win), phase };

    window.endGame = real;
    return { idx, steps, hqStart, atStep, during, direct, after };
  });

  expect(r.idx).toBeGreaterThanOrEqual(0);        // the training map exists
  expect(r.steps).toBeGreaterThan(20);            // ...and it really is a long course to cut short
  expect(r.atStep).toBe(0);                       // we attacked from the very first lesson

  // mid-course: no win, still playing, still teaching
  expect(r.during.ended).toBe(false);
  expect(r.during.phase).toBe('play');
  expect(r.during.stillTeaching).toBe(true);
  // ...and the harbour is held at a sliver rather than left sitting at zero, so it can still be
  // finished off properly once the lessons are done
  expect(r.during.hq).toBeGreaterThan(0);
  expect(r.during.hq).toBeLessThan(r.hqStart);    // it did take real damage — the guard isn't invulnerability

  // a direct win attempt is refused too, so every win path is covered, not just harbour damage
  expect(r.direct.ended).toBe(false);
  expect(r.direct.phase).toBe('play');

  // course over: the same shots win, exactly as on any other map
  expect(r.after.ended).toBe(true);
  expect(r.after.won).toBe(true);
  expect(r.after.phase).toBe('over');
});
