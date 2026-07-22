import { useEffect, useState, type RefObject } from "react";

export interface ShimmerOptions {
    /** The pass is armed when this flips true, and never before. */
    gate: boolean;
    /** ms from the gate to the pass. Long enough that whatever entrance the
     *  gated element plays is over before the highlight arrives. */
    lead?: number;
}

/** ms the pass occupies, from the choreography in Shimmer.css: the longer of
 *  the text sweep and the control row's lead plus its own sweep. The class is
 *  cleared once it elapses — the sweep is a one-off, and on the wordmark a
 *  pointer-tracked highlight takes over from there (see AboutName). */
const PASS_MS = 2300;

/**
 * Drives the shimmer's timing. Returns the class for the element that
 * *contains* both the text and the controls — the choreography itself lives in
 * Shimmer.css, so nothing here knows what a pass looks like — and a flag for
 * when the pass is over, which is what the hero hands the pointer shine.
 */
export function useShimmer({ gate, lead = 1200 }: ShimmerOptions) {
    const [phase, setPhase] = useState<"idle" | "running" | "played">("idle");

    useEffect(() => {
        if (!gate) return;

        let timer = window.setTimeout(() => {
            setPhase("running");
            timer = window.setTimeout(() => setPhase("played"), PASS_MS);
        }, lead);

        return () => window.clearTimeout(timer);
    }, [gate, lead]);

    return { className: phase === "running" ? "shimmer-run" : "", played: phase === "played" };
}

/**
 * Publishes the geometry the control-row sweep needs: the row's width, and each
 * control's distance from the row's left edge.
 *
 * Shimmer.css explains why one band crossing the row beats three per-control
 * sweeps; this is the part CSS cannot supply. There is no length that means "my
 * offset within my parent", so it is measured here and written back as two
 * custom properties. Wrapped rows are handled by the same numbers: a control on
 * a second line has an x offset like any other, and the band lights it on the
 * way past.
 */
export function useShimmerRow(ref: RefObject<HTMLElement>) {
    useEffect(() => {
        const row = ref.current;
        if (!row) return;

        const measure = () => {
            const bounds = row.getBoundingClientRect();
            row.style.setProperty("--shimmer-row", `${Math.round(bounds.width)}px`);
            for (const child of row.children) {
                const control = child as HTMLElement;
                const offset = control.getBoundingClientRect().left - bounds.left;
                control.style.setProperty("--shimmer-o", `${Math.round(offset)}px`);
            }
        };

        // Every control as well as the row. A label that reflows when the font
        // lands moves its neighbours without necessarily changing the row's own
        // box, and stale offsets show up as a band that jumps at a gap.
        const observer = new ResizeObserver(measure);
        observer.observe(row);
        for (const child of row.children) observer.observe(child);
        measure();

        return () => observer.disconnect();
    }, [ref]);
}

export default useShimmer;
