import { useEffect, useRef, useState } from "react";
import "./AboutName.css";

function AboutName() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reveal, setReveal] = useState(false);
  const [isWide, setIsWide] = useState(
    () => window.innerWidth / window.innerHeight > 46 / 39
  );

  useEffect(() => setReveal(true), []);

  useEffect(() => {
    const mql = window.matchMedia("(min-aspect-ratio: 46/39)");
    const handler = (e: MediaQueryListEvent) => setIsWide(e.matches);
    mql.addEventListener("change", handler);
    setIsWide(mql.matches);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resize = () => {
      const containerWidth = container.clientWidth;
      const texts = container.querySelectorAll<HTMLElement>(".about-name-text");
      texts.forEach((text) => {
        const baseFontSize = 100;
        text.style.fontSize = `${baseFontSize}px`;
        const textWidth = text.getBoundingClientRect().width;
        text.style.fontSize = `${baseFontSize * (containerWidth / textWidth)}px`;
      });
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    document.fonts.ready.then(resize);
    return () => observer.disconnect();
  }, [isWide]);

  return (
    <div id="about-name-container" ref={containerRef}>
      <div id="about-name" className={reveal ? "reveal-vertical" : ""}>
        {isWide ? (
          <h1 className="about-name-text">JOVIAN WANG</h1>
        ) : (
          <>
            <h1 className="about-name-text">JOVIAN</h1>
            <h1 className="about-name-text">WANG</h1>
          </>
        )}
      </div>
    </div>
  );
}

export default AboutName;
