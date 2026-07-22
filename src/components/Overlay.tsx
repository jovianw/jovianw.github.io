import { m } from "motion/react";
import "./Overlay.css";

interface Props {
    label?: string;
}

function Overlay({ label }: Props) {
    return (
        <m.div
            id="overlay"
            role="status"
            aria-live="polite"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        >
            {label}
        </m.div>
    );
}

export default Overlay;
