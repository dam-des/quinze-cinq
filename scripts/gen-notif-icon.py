#!/usr/bin/env python3
# Génère l'icône de notification Android `ic_stat_icon` (référencée par
# capacitor.config.json). Android n'utilise QUE le canal alpha : la forme doit
# être blanche sur fond transparent (Android la teinte ensuite avec iconColor).
# On reprend le « 15/5 » de la marque, en blanc opaque sur transparent.
import os
from PIL import Image, ImageDraw, ImageFont

TEXT = "15/5"
# Tailles standard des icônes de statut Android (px) par densité.
DENSITES = {
    "drawable-mdpi": 24,
    "drawable-hdpi": 36,
    "drawable-xhdpi": 48,
    "drawable-xxhdpi": 72,
    "drawable-xxxhdpi": 96,
}
RES = os.path.join(os.path.dirname(__file__), "..", "android/app/src/main/res")


def charger_police(taille):
    for chemin in [
        os.path.join(os.path.dirname(__file__), "..", "src/css/fonts/bricolage.woff2"),
        "/System/Library/Fonts/SFNSRounded.ttf",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/Helvetica.ttc",
    ]:
        if os.path.exists(chemin):
            try:
                return ImageFont.truetype(chemin, taille)
            except Exception:
                pass
    return ImageFont.load_default()


for dossier, taille in DENSITES.items():
    img = Image.new("RGBA", (taille, taille), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # marge de sécurité : la zone visible d'une icône de statut est ~le centre.
    police = charger_police(int(taille * 0.46))
    bbox = draw.textbbox((0, 0), TEXT, font=police)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (taille - w) / 2 - bbox[0]
    y = (taille - h) / 2 - bbox[1]
    draw.text((x, y), TEXT, font=police, fill=(255, 255, 255, 255))
    cible = os.path.join(RES, dossier)
    os.makedirs(cible, exist_ok=True)
    img.save(os.path.join(cible, "ic_stat_icon.png"))
    print(f"✓ {dossier}/ic_stat_icon.png ({taille}px)")

print("OK — icône de notification Android générée.")
