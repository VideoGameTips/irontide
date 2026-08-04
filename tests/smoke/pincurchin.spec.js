const { test, expect } = require('@playwright/test');

const PRE = () => {
  try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
  const b = document.getElementById('storyBtn'), s = document.getElementById('story');
  if (b && s && s.style.display === 'flex') b.click();
};

// The Pincurchin Republic already flies in this game — the SS-17, the P-11 and the SP-9-R, all
// with electric-cyan guns. This is their first hull, and the only warship that sails already
// armed: four Plasma Miniguns fitted from the yard.
test('she sails pre-armed with four Plasma Miniguns', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof buildMenu === 'function');
  const r = await page.evaluate(([PRE_SRC]) => {
    eval('(' + PRE_SRC + ')()');
    _allShips = true; buildMenu();
    const inPicker = /Pincurchin|海胆号/.test([...document.querySelectorAll('#ships .ship h3')].map(h => h.textContent).join('|'));

    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 4;
    startGame('pincurchin'); skipBanner();
    const P = WEAPONS.plasmamini;
    const fitted = placed.filter(p => p.def === P);
    return {
      inPicker, marketOnly: !!SHIPS.pincurchin.marketOnly,
      faction: SHIPS.pincurchin.faction,
      fitted: fitted.length, allFree: fitted.every(p => p.free),
      // nothing else came with her — the four guns ARE the loadout
      starters: placed.filter(p => p.free).map(p => p.def.name).sort(),
      rate: +(1 / P.cd).toFixed(0), dmg: P.dmg, range: P.range, kind: P.kind,
      zhName: (typeof SHIPS_ZH !== 'undefined' && SHIPS_ZH.pincurchin) ? SHIPS_ZH.pincurchin.name : null,
      zhGun: (typeof WEAPONS_ZH !== 'undefined' && WEAPONS_ZH.plasmamini) ? WEAPONS_ZH.plasmamini.name : null,
      // the spines are real geometry, not a description
      spineMeshes: (() => { let n = 0; player.build.group.traverse(o => {
        if (o.isMesh && o.material && o.material.emissive && o.material.emissive.getHex() > 0x40c0ff
            && o.material.emissive.getHex() < 0x9fffff) n++; }); return n; })(),
    };
  }, [PRE.toString()]);

  expect(r.inPicker).toBe(true);
  expect(r.marketOnly).toBe(false);
  expect(r.faction).toBe('Pincurchin Republic');   // she belongs to the faction already in the game
  // exactly the spec: four guns, 20 a second, 10 a bolt, 800 m
  expect(r.fitted).toBe(4);
  expect(r.allFree).toBe(true);
  expect(r.starters).toEqual(['Plasma Minigun', 'Plasma Minigun', 'Plasma Minigun', 'Plasma Minigun']);
  expect(r.rate).toBe(20);
  expect(r.dmg).toBe(10);
  expect(r.range).toBe(800);
  expect(r.zhName).toBeTruthy();
  expect(r.zhGun).toBeTruthy();
  expect(r.spineMeshes).toBeGreaterThan(10);       // a sea urchin needs spines
});

// The whole balance question. A 10-damage bolt at 20/s is EXACTLY the profile Andy's own P-51 fix
// was built to blunt, so the armour rule has to keep applying at full strength. But falloff and
// armour were compounding — falloff cut the bolt to 3.5 and the armour threshold then squared that
// ratio down to 0.09 against a hull, so a gun whose card reads 800 m did nine hundredths of a point
// at 400. Plasma is exempt from falloff only; armour is untouched.
test('plasma carries downrange, but armour still blunts it', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof shellShipDmg === 'function' && typeof startGame === 'function');
  const r = await page.evaluate(([PRE_SRC]) => {
    eval('(' + PRE_SRC + ')()');
    difficulty = 'normal'; currentSandboxIdx = -1; currentMapIdx = 4;
    startGame('pincurchin'); skipBanner();
    const P = WEAPONS.plasmamini, D = WEAPONS.deckgun;
    const ship = enemies.find(e => e.sinkT === 0);
    const shot = (w, travel) => ({ dmg: w.dmg, aa: !!w.aa, kind: w.kind, travel, plasma: !!w.plasma });
    const hit = (w, t, travel) => { if (t) delete t._armour; return +shellShipDmg(shot(w, travel), t).toFixed(2); };
    return {
      // against something unarmoured (an aircraft) the bolt keeps its full value all the way out
      plasmaAir: { near: +shellShipDmg(shot(P, 0), null).toFixed(2), far: +shellShipDmg(shot(P, 800), null).toFixed(2) },
      // an ORDINARY gun still bleeds downrange — the exemption is plasma only, not a repeal
      deckGunAir: { near: +shellShipDmg(shot(D, 0), null).toFixed(2), far: +shellShipDmg(shot(D, 800), null).toFixed(2) },
      // and armour still blunts the bolt hard, which is what stops fast light guns beating armour
      plasmaShip: hit(P, ship, 0), plasmaHarbor: hit(P, enemyHarbor, 0), raw: P.dmg,
      fourGunShipDps: Math.round(4 * hit(P, ship, 400) / P.cd),
      sixteenInchDps: Math.round(hit(WEAPONS.sixteen, ship, 400) * (WEAPONS.sixteen.barrels || 1) / WEAPONS.sixteen.cd),
    };
  }, [PRE.toString()]);

  // plasma does not fade with distance...
  expect(r.plasmaAir.far).toBe(r.plasmaAir.near);
  expect(r.plasmaAir.far).toBe(r.raw);
  // ...but an ordinary gun still does, so the P-51 rule is intact for everything else
  expect(r.deckGunAir.far).toBeLessThan(r.deckGunAir.near * 0.5);
  // armour still bites, and bites hard: a 10-point bolt is a rounding error on a hull
  expect(r.plasmaShip).toBeLessThan(r.raw * 0.3);
  expect(r.plasmaHarbor).toBeLessThan(r.plasmaShip);   // harbours are armoured heavier still
  expect(r.plasmaShip).toBeGreaterThan(0);
  // four of them are a serious battery but not a game-breaker — same order as a 16-inch main battery
  expect(r.fourGunShipDps).toBeGreaterThan(r.sixteenInchDps * 0.8);
  expect(r.fourGunShipDps).toBeLessThan(r.sixteenInchDps * 2);
});

// 4 guns x 20 shots/sec is 80 projectiles a second into a 360-shell pool, and spawnShell evicts
// the OLDEST shell when it is full — so a slow bolt would quietly delete everyone else's fire,
// including the enemy's. 520 m/s is chosen to keep the pool clear, and that has to stay true.
test('firing all four flat out does not crowd out every other shell', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(([PRE_SRC]) => {
    eval('(' + PRE_SRC + ')()');
    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 4;
    startGame('pincurchin'); skipBanner();
    const P = WEAPONS.plasmamini;
    const guns = placed.filter(p => p.def === P);
    const foe = enemies.find(e => e.sinkT === 0);
    let peak = 0, evictions = 0, fired = 0;
    const realSpawn = window.spawnShell;
    window.spawnShell = (...a) => { if (shells.length >= MAX_SHELLS) evictions++; fired++; return realSpawn(...a); };
    const dt = 1 / 30;
    for (let i = 0; i < 30 * 20; i++) {
      if (foe && foe.sinkT === 0) player.pos.copy(foe.pos).add(new THREE.Vector3(150, 0, 150));
      for (const g of guns) {
        g.yaw = Math.atan2(foe.pos.x - player.pos.x, foe.pos.z - player.pos.z); g.pitch = 0.02;
        if (g.cd <= 0) fireTurret(g, foe.pos.clone().setY(foe.def.deckY + 1));
      }
      t2 += dt; update(dt, t2);
      peak = Math.max(peak, shells.length);
    }
    window.spawnShell = realSpawn;
    return { peak, evictions, fired, cap: MAX_SHELLS, guns: guns.length };
  }, [PRE.toString()]);

  expect(r.guns).toBe(4);
  expect(r.fired).toBeGreaterThan(400);            // they really were firing flat out for 20 s
  expect(r.evictions, `the pool overflowed ${r.evictions} times`).toBe(0);
  expect(r.peak).toBeLessThan(r.cap * 0.6);        // and with real headroom left for everyone else
});
