import About from "./components/About";
import { useEffect } from "react";

function App() {
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

    let overflow = isOverflown(element);
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
      console.log("Resizing", elements[i]);
      resizeInternalText({ element: elements[i] });
    }
  });

  return (
    <>
      <About />
    </>
  );
}

export default App;
