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

    const trips = (stats) => ACHIEVEMENTS.filter(a => a.check(stats)).map(a => a.id);
    const s249  = trips({ sunk: 249 }).filter(i => i.startsWith('sink_'));
    const s250  = trips({ sunk: 250 }).filter(i => i.startsWith('sink_'));
    const s500  = trips({ sunk: 500 }).filter(i => i.startsWith('sink_'));
    const s1000 = trips({ sunk: 1000 }).filter(i => i.startsWith('sink_'));

    // retroactive award for a veteran profile
    Object.assign(career, { sunk: 600, planes: 120, islands: 30, wins: 55, bosses: 12,
      theaters: { 0:{stars:3},1:{stars:3},2:{stars:3},3:{stars:2} } });
    career.achievements = [];
    checkAchievements(true);
    const retro = career.achievements.length;
    const hasHighTiers = ['sink_250','sink_500','sky_master','island_lord','war_hero','legend','levi_bane']
      .every(id => career.achievements.includes(id));
    const notThird = !career.achievements.includes('sink_1000');   // 600 < 1000

    return { count: ACHIEVEMENTS.length, uniqueIds: new Set(ids).size, uniqueIcons: new Set(icons).size,
             wellFormed, s249, s250, s500, s1000, retro, hasHighTiers, notThird };
  });
  expect(r.count).toBe(20);
  expect(r.uniqueIds).toBe(20);            // no duplicate ids
  expect(r.uniqueIcons).toBe(20);          // no duplicate icons
  expect(r.wellFormed).toBe(true);         // every medal bilingual with a check
  expect(r.s249).toEqual([]);              // 249 trips nothing
  expect(r.s250).toEqual(['sink_250']);    // tier I only
  expect(r.s500).toEqual(['sink_250','sink_500']);            // I + II
  expect(r.s1000).toEqual(['sink_250','sink_500','sink_1000']); // all three, in order
  expect(r.retro).toBeGreaterThanOrEqual(14);   // a maxed veteran retroactively earns most of them
  expect(r.hasHighTiers).toBe(true);
  expect(r.notThird).toBe(true);           // but not one it hasn't reached
  expect(errors).toEqual([]);
});
