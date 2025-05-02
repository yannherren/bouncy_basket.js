const ball = document.querySelector(".ball");
const ballHeight = ball.clientHeight;
const ballWidth = ball.clientWidth;

const mouseThrowStrengthFactor = 0.05;
let ballDragging = false;
let ballDraggingOffsetX = 0;
let ballDraggingOffsetY = 0;
let lastMouseMovementX = 0;
let lastMouseMovementY = 0;

const windowHeight = window.innerHeight;
const windowWidth = window.innerWidth;

const weight = 2;
const dampingFloor = 0.7;
const frictionFloor = 0.9;
const dampingWall = 0.2;
const aGravity = 0.000981 * weight;

let vYLast = 0;
let posYLast = 100;

let vXLast = 0;
let posXLast = 100;
let aX = 0.0000;

let tLast = new Date().getTime();

const boundaryEl = document.querySelector(".boundary");
const boundaryEl2 = document.querySelector(".boundary-1");
const boundaries = [new Boundary(boundaryEl), new Boundary(boundaryEl2)];

function Boundary(element) {
    const rects = element.getBoundingClientRect();
    this.x = rects.left;
    this.y = rects.top;
    this.width = element.clientWidth;
    this.height = element.clientHeight;
    this.damping = 0.8;
}


document.addEventListener("mousemove", function (e) {
    e.preventDefault();
    if (ballDragging) {
        posXLast = e.clientX - ballDraggingOffsetX;
        posYLast = e.clientY - ballDraggingOffsetY;
        ball.style.left = posXLast + "px";
        ball.style.top = posYLast + "px";
        lastMouseMovementX = e.movementX;
        lastMouseMovementY = e.movementY;
    }
})

ball.addEventListener("mousedown", function (e) {
    e.preventDefault();
    ballDragging = true;
    ballDraggingOffsetX = e.clientX - ball.offsetLeft;
    ballDraggingOffsetY = e.clientY - ball.offsetTop;
})

ball.addEventListener("mouseup", function (e) {
        e.preventDefault();
        ballDragging = false;
        vXLast = lastMouseMovementX * mouseThrowStrengthFactor;
        vYLast = lastMouseMovementY * mouseThrowStrengthFactor;
        tLast = new Date().getTime();

        requestAnimationFrame(loop);
    }
)

document.addEventListener("touchmove", function (e) {
    e.preventDefault();
    if (ballDragging) {
        posXLast = (e.touches ? e.touches[0].clientX : e.clientX) - ballDraggingOffsetX;
        posYLast = (e.touches ? e.touches[0].clientY : e.clientY) - ballDraggingOffsetY;
        ball.style.left = posXLast + "px";
        ball.style.top = posYLast + "px";
        lastMouseMovementX = e.movementX;
        lastMouseMovementY = e.movementY;
    }
})
ball.addEventListener("touchstart", function (e) {
    e.preventDefault();
    ballDragging = true;
    ballDraggingOffsetX = (e.touches ? e.touches[0].clientX : e.clientX) - ball.offsetLeft;
    ballDraggingOffsetY = (e.touches ? e.touches[0].clientY : e.clientY) - ball.offsetTop;
})
document.addEventListener("touchend", function () {
    e.preventDefault();
    ballDragging = false;
    vXLast = lastMouseMovementX * mouseThrowStrengthFactor;
    vYLast = lastMouseMovementY * mouseThrowStrengthFactor;
    tLast = new Date().getTime();

    requestAnimationFrame(loop);
})

function loop() {
    const t = (new Date()).getTime();
    const tDelta = t - tLast;

    let vY = vYLast + aGravity * tDelta;
    let posY = Math.round(100* (posYLast + vY * tDelta)) / 100;

    let vX = vXLast + aX * tDelta;
    let posX = Math.round(100* (posXLast + vX * tDelta)) / 100;

    ball.style.top = posY + "px";
    ball.style.left = posX + "px";

    if (posY >= windowHeight - ballHeight || posY < 0) {
        posY =  posY < 0 ? 0 : windowHeight - ballHeight;
        vY = -vY * dampingFloor;
        vX = vX * frictionFloor;
    }

    if (posX >= windowWidth - ballWidth || posX < 0) {
        posX = posX <= 0 ? 0 : windowWidth - ballWidth;
        vX = -vX * dampingWall;
        aX = 0;
    }


    for (const it of boundaries) {
        if (posY + ballHeight >= it.y && posY < it.y && posX + ballWidth > it.x && posX < it.x + it.width) {
            posY = it.y - ballHeight;
            vY = -vY * it.damping;
        }

        else if (posY <= it.y + it.height && posY + ballHeight > it.y + it.height && posX + ballWidth > it.x && posX < it.x + it.width) {
            posY = it.y + it.height;
            vY = -vY * it.damping;
        }

        else if (posX + ballWidth >= it.x && posX < it.x && posY + ballHeight > it.y && posY < it.y + it.height) {
            posX = it.x - ballWidth;
            vX = -vX * it.damping;
        }

        else if (posX <= it.x + it.width && posX + ballWidth > it.x + it.width && posY + ballHeight > it.y && posY < it.y + it.height) {
            posX = it.x + it.width;
            vX = -vX * it.damping;
        }
    }

    posYLast = posY;
    vYLast = vY;

    posXLast = posX;
    vXLast = vX;

    tLast = t;

    if (!ballDragging) requestAnimationFrame(loop);
}


requestAnimationFrame(loop)