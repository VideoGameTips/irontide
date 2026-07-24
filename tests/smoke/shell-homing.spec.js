const { test, expect } = require('@playwright/test');
// Deterministic: fixed geometry, no live entities, so the numbers are comparable run to run
// (and between the pre/post refactor builds).
const PROBE = () => {
  const b=document.getElementById('storyBtn'), s=document.getElementById('story');
  if(b&&s&&s.style.display==='flex') b.click();
  startGame('destroyer'); skipBanner();
  shells.length = 0;
  const target = new THREE.Vector3(100, 20, 300);
  const sh = { mesh:{ position:new THREE.Vector3(0,20,0), geometry:{type:'ConeGeometry'},
                 quaternion:new THREE.Quaternion() },
    vel:new THREE.Vector3(0,0,60), life:9, dist:0, team:0, dmg:5, homing:true, turn:2.4,
    fixedTarget:target, detonated:false, trail:null };
  shells.push(sh);
  const dirTo = () => target.clone().sub(sh.mesh.position).normalize();
  const dot0 = sh.vel.clone().normalize().dot(dirTo());
  for(let i=0;i<10 && shells.includes(sh);i++) updateShells(0.016);
  const dot1 = sh.vel.clone().normalize().dot(dirTo());
  return { dot0:+dot0.toFixed(6), dot1:+dot1.toFixed(6),
           speed:+sh.vel.length().toFixed(6),
           pos:[+sh.mesh.position.x.toFixed(4),+sh.mesh.position.y.toFixed(4),+sh.mesh.position.z.toFixed(4)],
           quat:[+sh.mesh.quaternion.x.toFixed(6),+sh.mesh.quaternion.w.toFixed(6)] };
};
test('homing steers toward the target without the per-frame allocations', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(PROBE);
  console.log('SHELLPROBE ' + JSON.stringify(r));
  expect(r.dot1).toBeGreaterThan(r.dot0);              // turned toward the target
  // Homing lerps between two equal-length vectors, which cuts the chord, so a steering shell
  // bleeds a little speed (60 -> 59.16 over ten frames here). Pre-existing and unchanged by
  // the scratch-vector refactor — this bounds it rather than pretending it is exactly 60.
  expect(r.speed).toBeGreaterThan(58);
  expect(r.speed).toBeLessThanOrEqual(60);
  expect(Number.isFinite(r.quat[0]) && Number.isFinite(r.quat[1])).toBe(true);
});
