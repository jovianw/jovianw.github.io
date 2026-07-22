// End-to-end checks. Run a server first, then:
//   node scripts/verify.mjs <port> [screenshot-prefix]
import { chromium, devices } from 'playwright';

const PORT = process.argv[2] || '5173';
const PREFIX = process.argv[3] || 'verify';
const URL = `http://localhost:${PORT}/`;

let failures = 0;
const check = (name, ok, detail) => {
    if (!ok) failures++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail !== undefined ? `  ${detail}` : ''}`);
};
const section = (t) => console.log(`\n=== ${t} ===`);

const browser = await chromium.launch({ headless: true });

// ------------------------------------------------- entrance choreography ---
// The regression this guards: the hero entrance was timed from mount, so the
// whole sequence played out behind the loading overlay and the page looked
// fully settled the instant it became visible.
{
    section('entrance is visible AFTER the overlay clears');
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'domcontentloaded' });

    const t0 = Date.now();
    let overlayGoneAt = null;
    let firstMoveAt = null;
    let settledAt = null;

    for (let i = 0; i < 40; i++) {
        const s = await page
            .evaluate(() => {
                const el = document.querySelector('#about-summary p')?.parentElement;
                return {
                    overlay: !!document.getElementById('overlay'),
                    opacity: el ? +getComputedStyle(el).opacity : null,
                };
            })
            .catch(() => ({}));
        const t = Date.now() - t0;
        if (overlayGoneAt === null && s.overlay === false) overlayGoneAt = t;
        if (firstMoveAt === null && s.opacity > 0.01 && s.opacity < 0.99) firstMoveAt = t;
        if (settledAt === null && s.opacity >= 0.99) settledAt = t;
        if (settledAt !== null && overlayGoneAt !== null) break;
        await page.waitForTimeout(80);
    }

    check(
        'hero copy is still animating when the overlay lifts',
        firstMoveAt !== null && overlayGoneAt !== null && settledAt > overlayGoneAt,
        `overlayGone=${overlayGoneAt}ms firstMove=${firstMoveAt}ms settled=${settledAt}ms`
    );
    await ctx.close();
}

// --------------------------------------------------------------- desktop ---
{
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    section('page health');
    check('no console/page errors', errs.length === 0, errs.join(' | '));

    section('scroll container');
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(300);
    check('window scrolls', (await page.evaluate(() => window.scrollY)) === 600);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);

    section('hero: body copy never overlaps the portrait');
    for (const [w, h] of [[1440, 900], [1280, 800], [1152, 720], [1024, 768]]) {
        await page.setViewportSize({ width: w, height: h });
        await page.waitForTimeout(500);
        const overlap = await page.evaluate(() => {
            const img = document.getElementById('about-img-parallax').getBoundingClientRect();
            let worst = -1e9;
            for (const n of document.querySelectorAll('#about-summary p, #about-summary h2')) {
                const r = document.createRange();
                r.selectNodeContents(n);
                for (const rect of r.getClientRects()) worst = Math.max(worst, rect.right - img.left);
            }
            return Math.round(worst);
        });
        check(`${w}x${h}: text clears portrait`, overlap <= 0, `overlap=${Math.max(0, overlap)}px`);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(500);

    section('pointer-reactive gradient');
    // The spotlight is excluded: it tracks the cursor outright (~1000px of
    // travel), so it would swamp the spread these two checks are measuring.
    const readLayers = () =>
        page.evaluate(() =>
            [...document.querySelectorAll('#about .gradient-field .blob:not(.blob--spot)')].map(
                (b) => getComputedStyle(b).transform
            )
        );
    await page.mouse.move(200, 700, { steps: 10 });
    await page.waitForTimeout(900);
    const left = await readLayers();
    await page.mouse.move(1350, 180, { steps: 14 });
    await page.waitForTimeout(900);
    const right = await readLayers();
    const dx = right.map((m, i) => {
        const a = (s) => (s === 'none' ? 0 : Number(s.match(/matrix\(([^)]+)\)/)[1].split(',')[4]));
        return Math.abs(a(m) - a(left[i]));
    });
    check('every aurora layer leans with the pointer', dx.length === 5 && dx.every((d) => d > 5), dx.map((d) => d.toFixed(0) + 'px').join(', '));
    check('layers move by different amounts (depth, not a sheet)', new Set(dx.map((d) => d.toFixed(0))).size > 2);

    section('scroll parallax');
    const read = async (y) => { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(500);
        return page.evaluate(() => {
            const t = (id) => { const m = getComputedStyle(document.getElementById(id)).transform;
                return m === 'none' ? 0 : Number(m.match(/matrix\(([^)]+)\)/)[1].split(',')[5]); };
            return { grad: 0 /* field is class-based now, covered separately */, name: t('about-name'), portrait: t('about-img-parallax') };
        }); };
    const a = await read(0), b = await read(500);
    const fieldY = await page.evaluate(() => {
        const m = getComputedStyle(document.querySelector('#about .gradient-field')).transform;
        return m === 'none' ? 0 : Number(m.match(/matrix\(([^)]+)\)/)[1].split(',')[5]);
    });
    check('gradient moves down as you scroll', fieldY > 10, `${fieldY.toFixed(0)}px`);
    check('wordmark moves up faster than the portrait', b.name < b.portrait, `name=${b.name.toFixed(0)} portrait=${b.portrait.toFixed(0)}`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);

    section('card interaction');
    await page.evaluate(() => window.scrollTo(0, document.getElementById('timeline').offsetTop + 40));
    await page.waitForTimeout(1500);
    const rest = await page.evaluate(() => +getComputedStyle(document.querySelector('.timeline-text')).opacity);
    check('text hidden at rest', rest < 0.05, `opacity=${rest}`);
    await (await page.$$('.timeline-card'))[0].hover();
    await page.waitForTimeout(700);
    const hov = await page.evaluate(() => ({
        text: +getComputedStyle(document.querySelector('.timeline-text')).opacity,
        veil: +getComputedStyle(document.querySelector('.timeline-veil')).opacity,
        img: getComputedStyle(document.querySelector('.timeline-image')).filter,
    }));
    check('hover reveals text', hov.text > 0.95, `opacity=${hov.text}`);
    check('hover shows the dark panel', hov.veil > 0.95);
    check('hover blurs the image', hov.img.includes('blur'), hov.img);

    const kb = await page.evaluate(async () => {
        const card = [...document.querySelectorAll('.timeline-card')].find((c) => c.hasAttribute('tabindex'));
        card.focus();
        await new Promise((r) => setTimeout(r, 700));
        return +getComputedStyle(card.querySelector('.timeline-text')).opacity;
    });
    check('keyboard focus reveals text too', kb > 0.95, `opacity=${kb}`);

    section('portrait is never translucent');
    // The wordmark sits directly behind the portrait, so any opacity below 1
    // during the entrance lets "WANG" read through his face.
    const portraitOpacity = await page.evaluate(() => Math.min(
        +getComputedStyle(document.getElementById('about-img-parallax')).opacity,
        +getComputedStyle(document.getElementById('about-img')).opacity
    ));
    check('opacity is exactly 1', portraitOpacity === 1, `${portraitOpacity}`);

    section('footer shares the gradient field');
    const footer = await page.evaluate(() => ({
        fields: document.querySelectorAll('.gradient-field').length,
        inFooter: !!document.querySelector('.footer .gradient-field'),
        bg: getComputedStyle(document.querySelector('.footer')).backgroundColor,
    }));
    check('a field is rendered in the footer', footer.inFooter && footer.fields === 2, JSON.stringify(footer));

    section('button fill is fully parked at rest');
    // The fill's rounded right edge must clear the button's left edge by more
    // than its own antialiasing, or a blue sliver shows in column 0 at rest —
    // most visibly on the dark solid buttons, and at fractional device pixel
    // ratios.
    await page.mouse.move(1380, 40);
    await page.waitForTimeout(900);
    const btnBox = await (await page.$('#about-summary .btn')).boundingBox();
    const strip = await page.screenshot({
        clip: { x: btnBox.x, y: btnBox.y, width: 8, height: btnBox.height },
    });
    const lead = await page.evaluate(async (b64) => {
        const img = new Image();
        img.src = 'data:image/png;base64,' + b64;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const cx = c.getContext('2d');
        cx.drawImage(img, 0, 0);
        const d = cx.getImageData(0, 0, img.width, img.height).data;
        // --accent-2 is rgb(109,175,199), a blue-over-red lead of 90. --ink is
        // rgb(20,23,26), a lead of 6. Anything much above 6 is the fill
        // bleeding past its parked position.
        let worst = 0;
        for (let i = 0; i < d.length; i += 4) worst = Math.max(worst, d[i + 2] - d[i]);
        return worst;
    }, strip.toString('base64'));
    check('no fill visible in the left edge at rest', lead <= 10, `blue-over-red lead = ${lead} (ink itself is 6)`);

    section('links and content');
    const tl = await page.evaluate(() => ({
        cards: document.querySelectorAll('.timeline-card').length,
        chips: document.querySelectorAll('.timeline-chip').length,
        query: [...document.querySelectorAll('.timeline-cta')].filter((x) => x.href.includes('usp=sharing')).length,
    }));
    check('21 cards, all chips', tl.cards === 21 && tl.chips >= 59, JSON.stringify(tl));
    check('query strings preserved', tl.query === 1);

    section('no horizontal overflow');
    check('none', (await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0);

    section('social card');
    const og = await page.evaluate(async () => {
        const u = document.querySelector('meta[property="og:image"]').content.replace(/^https?:\/\/[^/]+/, '');
        return (await fetch(u)).status;
    });
    check('og:image resolves', og === 200, `status=${og}`);

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${PREFIX}-desktop.png` });
    await ctx.close();
}

// ----------------------------------------------------------------- touch ---
{
    section('touch device (iPhone 13)');
    const ctx = await browser.newContext({ ...devices['iPhone 13'] });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    const t = await page.evaluate(() => ({
        textOpacity: +getComputedStyle(document.querySelector('.timeline-text')).opacity,
        cols: getComputedStyle(document.getElementById('timeline')).gridTemplateColumns.split(' ').length,
        hOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    check('card text visible without hover', t.textOpacity > 0.95, JSON.stringify(t));
    check('single column', t.cols === 1);
    check('no horizontal overflow', t.hOverflow <= 0);
    await ctx.close();
}

// -------------------------------------------------------- reduced motion ---
// The site deliberately behaves identically whether or not the OS reports
// reduced motion — see the note in index.css. This guards that: on Windows the
// preference is just an "animation effects" toggle, and honouring it made the
// whole interface feel dead for a large share of visitors.
{
    section('reduced motion changes nothing');
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // button sweep
    await page.hover('.btn');
    await page.waitForTimeout(170);
    // The fill translates in from the left; at rest it sits fully off-screen at
    // -100% of its own (150%-wide) box, so translateX goes from about -1.5x the
    // button width up to 0.
    const sweep = await page.evaluate(() => {
        const el = document.querySelector('.btn');
        const m = getComputedStyle(el, '::before').transform;
        const tx = m === 'none' ? 0 : Number(m.match(/matrix\(([^)]+)\)/)[1].split(',')[4]);
        return { tx, w: el.getBoundingClientRect().width };
    });
    const progress = 1 + sweep.tx / (sweep.w * 1.5);
    check('button fill sweeps in', progress > 0.05 && progress < 0.98, `${(progress * 100).toFixed(0)}% across mid-sweep`);

    // ambient aurora with the pointer parked
    const sample = () => page.evaluate(() => {
        const cs = getComputedStyle(document.querySelector('#about .gradient-field .blob--rose'));
        return `${cs.translate}|${cs.scale}|${cs.rotate}`;
    });
    const a1 = await sample();
    await page.waitForTimeout(1500);
    const a2 = await sample();
    check('aurora drifts with no pointer input', a1 !== a2, `${a1} -> ${a2}`);

    // spotlight tracking
    const spot = () => page.evaluate(() => {
        const m = getComputedStyle(document.querySelector('#about .blob--spot')).transform;
        if (m === 'none') return [0, 0];
        const p = m.match(/matrix\(([^)]+)\)/)[1].split(',').map(Number);
        return [Math.round(p[4]), Math.round(p[5])];
    });
    await page.mouse.move(300, 700, { steps: 12 });
    await page.waitForTimeout(900);
    const s1 = await spot();
    await page.mouse.move(1250, 200, { steps: 14 });
    await page.waitForTimeout(900);
    const s2 = await spot();
    check('spotlight follows the cursor', Math.abs(s2[0] - s1[0]) > 500 && Math.abs(s2[1] - s1[1]) > 300, `${s1} -> ${s2}`);

    // card reveal
    await page.evaluate(() => window.scrollTo(0, document.getElementById('timeline').offsetTop + 40));
    await page.waitForTimeout(1400);
    await (await page.$$('.timeline-card'))[0].hover();
    await page.waitForTimeout(160);
    const mid = await page.evaluate(() => +getComputedStyle(document.querySelectorAll('.timeline-text')[0]).opacity);
    check('card text is mid-fade, not snapped', mid > 0.02 && mid < 0.98, `opacity mid-reveal = ${mid.toFixed(2)}`);

    check('no errors', errs.length === 0, errs.join(' | '));
    await ctx.close();
}

// ------------------------------------------------------------ card text ---
{
    section('every card text fits its box');
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
    const over = await page.evaluate(async () => {
        // Two frames, so the fitter's writes have flushed before measuring.
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const bad = [];
        document.querySelectorAll('.timeline-text').forEach((t, i) => {
            const d = t.scrollHeight - t.clientHeight;
            if (d > 2) bad.push(`#${i} +${d}px`);
        });
        return bad;
    });
    check('no card text is cut off', over.length === 0, over.join(', '));
    await ctx.close();
}

await browser.close();
console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
