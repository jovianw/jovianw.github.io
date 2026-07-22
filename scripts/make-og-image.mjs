// Renders the hero into public/og-image.jpg, the file the og:image and
// twitter:image tags in index.html point at.
//
//   npm run dev          # in one terminal
//   node scripts/make-og-image.mjs [port]
//
// Re-run this whenever the hero design changes, or the share card will show a
// stale layout.
import { chromium } from 'playwright';

const PORT = process.argv[2] || '5173';
const CARD = { width: 1200, height: 630 };

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
    // Rendered taller than the card, then cropped to it. The hero is svh-sized,
    // so laying it out into a 630px-tall viewport compresses the portrait and
    // wordmark; 820 gives proportions close to what a visitor actually sees,
    // and the card takes the top of that.
    viewport: { width: CARD.width, height: 820 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce', // capture the settled state, not mid-entrance
});
const page = await ctx.newPage();
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.screenshot({
    path: 'public/og-image.jpg',
    type: 'jpeg',
    quality: 90,
    clip: { x: 0, y: 0, ...CARD },
});
await browser.close();
console.log(`wrote public/og-image.jpg (${CARD.width}x${CARD.height})`);
