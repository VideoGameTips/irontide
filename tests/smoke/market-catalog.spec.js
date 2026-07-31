const { test, expect } = require('@playwright/test');

// The campaign market sells permanent blueprints for things you cannot get any other way. That
// only holds if every catalogue entry resolves to a real def AND that def is marketOnly — a
// non-marketOnly entry is a blueprint you can spend credits on for a thing you already had.
test('every market entry resolves, is exclusive, and is bilingual', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof MARKET_CATALOG !== 'undefined' && typeof marketDef === 'function');
  const r = await page.evaluate(() => {
    const problems = [];
    const tagsZh = (typeof MARKET_ZH !== 'undefined' && MARKET_ZH.TAGS) || {};
    for (const it of MARKET_CATALOG) {
      const key = marketKey(it.cat, it.id), def = marketDef(it);
      if (!def) { problems.push(key + ': no def — marketDef cannot resolve this category'); continue; }
      if (!def.name) problems.push(key + ': def has no name');
      // the whole point of the market: buying it must grant something you could not otherwise use
      if (!def.marketOnly) problems.push(key + ': not marketOnly, so the blueprint buys nothing');
      if (!MARKET_ZH[key] || !MARKET_ZH[key].desc) problems.push(key + ': no Chinese description');
      // names come from NAME_ZH, which is a separate hand-kept map from the per-table _ZH
      // descriptions — half the market shipped with English names because of exactly that split
      if (typeof NAME_ZH === 'undefined' || !NAME_ZH[def.name]) problems.push(key + ': name "' + def.name + '" has no Chinese');
      if (!tagsZh[it.tag]) problems.push(key + ': tag "' + it.tag + '" has no Chinese');
      if (!(it.cost > 0)) problems.push(key + ': no credit cost');
      if (!(it.level >= 1)) problems.push(key + ': no unlock level');
    }
    // ids must be unique, or one entry silently shadows another in the picker
    const keys = MARKET_CATALOG.map(it => marketKey(it.cat, it.id));
    if (new Set(keys).size !== keys.length) problems.push('duplicate catalogue keys');
    return { problems, count: MARKET_CATALOG.length, cats: [...new Set(MARKET_CATALOG.map(i => i.cat))].sort() };
  });

  expect(r.problems).toEqual([]);
  expect(r.count).toBeGreaterThanOrEqual(25);
  // every category the market can express is actually stocked — 'weapon' and 'gun' sat empty for
  // a long time, and 'gun' didn't even resolve because marketDef had no branch for it
  expect(r.cats).toEqual(['gun', 'plane', 'ship', 'struct', 'tank', 'weapon']);
});

// Buying is the part players actually touch: credits out, blueprint in, and the gate really shuts
// when you can't afford it or haven't reached the level.
test('blueprints can be bought, and the credit and level gates both hold', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof buyCampaignMarketItem === 'function');
  const r = await page.evaluate(() => {
    try { localStorage.clear(); } catch (e) {}
    ensureCareerMarket();
    const dearest = MARKET_CATALOG.slice().sort((a, b) => b.level - a.level)[0];
    const key = marketKey(dearest.cat, dearest.id);

    // too low a level: refused even with money to burn
    career.credits = 999999; career.mapsUnlocked = 1; career.marketOwned = [];
    buyCampaignMarketItem(key);
    const boughtUnderlevelled = ownsMarketItem(dearest.cat, dearest.id);

    // high enough level but broke: still refused
    career.mapsUnlocked = CAMPAIGN.length; career.credits = 0;
    buyCampaignMarketItem(key);
    const boughtBroke = ownsMarketItem(dearest.cat, dearest.id);

    // and now for real
    career.credits = dearest.cost;
    buyCampaignMarketItem(key);
    const owned = ownsMarketItem(dearest.cat, dearest.id), left = career.credits;

    // buying the same thing twice must not charge twice
    career.credits = 5000; buyCampaignMarketItem(key);
    const afterRebuy = career.credits;

    // everything in the catalogue buys cleanly
    career.credits = 9e6; career.marketOwned = [];
    const unbuyable = MARKET_CATALOG.filter(it => { buyCampaignMarketItem(marketKey(it.cat, it.id)); return !ownsMarketItem(it.cat, it.id); })
      .map(it => marketKey(it.cat, it.id));
    return { boughtUnderlevelled, boughtBroke, owned, left, afterRebuy, unbuyable, cost: dearest.cost };
  });

  expect(r.boughtUnderlevelled).toBe(false);   // level gate holds
  expect(r.boughtBroke).toBe(false);           // credit gate holds
  expect(r.owned).toBe(true);
  expect(r.left).toBe(0);                      // charged exactly the sticker price
  expect(r.afterRebuy).toBe(5000);             // and never charged twice
  expect(r.unbuyable).toEqual([]);
});
