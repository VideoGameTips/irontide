const { test, expect } = require('@playwright/test');
test('nukes are barred on small/land theaters, and the unlock cap opens everything by level 6', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof nukesBannedHere === 'function' && typeof marketUnlocked === 'function');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();

    // --- nuke ban: theater fleet size <= 2 (pure-land assaults + the tiny warm-up) ---
    const banAt = (idx) => { currentMapIdx=idx; currentSandboxIdx=-1;
      landCampaignMode=(CAMPAIGN[idx].enemies===0); return nukesBannedHere(); };
    const land = CAMPAIGN.map((m,i)=>({i,e:m.enemies})).filter(m=>m.e===0).map(m=>m.i);
    const banned = CAMPAIGN.map((m,i)=>i).filter(i=>banAt(i));
    // a full-fleet theater is NOT banned -- but only from level 6 up: operations 1-5 are barred
    // outright now, whatever the fleet size, so pick the first big theater at or past that.
    const bigIdx = CAMPAIGN.findIndex((m,i)=>m.enemies>=6 && i>=5);
    const bigOk  = !banAt(bigIdx);

    // isNuclear picks the strategic arsenal
    const nukePlanes = Object.keys(PLANES).filter(k=>isNuclear(PLANES[k]));

    // --- unlock cap: nothing needs more than level 6 ---
    landCampaignMode=false; currentMapIdx=14;
    const nukesiloRaw = marketLevel('struct','nukesilo',STRUCTS.nukesilo);   // 28
    const capped = unlockLevel(nukesiloRaw);                                  // 6
    career.mapsUnlocked = 6;  const at6 = marketUnlocked('struct','nukesilo',STRUCTS.nukesilo);
    career.mapsUnlocked = 5;  const at5 = marketUnlocked('struct','nukesilo',STRUCTS.nukesilo);
    career.mapsUnlocked = 1;
    const pistolAt1 = marketUnlocked('gun','pistol',HANDHELD&&HANDHELD.pistol);   // early item still gated naturally
    career.mapsUnlocked = 6;
    return { landIdx:land, bannedIdx:banned, bigOk, bigIdx, nukePlanes, nukesiloRaw, capped, at6, at5, pistolAt1 };
  });
  // every pure-land theater is banned, plus the small warm-up (Training Bay, enemies 2)
  expect(r.landIdx.every(i => r.bannedIdx.includes(i))).toBe(true);
  expect(r.bannedIdx).toContain(0);          // Training Bay
  expect(r.bigIdx).toBeGreaterThanOrEqual(5);   // and it really is one the level gate allows
  expect(r.bigOk).toBe(true);                // a full fleet theater from level 6 up is fine
  for (const i of [0,1,2,3,4]) expect(r.bannedIdx, `operation ${i+1}`).toContain(i);   // levels 1-5 barred
  expect(r.nukePlanes).toEqual(expect.arrayContaining(['nukedrone','tu95v','lfc5']));
  expect(r.nukesiloRaw).toBe(28);            // the raw requirement is high...
  expect(r.capped).toBe(6);                  // ...but the cap opens it at 6
  expect(r.at6).toBe(true);
  expect(r.at5).toBe(false);
});
