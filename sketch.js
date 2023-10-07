// Copyright (c) 2019 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
PoseNet using p5.js
=== */
/* eslint-disable */

// Grab elements, create settings, etc.
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// add here the global variables
let calibratedYLine;
let hasCalibrated = false; // make sure to reset this later on

// Ends here

// The detected positions will be inside an array
// let poses = [];
let firstPose = [];

// Create a webcam capture
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
    video.srcObject = stream;
    video.play();
  });
}

// A function to draw the video and poses into the canvas.
// This function is independent of the result of posenet
// This way the video will not seem slow if poseNet
// is not detecting a position
function drawCameraIntoCanvas() {
  // Draw the video element into the canvas
  ctx.drawImage(video, 0, 0, 640, 480);
  // We can call both functions to draw all keypoints and the skeletons
  // drawKeypoints();
  // drawSkeleton();
  drawKeypointsSinglePose();
  // logChanges();
  handleCalibration();
  handleJump();

  window.requestAnimationFrame(drawCameraIntoCanvas);
}
// Loop over the drawCameraIntoCanvas function
drawCameraIntoCanvas();

// Create a new poseNet method with a single detection
const poseNet = ml5.poseNet(video, modelReady);
poseNet.on("pose", gotPoses);

// A function that gets called every time there's an update from the model
function gotPoses(results) {
  if (results.length > 0) {
    firstPose = results[0];
    console.log("FIRST POSE ", firstPose);
  }

  // console.log(poses);   // DISABLE to improve performance
}

function modelReady() {
  console.log("model ready");
  poseNet.multiPose(video);
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
  // Loop through all the poses detected
  for (let i = 0; i < firstPose.length; i += 1) {
    // For each pose detected, loop through all the keypoints
    for (let j = 0; j < firstPose[i].pose.keypoints.length; j += 1) {
      let keypoint = firstPose[i].pose.keypoints[j];
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.3) {
        ctx.strokeStyle = "blue"; // You can use any valid CSS color here
        ctx.beginPath();
        ctx.arc(keypoint.position.x, keypoint.position.y, 10, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  }
}

function drawKeypointsSinglePose() {
  if (firstPose && firstPose.pose && firstPose.pose.keypoints) {
    for (let i = 0; i < firstPose.pose.keypoints.length; i += 1) {
      let keypoint = firstPose.pose.keypoints[i];
      if (keypoint.score > 0.3) {
        ctx.strokeStyle = "white"; // Set the color to white
        ctx.beginPath();
        ctx.arc(keypoint.position.x, keypoint.position.y, 10, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }

    for (let i = 0; i < firstPose.skeleton.length; i += 1) {
      let partA = firstPose.skeleton[i][0];
      let partB = firstPose.skeleton[i][1];
      ctx.strokeStyle = "white"; // Set the color to white
      ctx.beginPath();
      ctx.moveTo(partA.position.x, partA.position.y);
      ctx.lineTo(partB.position.x, partB.position.y);
      ctx.stroke();
    }
  }
}

// A function to draw ellipses over the detected keypoints
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

// A function to draw the skeletons
function drawSkeleton() {
  // Loop through all the skeletons detected
  for (let i = 0; i < poses.length; i += 1) {
    // For every skeleton, loop through all body connections
    for (let j = 0; j < poses[i].skeleton.length; j += 1) {
      let partA = poses[i].skeleton[j][0];
      let partB = poses[i].skeleton[j][1];
      ctx.strokeStyle = "yellow"; // You can use any valid CSS color here
      ctx.beginPath();
      ctx.moveTo(partA.position.x, partA.position.y);
      ctx.lineTo(partB.position.x, partB.position.y);
      ctx.stroke();
    }
  }
}

function handleJump() {
  if (firstPose) {
    if (
      firstPose.pose.keypoints[5].position.x >= 100 &&
      firstPose.pose.keypoints[6].position.x <= 550
    ) {
      // test start
      let keypoint = firstPose.pose.keypoints[0];
      if (keypoint.score > 0.3) {
        ctx.strokeStyle = "blue"; // You can use any valid CSS color here
        ctx.beginPath();
        ctx.arc(keypoint.position.x, keypoint.position.y, 10, 0, 2 * Math.PI);
        ctx.stroke();
      }
      // test end
      let currRightShoulder = firstPose.pose.keypoints[5].position.y;
      let currLeftShoulder = firstPose.pose.keypoints[6].position.y;

      let currShoulderYLine = (currRightShoulder + currLeftShoulder) / 2;

      console.log(`nose Y axis: ${currShoulderYLine}`);

      // Detect a jump if the person's height is greater than 1.5 times their normal height
      const jumpDetected = calibratedYLine > currShoulderYLine + 70;

      // Detect a crouch if the person's height is less than 0.5 times their normal height
      const crouchDetected = calibratedYLine < currShoulderYLine - 70;

      console.log("test");

      if (jumpDetected) {
        console.log("jump");
      } else if (crouchDetected) {
        console.log("crouch");
      }

      // console.log(poses[0].pose.keypoints[0].position.x);
      console.log(`Calibrated Y ${calibratedYLine}`);
    }
  } else console.log("nothing is return");
}

async function handleCalibration() {
  try {
    if (!hasCalibrated) {
      setTimeout(getPositionY, 5000);
      hasCalibrated = true;
    }
  } catch (error) {
    console.log(error);
  }
}

function getPositionY() {
  let leftShoulderKeypoint = firstPose.pose.keypoints[5].position.y;
  let rightShoulderKeypoint = firstPose.pose.keypoints[6].position.y;

  yAxisNoseLine = firstPose.pose.keypoints[0].position.y;

  calibratedYLine = (leftShoulderKeypoint + rightShoulderKeypoint) / 2;

  console.log(`Calibrated Y ${calibratedYLine}`);
}

function restartCalibration() {
  hasCalibrated = false;
}
