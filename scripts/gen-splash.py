#!/usr/bin/env python3
# Splash screen Quinze Cinq : 2732×2732, fond jaune #FFC400, « 15/5 » centré
# en encre. Remplace les 3 PNG de Splash.imageset (iOS).
import os
from PIL import Image, ImageDraw, ImageFont

SIZE = 2732
YELLOW = (255, 196, 0)
INK = (22, 23, 27)
TEXT = "15/5"

def charger_police(taille):
    for chemin, variante in [
        ("/System/Library/Fonts/SFNSRounded.ttf", "Heavy"),
        ("/System/Library/Fonts/SFNSRounded.ttf", "Bold"),
        ("/System/Library/Fonts/HelveticaNeue.ttc", None),
    ]:
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

img = Image.new("RGB", (SIZE, SIZE), YELLOW)
draw = ImageDraw.Draw(img)
font = charger_police(720)
bbox = draw.textbbox((0, 0), TEXT, font=font)
w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
draw.text(((SIZE - w) / 2 - bbox[0], (SIZE - h) / 2 - bbox[1]), TEXT, font=font, fill=INK)

base = os.path.join(os.path.dirname(__file__), "..", "ios/App/App/Assets.xcassets/Splash.imageset")
for nom in ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]:
    p = os.path.abspath(os.path.join(base, nom))
    img.save(p, "PNG")
    print("écrit:", nom)
