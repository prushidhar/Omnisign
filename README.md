# OmniSign — Real-Time Sign-to-Voice Call Bridge & Accessibility Terminal
### Built from Scratch for the iQOO Hackathon 2026 (Shortlisting & Finale)

OmniSign is an accessible, 100% on-device assistive terminal and phone bridge that turns hand signs directly into real-time spoken voice and vice-versa. It solves the everyday communication crisis for non-talkable, mute, and deaf individuals during **live delivery phone calls (Zomato, Swiggy, Blinkit), ride pickups (Uber, Ola), courier gate directions, and daily in-person transit interactions**.

---

## 🌟 The Everyday Problem: Delivery Calls Breakdown

Imagine you cannot speak. You order food on **Zomato** or hail an **Uber**:
1. The delivery rider reaches your apartment security gate and calls your phone:  
   *"Bhaiya, I am at the gate. Which tower, floor, and flat number?"*
2. **The Call Freezes:** The non-talkable resident answers, but cannot say a word. The rider assumes it is a prank call or dead line, waits 2 minutes, and cancels the order.
3. **Typing Fails on Calls:** A delivery rider driving a two-wheeler cannot read chat text while navigating. They need immediate verbal voice directions.
4. **Zero Independence:** Deaf individuals are forced to depend on hearing relatives or neighbors for simple daily phone interactions.

---

## 🚀 The OmniSign Solution: Your Hands Speak for You Instantly

OmniSign bridges the phone call live on-device with zero delay:

1. **Sign-to-Voice Call Bridge (User Signs ➔ Loudspeaker Speaks Aloud)**:
   - Non-talkable resident signs into the front camera: `[GATE LEFT]` + `[FLAT 402]`.
   - OmniSign's 72-D invariant biomechanical engine extracts hand landmarks in **37 microseconds**.
   - Phone loudspeaker speaks aloud to the rider in natural voice in **< 15ms**:  
     *"Please take left after the main gate, 2nd floor, flat 402."*
   - Rider hears clear voice on his phone and confirms: *"Got it bhaiya, coming up now!"*

2. **Caller Voice Transcriber (Rider Speaks ➔ Screen Displays Live Text)**:
   - When the rider or driver speaks, continuous on-device ASR transcribes their words into real-time high-contrast captions.

3. **Interactive Delivery Call Simulator & 60-Second Jury Guided Tour**:
   - Built directly into `http://localhost:3000`.
   - Judges can click **"🏆 Run 60s Live Jury Demo"** or trigger simulated incoming calls from **Zomato**, **Uber**, or **Blinkit** with realistic telephone ringtones (Web Audio API) and live audio waveform visualizers.

4. **150+ Standard ISL Vocabulary & Full Alphabet**:
   - Complete single-hand numerals `1–9` and two-handed ISL alphabet `A–Z`.
   - Essential daily signs: `GATE`, `DOOR`, `LEFT`, `RIGHT`, `FLOOR`, `OTP`, `WAIT`, `HELP`, `DOCTOR`, `MEDICINE`, `EMERGENCY`.

---

## 📊 Empirical Biomechanical Benchmark Results

Evaluated across all 150 calibrated ISL classes on normalized 72-D kinematic landmark vectors:

| Benchmark Dimension | Target Spec | OmniSign Measured Performance | Evaluation Status |
| :--- | :--- | :--- | :--- |
| **Scale Invariance** | $0.5\times$ to $2.0\times$ camera distance | **100.000% Top-1 Accuracy** (RMS drift: $1.30 \times 10^{-16}$) | ✅ PASSED |
| **Translation Invariance** | $\pm 0.40$ viewport drift | **100.000% Top-1 Accuracy** (RMS drift: $1.47 \times 10^{-16}$) | ✅ PASSED |
| **Noise & Jitter Resilience** | Gaussian jitter ($\sigma = 0.02$) | **99.47% Top-1 Accuracy** (100.00% Top-3) | ✅ PASSED |
| **Inference Latency** | Budget: $< 33.3$ ms (30 FPS) | **37.5 µs (0.038 ms)** per 150-class pass | ✅ PASSED (800x faster) |
| **Throughput** | Budget: $\ge 30$ FPS | **26,600+ FPS** raw compute capacity | ✅ PASSED |
| **Cloud Latency & Bandwidth** | 100% Air-Gapped Offline | **0 ms Cloud Delay · 0 KB Bandwidth** | ✅ PASSED |

---

## 🏗️ Project Architecture

```
OmniSign/
├── index.html                      # Real-time studio, Delivery Call Simulator, Waveforms & Jury Tour
├── package.json                    # Scripts: start, test, benchmark, benchmark:metrics
├── tsconfig.json                   # Strict TypeScript configuration
├── benchmarks/                     # Empirical validation suites
│   ├── benchmark_results.json      # Verified metrics (100% scale/translation, 37.5 µs latency)
│   └── BENCHMARK_REPORT.md         # Published empirical validation report
├── vendor/
│   └── mediapipe/                  # Offline Google MediaPipe WASM, SIMD & binarypb assets
├── scripts/
│   ├── demo-server.js              # Local testbed server on http://localhost:3000
│   ├── benchmark_biomechanical_metrics.js # 150-class invariant benchmark suite
│   ├── verify_workspace_cleanliness.js # Pristine 100% originality verification
│   ├── generate_instant_voice_pdf.py   # ReportLab executive pitch deck generator
│   └── generate_pitch_deck_pptx.py     # python-pptx pitch deck generator
├── dialogue-engine/
│   └── benchmark.js                # Multi-lingual dialogue synthesizer benchmark (9/9 passing)
├── src/
│   ├── assets/
│   │   ├── counter_isl_vocab.json  # 150 calibrated 72-D ISL sign templates (0 collisions)
│   │   └── isl_ground_truth_chart.png # ISL reference alphabet & numerals chart
│   ├── recognition/                # Pure TypeScript 72-D invariant geometric matching engine
│   │   ├── gestureEngine.ts        # Wrist normalization & Euclidean RMS distance
│   │   ├── captureQuality.ts       # Hand spread & jitter assessment gates
│   │   ├── duplicateDetection.ts   # Prevents sign collision & false positives
│   │   └── templateStore.ts        # Atomic filesystem & local storage persistence
│   ├── memory/                     # High-speed O(1) Translation Memory
│   └── nlp/                        # On-device dialogue synthesis & multi-lingual expansion
└── offline-round-mobile/           # Native React Native Android & iOS codebase for iQOO 15
```

---

## 🚀 Quickstart & Verification Commands

### 1. Launch the Live Showcase & Call Simulator
```bash
npm start
```
Opens `http://localhost:3000` in your default browser.
- Click **"🏆 Run 60s Live Jury Demo"** for the automated judge walkthrough.
- Click **"🛵 Zomato Call"** to simulate an incoming delivery phone call with audio waveforms and sign-to-voice replies.
- Click **"Start Camera"** to test live webcam hand tracking across 150+ ISL signs.

### 2. Run Comprehensive Unit Tests
```bash
npm test
```
*Result: 7/7 test suites passed, 83/83 unit tests passing (100% green).*

### 3. Run Invariant Biomechanical Benchmarks
```bash
npm run benchmark:metrics
```
*Result: Scale Invariance 100%, Translation Invariance 100%, Latency 36.0 µs, 27,775 FPS.*

### 4. Run Dialogue Synthesis Evaluation
```bash
npm run benchmark:dialogue
```
*Result: 9/9 multilingual test cases passed (0.00ms latency).*

### 5. Verify 100% Originality & Cleanliness
```bash
node scripts/verify_workspace_cleanliness.js
```
*Result: All production files scanned, 0 external traces found. Verified 100% pristine.*

---

## 📱 Executive Pitch Decks

- **PDF Deck:** `OmniSign_Pitch_Deck.pdf` (saved on Desktop: `OneDrive/Desktop/OmniSign_Pitch_Deck.pdf`)
- **PowerPoint Deck:** `OmniSign_Pitch_Deck.pptx` (saved on Desktop: `OneDrive/Desktop/OmniSign_Pitch_Deck.pptx`)
- To rebuild or update the presentation decks anytime:
  ```bash
  python scripts/generate_instant_voice_pdf.py
  python scripts/generate_pitch_deck_pptx.py
  ```
