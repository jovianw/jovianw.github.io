import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { m, useScroll, useTransform } from "motion/react";

interface Props {
    heroRef: RefObject<HTMLElement>;
    /** Held false until the loading overlay clears, so the reveal is seen. */
    start: boolean;
    delay: number;
}

/** The aspect ratio below which the wordmark breaks onto two lines. Shared with
 *  About.css so the layout and the line-breaking stay in sync. */
const WIDE_QUERY = "(min-aspect-ratio: 46/39)";

/**
 * The fitted wordmark, always a single <h1> even when it breaks onto two visual
 * lines — two <h1> elements would show in a screen reader's heading list as two
 * peer document titles.
 */
function AboutName({ heroRef, start, delay }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isWide, setIsWide] = useState(
        () => typeof window !== "undefined" && window.matchMedia(WIDE_QUERY).matches
    );

    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"],
    });
    // Pixels, not percentages: a percentage resolves against each element's
    // own height, so the short wordmark and the tall portrait would get rates
    // with no relation to each other. The wordmark is the fastest layer, which
    // is what makes it read as nearest.
    const y = useTransform(scrollYProgress, [0, 1], [0, -190]);
    const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0.35]);

    useEffect(() => {
        const mql = window.matchMedia(WIDE_QUERY);
        const handler = (e: MediaQueryListEvent) => setIsWide(e.matches);
        mql.addEventListener("change", handler);
        setIsWide(mql.matches);
        return () => mql.removeEventListener("change", handler);
    }, []);

    /**
     * Scales each line to exactly fill the container.
     *
     * Measures at the current size and scales from there. Do not rewrite this
     * to write a probe font-size and measure that: the read is not reliably
     * flushed after the write, and a stale measurement latches the wordmark at
     * the wrong size with nothing left to invalidate it.
     *
     * Measuring first is also exact in one pass, since a line's advance width
     * is linear in font-size and the tracking is in em, so it scales too.
     */
    const fit = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        const containerWidth = container.clientWidth;
        if (!containerWidth) return;

        for (const text of container.querySelectorAll<HTMLElement>(".about-name-text")) {
            const width = text.getBoundingClientRect().width;
            const current = parseFloat(getComputedStyle(text).fontSize);
            if (!width || !current) continue;
            text.style.fontSize = `${current * (containerWidth / width)}px`;
        }
    }, []);

    // A layout effect, so the wordmark is never painted at an unfitted size.
    // The fonts promise is guarded against StrictMode's double-invoke, which
    // would otherwise let a cleaned-up run mutate styles after teardown.
    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let cancelled = false;
        const run = () => {
            if (!cancelled) fit();
        };

        const observer = new ResizeObserver(run);
        observer.observe(container);
        document.fonts.ready.then(run);
        run();

        return () => {
            cancelled = true;
            observer.disconnect();
        };
    }, [fit, isWide]);

    return (
        <div id="about-name-container" ref={containerRef}>
            <m.h1
                id="about-name"
                // The visible text splits across one or two block lines, each
                // fitted independently to the container width. The label keeps
                // the accessible name a single, correctly spaced string.
                aria-label="Jovian Wang"
                style={{ y, opacity }}
                // An ease-out curve makes the letters rise into the mask
                // with mass, rather than reading as a curtain lifting off them.
                // The blur resolves alongside the rise, so they come into focus
                // as they arrive.
                initial={{ clipPath: "inset(105% 0 0 0)", filter: "blur(16px)" }}
                animate={
                    start
                        ? { clipPath: "inset(-5% 0 0 0)", filter: "blur(0px)" }
                        : undefined
                }
                transition={{ duration: 0.95, delay, ease: [0.16, 1, 0.3, 1] }}
            >
                {isWide ? (
                    <span className="about-name-text">JOVIAN WANG</span>
                ) : (
                    <>
                        <span className="about-name-text">JOVIAN</span>
                        <span className="about-name-text">WANG</span>
                    </>
                )}
            </m.h1>
        </div>
    );
}

export default AboutName;
