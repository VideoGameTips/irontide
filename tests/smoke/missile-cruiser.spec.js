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
      for (const w of [WEAPONS.missile, WEAPONS.sam, WEAPONS.deckgun, WEAPONS.torpedo]) {
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
  expect(r.cruiser['Missile Launcher']).toBeCloseTo(r.vls, 3);
  expect(r.cruiser['SAM Launcher']).toBeCloseTo(r.vls, 3);
  // ...and nothing else does. A perk that quietly speeds up every mount is a different ship.
  expect(r.cruiser['Deck Gun']).toBe(1);
  expect(r.cruiser['Torpedo Tube']).toBe(1);
  // the SAME launcher on her closest sibling reloads at its own rate — the bonus is the hull, not the gun
  expect(r.gunCruiser['Missile Launcher']).toBe(1);
  expect(r.gunCruiser['SAM Launcher']).toBe(1);
  expect(r.gunCruiser['Deck Gun']).toBe(1);

  // and she sails already armed as what she is: a launcher and a SAM, not the standard two deck guns
  expect(r.cruiser.starters).toEqual(['Deck Gun', 'Missile Launcher', 'SAM Launcher']);
  expect(r.gunCruiser.starters).toEqual(['AA Battery', 'Deck Gun', 'Deck Gun']);
});
