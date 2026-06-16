#!/usr/bin/env python3
# Génère l'icône d'app Quinze Cinq À PARTIR de src/branding/icon-1024.svg, en
# rendant le « 15/5 » avec la VRAIE police de marque (src/css/fonts/bricolage.woff2),
# en supersampling pour un rendu net (l'ancien PNG était flou : police système de repli).
# Sort le PNG 1024 de l'AppIcon iOS + une copie dans src/branding/.
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), "..")
FONT = os.path.join(ROOT, "src/css/fonts/bricolage.woff2")
SORTIES = [
    os.path.join(ROOT, "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"),
    os.path.join(ROOT, "src/branding/icon-1024.png"),
]

SIZE = 1024
SS = 3                      # supersampling → bords nets après réduction LANCZOS
YELLOW = (255, 196, 0)      # #FFC400
INK = (22, 23, 27)          # #16171B
TEXT = "15/5"
# Paramètres repris de icon-1024.svg (viewBox 1024).
FONT_SIZE = 420
CENTER_Y = 560              # text y=560, dominant-baseline central
TRACKING = -16             # letter-spacing

R = SIZE * SS
img = Image.new("RGB", (R, R), YELLOW)
draw = ImageDraw.Draw(img)
font = ImageFont.truetype(FONT, FONT_SIZE * SS)
track = TRACKING * SS

# Largeur totale avec letter-spacing pour centrer horizontalement.
largeurs = [draw.textlength(c, font=font) for c in TEXT]
total = sum(largeurs) + track * (len(TEXT) - 1)
x = R / 2 - total / 2
y = CENTER_Y * SS
for c, w in zip(TEXT, largeurs):
    draw.text((x, y), c, font=font, fill=INK, anchor="lm")
    x += w + track

img = img.resize((SIZE, SIZE), Image.LANCZOS)
for chemin in SORTIES:
    os.makedirs(os.path.dirname(chemin), exist_ok=True)
    img.save(chemin)
    print(f"✓ {os.path.relpath(chemin, ROOT)}")
print("OK — icône d'app rendue avec la police de marque (nette).")
