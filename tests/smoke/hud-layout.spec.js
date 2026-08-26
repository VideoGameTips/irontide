const { test, expect } = require('@playwright/test');

// The top bar used to be one centred column carrying six unrelated things — objective, both HQ
// bars, the next-step hint, island income, a timed bonus mission and a compass — all the same
// size and colour, and wide enough to run under the minimap at EVERY size measured (122x36px of
// overlap on a 360px phone, still 168x6px on a 1280px laptop). The action panel also sat on top
// of the kill feed by 208x130px. This pins the zones apart and keeps them apart.
const boot = () => {
  try { localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
  if (typeof dismissSplash === 'function') dismissSplash();
  const sp = document.getElementById('splash'); if (sp && sp.parentNode) sp.parentNode.removeChild(sp);
  const b = document.getElementById('storyBtn'), s = document.getElementById('story');
  if (b && s && s.style.display === 'flex') b.click();
  // a veteran, so nothing is hidden by the beginner "simple HUD" — the crowded case is the one
  // worth testing, and simpleHud would quietly hide half the rows
  career.wins = 5; career.losses = 2; career.mapsUnlocked = 40; SETTINGS.simpleHud = false;
  difficulty = 'easy'; currentSandboxIdx = SANDBOX_MAPS.findIndex(m => m.ground); currentMapIdx = 0;
  startGame('battleship'); skipBanner();
  for (let i = 0; i < 120; i++) { t2 += 0.05; update(0.05, t2); }
  try { if (typeof newSideObjective === 'function') { sideObT = 0; newSideObjective(); } } catch (e) {}
  // #comms and the kill-feed lines are created lazily, on the first radio call and the first hit.
  // Without traffic they simply are not in the DOM — which is how the radio log came to be parked
  // on top of the stat panel with every layout test passing. Make the busy HUD the tested HUD.
  for (let i = 0; i < 6; i++) comms('ALPHA-' + i, 'Radio traffic line number ' + i + ' reporting in.', '#a8d4f0', 2);
  updateComms(0.016);
  const feed = document.getElementById('killfeed');
  if (feed) for (let i = 0; i < 5; i++) { const d = document.createElement('div');
    d.className = 'killline enemy'; d.textContent = 'DESTROYED · TARGET ' + i; feed.prepend(d); }
  for (let i = 0; i < 10; i++) { t2 += 0.05; update(0.05, t2); }
  applySimpleHud(); updateHUD(); updatePrompt(0.016);
};

const IDS = ['money', 'objective', 'topRight', 'sysBtn', 'alertBar', 'leftCol', 'statPanel', 'obcompass',
             'minimap', 'actions', 'nextstep', 'prompt', 'shiphpwrap', 'killfeed', 'comms'];

const measure = ([IDS]) => {
  const box = id => { const e = document.getElementById(id); if (!e) return null;
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden') return { hidden: true };
    const r = e.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return { hidden: true };
    return { x: r.left, y: r.top, w: r.width, h: r.height }; };
  const B = {}; IDS.forEach(i => B[i] = box(i));
  const live = IDS.filter(i => B[i] && !B[i].hidden);
  const over = [];
  for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
    const a = B[live[i]], b = B[live[j]];
    // skip genuine parent/child pairs — those are nesting, not collision
    const ea = document.getElementById(live[i]), eb = document.getElementById(live[j]);
    if (ea.contains(eb) || eb.contains(ea)) continue;
    const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (ox > 4 && oy > 4) over.push(`${live[i]}x${live[j]} ${Math.round(ox)}x${Math.round(oy)}`);
  }
  const off = live.filter(i => { const b = B[i];
    return b.x < -1 || b.y < -1 || b.x + b.w > innerWidth + 1 || b.y + b.h > innerHeight + 1; });
  const obj = B.objective;
  return { vw: innerWidth, vh: innerHeight, overlaps: over, offscreen: off,
           objTopShare: obj && !obj.hidden ? +(obj.h / innerHeight * 100).toFixed(1) : 0,
           live, boxes: B };
};

for (const [w, h, name] of [[360,640,'phone'],[390,844,'iPhone'],[667,375,'landscape'],[768,1024,'tablet'],[1280,800,'laptop']]) {
  test(`HUD zones do not collide at ${w}x${h} (${name})`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('http://localhost:3000/');
    await page.waitForFunction(() => typeof startGame === 'function');
    await page.evaluate(boot);
    const r = await page.evaluate(measure, [IDS]);
    console.log(`LAYOUT ${w}x${h} ` + JSON.stringify({ overlaps: r.overlaps, offscreen: r.offscreen,
      objTopShare: r.objTopShare, live: r.live.length }));
    if (r.overlaps.length) console.log('  BOXES ' + JSON.stringify(
      ['leftCol','comms','killfeed','statPanel','nextstep','prompt','minimap'].reduce((o,k)=>{const b=r.boxes[k];
        o[k]=b&&!b.hidden?[Math.round(b.x),Math.round(b.y),Math.round(b.w),Math.round(b.h)]:'hidden';return o;},{})));

    expect(r.overlaps, 'HUD elements are on top of each other').toEqual([]);
    expect(r.offscreen, 'a HUD element runs off the screen').toEqual([]);
    // the objective block used to eat 12-17% of a phone screen; it is one line now
    expect(r.objTopShare, 'the objective block is hogging the screen again').toBeLessThan(8);
    // and the way out has to survive every layout
    expect(r.live, 'the menu button vanished at this size').toContain('sysBtn');
    // the fixture must actually have produced the busy HUD, or none of the above proves anything
    expect(r.live, 'no radio log was rendered — the crowded case went untested').toContain('comms');
  });
}
