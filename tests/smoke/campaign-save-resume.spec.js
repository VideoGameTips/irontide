const { test, expect } = require('@playwright/test');

// A war save is a kid's evening. If one theatre writes a save that resumeWar() cannot rebuild,
// the loss is silent — the menu just never offers "continue", or offers it and drops you into a
// half-built battle. Every theatre, saved and reloaded, compared against what it saved.
const roundTrip = ([idx]) => {
  try { localStorage.setItem('ironTideTutorialDone', '1'); localStorage.removeItem('ironTideSave'); } catch (e) {}
  const b = document.getElementById('storyBtn'), s = document.getElementById('story');
  if (b && s && s.style.display === 'flex') b.click();
  career.mapsUnlocked = 40; career.wins = 5;
  difficulty = 'normal'; currentSandboxIdx = -1; currentMapIdx = idx;
  startGame('destroyer'); skipBanner();
  for (let i = 0; i < 240; i++) { t2 += 1 / 30; update(1 / 30, t2); }   // 8s of real battle first

  const name = (window._MAP || {}).name;
  const snap = () => ({
    islands: islands.length,
    capturable: islands.filter(i => i.capturable).length,
    owners: islands.map(i => i.owner),
    landUnits: landUnits.filter(u => !u.dead).length,
    harbors: [!!friendlyHarbor, !!enemyHarbor],
    mapIdx: currentMapIdx, shipKind: player.def.kind,
  });

  const why = { phase, savable: warSavable(), onFoot, piloting: !!piloting, drivingTank: !!drivingTank,
                playerShipLost, sandbox: currentSandboxIdx, quick: typeof quickMode !== 'undefined' && quickMode,
                land: landCampaignMode, training: typeof trainingCourseRunning === 'function' && trainingCourseRunning(),
                harbors: [!!friendlyHarbor, !!enemyHarbor] };
  saveWar();
  const raw = localStorage.getItem('ironTideSave');
  const saved = raw ? raw.length : 0;
  const before = snap();

  // Mutate the live war BETWEEN save and resume. Without this the whole round trip passes even
  // when resumeWar() loads nothing at all — which is exactly how the wrong storage key went
  // unnoticed: "after" simply equalled "before" because nothing had happened either way.
  islands.forEach(i => { if (i.capturable) setIslandOwner(i, 1, true); });
  landUnits.forEach(u => { u.dead = true; });
  player.pos.x += 777;
  const dirty = snap();

  let err = null;
  try { resumeWar(); } catch (e) { err = e.message; }
  for (let i = 0; i < 60; i++) { t2 += 1 / 30; update(1 / 30, t2); }    // must survive being run, too
  const after = snap();

  const finite = Number.isFinite(player.pos.x) && Number.isFinite(player.hp)
    && islands.every(i => Number.isFinite(i.pos.x)) && landUnits.every(u => Number.isFinite(u.pos.x));
  return { idx, name, saved, err, phase, finite, why,
           resumeUndidTheMutation: JSON.stringify(dirty.owners) !== JSON.stringify(after.owners) || dirty.owners.length === 0,
           islandsMatch: before.islands === after.islands,
           capturableMatch: before.capturable === after.capturable,
           ownersMatch: JSON.stringify(before.owners) === JSON.stringify(after.owners),
           harborsOk: after.harbors[0] && after.harbors[1],
           mapMatch: before.mapIdx === after.mapIdx,
           shipMatch: before.shipKind === after.shipKind,
           before, after };
};

test('every campaign theatre survives a save and a resume', async ({ page }) => {
  test.setTimeout(12 * 60 * 1000);
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof saveWar === 'function' && typeof resumeWar === 'function');
  const n = await page.evaluate(() => CAMPAIGN.length);

  const out = [];
  for (let i = 0; i < n; i++) out.push(await page.evaluate(roundTrip, [i]));
  out.forEach(r => console.log('SAVE ' + JSON.stringify({ name: r.name, saved: r.saved, err: r.err,
    phase: r.phase, islandsMatch: r.islandsMatch, ownersMatch: r.ownersMatch, finite: r.finite,
    isles: [r.before.islands, r.after.islands], units: [r.before.landUnits, r.after.landUnits] })));

  out.forEach(r => expect(r.resumeUndidTheMutation,
    r.name + ': resume did not undo the mutation — the save was never loaded').toBe(true));
  const broken = out.filter(r => r.err || !r.finite || r.phase !== 'play'
    || !r.islandsMatch || !r.capturableMatch || !r.ownersMatch || !r.harborsOk || !r.mapMatch || !r.shipMatch);
  console.log('SAVESWEEP ' + JSON.stringify({ total: out.length, broken: broken.length,
    names: broken.map(b => b.name) }));

  expect(out.length).toBe(n);
  out.filter(r => r.saved <= 100).forEach(r => console.log('NOSAVE ' + JSON.stringify({ name: r.name, why: r.why })));
  out.forEach(r => expect(r.saved, r.name + ' wrote no save at all').toBeGreaterThan(100));
  expect(broken.map(b => ({ name: b.name, err: b.err, phase: b.phase, finite: b.finite,
    isles: [b.before.islands, b.after.islands], owners: b.ownersMatch })),
    'a theatre did not come back the way it was saved').toEqual([]);
  expect(pageErrors).toEqual([]);
});
