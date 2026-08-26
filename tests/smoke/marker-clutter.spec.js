const { test, expect } = require('@playwright/test');

// The far end of this is land-markers.spec.js — markers must not float over ground too distant
// to see. This is the near end.
//
// The overhead triangles are a "something is there" hint for contacts you cannot read yet. Up
// close they do the opposite: a 6 m sprite drawn with depthTest:false, 18 m from your eye, covers
// the tank it is labelling — and your own units were never culled at any range, so holding an
// island filled the windscreen with cyan. They now fade in over 55–110 m and still stop at
// MARKER_FAR, and the tank you are actually sitting in doesn't wear one at all.
const setup = () => {
  try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
  const b = document.getElementById('storyBtn'), s = document.getElementById('story');
  if (b && s && s.style.display === 'flex') b.click();
  difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 0;
  startGame('destroyer'); skipBanner();
};

test('friendly markers fade in with distance instead of covering the view', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof updateFogOfWar === 'function');
  const r = await page.evaluate(([SRC]) => {
    eval('(' + SRC + ')()');
    const isl = islands.slice().sort((a, c) => c.r - a.r)[0];
    setIslandOwner(isl, 0, true);
    const RANGES = [12, 40, 80, 110, 400, 1600];
    RANGES.forEach((rr, i) => {
      const a = i * 0.9, p = isl.pos.clone().add(new THREE.Vector3(Math.cos(a) * rr, 0, Math.sin(a) * rr));
      p.y = groundHeightAt(p, isl);
      const u = buildAndPushLand('aa', 0, p, undefined, isl, undefined, true);
      if (u) u._probe = rr;
    });
    // ...and put the player in a tank in the middle of them, which is where the report came from
    const spot = isl.pos.clone(); spot.y = groundHeightAt(spot, isl);
    buildGroundPlayerTank(spot, 'sherman', isl);
    const tk = playerTanks[playerTanks.length - 1]; mountTank(tk);
    for (let i = 0; i < 20; i++) { t2 += 0.05; update(0.05, t2); }

    const built = landUnits.filter(u => u._probe);
    const at = rr => { const u = built.find(x => x._probe === rr); return u && { v: u.marker.visible, o: +u.marker.material.opacity.toFixed(2) }; };
    return { placed: built.length, near: at(12), edge: at(40), fading: at(80), full: at(110),
             mid: at(400), beyond: at(1600), ownTank: tk.group.userData.teamMarker.visible };
  }, [setup.toString()]);
  console.log('MARKERPROBE ' + JSON.stringify(r));

  expect(r.placed, 'the fixture built nothing to look at').toBe(6);
  expect(r.near.v, 'a marker 12 m from your face is still drawn').toBe(false);
  expect(r.edge.v, 'a marker 40 m away is still drawn').toBe(false);
  expect(r.fading.o, 'the fade-in band is not fading — it snaps').toBeGreaterThan(0);
  expect(r.fading.o).toBeLessThan(1);
  expect(r.full.v, 'markers stopped working at usable range').toBe(true);
  expect(r.full.o).toBe(1);
  expect(r.mid.v, 'markers stopped working at 400 m').toBe(true);
  expect(r.beyond.v, 'a marker still floats over a target too far to see').toBe(false);
  expect(r.ownTank, 'the tank you are driving still wears a marker over the camera').toBe(false);
});

// The cull must not blind you: spotting enemies is what markers are FOR.
test('enemy markers still show at the ranges that matter', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(([SRC]) => {
    eval('(' + SRC + ')()');
    const isl = islands.slice().sort((a, c) => c.r - a.r)[0];
    setIslandOwner(isl, 1, true);
    const p = isl.pos.clone(); p.y = groundHeightAt(p, isl);
    const foe = buildAndPushLand('coastal', 1, p, undefined, isl, undefined, true);
    // stand off at a range where you want to know it is there but cannot make out the model
    player.pos.set(p.x, 0, p.z + 300); player.heading = Math.PI;
    for (let i = 0; i < 20; i++) { t2 += 0.05; update(0.05, t2); }
    const out = { atRange: foe.marker.visible, opacity: +foe.marker.material.opacity.toFixed(2) };
    // a sonar/spotter reveal has to punch through the near cull too — that pulse is the point
    // an enemy at 40 m keeps its marker — theirs is a threat cue, and at night it is the only
    // way you know the battery is there. Only your OWN units are culled at that range.
    player.pos.set(p.x, 0, p.z + 40);
    for (let i = 0; i < 4; i++) { t2 += 0.05; update(0.05, t2); }
    out.foeAt40 = foe.marker.visible;
    player.pos.set(p.x, 0, p.z + 20); foe.revealT = 3;
    for (let i = 0; i < 4; i++) { t2 += 0.05; update(0.05, t2); }
    out.revealedUpClose = foe.marker.visible;
    return out;
  }, [setup.toString()]);
  console.log('FOEPROBE ' + JSON.stringify(r));

  expect(r.atRange, 'an enemy battery 300 m away is no longer marked').toBe(true);
  expect(r.opacity).toBe(1);
  expect(r.foeAt40, 'an enemy battery 40 m away lost its marker — that cue is the threat warning').toBe(true);
  expect(r.revealedUpClose, 'a revealed contact must show however close it is').toBe(true);
});
