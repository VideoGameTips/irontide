// ============================================================================
//  Iron Tide — deterministic shot capture rig
// ============================================================================
//
//  WHAT THIS SOLVES
//  The first attempt recorded gameplay with Playwright's recordVideo. Measured
//  result: a 1197-frame file containing only 277 distinct images — the page was
//  really rendering at ~5.8fps under software rasterisation, and every frame got
//  duplicated four times. That is the stutter.
//
//  This rig removes rendering speed from the equation. It takes the render loop
//  away from the browser, advances the game's own clock by a fixed dt, renders
//  exactly one frame, screenshots it, and repeats. However slowly the page draws,
//  the output is a perfect 60fps sequence. Verified: a 180-frame test survived
//  ffmpeg's mpdecimate filter with zero frames dropped.
//
//  Cost: roughly 12x realtime (3 virtual seconds took 35 wall seconds at 960x540).
//  Budget accordingly — a 25-second trailer is ~15 minutes of rendering per pass.
//
//  USAGE
//    node capture-shot.js <shot-name>       # one shot → frames/<shot-name>/
//    node capture-shot.js --list
//    node capture-shot.js --all
//  Then assemble with build-trailer.sh.
//
//  ADDING A SHOT
//  Append to the SHOTS array. Each shot has:
//    stage(page)   – set up the world: ship, enemies, weather, damage state
//    camera(t, i)  – returns the camera for virtual time t (seconds into the shot).
//                    Runs in the browser. MUST be a pure function of t so the
//                    motion is identical on every re-render.
//    seconds       – shot length. Keep shots SHORT (see TRAILER-BRIEF.md).
//    fps           – 60 unless you want the render cost of something slower.
// ============================================================================

const { chromium } = require('@playwright/test');
const fs = require('fs'), path = require('path');

const GAME = process.env.IRONTIDE_URL || 'https://game.boobank.com/irontide/';
const FRAMES = path.join(__dirname, 'frames');
const W = Number(process.env.W || 1280), H = Number(process.env.H || 720);

// ---------------------------------------------------------------------------
//  Shared staging helpers — these run inside the page.
// ---------------------------------------------------------------------------

// Boot to a playable war with the tutorial and prologue out of the way.
async function boot(page, { ship = 'battleship', theater = null, difficulty = 'normal' } = {}) {
  await page.goto(GAME, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof startGame === 'function' && typeof SHIPS === 'object');
  await page.evaluate(({ ship, theater, difficulty }) => {
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    setLang('en');
    // skipBanner() only clears an ALREADY-VISIBLE banner. Called right after startGame()
    // the theater briefing card is still queued, so it appears a moment later and sits
    // on top of the footage. Stub the source instead, before the war starts.
    window.showBanner = () => {};
    window.flashPrompt = () => {};          // and no toasts on camera
    for (const k of ['ironTideTutorialDone', 'ironTidePlaneTutDone', 'ironTideTankTutDone']) {
      try { localStorage.setItem(k, '1'); } catch (e) {}
    }
    localStorage.setItem('ironTideDifficulty', difficulty);
    if (theater != null && typeof currentMapIdx !== 'undefined') currentMapIdx = theater;
    startGame(ship);
    skipBanner();
    if (typeof skipTutorial === 'function') skipTutorial();
  }, { ship, theater, difficulty });
}

// Pin the light. weather.tod advances on its own (dt/360 — a full day in ~6 minutes)
// and the type re-rolls, so a one-time assignment will not hold for a whole shot.
// _MAP.weatherLock is the game's own mechanism for this.
//
// LOOK VALUES THAT ACTUALLY WORK (the sky is one flat colour, not a gradient, so warm
// dusk tints render muddy rather than golden):
//   tod 0.50  brightest, longest view distance — use for hero/clarity shots and for
//             anything that has to read as a thumbnail
//   tod 0.90  night: moonlit water, stars, and explosions have something to bloom against
//   AVOID tod 0.16 (dark murky pre-dawn) and 0.25 / 0.75 (flat muddy brown)
const LIGHT = `
  window.__light = (type, tod) => {
    window._MAP = Object.assign(window._MAP || {}, { weatherLock: true, weather: type, tod });
    weather.type = type; weather.tod = tod;
  };
`;

// Arm the player's deck the way a mid-campaign player would have it.
const ARM = `
  money = 999999;
  for (const w of ['deckgun','deckgun','twin','bofors','oerlikon','aa']) {
    selectedWeapon = w; try { tryPlace(); } catch (e) {}
  }
  selectedWeapon = null;
`;

// Place N enemies on chosen bearings/distances relative to the player's heading.
// spawnEnemy() drops ships near the enemy harbour, which is far too distant to film.
//
// STAGING RULE — the first attempt put five ships on a shallow bearing fan at nearly
// the same range, all facing the player. That renders as an evenly spaced row of chips
// along the horizon: a parking lot, not a battle. Depth in a naval shot comes from
// overlapping hulls at DIFFERENT ranges, so a near ship partially occludes a far one,
// and from varied headings so they read as manoeuvring rather than parked. Give each
// spec its own dist (spread them 80m-320m) and its own facing offset.
const PLACE_ENEMIES = `
  window.__placeEnemies = (specs) => {
    for (let i = 0; i < specs.length; i++) { try { spawnEnemy(); } catch (e) {} }
    const h = player.heading;
    const f = { x: Math.sin(h), z: Math.cos(h) };
    const r = { x: Math.cos(h), z: -Math.sin(h) };
    enemies.slice(-specs.length).forEach((e, i) => {
      const { bearing, dist, facing } = specs[i];
      const a = bearing * Math.PI / 180;
      e.pos.set(player.pos.x + (f.x * Math.cos(a) + r.x * Math.sin(a)) * dist, 0,
                player.pos.z + (f.z * Math.cos(a) + r.z * Math.sin(a)) * dist);
      e.heading = h + Math.PI + (facing || 0);
      e.fireT = 0.2 + i * 0.25;          // stagger so volleys overlap instead of firing in unison
      if (window.__materialise) window.__materialise(e);   // proxied ships have no mesh
    });
    if (window.__freezeProxies) window.__freezeProxies();
  };
`;

// Director-mode helpers for the game internals that bite during capture.
//
//  - Distant enemies are UNLOADED to point-cloud proxies with build===null. Moving such a
//    ship into frame gives you an invisible ship. loadShipModel() rebuilds the mesh.
//  - photoMode only hides #hud. The 3D red/cyan target triangles stay in the scene, and
//    updateFogOfWar() re-shows aircraft markers every frame, so they must be stubbed.
//  - #bannerCard is a CHILD of #hud, so photo mode kills it. Re-parenting it to <body>
//    lets us use the game's own briefing card as a title card — better than an overlay.
const DIRECTOR = `
  // Make a staged ship real: a proxied ship has no mesh at all.
  window.__materialise = (ship) => {
    if (!ship.build && typeof loadShipModel === 'function') loadShipModel(ship);
    if (ship.build) {
      ship.build.group.position.set(ship.pos.x, 0, ship.pos.z);
      ship.build.group.rotation.y = ship.heading;
    }
    ship.proxy = false;
  };
  window.__freezeProxies = () => {
    if (typeof updateShipModelProxies === 'function') window.updateShipModelProxies = () => {};
  };

  // Hide the 3D team markers (the floating triangles). Only needed for HUD-off shots —
  // in HUD-on gameplay shots they are part of what proves this is a real game.
  window.__hideMarkers = () => {
    window.updateFogOfWar = () => {};
    scene.traverse(o => {
      if (o.isSprite || (o.geometry && o.geometry.type === 'ConeGeometry')) {
        if (o.position.y > 8) o.visible = false;      // markers ride high above the hull
      }
    });
  };

  // The game's own briefing card, escaped from #hud so it survives photo mode.
  window.__titleCard = (title, sub) => {
    const bc = document.getElementById('bannerCard');
    if (!bc) return;
    document.body.appendChild(bc);
    bc.querySelector('.bc-title').textContent = title;
    bc.querySelector('.bc-sub').textContent = sub || '';
    const hint = bc.querySelector('.bc-hint'); if (hint) hint.textContent = '';
    bc.style.display = 'flex';
    bc.classList.add('show');
  };

  // The largest explosion in the game — the R-36M strategic warhead. Radius 900 with
  // strategicBlastFx: a 2.4s shockwave ring plus boom(pos, 30). The Atomic Strike
  // Drone's 250 is a fifth of this.
  // NOTE: blastAll(pos, 9999, 900, ...) also kills the PLAYER — radius 900 reaches them
  // from any filmable distance, the war ends mid-shot and the game cuts to the menu.
  // So: fire the visual, then sink the intended victims by hand.
  window.__strategicBlast = (pos, killRadius) => {
    while (fx.length) removeFxAt(0);          // fx has a budget; a full pool swallows the blast
    strategicBlastFx(pos, 900);               // the visual: 2.4s shockwave ring + boom(pos,30)
    if (killRadius) {
      for (const e of enemies) {
        if (e.sinkT === 0 && e.pos.distanceTo(pos) < killRadius) {
          e.hp = 0; e.sinkT = 0.01;           // starts the sinking animation
          if (e.crit) { e.crit.fire = 3; }    // and sets them ablaze on the way down
        }
      }
    }
  };

  // A 12-gun capital broadside: every mount on the hero ship firing on one frame.
  window.__armBroadside = () => {
    placed.forEach(p => { if (typeof destroyObject3D === 'function') destroyObject3D(p.group); });
    placed.length = 0;
    const n = Math.min(12, player.def.mounts || 8);
    const slots = Array.from({ length: n }, (_, i) => i);
    installStarterGuns(player.build, slots.map(() => WEAPONS.sixteen), slots);
  };
`;

// Install the fixed-step stepper. After this, the browser never renders on its own.
//
// Three things here are not obvious and all three were wrong in the first attempt:
//
//  1. updateAdaptiveQuality() must never run. It EMAs frame time and, when a frame
//     takes over 30ms for 4 seconds — guaranteed under software rendering — it calls
//     setGfxQuality(0), which DISABLES BLOOM, drops the pixel ratio, and flashes a
//     "Performance mode" toast on screen. The first attempt almost certainly filmed
//     the game in its ugliest mode. We never call it, and we pin quality high.
//  2. camera.fov is 72 by default. That is very wide, and it is why enemies at 175m
//     render as ~30px chips against the sky. A 38-45 degree lens is a one-line
//     cinematic upgrade — it compresses distance and makes ships read as massive.
//  3. togglePhotoMode() is the wrong way in: it flashes a prompt and hides the HUD on
//     a 1400ms setTimeout, which under a virtual clock may never fire, or fire in the
//     middle of a shot. Set photoMode directly instead.
const STEPPER = `
  window.requestAnimationFrame = () => 0;      // stop loop() rescheduling itself

  // Pin graphics at full quality and keep the adaptive downgrade from ever firing.
  if (typeof setGfxQuality === 'function') setGfxQuality(2);
  window.updateAdaptiveQuality = () => {};
  if (typeof renderer !== 'undefined' && renderer) renderer.setPixelRatio(1);

  window.__lens = (fov) => { camera.fov = fov; camera.updateProjectionMatrix(); };
  window.__lens(40);                           // default to a long lens; override per shot

  window.__step = (dt) => {
    t2 += dt;
    update(dt, t2);
    updateHUD();
    updateBanners(dt);
    if (typeof composer !== 'undefined' && composer && gfxQuality > 0) composer.render();
    else renderer.render(scene, camera);
  };

  // Camera control goes through photo mode — but set the flag directly, never via
  // togglePhotoMode(). hud:true is the DEFAULT for gameplay shots: the HUD is the
  // proof that this is a real game and not a glamour render.
  window.__cam = ({ pos, look, hud, fov }) => {
    photoMode = true;
    document.getElementById('hud').style.display = hud ? 'block' : 'none';
    if (fov) window.__lens(fov);
    photoPos.set(pos[0], pos[1], pos[2]);
    const dx = look[0] - pos[0], dy = look[1] - pos[1], dz = look[2] - pos[2];
    camYaw.v = Math.atan2(dx, dz);
    camPitch.v = Math.atan2(dy, Math.hypot(dx, dz));
  };

  // Camera positions are almost always easier to express relative to the player ship.
  window.__shipFrame = () => {
    const h = player.heading;
    return { p: [player.pos.x, 0, player.pos.z],
             fwd: [Math.sin(h), 0, Math.cos(h)],
             stbd: [Math.cos(h), 0, -Math.sin(h)] };
  };

  // Hide the chrome that is helpful in-game but reads as clutter on camera: the
  // ship's-AI advice bubble parks itself over the centre-left of frame, and the
  // onboarding hint bar sits across the middle.
  window.__hideChrome = () => {
    for (const id of ['claudeBubble', 'claudeMascot', 'tut', 'prompt', 'comms']) {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    }
  };

  // Nothing may cover the render. The #story lore modal is NOT dismissed by
  // skipBanner() or skipTutorial(), and showStory() is reused for theater briefings,
  // so it can reappear mid-shot. A capture can be 100% unique frames and still be
  // worthless because it filmed a modal — so assert visibility, not just uniqueness.
  window.__overlayClear = () => {
    const blockers = ['story', 'shop', 'harbor', 'build', 'settings', 'mpPanel', 'over'];
    const covering = blockers.filter(id => {
      const el = document.getElementById(id);
      if (!el) return false;
      const st = getComputedStyle(el);
      return st.display !== 'none' && st.visibility !== 'hidden' && Number(st.opacity) > 0.05;
    });
    return covering;
  };
`;

// Ease in and out of a move. Constant velocity is the visual signature of
// programmatic camera work and a large part of why the first attempt felt lifeless.
// Injected into every shot's scope so camera functions can use ease(t/duration).
const EASE = `
  window.ease = (x) => x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3) / 2;   // easeInOutCubic
  window.easeOut = (x) => 1 - Math.pow(1 - x, 3);                          // decelerate into rest
  window.easeIn = (x) => x * x * x;                                        // accelerate from rest
`;

// ---------------------------------------------------------------------------
//  SHOT LIST — see TRAILER-BRIEF.md for the editorial reasoning behind each.
// ---------------------------------------------------------------------------

const SHOTS = [
  {
    name: '01-broadside-push',
    seconds: 2.2,
    fps: 60,
    note: 'OPENING HOOK — this is the "oner": one unbroken take containing setup, conflict ' +
          'and payoff. Low and close alongside the hull, moving forward with the ship, ' +
          'enemies ALREADY firing in frame one, and one of them takes a visible hit before ' +
          'the cut. HUD stays ON. No fade in, no logo, no empty water.',
    async stage(page) {
      await boot(page, { ship: 'battleship' });
      await page.evaluate(ARM + PLACE_ENEMIES + STEPPER + EASE + LIGHT + DIRECTOR);
      await page.evaluate(() => {
        // Overlapping ranges, varied headings: reads as a battle line under way.
        window.__placeEnemies([
          { bearing: -14, dist: 95,  facing: 0.5 },   // near, crossing — partially occludes the rest
          { bearing: 4,   dist: 175, facing: -0.3 },
          { bearing: 19,  dist: 130, facing: 0.9 },
          { bearing: -31, dist: 260, facing: 0.2 },
          { bearing: 34,  dist: 310, facing: -0.6 },
        ]);
        weather.tod = 0.30;                       // mid-morning: readable, not flat
        if (window._MAP) window._MAP.tod = 0.30;
        player.throttle = 1;
      });
      // Let the fight actually start before the camera rolls, so frame one has tracers in it.
      await page.evaluate(() => { for (let i = 0; i < 240; i++) window.__step(1 / 60); });
    },
    // Eased dolly forward along the starboard side, tight to the hull. The 42mm-ish
    // lens compresses the enemy line so the ships read big instead of like chips.
    camera: `(t) => {
      const { p, fwd, stbd } = window.__shipFrame();
      const k = window.easeOut(Math.min(1, t / 2.2));
      const along = -26 + k * 44;
      const out = 19 - k * 3;                       // creeps in toward the hull as it travels
      return {
        pos: [p[0] + fwd[0]*along + stbd[0]*out, 6.2, p[2] + fwd[2]*along + stbd[2]*out],
        look: [p[0] + fwd[0]*(along + 46) + stbd[0]*2, 5.5, p[2] + fwd[2]*(along + 46) + stbd[2]*2],
        hud: true,
        fov: 42,
      };
    }`,
  },

  {
    name: '02-deck-mount',
    seconds: 1.6,
    fps: 60,
    note: 'THE VERB nobody expects: you bolt guns onto your own deck. Tight on the deck as ' +
          'a turret appears. Keep the HUD ON here — the prompt text explains the mechanic.',
    async stage(page) {
      await boot(page, { ship: 'battleship' });
      await page.evaluate(PLACE_ENEMIES + STEPPER + EASE + LIGHT + DIRECTOR);
      await page.evaluate(() => {
        money = 999999;
        window.__placeEnemies([{ bearing: 10, dist: 200 }]);
        window.__light('clear', 0.50);
      });
      await page.evaluate(() => { for (let i = 0; i < 60; i++) window.__step(1 / 60); });
      // Mount a gun mid-shot so the turret appears on camera rather than being there already.
      await page.evaluate(() => { selectedWeapon = 'sixteen'; });
    },
    camera: `(t) => {
      const { p, fwd, stbd } = window.__shipFrame();
      const swing = -8 + t * 10;
      return {
        pos: [p[0] + fwd[0]*(-6) + stbd[0]*swing, 9.5, p[2] + fwd[2]*(-6) + stbd[2]*swing],
        look: [p[0] + fwd[0]*14, 4.2, p[2] + fwd[2]*14],
        hud: true,
      };
    }`,
    // Fire the placement at a specific frame so the turret pops at a chosen beat.
    onFrame: `(i) => { if (i === 36) { try { tryPlace(); } catch (e) {} } }`,
  },

  {
    name: '03-takeoff',
    seconds: 2.2,
    fps: 60,
    note: 'ESCALATION 1 — you can leave the ship. Camera holds on the deck as the aircraft ' +
          'climbs away, so the ship stays in frame for continuity with shot 01.',
    async stage(page) {
      await boot(page, { ship: 'carrier' });
      await page.evaluate(ARM + PLACE_ENEMIES + STEPPER + EASE + LIGHT + DIRECTOR);
      await page.evaluate(() => {
        window.__placeEnemies([{ bearing: 0, dist: 260 }, { bearing: 22, dist: 300 }]);
        weather.tod = 0.22;                        // low sun rakes across the flight deck
        if (window._MAP) window._MAP.tod = 0.22;
        // TODO(executing agent): confirm the right call to launch a parked aircraft.
        // tryDispatchPlane() sends one up under AI control (bound to Y in-game);
        // bailoutOrBoard() (P) puts the player in one. Try both, film whichever
        // gives the better climb-away silhouette.
        if (typeof tryDispatchPlane === 'function') tryDispatchPlane();
      });
    },
    camera: `(t) => {
      const { p, fwd, stbd } = window.__shipFrame();
      return {
        pos: [p[0] + fwd[0]*(-34) + stbd[0]*18, 11 + t*2.5, p[2] + fwd[2]*(-34) + stbd[2]*18],
        look: [p[0] + fwd[0]*30, 8 + t*9, p[2] + fwd[2]*30],   // pans up to follow the climb
        hud: false,
      };
    }`,
  },

  {
    name: '04-tank-beach',
    seconds: 2.0,
    fps: 60,
    note: 'ESCALATION 2 — the war reaches land. An amphibious tank coming out of the water ' +
          'onto sand is the single most surprising image this game has.',
    async stage(page) {
      await boot(page, { ship: 'battleship', theater: 2 });
      await page.evaluate(STEPPER + EASE + LIGHT + DIRECTOR);
      await page.evaluate(() => {
        window.__light('clear', 0.50);
        // TODO(executing agent): stage the tank in shallow water heading up a beach.
        // Look at the tank boarding path (E / toggleFoot / drivingTank) and at
        // islands[] for a shoreline position. tankLandToggle() switches land/water mode.
        // This shot needs the most hand-tuning of the six; budget time for it.
      });
    },
    camera: `(t) => {
      const { p, fwd, stbd } = window.__shipFrame();
      return {
        pos: [p[0] + fwd[0]*40 + stbd[0]*(14 - t*4), 4.5, p[2] + fwd[2]*40 + stbd[2]*(14 - t*4)],
        look: [p[0] + fwd[0]*70, 2.5, p[2] + fwd[2]*70],
        hud: false,
      };
    }`,
  },

  {
    name: '05-leviathan',
    seconds: 2.4,
    fps: 60,
    note: 'THE THREAT. The Leviathan is 148m against your 82m battleship — frame it so the ' +
          'size difference is the whole point. Low angle, looking up along its hull.',
    async stage(page) {
      await boot(page, { ship: 'battleship' });
      await page.evaluate(ARM + PLACE_ENEMIES + STEPPER + EASE + LIGHT + DIRECTOR);
      await page.evaluate(() => {
        // TODO(executing agent): spawn the boss specifically. spawnEnemy() picks via
        // chooseNPCShipDef(); SHIPS.boss is the Leviathan (boss:true, len:148, mounts:16,
        // twelve guns pre-fitted by installBossStarterGuns). Find how a theater spawns it
        // and reuse that path, then place it ~150m off the bow.
        window.__light('overcast', 0.50);   // overcast + bright: the Leviathan needs to read clearly
      });
      await page.evaluate(() => { for (let i = 0; i < 180; i++) window.__step(1 / 60); });
    },
    camera: `(t) => {
      const { p, fwd, stbd } = window.__shipFrame();
      const in_ = 120 - t * 12;                    // slow push in, holds the scale read
      return {
        pos: [p[0] + fwd[0]*in_ + stbd[0]*30, 3.2, p[2] + fwd[2]*in_ + stbd[2]*30],
        look: [p[0] + fwd[0]*(in_ + 60), 14, p[2] + fwd[2]*(in_ + 60)],
        hud: false,
      };
    }`,
  },

  {
    name: '06-nuke',
    seconds: 2.6,
    fps: 60,
    note: 'PAYOFF / LAST SHOT. blastAll(pos, 9999, 250, true, true) with the flash and ' +
          'shockwave ring. Cut to the title card while the fireball is still rising.',
    async stage(page) {
      await boot(page, { ship: 'battleship' });
      await page.evaluate(ARM + PLACE_ENEMIES + STEPPER + EASE + LIGHT + DIRECTOR);
      await page.evaluate(() => {
        window.__placeEnemies([
          { bearing: -12, dist: 200 }, { bearing: 4, dist: 215 },
          { bearing: 18, dist: 195 }, { bearing: 30, dist: 230 },
        ]);
        weather.tod = 0.86;                        // night: the flash has something to bloom against
        if (window._MAP) window._MAP.tod = 0.86;
      });
      await page.evaluate(() => { for (let i = 0; i < 120; i++) window.__step(1 / 60); });
    },
    camera: `(t) => {
      const { p, fwd, stbd } = window.__shipFrame();
      return {
        pos: [p[0] + fwd[0]*(-140) + stbd[0]*150, 95, p[2] + fwd[2]*(-140) + stbd[2]*150],
        look: [p[0] + fwd[0]*380, 30, p[2] + fwd[2]*380],
        hud: false,
        fov: 55,        // wider here: the shockwave ring and the column both have to fit
      };
    }`,
    // Detonate on a beat, not at t=0 — the eye needs a moment to read the scene first.
    onFrame: `(i) => {
      if (i === 42) {
        const h = player.heading;
        const bp = new THREE.Vector3(
          player.pos.x + Math.sin(h) * 420, 2, player.pos.z + Math.cos(h) * 420);
        window.__strategicBlast(bp, 320);   // visual radius 900; sinks enemies within 320m
      }
    }`,
  },
];

// ---------------------------------------------------------------------------
//  Runner
// ---------------------------------------------------------------------------

async function captureShot(shot) {
  const dir = path.join(FRAMES, shot.name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  // channel:'chromium' is load-bearing, not cosmetic. Plain headless:true launches
  // chromium_headless_shell, which has NO GPU and falls back to SwiftShader software
  // rasterisation. Measured on this machine: 18fps software vs 68fps with the real
  // Apple M4 Metal renderer. Never drop this option.
  const browser = await chromium.launch({ headless: true, channel: 'chromium' });
  const page = await browser.newPage({
    viewport: { width: W, height: H },
    deviceScaleFactor: Number(process.env.SS || 1),   // SS=2 supersamples; downscale in ffmpeg
  });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 200)));

  // GPU gate. If this says SwiftShader, the capture will be slow AND the game's
  // adaptive-quality governor will fight back — abort rather than waste 15 minutes.
  const gpu = await page.evaluate(() => {
    const c = document.createElement('canvas');
    const g = c.getContext('webgl2') || c.getContext('webgl');
    const d = g && g.getExtension('WEBGL_debug_renderer_info');
    return d ? String(g.getParameter(d.UNMASKED_RENDERER_WEBGL)) : 'unknown';
  });
  if (/SwiftShader/i.test(gpu)) {
    console.error(`${shot.name}: ABORT — software rendering (${gpu}).`);
    console.error(`  chromium.launch() must pass channel:'chromium'. Plain headless:true`);
    console.error(`  runs chromium_headless_shell, which has no GPU.`);
    await browser.close();
    process.exit(1);
  }

  await shot.stage(page);

  // Fail loudly rather than filming a modal: a capture can be 100% unique frames and
  // still be worthless because every frame was a lore popup over the game.
  const covering = await page.evaluate(() => { window.__hideChrome(); return window.__overlayClear(); });
  if (covering.length) {
    console.error(`${shot.name}: ABORT — these overlays are covering the frame: ${covering.join(', ')}`);
    console.error(`  Dismiss them in stage() before capturing. #story is not closed by skipBanner/skipTutorial.`);
    await browser.close();
    process.exit(1);
  }

  const fps = shot.fps || 60;
  const total = Math.round(shot.seconds * fps);
  const t0 = Date.now();

  for (let i = 0; i < total; i++) {
    await page.evaluate(({ i, fps, camSrc, onFrameSrc }) => {
      if (onFrameSrc) (eval(onFrameSrc))(i);
      const cam = (eval(camSrc))(i / fps, i);
      window.__cam(cam);
      window.__step(1 / fps);
    }, { i, fps, camSrc: shot.camera, onFrameSrc: shot.onFrame || null });
    await page.screenshot({ path: path.join(dir, `f${String(i).padStart(5, '0')}.png`) });
  }

  const endPhase = await page.evaluate(() => ({
    phase: typeof phase !== 'undefined' ? phase : '?',
    covering: window.__overlayClear ? window.__overlayClear() : [],
  }));
  const wall = ((Date.now() - t0) / 1000).toFixed(0);
  await browser.close();

  // A shot that ended on the menu (player sank, war lost) is worthless — and no
  // frame-uniqueness check would catch it, because the menu animates.
  if (endPhase.phase !== 'play' || endPhase.covering.length) {
    console.error(`${shot.name}: FAILED — ended in phase '${endPhase.phase}'` +
      (endPhase.covering.length ? `, overlays: ${endPhase.covering.join(', ')}` : '') +
      `\n  The war ended or a panel opened during the shot. Common cause: an explosion` +
      `\n  radius that reaches the player. Stage the blast further out or use a smaller one.`);
    process.exit(1);
  }
  console.log(`${shot.name}: ${total} frames @${fps}fps (${shot.seconds}s) in ${wall}s wall  ` +
              `[${gpu.replace(/^ANGLE \(|\)$/g, '').slice(0, 34)}]` +
              (errors.length ? `  ⚠ ${errors.length} page errors: ${errors[0]}` : ''));
  return { shot: shot.name, frames: total, fps, errors };
}

(async () => {
  const arg = process.argv[2];
  if (!arg || arg === '--list') {
    console.log('\nSHOTS\n');
    let total = 0;
    for (const s of SHOTS) {
      total += s.seconds;
      console.log(`  ${s.name.padEnd(20)} ${String(s.seconds).padStart(4)}s  ${s.note.split('.')[0]}`);
    }
    console.log(`\n  total ${total.toFixed(1)}s of trailer, ~${Math.round(total * 12 / 60)} min to render\n`);
    console.log('  node capture-shot.js <name> | --all\n');
    return;
  }
  const todo = arg === '--all' ? SHOTS : SHOTS.filter(s => s.name === arg || s.name.startsWith(arg));
  if (!todo.length) { console.error(`no shot matching "${arg}" — try --list`); process.exit(1); }
  for (const s of todo) await captureShot(s);
  console.log(`\nframes in ${FRAMES}/ — assemble with: bash build-trailer.sh\n`);
})();
