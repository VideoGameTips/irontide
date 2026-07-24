// Renders title-card covers in headless Chrome (ffmpeg here has no drawtext,
// and the browser gives us the game's own typography anyway).
const { chromium } = require('@playwright/test');
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const A = require('path').join(__dirname, '..', 'promo', 'assets', 'final');
const b64 = f => 'data:image/png;base64,' + fs.readFileSync(path.join(A, f)).toString('base64');

const card = (bg, w, h, titleSize, tagSize, badgeSize, tagline, showTag, showBadge = true) => `
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${w}px;height:${h}px;overflow:hidden;font-family:'Futura','Avenir Next',system-ui,sans-serif}
  .wrap{position:relative;width:${w}px;height:${h}px}
  .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .scrim{position:absolute;inset:0;
    background:linear-gradient(180deg,rgba(6,12,20,.72) 0%,rgba(6,12,20,.18) 42%,rgba(6,12,20,.30) 72%,rgba(6,12,20,.80) 100%)}
  .stack{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
    justify-content:center;text-align:center;padding:0 6%}
  h1{font-size:${titleSize}px;letter-spacing:${titleSize * 0.17}px;color:#e8f1fb;font-weight:500;
    text-shadow:0 0 ${titleSize * 0.6}px rgba(120,180,240,.55),0 3px 12px rgba(0,0,0,.9);
    margin-left:${titleSize * 0.17}px}
  .rule{width:${titleSize * 2.6}px;height:1px;margin:${titleSize * 0.30}px 0;
    background:linear-gradient(90deg,transparent,rgba(159,198,232,.85),transparent)}
  p{font-size:${tagSize}px;color:#c3d2e2;letter-spacing:.4px;line-height:1.45;
    text-shadow:0 2px 8px rgba(0,0,0,.95);max-width:88%}
  .badge{position:absolute;bottom:${h * 0.075}px;left:50%;transform:translateX(-50%);
    font-size:${badgeSize}px;letter-spacing:${badgeSize * 0.28}px;color:#ffd060;font-weight:600;
    text-shadow:0 2px 8px rgba(0,0,0,.95);white-space:nowrap}
</style>
<div class="wrap">
  <img class="bg" src="${bg}">
  <div class="scrim"></div>
  <div class="stack">
    <h1>IRON TIDE</h1>
    <div class="rule"></div>
    ${showTag ? `<p>${tagline}</p>` : ''}
  </div>
  ${showBadge ? '<div class="badge">FREE IN YOUR BROWSER</div>' : ''}
</div>`;

(async () => {
  const browser = await chromium.launch();
  const jobs = [
    { out: 'cover-itch-titled-630x500.png', src: '03-broadside.png', w: 630, h: 500, t: 46, g: 15, b: 11,
      tag: 'Command a battleship — then fly the planes,<br>drive the tanks, and storm the beach yourself.', showTag: true },
    { out: 'cover-social-1280x720.png', src: '03-broadside.png', w: 1280, h: 720, t: 88, g: 27, b: 18,
      tag: 'Command a battleship — then fly the planes, drive the tanks,<br>and storm the beach yourself.', showTag: true },
    { out: 'cover-square-800x800.png', src: '05-night.png', w: 800, h: 800, t: 62, g: 20, b: 14,
      tag: 'A 31-theater naval campaign<br>that runs in your browser.', showTag: true },
    { out: 'thumb-titled-240x240.png', src: '02-combat-hud.png', w: 240, h: 240, t: 25, g: 10, b: 7,
      tag: '', showTag: false },
    // CrazyGames requires all three aspect ratios, and its cover rules allow the game
    // name only — no tagline, no "Play now" badge, no logos. Hence showTag/showBadge off.
    { out: 'cover-cg-landscape-1920x1080.png', src: '03-broadside.png', w: 1920, h: 1080, t: 130, g: 40, b: 26,
      tag: '', showTag: false, showBadge: false },
    { out: 'cover-cg-portrait-800x1200.png', src: '05-night.png', w: 800, h: 1200, t: 66, g: 22, b: 15,
      tag: '', showTag: false, showBadge: false },
    { out: 'cover-cg-square-800x800.png', src: '02-combat-hud.png', w: 800, h: 800, t: 62, g: 20, b: 14,
      tag: '', showTag: false, showBadge: false },
  ];
  for (const j of jobs) {
    const page = await browser.newPage({ viewport: { width: j.w, height: j.h }, deviceScaleFactor: 2 });
    await page.setContent(card(b64(j.src), j.w, j.h, j.t, j.g, j.b, j.tag, j.showTag, j.showBadge !== false));
    await page.waitForTimeout(350);
    const tmp = path.join(A, '.raw-' + j.out);
    await page.screenshot({ path: tmp });
    // rendered at DPR 2 for crisp text; downsample to the exact spec itch.io enforces
    execSync(`ffmpeg -y -loglevel error -i "${tmp}" -vf "scale=${j.w}:${j.h}:flags=lanczos" "${path.join(A, j.out)}"`);
    fs.unlinkSync(tmp);
    console.log(`${j.out}  ${j.w}x${j.h}`);
    await page.close();
  }
  await browser.close();
})();
