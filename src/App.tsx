import About from "./components/About"
import "./App.css"
import { useState, useEffect } from "react"
import Timeline from "./components/Timeline"
import Overlay from "./components/Overlay"
import Footer from "./components/Footer"

function App() {
    const [aboutReady, setAboutReady] = useState(false)
    const [timelineReady, setTimelineReady] = useState(false)

    if (aboutReady && timelineReady) {
        console.log("ready!")
    }

    useEffect(() => {
        const elements = document.querySelectorAll<HTMLElement>(".resizable")

        const resize = (element: HTMLElement) => {
            const children = element.children as HTMLCollectionOf<HTMLElement>

            for (const child of children) {
                child.style.fontSize = ""
            }

            if (element.scrollHeight <= element.clientHeight) return

            const scale = element.clientHeight / element.scrollHeight
            for (const child of children) {
                const original = parseFloat(getComputedStyle(child).fontSize)
                child.style.fontSize = `${Math.max(original * scale, 8)}px`
            }

            if (element.scrollHeight > element.clientHeight) {
                const scale2 = element.clientHeight / element.scrollHeight
                for (const child of children) {
                    const current = parseFloat(child.style.fontSize)
                    child.style.fontSize = `${Math.max(current * scale2, 8)}px`
                }
            }
        }

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                resize(entry.target as HTMLElement)
            }
        })

        elements.forEach((el) => observer.observe(el))
        document.fonts.ready.then(() => elements.forEach(resize))

        return () => observer.disconnect()
    }, [])

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
            {/* <TabTitle></TabTitle> */}
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
            {/* <p className="bottom-text">Copyright © 2025 Jovian Wang</p> */}
            <Footer />
        </>
    )
}

export default App
