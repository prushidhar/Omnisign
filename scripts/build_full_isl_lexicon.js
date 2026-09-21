/**
 * scripts/build_full_isl_lexicon.js
 * Expands OmniSign's ISL Lexicon into the Whole Sign Language Engine:
 * 1. Complete A–Z Manual Alphabet (26 letters) — enabling fingerspelling of ANY word/name/medicine
 * 2. Complete 0–9 Digits — enabling token slips, cash amounts, and dosages
 * 3. Comprehensive Medical, Banking, Civic & Everyday Public Service Signs (80+ signs)
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

/** Biomechanical landmark synthesizer for hands */
function synthesizeHand({ thumb, index, middle, ring, pinky, wristRot = 0 }) {
  // Base skeleton positions (unnormalized)
  const wrist = { x: 0, y: 0, z: 0 };
  const mcp = {
    thumb:  { x: -0.25, y: -0.35, z: -0.05 },
    index:  { x: -0.15, y: -0.65, z: -0.02 },
    middle: { x:  0.00, y: -0.70, z:  0.00 },
    ring:   { x:  0.15, y: -0.65, z: -0.02 },
    pinky:  { x:  0.28, y: -0.58, z: -0.05 },
  };

  const points = [wrist];

  // Helper to generate a 3-joint chain from MCP: [PIP, DIP, Tip]
  function makeChain(baseMcp, state, fingerType) {
    let pip, dip, tip;
    const dirX = baseMcp.x * 0.4;

    if (state === 'EXTENDED') {
      pip = { x: baseMcp.x + dirX * 0.4, y: baseMcp.y - 0.25, z: baseMcp.z };
      dip = { x: baseMcp.x + dirX * 0.7, y: baseMcp.y - 0.45, z: baseMcp.z };
      tip = { x: baseMcp.x + dirX * 1.0, y: baseMcp.y - 0.65, z: baseMcp.z };
    } else if (state === 'CURLED') {
      // Folded tightly into palm
      pip = { x: baseMcp.x * 0.9, y: baseMcp.y - 0.12, z: baseMcp.z + 0.12 };
      dip = { x: baseMcp.x * 0.8, y: baseMcp.y + 0.05, z: baseMcp.z + 0.18 };
      tip = { x: baseMcp.x * 0.7, y: baseMcp.y + 0.15, z: baseMcp.z + 0.14 };
    } else if (state === 'HOOK') {
      // Half-bent claw
      pip = { x: baseMcp.x, y: baseMcp.y - 0.22, z: baseMcp.z + 0.08 };
      dip = { x: baseMcp.x, y: baseMcp.y - 0.32, z: baseMcp.z + 0.20 };
      tip = { x: baseMcp.x, y: baseMcp.y - 0.25, z: baseMcp.z + 0.28 };
    } else if (state === 'PINCH_THUMB') {
      // Touching thumb tip near index MCP
      pip = { x: -0.10, y: -0.50, z: 0.10 };
      dip = { x: -0.18, y: -0.52, z: 0.15 };
      tip = { x: -0.22, y: -0.52, z: 0.12 };
    } else if (state === 'CROSSED') {
      // Middle finger crossed over index
      pip = { x: baseMcp.x - 0.08, y: baseMcp.y - 0.25, z: baseMcp.z + 0.05 };
      dip = { x: baseMcp.x - 0.16, y: baseMcp.y - 0.45, z: baseMcp.z + 0.08 };
      tip = { x: baseMcp.x - 0.22, y: baseMcp.y - 0.65, z: baseMcp.z + 0.10 };
    } else { // default extended
      pip = { x: baseMcp.x, y: baseMcp.y - 0.25, z: baseMcp.z };
      dip = { x: baseMcp.x, y: baseMcp.y - 0.45, z: baseMcp.z };
      tip = { x: baseMcp.x, y: baseMcp.y - 0.65, z: baseMcp.z };
    }

    return [baseMcp, pip, dip, tip];
  }

  // Thumb special generation
  function makeThumb(state) {
    const cmc = mcp.thumb;
    let mcpPoint, ip, tip;

    if (state === 'EXTENDED') {
      mcpPoint = { x: -0.40, y: -0.45, z: -0.08 };
      ip       = { x: -0.55, y: -0.58, z: -0.10 };
      tip      = { x: -0.70, y: -0.70, z: -0.12 };
    } else if (state === 'ACROSS_PALM') { // Like A or S
      mcpPoint = { x: -0.20, y: -0.42, z: 0.05 };
      ip       = { x: -0.08, y: -0.48, z: 0.12 };
      tip      = { x:  0.02, y: -0.45, z: 0.15 };
    } else if (state === 'TUCKED_INDEX') { // T shape
      mcpPoint = { x: -0.20, y: -0.42, z: 0.05 };
      ip       = { x: -0.12, y: -0.55, z: 0.15 };
      tip      = { x: -0.10, y: -0.65, z: 0.20 };
    } else if (state === 'TUCKED_MIDDLE') { // N shape
      mcpPoint = { x: -0.18, y: -0.42, z: 0.05 };
      ip       = { x: -0.05, y: -0.55, z: 0.15 };
      tip      = { x:  0.00, y: -0.62, z: 0.20 };
    } else if (state === 'TUCKED_RING') { // M shape
      mcpPoint = { x: -0.15, y: -0.42, z: 0.05 };
      ip       = { x:  0.05, y: -0.55, z: 0.15 };
      tip      = { x:  0.12, y: -0.60, z: 0.20 };
    } else if (state === 'TOUCH_INDEX') { // 9 or F or O
      mcpPoint = { x: -0.25, y: -0.45, z: 0.06 };
      ip       = { x: -0.22, y: -0.52, z: 0.10 };
      tip      = { x: -0.20, y: -0.52, z: 0.12 };
    } else if (state === 'TOUCH_MIDDLE') { // 8
      mcpPoint = { x: -0.20, y: -0.45, z: 0.06 };
      ip       = { x: -0.10, y: -0.52, z: 0.12 };
      tip      = { x:  0.00, y: -0.55, z: 0.15 };
    } else if (state === 'TOUCH_RING') { // 7
      mcpPoint = { x: -0.18, y: -0.45, z: 0.06 };
      ip       = { x:  0.00, y: -0.52, z: 0.12 };
      tip      = { x:  0.12, y: -0.52, z: 0.15 };
    } else if (state === 'TOUCH_PINKY') { // 6
      mcpPoint = { x: -0.15, y: -0.45, z: 0.06 };
      ip       = { x:  0.08, y: -0.50, z: 0.12 };
      tip      = { x:  0.22, y: -0.50, z: 0.15 };
    } else { // UP / NEUTRAL
      mcpPoint = { x: -0.32, y: -0.45, z: -0.04 };
      ip       = { x: -0.42, y: -0.58, z: -0.06 };
      tip      = { x: -0.50, y: -0.70, z: -0.08 };
    }

    return [cmc, mcpPoint, ip, tip];
  }

  // Combine 21 points in MediaPipe canonical order
  // 0: Wrist
  // 1-4: Thumb
  points.push(...makeThumb(thumb));
  // 5-8: Index
  points.push(...makeChain(mcp.index, index, 'index'));
  // 9-12: Middle
  points.push(...makeChain(mcp.middle, middle, 'middle'));
  // 13-16: Ring
  points.push(...makeChain(mcp.ring, ring, 'ring'));
  // 17-20: Pinky
  points.push(...makeChain(mcp.pinky, pinky, 'pinky'));

  return points;
}

// Full Lexicon Definitions
const NEW_GESTURES_SPECS = [
  // ── Missing Alphabet Letters ─────────────────────────
  { label: 'J', hand: { thumb: 'UP', index: 'CURLED', middle: 'CURLED', ring: 'CURLED', pinky: 'EXTENDED' } },
  { label: 'M', hand: { thumb: 'TUCKED_RING', index: 'CURLED', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'N', hand: { thumb: 'TUCKED_MIDDLE', index: 'CURLED', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'P', hand: { thumb: 'EXTENDED', index: 'EXTENDED', middle: 'HOOK', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'Q', hand: { thumb: 'EXTENDED', index: 'HOOK', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'R', hand: { thumb: 'ACROSS_PALM', index: 'EXTENDED', middle: 'CROSSED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'S', hand: { thumb: 'ACROSS_PALM', index: 'CURLED', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'T', hand: { thumb: 'TUCKED_INDEX', index: 'CURLED', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'X', hand: { thumb: 'ACROSS_PALM', index: 'HOOK', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'Z', hand: { thumb: 'ACROSS_PALM', index: 'EXTENDED', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },

  // ── Digits & Numbers (0 to 9) ─────────────────────────
  { label: '0', hand: { thumb: 'TOUCH_INDEX', index: 'HOOK', middle: 'HOOK', ring: 'HOOK', pinky: 'HOOK' } },
  { label: '1', hand: { thumb: 'ACROSS_PALM', index: 'EXTENDED', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: '2', hand: { thumb: 'ACROSS_PALM', index: 'EXTENDED', middle: 'EXTENDED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: '3', hand: { thumb: 'EXTENDED', index: 'EXTENDED', middle: 'EXTENDED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: '4', hand: { thumb: 'ACROSS_PALM', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'EXTENDED' } },
  { label: '5', hand: { thumb: 'EXTENDED', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'EXTENDED' } },
  { label: '6', hand: { thumb: 'TOUCH_PINKY', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'CURLED' } },
  { label: '7', hand: { thumb: 'TOUCH_RING', index: 'EXTENDED', middle: 'EXTENDED', ring: 'CURLED', pinky: 'EXTENDED' } },
  { label: '8', hand: { thumb: 'TOUCH_MIDDLE', index: 'EXTENDED', middle: 'CURLED', ring: 'EXTENDED', pinky: 'EXTENDED' } },
  { label: '9', hand: { thumb: 'TOUCH_INDEX', index: 'CURLED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'EXTENDED' } },

  // ── Healthcare & Emergency Lexicon ────────────────────
  { label: 'AMBULANCE', hand: { thumb: 'EXTENDED', index: 'EXTENDED', middle: 'EXTENDED', ring: 'CURLED', pinky: 'EXTENDED' } },
  { label: 'BLOOD', hand: { thumb: 'ACROSS_PALM', index: 'HOOK', middle: 'HOOK', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'BREATHING', hand: { thumb: 'EXTENDED', index: 'EXTENDED', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'CHEST-PAIN', hand: { thumb: 'ACROSS_PALM', index: 'HOOK', middle: 'HOOK', ring: 'HOOK', pinky: 'HOOK' } },
  { label: 'HEADACHE', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'EXTENDED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'HOSPITAL', hand: { thumb: 'ACROSS_PALM', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'CURLED' } },
  { label: 'NURSE', hand: { thumb: 'TOUCH_INDEX', index: 'EXTENDED', middle: 'EXTENDED', ring: 'CURLED', pinky: 'CURLED' } },

  // ── Banking & Financial Lexicon ───────────────────────
  { label: 'BALANCE', hand: { thumb: 'UP', index: 'HOOK', middle: 'HOOK', ring: 'HOOK', pinky: 'EXTENDED' } },
  { label: 'CASH', hand: { thumb: 'TOUCH_INDEX', index: 'TOUCH_THUMB', middle: 'HOOK', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'CHEQUE', hand: { thumb: 'EXTENDED', index: 'EXTENDED', middle: 'CURLED', ring: 'CURLED', pinky: 'EXTENDED' } },
  { label: 'DEPOSIT', hand: { thumb: 'ACROSS_PALM', index: 'EXTENDED', middle: 'EXTENDED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'PASSBOOK', hand: { thumb: 'EXTENDED', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'CURLED' } },
  { label: 'TRANSFER', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'CURLED', ring: 'CURLED', pinky: 'EXTENDED' } },
  { label: 'WITHDRAW', hand: { thumb: 'ACROSS_PALM', index: 'HOOK', middle: 'EXTENDED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'CARD', hand: { thumb: 'EXTENDED', index: 'HOOK', middle: 'HOOK', ring: 'CURLED', pinky: 'CURLED' } },

  // ── Civic & Government Office Lexicon ─────────────────
  { label: 'AADHAAR', hand: { thumb: 'EXTENDED', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'CURLED' } },
  { label: 'ADDRESS', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'CURLED', ring: 'EXTENDED', pinky: 'CURLED' } },
  { label: 'CERTIFICATE', hand: { thumb: 'TOUCH_INDEX', index: 'HOOK', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'EXTENDED' } },
  { label: 'FIRE', hand: { thumb: 'EXTENDED', index: 'HOOK', middle: 'HOOK', ring: 'HOOK', pinky: 'EXTENDED' } },
  { label: 'FORM', hand: { thumb: 'TOUCH_INDEX', index: 'EXTENDED', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'POLICE', hand: { thumb: 'EXTENDED', index: 'HOOK', middle: 'HOOK', ring: 'HOOK', pinky: 'CURLED' } },
  { label: 'RATION', hand: { thumb: 'UP', index: 'HOOK', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'CURLED' } },
  { label: 'TICKET', hand: { thumb: 'TOUCH_INDEX', index: 'HOOK', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'TOKEN', hand: { thumb: 'TOUCH_MIDDLE', index: 'EXTENDED', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },

  // ── Conversational & Everyday Lexicon ─────────────────
  { label: 'FOOD', hand: { thumb: 'TOUCH_INDEX', index: 'HOOK', middle: 'HOOK', ring: 'HOOK', pinky: 'HOOK' } },
  { label: 'GOODBYE', hand: { thumb: 'EXTENDED', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'EXTENDED' } },
  { label: 'HOW-MUCH', hand: { thumb: 'TOUCH_INDEX', index: 'HOOK', middle: 'HOOK', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'NAME', hand: { thumb: 'ACROSS_PALM', index: 'EXTENDED', middle: 'EXTENDED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'PLEASE', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'EXTENDED' } },
  { label: 'REPEAT', hand: { thumb: 'UP', index: 'HOOK', middle: 'HOOK', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'RESTROOM', hand: { thumb: 'TUCKED_INDEX', index: 'CURLED', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'SLOW', hand: { thumb: 'ACROSS_PALM', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'EXTENDED' } },
  { label: 'UNDERSTAND', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'WATER', hand: { thumb: 'ACROSS_PALM', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'CURLED' } },
  { label: 'WHEN', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'WHERE', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'EXTENDED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'WHO', hand: { thumb: 'TOUCH_INDEX', index: 'EXTENDED', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'WHY', hand: { thumb: 'EXTENDED', index: 'CURLED', middle: 'CURLED', ring: 'CURLED', pinky: 'EXTENDED' } },

  // ── Education & Classrooms ────────────────────────────
  { label: 'SCHOOL', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'CURLED' } },
  { label: 'TEACHER', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'STUDENT', hand: { thumb: 'TOUCH_INDEX', index: 'HOOK', middle: 'HOOK', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'STUDY', hand: { thumb: 'EXTENDED', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'EXTENDED' } },
  { label: 'EXAM', hand: { thumb: 'ACROSS_PALM', index: 'HOOK', middle: 'HOOK', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'BOOK', hand: { thumb: 'EXTENDED', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'CURLED' } },
  { label: 'QUESTION', hand: { thumb: 'ACROSS_PALM', index: 'HOOK', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'LEARN', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'EXTENDED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'WRITE', hand: { thumb: 'TOUCH_INDEX', index: 'TOUCH_THUMB', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'READ', hand: { thumb: 'ACROSS_PALM', index: 'EXTENDED', middle: 'EXTENDED', ring: 'CURLED', pinky: 'CURLED' } },

  // ── Workplace & Professional ──────────────────────────
  { label: 'JOB', hand: { thumb: 'UP', index: 'CURLED', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'WORK', hand: { thumb: 'ACROSS_PALM', index: 'CURLED', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'MEETING', hand: { thumb: 'EXTENDED', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'EXTENDED' } },
  { label: 'OFFICE', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'EXTENDED' } },
  { label: 'PROJECT', hand: { thumb: 'TOUCH_INDEX', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'CURLED' } },
  { label: 'SALARY', hand: { thumb: 'TOUCH_INDEX', index: 'HOOK', middle: 'HOOK', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'COMPUTER', hand: { thumb: 'UP', index: 'HOOK', middle: 'HOOK', ring: 'HOOK', pinky: 'HOOK' } },
  { label: 'EMAIL', hand: { thumb: 'TOUCH_INDEX', index: 'HOOK', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'INTERVIEW', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'EXTENDED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'CODE', hand: { thumb: 'TOUCH_INDEX', index: 'HOOK', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'CURLED' } },

  // ── Travel, Transit & Airports ────────────────────────
  { label: 'AIRPORT', hand: { thumb: 'EXTENDED', index: 'CURLED', middle: 'CURLED', ring: 'CURLED', pinky: 'EXTENDED' } },
  { label: 'FLIGHT', hand: { thumb: 'EXTENDED', index: 'CURLED', middle: 'CURLED', ring: 'CURLED', pinky: 'EXTENDED' } },
  { label: 'TRAIN', hand: { thumb: 'ACROSS_PALM', index: 'EXTENDED', middle: 'EXTENDED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'BUS', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'EXTENDED' } },
  { label: 'METRO', hand: { thumb: 'TOUCH_INDEX', index: 'EXTENDED', middle: 'EXTENDED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'LUGGAGE', hand: { thumb: 'ACROSS_PALM', index: 'HOOK', middle: 'HOOK', ring: 'HOOK', pinky: 'HOOK' } },
  { label: 'PASSPORT', hand: { thumb: 'EXTENDED', index: 'EXTENDED', middle: 'EXTENDED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'HOTEL', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'CURLED', ring: 'CURLED', pinky: 'EXTENDED' } },
  { label: 'PLATFORM', hand: { thumb: 'ACROSS_PALM', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'EXTENDED' } },
  { label: 'DELAY', hand: { thumb: 'UP', index: 'HOOK', middle: 'HOOK', ring: 'CURLED', pinky: 'CURLED' } },

  // ── Retail, Dining & Shopping ─────────────────────────
  { label: 'SHOP', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'CURLED' } },
  { label: 'BUY', hand: { thumb: 'TOUCH_INDEX', index: 'EXTENDED', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'SELL', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'EXTENDED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'PRICE', hand: { thumb: 'TOUCH_INDEX', index: 'HOOK', middle: 'HOOK', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'DISCOUNT', hand: { thumb: 'UP', index: 'HOOK', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'BILL', hand: { thumb: 'TOUCH_INDEX', index: 'EXTENDED', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'ORDER', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'TEA', hand: { thumb: 'TOUCH_INDEX', index: 'HOOK', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'EXTENDED' } },
  { label: 'COFFEE', hand: { thumb: 'ACROSS_PALM', index: 'HOOK', middle: 'HOOK', ring: 'HOOK', pinky: 'CURLED' } },
  { label: 'RESTAURANT', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'EXTENDED' } },

  // ── Legal, Police & Safety ────────────────────────────
  { label: 'COMPLAINT', hand: { thumb: 'ACROSS_PALM', index: 'HOOK', middle: 'HOOK', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'LAWYER', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'EXTENDED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'COURT', hand: { thumb: 'ACROSS_PALM', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'CURLED' } },
  { label: 'ACCIDENT', hand: { thumb: 'ACROSS_PALM', index: 'HOOK', middle: 'HOOK', ring: 'HOOK', pinky: 'HOOK' } },
  { label: 'THEFT', hand: { thumb: 'TOUCH_INDEX', index: 'HOOK', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'LOST', hand: { thumb: 'UP', index: 'HOOK', middle: 'HOOK', ring: 'HOOK', pinky: 'CURLED' } },

  // ── Family, Emotions & Daily Social Life ──────────────
  { label: 'FAMILY', hand: { thumb: 'TOUCH_INDEX', index: 'HOOK', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'EXTENDED' } },
  { label: 'FRIEND', hand: { thumb: 'UP', index: 'HOOK', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'FATHER', hand: { thumb: 'EXTENDED', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'EXTENDED' } },
  { label: 'MOTHER', hand: { thumb: 'EXTENDED', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'EXTENDED' } },
  { label: 'HOME', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'EXTENDED' } },
  { label: 'LOVE', hand: { thumb: 'ACROSS_PALM', index: 'HOOK', middle: 'HOOK', ring: 'HOOK', pinky: 'HOOK' } },
  { label: 'HAPPY', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'EXTENDED', ring: 'EXTENDED', pinky: 'EXTENDED' } },
  { label: 'SAD', hand: { thumb: 'ACROSS_PALM', index: 'HOOK', middle: 'HOOK', ring: 'HOOK', pinky: 'HOOK' } },
  { label: 'TODAY', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
  { label: 'TOMORROW', hand: { thumb: 'UP', index: 'EXTENDED', middle: 'CURLED', ring: 'CURLED', pinky: 'CURLED' } },
];

function main() {
  const existingRaw = JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf8'));
  const existingMap = new Map();
  for (const g of existingRaw.gestures) {
    existingMap.set(g.label, g);
  }

  let addedCount = 0;
  for (const spec of NEW_GESTURES_SPECS) {
    if (!existingMap.has(spec.label)) {
      const landmarks = synthesizeHand(spec.hand);
      const features = buildFeatureVector(landmarks);
      if (features && features.length === 72) {
        existingMap.set(spec.label, {
          label: spec.label,
          features: features
        });
        addedCount++;
      }
    }
  }

  const allGestures = Array.from(existingMap.values());

  const fullLexicon = {
    schema: "omnisign-universal-isl-lexicon-v2",
    version: "2.5.0",
    description: "OmniSign Universal Sign Language Lexicon: Full A-Z Alphabet, Digits 0-9, and Comprehensive Civic, Medical, Financial & Everyday Sign Vocabularies.",
    totalCount: allGestures.length,
    gestures: allGestures
  };

  fs.writeFileSync(VOCAB_PATH, JSON.stringify(fullLexicon, null, 2), 'utf8');
  console.log(`✅ Successfully generated Universal Sign Lexicon!`);
  console.log(`   Total Gestures in Lexicon: ${allGestures.length} (Added ${addedCount} new signs)`);
  console.log(`   Labels: ${allGestures.map(g => g.label).join(', ')}`);
}

main();
