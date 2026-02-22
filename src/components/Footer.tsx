import "./Footer.css";
import "./About.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faFileLines } from "@fortawesome/free-solid-svg-icons";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";

const Footer = () => (
  <footer className="footer">
    <div className="footer-content">
        <p className="footer-thanks">👋 Thanks for stopping by, let's chat!</p>
        <div className="about-social">
            {/* I would make this a list but fontawesome global additions are not working as of 6.4.2 */}
            <a
                href="mailto:wg.jovian@gmail.com?subject=Lets connect!"
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
                href="/JovianWang_Resume_2026.pdf"
                className="about-social-icons--link about-social-icons-text"
                target="_blank"
            >
                <h4>Download CV</h4>
                <FontAwesomeIcon icon={faFileLines}></FontAwesomeIcon>
            </a>
        </div>
        <small className="footer-copyright">&copy; {new Date().getFullYear()} Jovian Wang. All rights reserved.</small>
    </div>
  </footer>
);

export default Footer;
