// Navbar
const gradient = document.getElementById('navbar-background')
const selector = document.getElementById('navbar-selector')
const about = document.getElementById('about')
const explore = document.getElementById('projects')

function selectAbout() {
	selector.style.left = '2px';
    about.style.left = '0';
    explore.style.left = '100%';
    gradient.style.opacity = '0';
}

function selectProjects() {
    selector.style.left = '92px';
    about.style.left = '-100%';
    explore.style.left = '0';
    gradient.style.opacity = '1';
}


// About
const isOverflown = ({ clientHeight, scrollHeight }) => scrollHeight > clientHeight

const resizeInternalText = ({ element, minFontSize = 10, unit = 'px' }) => {
    const childSizes = []
    const children = element.children
    for (const child of children) {
        let style = window.getComputedStyle(child, null).getPropertyValue('font-size');
        let fontSize = parseFloat(style); 
        childSizes.push(fontSize)
    }

    let overflow = isOverflown(element)
    let sizePercent = 100
    let hitMin = false
    while (overflow && !hitMin) { // while overflowing
        let childInd = 0
        while (childInd < children.length && sizePercent > 0) { // for every child
            let size = (sizePercent * 0.01) * childSizes[childInd]
            children[childInd].style.fontSize = `${ size }${unit}`
            if (size <= minFontSize) hitMin = true
            childInd += 1
        }
        sizePercent -= 1
        overflow = isOverflown(element)
    }
}

window.onload = function() {
    if (screen.availWidth > 600) {
        resizeInternalText({element: document.getElementById('about-summary')})
        pSize = window.getComputedStyle(document.getElementById('about-resize'), null).getPropertyValue('font-size');
        document.querySelectorAll('.resizable').forEach(e => e.style.fontSize = pSize);
    }
};




// Timeline
const timeline = document.getElementById("timeline-scroller");

if (screen.availWidth > 600) {
    document.getElementById('timeline-scroller').addEventListener("wheel", function (e) {
        // console.log(e.target.classList)
        e.preventDefault();
        if (e.deltaY > 0) {
            timeline.scrollLeft += 300;
        } else {
            timeline.scrollLeft -= 300;
        }
    });
}