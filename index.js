import {levels} from './levels.js';

let audioContext;

let mainSound;
let crowdSound;
let timerSound;

const playOverlay = document.querySelector(".play-overlay");
playOverlay.onclick = function () {
    audioContext = new AudioContext()
    mainSound = playSound("assets/sounds/main.mp3", true, 1);
    playOverlay.classList.add("play-overlay-hide");
    playOverlay.style.pointerEvents = "none"
    setTimeout(() => {
        playOverlay.style.display = "none"
    }, 500);
}

const bounceAudioSrc = "assets/sounds/bounce.mp3";
const winAudioSrc = "assets/sounds/win.mp3";
const crowdAudioSrc = "assets/sounds/crowd.mp3";
const levelUpAudioSrc = "assets/sounds/levelup.mp3";
const timerSoundSrc = "assets/sounds/timer.mp3";
const levelUpDuration = 3000;

let secondsLeft = 0;
let timer;
let gameOver = false;

const logo = document.querySelector(".logo");

const ball = document.querySelector(".ball");
const ballHeight = ball.clientHeight;
const ballWidth = ball.clientWidth;

const content = document.querySelector(".content");

const changeScenery = document.querySelector(".change-scenery");
const sceneryChangeDuration = 2000;

const gameOverElement = document.querySelector(".game-over");

const scoresElement = document.querySelector(".scores");
const bouncesScoreElement = document.querySelector(".bounces-score").firstElementChild;
const overallScoreElement = document.querySelector(".overall-score").firstElementChild;
const finalScoreElement = document.querySelector(".final-score").firstElementChild;
const finalLevelElement = document.querySelector(".final-level").firstElementChild;
const timeElement = document.querySelector(".time-left").firstElementChild;
const levelNameElement = document.querySelector(".level-name").firstElementChild;
scoresElement.style.display = "none";

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

const initialBallPositionX = (windowWidth / 2) - (ballWidth / 2);
const initialBallPositionY = (3 * windowHeight / 4);

let vYLast = 0;
let posYLast = initialBallPositionY;

let vXLast = 0;
let posXLast = initialBallPositionX;
let aX = 0.0000;

let tLast = new Date().getTime();
let lastBounceTime = 0;

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

let levelIdx = 0;
loadLevel(levels[levelIdx]);
let nextLevel = levels[levelIdx + 1];

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

async function playSound(url, loop, volume) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = loop;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode).connect(audioContext.destination);
    source.start(0);

    return {source, gainNode};
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

function loadLevel(level) {
    ball.style.backgroundImage = "url(\"" + level.ball + "\")"
    content.style.backgroundImage = "url(\"" + level.gym + "\")"
    levelNameElement.innerHTML = level.name;
    secondsLeft += level.addedSeconds;
}

async function handleCountdownTick() {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    if (minutes === 0 && seconds < 30) {
        timeElement.style.color = 'red';
        if (!timerSound) timerSound = playSound(timerSoundSrc, true, 1);
    } else {
        timeElement.style.color = 'white';
        if (timerSound) (await timerSound).source.stop();
    }
    timeElement.innerHTML = minutes + ":" + String(seconds).padStart(2, '0');
    if (minutes === 0 && seconds === 0) {
        gameOver = true;
        if (timerSound) (await timerSound).source.stop();
        timerSound = null;
        (await mainSound).gainNode.gain.value = 0.4;
        if (!crowdSound) crowdSound = playSound(crowdAudioSrc, true, 0.7);
        (await crowdSound).gainNode.gain.value = 0.6;
        finalScoreElement.innerHTML = overallPoints;
        finalLevelElement.innerHTML = levels[levelIdx].name;
        gameOverElement.style.display = "flex";
        gameOverElement.style.pointerEvents = "all";
    } else {
        secondsLeft = secondsLeft - 1;
    }
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
    logo.style.display = "none";
    scoresElement.style.display = "flex";
    if (!timer) timer = setInterval(() => handleCountdownTick(), 1000);
    logo.classList.remove("logo");
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
        if (t - lastBounceTime > 100) {
            bouncePoints++;
            playSound(bounceAudioSrc, false, 1);
        }
        lastBounceTime = t;
    }

    if (posX >= windowWidth - ballWidth || posX < 0) {
        posX = posX <= 0 ? 0 : windowWidth - ballWidth;
        vX = -vX * dampingWall;
        aX = 0;
        bouncePoints++;
        playSound(bounceAudioSrc, false, 1);
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
        if (bouncePoints > 0) playSound(winAudioSrc, false, 0.8);
    }

    posYLast = posY;
    vYLast = vY;

    posXLast = posX;
    vXLast = vX;

    tLast = t;

    bouncesScoreElement.innerHTML = bouncePoints;
    overallScoreElement.innerHTML = overallPoints;
    if (nextLevel) {
        overallScoreElement.innerHTML += "/" + nextLevel.requiredScore
    }

    if (nextLevel && overallPoints >= nextLevel.requiredScore) {
        changeScenery.style.display = "flex";
        setTimeout(async () => {
            (await mainSound).gainNode.gain.value = 0.4;
            playSound(levelUpAudioSrc, false, 1);
            if (timerSound) (await timerSound).source.stop();
        }, 200);
        setTimeout(() => {
            levelIdx++;
            if (levelIdx > 2) crowdSound = playSound(crowdAudioSrc, true, 0.2);
            loadLevel(nextLevel);
            nextLevel = levels[levelIdx + 1];
            ball.style.left = initialBallPositionX + "px";
            ball.style.top = initialBallPositionY + "px";
            bouncePoints = 0;
            if (nextLevel) overallScoreElement.innerHTML = overallPoints + "/" + nextLevel.requiredScore
        }, sceneryChangeDuration / 2)
        setTimeout(() => {
            changeScenery.style.display = "none";
        }, sceneryChangeDuration);
        setTimeout(async () => {
            (await mainSound).gainNode.gain.value = 1;
        }, levelUpDuration + 200);
        return;
    }

    if (gameOver) return;

    if (!ballDragging) requestAnimationFrame(loop);
}
