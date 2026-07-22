import { useEffect, useRef, useState, type RefObject } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import content from "../assets/content.json";
import BlurFade from "./BlurFade";
import "./Timeline.css";
import "./Button.css";

interface TimelineCard {
  image: string;
  title: string;
  year: string;
  description: string;
  link?: { text: string; url: string };
  chips?: { label: string; color: string }[];
}

const cards = content.cards as TimelineCard[];

/**
 * Chips are opaque pills, so their contrast is self-contained and does not
 * depend on the card image behind them. Mixing the brand hue toward near-black
 * for the label and toward white for the fill clears AA on all ten palette
 * colours. A raw hue on a tint of itself caps contrast far too low.
 */
const chipStyle = (color: string) => ({
  background: `color-mix(in oklab, ${color} 12%, white)`,
  color: `color-mix(in oklab, ${color} 65%, #101418)`,
  borderColor: `color-mix(in oklab, ${color} 24%, white)`,
});

/**
 * Scales a card's text down until it fits its box.
 *
 * A single font-size goes on the container and every child is sized in `em`, so
 * one value scales the whole block. Sizing children individually does not work:
 * a class-level font-size on any of them beats the inherited inline value, and
 * the algorithm then crushes everything else to compensate.
 *
 * It converges because text height is very close to inversely proportional to
 * font-size, so sqrt(available / needed) lands within a few percent in one step
 * and the loop refines from there. The ResizeObserver watches the *card*, whose
 * size does not depend on the font-size being set, so there is no feedback loop.
 */
function useFitText(cardRef: RefObject<HTMLElement>, textRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const card = cardRef.current;
    const text = textRef.current;
    if (!card || !text) return;

    let cancelled = false;
    let raf = 0;
    let passes = 0;
    // Guards against two refinement chains running at once. `fit` can be
    // re-entered by the ResizeObserver or a font load mid-flight, and without
    // this the older chain's queued frame lands after the newer one has reset
    // the size and puts a stale, larger value back.
    let generation = 0;

    const MIN_PX = 11;

    /**
     * One refinement per animation frame, never a synchronous loop. Writing
     * `font-size` and reading `scrollHeight` back in the same task does not
     * reliably reflect the write, and a loop built that way can spin without
     * the text ever shrinking. Stepping across frames guarantees layout has
     * flushed between the two.
     */
    /**
     * Only the absolutely positioned layout is constrained. In the stacked
     * touch layout `.timeline-text` is in normal flow and the card grows to fit
     * it, so nothing is clipped and there is nothing to fit — and scaling the
     * text there would change the card's height, refire the ResizeObserver and
     * oscillate.
     */
    const isConstrained = () => getComputedStyle(text).position === "absolute";

    const step = (gen: number) => {
      if (cancelled || gen !== generation) return;
      if (!isConstrained()) return;
      const needed = text.scrollHeight;
      // Aim a few pixels under the real limit. Chip pills re-wrap as the size
      // changes, so height is not perfectly monotonic in font-size and an exact
      // target can stop a hair over. The margin absorbs that.
      const available = text.clientHeight - 10;
      if (available <= 0 || needed <= available || passes >= 24) return;

      const current = parseFloat(getComputedStyle(text).fontSize);
      if (!current) return;

      // Text height is close to inversely proportional to font-size, so this
      // lands within a few percent in one step. The extra 0.5% keeps each pass
      // strictly monotonic: line-height rounding means the estimate alone can
      // stall a fraction of a pixel short and burn the pass budget.
      const next = Math.max(MIN_PX, current * Math.sqrt(available / needed) * 0.995);
      if (next >= current - 0.01) return; // converged, or at the floor

      text.style.fontSize = `${next}px`;
      passes += 1;
      raf = requestAnimationFrame(() => step(gen));
    };

    const fit = () => {
      if (cancelled) return;
      cancelAnimationFrame(raf);
      generation += 1;
      const gen = generation;
      text.style.fontSize = "";
      if (!isConstrained()) return;
      passes = 0;
      raf = requestAnimationFrame(() => step(gen));
    };

    // Only refit when the card's box actually changes. FontAwesome injects a
    // stylesheet per icon, and an unconditional refit would restart the chain
    // from the base size each time, never leaving it enough consecutive frames
    // to converge.
    let lastHeight = 0;
    let lastWidth = 0;
    const observer = new ResizeObserver(() => {
      const { width, height } = card.getBoundingClientRect();
      if (Math.abs(height - lastHeight) < 1 && Math.abs(width - lastWidth) < 1) return;
      lastHeight = height;
      lastWidth = width;
      fit();
    });
    observer.observe(card);

    // `document.fonts.ready` is not sufficient on its own: a face is only
    // fetched when something first needs it, so `ready` can resolve before
    // Inter has been requested. The fitter would then measure the narrower
    // fallback, conclude the text fits and never run again. `loadingdone` fires
    // on every completed batch, which does catch the swap.
    document.fonts.ready.then(fit);
    document.fonts.addEventListener("loadingdone", fit, { once: true });

    fit();

    return () => {
      cancelled = true;
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", fit);
      cancelAnimationFrame(raf);
    };
  }, [cardRef, textRef]);
}

/**
 * The column count, used to reveal cards a row at a time. A flat per-index
 * stagger across 21 cards puts the last one over a second late, which reads as
 * lag rather than choreography.
 */
function useColumnCount(ref: RefObject<HTMLElement>) {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const read = () => {
      const template = getComputedStyle(el).gridTemplateColumns;
      // Before layout settles this reads "none", whose split length is 1.
      // Finite either way, so the delay maths can never produce NaN and
      // silently kill the animation.
      const count =
        template && template !== "none" ? template.split(" ").length : 1;
      setColumns(Math.max(1, count));
    };

    const observer = new ResizeObserver(read);
    observer.observe(el);
    read();
    return () => observer.disconnect();
  }, [ref]);

  return columns;
}

function Card({ card, index }: { card: TimelineCard; index: number }) {
  const cardRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  useFitText(cardRef, textRef);

  return (
    <article
      className="timeline-card"
      ref={cardRef}
      // Cards with a CTA already have a focusable descendant, so :focus-within
      // fires and the card opens for keyboard users just as it does on hover.
      // The ones without a link need this to be reachable at all.
      tabIndex={card.link ? undefined : 0}
      aria-labelledby={`card-${index}-title`}
    >
      <div className="timeline-media">
        <img
          src={`/card_images/${card.image}`}
          // Decorative: the <h3> below already names the card, and repeating
          // it here makes screen readers announce every project title twice.
          alt=""
          className="timeline-image"
          loading="lazy"
          decoding="async"
          width={800}
          height={600}
        />
      </div>
      <div className="timeline-veil" />

      <div className="timeline-text" ref={textRef}>
        <h3 className="timeline-title" id={`card-${index}-title`}>
          {card.title}
        </h3>
        <p className="timeline-year">{card.year}</p>

        {card.chips && card.chips.length > 0 && (
          <ul className="timeline-chips">
            {card.chips.map((chip) => (
              <li
                key={chip.label}
                className="timeline-chip"
                style={chipStyle(chip.color)}
              >
                {chip.label}
              </li>
            ))}
          </ul>
        )}

        <p className="timeline-desc">
          {card.description.split("<br/>").join("\n")}
        </p>

        {card.link !== undefined && (
          // An anchor, not a form with a submit button: an HTML GET
          // submission replaces the action URL's query string with the
          // serialised form data, silently stripping any query params.
          <a
            className="btn btn--invert btn--sm timeline-cta"
            href={card.link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{card.link.text}</span>
            <FontAwesomeIcon icon={faArrowRight} transform={{ rotate: -45 }} />
          </a>
        )}
      </div>
    </article>
  );
}

function Timeline() {
  const gridRef = useRef<HTMLDivElement>(null);
  const columns = useColumnCount(gridRef);

  return (
    <section id="timeline-section" aria-labelledby="timeline-heading">
      <h2 id="timeline-heading" className="visually-hidden">
        Selected work
      </h2>

      <div id="timeline" ref={gridRef}>
        {cards.map((card, index) => (
          <BlurFade
            key={card.title}
            className="timeline-cell"
            inView
            offset={28}
            blur="7px"
            duration={0.6}
            delay={(index % columns) * 0.08}
          >
            <Card card={card} index={index} />
          </BlurFade>
        ))}
      </div>
    </section>
  );
}

export default Timeline;
