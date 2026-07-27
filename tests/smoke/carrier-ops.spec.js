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
      parkedSideways: planes.every(p => Math.abs(p.group.rotation.y - Math.PI/2) < 0.01),
      parkingClear: planeSpots.every(sp => clearOfRunway(sp.pos.x)),
      padClear: clearOfRunway(deckPlan.padPos.x),
      padAft: deckPlan.padPos.z < 0,                 // helipad in the aft corner
      padStarboard: deckPlan.padPos.x > deckPlan.runX,
      runwayLen: deckPlan.runZ1 - deckPlan.runZ0,
    };
  });
  expect(r.spots).toBeGreaterThan(1);
  expect(r.parkedSideways).toBe(true);      // aircraft ranged across the deck, as on a real flat-top
  expect(r.parkingClear).toBe(true);        // ...and never blocking the strip
  expect(r.padClear).toBe(true);
  expect(r.padAft).toBe(true);
  expect(r.padStarboard).toBe(true);
  expect(r.runwayLen).toBeGreaterThan(40);
});

test('taxi, rotate, land and it stays where it stopped', async ({ page }) => {
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
    const stoppedPlane = planes[0];
    return { parkedYaw, boardedYaw, refused, afterQ, airborne, landingPhase, rollout,
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
  expect(r.stillFlying).toBe(false);
  expect(r.planeCount).toBe(1);
  expect(r.parked).toBe(true);
  expect(r.adhocSpot).toBe(true);                     // it kept the spot where it actually stopped
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
