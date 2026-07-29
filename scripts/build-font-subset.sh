#!/usr/bin/env bash
# Rebuilds src/fonts/PretendardVariable.subset.woff2.
#
# Run this after adding UI text with characters outside KS X 1001 (rare, but
# e.g. new emoji or hanja would need it). Requires Python with fonttools+brotli.
#
#   pip install fonttools brotli
#   ./scripts/build-font-subset.sh
set -euo pipefail
cd "$(dirname "$0")/.."

npm i --no-save pretendard@1.3.9

python3 - <<'PY'
import os, re

# Every character the app itself can render.
chars = set()
for root, _, files in os.walk('src'):
    for f in files:
        if re.search(r'\.(tsx?|css)$', f):
            chars.update(open(os.path.join(root, f), encoding='utf-8').read())
chars.update(open('index.html', encoding='utf-8').read())
app = {ord(c) for c in chars}

# KS X 1001's 2350 syllables, so Korean a student types into the notes field
# renders in Pretendard too rather than dropping to a fallback mid-word.
def ks_x_1001(cp):
    try:
        chr(cp).encode('iso2022_kr'); return True
    except Exception:
        return False
ks = {cp for cp in range(0xAC00, 0xD7A4) if ks_x_1001(cp)}

basic = set()
for lo, hi in [(0x20,0x7E),(0x2000,0x206F),(0x3000,0x303F),(0x3130,0x318F),
               (0x2190,0x2199),(0x25A0,0x25FF),(0x2460,0x246F),(0x00B0,0x00B7)]:
    basic.update(range(lo, hi + 1))

out = app | ks | basic
print(f'app {len(app)} + KS X 1001 {len(ks)} + basic {len(basic)} = {len(out)} codepoints')
open('/tmp/pretendard-unicodes.txt', 'w').write(','.join(f'U+{c:04X}' for c in sorted(out)))
PY

mkdir -p src/fonts
python3 -m fontTools.subset \
  node_modules/pretendard/dist/public/variable/PretendardVariable.ttf \
  --unicodes-file=/tmp/pretendard-unicodes.txt \
  --output-file=src/fonts/PretendardVariable.subset.woff2 \
  --flavor=woff2 --layout-features='*' --drop-tables+=DSIG

ls -la src/fonts/PretendardVariable.subset.woff2
