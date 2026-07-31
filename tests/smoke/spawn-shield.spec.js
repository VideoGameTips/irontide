const { test, expect } = require('@playwright/test');

// You spawn in your own harbour with the fleet crowded around you. A friendly hull drifting into
// yours before you have touched the throttle used to take a bite out of the ship you just picked.
// For the first few seconds a new hull is still shoved clear of anything it touches — it just
// doesn't trade damage for it.
const PRE = () => {
  try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
  const b = document.getElementById('storyBtn'), s = document.getElementById('story');
  if (b && s && s.style.display === 'flex') b.click();
};

test('ramming does no damage for the first seconds of a new hull, and hurts again after', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof shipCollisions === 'function' && typeof SPAWN_SHIELD_SECS === 'number');
  const r = await page.evaluate(PRE_SRC => {
    eval('(' + PRE_SRC + ')()');
    const dt = 1 / 30;
    const ram = waitSecs => {
      difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 4;
      startGame('destroyer'); skipBanner();
      for (let i = 0; i < waitSecs * 30; i++) { t2 += dt; update(dt, t2); }
      const a = allies.find(x => x.sinkT === 0 && !x.proxy);
      if (!a) return null;
      // Clear the rest of the water. shipCollisions resolves EVERY pair in one pass, so in a
      // crowded harbour a third hull can shove this ally back into the player after their own
      // pair was already separated — which made the separation check fail at random depending
      // on how the fleet happened to spawn. One player, one ally, nothing else to interfere.
      allies.length = 0; allies.push(a); enemies.length = 0;
      player.hp = player.maxhp;
      const hp0 = player.hp, shieldLeft = player._spawnShield || 0;
      let overlapped = 0, bumps = 0, minRatio = 9, targetable = 0;
      for (let i = 0; i < 90; i++) {
        a.pos.copy(player.pos).add(new THREE.Vector3(1, 0, 1));   // drive it straight into the hull
        a.vel = new THREE.Vector3(30, 0, 30); player.vel = new THREE.Vector3(-30, 0, -30);
        a.proxy = false; a._ramCd = 0; player._ramCd = 0;
        shipCollisions(dt); bumps++;
        // the shield must not let hulls occupy the same water — separation still applies
        const gap = Math.hypot(a.pos.x - player.pos.x, a.pos.z - player.pos.z);
        const ratio = gap / (shipRadius(a.def) + shipRadius(player.def));
        minRatio = Math.min(minRatio, ratio);
        if (playerShipTargetable()) targetable++;
        if (ratio < 0.9) overlapped++;
        if (player.hp < hp0) break;
      }
      return { shieldLeft, lost: Math.round(hp0 - player.hp), bumps, overlapped, minRatio: +minRatio.toFixed(3), targetable };
    };
    return { fresh: ram(0.5), settled: ram(SPAWN_SHIELD_SECS + 1), secs: SPAWN_SHIELD_SECS };
  }, PRE.toString());

  expect(r.secs).toBe(4);
  // freshly spawned: shield still up, and ninety rams cost nothing
  expect(r.fresh.shieldLeft).toBeGreaterThan(0);
  expect(r.fresh.lost).toBe(0);
  expect(r.fresh.bumps).toBe(90);
  // ...but they are still pushed apart, not allowed to sit inside one another
  expect(r.fresh.targetable, 'the player hull must be in the collision list at all').toBe(90);
  expect(r.fresh.overlapped, `closest approach was ${r.fresh.minRatio} of the combined radius`).toBe(0);
  // once it lapses, a ram bites on the very first contact
  expect(r.settled.shieldLeft).toBeLessThanOrEqual(0);
  expect(r.settled.lost).toBeGreaterThan(0);
  expect(r.settled.bumps).toBe(1);
});

// The timer has to run even while you're away from the wheel, or stepping into a turret or a
// plane during those seconds would park it and you'd come back still unrammable.
test('the shield expires on its own even while you are away from the helm', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof SPAWN_SHIELD_SECS === 'number');
  const r = await page.evaluate(PRE_SRC => {
    eval('(' + PRE_SRC + ')()');
    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 4;
    startGame('destroyer'); skipBanner();
    const dt = 1 / 30;
    const atSpawn = player._spawnShield;
    // leave the helm — shipCollisions stops listing the player when the hull isn't targetable
    onFoot = true; driving = false;
    for (let i = 0; i < (SPAWN_SHIELD_SECS + 1) * 30; i++) { t2 += dt; update(dt, t2); }
    return { atSpawn, after: player._spawnShield };
  }, PRE.toString());

  expect(r.atSpawn).toBe(4);
  expect(r.after).toBeLessThanOrEqual(0);
});
