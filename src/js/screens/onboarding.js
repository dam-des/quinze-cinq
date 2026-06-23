// onboarding.js — première ouverture (une seule fois) :
// marque → placard → équipement → préférences → opt-in rappel → consentement UMP.
// La permission notif et le consentement pub sont demandés en CONTEXTE, à leur
// étape, jamais au démarrage brutal (cadrage §7, §11).

import { el, esc, ICONS } from '../ui.js';
import * as storage from '../storage.js';
import * as notifications from '../notifications.js';
import { basiquesEditables } from '../data.js';

export default function renderOnboarding(ctx) {
  const TOTAL = 6;
  let etape = 0;

  const screen = el('<section class="screen actif" aria-label="Bienvenue"></section>');
  const body = el('<div class="body-scroll" style="padding-top:calc(var(--safe-top) + 16px)"></div>');
  screen.appendChild(body);

  const progress = (n) =>
    `<div class="ob-progress" aria-hidden="true">${Array.from(
      { length: TOTAL },
      (_, k) => `<i class="${k <= n ? 'on' : ''}"></i>`
    ).join('')}</div>`;

  function boutonContinuer(label, onClick) {
    const actions = el('<div class="actions"></div>');
    const b = el(`<button class="btn btn-primary">${esc(label)}</button>`);
    b.addEventListener('click', onClick);
    actions.appendChild(b);
    return actions;
  }

  const suivant = () => {
    etape++;
    rendre();
  };

  function rendre() {
    body.innerHTML = '';

    // Étape 0 — Marque
    if (etape === 0) {
      const hero = el(
        `<div class="brand-hero">
           <span class="mark">15/5</span>
           <h1>Le soir, on décide pour toi.</h1>
           <p>Toujours un plat, prêt en 15 minutes, 5 ingrédients max.</p>
         </div>`
      );
      body.appendChild(hero);
      body.appendChild(boutonContinuer('Commencer', suivant));
      return;
    }

    body.appendChild(el(progress(etape - 1)));

    // Étape 1 — Placard
    if (etape === 1) {
      body.appendChild(el('<h1 class="ob-title">Ton placard de base</h1>'));
      body.appendChild(
        el('<p class="ob-sub">On suppose que tu as déjà ça sous la main. Retire ce qui te manque — tu pourras le changer plus tard.</p>')
      );
      const pantry = el('<div class="pantry"></div>');
      for (const nom of basiquesEditables(ctx.catalogue)) {
        const possede = ctx.etat.garde_manger.includes(nom);
        const chip = el(
          `<button class="pchip${possede ? '' : ' off'}" aria-pressed="${possede}">${possede ? ICONS.check : ''}${esc(nom)}</button>`
        );
        chip.addEventListener('click', () => {
          const gm = ctx.etat.garde_manger;
          const i = gm.indexOf(nom);
          if (i >= 0) gm.splice(i, 1);
          else gm.push(nom);
          const actif = gm.includes(nom);
          chip.classList.toggle('off', !actif);
          chip.setAttribute('aria-pressed', String(actif));
          chip.innerHTML = `${actif ? ICONS.check : ''}${esc(nom)}`;
        });
        pantry.appendChild(chip);
      }
      body.appendChild(pantry);
      body.appendChild(el('<div class="spacer"></div>'));
      body.appendChild(
        boutonContinuer('Continuer', async () => {
          await ctx.sauver(storage.CLES.GARDE_MANGER, ctx.etat.garde_manger);
          suivant();
        })
      );
      return;
    }

    // Étape 2 — Équipement
    if (etape === 2) {
      body.appendChild(el('<h1 class="ob-title">Ton équipement</h1>'));
      body.appendChild(el('<p class="ob-sub">On adapte les idées à ce que tu peux utiliser.</p>'));
      body.appendChild(optToggle('Four', ctx.etat.equipements.four, (v) => (ctx.etat.equipements.four = v)));
      body.appendChild(optToggle('Airfryer', ctx.etat.equipements.airfryer, (v) => (ctx.etat.equipements.airfryer = v)));
      body.appendChild(el('<div class="spacer"></div>'));
      body.appendChild(
        boutonContinuer('Continuer', async () => {
          await ctx.sauver(storage.CLES.EQUIPEMENTS, ctx.etat.equipements);
          suivant();
        })
      );
      return;
    }

    // Étape 3 — Préférences
    if (etape === 3) {
      const prefs = ctx.etat.preferences;
      body.appendChild(el('<h1 class="ob-title">Tes préférences</h1>'));
      body.appendChild(el('<p class="ob-sub">On respectera toujours ces choix.</p>'));
      body.appendChild(optToggle('Végétarien', prefs.vegetarien, (v) => (prefs.vegetarien = v)));
      body.appendChild(optToggle('Plats pour enfants', prefs.enfant_friendly, (v) => (prefs.enfant_friendly = v)));
      body.appendChild(
        optToggle('Sans porc', (prefs.exclusions || []).includes('porc'), (v) => {
          prefs.exclusions = prefs.exclusions || [];
          if (v && !prefs.exclusions.includes('porc')) prefs.exclusions.push('porc');
          if (!v) prefs.exclusions = prefs.exclusions.filter((x) => x !== 'porc');
        })
      );
      body.appendChild(el('<div class="spacer"></div>'));
      body.appendChild(
        boutonContinuer('Continuer', async () => {
          await ctx.sauver(storage.CLES.PREFERENCES, prefs);
          suivant();
        })
      );
      return;
    }

    // Étape 4 — Opt-in rappel quotidien
    if (etape === 4) {
      body.appendChild(el('<h1 class="ob-title">Un petit rappel le soir&nbsp;?</h1>'));
      body.appendChild(
        el('<p class="ob-sub">On peut te notifier ton idée de dîner à l’heure que tu choisis. C’est local, et désactivable à tout moment.</p>')
      );
      body.appendChild(el('<div class="spacer"></div>'));
      const actions = el('<div class="actions"></div>');
      const oui = el('<button class="btn btn-primary">Oui, me rappeler</button>');
      oui.addEventListener('click', async () => {
        const ok = await notifications.demanderPermission();
        ctx.etat.reglage_notif = { actif: ok, heure: '18:00' };
        await ctx.sauver(storage.CLES.REGLAGE_NOTIF, ctx.etat.reglage_notif);
        // La planification effective (corps nommé + NOTIF_RECETTE) est faite par
        // terminerOnboarding → rafraichirNotif, une fois la 1re proposition calculée.
        suivant();
      });
      const non = el('<button class="btn btn-ghost">Pas maintenant</button>');
      non.addEventListener('click', async () => {
        ctx.etat.reglage_notif = { actif: false, heure: '18:00' };
        await ctx.sauver(storage.CLES.REGLAGE_NOTIF, ctx.etat.reglage_notif);
        suivant();
      });
      actions.append(oui, non);
      body.appendChild(actions);
      return;
    }

    // Étape 5 — Consentement publicitaire (UMP) puis entrée
    if (etape === 5) {
      body.appendChild(el('<h1 class="ob-title">Une dernière chose</h1>'));
      body.appendChild(
        el('<p class="ob-sub">Quinze Cinq est gratuit grâce à la pub. On va te demander ton consentement — aucune pub n’est chargée avant ton choix.</p>')
      );
      body.appendChild(el('<div class="spacer"></div>'));
      body.appendChild(
        boutonContinuer('Voir mon dîner', async () => {
          await ctx.terminerOnboarding(); // déclenche UMP + bannière + accueil
        })
      );
      return;
    }
  }

  function optToggle(label, valeur, onChange) {
    const row = el(
      `<div class="opt-row">${esc(label)}<button class="toggle${valeur ? ' on' : ''}" role="switch" aria-checked="${valeur}" aria-label="${esc(label)}"></button></div>`
    );
    const t = row.querySelector('.toggle');
    t.addEventListener('click', () => {
      const nv = !t.classList.contains('on');
      t.classList.toggle('on', nv);
      t.setAttribute('aria-checked', String(nv));
      onChange(nv);
    });
    return row;
  }

  rendre();
  return screen;
}
