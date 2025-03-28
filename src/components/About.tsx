import content from "../assets/content.json";
import "./About.css";
import AboutName from "./AboutName";
import CopyText from "./CopyText";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faFileLines } from "@fortawesome/free-solid-svg-icons";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";

interface Props {
    handleOnReady: () => void;
}

function About({ handleOnReady }: Props) {
    return (
        <div id="about" className="scroll-snappable">
            <div id="about-hero">
                <img
                    src="/graduation_3.png"
                    alt="Jovian Wang"
                    id="about-img"
                    onLoad={handleOnReady}
                    decoding="sync" // Attempt to fix safari loading issue
                />
                <AboutName />
                <div id="about-summary" className="resizable">
                    <h2>{content.headline}</h2>
                    <p>{content.about}</p>
                    <CopyText text={content.email} />
                    <div className="about-social">
                        {/* I would make this a list but fontawesome global additions are not working as of 6.4.2 */}
                        <a
                            href="mailto:jovian.l.wang@vanderbilt.edu?subject=Lets connect!"
                            className="about-social-icons--link"
                            target="_blank"
                        >
                            <FontAwesomeIcon icon={faEnvelope}></FontAwesomeIcon>
                        </a>
                        <a
                            href="https://www.linkedin.com/in/jovianwang/"
                            className="about-social-icons--link"
                            target="_blank"
                        >
                            <FontAwesomeIcon icon={faLinkedin}></FontAwesomeIcon>
                        </a>
                        <a
                            href="/JovianWang_Resume_2025.pdf"
                            className="about-social-icons--link about-social-icons-text"
                            target="_blank"
                        >
                            <h4>Download CV</h4>
                            <FontAwesomeIcon icon={faFileLines}></FontAwesomeIcon>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default About;
