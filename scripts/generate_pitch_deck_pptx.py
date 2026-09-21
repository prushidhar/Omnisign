# scripts/generate_healthtech_pptx.py
"""
Generates an executive PowerPoint Pitch Deck (.pptx) for OmniSign:
Instant Sign-to-Voice Call & Directions Assistant for Non-Talkable Individuals
"""
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
import shutil, os

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
blank_layout = prs.slide_layouts[6]

NAVY = RGBColor(15, 23, 42)
BLUE = RGBColor(37, 99, 235)
LIGHT_BLUE = RGBColor(219, 234, 254)
DARK = RGBColor(30, 41, 59)
MUTED = RGBColor(100, 116, 139)
WHITE = RGBColor(255, 255, 255)
GREEN = RGBColor(5, 150, 105)

def add_header(slide, title_text, category_text="iQOO HACKATHON 2026 • ACCESSIBILITY & ASSISTIVE TECHNOLOGY"):
    # Header badge
    tb_cat = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.4))
    p_cat = tb_cat.text_frame.paragraphs[0]
    p_cat.text = category_text.upper()
    p_cat.font.size = Pt(11)
    p_cat.font.bold = True
    p_cat.font.color.rgb = BLUE

    # Title
    tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.7), Inches(0.7))
    p_title = tb_title.text_frame.paragraphs[0]
    p_title.text = title_text
    p_title.font.size = Pt(24)
    p_title.font.bold = True
    p_title.font.color.rgb = NAVY

# ── SLIDE 1: Title Slide ─────────────────────────────────────────────────────
s1 = prs.slides.add_slide(blank_layout)

bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
bg1.fill.solid()
bg1.fill.fore_color.rgb = NAVY
bg1.line.color.rgb = NAVY

tb1 = s1.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(11.3), Inches(4.0))
tf1 = tb1.text_frame

p1 = tf1.paragraphs[0]
p1.text = "OmniSign"
p1.font.size = Pt(50)
p1.font.bold = True
p1.font.color.rgb = WHITE

p2 = tf1.add_paragraph()
p2.text = "Instant Sign-to-Voice Call & Directions Assistant for Non-Talkable Individuals"
p2.font.size = Pt(22)
p2.font.bold = True
p2.font.color.rgb = RGBColor(96, 165, 250)
p2.space_before = Pt(10)

p3 = tf1.add_paragraph()
p3.text = "Solving the Everyday Delivery Call Crisis: Sign Directions to Riders & Drivers via Camera with Instant Loudspeaker Voice"
p3.font.size = Pt(14)
p3.font.color.rgb = RGBColor(203, 213, 225)
p3.space_before = Pt(14)

p4 = tf1.add_paragraph()
p4.text = "Track: Accessibility & Assistive Tech  •  Team OmniSign  •  100% On-Device Technology"
p4.font.size = Pt(13)
p4.font.bold = True
p4.font.color.rgb = RGBColor(52, 211, 153)
p4.space_before = Pt(24)

# ── SLIDE 2: Problem Statement ───────────────────────────────────────────────
s2 = prs.slides.add_slide(blank_layout)
add_header(s2, "The Everyday Reality: When a Delivery Rider Calls a Non-Talkable Person")

# 3 Problem Cards
cols = [
    ("🛵 The Phone Call Freezes", "A Zomato/Swiggy rider or cab driver calls from the gate: 'Bhaiya kahan aana hai? Gate 1 or 2? Which floor?' The mute individual cannot say a word. The rider assumes it's a prank or bad network, cancels the order, or leaves.", RGBColor(254, 226, 226), RGBColor(185, 28, 28)),
    ("📱 Typing Fails on Calls", "Typing long chat messages while a rider is actively navigating traffic on a two-wheeler is impossible. Riders require fast, verbal directions and do not check app messaging.", RGBColor(254, 243, 199), RGBColor(180, 83, 9)),
    ("🚫 Zero Daily Autonomy", "For routine parcels, food deliveries, cab arrivals, and couriers, non-vocal individuals are forced to rely on hearing relatives or neighbors to speak for them on basic phone calls.", RGBColor(241, 245, 249), RGBColor(71, 85, 105))
]

for i, (head, desc, bg_c, border_c) in enumerate(cols):
    left = Inches(0.8 + i * 4.0)
    card = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, Inches(1.8), Inches(3.7), Inches(4.8))
    card.fill.solid()
    card.fill.fore_color.rgb = bg_c
    card.line.color.rgb = border_c
    card.line.width = Pt(1.5)

    tb = s2.shapes.add_textbox(left + Inches(0.2), Inches(2.0), Inches(3.3), Inches(4.4))
    tf = tb.text_frame
    tf.word_wrap = True
    ph = tf.paragraphs[0]
    ph.text = head
    ph.font.size = Pt(18)
    ph.font.bold = True
    ph.font.color.rgb = border_c
    ph.space_after = Pt(14)

    pd = tf.add_paragraph()
    pd.text = desc
    pd.font.size = Pt(13)
    pd.font.color.rgb = DARK
    pd.line_spacing = 1.3

# ── SLIDE 3: Solution Architecture ───────────────────────────────────────────
s3 = prs.slides.add_slide(blank_layout)
add_header(s3, "OmniSign: Two-Way Phone Call & Directions Bridge")

card_sol1 = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.7), Inches(4.8))
card_sol1.fill.solid()
card_sol1.fill.fore_color.rgb = RGBColor(239, 246, 255)
card_sol1.line.color.rgb = BLUE
card_sol1.line.width = Pt(1.5)

tb_s1 = s3.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(5.3), Inches(4.4))
tf_s1 = tb_s1.text_frame
tf_s1.word_wrap = True
p_s1 = tf_s1.paragraphs[0]
p_s1.text = "CHANNEL 1: USER SIGNS ➔ PHONE SPEAKS ALOUD"
p_s1.font.size = Pt(15)
p_s1.font.bold = True
p_s1.font.color.rgb = BLUE

items1 = [
    "• User signs directions: GATE 2 + LEFT + FLOOR 2.",
    "• 42-Landmark Biomechanical Extraction + 72-D Invariant Vectors.",
    "• 450ms Leaky Consensus Accumulator (Snappy lock, zero tremor error).",
    "• Loudspeaker speaks aloud in crystal-clear natural speech: 'Please take a left at Gate 2 and come to the 2nd floor, flat 402.'",
    "• 1-Tap/Signed Quick Bar: Leave at Door, Wait 2m, Floor 2, Turn Left, OTP."
]
for item in items1:
    p = tf_s1.add_paragraph()
    p.text = item
    p.font.size = Pt(11.5)
    p.font.color.rgb = DARK
    p.space_before = Pt(8)

card_sol2 = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.8))
card_sol2.fill.solid()
card_sol2.fill.fore_color.rgb = RGBColor(236, 253, 245)
card_sol2.line.color.rgb = GREEN
card_sol2.line.width = Pt(1.5)

tb_s2 = s3.shapes.add_textbox(Inches(7.0), Inches(2.0), Inches(5.3), Inches(4.4))
tf_s2 = tb_s2.text_frame
tf_s2.word_wrap = True
p_s2 = tf_s2.paragraphs[0]
p_s2.text = "CHANNEL 2: CALLER SPEAKS ➔ SCREEN TRANSCRIBES"
p_s2.font.size = Pt(15)
p_s2.font.bold = True
p_s2.font.color.rgb = GREEN

items2 = [
    "• Continuous microphone ASR captures rider's spoken reply.",
    "• Displays instant high-contrast text: '[Caller]: Theek hai bhaiya, main lift se aa raha hoon.'",
    "• Non-talkable individual reads in real time and signs the next instruction.",
    "• 100% complete bidirectional phone conversation without saying a word!",
    "• Zero Cloud / 100% On-Device: Operates in elevators, basements, and deadzones."
]
for item in items2:
    p = tf_s2.add_paragraph()
    p.text = item
    p.font.size = Pt(11.5)
    p.font.color.rgb = DARK
    p.space_before = Pt(8)

# ── SLIDE 4: Empirical Benchmarks & Why We Win ────────────────────────────────
s4 = prs.slides.add_slide(blank_layout)
add_header(s4, "Empirical Validation & Unfair Technical Advantage")

# 4 Stat Metric Cards
stats = [
    ("35.17 µs", "Inference Pass Latency", "100x faster than cloud APIs"),
    ("100.0%", "Scale & Position Invariant", "0.5x to 2.0x camera distance"),
    ("150 ISL", "Collision-Free Classes", "Validated biomechanical lexicon"),
    ("71 / 71", "Jest Test Suite Passed", "Production-grade CI/CD integrity")
]

for i, (val, label, sub) in enumerate(stats):
    left = Inches(0.8 + i * 3.0)
    box = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, Inches(1.8), Inches(2.7), Inches(2.2))
    box.fill.solid()
    box.fill.fore_color.rgb = RGBColor(241, 245, 249)
    box.line.color.rgb = RGBColor(203, 213, 225)

    tb = s4.shapes.add_textbox(left + Inches(0.1), Inches(1.9), Inches(2.5), Inches(2.0))
    tf = tb.text_frame
    p_v = tf.paragraphs[0]
    p_v.text = val
    p_v.font.size = Pt(28)
    p_v.font.bold = True
    p_v.font.color.rgb = BLUE
    p_v.alignment = PP_ALIGN.CENTER

    p_l = tf.add_paragraph()
    p_l.text = label
    p_l.font.size = Pt(11)
    p_l.font.bold = True
    p_l.font.color.rgb = NAVY
    p_l.alignment = PP_ALIGN.CENTER
    p_l.space_before = Pt(4)

    p_s = tf.add_paragraph()
    p_s.text = sub
    p_s.font.size = Pt(9.5)
    p_s.font.color.rgb = MUTED
    p_s.alignment = PP_ALIGN.CENTER
    p_s.space_before = Pt(4)

# Bottom Deployment Banner
banner = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(4.4), Inches(11.7), Inches(2.2))
banner.fill.solid()
banner.fill.fore_color.rgb = NAVY
banner.line.color.rgb = NAVY

tb_b = s4.shapes.add_textbox(Inches(1.1), Inches(4.55), Inches(11.1), Inches(1.9))
tf_b = tb_b.text_frame
p_b1 = tf_b.paragraphs[0]
p_b1.text = "IMMEDIATE DEPLOYMENT READINESS & TRIAL BLUEPRINT"
p_b1.font.size = Pt(14)
p_b1.font.bold = True
p_b1.font.color.rgb = RGBColor(52, 211, 153)

p_b2 = tf_b.add_paragraph()
p_b2.text = "• Phase 1: Live single-phone web evaluation terminal operational today on http://localhost:3000\n• Phase 2: Offline React Native APK for iQOO 15 devices with Snapdragon NPU acceleration\n• Phase 3: Seamless deep-link integration with Zomato, Swiggy, Uber, Ola delivery & ride calls"
p_b2.font.size = Pt(12)
p_b2.font.color.rgb = RGBColor(226, 232, 240)
p_b2.space_before = Pt(6)
p_b2.line_spacing = 1.3

pptx_path = "OmniSign_Pitch_Deck.pptx"
prs.save(pptx_path)

desktop_dir = r"C:\Users\P RUSHIDHAR\OneDrive\Desktop"
mirror_dir = r"C:\Users\P RUSHIDHAR\OneDrive\Desktop\OmniSign-iQOO-Hackathon\OmniSign"

shutil.copy2(pptx_path, os.path.join(desktop_dir, pptx_path))
shutil.copy2(pptx_path, os.path.join(desktop_dir, "OmniSign_HealthTech_Pitch_Deck.pptx"))
if os.path.exists(mirror_dir):
    shutil.copy2(pptx_path, os.path.join(mirror_dir, pptx_path))
    shutil.copy2(pptx_path, os.path.join(mirror_dir, "OmniSign_HealthTech_Pitch_Deck.pptx"))

print(f"Generated PPTX and copied to Desktop: {os.path.join(desktop_dir, pptx_path)}")
