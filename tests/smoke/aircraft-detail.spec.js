const { test, expect } = require('@playwright/test');

const PRE = () => {
  try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
  const b = document.getElementById('storyBtn'), s = document.getElementById('story');
  if (b && s && s.style.display === 'flex') b.click();
};

// aircraftFuselage builds a LatheGeometry — a compound curve — but aircraftSkin carries
// flatShading:true, so every fuselage, nacelle, engine pod, tail boom and ordnance body in the
// game came out faceted. Exactly the fault the gun barrels had, across 98 aircraft. Wings and
// fins are folded panel and must STAY flat: the split is the point, not "smooth everything".
test('curved airframe bodies are smooth-shaded, folded panels are not', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof buildPlane === 'function' && typeof aircraftFuselage === 'function');
  const r = await page.evaluate(() => {
    const fus = aircraftFuselage(5, 0.45, aircraftSkin(0xc6cad0));
    // a lathe is the shape that needs it...
    const lathe = { type: fus.geometry.type, flat: fus.material.flatShading };
    // ...and the plain skin, which wings and fins use, must be untouched
    const plainSkin = aircraftSkin(0xc6cad0).flatShading;

    // across a real aircraft: at least one smooth curved body AND at least one flat panel
    const g = buildPlane(PLANES.f22);
    let smooth = 0, flat = 0;
    g.traverse(o => { if (!o.isMesh || !o.material || o.material.flatShading === undefined) return;
      if (o.material.flatShading) flat++; else smooth++; });
    // the cache must actually be sharing, not minting a skin per mesh
    const before = Object.keys(_smoothSkins).length;
    for (const k of ['f18', 'spitfire', 'b2', 'a10']) buildPlane(PLANES[k]);
    return { lathe, plainSkin, smooth, flat, smoothSkinsAfterFivePlanes: Object.keys(_smoothSkins).length, before };
  });

  expect(r.lathe.type).toBe('LatheGeometry');
  expect(r.lathe.flat, 'a lathed fuselage must not be flat-shaded').toBe(false);
  expect(r.plainSkin, 'wings and fins must stay flat-shaded').toBe(true);
  expect(r.smooth, 'no smooth bodies on the aircraft at all').toBeGreaterThan(0);
  expect(r.flat, 'everything went smooth — panels lost their creases').toBeGreaterThan(0);
  // five aircraft must not mint five sets of skins
  expect(r.smoothSkinsAfterFivePlanes).toBeLessThan(24);
});

// Nothing in the game had wheels, and aircraft spend a lot of their life parked on your deck a
// few metres from where you stand.
//
// There used to be TWO undercarriages on every airframe: aircraftLandingGear()'s `userData.gear`
// and addAircraftGraphicDetails()'s `userData.gearVisuals`, both built, both drawn — six wheels
// where an aeroplane has three. And only the first was ever animated, from spinProp, which runs
// only for the aircraft the PLAYER is flying, so the whole AI air wing flew with its wheels down.
// One set now; this pins that there is exactly one, and that it follows the aircraft's phase.
test('aircraft have one set of landing gear, and it retracts in flight', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof buildPlane === 'function' && typeof setPlaneGearVisual === 'function');
  const r = await page.evaluate(() => {
    const g = buildPlane(PLANES.f22);
    const legs = g.userData.gearVisuals || [];
    const pa = { group: g };

    // count the actual wheels in the scene graph, not the bookkeeping array — the duplicate
    // system was invisible to any check that only looked at one of the two arrays
    let wheels = 0; g.traverse(o => { if (o.geometry && o.geometry.type === 'TorusGeometry') wheels++; });

    const builtDown = legs.every(l => l.visible);            // parked out of the box
    setPlaneGearVisual(pa, false);
    const upHidden = legs.every(l => !l.visible);
    setPlaneGearVisual(pa, true);
    const backDown = legs.every(l => l.visible);

    // helicopters and quadcopters carry skids/legs of their own and must not get wheels bolted on
    const heli = buildPlane(PLANES.apache);
    let heliWheels = 0; heli.traverse(o => { if (o.geometry && o.geometry.type === 'TorusGeometry') heliWheels++; });

    return { legCount: legs.length, wheels, builtDown, upHidden, backDown,
             legacyGear: (g.userData.gear || []).length, heliWheels };
  });

  expect(r.legCount, 'no landing gear at all').toBe(3);      // two main, one nose
  expect(r.wheels, 'an aeroplane has three wheels, not six').toBe(3);
  expect(r.legacyGear, 'the second, duplicate undercarriage is back').toBe(0);
  expect(r.builtDown, 'a freshly built aircraft should sit on its wheels').toBe(true);
  expect(r.upHidden, 'gear never retracts').toBe(true);
  expect(r.backDown, 'gear will not come back down').toBe(true);
  expect(r.heliWheels, 'a helicopter does not need wheels').toBe(0);
});

// 98 aircraft types and a sky full of them at once — detail on an airframe multiplies faster
// than on a turret, because every carrier launches a wing.
test('the extra aircraft detail stays inside budget', async ({ page }) => {
  test.setTimeout(180000);
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(([PRE_SRC]) => {
    eval('(' + PRE_SRC + ')()');
    const meshes = o => { let n = 0; o.traverse(x => { if (x.isMesh) n++; }); return n; };
    const per = Object.values(PLANES).map(d => meshes(buildPlane(d)));
    difficulty = 'hard'; currentSandboxIdx = -1; currentMapIdx = 26;
    startGame('carrier'); skipBanner();
    const dt = 1 / 30;
    for (let i = 0; i < 30 * 150; i++) { t2 += dt; update(dt, t2); }
    let scene_ = 0; scene.traverse(x => { if (x.isMesh) scene_++; });
    return { worst: Math.max(...per), avg: per.reduce((a, c) => a + c, 0) / per.length,
             airborne: aiPlanes.length, sceneMeshes: scene_ };
  }, [PRE.toString()]);

  expect(r.airborne, 'no aircraft were up — this proves nothing').toBeGreaterThan(2);
  expect(r.worst, 'one aircraft got extravagant').toBeLessThan(150);
  expect(r.avg).toBeLessThan(90);
  expect(r.sceneMeshes, 'scene mesh count ran away').toBeLessThan(17000);
});
