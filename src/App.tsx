import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import About from "./components/About";
import Timeline from "./components/Timeline";
import Overlay from "./components/Overlay";
import Footer from "./components/Footer";
import "./App.css";

/** Hard ceiling on the loading overlay. Waiting for assets is a nicety; being
 *  stuck behind a blank screen because one image failed to load is not. */
const READY_FAILSAFE_MS = 2500;

function App() {
    const heroRef = useRef<HTMLElement>(null);
    const [ready, setReady] = useState(false);

    // Both gates must report, not whichever arrives first: the fitted wordmark
    // needs the font and the hero needs its portrait. fonts.ready usually wins
    // by about a second, so treating it as sufficient lifts the overlay onto an
    // empty portrait box. The timeline images gate nothing — they are
    // lazy-loaded and reveal on scroll, so a slow or missing card image cannot
    // hold the page back.
    const gates = useRef({ fonts: false, hero: false });
    const cancelled = useRef(false);

    const settle = (gate: "fonts" | "hero") => {
        gates.current[gate] = true;
        if (!cancelled.current && gates.current.fonts && gates.current.hero) setReady(true);
    };

    useEffect(() => {
        cancelled.current = false;
        document.fonts.ready.then(() => settle("fonts"));

        // Ceiling, not a gate: whatever is missing, the page is never stuck.
        const failsafe = window.setTimeout(() => {
            if (!cancelled.current) setReady(true);
        }, READY_FAILSAFE_MS);

        return () => {
            cancelled.current = true;
            window.clearTimeout(failsafe);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <AnimatePresence>
                {!ready && <Overlay key="overlay" label="Loading" />}
            </AnimatePresence>
            <main>
                <About heroRef={heroRef} start={ready} onReady={() => settle("hero")} />
                <Timeline />
            </main>
            <Footer />
        </>
    );
}

export default App;
