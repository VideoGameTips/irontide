const { test, expect } = require('@playwright/test');
// The full carrier-deck cycle: board facing the way the aircraft was parked, taxi to the
// runway, Q to rotate, fly, land it yourself, roll out, and it stays where it stopped.
test('deck layout keeps runway, parking and helipad separate', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof deckPlan !== 'undefined');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    startGame('carrier'); skipBanner(); money=99999;
    for(let i=0;i<4;i++) buyPlane('fighter');
    const clearOfRunway = p => Math.abs(p - deckPlan.runX) > deckPlan.runHalfW;
    return {
      spots: planeSpots.length,
      // ranged on a slant: neither nose-forward down the deck nor square across the beam
      parkAngles: planes.map(p => p.group.rotation.y),
      parkingClear: planeSpots.every(sp => clearOfRunway(sp.pos.x)),
      parkingToPort: planeSpots.every(sp => sp.pos.x < deckPlan.runX),
      carrierHasNoSponson: !player.build.ext,
      padClear: clearOfRunway(deckPlan.padPos.x),
      padAft: deckPlan.padPos.z < 0,                 // helipad in the aft corner
      padStarboard: deckPlan.padPos.x > deckPlan.runX,
      runwayLen: deckPlan.runZ1 - deckPlan.runZ0,
      // and no gun mount may sit on the strip, the apron or the pad — a turret there is a
      // turret parked on the runway, which is the one collision the deck rules can't excuse
      mountsOnFlightDeck: player.build.mounts.filter(m =>
        (Math.abs(m.x - deckPlan.runX) < deckPlan.runHalfW + 1 && m.z > deckPlan.runZ0 - 1 && m.z < deckPlan.runZ1 + 1) ||
        planeSpots.some(sp => Math.hypot(m.x - sp.pos.x, m.z - sp.pos.z) < 3.4) ||
        Math.hypot(m.x - deckPlan.padPos.x, m.z - deckPlan.padPos.z) < deckPlan.padR + 1.2).length,
    };
  });
  expect(r.spots).toBeGreaterThan(1);
  for (const a of r.parkAngles) {
    // all leaning the same way, so from the deck a ranged row reads ////// not \\\\\\
    expect(a).toBeGreaterThan(0.35);             // not lined up along the deck...
    expect(a).toBeLessThan(Math.PI / 2 - 0.15);  // ...and not square across it either
  }
  expect(r.parkingClear).toBe(true);        // never blocking the strip
  expect(r.parkingToPort).toBe(true);       // on a carrier the air wing lives on the port side
  expect(r.carrierHasNoSponson).toBe(true); // a carrier already IS a flight deck
  expect(r.padClear).toBe(true);
  expect(r.padAft).toBe(true);
  expect(r.padStarboard).toBe(true);
  expect(r.runwayLen).toBeGreaterThan(40);
  expect(r.mountsOnFlightDeck).toBe(0);
});

test('every hull keeps its guns off the flight deck, and the sub has no flight deck at all', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof deckPlan !== 'undefined');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    const offenders = [];
    for (const hull of Object.keys(SHIPS)) {
      startGame(hull); skipBanner();
      if (SHIPS[hull].kind === 'sub') { if (deckPlan) offenders.push(hull + ':sub-has-runway'); continue; }
      const dp = deckPlan;
      const onFlightDeck = (x, z, pad) =>
        (Math.abs(x - dp.runX) < dp.runHalfW + 1 && z > dp.runZ0 - 1 && z < dp.runZ1 + 1) ||
        planeSpots.some(sp => Math.hypot(x - sp.pos.x, z - sp.pos.z) < 3.4) ||
        Math.hypot(x - dp.padPos.x, z - dp.padPos.z) < dp.padR + pad;
      const bad = player.build.mounts.filter(m => onFlightDeck(m.x, m.z, 1.2)).length;
      if (bad) offenders.push(hull + ':guns:' + bad);
      // parked tanks are obstacles aircraft crash into, so their slots must clear it too
      const badTanks = tankSpots.filter(sp => onFlightDeck(sp.pos.x, sp.pos.z, 1.8) ||
        Math.abs(sp.pos.x) > player.build.halfBeam * 0.98 ||
        Math.abs(sp.pos.z) > player.build.halfLen * 0.98).length;
      if (badTanks) offenders.push(hull + ':tanks:' + badTanks);
    }
    // a submarine's aircraft launch straight off the casing rather than taxiing a 7 m cylinder
    startGame('submarine'); skipBanner(); money = 99999;
    buyPlane('fighter'); flyPlane(planes[0]);
    return { offenders, subPhase: piloting && piloting.phase, hulls: Object.keys(SHIPS).length };
  });
  expect(r.hulls).toBeGreaterThan(25);
  expect(r.offenders).toEqual([]);
  expect(r.subPhase).toBe('takeoff');       // no taxi phase without a runway
});

// Every non-carrier flies off a sponson cantilevered over the starboard side, because the hull
// between the deckhouse and the funnels has no lane wide enough to taxi down. The strip only
// counts if an aircraft can actually get airborne from it, so fly one off each of them.
test('every non-carrier hull can launch an aircraft off its starboard sponson', async ({ page }) => {
  test.setTimeout(180000);
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof SHIPS !== 'undefined');
  const hulls = await page.evaluate(() => Object.keys(SHIPS).filter(k => SHIPS[k].kind === 'surface'));
  expect(hulls.length).toBeGreaterThan(15);

  const failures = [];
  // Reload every few hulls: startGame does not free the previous battle's meshes (a known,
  // pre-existing leak), so a single page walking two dozen hulls slows to a crawl and the
  // simulation loop below stops finishing inside the timeout.
  for (let i = 0; i < hulls.length; i += 4) {
    const batch = hulls.slice(i, i + 4);
    await page.goto('http://localhost:3000/');
    await page.waitForFunction(() => typeof dispatchPlane === 'function');
    const bad = await page.evaluate(list => {
      const b=document.getElementById('storyBtn'), s=document.getElementById('story');
      if(b&&s&&s.style.display==='flex') b.click();
      const out=[];
      for (const hull of list) {
        startGame(hull); skipBanner(); money = 99999;
        if (!player.build.ext) { out.push(hull + ':no-sponson'); continue; }
        buyPlane('fighter');
        const pa = planes[0], before = aiPlanes.length;
        dispatchPlane(pa);
        for (let k = 0; k < 340 && pa.aiTaxi; k++) { t2 += 0.05; update(0.05, t2); }
        if (aiPlanes.length - before !== 1 || planes.length !== 0) out.push(hull + ':' + promptMsg);
      }
      return out;
    }, batch);
    failures.push(...bad);
  }
  expect(failures).toEqual([]);
});

test('taxi, rotate, land, and she taxis herself back to her box', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof parkWhereItStopped === 'function');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    startGame('carrier'); skipBanner(); money=99999;
    buyPlane('fighter'); const pa=planes[0];
    const parkedYaw = pa.group.rotation.y;
    flyPlane(pa);
    const boardedYaw = piloting.taxiYaw;              // you take it as it sits
    const K=k=>{ for(const x in keys) if(x.startsWith('Key')) keys[x]=0; (k||[]).forEach(x=>keys[x]=1); };
    const go=(n,k)=>{ K(k); for(let i=0;i<n && piloting;i++){ t2+=0.05; update(0.05,t2); } K([]); };
    const g=player.build.group;

    // Q on the apron is refused — you have to be lined up on the strip
    go(2,['KeyQ']); const refused = piloting.phase;

    // line up and take off
    piloting.deckLocal=new THREE.Vector3(deckPlan.runX, deckPlan.y+1, deckPlan.runZ0+2);
    piloting.pos.copy(g.localToWorld(piloting.deckLocal.clone())); piloting.taxiYaw=0;
    go(50,['KeyW']); go(2,['KeyW','KeyQ']);
    const afterQ = piloting?.phase;
    go(60,[]); const airborne = piloting?.phase;

    // fly it back down onto the deck yourself
    const wp=g.getWorldPosition(new THREE.Vector3());
    piloting.pos.set(wp.x, wp.y+40, wp.z-70); camYaw.v=0;
    toggleMan(); const landingPhase = piloting?.phase;
    // descend until the wheels are down, capturing the rollout phase whenever it appears
    let rollout=null;
    for(let i=0;i<90 && piloting; i++){ t2+=0.05; update(0.05,t2); if(piloting && piloting.phase==='rollout') rollout='rollout'; }
    for(let i=0;i<140 && piloting && piloting.phase==='rollout'; i++){ K(['KeyS']); t2+=0.05; update(0.05,t2); }
    K([]);
    // ...and after the rollout she taxis herself back to a parking box rather than being left
    // stopped on the runway, so give her the time to get there
    let taxiedHome = false;
    for (let i = 0; i < 400 && piloting; i++) { if (piloting.phase === 'taxihome') taxiedHome = true; t2 += 0.05; update(0.05, t2); }
    K([]);
    const stoppedPlane = planes[0];
    const onSpot = stoppedPlane && stoppedPlane.spot
      ? Math.hypot(stoppedPlane.group.position.x - stoppedPlane.spot.pos.x,
                   stoppedPlane.group.position.z - stoppedPlane.spot.pos.z) : 999;
    return { parkedYaw, boardedYaw, refused, afterQ, airborne, landingPhase, rollout, taxiedHome, onSpot,
             stillFlying: !!piloting, planeCount: planes.length,
             adhocSpot: !!(stoppedPlane && stoppedPlane.spot && stoppedPlane.spot.adhoc),
             parked: !!(stoppedPlane && stoppedPlane.parked) };
  });
  expect(r.boardedYaw).toBeCloseTo(r.parkedYaw, 2);   // board facing exactly how it was parked
  expect(r.refused).toBe('taxi');                     // Q off the runway does nothing
  expect(r.afterQ).toBe('takeoff');
  expect(r.airborne).toBe('fly');
  expect(r.landingPhase).toBe('landing');
  expect(r.rollout).toBe('rollout');                  // touchdown becomes a rollout, not a teleport
  expect(r.taxiedHome).toBe(true);                    // stopped on the strip is not parked
  expect(r.stillFlying).toBe(false);
  expect(r.planeCount).toBe(1);
  expect(r.parked).toBe(true);
  expect(r.adhocSpot).toBe(false);                    // she is in a real box, not stranded mid-deck
  expect(r.onSpot).toBeLessThan(0.5);                 // and actually ON it
});

// Committing to an approach you cannot complete is worse than being told no.
test('you cannot start a landing with nowhere to park', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof freeSpotFor === 'function');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    gameSettings.autoTakeoff = true;
    startGame('destroyer'); skipBanner(); money = 99999;
    buyPlane('fighter'); const pa = planes[0];
    flyPlane(pa);
    for (let i = 0; i < 320 && piloting && piloting.phase !== 'fly'; i++) { t2 += 0.05; update(0.05, t2); }
    gameSettings.autoTakeoff = false;
    const airborne = piloting && piloting.phase;
    const spotFreedOnTakeoff = !pa.spot.taken;      // her box is released while she is up
    pa.spot.taken = true;                            // somebody else took it
    startLanding(); const refused = piloting.phase;
    pa.spot.taken = false;
    startLanding(); const allowed = piloting.phase;
    piloting = null;
    return { airborne, spotFreedOnTakeoff, refused, allowed };
  });
  expect(r.airborne).toBe('fly');
  expect(r.spotFreedOnTakeoff).toBe(true);
  expect(r.refused).toBe('fly');       // deck full — stays airborne
  expect(r.allowed).toBe('landing');   // a box opens up, and the approach is on
});

test('taxiing into deck gear wrecks the aircraft; ditching puts the pilot in the water', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof ditchInOcean === 'function');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    const K=k=>{ for(const x in keys) if(x.startsWith('Key')) keys[x]=0; (k||[]).forEach(x=>keys[x]=1); };
    const go=(n,k)=>{ K(k); for(let i=0;i<n && piloting;i++){ t2+=0.05; update(0.05,t2); } K([]); };

    // taxi into a turret
    startGame('carrier'); skipBanner(); money=99999;
    buyPlane('fighter'); flyPlane(planes[0]);
    const g=player.build.group, t=placed[0];
    piloting.deckLocal=new THREE.Vector3(t.group.position.x, deckPlan.y+1, t.group.position.z-8);
    piloting.pos.copy(g.localToWorld(piloting.deckLocal.clone())); piloting.taxiYaw=0;
    go(30,['KeyW']);
    const hitGear = { flying: !!piloting, planes: planes.length };

    // ditch in the sea
    startGame('carrier'); skipBanner(); money=99999;
    buyPlane('fighter'); flyPlane(planes[0]);
    piloting.deckLocal=new THREE.Vector3(deckPlan.runX, deckPlan.y+1, deckPlan.runZ0+2);
    piloting.pos.copy(g.localToWorld(piloting.deckLocal.clone())); piloting.taxiYaw=0;
    go(50,['KeyW']); go(2,['KeyW','KeyQ']); go(60,[]);
    piloting.pos.set(2000, 26, 2000); toggleMan(); go(140,[]);
    return { hitGear, ditched: { flying: !!piloting, planes: planes.length, inWater: onFoot === true } };
  });
  expect(r.hitGear.flying).toBe(false);      // hitting a turret destroys it
  expect(r.hitGear.planes).toBe(0);
  expect(r.ditched.flying).toBe(false);
  expect(r.ditched.planes).toBe(0);          // airframe lost
  expect(r.ditched.inWater).toBe(true);      // and the pilot swims home
});

// The deck rules bind everyone, not just the player: an aircraft the AI flies out (Y) taxis
// from its parking spot like you do and can wreck itself doing it, and enemy carriers fly
// their air wing off the bow instead of conjuring it at altitude.
test('AI-flown and enemy aircraft use the deck too', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof updateAITaxi === 'function');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    const step=(n,stop)=>{ for(let i=0;i<n;i++){ t2+=0.05; update(0.05,t2); if(stop&&stop()) return i; } return -1; };

    // Y: the AI taxis out under its own power and gets airborne
    startGame('carrier'); skipBanner(); money=99999;
    buyPlane('fighter'); const pa=planes[0]; const before=aiPlanes.length;
    dispatchPlane(pa);
    const taxiing = !!pa.aiTaxi;
    step(260, ()=>!pa.aiTaxi);
    const dispatched = { taxiing, launched: aiPlanes.length-before, leftOnDeck: planes.length };

    // ...and the same obstacle rules kill it: park it on top of a turret and send it
    startGame('carrier'); skipBanner(); money=99999;
    buyPlane('fighter'); const pb=planes[0], t=placed[0];
    dispatchPlane(pb);
    pb.aiTaxi.lp.set(t.group.position.x, deckPlan.y+1, t.group.position.z-2);
    pb.aiTaxi.yaw=0; pb.aiTaxi.speed=12;
    const n0=aiPlanes.length;
    step(50, ()=>!pb.aiTaxi);
    const aiCrash = { planes: planes.length, launched: aiPlanes.length-n0 };

    // enemy carrier: the aircraft rolls the length of the deck before it exists as an AI plane
    startGame('destroyer'); skipBanner();
    const foe=enemies.find(e=>!e.proxy && e.sinkT===0);
    foe.planeT=0.01; step(4);
    const rolling=deckRolls.length; const a0=aiPlanes.length;
    step(320, ()=>deckRolls.length===0);
    return { dispatched, aiCrash, npc:{ rolling, done: deckRolls.length===0, launched: aiPlanes.length-a0 } };
  });
  expect(r.dispatched.taxiing).toBe(true);     // Y no longer teleports it into the air
  expect(r.dispatched.launched).toBe(1);
  expect(r.dispatched.leftOnDeck).toBe(0);
  expect(r.aiCrash.planes).toBe(0);            // an AI pilot can wreck it on deck gear too
  expect(r.aiCrash.launched).toBe(0);
  expect(r.npc.rolling).toBeGreaterThan(0);    // enemy aircraft start on the deck...
  expect(r.npc.done).toBe(true);
  expect(r.npc.launched).toBeGreaterThan(0);   // ...and become airborne only off the bow
});

// Deck markings are drawn on top of a plate that deckPlanform extrudes UPWARD from deckY — 0.5
// thick on a carrier, 0.28 on everyone else. Painted at deckY they end up buried inside the deck
// and only polygonOffset drags them into view, which showed up as a helipad rendering as a sliver
// at the deck edge. Assert the paint is genuinely above the surface it is painted on.
test('deck markings sit on top of the deck, not inside it', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof paintFlightDeck === 'function');
  const r = await page.evaluate(() => {
    const bad = [];
    for (const hull of Object.keys(SHIPS)) {
      if (SHIPS[hull].kind === 'sub') continue;
      startGame(hull); skipBanner();
      const carrier = SHIPS[hull].kind === 'carrier';
      const plateTop = player.def.deckY + (carrier ? 0.5 : 0.28);
      // every polygon-offset marking mesh the painter added, measured in the SHIP's frame —
      // the parking boxes are nested in a group, so their local y is 0 and means nothing
      let lowest = Infinity;
      const v = new THREE.Vector3();
      player.build.group.updateMatrixWorld(true);
      player.build.group.traverse(o => {
        if (!(o.material && o.material.polygonOffset && o.geometry)) return;
        o.getWorldPosition(v);
        lowest = Math.min(lowest, player.build.group.worldToLocal(v.clone()).y);
      });
      if (lowest < plateTop) bad.push(`${hull}: paint at ${lowest.toFixed(2)} under deck ${plateTop.toFixed(2)}`);
      // ...and the whole helipad ring has to be on deck, not overhanging the tapered stern
      const dp = deckPlan, w = deckHalfWidthAt(player.build, dp.padPos.z, carrier);
      if (Math.abs(dp.padPos.x) + dp.padR > w - 0.5) bad.push(`${hull}: pad overhangs`);
    }
    return bad;
  });
  expect(r).toEqual([]);
});
