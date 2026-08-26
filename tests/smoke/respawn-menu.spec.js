const { test, expect } = require('@playwright/test');

// Losing a tank crew mid-battle raises the SAME menu the game starts from, with .bridge .respawn.
// That layout hides the left "01 WHERE YOU FIGHT" column — you cannot re-point a war at another
// theatre halfway through — which left two problems on screen:
//   * #brDock is margin-top:auto so the launch bar sits at the foot of a FULL-HEIGHT column. With
//     the left column gone the box holds two short sections, so the bar drifted to the bottom of
//     the window and left a hole that grows with the viewport.
//   * the steps are numbered across both columns, so the visible ones read "02, 03" with no 01.
const openRespawn = () => {
  // a returning captain: firstRunActive() is false, so buildMenu() builds the bridge frame
  try { localStorage.setItem('ironTideCareer', JSON.stringify({ wins: 5, losses: 2, mapsUnlocked: 12 }));
        localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
};
const measure = () => {
  const b = document.getElementById('storyBtn'), s = document.getElementById('story');
  if (b && s && s.style.display === 'flex') b.click();
  difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 0;
  startGame('destroyer'); skipBanner();
  for (let i = 0; i < 20; i++) { t2 += 0.05; update(0.05, t2); }
  showRespawnMenu('Ammunition cook-off! Pick a replacement hull.');
  const right = document.getElementById('brRight'), dock = document.getElementById('brDock');
  const vis = [...right.children].filter(e => e.id !== 'brDock'
    && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0);
  const last = vis[vis.length - 1];
  const gap = Math.round(dock.getBoundingClientRect().top - last.getBoundingClientRect().bottom);
  const steps = [...document.querySelectorAll('#brRight .brh')]
    .filter(e => e.offsetParent !== null)
    .map(e => e.querySelector('.n').textContent.trim());
  return { gap, steps, vh: innerHeight, menuClass: document.getElementById('menu').className,
           leftHidden: getComputedStyle(document.getElementById('brLeft')).display === 'none' };
};

for (const h of [900, 1200, 1500]) {
  test(`the replacement-hull picker keeps its launch bar with the content at ${h}px tall`, async ({ page }) => {
    await page.setViewportSize({ width: 1500, height: h });
    await page.addInitScript(openRespawn);
    await page.goto('http://localhost:3000/');
    await page.waitForFunction(() => typeof showRespawnMenu === 'function');
    const r = await page.evaluate(measure);
    console.log('RESPAWN ' + JSON.stringify(r));

    expect(r.menuClass, 'this fixture did not reach the bridge respawn layout').toContain('respawn');
    expect(r.menuClass).toContain('bridge');
    expect(r.leftHidden, 'the theatre column should be hidden mid-war').toBe(true);
    // the hole used to scale with the window; it must not any more
    expect(r.gap, 'the launch bar drifted away from the content').toBeLessThan(60);
    // ...and the visible steps must count from 01, not start at 02 because 01 is hidden
    expect(r.steps.length).toBe(2);
    expect(r.steps[0]).toBe('01');
    expect(r.steps[1]).toBe('02');
  });
}

// ...and the ordinary pre-battle menu, which DOES show the theatre column, must keep counting
// 01 (where) / 02 (which hull) / 03 (difficulty). The renumber stashes the original in a data
// attribute; if it failed to put it back, the front door would start counting from 01 twice.
test('the ordinary menu still numbers all three steps across both columns', async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 1000 });
  await page.addInitScript(openRespawn);
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof buildMenu === 'function');
  const r = await page.evaluate(() => {
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    // go through a respawn first, then back to the front door — the stash has to survive that
    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 0;
    startGame('destroyer'); skipBanner();
    showRespawnMenu('x');
    const during = [...document.querySelectorAll('#brRight .brh .n')].map(n => n.textContent.trim());
    phase = 'select'; buildMenu();
    const after = [...document.querySelectorAll('#menu .brh .n')].map(n => n.textContent.trim());
    return { during, after, cls: document.getElementById('menu').className };
  });
  console.log('RENUMBER ' + JSON.stringify(r));
  expect(r.during).toEqual(['01', '02']);
  expect(r.after, 'the front door lost its original step numbers').toEqual(['01', '02', '03']);
  expect(r.cls).not.toContain('respawn');
});
