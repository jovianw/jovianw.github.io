import { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faFileLines } from "@fortawesome/free-solid-svg-icons";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import BlurFade from "./BlurFade";
import GradientField from "./GradientField";
import "./Footer.css";
import "./Button.css";

const Footer = () => {
  const ref = useRef<HTMLElement>(null);

  return (
    <footer className="footer" ref={ref}>
      {/* The same aurora as the hero, so the page opens and closes on the
            same surface instead of dropping into a black slab. No parallax
            here: there is no depth relationship to establish this far down. */}
      <GradientField parallaxTarget={ref} />
      <BlurFade inView offset={10} className="footer-content">
        <p className="footer-thanks">
          Thanks for stopping by — let&rsquo;s chat.
        </p>

        <div className="about-actions footer-actions">
          <a
            className="btn"
            href="mailto:wg.jovian@gmail.com?subject=Lets connect!"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faEnvelope} />
            <span>Email me</span>
          </a>

          <a
            className="btn btn--icon"
            href="https://www.linkedin.com/in/jovianwang/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn profile"
          >
            <FontAwesomeIcon icon={faLinkedin} />
          </a>

          <a
            className="btn btn--cv"
            href="/JovianWang_Resume_2026.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Download CV</span>
            <FontAwesomeIcon icon={faFileLines} />
          </a>
        </div>

        <small className="footer-copyright">
          &copy; {new Date().getFullYear()} Jovian Wang
        </small>
      </BlurFade>
    </footer>
  );
};

export default Footer;
