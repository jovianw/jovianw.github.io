import About from "./components/About";
import "./App.css";
import { useLayoutEffect, useState, useEffect } from "react";
import Timeline from "./components/Timeline";
import Overlay from "./components/Overlay";
import TabTitle from "./components/TabTitle";

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

function App() {
  // Update on window change
  const [width, height] = useWindowSize();
  width;
  height;

  const [aboutReady, setAboutReady] = useState(false);
  const [timelineReady, setTimelineReady] = useState(false);

  if (aboutReady && timelineReady) {
    console.log("ready!");
  }

  const isOverflown = ({
    clientHeight,
    scrollHeight,
  }: {
    clientHeight: number;
    scrollHeight: number;
  }) => scrollHeight > clientHeight;

  const resizeInternalText = ({
    element,
    minFontSize = 8,
    unit = "px",
  }: {
    element: Element;
    minFontSize?: number;
    unit?: string;
  }) => {
    const childSizes = [];
    const children = element.children as HTMLCollectionOf<HTMLElement>;
    for (const child of children) {
      let style = window
        .getComputedStyle(child, null)
        .getPropertyValue("font-size");
      let fontSize = parseFloat(style);
      childSizes.push(fontSize);
    }
    let overflow = isOverflown({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    });
    let sizePercent = 100;
    let hitMin = false;
    while (overflow && !hitMin) {
      // while overflowing
      let childInd = 0;
      while (childInd < children.length && sizePercent > 0) {
        // for every child
        let size = sizePercent * 0.01 * childSizes[childInd];
        children[childInd].style.fontSize = `${size}${unit}`;
        if (size <= minFontSize) hitMin = true;
        childInd += 1;
      }
      sizePercent -= 1;
      overflow = isOverflown(element);
    }
  };

  useEffect(() => {
    const elements = document.getElementsByClassName("resizable");
    for (let i = 0; i < elements.length; i++) {
      resizeInternalText({ element: elements[i] });
    }
  });

  return (
    <>
      <TabTitle></TabTitle>
      {(!aboutReady || !timelineReady) && <Overlay label="Loading..." />}
      <About
        handleOnReady={() => {
          setAboutReady(true);
        }}
      />
      <Timeline
        handleOnReady={() => {
          setTimelineReady(true);
        }}
      />
      <p className="bottom-text">Copyright © 2023 Jovian Wang</p>
    </>
  );
}

export default App;
