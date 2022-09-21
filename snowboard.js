const canvas = document.querySelector('canvas');
const main = document.querySelector('.main');
canvas.width = main.clientWidth;
canvas.height = main.clientHeight;
var ctx = canvas.getContext('2d');
const snowboarder = document.getElementById('snowboarder');
const snowboarder_container = document.getElementById('snowboarder_container');
var onGround = true;
var smallestDim = Math.min(main.clientWidth, main.clientHeight);
const snowColor = 'rgba(255,254,245,1)'; // assuming r is 255;


function h(y) {
    // y is percentage of main height, returns pixels
    return (y / 100) * main.clientHeight;
}

function w(x) {
    // x is percentage of main width, returns pixels
    return (x / 100) * main.clientWidth;
}

mtnpoints = [
    [
        [1/600, 0, 157, 213, 192, 226, 249, 219], // metadata i guess
        [0, h(60)],
        [w(35), h(60) - (0.3 * smallestDim)],
        [w(45), h(60) - (0.25 * smallestDim)],
        [w(60), h(60) - (0.4 * smallestDim)],
        [w(120), h(60)]
        ],
    [
        [1/350, 0, 74, 161, 128, 184, 218, 173], // metadata i guess
        [0, h(80)],
        [w(15), h(80) - (0.1 * smallestDim)],
        [w(25), h(80) - (0.05 * smallestDim)],
        [w(60), h(80) - (0.3 * smallestDim)],
        [w(75), h(80) - (0.2 * smallestDim)],
        [w(80), h(80) - (0.23 * smallestDim)],
        [w(120), h(80)]
        ]
    ]
function drawMountain(delta) {
    // Just gonna hardcode what mountains look like since they're not important anyway
    // Draws mountain at offx
    // Length of mountains must be screen size
    for (var j = 0; j < mtnpoints.length; j++) {
        mtnpoints[j][0][1] -= mtnpoints[j][0][0] * w(100) * delta;
        if (mtnpoints[j][0][1] < -w(100)) {
            mtnpoints[j][0][1] += w(100);
        }
        // Mountain 1
        ctx.beginPath();
        ctx.moveTo(mtnpoints[j][0][1] + mtnpoints[j][1][0], mtnpoints[j][1][1]);
        // First copy
        for (var i = 2; i < mtnpoints[j].length; i++) {
            ctx.lineTo(mtnpoints[j][0][1] + mtnpoints[j][i][0], mtnpoints[j][i][1]);
        }
        // Second copy
        for (var i = 1; i < mtnpoints[j].length; i++) {
            ctx.lineTo(mtnpoints[j][0][1] + w(100) + mtnpoints[j][i][0], mtnpoints[j][i][1]);
        }
        ctx.lineTo(w(100), h(100));
        ctx.lineTo(0, h(100));
        var grd = ctx.createLinearGradient(0, 0, 0, h(100));
        grd.addColorStop(0, "rgba(" + mtnpoints[j][0][2] + "," + mtnpoints[j][0][3] + "," + mtnpoints[j][0][4] + ",1)");
        grd.addColorStop(1, "rgba(" + mtnpoints[j][0][5] + "," + mtnpoints[j][0][6] + "," + mtnpoints[j][0][7] + ",1)");

        // Fill with gradient
        ctx.fillStyle = grd;
        ctx.fill();
    }
}

function drawHill(offx, offy, cprandx1, cprandx2, distance, altitude) {
    // Draws hill at position offx, offy
    ctx.beginPath();
    ctx.moveTo(offx - 1, offy);
    ctx.bezierCurveTo(
        offx + (cprandx1 * 0.3 * distance) + (0.3 * distance), 
        offy, 
        offx + (0.7 * distance) - (cprandx2 * 0.3 * distance), 
        offy + altitude, 
        offx + distance + 1, 
        offy + altitude);
    ctx.lineTo(offx + distance + 20, offy + altitude + h(200));
    ctx.lineTo(offx - 20, offy + altitude + h(200));
    ctx.fillStyle = snowColor;
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
        if (pix[0] == 255) {
            for (let attempts = 0; attempts < 100 && pix[0] == 255; attempts++) {
                y1 -= 1;
                pix = ctx.getImageData(x1, y1, 1, 1).data;
            }
        } else {
            for (let attempts = 0; attempts < 100 && pix[0] != 255; attempts++) {
                y1 += 1;
                pix = ctx.getImageData(x1, y1, 1, 1).data;
            }
        }
        pix = ctx.getImageData(x2, y2, 1, 1).data;
        if (pix[0] == 255) {
            for (let attempts = 0; attempts < 100 && pix[0] == 255; attempts++) {
                y2 -= 1;
                pix = ctx.getImageData(x2, y2, 1, 1).data;
            }
        } else {
            for (let attempts = 0; attempts < 100 && pix[0] != 255; attempts++) {
                y2 += 1;
                pix = ctx.getImageData(x2, y2, 1, 1).data;
            }
        }

        slope = (y2 - y1) / (x2 - x1);
        snowboarder_container.style.transform = "translate(-50px, -43px) rotate(" + Math.atan(slope) + "rad) translateY(-50px)";
        if (slope < 0.2) {
            snowboarder.src = "assets/standing1.png";
        } else if (slope >= 0.2 && slope < 0.8) {
            snowboarder.src = "assets/standing2.png";
        } else {
            snowboarder.src = "assets/standing3.png";
        }
    }
}


//// ANIMATION DRIVER
var prevTime;
// HILL
dx = (2 * smallestDim) * (0.4); // How much travelled in one second
dy = 0.5 * dx * 0.8;
cprandx = [Math.random(), Math.random(), Math.random()];
distances = [(2 * smallestDim) + (Math.random() * (4 * smallestDim)), (2 * smallestDim) + (Math.random() * (4 * smallestDim))];
altitudes = [smallestDim + (Math.random() * smallestDim), smallestDim + (Math.random() * smallestDim)];
offx = -(distances[0] * 0.5);
offy = -h(60);
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

    
    drawMountain(delta);
    drawHill(offx, offy, cprandx[0], cprandx[1], distances[0], altitudes[0]);
    drawHill(offx + distances[0], offy + altitudes[0], cprandx[1], cprandx[2], distances[1], altitudes[1]);
    var pix = ctx.getImageData(w(50), h(50), 1, 1).data;
    attempts = 0; // could be a for loop but whatever and also hella jank
    if (pix[0] == 255) {
        while(pix[0] == 255 && attempts < 100) {
            ctx.clearRect(0, 0, w(100), h(100));
            offy += 1;
            drawMountain(delta);
            drawHill(offx, offy, cprandx[0], cprandx[1], distances[0], altitudes[0]);
            drawHill(offx + distances[0], offy + altitudes[0], cprandx[1], cprandx[2], distances[1], altitudes[1]);
            var pix = ctx.getImageData(w(50), h(50), 1, 1).data;
            attempts += 1;
        };
    } else {
        while(pix[0] != 255 && attempts < 100) {
            ctx.clearRect(0, 0, w(100), h(100));
            offy -= 1;
            drawMountain(delta);
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
        snowboarder.src = "assets/jumping.gif";

        setTimeout(function() {
            snowboarder_container.classList.remove("jump");
            onGround = true;
            snowboarder.src = "assets/standing1.png";
        }, 1800);
    }
}

document.addEventListener("keydown", function(event) {
    jump();
});