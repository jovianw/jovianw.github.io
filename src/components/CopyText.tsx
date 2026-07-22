import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import "./CopyText.css";

interface Props {
    text: string;
}

type Status = "idle" | "copied" | "failed";

const RESET_MS = 1600;

const MESSAGE: Record<Status, string> = {
    idle: "",
    copied: "Email address copied to clipboard",
    failed: "Could not copy automatically. Select the address and press Control C.",
};

/**
 * The email address, as a real <button> so it is focusable and has a role and
 * an accessible name. The clipboard write is awaited and caught, and the result
 * is reported inline rather than through a blocking alert.
 */
function CopyText({ text }: Props) {
    const [status, setStatus] = useState<Status>("idle");
    // Bumped on every copy and used as the live region's key, so a second copy
    // within the reset window replaces the node rather than rewriting the same
    // string. Screen readers do not re-announce identical text.
    const [announceId, setAnnounceId] = useState(0);
    const timer = useRef<number>();

    useEffect(() => () => window.clearTimeout(timer.current), []);

    const copy = async () => {
        try {
            // The Clipboard API is undefined on insecure origins and rejects
            // when the document does not have focus.
            if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
            await navigator.clipboard.writeText(text);
            setStatus("copied");
        } catch {
            setStatus("failed");
        }
        setAnnounceId((n) => n + 1);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setStatus("idle"), RESET_MS);
    };

    return (
        <>
            <button type="button" className="copytext" onClick={copy}>
                <span className="copytext-value">{text}</span>
                <FontAwesomeIcon
                    icon={status === "copied" ? faCheck : faCopy}
                    className="copytext-icon"
                />
            </button>
            {/* A separate live region: never put aria-live on the control whose
                own accessible name is what changed. */}
            <span className="visually-hidden" aria-live="polite">
                <span key={announceId}>{MESSAGE[status]}</span>
            </span>
        </>
    );
}

export default CopyText;
