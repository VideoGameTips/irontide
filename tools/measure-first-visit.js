// Measures what a first-time visitor actually experiences, on a cold cache.
const { chromium } = require('@playwright/test');
(async () => {
  const runs = [];
  for (const profile of [
    { name: 'desktop, unthrottled', cpu: 1, net: null },
    { name: 'mid laptop (4x CPU slowdown)', cpu: 4, net: null },
    { name: 'phone-ish (4x CPU + Fast 3G)', cpu: 4, net: { downloadThroughput: 1.6e6/8, uploadThroughput: 750e3/8, latency: 150 } },
  ]) {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    if (profile.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu });
    if (profile.net) await cdp.send('Network.emulateNetworkConditions', { offline: false, ...profile.net });

    const t0 = Date.now();
    await page.goto('https://game.boobank.com/irontide/', { waitUntil: 'domcontentloaded' });
    const domReady = Date.now() - t0;
    await page.waitForFunction(() => typeof startGame === 'function' && typeof SHIPS === 'object');
    const gameReady = Date.now() - t0;
    await page.waitForSelector('#menu', { state: 'visible' });
    const menuVisible = Date.now() - t0;

    // time from clicking a ship to being in control at the helm
    const t1 = Date.now();
    await page.evaluate(() => {
      const b = document.getElementById('storyBtn'), s = document.getElementById('story');
      if (b && s && s.style.display === 'flex') b.click();
      startGame('destroyer');
    });
    await page.waitForFunction(() => typeof phase !== 'undefined' && phase === 'play');
    const intoBattle = Date.now() - t1;

    const bytes = await page.evaluate(() =>
      performance.getEntriesByType('resource').reduce((s, r) => s + (r.transferSize || 0), 0)
      + (performance.getEntriesByType('navigation')[0]?.transferSize || 0));

    runs.push({ profile: profile.name, domReady, gameReady, menuVisible, intoBattle, kb: Math.round(bytes / 1024) });
    await browser.close();
  }
  console.log('\nFIRST-VISIT EXPERIENCE (cold cache, Tokyo origin behind Cloudflare)\n');
  for (const r of runs) {
    console.log(`  ${r.profile}`);
    console.log(`    HTML parsed      ${r.domReady} ms`);
    console.log(`    game code ready  ${r.gameReady} ms`);
    console.log(`    menu on screen   ${r.menuVisible} ms`);
    console.log(`    click → at helm  ${r.intoBattle} ms`);
    console.log(`    transferred      ${r.kb} KB\n`);
  }
})();
