/**
 * Hand gesture detection logic based on MediaPipe Hands landmarks
 * 1 finger up -> A (Index finger)
 * 2 fingers up -> B (Index + Middle)
 * 3 fingers up -> C (Index + Middle + Ring)
 * 4 fingers up -> D (Index + Middle + Ring + Pinky)
 */

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface GestureDetectionResult {
  fingerCount: number; // 0 to 5
  detectedOption: 'A' | 'B' | 'C' | 'D' | null;
  landmarks?: HandLandmark[];
  extendedFingers: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
  confidence: number;
}

/**
 * Evaluates whether fingers are extended from 21 MediaPipe hand landmarks.
 */
export function analyzeHandLandmarks(landmarks: HandLandmark[]): GestureDetectionResult {
  if (!landmarks || landmarks.length < 21) {
    return {
      fingerCount: 0,
      detectedOption: null,
      extendedFingers: { thumb: false, index: false, middle: false, ring: false, pinky: false },
      confidence: 0,
    };
  }

  // Check 4 long fingers: tip.y should be distinctly above (lower y) than PIP joint
  // Landmark indices:
  // Index: tip 8, pip 6
  // Middle: tip 12, pip 10
  // Ring: tip 16, pip 14
  // Pinky: tip 20, pip 18

  const indexUp = landmarks[8].y < landmarks[6].y;
  const middleUp = landmarks[12].y < landmarks[10].y;
  const ringUp = landmarks[16].y < landmarks[14].y;
  const pinkyUp = landmarks[20].y < landmarks[18].y;

  // Thumb: check distance between thumb tip (4) and index MCP (5) vs thumb IP (3)
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const indexMcp = landmarks[5];
  const wrist = landmarks[0];

  const thumbToWrist = Math.hypot(thumbTip.x - wrist.x, thumbTip.y - wrist.y);
  const thumbIpToWrist = Math.hypot(thumbIp.x - wrist.x, thumbIp.y - wrist.y);
  const thumbUp = thumbToWrist > thumbIpToWrist * 1.15 && Math.abs(thumbTip.x - indexMcp.x) > 0.08;

  // We prioritize the 4 main fingers (Index, Middle, Ring, Pinky) for 1, 2, 3, 4
  const mainFingersUp = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean).length;
  const totalFingersUp = (thumbUp ? 1 : 0) + mainFingersUp;

  let option: 'A' | 'B' | 'C' | 'D' | null = null;

  // Exact gesture matching:
  // 1 finger up: Index up (or total 1 finger)
  if (mainFingersUp === 1 || (totalFingersUp === 1 && (indexUp || thumbUp))) {
    option = 'A';
  } else if (mainFingersUp === 2 || (indexUp && middleUp && !ringUp && !pinkyUp)) {
    option = 'B';
  } else if (mainFingersUp === 3 || (indexUp && middleUp && ringUp && !pinkyUp)) {
    option = 'C';
  } else if (mainFingersUp === 4 || (!thumbUp && indexUp && middleUp && ringUp && pinkyUp) || (mainFingersUp === 4)) {
    option = 'D';
  }

  return {
    fingerCount: mainFingersUp,
    detectedOption: option,
    landmarks,
    extendedFingers: {
      thumb: thumbUp,
      index: indexUp,
      middle: middleUp,
      ring: ringUp,
      pinky: pinkyUp,
    },
    confidence: 0.9,
  };
}

/**
 * Draws hand landmarks and connections onto a target 2D canvas
 */
export function drawHandOnCanvas(
  ctx: CanvasRenderingContext2D,
  landmarks: HandLandmark[],
  width: number,
  height: number,
  detectedOption: 'A' | 'B' | 'C' | 'D' | null
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Hand skeleton connections
  const connections = [
    // Thumb
    [0, 1], [1, 2], [2, 3], [3, 4],
    // Index
    [0, 5], [5, 6], [6, 7], [7, 8],
    // Middle
    [5, 9], [9, 10], [10, 11], [11, 12],
    // Ring
    [9, 13], [13, 14], [14, 15], [15, 16],
    // Pinky
    [13, 17], [17, 18], [18, 19], [19, 20],
    // Palm base
    [0, 17],
  ];

  // Pick color based on detected option
  let strokeColor = '#38bdf8'; // sky blue default
  if (detectedOption === 'A') strokeColor = '#3b82f6'; // Blue
  if (detectedOption === 'B') strokeColor = '#10b981'; // Emerald
  if (detectedOption === 'C') strokeColor = '#f59e0b'; // Amber
  if (detectedOption === 'D') strokeColor = '#ec4899'; // Pink

  // Draw connections
  ctx.lineWidth = 3;
  ctx.strokeStyle = strokeColor;
  ctx.lineCap = 'round';

  for (const [start, end] of connections) {
    const p1 = landmarks[start];
    const p2 = landmarks[end];
    if (!p1 || !p2) continue;

    ctx.beginPath();
    ctx.moveTo(p1.x * width, p1.y * height);
    ctx.lineTo(p2.x * width, p2.y * height);
    ctx.stroke();
  }

  // Draw keypoints
  landmarks.forEach((p, idx) => {
    const isTip = [4, 8, 12, 16, 20].includes(idx);
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, isTip ? 6 : 4, 0, 2 * Math.PI);
    ctx.fillStyle = isTip ? '#ffffff' : strokeColor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = isTip ? strokeColor : '#ffffff';
    ctx.stroke();
  });

  ctx.restore();
}
