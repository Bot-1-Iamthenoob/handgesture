const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const gestureLabelDiv = document.getElementById("gestureLabel");

// MediaPipe Hands setup
const hands = new Hands({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});

hands.onResults((results) => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0);

  let gesture = "";

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const lm = results.multiHandLandmarks[0];

    // Draw hand skeleton
    drawConnectors(ctx, lm, HAND_CONNECTIONS, { color: "#00ffcc", lineWidth: 4 });
    drawLandmarks(ctx, lm, { color: "#ff0066", lineWidth: 2 });

    // Detect gesture
    gesture = detectSign(lm);
  }

  gestureLabelDiv.innerText = gesture;
});

// Camera start
const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 800,
  height: 600,
});

camera.start();

// --- Gesture detection function ---
function detectSign(lm) {
  // Helper function: finger up/down
  const isFingerUp = (tip, pip) => lm[tip].y < lm[pip].y;

  const thumbUp = lm[4].x < lm[3].x && lm[4].x < lm[2].x;
  const indexUp = isFingerUp(8, 6);
  const middleUp = isFingerUp(12, 10);
  const ringUp = isFingerUp(16, 14);
  const pinkyUp = isFingerUp(20, 18);

  // Simple gesture detection (expandable)
  if (!thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp) return "A"; // fist
  if (!thumbUp && indexUp && middleUp && ringUp && pinkyUp) return "B"; // open palm
  if (!thumbUp && indexUp && !middleUp && !ringUp && !pinkyUp) return "D"; // index up
  if (thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp) return "👍 Thumbs Up";
  if (!thumbUp && indexUp && middleUp && !ringUp && !pinkyUp) return "✌️ Peace";

  return "";
}
