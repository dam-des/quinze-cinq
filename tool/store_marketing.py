#!/usr/bin/env python3
"""Visuels marketing des stores : accroche (logo + promesse) puis écrans mis en scène
avec titre, à partir des captures brutes (store-assets/screenshots/raw/ios).
Sortie : store-assets/screenshots/store/ios/6.9 (1320x2868).
Usage : python3 tool/store_marketing.py"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "store-assets/screenshots/raw")
OUT = os.path.join(ROOT, "store-assets/screenshots/store")
ICON = os.path.join(ROOT, "assets/icon-only.png")

# Dégradé « Encre & citron » : ink -> brun chaud sombre (sous-teinte du citron, sans l'imposer).
BG1, BG2 = (14, 15, 18), (36, 29, 10)
ACCENT = (255, 196, 0)
SOFT = (196, 196, 188)
# Barre d'état (heure, batterie) retirée de chaque capture (pixels bruts à rogner en haut).
STATUS_CROP = 175
SLIDES = [
    # (capture, titre, sous-titre, accroche, bulles [inutilisées ici], cartes [inutilisées ici])
    ("02_accueil_fr.png", ["Le soir,", "on décide pour toi."], "15 minutes, 5 ingrédients, jamais d'écran vide", True, None, None),
    ("03_recette_fr.png", ["Toujours une recette", "qui te correspond"], "Le moteur s'adapte à ton placard et ton équipement", False, None, None),
    ("04_reglages_fr.png", ["Ton équipement,", "respecté"], "Four, airfryer, Cookeo, plancha : coche ce que tu as", False, None, None),
    (None, ["100 % hors ligne,", "sans compte"], "Sans création de compte · Sur ton téléphone uniquement", False, None, None),
]

def font(size, bold=False):
    for p in ("/System/Library/Fonts/Helvetica.ttc", "/System/Library/Fonts/SFNS.ttf", "/Library/Fonts/Arial.ttf"):
        if os.path.exists(p):
            try: return ImageFont.truetype(p, size, index=1 if bold else 0)
            except Exception:
                try: return ImageFont.truetype(p, size)
                except Exception: pass
    return ImageFont.load_default()

def gradient(w, h):
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        t = y / (h - 1)
        c = tuple(int(BG1[i] + (BG2[i] - BG1[i]) * t) for i in range(3))
        for x in range(w):
            px[x, y] = c
    return img

def rounded(img, radius):
    m = Image.new("L", img.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, img.width - 1, img.height - 1), radius, fill=255)
    out = img.convert("RGBA"); out.putalpha(m); return out

def fit(d, text, size, bold, maxw):
    while size > 20:
        f = font(size, bold)
        b = d.textbbox((0, 0), text, font=f)
        if b[2] - b[0] <= maxw:
            return f
        size -= 4
    return font(20, bold)

def centered(d, w, y, text, f, fill):
    box = d.textbbox((0, 0), text, font=f)
    d.text(((w - (box[2] - box[0])) // 2 - box[0], y), text, font=f, fill=fill)
    return box[3] - box[1]

def compose(raw_name, title, sub, hero, platform, w, h):
    k = w / 1320.0
    bg = gradient(w, h).convert("RGBA")
    d = ImageDraw.Draw(bg)
    y = int(150 * k)
    if hero:
        icon = Image.open(ICON).convert("RGBA").resize((int(230 * k),) * 2, Image.LANCZOS)
        bg.alpha_composite(rounded(icon, int(52 * k)), ((w - icon.width) // 2, y))
        y += icon.height + int(30 * k)
        y += centered(d, w, y, "Quinze Cinq", font(int(100 * k), True), ACCENT) + int(90 * k)
    for line in title:
        y += centered(d, w, y, line, fit(d, line, int((118 if not hero else 104) * k), True, int(w * 0.9)), "white") + int(26 * k)
    y += int(14 * k)
    y += centered(d, w, y, sub, font(int(46 * k)), SOFT)
    if raw_name is None:
        # écran de réassurance : pastilles
        cy = y + int(190 * k)
        ov = Image.new("RGBA", bg.size, (0, 0, 0, 0))
        od = ImageDraw.Draw(ov)
        items = ("Jamais d'écran vide", "15 minutes, 5 ingrédients max",
                 "Four, airfryer, Cookeo, plancha", "Estimation calorique par portion",
                 "100 % hors-ligne, sans compte")
        pill_w, pill_h = int(1080 * k), int(150 * k)
        x0 = (w - pill_w) // 2
        for txt in items:
            tf = fit(od, txt, int(52 * k), True, pill_w - int(170 * k))
            od.rounded_rectangle((x0, cy, x0 + pill_w, cy + pill_h), int(75 * k), fill=(255, 255, 255, 30), outline=(255, 255, 255, 90), width=max(2, int(3 * k)))
            od.ellipse((x0 + int(40 * k), cy + int(45 * k), x0 + int(100 * k), cy + int(105 * k)), fill=ACCENT)
            od.text((x0 + int(130 * k), cy + int(38 * k)), txt, font=tf, fill="white")
            cy += pill_h + int(46 * k)
        return Image.alpha_composite(bg, ov).convert("RGB")
    shot = Image.open(os.path.join(RAW, "ios", raw_name)).convert("RGB")
    shot = shot.crop((0, STATUS_CROP, shot.width, shot.height))
    sw = int(w * 0.80)
    sh = int(shot.height * sw / shot.width)
    shot = shot.resize((sw, sh), Image.LANCZOS)
    fr = int(16 * k)
    phone = Image.new("RGBA", (sw + 2 * fr, sh + 2 * fr), (0, 0, 0, 0))
    ImageDraw.Draw(phone).rounded_rectangle((0, 0, phone.width - 1, phone.height - 1), int(104 * k), fill=(26, 27, 32, 255))
    phone.alpha_composite(rounded(shot, int(88 * k)), (fr, fr))
    px0 = (w - phone.width) // 2
    py0 = y + int(110 * k)
    shadow = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    sm = Image.new("L", phone.size, 0)
    ImageDraw.Draw(sm).rounded_rectangle((0, 0, phone.width - 1, phone.height - 1), int(104 * k), fill=150)
    shadow.paste((0, 0, 0, 255), (px0, py0 + int(24 * k)), sm)
    bg = Image.alpha_composite(bg, shadow.filter(ImageFilter.GaussianBlur(int(28 * k))))
    bg.alpha_composite(phone, (px0, py0))
    return bg.convert("RGB")

PLATFORMS = {"ios": ("ios/6.9", 1320, 2868)}
for platform, (folder, w, h) in PLATFORMS.items():
    out = os.path.join(OUT, folder)
    os.makedirs(out, exist_ok=True)
    for old in os.listdir(out):
        if old.endswith(".png"): os.remove(os.path.join(out, old))
    for i, (raw, title, sub, hero, ckey, box) in enumerate(SLIDES, 1):
        compose(raw, title, sub, hero, platform, w, h).save(os.path.join(out, f"{i:02d}_marketing_fr.png"))
    print(platform, len(SLIDES), "visuels ->", out)
