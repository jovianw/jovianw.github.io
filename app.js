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

const resizeInternalText = ({ element, minFontSize = 8, unit = 'px' }) => {
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

const resizeName = ({element}) => {
    let text = element.firstElementChild;
    let fontSize = 300; 
    text.style.fontSize = `${ fontSize }px`;
    while (element.clientHeight > fontSize) {
        fontSize -= 1
        text.style.fontSize = `${ fontSize }px`;
    }
    console.log(element.clientHeight)
    console.log(fontSize)
}

const resizeNameMobile = ({element}) => {
    let text = element.firstElementChild;
    let fontSize = 300; 
    text.style.fontSize = `${ fontSize }px`;
    while (element.scrollWidth > element.clientWidth) {
        fontSize -= 1
        text.style.fontSize = `${ fontSize }px`;
    }
}

window.onload = resizeWindow;
window.onresize = resizeWindow;

function resizeWindow() {
    if (window.innerWidth / window.innerHeight > 46 / 39) {
        resizeName({element: document.getElementById('about-name')});
    } else {
        const mobileNames = document.getElementsByClassName('about-name-mobile');
        for (let i = 0; i < mobileNames.length; i++) {
            resizeNameMobile({element: mobileNames[i]});
        }
    }
    resizeInternalText({element: document.getElementById('about-summary')});
    const timelineNames = document.getElementsByClassName('timeline-text');
    for (let i = 0; i < timelineNames.length; i++) {
        resizeInternalText({element: timelineNames[i]});
    }
}

// window.onscroll = function() {
//     console.log(window.scrollY)
// }


// // Timeline
// const timeline = document.getElementById("timeline-scroller");

// if (screen.availWidth > 600) {
//     document.getElementById('timeline-scroller').addEventListener("wheel", function (e) {
//         // console.log(e.target.classList)
//         e.preventDefault();
//         if (e.deltaY > 0) {
//             timeline.scrollLeft += 300;
//         } else {
//             timeline.scrollLeft -= 300;
//         }
//     });
// }