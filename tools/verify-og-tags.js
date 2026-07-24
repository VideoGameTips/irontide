// Verifies the OG/meta tags parse the way a link-preview crawler reads them,
// and that the game still boots with the new <head>.
const { chromium } = require('@playwright/test');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = require('path').join(__dirname, '..');
const MIME = { '.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg' };
const server = http.createServer((req, res) => {
  let f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, b) => {
    if (e) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    res.end(b);
  });
});
(async () => {
  await new Promise(r => server.listen(4601, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://localhost:4601/', { waitUntil: 'load' });
  await page.waitForFunction(() => typeof startGame === 'function' && typeof SHIPS === 'object');
  const meta = await page.evaluate(() => {
    const g = s => { const el = document.querySelector(s); return el && el.content; };
    return {
      description: g('meta[name="description"]'),
      ogTitle: g('meta[property="og:title"]'),
      ogDesc: g('meta[property="og:description"]'),
      ogImage: g('meta[property="og:image"]'),
      ogUrl: g('meta[property="og:url"]'),
      ogW: g('meta[property="og:image:width"]'),
      ogH: g('meta[property="og:image:height"]'),
      twCard: g('meta[name="twitter:card"]'),
      twImage: g('meta[name="twitter:image"]'),
      title: document.title,
      boots: typeof startGame === 'function',
      theaters: CAMPAIGN.length,
    };
  });
  // The crawler fetches og:image from its absolute URL — make sure the file exists locally under that path.
  const imgPath = path.join(ROOT, new URL(meta.ogImage).pathname.replace('/irontide/', ''));
  const imgOk = fs.existsSync(imgPath);
  const checks = [
    ['meta description present', !!meta.description && meta.description.length > 80],
    ['og:title', meta.ogTitle === 'Iron Tide — Battleship Command'],
    ['og:description', !!meta.ogDesc && meta.ogDesc.length > 80],
    ['og:image absolute https URL', /^https:\/\/game\.boobank\.com\/irontide\/og-cover\.jpg$/.test(meta.ogImage)],
    ['og:image file exists in repo', imgOk],
    ['og:image dimensions declared', meta.ogW === '1200' && meta.ogH === '675'],
    ['og:url canonical', meta.ogUrl === 'https://game.boobank.com/irontide/'],
    ['twitter:card = summary_large_image', meta.twCard === 'summary_large_image'],
    ['twitter:image matches og:image', meta.twImage === meta.ogImage],
    ['game still boots', meta.boots && meta.theaters === 31],
    ['no console errors', errors.length === 0],
  ];
  let bad = 0;
  for (const [n, ok] of checks) { console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${n}`); if (!ok) bad++; }
  if (errors.length) console.log('  errors:', errors.slice(0, 3));
  await browser.close(); server.close();
  console.log(bad ? `\n${bad} FAILED` : '\nOG TAGS OK');
  process.exit(bad ? 1 : 0);
})();
