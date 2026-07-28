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
    // Ships: player kill vs ally kill. The bounty tier comes from the hull's hp, and the enemy
    // fleet is randomly composed, so the two kills have to be the SAME class or the comparison
    // measures ship size instead of attribution.
    const foes = enemies.filter(e=>!e.proxy&&e.sinkT===0);
    const tier = h => h>400?700:h>250?500:350;
    const pair = foes.find((a,i)=>foes.some((b,j)=>j>i && tier(b.def.hp)===tier(a.def.hp)));
    const twin = foes.find(b=>b!==pair && tier(b.def.hp)===tier(pair.def.hp));
    const ally = allies.find(a=>!a.proxy);
    out.sameClass = tier(pair.def.hp)===tier(twin.def.hp);
    m=money; pair.hp=1; damageTarget(pair,999,null,pair.pos.clone()); out.shipPlayer = money-m;
    m=money; twin.hp=1; damageTarget(twin,999,ally,twin.pos.clone()); out.shipFleet = money-m;
    // counters still count regardless of credit
    out.sunkCounted = sunk;
    return out;
  });
  expect(r.landPlayer).toBe(50);                 // full soldier bounty
  expect(r.landFleet).toBeLessThan(20);          // 25% share
  expect(r.landFleet).toBeGreaterThan(0);
  expect(r.landExpired).toBe(r.landFleet);       // credit window really expires
  expect(r.sameClass).toBe(true);                     // like for like, or the ratio means nothing
  expect(r.shipPlayer).toBeGreaterThanOrEqual(350);   // full ship bounty
  expect(r.shipFleet * 4).toBeLessThanOrEqual(r.shipPlayer + 3);  // ~quarter
  expect(r.sunkCounted).toBe(2);                 // kill counters unaffected by attribution
});
