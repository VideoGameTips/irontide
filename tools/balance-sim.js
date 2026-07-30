#!/usr/bin/env node
// 平衡模拟器 / balance sim — 回答一个问题：玩家到底有没有用？
//
// 直接驱动游戏的 update(dt,t2)，不渲染，约 60 倍实时速度，所以 20 分钟的战斗 20 秒跑完。
// 每个组合跑两种打法：
//   idle   玩家开局后一动不动（船上的自动炮塔照常还击 —— 这就是基线）
//   active 玩家主动逼近最近的敌舰，打光了就去轰敌港
// 两者的胜率/耗时/血量如果没有差别，说明这场仗跟玩家没关系。
//
//   node tools/balance-sim.js                        默认 3 张图 × 3 次 × 20 分钟
//   node tools/balance-sim.js --maps 0,9 --trials 5 --minutes 25 --diff easy,hard
//   node tools/balance-sim.js --json out.json        额外写出原始数据
const { chromium } = require('@playwright/test');
const fs = require('fs');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const MAPS    = arg('maps', '0,4,9').split(',').map(Number);
const DIFFS   = arg('diff', 'easy,normal,hard').split(',');
const TRIALS  = +arg('trials', 3);
const MINUTES = +arg('minutes', 20);
const SHIP    = arg('ship', 'destroyer');
const JSONOUT = arg('json', null);
const URL     = arg('url', 'http://localhost:3000/');
const STYLES  = arg('styles', 'idle,active,commander').split(',');

// 这段在浏览器里跑：一整场战斗，返回结局。
function runTrial({ map, diff, style, minutes, ship }) {
  try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
  const b = document.getElementById('storyBtn'), s = document.getElementById('story');
  if (b && s && s.style.display === 'flex') b.click();

  // 结局从 endGame 里截获（顶层函数声明挂在 window 上，内部调用也走这里）
  let outcome = null;
  const realEnd = window.endGame;
  window.endGame = (win, msg) => { if (outcome === null) outcome = !!win; realEnd(win, msg); };

  difficulty = diff; quickMode = false; currentSandboxIdx = -1; currentMapIdx = map;
  startGame(ship); skipBanner();
  const hp0 = player.maxhp;

  // 主动打法 —— 一个还算像样的玩家，不是一个自杀的玩家：
  // 压到自动炮塔射程（270m）的外圈开火，敌舰清完就去轰敌港，血少了回自家港口修。
  // 早先版本一路顶到 170m 单舰冲脸，2 分钟就沉了 —— 那测的是鲁莽，不是参与。
  let retreating = false;
  const drive = () => {
    if (player.hp < player.maxhp * 0.35) retreating = true;
    if (player.hp > player.maxhp * 0.85) retreating = false;
    let tgt = null, bd = 1e9;
    if (retreating) { tgt = friendlyHarbor ? friendlyHarbor.pos : null; }
    else {
      for (const e of enemies) { if (e.sinkT > 0) continue; const d = e.pos.distanceTo(player.pos); if (d < bd) { bd = d; tgt = e.pos; } }
      if (!tgt && enemyHarbor) tgt = enemyHarbor.pos;
    }
    if (!tgt) { keys['KeyW'] = 0; return; }
    const to = tgt.clone().sub(player.pos), dist = Math.hypot(to.x, to.z);
    let dy = Math.atan2(to.x, to.z) - player.heading;
    while (dy > Math.PI) dy -= 6.283185; while (dy < -Math.PI) dy += 6.283185;
    keys['KeyA'] = dy > 0.04 ? 1 : 0;
    keys['KeyD'] = dy < -0.04 ? 1 : 0;
    keys['KeyW'] = (retreating ? dist > 40 : dist > 230) ? 1 : 0;   // 交战时停在射程内、被集火范围外
  };

  // commander —— 一个真的想赢的玩家：下「打敌方总部」的命令，自己开到敌港外围，
  // 手动把每一门炮都对着敌港打。idle/active 都不会手动瞄准，而真人会，所以少了这一档
  // 就等于假设玩家永远不主动打目标。
  let ordered = false;
  const command = () => {
    if (!ordered && t2 - warStartT2 > 20) { fleetOrder = -1; fleetOrderCmd(); ordered = true; }
    if (!enemyHarbor || enemyHarbor.hp <= 0) { keys['KeyW'] = 0; return; }
    const aim = enemyHarbor.pos.clone().setY(7);
    const to = aim.clone().sub(player.pos), dist = Math.hypot(to.x, to.z);
    let dy = Math.atan2(to.x, to.z) - player.heading;
    while (dy > Math.PI) dy -= 6.283185; while (dy < -Math.PI) dy += 6.283185;
    keys['KeyA'] = dy > 0.04 ? 1 : 0;
    keys['KeyD'] = dy < -0.04 ? 1 : 0;
    keys['KeyW'] = dist > 250 ? 1 : 0;
    if (dist < 340) for (const pl of placed) { if (!pl.ko && pl.cd <= 0) fireTurret(pl, aim); }
  };

  const dt = 1 / 30, N = Math.round(minutes * 60 / dt);
  let steps = 0, respawns = 0;
  for (let i = 0; i < N; i++) {
    // losing your hull isn't losing the war — playerSunk() parks you in the respawn menu, and a
    // real player just picks another ship. Treating that as the end of the run made an engaged
    // player look like they died at 2 minutes when they'd actually only lost a destroyer.
    if (phase === 'respawn') { respawnPlayer(ship); respawns++; Object.keys(keys).forEach(k => keys[k] = 0); }
    if (phase !== 'play') break;
    if (style === 'active') drive();
    if (style === 'commander') command();
    t2 += dt; update(dt, t2); steps++;
  }
  Object.keys(keys).forEach(k => keys[k] = 0);
  window.endGame = realEnd;

  return {
    map, diff, style,
    结局: outcome === null ? '打不完' : outcome ? '赢' : '输',
    分钟: +(steps / 30 / 60).toFixed(1),
    残血: Math.round(100 * Math.max(0, player.hp) / hp0),
    击沉: sunk,
    换船: shipsLostThisWar, 重生: respawns,
    // 港口会随升级涨上限，所以按各自当前的 maxhp 算，不按开局值（早先版本会报出 158% 这种数）
    敌港: enemyHarbor ? Math.round(100 * Math.max(0, enemyHarbor.hp) / enemyHarbor.maxhp) : 0,
    我港: friendlyHarbor ? Math.round(100 * Math.max(0, friendlyHarbor.hp) / friendlyHarbor.maxhp) : 0,
    敌舰: enemies.length, 友舰: allies.length,
  };
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('  ⚠ 页面异常:', e.message.slice(0, 140)));
  await page.goto(URL);
  await page.waitForFunction(() => typeof startGame === 'function' && typeof update === 'function');

  const rows = [];
  const total = MAPS.length * DIFFS.length * STYLES.length * TRIALS;
  let n = 0, t0 = Date.now();
  for (const diff of DIFFS) for (const map of MAPS) for (const style of STYLES) {
    for (let k = 0; k < TRIALS; k++) {
      const r = await page.evaluate(runTrial, { map, diff, style, minutes: MINUTES, ship: SHIP });
      rows.push(r); n++;
      process.stderr.write(`\r  ${n}/${total} …`);
    }
  }
  process.stderr.write(`\r  ${n}/${total} 完成，实际耗时 ${Math.round((Date.now() - t0) / 1000)}s\n\n`);
  await browser.close();

  // 汇总：同一 (难度, 地图) 下 idle 与 active 的差
  const key = r => `${r.diff}|${r.map}|${r.style}`;
  const groups = new Map();
  for (const r of rows) { if (!groups.has(key(r))) groups.set(key(r), []); groups.get(key(r)).push(r); }
  const avg = (a, f) => +(a.reduce((s, x) => s + f(x), 0) / a.length).toFixed(1);
  const table = [];
  for (const [k, a] of groups) {
    const [diff, map, style] = k.split('|');
    table.push({
      难度: diff, 地图: +map, 打法: style,
      胜率: Math.round(100 * a.filter(r => r.结局 === '赢').length / a.length) + '%',
      平均分钟: avg(a, r => r.分钟), 残血: avg(a, r => r.残血) + '%',
      击沉: avg(a, r => r.击沉), 换船: avg(a, r => r.换船), 重生: avg(a, r => r.重生),
      敌港剩: avg(a, r => r.敌港) + '%', 友舰: avg(a, r => r.友舰), 敌舰: avg(a, r => r.敌舰),
    });
  }
  console.table(table);

  console.log(`\n玩家影响力（同难度同地图求平均）：`);
  for (const diff of DIFFS) {
    const pick = (style, f) => { const a = table.filter(t => t.难度 === diff && t.打法 === style); return a.length ? a.reduce((s, x) => s + f(x), 0) / a.length : NaN; };
    const win = s => pick(s, t => parseFloat(t.胜率));
    const min = s => pick(s, t => t.平均分钟);
    const hp  = s => pick(s, t => parseFloat(t.残血));
    for (const st of STYLES) console.log(`  ${diff.padEnd(7)} ${st.padEnd(10)} 胜率 ${win(st).toFixed(0)}%  耗时 ${min(st).toFixed(1)} 分钟  残血 ${hp(st).toFixed(0)}%`);
  }
  if (JSONOUT) { fs.writeFileSync(JSONOUT, JSON.stringify(rows, null, 1)); console.log(`\n原始数据 → ${JSONOUT}`); }
})();
