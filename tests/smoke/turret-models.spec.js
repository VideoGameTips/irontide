const { test, expect } = require('@playwright/test');

// Every gun and cannon in the game used to come out of one branch of buildTurret: a box housing
// with N cylinders through it. A 16-inch Mk 7 battery and an M2 Browning were the SAME mesh at
// different scales — 19 of 29 weapons shared one model, and only the Phalanx had its own.
test('weapons are no longer all the same mount', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof buildTurret === 'function' && typeof turretArchetype === 'function');
  const r = await page.evaluate(() => {
    const shape = o => { const c = {}; o.traverse(x => { if (!x.isMesh) return;
      const t = x.geometry.type; c[t] = (c[t] || 0) + 1; }); return c; };
    const sig = o => JSON.stringify(shape(o));
    const per = {}, arch = {}, sigs = {};
    for (const [id, w] of Object.entries(WEAPONS)) {
      const t = buildTurret(w);
      let n = 0; t.traverse(x => { if (x.isMesh) n++; });
      per[id] = n; arch[id] = turretArchetype(w); sigs[id] = sig(t);
      // the aiming rig every caller depends on must survive whatever the model looks like
      if (!t.userData.yawG || !t.userData.pitchG || !(t.userData.barrelLen > 0)) per[id] = -1;
    }
    return { per, arch, distinctShapes: new Set(Object.values(sigs)).size,
             archCount: new Set(Object.values(arch)).size,
             total: Object.keys(WEAPONS).length,
             // the two extremes that used to be identical
             sameAsEachOther: sigs.sixteen === sigs.m2 };
  });

  // every weapon still has a working aiming rig — a pretty model that cannot train is useless
  for (const [id, n] of Object.entries(r.per)) expect(n, `${id} lost its yaw/pitch/barrelLen`).toBeGreaterThan(0);
  // the headline: a battleship's main battery and a machine gun are no longer one mesh
  expect(r.sameAsEachOther).toBe(false);
  // and the catalogue really is varied now, not two shapes with a rename
  expect(r.archCount).toBeGreaterThanOrEqual(8);
  expect(r.distinctShapes).toBeGreaterThanOrEqual(9);
  // sanity on the derivation: these must land on the mount they actually are
  expect(r.arch.sixteen).toBe('capital');
  expect(r.arch.eightin).toBe('capital');
  expect(r.arch.deckgun).toBe('dual');
  expect(r.arch.oerlikon).toBe('openaa');    // every light AA gun aboard is an open shielded mount
  expect(r.arch.m2).toBe('openaa');
  expect(r.arch.ciws).toBe('ciws');
  expect(r.arch.katyusha).toBe('rocket');
  expect(r.arch.railmount).toBe('rail');
  expect(r.arch.beamcannon).toBe('beam');
  expect(r.arch.plasmamini).toBe('gatling');
});

// Detail costs draw calls, and EVERY AI ship builds real turrets via syncNPCDeck — one per weapon
// in its loadout, growing all battle long. Measured before the overhaul: 139 turret meshes across
// a 42-ship battle. This is the ceiling that let the models be detailed without an LOD split, so
// it has to keep holding.
test('the new models stay inside the draw-call budget', async ({ page }) => {
  test.setTimeout(180000);
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(() => {
    try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    const meshes = o => { let n = 0; o.traverse(x => { if (x.isMesh) n++; }); return n; };
    const per = Object.values(WEAPONS).map(w => meshes(buildTurret(w)));

    difficulty = 'hard'; currentSandboxIdx = -1; currentMapIdx = 26;   // a big late-campaign theatre
    startGame('dreadnought'); skipBanner();
    const dt = 1 / 30;
    for (let i = 0; i < 30 * 150; i++) { t2 += dt; update(dt, t2); }   // let the fleets build up
    let scene_ = 0; scene.traverse(x => { if (x.isMesh) scene_++; });
    let turretMeshes = 0, turrets = 0;
    for (const sh of [...enemies, ...allies]) if (sh.build && sh.build.npcTurrets)
      for (const t of sh.build.npcTurrets) { turrets++; turretMeshes += meshes(t.group || t); }
    return { worst: Math.max(...per), avg: per.reduce((a, c) => a + c, 0) / per.length,
             sceneMeshes: scene_, turrets, turretMeshes,
             ships: enemies.length + allies.length };
  });

  expect(r.ships).toBeGreaterThan(20);            // it really was a crowded battle
  expect(r.turrets).toBeGreaterThan(15);          // ...with real turrets on real ships
  expect(r.worst, 'a single turret got extravagant').toBeLessThanOrEqual(26);
  expect(r.avg).toBeLessThanOrEqual(16);
  // the whole fleet's guns must stay a small slice of the frame
  expect(r.turretMeshes / r.sceneMeshes, 'turrets are eating the scene').toBeLessThan(0.10);
  expect(r.sceneMeshes, 'scene mesh count ran away').toBeLessThan(16000);
});
