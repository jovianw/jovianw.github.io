import { useRef, type ReactNode } from "react";
import {
    m,
    useInView,
    type MotionProps,
    type Transition,
    type UseInViewOptions,
    type Variants,
} from "motion/react";

/**
 * Adapted from the magicui / 21st.dev BlurFade for motion v12, with three
 * deliberate differences from that source:
 *
 *  1. No `<AnimatePresence>` wrapper. The single child is never conditionally
 *     unmounted and has no key, so `exit` could never fire — the wrapper would
 *     be a context provider allocated once per instance for nothing.
 *  2. The props interface omits the animation-critical MotionProps keys rather
 *     than extending them, because this component sets them itself. Extending
 *     would advertise `animate` / `initial` / `variants` / `transition` and
 *     then silently ignore whatever a caller passed.
 *  3. `variant` is typed `Variants`, so the escape hatch accepts x-axis,
 *     opacity and filter overrides.
 */

/**
 * `MarginType` exists in motion v12 but is not in the module's export list, so
 * indexing `UseInViewOptions` is the only supported way to name it. Values are
 * px/% only, in 1-4 value form: "-10rem" or a bare "0" are type errors.
 */
type MarginType = UseInViewOptions["margin"];

export interface BlurFadeProps
    extends Omit<MotionProps, "variants" | "initial" | "animate" | "exit" | "transition"> {
    children: ReactNode;
    className?: string;
    variant?: Variants;
    duration?: number;
    delay?: number;
    offset?: number;
    direction?: "up" | "down" | "left" | "right";
    inView?: boolean;
    inViewMargin?: MarginType;
    blur?: string;
    /**
     * Hold in the hidden state until this flips true. The hero uses it to time
     * its entrance from the moment the loading overlay clears rather than from
     * mount, so the sequence is visible when it plays.
     */
    gate?: boolean;
}

/** The site-wide workhorse curve, as a bezier array rather than a raw easing
 *  function so Motion can hand off to WAAPI instead of animating in JS. */
const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;

export function BlurFade({
    children,
    className,
    variant,
    duration = 0.38,
    delay = 0,
    offset = 10,
    direction = "down",
    inView = false,
    inViewMargin = "-12% 0px -8% 0px",
    blur = "8px",
    gate = true,
    ...props
}: BlurFadeProps) {
    const ref = useRef<HTMLDivElement | null>(null);

    const inViewResult = useInView(ref, { once: true, margin: inViewMargin });
    const isInView = !inView || inViewResult;

    const axis = direction === "left" || direction === "right" ? "x" : "y";
    const displacement = direction === "right" || direction === "down" ? -offset : offset;

    const defaultVariants: Variants = {
        hidden: { [axis]: displacement, opacity: 0, filter: `blur(${blur})` },
        visible: { [axis]: 0, opacity: 1, filter: "blur(0px)" },
    };

    const combinedVariants: Variants = variant ?? defaultVariants;

    const transition: Transition = {
        delay: 0.04 + delay,
        duration,
        ease: EASE_OUT_QUINT,
    };

    return (
        <m.div
            // Spread first, before the animation-critical props, so a caller
            // cannot clobber them through the rest spread.
            {...props}
            ref={ref}
            className={className}
            variants={combinedVariants}
            // `initial` matters as much as `animate`: an element whose
            // IntersectionObserver never fires must not sit at opacity 0.
            initial="hidden"
            animate={gate && isInView ? "visible" : "hidden"}
            transition={transition}
            onAnimationComplete={(definition) => {
                if (definition !== "visible" || !ref.current) return;
                // Clearing `filter` releases the compositor layer. Left set,
                // every settled element holds one for the life of the page —
                // with 21 timeline cards, 21 layers for nothing.
                ref.current.style.filter = "";
                ref.current.style.willChange = "auto";
            }}
        >
            {children}
        </m.div>
    );
}

export default BlurFade;
