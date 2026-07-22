import "./Shimmer.css";

interface Props {
    /** Rendered twice, so it has to be a plain string rather than markup. */
    text: string;
    className?: string;
    /**
     * Both call sites are block-level and that is a requirement, not a
     * coincidence: an inline box that wraps is fragmented, and the sheen's
     * containing block would then be the union of its fragments rather than
     * the text's own box.
     */
    as?: "span" | "p";
}

/**
 * Text with a highlight-carrying copy of itself laid over the top.
 *
 * The copy is hidden from assistive technology and paints nothing until a
 * `.shimmer-run` ancestor starts the sweep — see Shimmer.css for why the
 * highlight rides on a copy rather than on the text itself.
 */
function ShimmerText({ text, className, as: Tag = "span" }: Props) {
    return (
        <Tag className={className ? `shimmer-text ${className}` : "shimmer-text"}>
            {text}
            <span className="shimmer-text__sheen" aria-hidden="true">
                {text}
            </span>
        </Tag>
    );
}

export default ShimmerText;
