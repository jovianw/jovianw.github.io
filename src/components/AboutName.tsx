import { useLayoutEffect, useState, useEffect } from "react";
import "./AboutName.css";

function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return size;
}

function AboutName() {
  const [width, height] = useWindowSize();
  const [reveal, setReveal] = useState(false);

  const resizeName = ({ element }: { element: Element | null }) => {
    if (element) {
      let text = element.firstElementChild as HTMLElement;
      let fontSize = 300;
      if (text) {
        text.style.fontSize = `${fontSize}px`;
        while (element.clientHeight >= fontSize && fontSize > 0) {
          fontSize -= 1;
          text.style.fontSize = `${fontSize}px`;
        }
      }
    }
  };

  const resizeNameMobile = ({ element }: { element: Element | null }) => {
    if (element) {
      let text = element.firstElementChild as HTMLElement;
      let fontSize = 300;
      if (text) {
        text.style.fontSize = `${fontSize}px`;
        while (element.scrollWidth > element.clientWidth && fontSize > 0) {
          fontSize -= 1;
          text.style.fontSize = `${fontSize}px`;
        }
      }
    }
  };

  useEffect(() => {
    // Trigger reveal animation on mount
    setReveal(true);
  }, []);

  useEffect(() => {
    if (width / height > 46 / 39) {
      resizeName({ element: document.getElementById("about-name") });
    } else {
      const mobileNames = document.getElementsByClassName("about-name-mobile");
      for (let i = 0; i < mobileNames.length; i++) {
        resizeNameMobile({ element: mobileNames[i] });
      }
    }
  });

  return (
    <div id="about-name-container">
      {width / height > 46 / 39 ? (
        <div id="about-name" className={reveal ? "reveal-vertical" : ""}>
          <h1>JOVIAN WANG</h1>
        </div>
      ) : (
        <div id="about-name-mobile-container">
          <div className="about-name-mobile">
            <h1>JOVIAN</h1>
          </div>
          <div className="about-name-mobile">
            <h1>WANG</h1>
          </div>
        </div>
      )}
    </div>
  );
}

export default AboutName;
