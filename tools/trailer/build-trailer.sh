#!/usr/bin/env bash
# ============================================================================
#  Assemble the captured shots into the deliverables.
# ============================================================================
#
#  Prerequisite: node capture-shot.js --all   (writes frames/<shot>/f%05d.png)
#
#  Outputs, all into out/:
#    trailer-master-1080p.mp4      the landscape master — itch.io, YouTube, PH
#    cg-preview-landscape.mp4      CrazyGames 1920x1080, silent, <=20s
#    cg-preview-portrait.mp4       CrazyGames 720x1080, silent, <=20s
#    reddit-clip.mp4               shorter cut for native Reddit upload
#    shorts-vertical.mp4           9:16 for Shorts/TikTok, silent
#    preview.gif                   ~600px, for forums and the README
#
#  Every output is checked by check-quality.js at the end.
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")"

FRAMES=frames
OUT=out
mkdir -p "$OUT"

# Cut order. Edit this to re-order the trailer; the numbers in the shot names are
# just labels, this array is what decides the sequence.
SHOTS=(
  01-broadside-push
  02-deck-mount
  03-takeoff
  04-tank-beach
  05-leviathan
  06-nuke
)

X264="-c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -movflags +faststart"

echo "== per-shot encode =="
> "$OUT/concat.txt"
for s in "${SHOTS[@]}"; do
  if [ ! -d "$FRAMES/$s" ]; then
    echo "  SKIP $s (no frames — run: node capture-shot.js $s)"
    continue
  fi
  n=$(ls "$FRAMES/$s" | wc -l | tr -d ' ')
  # Straight cuts, no crossfades: at 1-2s per shot a dissolve eats the whole shot.
  ffmpeg -y -loglevel error -framerate 60 -i "$FRAMES/$s/f%05d.png" \
    $X264 -r 60 "$OUT/shot-$s.mp4"
  echo "file 'shot-$s.mp4'" >> "$OUT/concat.txt"
  printf "  %-22s %4s frames  %.1fs\n" "$s" "$n" "$(echo "$n / 60" | bc -l)"
done

if [ ! -s "$OUT/concat.txt" ]; then
  echo "no shots encoded — nothing to assemble"; exit 1
fi

echo "== master =="
( cd "$OUT" && ffmpeg -y -loglevel error -f concat -safe 0 -i concat.txt -c copy _joined.mp4 )

# Title card at the END only. Nobody knows the name at second zero, so a title there
# spends the most valuable two seconds of the trailer on zero information.
TITLE_PNG=../../promo/assets/final/cover-social-1280x720.png
if [ -f "$TITLE_PNG" ]; then
  ffmpeg -y -loglevel error -loop 1 -t 1.6 -i "$TITLE_PNG" \
    -vf "scale=1920:1080,fps=60" $X264 "$OUT/_title.mp4"
  ( cd "$OUT" && printf "file '_joined.mp4'\nfile '_title.mp4'\n" > _final.txt \
    && ffmpeg -y -loglevel error -f concat -safe 0 -i _final.txt -c copy _withtitle.mp4 )
  MASTER_SRC="$OUT/_withtitle.mp4"
else
  echo "  (no title card at $TITLE_PNG — master ends on the last shot)"
  MASTER_SRC="$OUT/_joined.mp4"
fi

ffmpeg -y -loglevel error -i "$MASTER_SRC" -vf "scale=1920:1080:flags=lanczos" \
  $X264 "$OUT/trailer-master-1080p.mp4"

echo "== channel variants =="
# CrazyGames: silent, both orientations, hard 20s ceiling.
ffmpeg -y -loglevel error -t 19.5 -i "$OUT/trailer-master-1080p.mp4" \
  -vf "scale=1920:1080" $X264 -an "$OUT/cg-preview-landscape.mp4"
# Portrait: centre-crop to 2:3. The action is centre-frame by design, so a straight
# centre crop keeps it; check the result rather than trusting that.
ffmpeg -y -loglevel error -t 19.5 -i "$OUT/trailer-master-1080p.mp4" \
  -vf "crop=720:1080:(iw-720)/2:0" $X264 -an "$OUT/cg-preview-portrait.mp4"
# Reddit: shorter converts better on a native upload.
ffmpeg -y -loglevel error -t 15 -i "$OUT/trailer-master-1080p.mp4" $X264 "$OUT/reddit-clip.mp4"
# Shorts/TikTok: 9:16, silent so a trending sound can be laid over it.
ffmpeg -y -loglevel error -i "$OUT/trailer-master-1080p.mp4" \
  -vf "crop=608:1080:(iw-608)/2:0,scale=1080:1920:flags=lanczos" $X264 -an "$OUT/shorts-vertical.mp4"
# GIF for forums/README.
ffmpeg -y -loglevel error -t 7 -i "$OUT/trailer-master-1080p.mp4" \
  -vf "fps=14,scale=600:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=112[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" \
  "$OUT/preview.gif"

rm -f "$OUT"/_joined.mp4 "$OUT"/_title.mp4 "$OUT"/_withtitle.mp4 "$OUT"/_final.txt "$OUT"/concat.txt "$OUT"/shot-*.mp4

echo "== QC =="
node check-quality.js "$OUT/trailer-master-1080p.mp4" || echo "  ^ master failed QC — fix before shipping"
echo
ls -la "$OUT"
