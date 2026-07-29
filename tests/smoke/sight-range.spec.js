const { test, expect } = require('@playwright/test');

// At level one with no radar upgrades you could only SEE enemies within 620 m — past that they
// were not drawn at all. That does not read as fog of war, it reads as being blind. The base is
// 2.5x that now; upgrades, sonar and airborne recon still stack on top, and weather still cuts it.
test('you can see far enough to play, and sensors still matter', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof enemyDetectedAt === 'function');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    try { localStorage.setItem('ironTideTutorialDone','1'); } catch(e) {}
    // binary-search the real detection horizon in the current conditions
    const horizon = () => { let lo = 0, hi = 8000;
      for (let k = 0; k < 26; k++) { const mid = (lo + hi) / 2;
        const q = player.pos.clone().add(new THREE.Vector3(mid, 0, 0));
        if (enemyDetectedAt(q, 1)) lo = mid; else hi = mid; }
      return Math.round(lo); };
    currentSandboxIdx = -1; career.mapsUnlocked = 30;
    currentMapIdx = 0; startGame('destroyer'); skipBanner();
    for (let i = 0; i < 10; i++) { t2 += 0.05; update(0.05, t2); }
    const clear = horizon(), clearWeather = weather.type, clearFog = Math.round(scene.fog.far);
    currentMapIdx = 5; startGame('destroyer'); skipBanner();   // Iron Straits — permanent storm
    for (let i = 0; i < 10; i++) { t2 += 0.05; update(0.05, t2); }
    const storm = horizon(), stormWeather = weather.type;
    // a submarine is still harder to see than a surface ship
    const q = player.pos.clone().add(new THREE.Vector3(storm * 0.8, 0, 0));
    const subHiddenWhereShipIsSeen = enemyDetectedAt(q, 1) && !enemyDetectedAt(q, 0.42);
    return { base: BASE_SIGHT, marker: MARKER_FAR, clear, clearWeather, storm, stormWeather,
             subHiddenWhereShipIsSeen, exposure: renderer.toneMappingExposure,
             cinematicDefault: gameSettings.cinematic, clearFog };
  });
  expect(r.base).toBeGreaterThanOrEqual(1550);          // 2.5x the old 620
  expect(r.marker).toBe(r.base);                        // markers reach as far as the eye
  expect(r.clear).toBeGreaterThan(1200);                // ...and you can actually use it on level 1
  // Weather costs you a little and never blinds you — radar sees through rain.
  expect(r.storm).toBeGreaterThan(1100);
  expect(r.storm).toBeLessThanOrEqual(r.clear);
  expect(r.subHiddenWhereShipIsSeen).toBe(true);        // stealth still means something
  expect(r.clearFog).toBeGreaterThan(r.clear * 2);      // the grade must never shorten the horizon
  expect(r.cinematicDefault).toBe(true);
  expect(r.exposure).toBeCloseTo(0.70, 2);              // and it actually applies on a fresh boot
});
