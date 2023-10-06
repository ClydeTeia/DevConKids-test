import {
  getCustomProperty,
  incrementCustomProperty,
  setCustomProperty,
} from "./updateCustomProperty.js";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const dinoElem = document.querySelector("[data-dino]");
const JUMP_SPEED = 0.45;
const GRAVITY = 0.0015;
const DINO_FRAME_COUNT = 2;
const FRAME_TIME = 100;

let hasCalibrated;
let isJumping = false;
let isCrouching = false;
let dinoFrame;
let currentFrameTime;
let yVelocity;

let calibrateNoseLineY;
let calibratedYLine;

let poses = [];

// Create a webcam capture
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
    video.srcObject = stream;
    video.play();
  });
}

function drawCameraIntoCanvas() {
  ctx.drawImage(video, 0, 0, 640, 480);
  gotPoses(poses);
  logChanges();
  handleJump();
  window.requestAnimationFrame(drawCameraIntoCanvas);
}
// Loop over the drawCameraIntoCanvas function
drawCameraIntoCanvas();

const poseNet = ml5.poseNet(video, modelReady);
poseNet.on("pose", gotPoses);

function gotPoses(poses) {
  if (poses.length > 0) {
    const leftShoulderKeypoint = poses[0].pose.keypoints[5].position.y;
    const rightShoulderKeypoint = poses[0].pose.keypoints[6].position.y;

    let currentShouldersY = (leftShoulderKeypoint + rightShoulderKeypoint) / 2;

    if (calibratedYLine > currentShouldersY + 70) {
      // Adjust the threshold as needed
      // Trigger the jump action
      handleJump();
      isCrouching = false;
    } else if (calibratedYLine < currentShouldersY - 70) {
      isCrouching = true;
      isJumping = false;
    } else {
      isJumping = false;
      isCrouching = false;
    }
  }
}

function modelReady() {
  console.log("model ready");
  poseNet.multiPose(video);
}

async function handleCalibration() {
  try {
    if (!hasCalibrated) {
      setTimeout(getPositionY, 10);
      hasCalibrated = true;
    }
  } catch (error) {
    console.log(error);
  }
}

async function getPositionY() {
  if (poses && Array.isArray(poses) && poses.length > 0 && poses[0].pose) {
    let leftShoulderKeypoint = poses[0].pose.keypoints[5].position.y;
    let rightShoulderKeypoint = poses[0].pose.keypoints[6].position.y;

    yAxisNoseLine = poses[0].pose.keypoints[0].position.y;
    calibrateNoseLineY = yAxisNoseLine;

    calibratedYLine = (leftShoulderKeypoint + rightShoulderKeypoint) / 2;
    console.log(calibrateNoseLineY);
    console.log(`Calibrated Y ${calibratedYLine}`);
  } else {
    console.error(
      "Poses are not available or do not have the expected structure."
    );
  }
}

function restartCalibration() {
  hasCalibrated = false;
}

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

  incrementCustomProperty(dinoElem, "--bottom", yVelocity * delta);

  yVelocity -= GRAVITY * delta;
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

function logChanges() {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i += 1) {
    // console.log(poses[0].pose.keypoints[0]);
    // For each pose detected, loop through all the keypoints
    for (let j = 0; j < poses[i].pose.keypoints.length; j += 1) {
      let keypoint = poses[i].pose.keypoints[j];
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.3) {
        ctx.strokeStyle = "yellow"; // You can use any valid CSS color here
        ctx.beginPath();
        ctx.arc(keypoint.position.x, keypoint.position.y, 10, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
    for (let j = 0; j < poses[i].skeleton.length; j += 1) {
      let partA = poses[i].skeleton[j][0];
      let partB = poses[i].skeleton[j][1];
      ctx.strokeStyle = "red"; // You can use any valid CSS color here
      ctx.beginPath();
      ctx.moveTo(partA.position.x, partA.position.y);
      ctx.lineTo(partB.position.x, partB.position.y);
      ctx.stroke();
    }
  }
}
