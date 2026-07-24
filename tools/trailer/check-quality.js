// ============================================================================
//  Automated quality gate for the trailer
// ============================================================================
//
//  Run this on every cut before showing it to anyone. It catches the failure
//  modes that killed the first attempt, plus the ones a trailer usually dies of.
//  Exits non-zero with the specific problem named, so an executing agent can
//  iterate without needing a human to say "it looks bad".
//
//    node check-quality.js <video.mp4>
//
//  WHAT IT CANNOT CHECK: whether the trailer is actually exciting. That needs
//  eyes. It can only prove the output is technically sound and structurally
//  within the rules the brief sets out.
// ============================================================================

const { execSync } = require('child_process');
const fs = require('fs');

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.error('usage: node check-quality.js <video.mp4>');
  process.exit(2);
}

const sh = cmd => execSync(cmd, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();
const probe = fields =>
  sh(`ffprobe -v error -select_streams v:0 -show_entries ${fields} -of default=nw=1 "${file}"`);

// --- basics
const meta = {};
for (const line of probe('stream=width,height,avg_frame_rate,nb_frames,duration,pix_fmt').split('\n')) {
  const [k, v] = line.split('=');
  meta[k] = v;
}
const fps = eval(meta.avg_frame_rate);
const duration = Number(meta.duration);
const frames = Number(sh(
  `ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "${file}"`));

// --- duplicate/stalled frames: the exact defect in the first attempt
// mpdecimate drops frames that are near-identical to their predecessor. If the
// survivor count is well below the total, the source was rendering slower than it
// was captured and the viewer sees stutter.
const decimated = Number(
  sh(`ffmpeg -i "${file}" -vf mpdecimate -f null - 2>&1 | grep -oE 'frame=\\s*[0-9]+' | tail -1`)
    .replace(/[^0-9]/g, ''));
const distinctRatio = decimated / frames;

// --- shot changes: a trailer with no cuts reads as a screensaver
// scdet flags scene changes; each logged line is roughly one cut.
let cuts = 0;
try {
  cuts = sh(`ffmpeg -i "${file}" -vf "scdet=threshold=8" -f null - 2>&1 | grep -c 'lavfi.scd.score'`)
    .replace(/[^0-9]/g, '') | 0;
} catch (e) { cuts = 0; }
const avgShot = cuts > 0 ? duration / (cuts + 1) : duration;

// --- brightness/contrast: catches shots that came out near-black or washed out,
// and a first frame that is a solid colour (nothing to hook the eye).
// signalstats prints "lavfi.signalstats.YAVG=107.816" — note the '=', not ':'.
const lumaOf = f => sh(
  `ffmpeg -v error -i "${f}" -vf "signalstats,metadata=print:file=-" -f null - 2>&1 ` +
  `| grep -oE 'signalstats.(YAVG|YMIN|YMAX)=[0-9.]+' || true`);

const perFrame = [];
{
  let cur = {};
  for (const line of lumaOf(file).split('\n').filter(Boolean)) {
    const [k, v] = line.split('=');
    const key = k.split('.').pop();
    if (key === 'YMIN' && Object.keys(cur).length) { perFrame.push(cur); cur = {}; }
    cur[key] = Number(v);
  }
  if (Object.keys(cur).length) perFrame.push(cur);
}
const yAvg = perFrame.length ? perFrame.reduce((a, f) => a + (f.YAVG || 0), 0) / perFrame.length : -1;
const darkPct = perFrame.length ? perFrame.filter(f => (f.YAVG || 0) < 24).length / perFrame.length : 0;

// First-frame contrast: a solid-colour or faded-in opening frame has almost no
// luma spread. Real gameplay spans a wide range (sky, hull, water, tracers).
sh(`ffmpeg -y -v error -i "${file}" -vf "select=eq(n\\,0)" -vframes 1 /tmp/_qc_first.png`);
const ff = lumaOf('/tmp/_qc_first.png').split('\n').filter(Boolean)
  .reduce((o, l) => { const [k, v] = l.split('='); o[k.split('.').pop()] = Number(v); return o; }, {});
const firstSpread = (ff.YMAX || 0) - (ff.YMIN || 0);

// --- audio: portal preview videos must be silent; YouTube cuts should not be.
const hasAudio = sh(`ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "${file}" || true`)
  .length > 0;

const checks = [
  ['container fps is 60',
    Math.abs(fps - 60) < 0.5,
    `${fps}fps — capture at 60 and assemble with -framerate 60`],

  ['≥95% of frames are distinct (no stutter)',
    distinctRatio >= 0.95,
    `only ${(distinctRatio * 100).toFixed(0)}% distinct (${decimated}/${frames}). This is the ` +
    `first-attempt defect: the page rendered slower than it was captured. Use the fixed-step ` +
    `rig in capture-shot.js, do not use Playwright recordVideo.`],

  ['duration between 15s and 30s',
    duration >= 15 && duration <= 30,
    `${duration.toFixed(1)}s — portals want ~15-20s, YouTube ~25-30s`],

  ['at least 6 cuts',
    cuts >= 6,
    `${cuts} detected. A single long shot reads as a screensaver, not a trailer.`],

  ['average shot under 3s',
    avgShot < 3.0,
    `${avgShot.toFixed(1)}s average. Cut faster — 1.5-2.5s per shot.`],

  ['first frame has visual content (not a solid colour or fade-in)',
    firstSpread > 60,
    `luma spread only ${firstSpread} (YMIN ${ff.YMIN} → YMAX ${ff.YMAX}). Frame one must ` +
    `already show the game. No fade from black, no logo card, no empty ocean.`],

  ['not predominantly dark',
    darkPct < 0.35,
    `${(darkPct * 100).toFixed(0)}% of frames below luma 24. Night shots read as mud in an ` +
    `autoplaying thumbnail — keep them to one or two beats.`],

  ['mean luma in a usable range',
    yAvg > 40 && yAvg < 210,
    `mean luma ${yAvg.toFixed(0)}`],

  ['1920x1080 or 1280x720 (landscape master)',
    (meta.width === '1920' && meta.height === '1080') || (meta.width === '1280' && meta.height === '720'),
    `${meta.width}x${meta.height}`],

  ['yuv420p (universally playable)',
    meta.pix_fmt === 'yuv420p',
    meta.pix_fmt],
];

console.log(`\nQC — ${file}`);
console.log(`  ${meta.width}x${meta.height}  ${fps}fps  ${duration.toFixed(1)}s  ${frames} frames  ` +
            `${cuts} cuts  ${hasAudio ? 'has audio' : 'silent'}\n`);

let failed = 0;
for (const [name, ok, detail] of checks) {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) { console.log(`        ${detail}`); failed++; }
}

console.log(`\n  NOTE: portal preview videos (CrazyGames) must be SILENT — this file ${hasAudio ? 'HAS audio, strip it with -an' : 'is correctly silent'}.`);
console.log(failed
  ? `\n${failed} check(s) failed.\n`
  : `\nAll technical checks passed. Now watch it — QC cannot tell you if it is exciting.\n`);
process.exit(failed ? 1 : 0);
