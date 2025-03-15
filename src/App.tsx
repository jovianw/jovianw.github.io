import About from "./components/About"
import "./App.css"
import { useLayoutEffect, useState, useEffect } from "react"
import Timeline from "./components/Timeline"
import Overlay from "./components/Overlay"
import TabTitle from "./components/TabTitle"

/**
 * Custom hook that returns the current window size.
 *
 * This hook sets up an event listener for the window resize event and updates
 * the size state with the current window width and height whenever the window
 * is resized.
 *
 * @returns {[number, number]} An array containing the current window width and height.
 */
function useWindowSize() {
    const [size, setSize] = useState([0, 0])
    useLayoutEffect(() => {
        function updateSize() {
            setSize([window.innerWidth, window.innerHeight])
        }
        window.addEventListener("resize", updateSize)
        updateSize()
        return () => window.removeEventListener("resize", updateSize)
    }, [])
    return size
}

function App() {
    // Update on window change
    const [width, height] = useWindowSize()
    width
    height

    const [aboutReady, setAboutReady] = useState(false)
    const [timelineReady, setTimelineReady] = useState(false)

    if (aboutReady && timelineReady) {
        console.log("ready!")
    }

    /**
     * Checks if an element is overflown vertically.
     *
     * @param {number} clientHeight - The visible height of the element.
     * @param {number} scrollHeight - The total height of the element, including the part not visible.
     * @returns {boolean} - Returns `true` if the element is overflown vertically, otherwise `false`.
     */
    const isOverflown = ({
        clientHeight,
        scrollHeight,
    }: {
        clientHeight: number
        scrollHeight: number
    }) => scrollHeight > clientHeight

    /**
     * Adjusts the font size of the child elements of a given element to fit within its bounds.
     * 
     * @param {Element} element - The parent element containing the child elements to resize.
     * @param {number} [minFontSize=8] - The minimum font size to which the child elements can be resized.
     * @param {string} [unit="px"] - The unit of measurement for the font size.
     * 
     * @returns {void}
     */
    const resizeInternalText = ({
        element,
        minFontSize = 8,
        unit = "px",
    }: {
        element: Element
        minFontSize?: number
        unit?: string
    }) => {
        const childSizes = []
        const children = element.children as HTMLCollectionOf<HTMLElement>
        for (const child of children) {
            let style = window
                .getComputedStyle(child, null)
                .getPropertyValue("font-size")
            let fontSize = parseFloat(style)
            childSizes.push(fontSize)
        }
        let overflow = isOverflown({
            clientHeight: element.clientHeight,
            scrollHeight: element.scrollHeight,
        })
        let sizePercent = 100
        let hitMin = false
        while (overflow && !hitMin) {
            console.log("Resizing", sizePercent)
            // while overflowing
            let childInd = 0
            while (childInd < children.length && sizePercent > 0) {
                // for every child
                let size = sizePercent * 0.01 * childSizes[childInd]
                children[childInd].style.fontSize = `${size}${unit}`
                if (size <= minFontSize) hitMin = true
                childInd += 1
            }
            sizePercent -= 1
            overflow = isOverflown(element)
        }
    }

    useEffect(() => {
        const elements = document.getElementsByClassName("resizable")
        for (let i = 0; i < elements.length; i++) {
            resizeInternalText({ element: elements[i] })
        }
    })

    // Update meta description
    /**
     * Asynchronously updates the meta description of the document.
     * 
     * Fetches content from a JSON file located at "/src/assets/content.json",
     * parses the JSON response, and updates the "content" attribute of the 
     * meta tag with the id "meta-description" to the value of the "about" 
     * property from the fetched content.
     * 
     * @returns {Promise<void>} A promise that resolves when the meta description is updated.
     */
    const updateMetaDescription = async () => {
        const response = await fetch("/src/assets/content.json");
        const content = await response.json();
        const metaDescription = document.getElementById("meta-description");
        if (metaDescription) {
            metaDescription.setAttribute("content", content.about);
        }
    };

    useEffect(() => {
        updateMetaDescription();
    }, []);

    return (
        <>
            <TabTitle></TabTitle>
            {(!aboutReady || !timelineReady) && <Overlay label="Loading..." />}
            <About
                handleOnReady={() => {
                    setAboutReady(true)
                }}
            />
            <Timeline
                handleOnReady={() => {
                    setTimelineReady(true)
                }}
            />
            <p className="bottom-text">Copyright © 2025 Jovian Wang</p>
        </>
    )
}

export default App
