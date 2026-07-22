import React from "react";
import ReactDOM from "react-dom/client";
import { domAnimation, LazyMotion, MotionConfig } from "motion/react";
import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        {/* `domAnimation` is animation + gestures + exit — everything this
            site uses, with no layout projection or drag. Paired with the `m`
            components it costs roughly 25 kB gzip less than the full `motion`
            bundle. Loaded synchronously because the hero animates on first
            paint, where an async feature chunk would show a visible pop-in.
            `strict` throws if a `motion.*` component is used instead of `m.*`,
            which would silently pull the full bundle back in. */}
        <LazyMotion features={domAnimation} strict>
            {/* `"never"` keeps Motion from skipping transform animations
                when the OS reports reduced motion. On Windows that signal is
                just the "Animation effects" toggle, off on a great many
                machines. See the note in index.css for why this site keeps its
                motion small in absolute terms instead. */}
            <MotionConfig reducedMotion="never">
                <App />
            </MotionConfig>
        </LazyMotion>
    </React.StrictMode>
);
