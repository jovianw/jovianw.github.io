import content from "../assets/content.json";
import "./About.css";
import AboutName from "./AboutName";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function About() {
  return (
    <div id="about" className="scroll-snappable">
      <div id="about-hero">
        <img src="/graduation_3.png" alt="Jovian Wang" id="about-img" />
        <AboutName />
        <div id="about-summary" className="resizable">
          <h2>{content.headline}</h2>
          <p>{content.about}</p>
          <p className="selectable">{content.email}</p>
          <div className="about-social">
            {content.socials.map((social) => (
              <a
                href={social.link}
                key={social.link}
                className="about-social-icons--link"
                target="_blank"
              >
                <i className={social.icon}></i>
              </a>
            ))}
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
