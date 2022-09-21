const canvas = document.querySelector('canvas');
const main = document.querySelector('.main');
canvas.width = main.clientWidth;
canvas.height = main.clientHeight;
var ctx = canvas.getContext('2d');
const snowboarder = document.getElementById('snowboarder');
const snowboarder_container = document.getElementById('snowboarder_container');
var onGround = true;


function h(y) {
    // y is percentage of main height, returns pixels
    return (y / 100) * main.clientHeight;
}

function w(x) {
    // x is percentage of main width, returns pixels
    return (x / 100) * main.clientWidth;
}

function drawHill(offx, offy, cprandx1, cprandx2, distance, altitude) {
    // Draws hill at position offx, offy
    ctx.beginPath();
    ctx.moveTo(offx, offy);
    ctx.bezierCurveTo(
        offx + (cprandx1 * 0.3 * distance) + (0.3 * distance), 
        offy, 
        offx + (0.7 * distance) - (cprandx2 * 0.3 * distance), 
        offy + altitude, 
        offx + distance, 
        offy + altitude);
    ctx.lineTo(offx + distance, offy + altitude + h(200));
    ctx.lineTo(offx, offy + altitude + h(200));
    ctx.fillStyle = 'white';
    ctx.fill();
}

function rotateSnowboarder() {
    if (onGround) {
        x1 = w(50) - 50;
        y1 = h(50);
        x2 = w(50) + 50;
        y2 = h(50);
        // Adjust y1 and y2 until border of white slope
        var pix = ctx.getImageData(x1, y1, 1, 1).data;
        if (pix[0] == 255 && pix[1] == 255 && pix[2] == 255) {
            for (let attempts = 0; attempts < 100 && (pix[0] == 255 && pix[1] == 255 && pix[2] == 255); attempts++) {
                y1 -= 1;
                pix = ctx.getImageData(x1, y1, 1, 1).data;
            }
        } else {
            for (let attempts = 0; attempts < 100 && (pix[0] != 255 || pix[1] != 255 || pix[2] != 255); attempts++) {
                y1 += 1;
                pix = ctx.getImageData(x1, y1, 1, 1).data;
            }
        }
        pix = ctx.getImageData(x2, y2, 1, 1).data;
        if (pix[0] == 255 && pix[1] == 255 && pix[2] == 255) {
            for (let attempts = 0; attempts < 100 && (pix[0] == 255 && pix[1] == 255 && pix[2] == 255); attempts++) {
                y2 -= 1;
                pix = ctx.getImageData(x2, y2, 1, 1).data;
            }
        } else {
            for (let attempts = 0; attempts < 100 && (pix[0] != 255 || pix[1] != 255 || pix[2] != 255); attempts++) {
                y2 += 1;
                pix = ctx.getImageData(x2, y2, 1, 1).data;
            }
        }

        slope = (y2 - y1) / (x2 - x1);
        snowboarder_container.style.transform = "translate(-50px, -43px) rotate(" + Math.atan(slope) + "rad) translateY(-50px)";
    }
}


// ANIMATION DRIVER
smallestDim = Math.min(main.clientWidth, main.clientHeight);
dx = (2 * smallestDim) * (1/3); // How much travelled in one second
dy = 0.5 * dx * 0.8;
cprandx = [Math.random(), Math.random(), Math.random()];
distances = [(2 * smallestDim) + (Math.random() * (4 * smallestDim)), (2 * smallestDim) + (Math.random() * (4 * smallestDim))];
altitudes = [smallestDim + (Math.random() * smallestDim), smallestDim + (Math.random() * smallestDim)];
offx = -(distances[0] * 0.5);
offy = -h(60);
var prevTime;
function animateHill(now) {
    requestAnimationFrame(animateHill);
    // Figure out timing
    delta = (now - prevTime) / 1000;
    prevTime = now;
    if (isNaN(delta)) {
        return; // skip very first delta to prevent jumping
    }

    // Clear canvas
    ctx.clearRect(0, 0, w(100), h(100));
    // Move offsets
    offx -= dx * delta;
    offy -= dy * delta;
    // Make new hill and reset offsets when offx is past screen
    if (offx + distances[0] <= 0) {
        offx += distances[0];
        offy += altitudes[0];
        cprandx.shift();
        cprandx.push(Math.random());
        distances.shift();
        distances.push((2 * smallestDim) + (Math.random() * (2 * smallestDim)));
        altitudes.shift();
        altitudes.push(smallestDim + (Math.random() * smallestDim));
    }

    drawHill(offx, offy, cprandx[0], cprandx[1], distances[0], altitudes[0]);
    drawHill(offx + distances[0], offy + altitudes[0], cprandx[1], cprandx[2], distances[1], altitudes[1]);
    var pix = ctx.getImageData(w(50), h(50), 1, 1).data;
    attempts = 0; // could be a for loop but whatever and also hella jank
    if (pix[0] == 255 && pix[1] == 255 && pix[2] == 255) {
        while(pix[0] == 255 && pix[1] == 255 && pix[2] == 255 && attempts < 100) {
            ctx.clearRect(0, 0, w(100), h(100));
            offy += 1;
            drawHill(offx, offy, cprandx[0], cprandx[1], distances[0], altitudes[0]);
            drawHill(offx + distances[0], offy + altitudes[0], cprandx[1], cprandx[2], distances[1], altitudes[1]);
            var pix = ctx.getImageData(w(50), h(50), 1, 1).data;
            attempts += 1;
        };
    } else {
        while(pix[0] != 255 && attempts < 100) {
            ctx.clearRect(0, 0, w(100), h(100));
            offy -= 1;
            drawHill(offx, offy, cprandx[0], cprandx[1], distances[0], altitudes[0]);
            drawHill(offx + distances[0], offy + altitudes[0], cprandx[1], cprandx[2], distances[1], altitudes[1]);
            var pix = ctx.getImageData(w(50), h(50), 1, 1).data;
            attempts += 1;
        };
    }
    
    rotateSnowboarder();
}

requestAnimationFrame(animateHill);

function jump() {
    if (snowboarder_container.classList != "jump") {
        onGround = false;
        snowboarder_container.classList.add("jump");

        setTimeout(function() {
            snowboarder_container.classList.remove("jump");
            onGround = true;
        }, 2000);
    }
}

document.addEventListener("keydown", function(event) {
    jump();
});