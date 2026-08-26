const { test, expect } = require('@playwright/test');

// "按 E 进入坦克太难了，前后左右都试了，下面也试了，都不行."
//
// Two separate faults stacked up. buyTank drops a land-campaign tank at exactly `side * 8`, and
// nearestFieldTank required `d < 8` — so the drop landed ON the pickup line and the ±2 jitter
// pushed 62% of bought tanks outside it. And the 8 was measured from the tank's CENTRE while the
// tank is ~6.8 long, so at its nose or tail you were out of range while visibly touching the hull.
// Walking around it does not help with either, which is exactly what the report describes.
const boot = () => {
  try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
  const b = document.getElementById('storyBtn'), s = document.getElementById('story');
  if (b && s && s.style.display === 'flex') b.click();
  currentSandboxIdx = SANDBOX_MAPS.findIndex(m => m.ground); difficulty = 'easy';
  startGame('battleship'); skipBanner();
  for (let i = 0; i < 40; i++) { t2 += 0.05; update(0.05, t2); }
  money = 1e9;
};

test('a tank you just bought can be crewed without moving a step', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(([SRC]) => {
    eval('(' + SRC + ')()');
    const home = footPos.clone(); const dists = []; let ok = 0;
    for (let n = 0; n < 48; n++) {
      camYaw.v = n / 48 * 6.2832; footPos.copy(home);
      const before = playerTanks.length;
      buyTank('sherman');
      if (playerTanks.length === before) continue;      // "too crowded" — not what this test is about
      const tk = playerTanks[playerTanks.length - 1];
      dists.push(Math.hypot(footPos.x - tk.pos.x, footPos.z - tk.pos.z));
      drivingTank = null; onFoot = true;
      toggleMan();
      if (drivingTank === tk) ok++;
      drivingTank = null; onFoot = true;
      tk.pos.set(home.x + 900, 0, home.z + 900); tk.group.position.copy(tk.pos);   // park it far away
    }
    return { samples: dists.length, ok, maxDrop: +Math.max(...dists).toFixed(2),
             reach: +tankReach(playerTanks[0]).toFixed(2) };
  }, [boot.toString()]);
  console.log('DROPFIX ' + JSON.stringify(r));

  expect(r.samples, 'nothing was delivered — the fixture proves nothing').toBeGreaterThan(30);
  expect(r.ok, 'a tank the game says was "delivered beside you" could not be crewed').toBe(r.samples);
  expect(r.maxDrop, 'the drop still reaches the edge of the pickup ring').toBeLessThan(r.reach - 1.5);
});

// The invariant that was actually broken: the HUD offers "press E to crew X" off the SAME check
// the key uses, so if it is on screen the key must work. It said so at 7.99 and did nothing at 8.01.
test('whenever the HUD offers E, E actually crews the tank', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(([SRC]) => {
    eval('(' + SRC + ')()');
    buyTank('sherman');
    for (let i = 0; i < 6; i++) { t2 += 0.05; update(0.05, t2); }
    const tk = playerTanks[0], base = tk.pos.clone();
    let offered = 0, worked = 0, lied = 0, farthestOffer = 0;
    for (let ring = 2; ring <= 14; ring += 0.5) {
      for (let a = 0; a < 12; a++) {
        const th = a / 12 * 6.2832;
        footPos.set(base.x + Math.cos(th) * ring, footPos.y, base.z + Math.sin(th) * ring);
        drivingTank = null; onFoot = true; promptT = 0;
        updatePrompt(0.016);
        const txt = document.getElementById('prompt').textContent || '';
        if (!/Press E to crew|按 E 进入/.test(txt)) continue;
        offered++; farthestOffer = Math.max(farthestOffer, ring);
        toggleMan();
        if (drivingTank === tk) worked++; else lied++;
        drivingTank = null; onFoot = true;
      }
    }
    const hullSpan = (() => { const b = new THREE.Box3().setFromObject(tk.group);
      return Math.max(b.max.x - b.min.x, b.max.z - b.min.z); })();
    // standing clear of the hull but plainly AT the tank: 5 m of daylight past its widest point
    const beside = hullSpan / 2 + 5;
    footPos.set(base.x, footPos.y, base.z + beside);
    drivingTank = null; onFoot = true; toggleMan();
    const besideWorks = drivingTank === tk;
    drivingTank = null; onFoot = true;
    return { offered, worked, lied, farthestOffer, besideWorks,
             beside: +beside.toFixed(2), hullSpan: +hullSpan.toFixed(1) };
  }, [boot.toString()]);
  console.log('HUDTRUTH ' + JSON.stringify(r));

  expect(r.offered, 'the HUD never offered the prompt — nothing was tested').toBeGreaterThan(20);
  expect(r.lied, 'the HUD offered "press E to crew" at a spot where E does nothing').toBe(0);
  expect(r.worked).toBe(r.offered);
  // ...and the reach has to CLEAR the hull, not stop at it. The old flat 8 was measured from the
  // centre of a 6.7-long tank, so it ran out barely 4.6 m past the hull — at the nose or tail you
  // were outside it while standing against the armour. This stands 5 m clear of the widest point.
  expect(r.besideWorks, 'you cannot crew the tank while standing right beside it').toBe(true);
});

// The deck path is a different function (nearestDeckTank) that this fix deliberately did NOT
// widen — a bigger radius there would shadow a deck gun, which E checks AFTER the tank.
test('tanks parked on your own deck are still crewable from any side', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(() => {
    try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 3;
    startGame('battleship'); skipBanner();
    for (let i = 0; i < 30; i++) { t2 += 0.05; update(0.05, t2); }
    money = 1e9; buyTank('sherman');
    for (let i = 0; i < 10; i++) { t2 += 0.05; update(0.05, t2); }
    const tk = playerTanks.find(t => t.onDeck);
    if (!tk) return { err: 'no deck tank' };
    driving = false; manning = null; onFoot = false;
    const got = [];
    [[0, 4], [0, -4], [-4, 0], [4, 0]].forEach(off => {
      walkPos.set(tk.group.position.x + off[0], deckEyeY(), tk.group.position.z + off[1]);
      drivingTank = null; driving = false; manning = null;
      toggleMan();
      got.push(drivingTank === tk ? 'tank' : driving ? 'helm' : manning ? 'turret' : 'nothing');
      drivingTank = null; driving = false; manning = null;
    });
    return { got };
  });
  console.log('DECKTANK ' + JSON.stringify(r));
  expect(r.err).toBeUndefined();
  expect(r.got).toEqual(['tank', 'tank', 'tank', 'tank']);
});
