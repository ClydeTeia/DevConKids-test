import {
  getCustomProperty,
  incrementCustomProperty,
  setCustomProperty,
} from "./updateCustomProperty.js";

const dinoElem = document.querySelector("[data-dino]");
const JUMP_SPEED = 0.45;
const GRAVITY = 0.0015;
const DINO_FRAME_COUNT = 2;
const FRAME_TIME = 100;

let isJumping;
let isCrouching;
let dinoFrame;
let currentFrameTime;
let yVelocity;

export function setupDino() {
  isJumping = false;
  dinoFrame = 0;
  currentFrameTime = 0;
  yVelocity = 0;
  setCustomProperty(dinoElem, "--bottom", 0);
  document.removeEventListener("keydown", onJump);
  document.addEventListener("keydown", onJump);
  document.removeEventListener("keydown", onCrouch);
  document.addEventListener("keydown", onCrouch);
}

export function updateDino(delta, speedScale) {
  handleRun(delta, speedScale);
  handleJump(delta);
  handleCrouch(delta, speedScale);
}

export function getDinoRect() {
  return dinoElem.getBoundingClientRect();
}

export function setDinoLose() {
  dinoElem.src = "imgs/dino-lose.PNG";
}

function handleRun(delta, speedScale) {
  if (isJumping) {
    dinoElem.src = `imgs/dino-stationary.PNG`;
    return;
  }

  if (isCrouching) {
    dinoElem.src = `imgs/dino-crouch.PNG`;
    return;
  }

  // swaps between 2 pictures
  if (currentFrameTime >= FRAME_TIME) {
    dinoFrame = (dinoFrame + 1) % DINO_FRAME_COUNT; // ranges between 0 and 1
    dinoElem.src = `imgs/dino-run-${dinoFrame}.PNG`;
    currentFrameTime -= FRAME_TIME;
  }

  currentFrameTime += delta * speedScale;
}

function handleJump(delta) {
  if (!isJumping) return;

  incrementCustomProperty(dinoElem, "--bottom", yVelocity * delta);

  if (getCustomProperty(dinoElem, "--bottom") <= 0) {
    setCustomProperty(dinoElem, "--bottom", 0);
    isJumping = false;
  }

  yVelocity -= GRAVITY * delta;
}

function handleCrouch() {
  if (!isCrouching) return;

  // if (currentFrameTime >= FRAME_TIME) {
  //   dinoElem.src = `imgs/dino-crouch.PNG`;
  //   currentFrameTime -= FRAME_TIME;
  // }
}

// I want to make the code communicate with the postnet model
function onCrouch(e) {
  if (e.code !== "Crouch" || isCrouching) return;

  isCrouching = true;
}

function onJump(e) {
  if (e.code !== "Space" || isJumping) return;

  yVelocity = JUMP_SPEED;
  isJumping = true;
}
