import "./CopyText.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";

interface Props {
    text: string;
}

function CopyText({ text }: Props) {
    return (
        <p
            className="copytext"
            onClick={() => {
                navigator.clipboard.writeText(text);
                alert("Text copied to clipboard!");
            }}
        >
            {text} <FontAwesomeIcon icon={faCopy} />
        </p>
    );
}

export default CopyText;