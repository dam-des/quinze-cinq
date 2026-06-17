// home.js — Accueil : LA proposition du soir (un seul plat), recherche de frais
// + frais récents, « Voir la recette » / « Autre chose ». Jamais d'écran vide.
// Cocher un frais met à jour la proposition EN PLACE (les vignettes ne bougent
// pas) → sélection multiple fluide.

import { el, esc, ICONS, annoncer } from '../ui.js';
import { illustrationPour, libelleEquipement } from '../data.js';
import { fraisPertinents, streakCuisine } from '../engine.js';
import * as ads from '../ads.js';
import * as storage from '../storage.js';
import * as haptics from '../haptics.js';

const FRAIS_DEFAUT = 8; // nb de vignettes par défaut (cochés + récents + complément)

export default function renderHome(ctx) {
  const screen = el('<section class="screen actif" aria-label="Proposition du soir"></section>');

  const topbar = el(`
    <div class="topbar">
      <span class="mark">15/5</span>
      <button class="icon-btn" aria-label="Réglages">${ICONS.reglages}</button>
    </div>`);
  topbar.querySelector('button').addEventListener('click', () => ctx.aller('reglages'));
  screen.appendChild(topbar);

  const body = el('<div class="body-scroll"></div>');

  // Eyebrow + streak de rétention
  const eyebrow = el('<div class="eyebrow-row"><span class="eyebrow">Ce soir</span></div>');
  const streak = streakCuisine(ctx.etat.historique, Date.now());
  if (streak >= 2) {
    eyebrow.appendChild(el(`<span class="streak" aria-label="${streak} soirs cuisinés d'affilée">🔥 ${streak} soirs</span>`));
  }
  body.appendChild(eyebrow);
  body.appendChild(el('<div class="decide-line">On a choisi pour toi.</div>'));

  // ── Zone proposition (carte + notes) — mise à jour en place quand on coche ──
  const propZone = el('<div class="prop-zone"></div>');
  body.appendChild(propZone);

  function rendreProp() {
    propZone.innerHTML = '';
    const { recette, evaluation } = ctx.proposition || {};
    if (!recette) {
      propZone.appendChild(
        el('<p class="appoint-note">Aucune idée ne correspond. Ajuste ton placard ou tes filtres dans les réglages.</p>')
      );
      return;
    }

    const card = el(`
      <article class="dish-card" aria-label="${esc(recette.nom)}">
        <div class="dish-illu"><img src="${illustrationPour(recette)}" alt="" aria-hidden="true" /></div>
        <h1 class="dish-name">${esc(recette.nom)}</h1>
        <div class="badges">
          <span class="badge hl">${ICONS.horloge} ${recette.temps_min} min</span>
          <span class="badge">${ICONS.liste} ${recette.nb_comptables} ingrédients</span>
          <span class="badge">${ICONS.poele} ${esc(libelleEquipement(recette))}</span>
        </div>
      </article>`);
    if (ctx.animerCarte) {
      card.classList.add('swap'); // animation lors d'un « Autre chose »
      ctx.animerCarte = false;
    }
    propZone.appendChild(card);

    // Appoint : ingrédient(s) manquant(s) signalé(s)
    if (evaluation && evaluation.manquants.length > 0) {
      const liste = evaluation.manquants.map((m) => m.nom).join(', ');
      propZone.appendChild(
        el(`<p class="appoint-note">${ICONS.panier} Il te manque peut-être : ${esc(liste)}</p>`)
      );
    }

    // Frais cochés : lesquels la recette utilise, lesquels n'y entrent pas.
    const fc = ctx.etat.frais_du_jour;
    if (fc.length > 0) {
      const fraisRecette = new Set(
        recette.ingredients.filter((i) => i.type === 'frais').map((i) => i.nom)
      );
      const utilises = fc.filter((n) => fraisRecette.has(n));
      const nonUtilises = fc.filter((n) => !fraisRecette.has(n));
      if (utilises.length === 0) {
        propZone.appendChild(
          el(`<p class="appoint-note">Aucune idée avec ${esc(fc.join(', '))} ce soir — en voici une autre.</p>`)
        );
      } else if (nonUtilises.length > 0) {
        const n = nonUtilises.length;
        propZone.appendChild(
          el(`<p class="appoint-note">${ICONS.check} Utilise ${esc(utilises.join(', '))}. <span class="note-muted">+${n} non utilisé${n > 1 ? 's' : ''}</span></p>`)
        );
      } else {
        propZone.appendChild(
          el(`<p class="appoint-note match-ok">${ICONS.check} Cette recette utilise tous tes ingrédients !</p>`)
        );
      }
    }
    annoncer(`Proposition : ${recette.nom}, ${recette.temps_min} minutes.`);
  }
  rendreProp();

  // ── Frais : recherche + vignettes ──────────────────────────────────────────
  body.appendChild(el('<div class="section-q">Tu as quoi de frais ce soir ?</div>'));
  const recherche = el(
    '<input class="frais-search" type="search" inputmode="search" autocomplete="off" placeholder="Chercher un ingrédient frais…" aria-label="Chercher un ingrédient frais" />'
  );
  body.appendChild(recherche);

  const chips = el('<div class="chips" role="group" aria-label="Ingrédients frais"></div>');
  body.appendChild(chips);

  const pertinents = [...fraisPertinents(ctx.catalogue.recettes, ctx.etat)];
  const recents = (ctx.etat.frais_recents || []).filter((n) => pertinents.includes(n));
  let etendu = false; // « Voir plus » : déroule toute la liste pour piocher une idée

  // Coche/décoche un frais SANS reconstruire la liste : la vignette change d'état
  // sur place, seule la proposition est recalculée → on peut tout cocher d'affilée.
  function basculerFrais(nom, chip) {
    haptics.selection();
    const f = ctx.etat.frais_du_jour;
    const idx = f.indexOf(nom);
    if (idx >= 0) {
      f.splice(idx, 1);
    } else {
      f.push(nom);
      const r = ctx.etat.frais_recents.filter((x) => x !== nom);
      r.unshift(nom);
      ctx.etat.frais_recents = r.slice(0, 12);
      storage.ecrire(storage.CLES.FRAIS_RECENTS, ctx.etat.frais_recents);
    }
    storage.ecrire(storage.CLES.FRAIS_DU_JOUR, f); // persistant entre deux ouvertures
    const actif = f.includes(nom);
    chip.classList.toggle('on', actif);
    chip.setAttribute('aria-pressed', String(actif));
    ctx.session = []; // nouvelle orientation → proposition fraîche
    ctx.calculerProposition();
    rendreProp();
  }

  function construireChips() {
    const q = recherche.value.trim().toLowerCase();
    const fc = ctx.etat.frais_du_jour;
    chips.innerHTML = '';

    let liste;
    let reste = 0;
    if (q) {
      liste = [...fc, ...pertinents.filter((n) => n.includes(q) && !fc.includes(n))].slice(0, 16);
    } else {
      const complet = [...new Set([...fc, ...recents, ...pertinents])];
      if (etendu) {
        liste = complet;
      } else {
        liste = complet.slice(0, FRAIS_DEFAUT);
        reste = complet.length - liste.length;
      }
    }

    for (const nom of liste) {
      const actif = fc.includes(nom);
      const chip = el(
        `<button class="chip${actif ? ' on' : ''}" aria-pressed="${actif}">${esc(nom)}</button>`
      );
      chip.addEventListener('click', () => basculerFrais(nom, chip));
      chips.appendChild(chip);
    }
    if (q && liste.length === 0) {
      chips.appendChild(el(`<span class="chip-empty">Aucun ingrédient « ${esc(q)} »</span>`));
    }
    // « Voir plus / Voir moins » (hors recherche). « Tout afficher » pour cocher vite.
    if (!q && (reste > 0 || etendu)) {
      const more = el(
        `<button class="chip more" aria-expanded="${etendu}">${etendu ? 'Voir moins' : `Voir plus (+${reste})`}</button>`
      );
      more.addEventListener('click', () => { etendu = !etendu; construireChips(); });
      chips.appendChild(more);
    }
    // Effacer la sélection (visible dès qu'au moins un frais est coché).
    if (fc.length > 0) {
      const clear = el('<button class="chip clear">Tout effacer</button>');
      clear.addEventListener('click', () => {
        ctx.etat.frais_du_jour = [];
        storage.ecrire(storage.CLES.FRAIS_DU_JOUR, []);
        ctx.session = [];
        ctx.calculerProposition();
        rendreProp();
        construireChips();
      });
      chips.appendChild(clear);
    }
  }
  recherche.addEventListener('input', construireChips);
  construireChips();

  body.appendChild(el('<div class="spacer"></div>'));

  const actions = el('<div class="actions"></div>');
  const voir = el('<button class="btn btn-primary">Voir la recette</button>');
  voir.addEventListener('click', () => {
    const r = ctx.proposition && ctx.proposition.recette;
    if (r) ctx.ouvrirDetail(r);
  });
  const autreChose = el('<button class="btn btn-ghost">Autre chose</button>');
  autreChose.addEventListener('click', () => ctx.autreChose());
  actions.append(voir, autreChose);
  body.appendChild(actions);

  screen.appendChild(body);

  // Tirer vers le bas (en haut de page) = « Autre chose ».
  installerPullToRefresh(body, () => ctx.autreChose());

  // Placeholder pub : uniquement en aperçu navigateur (en natif, vraie bannière AdMob).
  if (!ads.disponible()) {
    screen.appendChild(el('<div class="adbar" aria-hidden="true">Publicité</div>'));
  }

  return screen;
}

/** Pull-to-refresh : un tiré vers le bas en haut de page déclenche l'action. */
function installerPullToRefresh(scroller, onRefresh) {
  const SEUIL = 70;
  let y0 = 0, tire = false;
  const ind = el('<div class="pull-ind" aria-hidden="true">↻</div>');
  scroller.prepend(ind);

  scroller.addEventListener('touchstart', (e) => {
    if (scroller.scrollTop <= 0) { y0 = e.touches[0].clientY; tire = true; }
  }, { passive: true });

  scroller.addEventListener('touchmove', (e) => {
    if (!tire) return;
    const dy = e.touches[0].clientY - y0;
    if (dy <= 0) { ind.style.height = '0px'; return; }
    ind.style.height = `${Math.min(dy, SEUIL + 20)}px`;
    ind.classList.toggle('ready', dy > SEUIL);
  }, { passive: true });

  scroller.addEventListener('touchend', (e) => {
    if (!tire) return;
    tire = false;
    const dy = e.changedTouches[0].clientY - y0;
    ind.style.height = '0px';
    ind.classList.remove('ready');
    if (dy > SEUIL && scroller.scrollTop <= 0) onRefresh();
  });
}
