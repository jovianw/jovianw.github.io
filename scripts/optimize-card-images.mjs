// Re-encodes every card image referenced by src/assets/content.json to WebP,
// using Chromium's encoder so the repo needs no image-processing dependency.
//
//   node scripts/optimize-card-images.mjs [--apply]
//
// Without --apply it only reports what it would do. With --apply it writes the
// .webp files into public/card_images/, moves the originals to
// src/assets/source-images/card_images/ (outside public/, so they are not
// copied into the build), and rewrites the `image` fields in content.json.
//
// Cards render at most ~340px wide on a 4-column desktop grid and full-bleed on
// a phone, so 900px covers 2x on every layout.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, statSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const APPLY = process.argv.includes('--apply');
const MAX_WIDTH = 900;
const QUALITY = 0.85;

const PUBLIC_DIR = 'public/card_images';
const SOURCE_DIR = 'src/assets/source-images/card_images';
const CONTENT = 'src/assets/content.json';

const content = JSON.parse(readFileSync(CONTENT, 'utf8'));
const referenced = [...new Set(content.cards.map((c) => c.image))];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const encode = async (bytes, mime) =>
    page.evaluate(
        async ({ b64, mime, maxWidth, quality }) => {
            const img = new Image();
            img.src = `data:${mime};base64,${b64}`;
            await img.decode();
            const scale = Math.min(1, maxWidth / img.naturalWidth);
            const w = Math.round(img.naturalWidth * scale);
            const h = Math.round(img.naturalHeight * scale);
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, w, h);
            return { w, h, dataUrl: canvas.toDataURL('image/webp', quality) };
        },
        { b64: bytes.toString('base64'), mime, maxWidth: MAX_WIDTH, quality: QUALITY }
    );

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.jfif': 'image/jpeg', '.webp': 'image/webp' };

if (APPLY) mkdirSync(SOURCE_DIR, { recursive: true });

let before = 0;
let after = 0;
const renames = new Map();

for (const name of referenced) {
    const src = join(PUBLIC_DIR, name);
    if (!existsSync(src)) {
        console.log(`SKIP  ${name} — not found`);
        continue;
    }
    const ext = extname(name).toLowerCase();
    const outName = `${basename(name, extname(name))}.webp`;
    const out = join(PUBLIC_DIR, outName);

    const bytes = readFileSync(src);
    const result = await encode(bytes, MIME[ext] || 'image/png');
    const encoded = Buffer.from(result.dataUrl.split(',')[1], 'base64');

    before += bytes.length;

    // Keep whichever is smaller — several sources are already well-compressed.
    if (encoded.length >= bytes.length) {
        after += bytes.length;
        console.log(`KEEP  ${name.padEnd(28)} ${(bytes.length / 1024).toFixed(0).padStart(5)} kB  (re-encode was larger)`);
        continue;
    }

    after += encoded.length;
    console.log(
        `WEBP  ${name.padEnd(28)} ${(bytes.length / 1024).toFixed(0).padStart(5)} kB -> ` +
        `${(encoded.length / 1024).toFixed(0).padStart(5)} kB  ${result.w}x${result.h}`
    );

    if (APPLY) {
        writeFileSync(out, encoded);
        if (src !== out) {
            renameSync(src, join(SOURCE_DIR, name));
            renames.set(name, outName);
        }
    }
}

await browser.close();

console.log(`\ntotal ${(before / 1e6).toFixed(2)} MB -> ${(after / 1e6).toFixed(2)} MB  (${(100 - (after / before) * 100).toFixed(1)}% smaller)`);

if (APPLY) {
    for (const card of content.cards) {
        if (renames.has(card.image)) card.image = renames.get(card.image);
    }
    // Preserve the file's existing line endings so the diff stays confined to
    // the image fields instead of rewriting all 457 lines.
    const wasCrlf = readFileSync(CONTENT).includes(Buffer.from('\r\n'));
    const json = `${JSON.stringify(content, null, 2)}\n`;
    writeFileSync(CONTENT, wasCrlf ? json.replace(/\n/g, '\r\n') : json);
    console.log(`rewrote ${renames.size} image references in ${CONTENT}`);
    const total = referenced
        .map((n) => renames.get(n) || n)
        .filter((n) => existsSync(join(PUBLIC_DIR, n)))
        .reduce((sum, n) => sum + statSync(join(PUBLIC_DIR, n)).size, 0);
    console.log(`public/card_images now totals ${(total / 1e6).toFixed(2)} MB`);
} else {
    console.log('\ndry run — re-run with --apply to write files');
}
