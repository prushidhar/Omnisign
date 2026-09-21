# OmniSign &middot; Training, Data Augmentation & Model Calibration Pipeline

This document details the data curation, landmark feature extraction, geometric augmentation, and zero-shot calibration pipelines for Indian Sign Language (ISL) within OmniSign.

---

## 1. Vocabulary Architecture

OmniSign provides two complementary lexical tiers:

### Tier A: Full ISL Manual Alphabet (Fingerspelling A–Z)
Enables precise spelling of proper nouns, medicines, doctor names, bank branch codes, and citizen names:
$$\text{Tokens}: \{\text{A}, \text{B}, \text{C}, \text{D}, \text{E}, \dots, \text{Z}\}$$

### Tier B: High-Frequency Public Counter Lexicon (36+ Signs)
Covers core transactional and emergency communications across public counters:
- **Hospital OPD & Emergency**: `HELP`, `MEDICINE`, `PRESCRIPTION`, `DOCTOR`, `PAIN`, `APPOINTMENT`, `EMERGENCY`, `FEVER`, `INJECTION`, `TEST`, `REPORT`, `ADMIT`.
- **Banking & Post Office**: `ACCOUNT`, `MONEY`, `PASSBOOK`, `DEPOSIT`, `WITHDRAW`, `CHEQUE`, `BALANCE`, `TRANSFER`, `BRANCH`, `CARD`, `LOAN`.
- **Civic & General Service**: `YES`, `NO`, `THANK-YOU`, `PLEASE`, `WAIT`, `REPEAT`, `UNDERSTAND`, `WHERE`, `FORM`, `SIGNATURE`, `TOKEN`.

---

## 2. Landmark Data Extraction Pipeline

```
Raw High-Resolution ISL Video / Camera Stream
                     │
                     ▼
MediaPipe Hands Pipeline (Palmar Detection + 2.5D Regression)
                     │
                     ▼
21 3D Landmark Cartesian Coordinates { (x, y, z)_i }
                     │
                     ▼
Quality Gate Filter (handSpread >= 0.15, maxJitter <= 0.08)
                     │
                     ▼
Wrist-Relative Coordinate Translation (p_i - p_0)
                     │
                     ▼
Maximal Radial Normalization (scale s = max ||p_i - p_0||)
                     │
                     ▼
9 Invariant Non-Linear Inter-Digit Geodesics
                     │
                     ▼
72-Dimensional Invariant Metric Embedding
```

---

## 3. Data Augmentation Strategy

To ensure robust matching across diverse citizen hand anatomies and camera angles, training templates undergo synthetic geometric augmentation:

1. **Gaussian Landmark Perturbation**:
   $$\mathbf{p}_{\text{aug}} = \mathbf{p} + \mathcal{N}(0, \sigma^2 \mathbf{I}), \quad \sigma = 0.012$$
   Simulates natural minor tremor and optical sensor noise.
2. **Radial Scale Perturbations**:
   $$\mathbf{p}_{\text{scaled}} = \mathbf{p} \times \alpha, \quad \alpha \sim \mathcal{U}(0.85, 1.15)$$
   Tests resilience to hand size variations.
3. **Planar Rotation Transform**:
   $$\begin{bmatrix} x' \\ y' \end{bmatrix} = \begin{bmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{bmatrix} \begin{bmatrix} x \\ y \end{bmatrix}, \quad \theta \sim \mathcal{U}(-12^\circ, +12^\circ)$$
   Guarantees recognition tolerance for citizens signing with slight wrist tilt.

---

## 4. On-Device Zero-Shot Calibration Protocol

When a Deaf citizen encounters a domain-specific sign not in the bundled lexicon (e.g. an uncommon regional hospital term):
1. **Enrollment Gesture Hold**: The citizen holds the new sign inside `SignGuideCircle`.
2. **Quality Verification**: `assessCapture` inspects 30 frames across the hold window. If stable and well-proportioned, the capture is approved.
3. **Prototype Averaging**: Three repetitions are captured, normalized into 72-D vectors, and averaged into a centroid prototype:
   $$\mathbf{\mu}_{\text{proto}} = \frac{1}{3} \sum_{k=1}^3 \mathbf{\Phi}_k$$
4. **Collision Check**: `classifyGestureSave` scans both custom and bundled registries. If no conflict exists, the prototype is immediately committed to `omnisign_user_gestures.json`.
5. **Instant Recognition**: The gesture is instantly active on the desk terminal without requiring network connectivity, cloud fine-tuning, or app compilation.
