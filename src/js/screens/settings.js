// settings.js — Réglages : placard, équipement, préférences, rappel quotidien
// (on/off + heure, opt-in permission contextuel), confidentialité.

import { el, esc, ICONS } from '../ui.js';
import * as storage from '../storage.js';
import * as notifications from '../notifications.js';
import * as ads from '../ads.js';
import * as theme from '../theme.js';
import { basiquesEditables } from '../data.js';

export default function renderReglages(ctx) {
  const screen = el('<section class="screen actif" aria-label="Réglages"></section>');
  const body = el('<div class="body-scroll" style="padding-top:calc(var(--safe-top) + 14px)"></div>');

  const back = el(`<button class="back">${ICONS.fleche} Retour</button>`);
  const retour = () => {
    ctx.calculerProposition();
    ctx.aller('home');
  };
  back.addEventListener('click', retour);
  ctx.retour = retour; // active le balayage retour
  body.appendChild(back);
  body.appendChild(el('<h1 class="set-h">Réglages</h1>'));

  // ── Mes plats (historique) ─────────────────────────────────────────────────
  const gHist = el('<div class="set-group"><div class="gl">Mon historique</div></div>');
  const cardHist = el('<div class="set-card"></div>');
  const rowHist = el('<button class="set-row">Mes plats cuisinés<span class="chev">›</span></button>');
  rowHist.addEventListener('click', () => ctx.aller('historique'));
  cardHist.appendChild(rowHist);
  gHist.appendChild(cardHist);
  body.appendChild(gHist);

  // ── Mon placard ──────────────────────────────────────────────────────────
  const gPlacard = el('<div class="set-group"><div class="gl">Mon placard de base</div></div>');
  const pantry = el('<div class="pantry"></div>');
  for (const nom of basiquesEditables(ctx.catalogue)) {
    const possede = ctx.etat.garde_manger.includes(nom);
    const chip = el(
      `<button class="pchip${possede ? '' : ' off'}" aria-pressed="${possede}">${possede ? ICONS.check : ''}${esc(nom)}</button>`
    );
    chip.addEventListener('click', async () => {
      const gm = ctx.etat.garde_manger;
      const i = gm.indexOf(nom);
      if (i >= 0) gm.splice(i, 1);
      else gm.push(nom);
      await ctx.sauver(storage.CLES.GARDE_MANGER, gm);
      const actif = gm.includes(nom);
      chip.classList.toggle('off', !actif);
      chip.setAttribute('aria-pressed', String(actif));
      chip.innerHTML = `${actif ? ICONS.check : ''}${esc(nom)}`;
    });
    pantry.appendChild(chip);
  }
  gPlacard.appendChild(pantry);
  body.appendChild(gPlacard);

  // ── Équipement ───────────────────────────────────────────────────────────
  const toggleRow = (label, valeur, onChange, sous = '') => {
    const sub = sous ? `<span class="set-row-sub">${esc(sous)}</span>` : '';
    const row = el(
      `<div class="set-row"><span class="set-row-txt"><span class="set-row-label">${esc(label)}</span>${sub}</span><button class="toggle${valeur ? ' on' : ''}" role="switch" aria-checked="${valeur}" aria-label="${esc(label)}"></button></div>`
    );
    const t = row.querySelector('.toggle');
    t.addEventListener('click', async () => {
      const nv = !t.classList.contains('on');
      const accepte = await onChange(nv);
      const etat = accepte === undefined ? nv : accepte;
      t.classList.toggle('on', etat);
      t.setAttribute('aria-checked', String(etat));
    });
    return row;
  };

  const gEquip = el('<div class="set-group"><div class="gl">Mon équipement</div></div>');
  const cardEquip = el('<div class="set-card"></div>');
  cardEquip.appendChild(
    toggleRow('Four', ctx.etat.equipements.four, async (v) => {
      ctx.etat.equipements.four = v;
      await ctx.sauver(storage.CLES.EQUIPEMENTS, ctx.etat.equipements);
    })
  );
  cardEquip.appendChild(
    toggleRow('Airfryer', ctx.etat.equipements.airfryer, async (v) => {
      ctx.etat.equipements.airfryer = v;
      await ctx.sauver(storage.CLES.EQUIPEMENTS, ctx.etat.equipements);
    })
  );
  gEquip.appendChild(cardEquip);
  body.appendChild(gEquip);

  // ── Préférences ──────────────────────────────────────────────────────────
  const gPref = el('<div class="set-group"><div class="gl">Mes préférences</div></div>');
  const cardPref = el('<div class="set-card"></div>');
  const prefs = ctx.etat.preferences;
  cardPref.appendChild(
    toggleRow(
      'Végétarien',
      prefs.vegetarien,
      async (v) => {
        prefs.vegetarien = v;
        await ctx.sauver(storage.CLES.PREFERENCES, prefs);
      },
      'Seuls des plats végétariens seront proposés.'
    )
  );
  cardPref.appendChild(
    toggleRow(
      'Plats pour enfants',
      prefs.enfant_friendly,
      async (v) => {
        prefs.enfant_friendly = v;
        await ctx.sauver(storage.CLES.PREFERENCES, prefs);
      },
      'Les plats adaptés aux enfants sont mis en avant (les autres restent proposés).'
    )
  );
  cardPref.appendChild(
    toggleRow(
      'Sans porc',
      (prefs.exclusions || []).includes('porc'),
      async (v) => {
        prefs.exclusions = prefs.exclusions || [];
        if (v && !prefs.exclusions.includes('porc')) prefs.exclusions.push('porc');
        if (!v) prefs.exclusions = prefs.exclusions.filter((x) => x !== 'porc');
        await ctx.sauver(storage.CLES.PREFERENCES, prefs);
      },
      'Les plats contenant du porc sont exclus.'
    )
  );
  gPref.appendChild(cardPref);
  body.appendChild(gPref);

  // ── Apparence (thème clair / sombre / auto) ───────────────────────────────
  const gApp = el('<div class="set-group"><div class="gl">Apparence</div></div>');
  const cardApp = el('<div class="set-card"></div>');
  const rowApp = el(
    '<div class="set-row"><span class="set-row-txt"><span class="set-row-label">Thème</span><span class="set-row-sub">« Auto » suit le réglage de ton téléphone.</span></span></div>'
  );
  const courant = theme.lireTheme();
  const seg = el('<div class="seg" role="radiogroup" aria-label="Thème de l’application"></div>');
  const options = [['auto', 'Auto'], ['clair', 'Clair'], ['sombre', 'Sombre']];
  const boutons = options.map(([val, label]) => {
    const sel = courant === val;
    const b = el(
      `<button class="seg-opt${sel ? ' on' : ''}" role="radio" aria-checked="${sel}">${esc(label)}</button>`
    );
    b.addEventListener('click', () => {
      theme.definirTheme(val);
      for (const o of boutons) {
        const on = o === b;
        o.classList.toggle('on', on);
        o.setAttribute('aria-checked', String(on));
      }
    });
    seg.appendChild(b);
    return b;
  });
  rowApp.appendChild(seg);
  cardApp.appendChild(rowApp);
  gApp.appendChild(cardApp);
  body.appendChild(gApp);

  // ── Rappel quotidien ─────────────────────────────────────────────────────
  const notif = ctx.etat.reglage_notif;
  const gNotif = el('<div class="set-group"><div class="gl">Rappel quotidien</div></div>');
  const cardNotif = el('<div class="set-card"></div>');

  const rowHeure = el(
    `<div class="set-row">Heure du rappel<input type="time" value="${esc(notif.heure)}" aria-label="Heure du rappel"></div>`
  );
  const inputHeure = rowHeure.querySelector('input');
  inputHeure.addEventListener('change', async () => {
    notif.heure = inputHeure.value || '18:00';
    await ctx.sauver(storage.CLES.REGLAGE_NOTIF, notif);
    if (notif.actif) await notifications.planifierQuotidien(notif.heure);
  });

  cardNotif.appendChild(
    toggleRow('Recevoir un rappel le soir', notif.actif, async (v) => {
      if (v) {
        // opt-in contextuel : demande la permission seulement maintenant
        const ok = await notifications.demanderPermission();
        if (!ok && notifications.disponible()) {
          alert('Notifications refusées. Tu peux les réactiver dans les réglages système.');
          notif.actif = false;
          await ctx.sauver(storage.CLES.REGLAGE_NOTIF, notif);
          return false;
        }
        notif.actif = true;
        await notifications.planifierQuotidien(notif.heure);
      } else {
        notif.actif = false;
        await notifications.annuler();
      }
      await ctx.sauver(storage.CLES.REGLAGE_NOTIF, notif);
      return notif.actif;
    })
  );
  cardNotif.appendChild(rowHeure);
  gNotif.appendChild(cardNotif);
  body.appendChild(gNotif);

  // ── Confidentialité ──────────────────────────────────────────────────────
  const gConf = el('<div class="set-group"><div class="gl">Confidentialité</div></div>');
  const cardConf = el('<div class="set-card"></div>');
  const rowPol = el('<button class="set-row">Politique de confidentialité<span class="chev">›</span></button>');
  rowPol.addEventListener('click', () => ctx.aller('confidentialite'));
  const rowPub = el('<button class="set-row">Publicités &amp; consentement<span class="chev">›</span></button>');
  rowPub.addEventListener('click', async () => {
    const r = await ads.revoirConsentement();
    alert(r.message);
  });
  cardConf.append(rowPol, rowPub);
  gConf.appendChild(cardConf);
  body.appendChild(gConf);

  screen.appendChild(body);
  return screen;
}
