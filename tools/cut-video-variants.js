// Cuts the channel-specific variants from the hero clip recorded by
// capture-hero-video.js, so every channel pulls from one recording.
//
//   iron-tide-hero-45s.mp4        full clip, 1600x900 — itch.io / PH / YouTube
//   iron-tide-clip-20s.mp4        20s combat cut     — Reddit / Discord native upload
//   iron-tide-short-vertical.mp4  9:16, no audio     — YouTube Shorts / TikTok
//   preview.gif                   7s, 600px          — README / forum posts
const { execSync } = require('child_process');
const fs = require('fs'), path = require('path');

const A = path.join(__dirname, '..', 'promo', 'assets');
const OUT = path.join(A, 'final');
const RAW = path.join(A, 'hero-video');

const webm = fs.existsSync(RAW) && fs.readdirSync(RAW).filter(f => f.endsWith('.webm')).sort().pop();
if (!webm) {
  console.error(`No recording in ${RAW} — run: node tools/capture-hero-video.js`);
  process.exit(1);
}
const src = path.join(RAW, webm);
fs.mkdirSync(OUT, { recursive: true });

const dur = Number(execSync(
  `ffprobe -v error -show_entries format=duration -of csv=p=0 "${src}"`).toString().trim());
console.log(`source ${webm}  ${dur.toFixed(1)}s`);

// Timings track the scripted camera in capture-hero-video.js: helm POV 2.5-9.5s,
// chase exchange 9.5-18.5s, orbit 18.5-32.5s, dawn 32.5-40.5s, armory 40.5-44.5s.
const H264 = '-c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -movflags +faststart';
const jobs = [
  { out: 'iron-tide-hero-45s.mp4',
    cmd: `-i "${src}" ${H264} -r 30` },
  { out: 'iron-tide-clip-20s.mp4',                       // the exchange, straight in
    cmd: `-ss 9 -t 20 -i "${src}" ${H264}` },
  { out: 'iron-tide-short-vertical.mp4',                 // orbit segment, centre-cropped 9:16
    cmd: `-ss 18.5 -t 22 -i "${src}" -vf "crop=506:900:547:0,scale=608:1080" ${H264} -an` },
];
for (const j of jobs) {
  execSync(`ffmpeg -y -loglevel error ${j.cmd} "${path.join(OUT, j.out)}"`);
  const mb = (fs.statSync(path.join(OUT, j.out)).size / 1048576).toFixed(1);
  const dim = execSync(`ffprobe -v error -show_entries stream=width,height -of csv=p=0:s=x "${path.join(OUT, j.out)}"`).toString().trim();
  console.log(`${j.out}  ${dim}  ${mb} MB`);
}

execSync(`ffmpeg -y -loglevel error -ss 19 -t 7 -i "${src}" ` +
  `-vf "fps=12,scale=600:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=112[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" ` +
  `"${path.join(OUT, 'preview.gif')}"`);
console.log(`preview.gif  ${(fs.statSync(path.join(OUT, 'preview.gif')).size / 1048576).toFixed(1)} MB`);
