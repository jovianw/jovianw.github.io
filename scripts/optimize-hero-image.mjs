// Re-encodes the hero portrait to WebP using Chromium's own encoder, so the
// repo needs no image-processing dependency. Alpha is preserved, which matters
// because the cut-out sits over the gradient field and its drop-shadow is
// derived from the alpha channel.
//
//   node scripts/optimize-hero-image.mjs
//
// Run it after replacing the source PNG. The .webp in public/ is what the site
// loads; the PNG lives outside public/ so the 2.9 MB original is not copied
// into the build output.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, statSync } from 'node:fs';

const SRC = 'src/assets/source-images/graduation_3.png';
const OUT = 'public/graduation_3.webp';
const MAX_WIDTH = 1400; // ~2x its largest rendered size
const QUALITY = 0.86;

const b64 = readFileSync(SRC).toString('base64');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const result = await page.evaluate(
    async ({ b64, maxWidth, quality }) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
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

        return {
            source: { w: img.naturalWidth, h: img.naturalHeight },
            output: { w, h },
            dataUrl: canvas.toDataURL('image/webp', quality),
        };
    },
    { b64, maxWidth: MAX_WIDTH, quality: QUALITY }
);

await browser.close();

writeFileSync(OUT, Buffer.from(result.dataUrl.split(',')[1], 'base64'));

const before = statSync(SRC).size;
const after = statSync(OUT).size;
console.log(`source ${result.source.w}x${result.source.h}  ${(before / 1e6).toFixed(2)} MB`);
console.log(`output ${result.output.w}x${result.output.h}  ${(after / 1e3).toFixed(0)} kB`);
console.log(`saved  ${(100 - (after / before) * 100).toFixed(1)}%`);
