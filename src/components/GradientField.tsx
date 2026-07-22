import { useEffect, useRef, type RefObject } from "react";
import { m, useInView, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import "./GradientField.css";

/**
 * The aurora gradient field. Rendered behind the hero and again behind the
 * footer.
 *
 * Two things run at once, and the mix is the point:
 *
 *  1. An aurora. Six coloured lights, each drifting, scaling and counter-
 *     rotating on its own long loop at a different period, so the overlaps
 *     never repeat the same way twice. This runs with or without a pointer.
 *  2. A lagging spotlight. One extra light sits under the cursor and follows it
 *     on a soft spring, roughly a third of a second behind. The other layers
 *     lean toward or away from the pointer by different amounts, which is what
 *     stops the field reading as one flat sheet sliding around.
 *
 * The ambient drift uses the standalone `translate`, `scale` and `rotate`
 * properties rather than `transform`, so the CSS keyframes and Motion's inline
 * `transform` compose instead of overwriting each other.
 *
 * Nothing here branches on prefers-reduced-motion; the motion is kept small and
 * slow in absolute terms instead. See the note in index.css.
 */

/** Follows the pointer closely enough to feel connected, loosely enough to lag. */
const SPOT_SPRING = { stiffness: 55, damping: 22, mass: 0.85, restDelta: 0.2 } as const;
/** Slower still, so the background layers trail behind the spotlight. */
const FIELD_SPRING = { stiffness: 38, damping: 24, mass: 1, restDelta: 0.0004 } as const;

/**
 * Travel in px when the pointer reaches the edge of the viewport. Negative
 * values move against the pointer — that opposition is most of the depth.
 * Order matches paint order, back to front.
 */
const LAYERS = [
    { key: "deep", className: "blob blob--deep", dx: -120, dy: -70 },
    { key: "cool", className: "blob blob--cool", dx: -78, dy: 52 },
    { key: "rose", className: "blob blob--rose", dx: 96, dy: -64 },
    { key: "warm", className: "blob blob--warm", dx: 132, dy: 84 },
    { key: "haze", className: "blob blob--haze", dx: -58, dy: 40 },
] as const;

interface BlobProps {
    className: string;
    dx: number;
    dy: number;
    x: MotionValue<number>;
    y: MotionValue<number>;
}

function Blob({ className, dx, dy, x, y }: BlobProps) {
    const tx = useTransform(x, (v) => v * dx);
    const ty = useTransform(y, (v) => v * dy);
    return <m.div className={className} style={{ x: tx, y: ty }} />;
}

interface Props {
    /** Section to derive the scroll parallax from. Omit for no parallax, as
     *  the footer does — it has no depth relationship to establish. */
    parallaxTarget?: RefObject<HTMLElement>;
    /** Held false until the loading overlay clears. Defaults to visible for
     *  the footer, which is far below the fold with no entrance to
     *  coordinate. */
    start?: boolean;
}

export default function GradientField({ parallaxTarget, start = true }: Props) {
    const fieldRef = useRef<HTMLDivElement | null>(null);
    const inView = useInView(fieldRef, { amount: 0.01 });

    // Normalised pointer, -0.5 to 0.5, for the parallax layers.
    const px = useMotionValue(0);
    const py = useMotionValue(0);
    // Raw offset from the centre of the viewport, in px, for the spotlight.
    const ox = useMotionValue(0);
    const oy = useMotionValue(0);

    // None of these ever enter React state, so no pointer event causes a
    // render. Motion writes the transforms on its own rAF loop.
    const sx = useSpring(px, FIELD_SPRING);
    const sy = useSpring(py, FIELD_SPRING);
    const spotX = useSpring(ox, SPOT_SPRING);
    const spotY = useSpring(oy, SPOT_SPRING);

    const { scrollYProgress } = useScroll({
        target: parallaxTarget,
        offset: ["start start", "end start"],
    });
    const scrollY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
    const scrollScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
    const parallax = parallaxTarget ? { y: scrollY, scale: scrollScale } : undefined;

    useEffect(() => {
        if (!inView) return;

        // Touch is gated out: there is no pointer to follow, and promoting
        // viewport-sized layers on a high-DPR phone risks a memory-pressure
        // tab reload.
        const fine = window.matchMedia("(hover: hover) and (pointer: fine)");

        const size = { w: window.innerWidth || 1, h: window.innerHeight || 1 };
        const measure = () => {
            size.w = window.innerWidth || 1;
            size.h = window.innerHeight || 1;
        };

        const onPointerMove = (e: PointerEvent) => {
            // Hybrid devices match `pointer: fine` because of an attached
            // mouse or stylus even while the user is touching the screen, and
            // without this a touch-drag yanks the field across the viewport.
            if (e.pointerType === "touch") return;
            px.set(e.clientX / size.w - 0.5);
            py.set(e.clientY / size.h - 0.5);
            ox.set(e.clientX - size.w / 2);
            oy.set(e.clientY - size.h / 2);
        };

        // Eases home rather than snapping, because these are the spring sources.
        const recentre = () => {
            px.set(0);
            py.set(0);
            ox.set(0);
            oy.set(0);
        };

        const attach = () => {
            window.addEventListener("pointermove", onPointerMove, { passive: true });
            document.addEventListener("pointerleave", recentre);
            window.addEventListener("blur", recentre);
            window.addEventListener("pagehide", recentre);
        };

        const detach = () => {
            window.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerleave", recentre);
            window.removeEventListener("blur", recentre);
            window.removeEventListener("pagehide", recentre);
            recentre();
        };

        // Re-evaluated live, so plugging a mouse into a tablet starts the
        // effect and unplugging it stops it, with no reload.
        const sync = () => (fine.matches ? attach() : detach());

        window.addEventListener("resize", measure, { passive: true });
        fine.addEventListener("change", sync);
        sync();

        return () => {
            window.removeEventListener("resize", measure);
            fine.removeEventListener("change", sync);
            detach();
        };
    }, [inView, px, py, ox, oy]);

    return (
        <m.div
            className="gradient-field"
            ref={fieldRef}
            aria-hidden="true"
            style={parallax}
            initial={{ opacity: 0 }}
            animate={start ? { opacity: 1 } : undefined}
            transition={{ duration: 1.1, ease: "easeOut" }}
        >
            {LAYERS.map((l) => (
                <Blob key={l.key} className={l.className} dx={l.dx} dy={l.dy} x={sx} y={sy} />
            ))}
            {/* The spotlight is positioned at the centre in CSS and offset from
                there by the sprung pointer delta, so it genuinely sits under the
                cursor rather than merely leaning toward it. */}
            <m.div className="blob blob--spot" style={{ x: spotX, y: spotY }} />
            <div className="field-grain" />
        </m.div>
    );
}
