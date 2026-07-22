import { useRef } from "react";
import { useInView } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faFileLines } from "@fortawesome/free-solid-svg-icons";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import BlurFade from "./BlurFade";
import GradientField from "./GradientField";
import ShimmerText from "./ShimmerText";
import useShimmer, { useShimmerRow } from "./useShimmer";
import "./Footer.css";
import "./Button.css";
import "./Shimmer.css";

/** Declared once because ShimmerText renders it twice. */
const THANKS = "Thanks for stopping by — let’s chat.";

const Footer = () => {
  const ref = useRef<HTMLElement>(null);

  // Fires the one time the visitor first reaches the end of the page — a sixth
  // of the viewport short of the footer's top edge, so the sign-off is properly
  // on screen rather than peeking. The lead is short: unlike the hero, which
  // has an entrance to stay out of the way of, this only has to let the
  // BlurFade get going, and any longer reads as the page being slow to notice
  // the visitor arrive.
  const atEnd = useInView(ref, { once: true, margin: "0px 0px -16% 0px" });
  const { className: shimmer } = useShimmer({ gate: atEnd, lead: 220 });

  const actionsRef = useRef<HTMLDivElement>(null);
  useShimmerRow(actionsRef);

  return (
    <footer className="footer" ref={ref}>
      {/* The same aurora as the hero, so the page opens and closes on the
            same surface instead of dropping into a black slab. No parallax
            here: there is no depth relationship to establish this far down. */}
      <GradientField parallaxTarget={ref} />
      <BlurFade inView offset={10} className={`footer-content ${shimmer}`.trim()}>
        <ShimmerText as="p" className="footer-thanks" text={THANKS} />

        <div className="about-actions footer-actions" ref={actionsRef}>
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
