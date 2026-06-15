#!/usr/bin/env python3
# Génère l'icône d'app Quinze Cinq : fond jaune plein #FFC400, « 15/5 » centré
# en encre #16171B (iOS applique le masque arrondi). Écrit le PNG 1024 de
# l'AppIcon iOS + une copie dans src/branding/.
import os
from PIL import Image, ImageDraw, ImageFont

SIZE = 1024
YELLOW = (255, 196, 0)      # #FFC400
INK = (22, 23, 27)          # #16171B
TEXT = "15/5"

img = Image.new("RGB", (SIZE, SIZE), YELLOW)
draw = ImageDraw.Draw(img)

def charger_police(taille):
    candidats = [
        ("/System/Library/Fonts/SFNSRounded.ttf", "Heavy"),
        ("/System/Library/Fonts/SFNSRounded.ttf", "Bold"),
        ("/System/Library/Fonts/HelveticaNeue.ttc", None),
        ("/System/Library/Fonts/Helvetica.ttc", None),
    ]
    for chemin, variante in candidats:
        if not os.path.exists(chemin):
            continue
        try:
            f = ImageFont.truetype(chemin, taille)
            if variante:
                try:
                    f.set_variation_by_name(variante)
                except Exception:
                    pass
            return f
        except Exception:
            continue
    return ImageFont.load_default()

font = charger_police(410)
# Centrage précis via la bbox réelle du texte.
bbox = draw.textbbox((0, 0), TEXT, font=font)
w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
x = (SIZE - w) / 2 - bbox[0]
y = (SIZE - h) / 2 - bbox[1]
draw.text((x, y), TEXT, font=font, fill=INK)

sorties = [
    os.path.join(os.path.dirname(__file__), "..", "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"),
    os.path.join(os.path.dirname(__file__), "..", "src/branding/icon-1024.png"),
]
for p in sorties:
    img.save(os.path.abspath(p), "PNG")
    print("écrit:", os.path.abspath(p))
