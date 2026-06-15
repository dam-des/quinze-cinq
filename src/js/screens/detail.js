// detail.js — Détail recette : illustration, badges, ingrédients AVEC quantités
// (distinguant ce qu'on a / ce qui manque), étapes, bouton « Je cuisine ça ».

import { el, esc, ICONS } from '../ui.js';
import { ingredientsManquants } from '../engine.js';
import { illustrationPour, libelleEquipement, formatQuantite } from '../data.js';

export default function renderDetail(ctx, { recette }) {
  const manquants = ingredientsManquants(
    recette,
    ctx.etat.garde_manger,
    ctx.etat.frais_du_jour
  );
  const estManquant = (ing) => manquants.includes(ing);

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
      <span class="badge">${ICONS.portions} Pour ${recette.portions}</span>
      <span class="badge">${ICONS.poele} ${esc(libelleEquipement(recette))}</span>
    </div>`)
  );

  const possedes = recette.ingredients.filter((i) => !estManquant(i));
  const aAvoir = recette.ingredients.filter((i) => estManquant(i));

  const ligne = (ing, manque) => {
    const q = formatQuantite(ing.quantite);
    const libelle = q ? `${q} ${ing.nom}` : ing.nom;
    const marque = manque
      ? '<span class="dot-need" aria-hidden="true"></span>'
      : `<span class="tick" aria-hidden="true">${ICONS.check}</span>`;
    const etat = manque ? 'à avoir' : 'disponible';
    const row = el(
      `<button class="ing-row" aria-pressed="false"><span class="sr-only">${etat} :</span>${marque} <span class="ing-nom">${esc(libelle)}</span> <span class="tag">${esc(ing.type)}</span></button>`
    );
    // Cocher/décocher (aide visuelle pendant les courses / la prépa).
    row.addEventListener('click', () => {
      const fait = row.classList.toggle('fait');
      row.setAttribute('aria-pressed', String(fait));
    });
    return row;
  };

  if (possedes.length) {
    body.appendChild(el('<div class="group-title">Dans ton placard</div>'));
    possedes.forEach((i) => body.appendChild(ligne(i, false)));
  }
  if (aAvoir.length) {
    body.appendChild(el('<div class="group-title">À avoir</div>'));
    aAvoir.forEach((i) => body.appendChild(ligne(i, true)));
  }

  body.appendChild(el('<div class="group-title">Préparation</div>'));
  const steps = el('<ol class="steps" style="list-style:none"></ol>');
  recette.etapes.forEach((etape, idx) => {
    steps.appendChild(
      el(`<li class="step"><span class="num" aria-hidden="true">${idx + 1}</span><p>${esc(etape)}</p></li>`)
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
