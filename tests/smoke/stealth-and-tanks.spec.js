const { test, expect } = require('@playwright/test');

// "the f22 still does not look like a lockhead martin" — and the last pass made that WORSE.
// Smoothing every lathed fuselage is right for a Spitfire and wrong for an F-22: a stealth
// airframe is folded plate, and flat panels are literally what stealth shaping IS. So the stealth
// jets now get a deliberately faceted body, hard-canted twin tails, 2D nozzles and caret inlets.
test('stealth jets are faceted and angular; everything else stays smooth', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof buildPlane === 'function' && typeof aircraftFuselage === 'function');
  const r = await page.evaluate(() => {
    const skin = aircraftSkin(0x9aa0a8);
    const rounded = aircraftFuselage(6, 0.46, skin, 1, 0);
    const chined = aircraftFuselage(6, 0.46, skin, 1, 6);
    const segs = geo => geo.parameters ? geo.parameters.segments : null;

    // how angular is each aircraft's own body, and how far are its tails canted?
    const probe = id => {
      const g = buildPlane(PLANES[id]);
      let chined = 0, smoothBodies = 0, maxCant = 0;
      g.traverse(o => {
        if (!o.isMesh || !o.material) return;
        if (o.geometry.type === 'LatheGeometry') {
          // Count the CHINED bodies specifically — few lathe segments is what makes a body
          // angular. "Any flat-shaded lathe" was not enough: an F-22 also carries lathe-built
          // ordnance on its pylons, so that check passed even with the fuselage smooth again.
          const sg = o.geometry.parameters ? o.geometry.parameters.segments : 99;
          if (sg <= 8) chined++; else if (!o.material.flatShading) smoothBodies++;
        }
        // a fin is added with rotation.z = PI/2 +/- cant
        const off = Math.abs(Math.abs(o.rotation.z) - Math.PI / 2);
        if (off > 0.01 && off < 1.2) maxCant = Math.max(maxCant, off);
      });
      return { chined, smoothBodies, maxCant: +maxCant.toFixed(2) };
    };
    return { roundedSegs: segs(rounded.geometry), chinedSegs: segs(chined.geometry),
             roundedFlat: rounded.material.flatShading, chinedFlat: chined.material.flatShading,
             f22: probe('f22'), f35: probe('f35'), f18: probe('f18'), spitfire: probe('spitfire') };
  });

  // the faceted builder really is a different, angular object with the FLAT skin kept
  expect(r.chinedSegs).toBeLessThan(r.roundedSegs / 2);
  expect(r.chinedFlat).toBe(true);
  expect(r.roundedFlat).toBe(false);

  // the stealth aircraft carry angular bodies...
  expect(r.f22.chined, 'the F-22 has no chined body at all').toBeGreaterThan(0);
  expect(r.f35.chined).toBeGreaterThan(0);
  // ...and the ones that should be curved still are. This is the half that makes it a decision
  // rather than "turn shading off again".
  expect(r.f18.smoothBodies).toBeGreaterThan(0);
  expect(r.f18.chined, 'a Hornet is not a stealth aircraft and must not be chined').toBe(0);
  expect(r.spitfire.smoothBodies).toBeGreaterThan(0);
  expect(r.spitfire.chined).toBe(0);

  // and the F-22's tails lean hard outboard — the single most recognisable thing about it.
  // 0.2 rad was a barely-visible tilt; the real aircraft sits near 28 degrees.
  expect(r.f22.maxCant).toBeGreaterThan(0.4);
  expect(r.f18.maxCant).toBeLessThan(r.f22.maxCant);
});

// All 30 tanks came out of one model, and every single one ran on exactly FOUR road wheels —
// a light Stuart and a 188-tonne Maus had identical running gear. Wheel count is the thing your
// eye actually counts on a tank.
test('tank running gear scales with the hull, and turrets have furniture', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof buildLand === 'function' && typeof TANKS !== 'undefined');
  const r = await page.evaluate(() => {
    try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 4;
    startGame('destroyer'); skipBanner();

    const probe = id => {
      const u = buildLand('tank', 0, new THREE.Vector3(0, 0, 0), id);
      let meshes = 0, lathes = 0;
      u.group.traverse(o => { if (o.isMesh) { meshes++; if (o.geometry.type === 'LatheGeometry') lathes++; } });
      return { meshes, lathes, hullL: TANKS[id].hullL, hasTurret: !!u.group.userData.turret,
               hasBarrel: !!u.group.userData.barrel };
    };
    return { stuart: probe('stuart'), tiger: probe('tiger'), maus: probe('maus') };
  });

  // a bigger hull carries more running gear than a small one — they are no longer the same tank
  expect(r.maus.hullL).toBeGreaterThan(r.stuart.hullL);
  expect(r.maus.meshes, 'a Maus and a Stuart still build the same number of parts')
    .toBeGreaterThan(r.stuart.meshes);
  expect(r.tiger.meshes).toBeGreaterThan(r.stuart.meshes);
  // the gun is lathed now, like every other gun in the game
  expect(r.stuart.lathes).toBeGreaterThan(0);
  // and nothing that drives the tank was lost in the rebuild
  for (const t of [r.stuart, r.tiger, r.maus]) {
    expect(t.hasTurret).toBe(true);
    expect(t.hasBarrel).toBe(true);
  }
});
