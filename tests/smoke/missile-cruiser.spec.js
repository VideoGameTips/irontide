const { test, expect } = require('@playwright/test');

// The Missile Cruiser is the gun cruiser's opposite number: same length class, same mount count,
// and she trades belt armor for vertical launch cells. The whole hull is one idea — missiles
// reload faster aboard her — so the test has to prove that idea is real, is bound to the HULL and
// not to the weapon, and costs her something.
const PRE = () => {
  try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
  const b = document.getElementById('storyBtn'), s = document.getElementById('story');
  if (b && s && s.style.display === 'flex') b.click();
};

test('she is a real selectable hull, and a trade rather than a free upgrade', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof SHIPS !== 'undefined' && typeof buildMenu === 'function');
  const r = await page.evaluate(([PRE_SRC]) => {
    eval('(' + PRE_SRC + ')()');
    const m = SHIPS.missilecruiser, c = SHIPS.cruiser;
    _allShips = true; buildMenu();
    const card = [...document.querySelectorAll('#ships .ship h3')].map(h => h.textContent).join('|');
    return {
      exists: !!m, marketOnly: !!m.marketOnly, vls: m.vls ? m.vls.cd : null,
      hp: m.hp, cruiserHp: c.hp, mounts: m.mounts, cruiserMounts: c.mounts,
      len0: m.len0, cruiserLen0: c.len0,
      inPicker: /Missile Cruiser/.test(card),
      zhName: (typeof SHIPS_ZH !== 'undefined' && SHIPS_ZH.missilecruiser) ? SHIPS_ZH.missilecruiser.name : null,
      zhDesc: (typeof SHIPS_ZH !== 'undefined' && SHIPS_ZH.missilecruiser) ? SHIPS_ZH.missilecruiser.desc : null,
    };
  }, [PRE.toString()]);

  expect(r.exists).toBe(true);
  expect(r.marketOnly).toBe(false);        // free to pick from the menu, not a market blueprint
  expect(r.inPicker).toBe(true);           // ...and she really shows up on the ship-select screen
  expect(r.vls).toBeGreaterThan(0);
  expect(r.vls).toBeLessThan(1);           // a reload MULTIPLIER under 1, or the perk is backwards
  // the price of the cells: thinner hull than the gun cruiser, and no extra mounts to make up for it
  expect(r.hp).toBeLessThan(r.cruiserHp);
  expect(r.mounts).toBeLessThanOrEqual(r.cruiserMounts);
  // and she must stay under the capital-ship handling threshold (len0 > 80 = 18kn and a barn-door
  // rudder), because "outrun what you can't outgun" is the entire point of a light missile hull
  expect(r.len0).toBeLessThanOrEqual(80);
  expect(r.zhName).toBeTruthy();
  expect(r.zhDesc).toBeTruthy();
});

test('missiles reload faster aboard her — and only aboard her, and only missiles', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof fireTurret === 'function' && typeof startGame === 'function');
  const r = await page.evaluate(([PRE_SRC]) => {
    eval('(' + PRE_SRC + ')()');
    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 4;

    // Fire one mount of each kind and read back the cooldown fireTurret actually set. Comparing
    // against WEAPONS[k].cd rather than a hard-coded number keeps the test honest if the weapon
    // is ever rebalanced — what's asserted is the RATIO, which is the mechanic.
    const cdOf = (shipId, extra) => {
      startGame(shipId); skipBanner();
      const out = {};
      for (const w of [WEAPONS.kh35, WEAPONS.missile, WEAPONS.sam, WEAPONS.deckgun, WEAPONS.torpedo]) {
        // mount it fresh so the reading never depends on which guns the hull happens to start with
        const t = buildTurret(w), p = player.build.mounts[0];
        t.position.copy(p); player.build.group.add(t);
        const pl = { def: w, group: t, yaw: 0, pitch: 0.1, cd: 0 };
        placed.push(pl);
        fireTurret(pl, null);
        out[w.name] = +(pl.cd / w.cd).toFixed(4);   // multiple of the weapon's own reload
      }
      if (extra) out.starters = extra();
      return out;
    };

    const cruiser = cdOf('missilecruiser', () => placed.filter(p => p.free).map(p => p.def.name).sort());
    const gunCruiser = cdOf('cruiser', () => placed.filter(p => p.free).map(p => p.def.name).sort());
    return { cruiser, gunCruiser, vls: SHIPS.missilecruiser.vls.cd };
  }, [PRE.toString()]);

  // aboard the missile cruiser: missile-kind mounts cycle at the hull's vls rate...
  expect(r.cruiser['Kh-35 Sea Skimmer']).toBeCloseTo(r.vls, 3);
  expect(r.cruiser['Missile Launcher']).toBeCloseTo(r.vls, 3);
  expect(r.cruiser['SAM Launcher']).toBeCloseTo(r.vls, 3);
  // ...and nothing else does. A perk that quietly speeds up every mount is a different ship.
  expect(r.cruiser['Deck Gun']).toBe(1);
  expect(r.cruiser['Torpedo Tube']).toBe(1);
  // the SAME launcher on her closest sibling reloads at its own rate — the bonus is the hull, not the gun
  expect(r.gunCruiser['Missile Launcher']).toBe(1);
  expect(r.gunCruiser['SAM Launcher']).toBe(1);
  expect(r.gunCruiser['Deck Gun']).toBe(1);

  // and she sails already armed as what she is: her own round and a SAM, not two deck guns
  expect(r.cruiser.starters).toEqual(['Deck Gun', 'Kh-35 Sea Skimmer', 'SAM Launcher']);
  expect(r.gunCruiser.starters).toEqual(['AA Battery', 'Deck Gun', 'Deck Gun']);
});

// The Kh-35 is the reason to sail her: the longest reach in the game, bought with damage. Both
// halves of that bargain have to hold, or it is either a dud or the next P-51.
test('the Kh-35 reaches 1000 m, hits softly, and flies the whole way', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof WEAPONS !== 'undefined' && typeof spawnShell === 'function');
  const r = await page.evaluate(([PRE_SRC]) => {
    eval('(' + PRE_SRC + ')()');
    const k = WEAPONS.kh35;
    const ranged = Object.values(WEAPONS).filter(w => w.range);
    const longestOther = Math.max(...ranged.filter(w => w !== k).map(w => w.range));
    const dmgOfOtherMissiles = Object.values(WEAPONS).filter(w => w.kind === 'missile' && w !== k && !w.aa).map(w => w.dmg);

    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 4;
    startGame('missilecruiser'); skipBanner();
    // Fire one into empty water away from every contact, so nothing is near enough to home onto
    // and it flies its own straight max-range profile. life defaults to 9 s and 1000 m at 165 m/s
    // is 6.1 s — close enough that a slower round would quietly expire before reaching its range.
    enemies.length = 0; aiPlanes.length = 0;
    const before = shells.length;
    spawnShell(k, player.pos.clone().setY(6), new THREE.Vector3(0, 0.02, -1).normalize(), 0, null);
    const sh = shells[shells.length - 1];
    const dt = 1 / 30;
    let flew = 0, expiredEarly = false;
    for (let i = 0; i < 30 * 12; i++) {
      t2 += dt; updateShells(dt);
      if (!shells.includes(sh)) { expiredEarly = sh.dist < k.range - 40; break; }
      flew = sh.dist;
    }
    return { range: k.range, longestOther, dmg: k.dmg, cd: k.cd, kind: k.kind, homing: !!k.homing,
             vlsOnly: !!k.vlsOnly, aa: !!k.aa, dmgOfOtherMissiles, spawned: shells.length > before || flew > 0,
             flew: Math.round(flew), expiredEarly,
             deckGunDps: +(WEAPONS.deckgun.dmg / WEAPONS.deckgun.cd).toFixed(1),
             kh35Dps: +(k.dmg / k.cd).toFixed(1) };
  }, [PRE.toString()]);

  expect(r.range).toBe(1000);
  expect(r.range).toBeGreaterThan(r.longestOther);        // the longest reach in the game, not merely a long one
  expect(r.kind).toBe('missile');
  expect(r.homing).toBe(true);
  // low damage is the price of that reach — softer than every other anti-ship missile...
  for (const d of r.dmgOfOtherMissiles) expect(r.dmg).toBeLessThan(d);
  // ...and slower firing than a free starter deck gun, so reach never becomes raw output
  expect(r.kh35Dps).toBeLessThan(r.deckGunDps);
  // it must actually cover its stated range: shells also die on `life`, and 1000 m is long
  // enough that a slow round would self-destruct in mid-air short of it
  expect(r.expiredEarly, `it only flew ${r.flew} m of its ${r.range} m`).toBe(false);
  expect(r.flew).toBeGreaterThan(r.range - 60);
});

// 1000 m of reach against a harbour is a siege engine, and it was: measured on Operation 1, one
// starter launcher flattened the enemy HQ from standoff in 110 seconds while taking 8 damage back.
// A sea skimmer is an anti-SHIP round, so it now barely marks shore — while its real job is
// untouched. Both halves matter: a weapon that is weak against everything is just a bad weapon.
test('the Kh-35 hits ships at full value and barely marks a harbour', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof shellShipDmg === 'function' && typeof startGame === 'function');
  const r = await page.evaluate(([PRE_SRC]) => {
    eval('(' + PRE_SRC + ')()');
    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 4;
    startGame('missilecruiser'); skipBanner();
    const ship = enemies.find(e => e.sinkT === 0);
    const land = landUnits.find(u => !u.dead);
    // armour wears as it is hit, so clear the cached value before each reading
    const hit = (w, t) => { if (!t) return null; delete t._armour;
      return +shellShipDmg({ dmg: w.dmg, aa: !!w.aa, kind: w.kind, travel: 0, antiShip: !!w.antiShip }, t).toFixed(2); };
    return {
      kh35: { ship: hit(WEAPONS.kh35, ship), harbor: hit(WEAPONS.kh35, enemyHarbor), land: hit(WEAPONS.kh35, land) },
      // the ordinary launcher is the control: same kind, no antiShip flag, so shore must not be scaled
      plain: { ship: hit(WEAPONS.missile, ship), harbor: hit(WEAPONS.missile, enemyHarbor) },
      raw: WEAPONS.kh35.dmg, plainRaw: WEAPONS.missile.dmg, hadLand: !!land,
    };
  }, [PRE.toString()]);

  // against a ship — its job — it lands its full printed damage, same as any other missile would
  expect(r.kh35.ship).toBe(r.raw);
  // against a harbour it is a rounding error: at least eight times softer than against a hull
  expect(r.kh35.harbor).toBeLessThan(r.kh35.ship / 8);
  expect(r.kh35.harbor).toBeGreaterThan(0);      // it still ticks — "does literally nothing" reads as broken
  if (r.hadLand) expect(r.kh35.land).toBeLessThan(r.kh35.ship / 4);   // shore structures too, not just the HQ
  // ...and the penalty is the FLAG, not something that quietly hit every missile in the game
  expect(r.plain.harbor).toBe(r.plainRaw);
  expect(r.plain.ship).toBe(r.plainRaw);
});

// Reach that any hull could bolt on is the P-51 again. It has to stay in the launch cells.
test('the Kh-35 only fits a hull with launch cells', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof tryPlace === 'function' && typeof buildShopUI === 'function');
  const r = await page.evaluate(([PRE_SRC]) => {
    eval('(' + PRE_SRC + ')()');
    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 4;
    // The Kh-35 costs 1800, so it also sits behind the ordinary campaign-level gate every
    // expensive mount does. Clear that here — this test is about the HULL gate, not that one.
    ensureCareerMarket(); career.mapsUnlocked = CAMPAIGN.length; saveCareer();
    const listedAndInstallable = shipId => {
      startGame(shipId); skipBanner();
      money = 99999;
      SHOP_SHOW_ALL.guns = true; shopTab = 'guns'; buildShopUI();
      const listed = !!document.querySelector('.witem[data-id="kh35"]');
      // ...and the install itself, which is the gate that survives a ship swap
      const n0 = placed.length;
      selectedWeapon = 'kh35'; driving = true; shopOpen = false; tryPlace();
      const installed = placed.length > n0;
      driving = false; selectedWeapon = null;
      return { listed, installed };
    };
    return { cruiser: listedAndInstallable('missilecruiser'),
             dreadnought: listedAndInstallable('dreadnought') };
  }, [PRE.toString()]);

  expect(r.cruiser.listed).toBe(true);
  expect(r.cruiser.installed).toBe(true);
  // a Dreadnought carries fifteen mounts — a 1000 m round on all of them deletes a fleet from
  // outside its reach, so it must be neither offered nor installable there
  expect(r.dreadnought.listed).toBe(false);
  expect(r.dreadnought.installed).toBe(false);
});
