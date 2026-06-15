// home.js — Accueil : LA proposition du soir (un seul plat), vignettes frais,
// « Voir la recette » / « Autre chose ». Jamais d'écran vide.

import { el, esc, ICONS, annoncer } from '../ui.js';
import { illustrationPour, libelleEquipement } from '../data.js';

/** Liste de frais suggérés (vedettes + ingrédients frais distincts). */
function fraisSuggeres(catalogue) {
  const noms = new Set();
  for (const r of catalogue.recettes) {
    if (r.ingredient_vedette) noms.add(r.ingredient_vedette);
    for (const i of r.ingredients) if (i.type === 'frais') noms.add(i.nom);
  }
  return [...noms];
}

export default function renderHome(ctx) {
  const { recette, evaluation } = ctx.proposition || {};
  const screen = el('<section class="screen actif" aria-label="Proposition du soir"></section>');

  // Barre du haut
  const topbar = el(`
    <div class="topbar">
      <span class="mark">15/5</span>
      <button class="icon-btn" aria-label="Réglages">${ICONS.reglages}</button>
    </div>`);
  topbar.querySelector('button').addEventListener('click', () => ctx.aller('reglages'));
  screen.appendChild(topbar);

  const body = el('<div class="body-scroll"></div>');
  body.appendChild(el('<span class="eyebrow">Ce soir</span>'));
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
  body.appendChild(card);

  // Appoint : ingrédient(s) manquant(s) signalé(s)
  if (evaluation && evaluation.manquants.length > 0) {
    const liste = evaluation.manquants.map((m) => m.nom).join(', ');
    body.appendChild(
      el(`<p class="appoint-note">${ICONS.liste} Il te manque peut-être : ${esc(liste)}</p>`)
    );
  }

  // Frais coché sans correspondance (B4)
  const fraisCoche = ctx.etat.frais_du_jour;
  const utiliseCoche = evaluation && evaluation.raisons.includes('frais coché');
  if (fraisCoche.length > 0 && !utiliseCoche) {
    body.appendChild(
      el(`<p class="appoint-note">Aucune idée avec ${esc(fraisCoche.join(', '))} ce soir — en voici une autre.</p>`)
    );
  }

  // Vignettes frais
  body.appendChild(el('<div class="section-q">Tu as quoi de frais ce soir ?</div>'));
  const chips = el('<div class="chips" role="group" aria-label="Ingrédients frais"></div>');
  for (const nom of fraisSuggeres(ctx.catalogue)) {
    const actif = fraisCoche.includes(nom);
    const chip = el(
      `<button class="chip${actif ? ' on' : ''}" aria-pressed="${actif}">${esc(nom)}</button>`
    );
    chip.addEventListener('click', () => ctx.toggleFrais(nom));
    chips.appendChild(chip);
  }
  const autre = el('<button class="chip add">+ autre</button>');
  autre.addEventListener('click', () => {
    const v = (prompt('Quel ingrédient frais as-tu ?') || '').trim().toLowerCase();
    if (v) ctx.toggleFrais(v);
  });
  chips.appendChild(autre);
  body.appendChild(chips);

  body.appendChild(el('<div class="spacer"></div>'));

  // Actions
  const actions = el('<div class="actions"></div>');
  const voir = el('<button class="btn btn-primary">Voir la recette</button>');
  voir.addEventListener('click', () => ctx.ouvrirDetail(recette));
  const autreChose = el('<button class="btn btn-ghost">Autre chose</button>');
  autreChose.addEventListener('click', () => ctx.autreChose());
  actions.append(voir, autreChose);
  body.appendChild(actions);

  screen.appendChild(body);

  // Bannière pub (placeholder visuel ; AdMob réelle injectée en natif)
  screen.appendChild(el('<div class="adbar" aria-hidden="true">Publicité</div>'));

  annoncer(`Proposition : ${recette.nom}, ${recette.temps_min} minutes.`);
  return screen;
}
