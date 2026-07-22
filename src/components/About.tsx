import { type RefObject } from "react";
import { m, useScroll, useTransform } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faFileLines } from "@fortawesome/free-solid-svg-icons";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import content from "../assets/content.json";
import AboutName from "./AboutName";
import GradientField from "./GradientField";
import BlurFade from "./BlurFade";
import CopyText from "./CopyText";
import "./About.css";
import "./Button.css";

interface Props {
    heroRef: RefObject<HTMLElement>;
    /** Flips true when the loading overlay starts leaving. Every delay below
     *  is measured from that moment, so the sequence plays in front of the
     *  viewer rather than behind the overlay. */
    start: boolean;
    onReady: () => void;
}

/** Entrance clock, in seconds, from the moment the overlay clears. Overlap is
 *  the point: nothing waits for its predecessor to finish. */
const T = {
    portrait: 0.05,
    name: 0.12,
    headline: 0.3,
    body: 0.38,
    email: 0.46,
    actions: 0.54,
};

function About({ heroRef, start, onReady }: Props) {
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"],
    });

    // The portrait sits between the wordmark and the gradient field, and the
    // differing rates are the effect: they convey a z-order the static
    // composition cannot. In pixels, so the rate is directly comparable with
    // the wordmark's — the portrait is behind it, so it moves less.
    const portraitY = useTransform(scrollYProgress, [0, 1], [0, -80]);

    const enter = (delay: number, duration = 0.7) =>
        ({ duration, delay, ease: [0.22, 1, 0.36, 1] as const });

    return (
        <section id="about" ref={heroRef}>
            <GradientField parallaxTarget={heroRef} start={start} />

            <div id="about-hero">
                {/* Three nested elements, each with exactly one concern. The
                    outer one is transformed every frame; the middle one carries
                    the drop-shadow. A drop-shadow on an element that is also
                    being transformed forces the image to re-rasterise every
                    frame in Safari and older Chromium. */}
                <m.div
                    id="about-img-parallax"
                    // Scale only, never opacity. The wordmark sits directly
                    // behind the portrait, so any value below 1 lets "WANG"
                    // read through his face.
                    style={{ y: portraitY }}
                    initial={{ scale: 1.03 }}
                    animate={start ? { scale: 1 } : undefined}
                    transition={enter(T.portrait)}
                >
                    <div id="about-img-depth">
                        <img
                            src="/graduation_3.webp"
                            alt="Jovian Wang"
                            id="about-img"
                            width={1400}
                            height={1546}
                            decoding="async"
                            onLoad={onReady}
                            onError={onReady}
                            // A memory-cache hit can complete before React
                            // attaches the load listener, in which case onLoad
                            // never fires and only the failsafe would clear the
                            // gate.
                            ref={(el) => {
                                if (el?.complete) onReady();
                            }}
                        />
                    </div>
                </m.div>

                <AboutName heroRef={heroRef} start={start} delay={T.name} />

                <div id="about-summary">
                    <BlurFade gate={start} delay={T.headline} duration={0.55} offset={14}>
                        <h2>{content.headline}</h2>
                    </BlurFade>

                    <BlurFade gate={start} delay={T.body} duration={0.55} offset={14}>
                        <p>{content.about}</p>
                    </BlurFade>

                    <BlurFade gate={start} delay={T.email} duration={0.5} offset={12}>
                        <CopyText text={content.email} />
                    </BlurFade>

                    <BlurFade gate={start} delay={T.actions} duration={0.5} offset={12}>
                        <div className="about-actions">
                            {/* Icon-only: the copy column is narrow enough
                                that a text label here wraps "Download CV" onto
                                a second row. The aria-label names it. */}
                            <a
                                className="btn btn--icon"
                                href="mailto:wg.jovian@gmail.com?subject=Lets connect!"
                                rel="noopener noreferrer"
                                aria-label="Email Jovian"
                            >
                                <FontAwesomeIcon icon={faEnvelope} />
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
                    </BlurFade>
                </div>
            </div>
        </section>
    );
}

export default About;
