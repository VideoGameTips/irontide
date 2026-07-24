const { test, expect } = require('@playwright/test');
test('the medal set is well-formed and the tiered thresholds trip in order', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof ACHIEVEMENTS !== 'undefined');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    startGame('destroyer'); skipBanner();

    const ids = ACHIEVEMENTS.map(a => a.id);
    const icons = ACHIEVEMENTS.map(a => a.icon);
    const wellFormed = ACHIEVEMENTS.every(a =>
      a.id && a.icon && a.name('en') && a.name('zh') && a.desc() && typeof a.check === 'function');

    // Ship Destroyer I–XII thresholds, in order
    const shipTiers = ACHIEVEMENTS.filter(a => /Ship Destroyer/.test(a.name('en')));
    const shipGoals = shipTiers.map(a => a.prog({}) [1]);
    // count how many ship-kill medals a given sunk total unlocks (First Blood + the tiers reached)
    const shipUnlocks = (n) => ACHIEVEMENTS.filter(a => a.check({sunk:n}) &&
      (/Ship Destroyer/.test(a.name('en')) || a.id==='first_blood')).length;

    // retroactive award for a veteran profile
    Object.assign(career, { sunk: 600, planes: 120, islands: 30, wins: 55, bosses: 12,
      theaters: { 0:{stars:3},1:{stars:3},2:{stars:3},3:{stars:2} } });
    career.achievements = [];
    checkAchievements(true);
    const retro = career.achievements.length;
    const hasHighTiers = ['sink_250','sink_500','sky_master','island_lord','war_hero','legend','levi_bane']
      .every(id => career.achievements.includes(id));
    const notThird = !career.achievements.includes('sd_12');   // 600 < 15000

    return { count: ACHIEVEMENTS.length, uniqueIds: new Set(ids).size,
             wellFormed, shipCount: shipTiers.length, shipGoals,
             at9: shipUnlocks(9), at10: shipUnlocks(10), at100: shipUnlocks(100), at15000: shipUnlocks(15000),
             retro, hasHighTiers, notThird };
  });
  expect(r.count).toBe(86);
  expect(r.uniqueIds).toBe(86);            // no duplicate ids
  expect(r.wellFormed).toBe(true);         // every medal bilingual with a check
  expect(r.shipCount).toBe(12);            // Ship Destroyer I–XII
  expect(r.shipGoals).toEqual([10,30,100,250,500,1000,2000,3500,5500,8000,11000,15000]);
  expect(r.at9).toBe(1);                   // First Blood only (sunk>=1); no tier yet
  expect(r.at10).toBe(2);                  // First Blood + Ship Destroyer I
  expect(r.at100).toBe(4);                 // First Blood removed? no — First Blood is sunk>=1; at 100: FB + I + II + III = 4
  expect(r.at15000).toBe(13);              // First Blood + all 12 tiers
  expect(r.retro).toBeGreaterThanOrEqual(14);   // a maxed veteran retroactively earns most of them
  expect(r.hasHighTiers).toBe(true);
  expect(r.notThird).toBe(true);           // but not XII (needs 15000)
  expect(errors).toEqual([]);
});
