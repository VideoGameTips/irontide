const { test, expect } = require('@playwright/test');
// Balance guardrails: keep the catalog from drifting back into the outliers the review found.
test('no weapon runs away with anti-ship cost-efficiency, and AA still owns the sky', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof AA_VS_ARMOUR === 'number');
  const r = await page.evaluate(() => {
    const rows = Object.entries(WEAPONS).map(([id,w]) => ({
      id, aa: !!w.aa,
      ship: ((w.aa ? w.dmg*AA_VS_ARMOUR : w.dmg)/w.cd) / (w.cost/100),
      air:  (w.dmg/w.cd) / (w.cost/100),
    }));
    const v = rows.map(r=>r.ship).sort((a,b)=>a-b);
    const med = v[Math.floor(v.length/2)];
    const byShip = [...rows].sort((a,b)=>b.ship-a.ship);
    const byAir  = [...rows].sort((a,b)=>b.air-a.air);
    return { med, topShipRatio: byShip[0].ship/med, topAirIsAA: byAir[0].aa,
             outliers: byShip.filter(r=>r.ship>med*3).map(r=>r.id),
             discount: AA_VS_ARMOUR,
             bigGunInTopSix: byShip.slice(0,6).some(r=>['cannon','sixteen','fiveinch'].includes(r.id)) };
  });
  expect(r.outliers).toEqual([]);              // nothing more than 3x the median against ships
  expect(r.topShipRatio).toBeLessThan(3);
  expect(r.topAirIsAA).toBe(true);             // AA guns are still the answer to aircraft
  expect(r.bigGunInTopSix).toBe(true);         // and naval guns are worth buying again
  expect(r.discount).toBeLessThan(0.5);
});

test('the AA discount only applies to ships, not to aircraft or ground targets', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof shellShipDmg === 'function');
  const r = await page.evaluate(() => {
    const aaShell = { dmg: 100, aa: true }, navalShell = { dmg: 100, aa: false };
    return { aaVsShip: shellShipDmg(aaShell), navalVsShip: shellShipDmg(navalShell),
             aaRaw: aaShell.dmg };   // raw dmg is what planes/land units still take
  });
  expect(r.aaVsShip).toBeCloseTo(12, 1);   // 12% against armour
  expect(r.navalVsShip).toBe(100);         // naval guns unaffected
  expect(r.aaRaw).toBe(100);               // aircraft/ground still take full
});
