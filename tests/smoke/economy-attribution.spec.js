const { test, expect } = require('@playwright/test');
// Economy review: bounties follow the captain's contribution. Full pay when the player's own
// fire touched the target within the credit window; a 25% commander's share otherwise.
test('kill bounties pay full for player-touched targets and a 25% share for pure fleet kills', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof playerCredited === 'function');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    currentMapIdx = 14; currentSandboxIdx = -1;   // naval theater with ships
    startGame('battleship'); skipBanner();
    const out = {};
    // land units
    const grunts = landUnits.filter(u=>u.team===1&&!u.dead&&u.kind==='soldier');
    let m=money; creditPlayerHit(grunts[0]); grunts[0].hp=0; killLandUnit(grunts[0]); out.landPlayer = money-m;
    m=money; grunts[1].hp=0; killLandUnit(grunts[1]); out.landFleet = money-m;
    // credit expires
    creditPlayerHit(grunts[2]); t2 += PLAYER_CREDIT_WINDOW + 1;
    m=money; grunts[2].hp=0; killLandUnit(grunts[2]); out.landExpired = money-m;
    // ships: player kill vs ally kill
    const foes = enemies.filter(e=>!e.proxy&&e.sinkT===0);
    const ally = allies.find(a=>!a.proxy);
    m=money; foes[0].hp=1; damageTarget(foes[0],999,null,foes[0].pos.clone()); out.shipPlayer = money-m;
    m=money; foes[1].hp=1; damageTarget(foes[1],999,ally,foes[1].pos.clone()); out.shipFleet = money-m;
    // counters still count regardless of credit
    out.sunkCounted = sunk;
    return out;
  });
  expect(r.landPlayer).toBe(50);                 // full soldier bounty
  expect(r.landFleet).toBeLessThan(20);          // 25% share
  expect(r.landFleet).toBeGreaterThan(0);
  expect(r.landExpired).toBe(r.landFleet);       // credit window really expires
  expect(r.shipPlayer).toBeGreaterThanOrEqual(350);   // full ship bounty
  expect(r.shipFleet * 4).toBeLessThanOrEqual(r.shipPlayer + 3);  // ~quarter
  expect(r.sunkCounted).toBe(2);                 // kill counters unaffected by attribution
});
