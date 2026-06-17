// detail.js — Détail recette : illustration, badges, sélecteur de personnes
// (quantités mises à l'échelle), ingrédients (ce qu'on a / ce qui manque),
// étapes, bouton « Je cuisine ça ».

import { el, esc, ICONS } from '../ui.js';
import { ingredientsManquants } from '../engine.js';
import * as storage from '../storage.js';
import { illustrationPour, libelleEquipement, formatQuantitePortions } from '../data.js';
import { iconePourEtape } from '../icones.js';

export default function renderDetail(ctx, { recette }) {
  const manquants = ingredientsManquants(
    recette,
    ctx.etat.garde_manger,
    ctx.etat.frais_du_jour
  );
  const estManquant = (ing) => manquants.includes(ing);
  const choisis = ctx.etat.frais_du_jour || [];
  let portions = ctx.etat.portions || recette.portions;

  const screen = el('<section class="screen actif" aria-label="Détail de la recette"></section>');
  const body = el('<div class="body-scroll" style="padding-top:calc(var(--safe-top) + 14px)"></div>');

  const back = el(`<button class="back">${ICONS.fleche} Retour</button>`);
  // Retour = on conserve la même proposition (consulter n'est pas « Autre chose »).
  const retour = () => ctx.aller('home');
  back.addEventListener('click', retour);
  ctx.retour = retour; // active le balayage retour
  body.appendChild(back);

  body.appendChild(
    el(`<div class="detail-illu"><img src="${illustrationPour(recette)}" alt="" aria-hidden="true" /></div>`)
  );
  body.appendChild(el(`<h1 class="dish-name">${esc(recette.nom)}</h1>`));
  body.appendChild(
    el(`<div class="badges">
      <span class="badge hl">${ICONS.horloge} ${recette.temps_min} min</span>
      <span class="badge">${ICONS.liste} ${recette.nb_comptables} ingrédients</span>
      <span class="badge">${ICONS.poele} ${esc(libelleEquipement(recette))}</span>
    </div>`)
  );

  // ── Sélecteur de personnes (met les quantités à l'échelle) ─────────────────
  const portionsRow = el(
    `<div class="portions">
       <span class="portions-label">${ICONS.portions} Personnes</span>
       <div class="portions-ctrl">
         <button class="portions-btn moins" aria-label="Moins de personnes">−</button>
         <span class="portions-val" aria-live="polite">${portions}</span>
         <button class="portions-btn plus" aria-label="Plus de personnes">+</button>
       </div>
     </div>`
  );
  const valEl = portionsRow.querySelector('.portions-val');
  const setPortions = async (n) => {
    portions = Math.min(12, Math.max(1, n));
    valEl.textContent = String(portions);
    ctx.etat.portions = portions;
    await ctx.sauver(storage.CLES.PORTIONS, portions);
    rendreIngredients();
  };
  portionsRow.querySelector('.moins').addEventListener('click', () => setPortions(portions - 1));
  portionsRow.querySelector('.plus').addEventListener('click', () => setPortions(portions + 1));
  body.appendChild(portionsRow);

  // ── Ingrédients (re-rendus quand le nombre de personnes change) ────────────
  const ligne = (ing, manque) => {
    const q = formatQuantitePortions(ing.quantite, portions, recette.portions);
    const libelle = q ? `${q} ${ing.nom}` : ing.nom;
    const marque = manque
      ? '<span class="dot-need" aria-hidden="true"></span>'
      : `<span class="tick" aria-hidden="true">${ICONS.check}</span>`;
    const etat = manque ? 'à avoir' : 'disponible';
    // Ingrédient explicitement choisi par l'utilisateur ce soir → mis en avant.
    const choisi = choisis.includes(ing.nom);
    const badge = choisi ? '<span class="ing-pick">ton choix</span>' : '';
    const srPick = choisi ? '<span class="sr-only">ton ingrédient choisi : </span>' : '';
    const row = el(
      `<button class="ing-row${choisi ? ' choisi' : ''}" aria-pressed="false">${srPick}<span class="sr-only">${etat} :</span>${marque} <span class="ing-nom">${esc(libelle)}</span> ${badge}<span class="tag">${esc(ing.type)}</span></button>`
    );
    // Cocher/décocher (aide visuelle pendant les courses / la prépa).
    row.addEventListener('click', () => {
      const fait = row.classList.toggle('fait');
      row.setAttribute('aria-pressed', String(fait));
    });
    return row;
  };

  const ingWrap = el('<div class="ing-wrap"></div>');
  function rendreIngredients() {
    ingWrap.innerHTML = '';
    const possedes = recette.ingredients.filter((i) => !estManquant(i));
    const aAvoir = recette.ingredients.filter((i) => estManquant(i));
    if (possedes.length) {
      ingWrap.appendChild(el('<div class="group-title">Dans ton placard</div>'));
      possedes.forEach((i) => ingWrap.appendChild(ligne(i, false)));
    }
    if (aAvoir.length) {
      ingWrap.appendChild(el('<div class="group-title">À avoir</div>'));
      aAvoir.forEach((i) => ingWrap.appendChild(ligne(i, true)));
    }
  }
  rendreIngredients();
  body.appendChild(ingWrap);

  body.appendChild(el('<div class="group-title">Préparation</div>'));
  const steps = el('<ol class="steps" style="list-style:none"></ol>');
  recette.etapes.forEach((etape, idx) => {
    steps.appendChild(
      el(`<li class="step"><span class="num" aria-hidden="true">${idx + 1}</span><img class="step-icon" src="${iconePourEtape(etape)}" alt="" aria-hidden="true" /><p>${esc(etape)}</p></li>`)
    );
  });
  body.appendChild(steps);

  const actions = el('<div class="actions"></div>');
  const cuisiner = el('<button class="btn btn-primary">Je cuisine ça</button>');
  cuisiner.addEventListener('click', () => ctx.cuisiner(recette));
  actions.appendChild(cuisiner);
  body.appendChild(actions);

  screen.appendChild(body);
  return screen;
}
