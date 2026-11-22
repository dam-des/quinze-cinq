#!/usr/bin/env python3
"""Génère les visuels Play (icône 512, image de présentation 1024x500) depuis l'icône iOS
et une capture, sans rien d'externe. Sortie : store-assets/play/{icon,featureGraphic}.png
Usage : python3 tool/store_graphics.py"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICON = os.path.join(ROOT, "assets/icon-only.png")
SHOT = os.path.join(ROOT, "store-assets/screenshots/raw/ios/02_accueil_fr.png")
OUT = os.path.join(ROOT, "store-assets/play")
os.makedirs(OUT, exist_ok=True)

icon = Image.open(ICON).convert("RGBA")
icon.resize((512, 512), Image.LANCZOS).convert("RGBA").save(os.path.join(OUT, "icon.png"))

W, H = 1024, 500
BG1, BG2 = (14, 15, 18), (36, 29, 10)
bg = Image.new("RGB", (W, H), BG1)
px = bg.load()
for x in range(W):
    t = x / (W - 1)
    c = tuple(int(BG1[i] + (BG2[i] - BG1[i]) * t) for i in range(3))
    for y in range(H):
        px[x, y] = c

def font(size, bold=False):
    for p in ("/System/Library/Fonts/Helvetica.ttc", "/System/Library/Fonts/SFNS.ttf",
              "/Library/Fonts/Arial.ttf"):
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size, index=1 if bold else 0)
            except Exception:
                try: return ImageFont.truetype(p, size)
                except Exception: pass
    return ImageFont.load_default()

d = ImageDraw.Draw(bg)
logo = icon.resize((120, 120), Image.LANCZOS)
mask = Image.new("L", (120, 120), 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, 119, 119), 28, fill=255)
bg.paste(logo, (64, 72), mask)
d.text((208, 96), "Quinze Cinq", font=font(62, True), fill=(255, 196, 0))
d.text((64, 232), "Le soir, on décide", font=font(40, True), fill="white")
d.text((64, 282), "pour toi", font=font(40, True), fill="white")
d.text((64, 372), "15 min · 5 ingrédients · Hors-ligne · Gratuit", font=font(24), fill=(196, 196, 188))

shot = Image.open(SHOT).convert("RGB")
shot = shot.crop((0, 175, shot.width, shot.height))  # retire la barre d'état
sw = 300
sh = int(shot.height * sw / shot.width)
shot = shot.resize((sw, sh), Image.LANCZOS)
phone = Image.new("RGBA", (sw + 16, 470), (0, 0, 0, 0))
pd = ImageDraw.Draw(phone)
pd.rounded_rectangle((0, 0, sw + 15, 469), 34, fill=(26, 27, 32, 255))
phone.paste(shot.crop((0, 0, sw, 454)), (8, 8))
rm = Image.new("L", phone.size, 0)
ImageDraw.Draw(rm).rounded_rectangle((0, 0, sw + 15, 469), 34, fill=255)
bg_rgba = bg.convert("RGBA")
shadow = Image.new("RGBA", bg.size, (0, 0, 0, 0))
shadow.paste((0, 0, 0, 130), (668, 56), rm)
bg_rgba = Image.alpha_composite(bg_rgba, shadow.filter(ImageFilter.GaussianBlur(10)))
bg_rgba.paste(phone, (660, 40), phone)
bg_rgba.convert("RGB").save(os.path.join(OUT, "featureGraphic.png"))
print("ok")
