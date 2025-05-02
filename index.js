const ball = document.querySelector(".ball");
const ballHeight = ball.clientHeight;
const ballWidth = ball.clientWidth;

const mouseThrowStrengthFactor = 0.05;
let ballDragging = false;
let ballDraggingOffsetX = 0;
let ballDraggingOffsetY = 0;
let lastMouseMovementX = 0;
let lastMouseMovementY = 0;
let lastTouch;

const windowHeight = window.innerHeight;
const windowWidth = window.innerWidth;

const weight = 2;
const dampingFloor = 0.7;
const frictionFloor = 0.9;
const dampingWall = 0.2;
const aGravity = 0.000981 * weight;

let vYLast = 0;
let posYLast = (3 * windowHeight / 4);

let vXLast = 0;
let posXLast = (windowWidth / 2) - (ballWidth / 2);
let aX = 0.0000;

let tLast = new Date().getTime();

const boundaryEl = document.querySelector(".boundary");
const boundaryEl2 = document.querySelector(".boundary-1");
const boundaries = [new Boundary(boundaryEl), new Boundary(boundaryEl2)];

const checkpoint1 = new Box(document.querySelector(".checkpoint"));
const checkpoint2 = new Box(document.querySelector(".checkpoint-1"));
let checkpoint1Touched = false;
let checkpointTimeDuration = 1000;
let checkpointTimeout;

let overallPoints = 0;
let bouncePoints = 0;

ball.style.top = posYLast + "px";
ball.style.left = posXLast + "px";

function Box(element) {
    const rects = element.getBoundingClientRect();
    this.x = rects.left;
    this.y = rects.top;
    this.width = element.clientWidth;
    this.height = element.clientHeight;
}

function Boundary(element) {
    const rects = element.getBoundingClientRect();
    this.x = rects.left;
    this.y = rects.top;
    this.width = element.clientWidth;
    this.height = element.clientHeight;
    this.damping = 0.8;
}

function touchesBox(box, posY, posX) {
    let touchX = false;
    let touchY = false;

    if (posX >= box.x && posX < box.x + box.width || posX + ballWidth >= box.x && posX + ballWidth < box.x + box.width)
        touchX = true;
    if (posY >= box.y && posY < box.y + box.height || posY + ballHeight >= box.y && posY + ballHeight < box.y + box.height)
        touchY = true;

    return touchX && touchY;
}

function dragBall(e) {
    if (ballDragging) {
        posXLast = (e.touches ? e.touches[0].clientX : e.clientX) - ballDraggingOffsetX;
        posYLast = (e.touches ? e.touches[0].clientY : e.clientY) - ballDraggingOffsetY;
        ball.style.left = posXLast + "px";
        ball.style.top = posYLast + "px";

        if (!e.movementX && !e.movementY && e.touches && lastTouch) {
            e.movementX = e.touches[0].pageX - lastTouch.pageX;
            e.movementY = e.touches[0].pageY - lastTouch.pageY;
        }

        lastMouseMovementX = e.movementX;
        lastMouseMovementY = e.movementY;
        if (e.touches) lastTouch = e.touches[0];
    }
}

function startDraggingBall(e) {
    e.preventDefault()
    bouncePoints = 0;
    ballDragging = true;
    ballDraggingOffsetX = (e.touches ? e.touches[0].clientX : e.clientX) - ball.offsetLeft;
    ballDraggingOffsetY = (e.touches ? e.touches[0].clientY : e.clientY) - ball.offsetTop;
}

function endDraggingBall(e) {
    ballDragging = false;
    vXLast = lastMouseMovementX * mouseThrowStrengthFactor;
    vYLast = lastMouseMovementY * mouseThrowStrengthFactor;
    tLast = new Date().getTime();
    lastTouch = null;

    requestAnimationFrame(loop);
}

document.addEventListener("mousemove", dragBall);
ball.addEventListener("mousedown", startDraggingBall);
ball.addEventListener("mouseup", endDraggingBall);

document.addEventListener("touchmove", dragBall);
ball.addEventListener("touchstart", startDraggingBall);
ball.addEventListener("touchend", endDraggingBall);

function loop() {
    const t = (new Date()).getTime();
    const tDelta = t - tLast;

    let vY = vYLast + aGravity * tDelta;
    let posY = Math.round(100 * (posYLast + vY * tDelta)) / 100;

    let vX = vXLast + aX * tDelta;
    let posX = Math.round(100 * (posXLast + vX * tDelta)) / 100;

    ball.style.top = posY + "px";
    ball.style.left = posX + "px";

    if (posY >= windowHeight - ballHeight || posY < 0) {
        posY = posY < 0 ? 0 : windowHeight - ballHeight;
        vY = -vY * dampingFloor;
        vX = vX * frictionFloor;
        bouncePoints++;
    }

    if (posX >= windowWidth - ballWidth || posX < 0) {
        posX = posX <= 0 ? 0 : windowWidth - ballWidth;
        vX = -vX * dampingWall;
        aX = 0;
        bouncePoints++;
    }

    // Bounce off boundaries
    for (const it of boundaries) {
        if (posY + ballHeight >= it.y && posY < it.y && posX + ballWidth > it.x && posX < it.x + it.width) {
            posY = it.y - ballHeight;
            vY = -vY * it.damping;
        } else if (posY <= it.y + it.height && posY + ballHeight > it.y + it.height && posX + ballWidth > it.x && posX < it.x + it.width) {
            posY = it.y + it.height;
            vY = -vY * it.damping;
        } else if (posX + ballWidth >= it.x && posX < it.x && posY + ballHeight > it.y && posY < it.y + it.height) {
            posX = it.x - ballWidth;
            vX = -vX * it.damping;
        } else if (posX <= it.x + it.width && posX + ballWidth > it.x + it.width && posY + ballHeight > it.y && posY < it.y + it.height) {
            posX = it.x + it.width;
            vX = -vX * it.damping;
        }
    }

    if (touchesBox(checkpoint1, posY, posX) && !touchesBox(checkpoint2, posY, posX) && !checkpointTimeout && !checkpoint1Touched) {
        checkpoint1Touched = true;
        checkpointTimeout = setTimeout(function () {
            checkpoint1Touched = false;
            checkpointTimeout = null;
        }, checkpointTimeDuration)
    }

    if (touchesBox(checkpoint2, posY, posX) && !touchesBox(checkpoint1, posY, posX) && checkpoint1Touched) {
        overallPoints += bouncePoints;
        checkpoint1Touched = false;
        clearTimeout(checkpointTimeout);
        checkpointTimeout = null;
    }

    console.log(overallPoints)

    posYLast = posY;
    vYLast = vY;

    posXLast = posX;
    vXLast = vX;

    tLast = t;

    if (!ballDragging) requestAnimationFrame(loop);
}
