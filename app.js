// Navbar
const selector = document.getElementById('navbar-selector')
const about = document.getElementById('about')
const explore = document.getElementById('explore')

function selectAbout() {
	selector.style.left = '0';
    about.style.left = '0';
    explore.style.left = '100%';
    // about.style.display = 'block';
    // explore.style.display = 'none';
}

function selectExplore() {
    selector.style.left = '90px';
    about.style.left = '-100%';
    explore.style.left = '0';
    // explore.style.display = 'block';
    // about.style.display = 'none';
}


// Timeline
const timeline = document.getElementById("timeline-scroller");

document.getElementById('timeline-scroller').addEventListener("wheel", function (e) {
    console.log(e.target.classList)
    e.preventDefault();
    if (e.deltaY > 0) {
        timeline.scrollLeft += 300;
    } else {
        timeline.scrollLeft -= 300;
    }
});






const menu = document.querySelector('#mobile-menu');
const menuLinks = document.querySelector('.navbar__menu');
const faders = document.querySelectorAll('.timeline__text');
const header = document.querySelector('.navbar');
const sectionOne = document.querySelector('.main');

menu.addEventListener('click', function() {
    menu.classList.toggle('is-active');
    menuLinks.classList.toggle('active');
});

const appearOptions = {
    threshold: 1,
    rootMargin: "0px 0px -50px 0px"
};

const appearOnScroll = new IntersectionObserver(function(entries, appearOnScroll) {
    entries.forEach(entry => {
        if (!entry.isIntersecting) {
            return;
        } else {
            entry.target.classList.add("appear");
            appearOnScroll.unobserve(entry.target);
        }
    });
}, 
appearOptions);

faders.forEach(fader => {
    appearOnScroll.observe(fader);
});

const sectionOneOptions = {
    rootMargin: "-200px 0px 0px 0px"
};

const sectionOneObserver = new IntersectionObserver(function(entries, sectionOneObserver) {
    entries.forEach(entry => {
        if (!entry.isIntersecting) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    })
}, sectionOneOptions);

sectionOneObserver.observe(sectionOne);