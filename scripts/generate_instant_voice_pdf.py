# scripts/generate_instant_voice_pdf.py
"""
Generates an executive Pitch Deck PDF for OmniSign:
Instant Voice & Call Bridge for Non-Talkable Individuals (Zomato/Swiggy, Cabs, Daily Calls & Directions)
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
import shutil, os

pdf_path = "OmniSign_Pitch_Deck.pdf"
doc = SimpleDocTemplate(
    pdf_path,
    pagesize=letter,
    leftMargin=40,
    rightMargin=40,
    topMargin=40,
    bottomMargin=40
)

styles = getSampleStyleSheet()

NAVY = colors.HexColor("#0f172a")
PRIMARY = colors.HexColor("#2563eb")
ACCENT = colors.HexColor("#f59e0b")
SUCCESS = colors.HexColor("#059669")
DARK = colors.HexColor("#1e293b")
MUTED = colors.HexColor("#64748b")
LIGHT_BG = colors.HexColor("#f8fafc")
BORDER = colors.HexColor("#cbd5e1")

title_style = ParagraphStyle(
    'DocTitle', parent=styles['Normal'],
    fontName='Helvetica-Bold', fontSize=24, leading=28,
    textColor=PRIMARY, spaceAfter=4
)
subtitle_style = ParagraphStyle(
    'DocSubTitle', parent=styles['Normal'],
    fontName='Helvetica', fontSize=12, leading=16,
    textColor=MUTED, spaceAfter=12
)
h1_style = ParagraphStyle(
    'SectionH1', parent=styles['Normal'],
    fontName='Helvetica-Bold', fontSize=14, leading=18,
    textColor=NAVY, spaceBefore=12, spaceAfter=6
)
body_style = ParagraphStyle(
    'BodyDark', parent=styles['Normal'],
    fontName='Helvetica', fontSize=9.5, leading=13.5,
    textColor=DARK, spaceAfter=6
)
bullet_style = ParagraphStyle(
    'BulletDark', parent=styles['Normal'],
    fontName='Helvetica', fontSize=9.2, leading=13,
    textColor=DARK, leftIndent=14, spaceAfter=4
)
table_header_style = ParagraphStyle(
    'TableHeader', parent=styles['Normal'],
    fontName='Helvetica-Bold', fontSize=8.5, leading=11,
    textColor=colors.white
)
table_cell_style = ParagraphStyle(
    'TableCell', parent=styles['Normal'],
    fontName='Helvetica', fontSize=8.5, leading=11,
    textColor=DARK
)
table_cell_bold = ParagraphStyle(
    'TableCellBold', parent=styles['Normal'],
    fontName='Helvetica-Bold', fontSize=8.5, leading=11,
    textColor=NAVY
)

story = []

# ── PAGE 1: TITLE & THE EVERYDAY PROBLEM ─────────────────────────────────────
story.append(Paragraph("OmniSign", title_style))
story.append(Paragraph("Instant Voice & Call Bridge for Non-Talkable Individuals • Real-Time Sign-to-Voice & 2-Way Phone Assistant", subtitle_style))
story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceAfter=12))

badge_data = [
    [
        Paragraph("<b>INNOVATION:</b> Instant Sign-to-Voice Call Assistant", table_cell_style),
        Paragraph("<b>USERS:</b> Non-Talkable, Mute & Deaf Citizens", table_cell_bold),
        Paragraph("<b>LATENCY:</b> < 15ms On-Device Edge Engine", table_cell_style)
    ]
]
t_badge = Table(badge_data, colWidths=[200, 180, 152])
t_badge.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
    ('BOX', (0,0), (-1,-1), 1, BORDER),
    ('PADDING', (0,0), (-1,-1), 6),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
story.append(t_badge)
story.append(Spacer(1, 10))

story.append(Paragraph("1. The Everyday Reality: A Zomato Delivery Guy Calls a Non-Talkable Person", h1_style))
story.append(Paragraph(
    "Imagine you cannot speak. You order food on <b>Zomato</b> or a ride on <b>Uber</b>. "
    "The delivery rider arrives at your society gate and calls you: <i>'Bhaiya kahan aana hai? Gate 1 or Gate 2? Which floor?'</i>",
    body_style
))
story.append(Paragraph("<b>The Frustrating Breakdown:</b>", h1_style))
story.append(Paragraph("• <b>The Call Freezes:</b> The rider speaks, but the mute person cannot say a word into the phone. The rider thinks it's a prank call or poor network, cancels the order, or drives away.", bullet_style))
story.append(Paragraph("• <b>Slow Typing Doesn't Work on Calls:</b> Typing long chat messages while someone is on an active phone call or driving a two-wheeler is impossible.", bullet_style))
story.append(Paragraph("• <b>Zero Independence:</b> For simple daily deliveries, courier pickups, and cab arrivals, non-vocal individuals must constantly rely on hearing family members to speak for them.", bullet_style))
story.append(Spacer(1, 10))

story.append(Paragraph("2. The OmniSign Solution: Your Hands Speak for You Instantly", h1_style))
story.append(Paragraph(
    "OmniSign turns any smartphone into an <b>instant vocal mouth</b> for non-talkable individuals. "
    "When a delivery driver, cab driver, or caller is on the line, the user simply makes hand signs in front of their front camera:",
    body_style
))

channel_data = [
    [
        Paragraph("<b>USER SIGNS ➔ PHONE SPEAKS ALOUD</b>", table_header_style),
        Paragraph("<b>CALLER SPEAKS ➔ SCREEN TRANSCRIBES</b>", table_header_style)
    ],
    [
        Paragraph(
            "• User signs: <b>GATE 2</b> + <b>LEFT</b> + <b>FLOOR 2</b>.<br/>"
            "• OmniSign detects the signs in <b>35 microseconds</b>.<br/>"
            "• Phone loudspeaker speaks aloud in clear natural voice:<br/>"
            "  <i>'Please take a left at Gate 2 and come to the 2nd floor, flat 402.'</i><br/>"
            "• Quick 1-tap direction chips for instant delivery responses.",
            body_style
        ),
        Paragraph(
            "• Delivery rider speaks into the call: <i>'Theek hai bhaiya, main lift se aa raha hoon.'</i><br/>"
            "• Continuous microphone ASR captures the speech.<br/>"
            "• Displays instant high-contrast text on screen:<br/>"
            "  <b>[Caller / Rider]: 'Theek hai bhaiya, main lift se aa raha hoon.'</b><br/>"
            "• 100% complete two-way phone conversation without saying a word!",
            body_style
        )
    ]
]
t_channel = Table(channel_data, colWidths=[266, 266])
t_channel.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), PRIMARY),
    ('BACKGROUND', (0,1), (-1,1), LIGHT_BG),
    ('BOX', (0,0), (-1,-1), 1, BORDER),
    ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER),
    ('PADDING', (0,0), (-1,-1), 8),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
]))
story.append(t_channel)

story.append(PageBreak())

# ── PAGE 2: CORE TECHNICAL BENCHMARKS & VOCABULARY ──────────────────────────
story.append(Paragraph("3. Technical Engine: Real-Time Biomechanics & Invariant Vectors", h1_style))
story.append(Paragraph(
    "Built using real-time MediaPipe dual-hand landmark tracking, 42-D coordinate normalization, and 72-D geometric spatial vectors, "
    "OmniSign eliminates false positives while running 100% on-device with zero cloud lag.",
    body_style
))

bench_data = [
    [Paragraph("<b>Technical Metric</b>", table_header_style), Paragraph("<b>Measured Value</b>", table_header_style), Paragraph("<b>Real-World User Impact</b>", table_header_style)],
    [Paragraph("Inference Latency", table_cell_bold), Paragraph("<b>35.17 µs (0.035 ms)</b>", table_cell_style), Paragraph("Instant speech output during live phone calls", table_cell_style)],
    [Paragraph("Recognition Hold Time", table_cell_bold), Paragraph("<b>450 ms (Leaky Accumulator)</b>", table_cell_style), Paragraph("Fast, snappy locking; zero posture fatigue", table_cell_style)],
    [Paragraph("Scale Invariance (0.5x–2.0x)", table_cell_bold), Paragraph("<b>100.000% Accuracy</b>", table_cell_style), Paragraph("Works whether phone is held close or on table stand", table_cell_style)],
    [Paragraph("Sensor Jitter Resilience", table_cell_bold), Paragraph("<b>99.40% Top-1 Accuracy</b>", table_cell_style), Paragraph("Reliable on budget phone webcams and shaky hands", table_cell_style)],
    [Paragraph("Active ISL Vocabulary", table_cell_bold), Paragraph("<b>150+ Full ISL Signs & Digits</b>", table_cell_style), Paragraph("Complete A–Z alphabet, digits 0–9, directions & daily needs", table_cell_style)],
    [Paragraph("Offline Air-Gap", table_cell_bold), Paragraph("<b>0 KB Cloud Dependency</b>", table_cell_style), Paragraph("Works in basements, lifts, and low-connectivity areas", table_cell_style)]
]
t_bench = Table(bench_data, colWidths=[160, 180, 192])
t_bench.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), NAVY),
    ('BACKGROUND', (0,1), (-1,-1), LIGHT_BG),
    ('BOX', (0,0), (-1,-1), 1, BORDER),
    ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER),
    ('PADDING', (0,0), (-1,-1), 6),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
story.append(t_bench)
story.append(Spacer(1, 12))

story.append(Paragraph("4. Daily Life Use Cases: Beyond Just Reception Desks", h1_style))

use_data = [
    [Paragraph("<b>Scenario</b>", table_header_style), Paragraph("<b>How Non-Talkable Person Uses OmniSign</b>", table_header_style)],
    [
        Paragraph("<b>Food & Grocery Delivery</b><br/>(Zomato, Swiggy, Blinkit, Zepto)", table_cell_bold),
        Paragraph("Rider calls from society gate. User signs directions (<i>'Gate 2, 2nd floor, leave at door'</i>). Phone speaks to the rider instantly over call.", table_cell_style)
    ],
    [
        Paragraph("<b>Cab & Auto Pickups</b><br/>(Uber, Ola, Rapido)", table_cell_bold),
        Paragraph("Driver calls asking for landmark or OTP. User signs the 4-digit OTP or directions (<i>'Near Metro pillar 45, waiting at corner'</i>).", table_cell_style)
    ],
    [
        Paragraph("<b>Street & Shop Shopping</b>", table_cell_bold),
        Paragraph("Buying groceries or street food: User signs item and quantity; phone speaks price inquiries and specifications to the shopkeeper.", table_cell_style)
    ],
    [
        Paragraph("<b>Emergency Distress SOS</b>", table_cell_bold),
        Paragraph("Sudden trauma, accident, or distress: 1-sign SOS triggers emergency audible siren and speaks location and distress immediately.", table_cell_style)
    ]
]
t_use = Table(use_data, colWidths=[160, 372])
t_use.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), PRIMARY),
    ('BACKGROUND', (0,1), (-1,-1), LIGHT_BG),
    ('BOX', (0,0), (-1,-1), 1, BORDER),
    ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER),
    ('PADDING', (0,0), (-1,-1), 6),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
]))
story.append(t_use)

doc.build(story)

# Copy to Desktop
desktop_dir = r"C:\Users\P RUSHIDHAR\OneDrive\Desktop"
shutil.copy2(pdf_path, os.path.join(desktop_dir, pdf_path))
shutil.copy2(pdf_path, os.path.join(desktop_dir, "OmniSign_HealthTech_Pitch_Deck.pdf"))
print(f"Generated and copied {pdf_path} to Desktop")
