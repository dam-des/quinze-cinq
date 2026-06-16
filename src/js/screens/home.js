// home.js — Accueil : LA proposition du soir (un seul plat), recherche de frais
// + frais récents, « Voir la recette » / « Autre chose ». Jamais d'écran vide.

import { el, esc, ICONS, annoncer } from '../ui.js';
import { illustrationPour, libelleEquipement } from '../data.js';
import { fraisPertinents, streakCuisine } from '../engine.js';
import * as ads from '../ads.js';

const FRAIS_DEFAUT = 8; // nb de vignettes par défaut (cochés + récents + complément)

export default function renderHome(ctx) {
  const { recette, evaluation } = ctx.proposition || {};
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

  if (!recette) {
    body.appendChild(
      el('<p class="appoint-note">Aucune idée ne correspond. Ajuste ton placard dans les réglages.</p>')
    );
    screen.appendChild(body);
    return screen;
  }

  // Carte plat héros
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
  body.appendChild(card);

  // Appoint : ingrédient(s) manquant(s) signalé(s)
  if (evaluation && evaluation.manquants.length > 0) {
    const liste = evaluation.manquants.map((m) => m.nom).join(', ');
    body.appendChild(
      el(`<p class="appoint-note">${ICONS.panier} Il te manque peut-être : ${esc(liste)}</p>`)
    );
  }

  // Frais cochés : on dit lesquels la recette utilise, et lesquels n'y entrent pas.
  const fraisCoche = ctx.etat.frais_du_jour;
  if (fraisCoche.length > 0) {
    const fraisRecette = new Set(
      recette.ingredients.filter((i) => i.type === 'frais').map((i) => i.nom)
    );
    const utilises = fraisCoche.filter((n) => fraisRecette.has(n));
    const nonUtilises = fraisCoche.filter((n) => !fraisRecette.has(n));
    if (utilises.length === 0) {
      // Aucun coché ne colle (B4) — on propose quand même quelque chose.
      body.appendChild(
        el(`<p class="appoint-note">Aucune idée avec ${esc(fraisCoche.join(', '))} ce soir — en voici une autre.</p>`)
      );
    } else if (nonUtilises.length > 0) {
      body.appendChild(
        el(`<p class="appoint-note">${ICONS.check} Utilise ${esc(utilises.join(', '))}. <strong>${esc(nonUtilises.join(', '))}</strong> n'entre pas dans cette recette.</p>`)
      );
    } else {
      body.appendChild(
        el(`<p class="appoint-note match-ok">${ICONS.check} Cette recette utilise tous tes ingrédients !</p>`)
      );
    }
  }

  // ── Frais : recherche + récents ──────────────────────────────────────────
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

  function construireChips() {
    const q = recherche.value.trim().toLowerCase();
    chips.innerHTML = '';

    // Les cochés d'abord (toujours visibles), puis résultats de recherche ou défaut.
    let liste;
    let reste = 0;
    if (q) {
      liste = [...fraisCoche, ...pertinents.filter((n) => n.includes(q) && !fraisCoche.includes(n))].slice(0, 16);
    } else {
      // base = cochés + récents, complétée par les frais pertinents.
      const complet = [...new Set([...fraisCoche, ...recents, ...pertinents])];
      if (etendu) {
        liste = complet;
      } else {
        liste = complet.slice(0, FRAIS_DEFAUT);
        reste = complet.length - liste.length;
      }
    }

    for (const nom of liste) {
      const actif = fraisCoche.includes(nom);
      const chip = el(
        `<button class="chip${actif ? ' on' : ''}" aria-pressed="${actif}">${esc(nom)}</button>`
      );
      chip.addEventListener('click', () => ctx.toggleFrais(nom));
      chips.appendChild(chip);
    }
    if (q && liste.length === 0) {
      chips.appendChild(el(`<span class="chip-empty">Aucun ingrédient « ${esc(q)} »</span>`));
    }
    // Bouton « Voir plus / Voir moins » (hors recherche uniquement).
    if (!q && (reste > 0 || etendu)) {
      const more = el(
        `<button class="chip more" aria-expanded="${etendu}">${etendu ? 'Voir moins' : `Voir plus (+${reste})`}</button>`
      );
      more.addEventListener('click', () => { etendu = !etendu; construireChips(); });
      chips.appendChild(more);
    }
  }
  recherche.addEventListener('input', construireChips);
  construireChips();

  body.appendChild(el('<div class="spacer"></div>'));

  const actions = el('<div class="actions"></div>');
  const voir = el('<button class="btn btn-primary">Voir la recette</button>');
  voir.addEventListener('click', () => ctx.ouvrirDetail(recette));
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

  annoncer(`Proposition : ${recette.nom}, ${recette.temps_min} minutes.`);
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
