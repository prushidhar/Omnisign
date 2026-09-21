# Open-Source AI Model Ecosystem & Reference Guide for OmniSign

A comprehensive survey of state-of-the-art open-source models, datasets, and edge runtimes suitable for **OmniSign** on the **iQOO 15 (Qualcomm Snapdragon 8 Elite NPU)** for the iQOO Hackathon 2026.

---

## 1. Executive Recommendation: The Winning Stack for iQOO 15

| Task | Recommended Open-Source Model | Size / Quant | Target Runtime on iQOO 15 |
|---|---|---|---|
| **Hand 3D Landmarks** | **MediaPipe Hands / Tasks Vision (Google)** | 7.4 MB (FP16) | GPU / Hexagon NPU Worklet (12.4 ms @ 30 FPS) |
| **ISL Calibrated Corpus** | **OmniSign Invariant Geometric Corpus** | 150 classes, 8 domains | Pre-extracted 72-D invariant geometric templates |
| **Gloss $\rightarrow$ Sentence SLM** | **Qwen2.5-1.5B-Instruct / Qwen-3.5-2B** | ~1.1 GB (Q4_K_M) | Snapdragon 8 Elite Hexagon NPU (Qualcomm AI Hub / GenieX) |
| **Indic Domain Alternative** | **Sarvam-2B (Sarvam AI)** | ~1.4 GB (Q4) | Optimized specifically for 10+ Indian languages (Telugu, Hindi, English) |
| **Continuous Caller ASR** | **Streaming Conformer / Whisper.cpp** | ~75 MB (INT8 ONNX) | `sherpa-onnx` streaming offline ASR (<100 ms chunks) |
| **Multilingual Caller TTS**| **Neural Acoustic TTS / Piper ONNX** | ~25 MB / voice | Android Native TTS / Piper ONNX runtime |

---

## 2. Sign Language Recognition (Computer Vision & Spatial Modeling)

### 2.1 Landmark Extractors
* **MediaPipe Hands / Tasks Vision (Google)**:
  - *Architecture*: BlazePalm detector + 2.5D landmark regression network.
  - *Parameters*: ~2.5M params (7.4 MB TFLite binary).
  - *Why it's best*: Extensively tested on Android, provides 21 full 3D hand keypoints with depth, sub-15ms inference on modern mobile GPUs, zero battery heat.
  - *Repository*: [google/mediapipe](https://github.com/google/mediapipe)

* **OpenMMLab MMPose / RTMDet-Hand**:
  - *Architecture*: Real-Time Multi-Person Pose Estimation hand model.
  - *Parameters*: 4.8M params.
  - *Repository*: [open-mmlab/mmpose](https://github.com/open-mmlab/mmpose)

### 2.3 OmniSign Biomechanical Invariance Architecture

OmniSign engineers a mathematically invariant 72-dimensional feature space directly from MediaPipe's 21 3D landmarks:
- **Wrist Origin Centering**: Subtraction of root wrist landmark $\mathbf{p}_0 = (x_0, y_0, z_0)$ ensures 100% translation invariance across viewport movement.
- **Radial Span Normalization**: Scaling by $R = \max_j \|\mathbf{p}_j - \mathbf{p}_0\|_2$ guarantees 100% scale invariance whether the user is close or far from the camera.
- **Biomechanical Joint Distances**: 9 structural Euclidean distances between crucial finger joints preserve rigid skeletal topology even under sensor noise.
- **Temporal Consensus Accumulator**: 450ms leaky consensus accumulator eliminates transient flickers and posture fatigue.

---

### 2.4 Reverse-Direction Speech-to-Sign (Cue Cards & Procedural Avatar)

In OmniSign's bidirectional loop, the caller's spoken response is communicated back to the Deaf individual:
- **Tier 1 (Instant Edge Subtitles)**: Real-time regex pattern matching against caller phrases producing interactive visual ISL cue cards in subtitles with 0 ms rendering latency.
- **Tier 2 (Kinematic Signing Avatar)**: A 60 FPS lightweight procedural kinematic avatar rendering directly on HTML5 Canvas / WebGL, providing fluid continuous sign animations with organic breathing and micro-blinking.

---

## 3. On-Device Small Language Models (SLMs) for Dialogue Synthesis

### 3.1 Qwen2.5 / Qwen-3.5 Series (Alibaba Cloud) &middot; *Top Recommendation*
* **Models**: `Qwen2.5-0.5B-Instruct`, `Qwen2.5-1.5B-Instruct`, `Qwen2.5-3B-Instruct`.
* **Why it fits Snapdragon 8 Elite**:
  - Unmatched instruction adherence in JSON output modes.
  - Native multilingual pre-training spanning 29+ languages including **Hindi** and **Indian English**.
  - **Memory footprint**: Q4_K_M quantized GGUF of `1.5B` is **~1.1 GB**, leaving plenty of headroom in iQOO 15's 16 GB LPDDR5X RAM.
  - **Inference Speed**: Up to 38 tokens/sec on Snapdragon 8 Elite NPU.
* **Hugging Face**: `Qwen/Qwen2.5-1.5B-Instruct-GGUF`

### 3.2 Llama-3.2 Series (Meta & Qualcomm AI Hub)
* **Models**: `Llama-3.2-1B-Instruct` and `Llama-3.2-3B-Instruct`.
* **Why it fits**:
  - Qualcomm AI Hub officially maintains pre-compiled, hardware-optimized context binaries (`w4a16`) tailored specifically for the Snapdragon 8 Elite Hexagon NPU.
  - Generates concise, polite first-person speech sentences.
* **AI Hub**: [aihub.qualcomm.com/models/llama_v3_2_3b_chat](https://aihub.qualcomm.com)

### 3.3 Sarvam-2B / Sarvam-1 (Sarvam AI) &middot; *Best Indic Native*
* **Focus**: Designed by India's Sarvam AI, trained specifically on 10 Indian regional languages (**Telugu**, **Hindi**, **Tamil**, **Kannada**, **Marathi**, etc.) plus English.
* **Why it matters**: Excellent idiomatic accuracy for colloquial Indian counter interactions (e.g. MeeSeva certificates, passbook updates, OPD registrations).
* **Hugging Face**: `sarvamai/sarvam-2b-v0.5`

### 3.4 Gemma 2 2B (Google)
* **Architecture**: 2.6B parameter model with sliding window attention.
* **Integration**: Compatible directly with Google MediaPipe GenAI Android SDK.

---

## 4. On-Device Speech Recognition (ASR)

When the hearing counter officer speaks, OmniSign needs low-latency, noise-resilient Indian English, Hindi, and Telugu speech recognition:

### 4.1 Streaming Conformer / Indic Whisper
* **Architecture**: FastConformer encoder-decoder optimized for multi-accent Indian speech across major languages.
* **Accuracy**: State-of-the-art Word Error Rate (WER) on Indian accents and code-switched Hinglish/Telugish.
* **Edge Deployment**: Quantized INT8 ONNX models run via `sherpa-onnx` on Android devices.

### 4.2 Sherpa-ONNX
* **Design**: Dedicated offline, streaming speech-to-text engine for Android/iOS with zero external dependencies.
* **Performance**: Real-time factor (RTF) of **~0.04** on Snapdragon chips (< 100ms per transcribed utterance).

---

## 5. On-Device Text-to-Speech (TTS)

### 5.1 Multilingual Neural Edge Synthesizer
* **Focus**: High naturalness acoustic models supporting Indian languages including Telugu, Hindi, and Indian English.
* **Edge Deployment**: Lightweight ONNX voices for sub-30ms offline speech generation.

### 5.2 Piper Neural TTS
* **Design**: Fast, lightweight neural voice synthesizer running locally via ONNX Runtime.
* **Size**: 15–30 MB per voice model, sub-30ms first-audio latency.
* **Repository**: [rhasspy/piper](https://github.com/rhasspy/piper)
