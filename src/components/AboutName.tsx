import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import {
    m,
    useInView,
    useMotionTemplate,
    useMotionValue,
    useScroll,
    useSpring,
    useTransform,
    type MotionStyle,
} from "motion/react";
import ShimmerText from "./ShimmerText";

interface Props {
    heroRef: RefObject<HTMLElement>;
    /** Held false until the loading overlay clears, so the reveal is seen. */
    start: boolean;
    delay: number;
    /** Flips true once the entrance sweep has finished, which is when the
     *  wordmark stops being swept and starts being shiny. */
    trackPointer: boolean;
}

/** The aspect ratio below which the wordmark breaks onto two lines. Shared with
 *  About.css so the layout and the line-breaking stay in sync. */
const WIDE_QUERY = "(min-aspect-ratio: 46/39)";

/** No pointer, no reflection. On a touch screen the wordmark keeps its entrance
 *  sweep and nothing else. */
const FINE_POINTER = "(hover: hover) and (pointer: fine)";

/** The `background-position` percentage that centres the band `f` of the way
 *  across the word, as read by the sheen in Shimmer.css. The background is
 *  three times its box, so the band's centre travels from -0.5 to 1.5 as the
 *  position falls from 100% to 0% — and a *higher* percentage is further left. */
const positionFor = (f: number) => 75 - 50 * f;

/** Parked off the left edge: before anything has happened, and the state the
 *  entrance sweep hands over in. */
const OFF_LEFT = 100;

/** Where the highlight rests when the pointer is dead centre. Just right of the
 *  middle rather than on it — a highlight sitting exactly centre reads as a
 *  placed graphic, and the asymmetry is most of what sells it as a reflection. */
const SHINE_HOME = 0.6;

/** How far the highlight slides for a full-width sweep of the pointer, as a
 *  fraction of the wordmark. Inverse and geared down, because that is what a
 *  reflection does: it slides against the thing that moves it, and it slides
 *  less. Matched to the pointer 1:1 it stops reading as a highlight on the
 *  surface and starts reading as a cursor of its own. */
const TRACK_GAIN = 0.55;

/** The arrival only. Overdamped — damping is above the critical
 *  2*sqrt(stiffness) — so the band decelerates into place instead of ringing
 *  around it. Once it lands the spring is out of the picture: the highlight
 *  tracks the pointer exactly, with nothing between the two. */
const SHINE_SPRING = { stiffness: 45, damping: 16, mass: 1 };

/** ms of dead air between the entrance sweep leaving and the resting highlight
 *  flying in after it. Without the pause the two read as one continuous sweep
 *  that stalls in the middle. */
const SHINE_ARRIVAL_MS = 400;

/** ms for the spring above to cover the width of the word and settle. It ends
 *  the arrival on a clock rather than on the spring's own completion event: a
 *  spring that is being retargeted by a moving pointer keeps cancelling and
 *  restarting, and would never report itself finished. */
const SHINE_SETTLE_MS = 1300;

/** The resting position for a pointer at `x` (0-1 across the viewport). */
const restingShine = (x: number) => positionFor(SHINE_HOME - TRACK_GAIN * (x - 0.5));

/**
 * The fitted wordmark, always a single <h1> even when it breaks onto two visual
 * lines — two <h1> elements would show in a screen reader's heading list as two
 * peer document titles.
 */
function AboutName({ heroRef, start, delay, trackPointer }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isWide, setIsWide] = useState(
        () => typeof window !== "undefined" && window.matchMedia(WIDE_QUERY).matches
    );
    const [hasPointer] = useState(
        () => typeof window !== "undefined" && window.matchMedia(FINE_POINTER).matches
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

    // Where the highlight is asked to be, and where it is. The spring between
    // them carries the arrival and nothing else — see the move handler, which
    // jumps straight past it once the band has landed.
    const shineTarget = useMotionValue(OFF_LEFT);
    const shine = useSpring(shineTarget, SHINE_SPRING);
    const shineX = useMotionTemplate`${shine}%`;

    // Last seen pointer, kept from mount rather than from the handover, so the
    // highlight can fly to where the pointer already is instead of arriving at
    // the middle and then crossing to meet it.
    const pointerX = useRef(0.5);
    const [phase, setPhase] = useState<"idle" | "arriving" | "tracking">("idle");

    // Only while the hero is on screen. The listener is nearly free, but the
    // work it causes is not: every change repaints a full-width text layer, and
    // the pointer keeps moving long after the wordmark has scrolled away.
    const heroInView = useInView(heroRef, { amount: 0.2 });

    useEffect(() => {
        const mql = window.matchMedia(WIDE_QUERY);
        const handler = (e: MediaQueryListEvent) => setIsWide(e.matches);
        mql.addEventListener("change", handler);
        setIsWide(mql.matches);
        return () => mql.removeEventListener("change", handler);
    }, []);

    useEffect(() => {
        if (!hasPointer) return;
        const onMove = (event: PointerEvent) => {
            const x = event.clientX / window.innerWidth;
            pointerX.current = x;
            if (phase === "idle" || !heroInView) return;

            const at = restingShine(x);
            shineTarget.set(at);
            // Landed: from here the highlight *is* the pointer's position, so
            // it jumps rather than springs. `jump` also stops the animation the
            // line above just armed, which is what takes the spring out of the
            // loop for good — a reflection does not trail what it reflects.
            if (phase === "tracking") shine.jump(at);
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        return () => window.removeEventListener("pointermove", onMove);
    }, [hasPointer, phase, heroInView, shine, shineTarget]);

    // The handover. Until this fires the target sits off the left edge, so the
    // spring holds the band out of sight and the sweep owns the wordmark; after
    // it, the spring's own deceleration is the arrival. The pointer is live
    // throughout — move during the flight and the band curves to meet where the
    // pointer has got to, rather than landing on a stale spot and jumping.
    useEffect(() => {
        if (!trackPointer || !hasPointer) return;
        let settle = 0;
        const arrive = window.setTimeout(() => {
            setPhase("arriving");
            shineTarget.set(restingShine(pointerX.current));
            settle = window.setTimeout(() => setPhase("tracking"), SHINE_SETTLE_MS);
        }, SHINE_ARRIVAL_MS);

        return () => {
            window.clearTimeout(arrive);
            window.clearTimeout(settle);
        };
    }, [trackPointer, hasPointer, shineTarget]);

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
                className={phase === "idle" ? undefined : "is-shine-tracking"}
                // `--shine-x` is read by the sheen inside each line, so one
                // value here moves the highlight on both. Motion applies
                // custom properties with `setProperty`, but `MotionStyle` has
                // no index signature for them, hence the cast.
                style={{ y, opacity, "--shine-x": shineX } as MotionStyle}
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
                {/* Each line is a ShimmerText: it renders the word plus a
                    hidden copy that carries the travelling highlight. The copy
                    is absolutely positioned, so `fit` still measures the inked
                    width of the line and nothing else. */}
                {isWide ? (
                    <ShimmerText className="about-name-text" text="JOVIAN WANG" />
                ) : (
                    <>
                        <ShimmerText className="about-name-text" text="JOVIAN" />
                        <ShimmerText className="about-name-text" text="WANG" />
                    </>
                )}
            </m.h1>
        </div>
    );
}

export default AboutName;
