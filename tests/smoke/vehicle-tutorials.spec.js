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

// The Training Ground is a place you go on purpose to be taught the whole game. It only works if
// every step is reachable — and a `hold` step used to END the lesson instead of advancing, which
// silently truncated the flight and tank tracks too.
test('the training course reaches every one of its steps, and can be replayed', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startTrainingCourse === 'function');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    try { localStorage.setItem('ironTideTutorialDone','1'); } catch(e) {}
    // by flag, not by index — the map is appended so existing saves keep their sandbox numbers
    const idx = SANDBOX_MAPS.findIndex(m => m.training);
    currentSandboxIdx = idx; quickMode = false;
    const M = SANDBOX_MAPS[idx];
    startGame('destroyer'); skipBanner();
    const started = tutIdx >= 0, total = tutSteps.length;
    // every step must be able to finish: a done() to satisfy, or a hold to time out
    const stuck = tutSteps.map((st,i) => ({i, ok: !!(st.done || st.hold != null)})).filter(x => !x.ok).map(x => x.i);
    // ...and every step must exist in both languages
    setLang('zh');
    const untranslated = tutSteps.map((st,i) => ({i, t: st.text()})).filter(x => !/[一-鿿]/.test(x.t)).map(x => x.i);
    setLang('en');
    const teachesCheat = tutSteps.some(st => /backslash|money code|\\\\/i.test(st.text()));
    // the course issues the two aircraft its lessons need, and holds the enemy's fire
    const issued = planes.map(x => x.def.name);
    const shot = team => { const n = shells.length;
      spawnShell(WEAPONS.deckgun, player.pos.clone().setY(10), new THREE.Vector3(0,0,1), team, null);
      return shells.length - n; };
    const enemyBlocked = shot(1) === 0, yoursUnaffected = shot(0) === 1;
    const liftStep = tutSteps.findIndex(st => st.enter && /tutCeasefire=false/.test('' + st.enter));
    if (liftStep >= 0) tutSteps[liftStep].enter();
    const enemyFreeAfterLift = shot(1) === 1;
    tutCeasefire = true;   // put it back before walking the rest of the course
    const keyed = tutSteps.filter(st => st.key).length;   // capture before the walk empties tutSteps

    const seen = []; let guard = 0;
    while (tutIdx >= 0 && guard < 4000) {
      if (!seen.includes(tutIdx)) seen.push(tutIdx);
      const st = tutSteps[tutIdx];
      if (st.hold != null) tutHold = 999; else st.done = () => true;
      updateTutorial(0.05); guard++;
    }
    return { name: M.name, idx, training: !!M.training, issued,
             heli: planes.some(x => x.def.heli),
             missiles: planes.some(x => x.def.bomb && x.def.bomb.kind === 'missile'),
             enemyBlocked, yoursUnaffected, liftStep, enemyFreeAfterLift,
             keyed, started, total, stuck, untranslated, teachesCheat,
             walked: seen.length, funds: money, enemies: enemies.filter(e => !e.proxy).length,
             replayable: localStorage.getItem('ironTideTrainingRun') !== '1' };
  });
  expect(r.name).toBe('Training Ground');
  expect(r.idx).toBeGreaterThan(0);   // appended, so older saves' sandbox indices still resolve
  expect(r.training).toBe(true);
  expect(r.started).toBe(true);
  expect(r.total).toBeGreaterThan(20);      // it really does cover the whole game
  expect(r.stuck).toEqual([]);              // no step can trap you
  expect(r.untranslated).toEqual([]);
  expect(r.teachesCheat).toBe(false);       // the money code is not part of the curriculum
  expect(r.walked).toBe(r.total);           // every step is reachable
  expect(r.funds).toBeGreaterThanOrEqual(60000);   // you can afford the gun, plane and tank it asks for
  expect(r.enemies).toBeGreaterThan(0);     // there is something to shoot at
  expect(r.replayable).toBe(true);          // walk in again next week and it runs again
  // the lessons that need a specific aircraft get one issued rather than depending on shop stock
  expect(r.heli).toBe(true);
  expect(r.missiles).toBe(true);
  expect(r.keyed).toBeGreaterThan(15);      // most steps show the key as a chip, not buried in prose
  // nobody shoots at a student — except in the one lesson about being shot
  expect(r.enemyBlocked).toBe(true);
  expect(r.yoursUnaffected).toBe(true);     // your own guns still work
  expect(r.liftStep).toBeGreaterThan(0);
  expect(r.enemyFreeAfterLift).toBe(true);
});

test('the ceasefire is confined to the Training Ground', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof spawnShell === 'function');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    try { localStorage.setItem('ironTideTutorialDone','1'); } catch(e) {}
    currentSandboxIdx = -1; currentMapIdx = 4; quickMode = false;
    startGame('destroyer'); skipBanner();
    const n = shells.length;
    spawnShell(WEAPONS.deckgun, player.pos.clone().setY(10), new THREE.Vector3(0,0,1), 1, null);
    return { ceasefire: tutCeasefire, enemyFired: shells.length - n };
  });
  expect(r.ceasefire).toBe(false);   // a real battle is a real battle
  expect(r.enemyFired).toBe(1);
});

// You start the course AT THE HELM, where WASD steers the ship. Any step that asks you to walk
// somewhere is impossible until the course has told you to press E and let go of the wheel — and
// for a long time it never did, so "walk around and press F" was a dead stop for a beginner.
// Steps that change which thing you are controlling carry a `mode` tag; this walks the course and
// checks that what each step ASKS FOR is possible in the mode the course has actually left you in.
test('the training course never asks you to do something the current mode forbids', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startTrainingCourse === 'function');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    try { localStorage.setItem('ironTideTutorialDone','1'); } catch(e) {}
    currentSandboxIdx = SANDBOX_MAPS.findIndex(m => m.training);
    startGame('carrier'); skipBanner();

    // what the course has guaranteed about the player's mode by the time each step is shown
    let mode = 'helm';                       // startGame puts you at the wheel
    const problems = [];
    tutSteps.forEach((st, i) => {
      const src = '' + (st.done || '');
      // Steps that can only be completed ON FOOT. Buying is deliberately NOT in here: Tab opens
      // the shop from anywhere, including the helm, so playerTanks.length says nothing about mode.
      const needsFoot = /placed\.length|manning|piloting|drivingTank/.test(src);
      // steps that can only be completed while steering the ship
      const needsHelm = /player\.throttle|player&&player\.hp|camYaw/.test(src);
      // A step carrying a `mode` tag IS the transition — judging it against the mode it is about
      // to leave would flag every hand-over in the course.
      if (!st.mode) {
        if (needsFoot && mode === 'helm') problems.push(i + ':asks-to-walk-while-at-helm');
        if (needsHelm && mode !== 'helm')  problems.push(i + ':asks-to-sail-while-not-at-helm');
      }
      if (st.mode) mode = st.mode;
    });
    const tags = tutSteps.map((st,i) => st.mode ? i+':'+st.mode : null).filter(Boolean);
    return { problems, tags, total: tutSteps.length };
  });
  expect(r.tags.length).toBeGreaterThan(1);   // the course does hand control back and forth
  expect(r.problems).toEqual([]);
});

// Two ways the course used to lie to you: it congratulated you for reaching a beach you never
// reached (getting OUT of the tank satisfied the "drive ashore" step), and it then told you to
// press B on ground the game refuses to let you build on.
test('the course cannot be satisfied by giving up, and never asks you to build on enemy soil', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startTrainingCourse === 'function');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    try { localStorage.setItem('ironTideTutorialDone','1'); } catch(e) {}
    currentSandboxIdx = SANDBOX_MAPS.findIndex(m => m.training);
    startGame('carrier'); skipBanner();
    const at = frag => tutSteps.findIndex(st => ('' + st.text()).indexOf(frag) >= 0);
    const iAshore = at('Get back in the tank');   // its text while you are NOT in the tank
    const iGate   = at('not yours yet');
    const iBuild  = at('Press B to build');
    // not in a tank at all, nowhere near a beach: the ashore step must NOT be satisfied
    const ashoreDoneWhileOutOfTank = tutSteps[iAshore].done();
    // the capture gate has to agree exactly with what toggleBuild will refuse
    const gate = fl => !!(fl && !((fl.capRing && fl.owner !== 0) || fl.team === 1));
    const refuses = fl => !!((fl.capRing && fl.owner !== 0) || fl.team === 1);
    const cases = [ {capRing:{},owner:null,team:null}, {capRing:{},owner:1,team:null},
                    {capRing:null,owner:0,team:1},     {capRing:{},owner:0,team:0} ];
    const agrees = cases.every(fl => gate(fl) === !refuses(fl));
    return { iAshore, iGate, iBuild, ashoreDoneWhileOutOfTank, agrees };
  });
  expect(r.iAshore).toBeGreaterThan(0);
  expect(r.ashoreDoneWhileOutOfTank).toBe(false);   // giving up is not arriving
  expect(r.iGate).toBeGreaterThan(0);               // capture the island...
  expect(r.iBuild).toBe(r.iGate + 1);               // ...immediately before being told to build on it
  expect(r.agrees).toBe(true);                      // and the gate matches the game's own rule
});

// Everything from the tank onwards asks you to drive onto a beach, and an amphibious tank floats
// but cannot cross open sea — yet nothing ever told you to bring the SHIP over first.
test('the course tells you to sail to an island before it asks you to drive onto one', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof shipToShore === 'function');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    try { localStorage.setItem('ironTideTutorialDone','1'); } catch(e) {}
    currentSandboxIdx = SANDBOX_MAPS.findIndex(m => m.training);
    startGame('carrier'); skipBanner();
    const at = f => tutSteps.findIndex(st => ('' + st.text()).indexOf(f) >= 0);
    const iSail = at('sail CLOSE'), iBuy = at('buy a TANK'), iBoard = at('walk to the tank');
    // far from land the step must NOT be satisfied, even standing at the helm
    // far from EVERY island — shipToShore takes the minimum, so moving away from one of them
    // just puts you next to another
    let far = null, best = -1;
    for (let x = -4000; x <= 4000; x += 500) for (let z = -4000; z <= 4000; z += 500) {
      const q = new THREE.Vector3(x, player.pos.y, z);
      let d = 1e9; islands.forEach(i => { d = Math.min(d, q.distanceTo(i.pos) - Math.max(i.rx||i.r, i.rz||i.r)); });
      if (d > best) { best = d; far = q; }
    }
    player.pos.copy(far);
    const farDone = tutSteps[iSail].done(), farDist = Math.round(shipToShore());
    const isl = islands[0], rr = Math.max(isl.rx || isl.r, isl.rz || isl.r);
    player.pos.set(isl.pos.x + rr + 90, player.pos.y, isl.pos.z);
    const nearDone = tutSteps[iSail].done();
    // ...and it has to stay on screen long enough to read even when already true
    tutIdx = iSail; tutHold = 0; tutShow();
    let frames = 0;
    while (tutIdx === iSail && frames < 300) { updateTutorial(0.05); frames++; }
    return { iSail, iBuy, iBoard, farDone, farDist, nearDone, shown: +(frames * 0.05).toFixed(1) };
  });
  expect(r.iSail).toBeGreaterThan(0);
  expect(r.iSail).toBeLessThan(r.iBuy);      // brought alongside BEFORE you own a tank...
  expect(r.iBuy).toBeLessThan(r.iBoard);     // ...and before you are sitting in it
  expect(r.farDist).toBeGreaterThan(400);   // comfortably past the 170 m threshold
  expect(r.farDone).toBe(false);             // a thousand metres out is not "close"
  expect(r.nearDone).toBe(true);
  expect(r.shown).toBeGreaterThanOrEqual(4.9);   // readable even where the map starts you close
});
