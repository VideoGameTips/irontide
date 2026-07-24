// Checks the factual claims the store copy makes against the shipped game.
//
// The launch kits in docs/promo/channels/ hard-code numbers — 31 theaters, 29
// playable warships, 12 medals — and name specific features and keybinds. When the
// game changes, those go stale silently and the next thing that happens is a player
// correcting us in public on a store page. Worse, a claim can be wrong from the start:
// the copy advertised a "family high-score board" that never existed in any build.
//
// Run this before any launch, and after any game change that touches the catalogues.
// It exits non-zero on drift, and prints the correct value so the copy can be fixed.
const { chromium } = require('@playwright/test');

const GAME = process.env.IRONTIDE_URL || 'https://game.boobank.com/irontide/';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(GAME, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof SHIPS === 'object' && typeof CAMPAIGN !== 'undefined');

  const g = await page.evaluate(() => {
    const src = document.documentElement.outerHTML;
    return {
      theaters: CAMPAIGN.length,
      playableShips: Object.values(SHIPS).filter(s => !s.support && !s.boss).length,
      planes: typeof PLANES !== 'undefined' ? Object.keys(PLANES).length : -1,
      tanks: typeof TANKS !== 'undefined' ? Object.keys(TANKS).length : -1,
      medals: typeof ACHIEVEMENTS !== 'undefined' ? ACHIEVEMENTS.length : -1,
      sandbox: typeof SANDBOX_MAPS !== 'undefined' ? SANDBOX_MAPS.length : -1,
      musicProfiles: typeof MUSIC_PROFILES !== 'undefined' ? Object.keys(MUSIC_PROFILES).length : -1,
      three: THREE.REVISION,
      rival: typeof NAME_ZH !== 'undefined' && Object.keys(NAME_ZH).some(k => /Grand Marshal Varga/.test(k)),
      photoMode: typeof togglePhotoMode === 'function',
      gamepad: typeof pollGamepad === 'function',
      quickBattle: typeof quickMode !== 'undefined',
      starRatings: /career\.theaters/.test(src) && /stars/.test(src),
      contentFilter: typeof contentFilterOn === 'function',
      // features the copy must NOT claim
      leaderboard: /highScore|high[- ]score|leaderboard|scoreboard/i.test(src),
      // one bad keybind in a "tips" comment is worse than a wrong number
      shopIsTab: /e\.code==='Tab'[^\n]*toggleShop/.test(src),
      placeIsF: /e\.code==='KeyF'\) tryPlace/.test(src),
      manIsE: /e\.code==='KeyE'\) toggleMan/.test(src),
      photoIsL: /e\.code==='KeyL'[^\n]*togglePhotoMode/.test(src),
    };
  });

  // Left side is what docs/promo/channels/*.md currently claims.
  const claims = [
    ['31 theaters',                     g.theaters === 31,        g.theaters],
    ['29 playable warships',            g.playableShips === 29,   g.playableShips],
    ['61 aircraft',                     g.planes === 61,          g.planes],
    ['22 tanks',                        g.tanks === 22,           g.tanks],
    ['12 medals',                       g.medals === 12,          g.medals],
    ['7 sandbox maps',                  g.sandbox === 7,          g.sandbox],
    ['music profile per theater',       g.musicProfiles === g.theaters + 1, `${g.musicProfiles} profiles / ${g.theaters} theaters`],
    ['three.js r128',                   g.three === '128',        g.three],
    ['rival is Grand Marshal Varga',    g.rival,                  g.rival],
    ['photo mode exists',               g.photoMode,              g.photoMode],
    ['gamepad support exists',          g.gamepad,                g.gamepad],
    ['quick battle exists',             g.quickBattle,            g.quickBattle],
    ['per-theater star ratings exist',  g.starRatings,            g.starRatings],
    ['kid-safe content toggle exists',  g.contentFilter,          g.contentFilter],
    ['NO leaderboard (copy must not claim one)', !g.leaderboard,  g.leaderboard ? 'found one — copy may now claim it' : 'absent'],
    ['Tab opens the shop',              g.shopIsTab,              g.shopIsTab],
    ['F places a bought gun',           g.placeIsF,               g.placeIsF],
    ['E mans a gun',                    g.manIsE,                 g.manIsE],
    ['L is photo mode',                 g.photoIsL,               g.photoIsL],
  ];

  let bad = 0;
  console.log(`\nCOPY CLAIMS vs ${GAME}\n`);
  for (const [claim, ok, actual] of claims) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${claim}${ok ? '' : `   → actually: ${actual}`}`);
    if (!ok) bad++;
  }
  await browser.close();
  console.log(bad
    ? `\n${bad} claim(s) drifted — update docs/promo/channels/*.md and the README before launching.`
    : '\nAll copy claims match the shipped game.');
  process.exit(bad ? 1 : 0);
})();
