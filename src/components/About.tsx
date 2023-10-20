import content from "../assets/content.json";
import "./About.css";
import AboutName from "./AboutName";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons/faGithub";

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
        />
        <AboutName />
        <div id="about-summary" className="resizable">
          <h2>{content.headline}</h2>
          <p>{content.about}</p>
          <p className="selectable">{content.email}</p>
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
              href="https://github.com/jovianw"
              className="about-social-icons--link"
              target="_blank"
            >
              <FontAwesomeIcon icon={faGithub}></FontAwesomeIcon>
            </a>
            <a
              href="/JovianWang_Resume_2023_Fall.pdf"
              className="about-social-icons--link"
              target="_blank"
            >
              <p>resume</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
