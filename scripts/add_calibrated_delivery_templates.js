/**
 * scripts/add_calibrated_delivery_templates.js
 * 
 * Generates and appends calibrated 72-D invariant feature templates for
 * transit and delivery signs into counter_isl_vocab.json.
 */

const fs = require('fs');
const path = require('path');

const VOCAB_PATH = path.resolve(__dirname, '../src/assets/counter_isl_vocab.json');

const GEOMETRY_PAIRS = [
  [0, 4], [0, 8], [0, 12], [0, 16], [0, 20],
  [4, 8], [8, 12], [12, 16], [16, 20]
];

function buildFeatureVector(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;
  const wrist = landmarks[0];
  let scale = 0;
  for (const p of landmarks) {
    scale = Math.max(scale, Math.hypot(p.x - wrist.x, p.y - wrist.y, p.z - wrist.z));
  }
  if (scale === 0) return null;

  const norm = landmarks.map(p => ({
    x: (p.x - wrist.x) / scale,
    y: (p.y - wrist.y) / scale,
    z: (p.z - wrist.z) / scale,
  }));

  const features = norm.flatMap(p => [p.x, p.y, p.z]);
  for (const [l, r] of GEOMETRY_PAIRS) {
    const a = norm[l]; const b = norm[r];
    features.push(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z));
  }
  return features;
}

// Synthesize custom landmark positions based on MediaPipe topology
function createDeliveryLandmarks(type) {
  const wrist = { x: 0, y: 0, z: 0 };
  const lm = [wrist];

  // Helper for curled finger
  function curledChain(baseX, baseY, z = 0.05) {
    return [
      { x: baseX, y: baseY, z: 0 },
      { x: baseX * 0.9, y: baseY + 0.10, z: z + 0.05 },
      { x: baseX * 0.8, y: baseY + 0.22, z: z + 0.10 },
      { x: baseX * 0.7, y: baseY + 0.28, z: z + 0.08 }
    ];
  }

  // Helper for extended finger straight up
  function extendedUpChain(baseX, baseY, spreadX = 0) {
    return [
      { x: baseX, y: baseY, z: 0 },
      { x: baseX + spreadX * 0.3, y: baseY - 0.25, z: 0 },
      { x: baseX + spreadX * 0.6, y: baseY - 0.45, z: 0 },
      { x: baseX + spreadX * 1.0, y: baseY - 0.65, z: 0 }
    ];
  }

  if (type === 'GATE_LEFT') {
    // Thumb across fist
    lm.push(
      { x: -0.22, y: -0.32, z: -0.05 },
      { x: -0.15, y: -0.40, z: 0.06 },
      { x: -0.05, y: -0.44, z: 0.12 },
      { x: 0.02, y: -0.42, z: 0.14 }
    );
    // Index pointing left
    lm.push(
      { x: -0.15, y: -0.60, z: 0 },
      { x: -0.35, y: -0.62, z: 0 },
      { x: -0.55, y: -0.63, z: 0 },
      { x: -0.75, y: -0.64, z: 0 }
    );
    // Middle, Ring, Pinky curled
    lm.push(...curledChain(0.00, -0.65));
    lm.push(...curledChain(0.15, -0.60));
    lm.push(...curledChain(0.28, -0.55));
  } else if (type === 'GATE_RIGHT') {
    // Thumb across fist
    lm.push(
      { x: -0.22, y: -0.32, z: -0.05 },
      { x: -0.15, y: -0.40, z: 0.06 },
      { x: -0.05, y: -0.44, z: 0.12 },
      { x: 0.02, y: -0.42, z: 0.14 }
    );
    // Index pointing right
    lm.push(
      { x: -0.15, y: -0.60, z: 0 },
      { x: 0.05, y: -0.62, z: 0 },
      { x: 0.30, y: -0.63, z: 0 },
      { x: 0.55, y: -0.64, z: 0 }
    );
    // Middle, Ring, Pinky curled
    lm.push(...curledChain(0.00, -0.65));
    lm.push(...curledChain(0.15, -0.60));
    lm.push(...curledChain(0.28, -0.55));
  } else if (type === 'COMING_DOWN') {
    // Thumb curled
    lm.push(
      { x: -0.22, y: -0.32, z: -0.05 },
      { x: -0.15, y: -0.40, z: 0.06 },
      { x: -0.05, y: -0.44, z: 0.12 },
      { x: 0.02, y: -0.42, z: 0.14 }
    );
    // Index pointing down
    lm.push(
      { x: -0.15, y: -0.50, z: 0 },
      { x: -0.16, y: -0.25, z: 0.05 },
      { x: -0.17, y: 0.05, z: 0.08 },
      { x: -0.18, y: 0.35, z: 0.10 }
    );
    // Middle, Ring, Pinky curled
    lm.push(...curledChain(0.00, -0.65));
    lm.push(...curledChain(0.15, -0.60));
    lm.push(...curledChain(0.28, -0.55));
  } else if (type === 'FLOOR_2') {
    // Thumb across palm
    lm.push(
      { x: -0.22, y: -0.32, z: -0.05 },
      { x: -0.12, y: -0.40, z: 0.06 },
      { x: -0.02, y: -0.44, z: 0.12 },
      { x: 0.08, y: -0.42, z: 0.14 }
    );
    // Index spread left (-0.15)
    lm.push(...extendedUpChain(-0.15, -0.65, -0.15));
    // Middle spread right (+0.15)
    lm.push(...extendedUpChain(0.00, -0.70, 0.15));
    // Ring and Pinky curled
    lm.push(...curledChain(0.15, -0.65));
    lm.push(...curledChain(0.28, -0.58));
  } else if (type === 'DOOR') {
    // Open flat hand - all 5 extended
    lm.push(
      { x: -0.25, y: -0.35, z: -0.05 },
      { x: -0.40, y: -0.48, z: -0.08 },
      { x: -0.55, y: -0.60, z: -0.10 },
      { x: -0.70, y: -0.72, z: -0.12 }
    );
    lm.push(...extendedUpChain(-0.15, -0.65, -0.08));
    lm.push(...extendedUpChain(0.00, -0.70, 0.00));
    lm.push(...extendedUpChain(0.15, -0.65, 0.06));
    lm.push(...extendedUpChain(0.28, -0.58, 0.12));
  } else if (type === 'BELL') {
    // Pinch thumb and index tips together
    lm.push(
      { x: -0.25, y: -0.35, z: -0.05 },
      { x: -0.24, y: -0.48, z: 0.05 },
      { x: -0.20, y: -0.55, z: 0.10 },
      { x: -0.15, y: -0.58, z: 0.12 } // thumb tip touching index
    );
    // Index curved to touch thumb tip
    lm.push(
      { x: -0.15, y: -0.65, z: 0 },
      { x: -0.12, y: -0.55, z: 0.06 },
      { x: -0.14, y: -0.57, z: 0.10 },
      { x: -0.15, y: -0.58, z: 0.12 } // index tip touching thumb
    );
    // Middle, Ring, Pinky extended up
    lm.push(...extendedUpChain(0.00, -0.70, 0.00));
    lm.push(...extendedUpChain(0.15, -0.65, 0.06));
    lm.push(...extendedUpChain(0.28, -0.58, 0.12));
  } else if (type === 'OTP') {
    // 4 fingers extended, thumb tucked
    lm.push(
      { x: -0.22, y: -0.32, z: -0.05 },
      { x: -0.12, y: -0.40, z: 0.06 },
      { x: -0.02, y: -0.44, z: 0.12 },
      { x: 0.08, y: -0.42, z: 0.14 }
    );
    lm.push(...extendedUpChain(-0.15, -0.65, -0.05));
    lm.push(...extendedUpChain(0.00, -0.70, 0.00));
    lm.push(...extendedUpChain(0.15, -0.65, 0.05));
    lm.push(...extendedUpChain(0.28, -0.58, 0.10));
  } else if (type === 'NAMASTE') {
    // Palm vertical, fingers together straight up
    lm.push(
      { x: -0.18, y: -0.35, z: 0.05 },
      { x: -0.15, y: -0.48, z: 0.08 },
      { x: -0.10, y: -0.58, z: 0.10 },
      { x: -0.05, y: -0.68, z: 0.12 }
    );
    lm.push(...extendedUpChain(-0.06, -0.65, 0.00));
    lm.push(...extendedUpChain(0.00, -0.70, 0.00));
    lm.push(...extendedUpChain(0.06, -0.65, 0.00));
    lm.push(...extendedUpChain(0.12, -0.58, 0.00));
  }

  return lm;
}

function main() {
  const vocab = JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf8'));
  const labelsToAdd = [
    'GATE_LEFT',
    'GATE_RIGHT',
    'COMING_DOWN',
    'FLOOR_2',
    'DOOR',
    'BELL',
    'OTP',
    'NAMASTE'
  ];

  let added = 0;
  for (const lbl of labelsToAdd) {
    const existingIndex = vocab.gestures.findIndex(g => g.label === lbl);
    const lm = createDeliveryLandmarks(lbl);
    const features = buildFeatureVector(lm);
    if (!features || features.length !== 72) {
      console.error(`Failed to build feature vector for ${lbl}`);
      continue;
    }

    if (existingIndex >= 0) {
      vocab.gestures[existingIndex] = { label: lbl, features };
      console.log(`Updated existing template: ${lbl}`);
    } else {
      vocab.gestures.push({ label: lbl, features });
      added++;
      console.log(`Added new template: ${lbl}`);
    }
  }

  vocab.totalCount = vocab.gestures.length;
  fs.writeFileSync(VOCAB_PATH, JSON.stringify(vocab, null, 2), 'utf8');
  console.log(`\n✅ Lexicon updated! Total templates now: ${vocab.totalCount} (Added ${added} new)`);
}

main();
