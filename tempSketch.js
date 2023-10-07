let video = document.getElementById("video");
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

// The detected pose will be stored here
let pose;

// Create a webcam capture
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
    video.srcObject = stream;
    video.play();
  });
}

// A function to draw the video and pose into the canvas.
function drawCameraIntoCanvas() {
  ctx.drawImage(video, 0, 0, 640, 480);
  if (pose) {
    drawKeypoints();
    drawSkeleton();
    console.log(pose);
    console.log(pose.keypoints);
  }
  window.requestAnimationFrame(drawCameraIntoCanvas);
}
// Loop over the drawCameraIntoCanvas function
drawCameraIntoCanvas();

// Create a new poseNet method with a single detection
const poseNet = ml5.poseNet(video, modelReady);
poseNet.on("pose", gotPose);

// A function that gets called every time there's an update from the model
function gotPose(results) {
  if (results.length > 0) {
    pose = results[0].pose; // Get the first detected pose (single pose)
  } else {
    pose = undefined; // Reset if no pose is detected
  }
}

function modelReady() {
  console.log("model ready");
  // Specify that you want single pose estimation
  poseNet.singlePose(video);
}

// Function to draw keypoints for the detected pose
function drawKeypoints() {
  if (pose && pose.keypoints) {
    // Loop through all the keypoints of the detected pose
    for (let i = 0; i < pose.keypoints.length; i += 1) {
      let keypoint = pose.keypoints[i];
      if (keypoint.score > 0.2) {
        ctx.beginPath();
        ctx.arc(keypoint.position.x, keypoint.position.y, 10, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  }
}

// Function to draw the skeleton for the detected pose
function drawSkeleton() {
  if (pose && pose.keypoints) {
    const keypoints = pose.keypoints;

    // Define the connections between keypoints to form the skeleton
    const skeleton = [
      // Upper body
      ["nose", "leftEye"],
      ["nose", "rightEye"],
      ["nose", "leftEar"],
      ["nose", "rightEar"],
      ["leftEar", "leftEye"],
      ["rightEar", "rightEye"],
      ["leftShoulder", "rightShoulder"],
      ["leftShoulder", "leftElbow"],
      ["rightShoulder", "rightElbow"],
      ["leftElbow", "leftWrist"],
      ["rightElbow", "rightWrist"],
      // Lower body
      ["leftHip", "rightHip"],
      ["leftHip", "leftKnee"],
      ["rightHip", "rightKnee"],
      ["leftKnee", "leftAnkle"],
      ["rightKnee", "rightAnkle"],
    ];

    // Loop through the defined skeleton connections
    for (const [partA, partB] of skeleton) {
      const keypointA = keypoints.find((kp) => kp.part === partA);
      const keypointB = keypoints.find((kp) => kp.part === partB);

      if (
        keypointA &&
        keypointB &&
        keypointA.score > 0.2 &&
        keypointB.score > 0.2
      ) {
        ctx.strokeStyle = "yellow";
        ctx.beginPath();
        ctx.moveTo(keypointA.position.x, keypointA.position.y);
        ctx.lineTo(keypointB.position.x, keypointB.position.y);
        ctx.stroke();
      }
    }
  }
}
