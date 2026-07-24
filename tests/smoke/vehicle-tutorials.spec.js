const { test, expect } = require('@playwright/test');
// The issue's own checklist: each vehicle teaches itself once, never twice, and the two tracks
// are independent (learning the plane must not silence the tank lesson).
test('plane and tank tutorials fire once each and are independent', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startPlaneTutorial === 'function');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    localStorage.removeItem(TUT_PLANE_KEY); localStorage.removeItem(TUT_TANK_KEY);
    startGame('carrier'); skipBanner();

    const reset = () => { tutIdx = -1; tutSteps = null; };
    // Both tutorials refuse unless you are actually in the vehicle — they build their steps from
    // it. Stand in for that the way the game does: a plane you are piloting, a tank you crew.
    const planeDef = Object.values(PLANES).find(d => d.guns && !d.uav && !d.heli);
    piloting = { plane: { def: planeDef }, phase: 'fly', pos: player.pos.clone(), speed: 40 };

    reset(); startPlaneTutorial();
    const plane1 = { steps: tutSteps ? tutSteps.length : 0, idx: tutIdx, key: tutDoneKey };

    // finishing it writes ONLY the plane flag
    skipTutorial();
    const afterPlane = { planeFlag: localStorage.getItem(TUT_PLANE_KEY),
                         tankFlag: localStorage.getItem(TUT_TANK_KEY) };

    // a second flight teaches nothing
    reset(); startPlaneTutorial();
    const plane2 = { steps: tutSteps ? tutSteps.length : 0, idx: tutIdx };

    // but the tank still gets its own lesson
    piloting = null;
    const tankDef = Object.values(TANKS)[0];
    drivingTank = { def: tankDef, name: tankDef.name, hp: 100, maxhp: 100,
                    pos: player.pos.clone(), group: { position: player.pos.clone() }, heading: 0 };
    reset(); startTankTutorial();
    const tank1 = { steps: tutSteps ? tutSteps.length : 0, idx: tutIdx, key: tutDoneKey };
    skipTutorial();
    const afterTank = { tankFlag: localStorage.getItem(TUT_TANK_KEY) };
    reset(); startTankTutorial();
    const tank2 = { idx: tutIdx };

    drivingTank = null;
    localStorage.removeItem(TUT_PLANE_KEY); localStorage.removeItem(TUT_TANK_KEY);
    return { plane1, afterPlane, plane2, tank1, afterTank, tank2 };
  });
  expect(r.plane1.steps).toBeGreaterThan(0);        // the plane teaches on first flight
  expect(r.plane1.idx).toBeGreaterThanOrEqual(0);
  expect(r.plane1.key).toBe('ironTideTutorialPlaneDone');
  expect(r.afterPlane.planeFlag).toBe('1');
  expect(r.afterPlane.tankFlag).toBe(null);          // and does NOT mark the tank as taught
  expect(r.plane2.idx).toBe(-1);                     // second flight teaches nothing
  expect(r.tank1.steps).toBeGreaterThan(0);          // tank still gets its own lesson
  expect(r.tank1.key).toBe('ironTideTutorialTankDone');
  expect(r.afterTank.tankFlag).toBe('1');
  expect(r.tank2.idx).toBe(-1);
  expect(errors).toEqual([]);
});
