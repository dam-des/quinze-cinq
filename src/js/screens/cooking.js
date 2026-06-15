// cooking.js — Mode cuisine plein écran : une étape à la fois, gros texte lisible
// à distance, progression, navigation précédent/suivant. Dernière étape →
// « Bon appétit » + 👍/👎 optionnel (écrit l'appréciation).

import { el, esc, annoncer } from '../ui.js';

export default function renderCuisine(ctx, { recette }) {
  const etapes = recette.etapes;
  let i = 0; // index d'étape ; etapes.length = écran de fin

  const screen = el('<section class="screen actif" aria-label="Mode cuisine"></section>');
  const body = el('<div class="body-scroll" style="padding-top:0"></div>');
  screen.appendChild(body);

  const quitter = () => {
    ctx.calculerProposition();
    ctx.aller('home');
  };

  function barres(actives, total) {
    return Array.from({ length: total }, (_, k) =>
      `<i class="${k < actives ? 'on' : ''}"></i>`
    ).join('');
  }

  function rendreEtape() {
    body.innerHTML = '';
    const top = el(
      `<div class="cook-top">
         <button class="cook-close" aria-label="Quitter le mode cuisine">✕</button>
         <div class="cook-prog" aria-hidden="true">${barres(i + 1, etapes.length)}</div>
       </div>`
    );
    top.querySelector('.cook-close').addEventListener('click', quitter);
    body.appendChild(top);

    body.appendChild(
      el(`<div class="cook-step-no">Étape ${i + 1} sur ${etapes.length}</div>`)
    );
    body.appendChild(el(`<h1 class="cook-text">${esc(etapes[i])}</h1>`));
    body.appendChild(el('<div class="spacer"></div>'));

    const nav = el('<div class="cook-nav"></div>');
    const prec = el('<button class="btn btn-ghost">Précédent</button>');
    prec.disabled = i === 0;
    prec.addEventListener('click', () => {
      if (i > 0) { i--; rendreEtape(); }
    });
    const dernier = i === etapes.length - 1;
    const suiv = el(
      `<button class="btn btn-primary">${dernier ? 'Terminer' : 'Étape suivante'}</button>`
    );
    suiv.addEventListener('click', () => {
      i++;
      if (i >= etapes.length) rendreFin();
      else rendreEtape();
    });
    nav.append(prec, suiv);
    body.appendChild(nav);

    annoncer(`Étape ${i + 1} sur ${etapes.length}. ${etapes[i]}`);
  }

  function rendreFin() {
    body.innerHTML = '';
    const top = el(
      `<div class="cook-top">
         <button class="cook-close" aria-label="Fermer">✕</button>
         <div class="cook-prog" aria-hidden="true">${barres(etapes.length, etapes.length)}</div>
       </div>`
    );
    top.querySelector('.cook-close').addEventListener('click', quitter);
    body.appendChild(top);

    const wrap = el(
      `<div class="end-wrap">
         <div class="end-emoji" aria-hidden="true">🍳</div>
         <h1 class="end-title">Bon appétit&nbsp;!</h1>
         <p class="end-sub">Tu as aimé ce plat&nbsp;?</p>
         <div class="rate" role="group" aria-label="Ton avis sur ce plat">
           <button class="up" aria-label="J'ai aimé">👍</button>
           <button class="down" aria-label="Je n'ai pas aimé">👎</button>
         </div>
         <button class="end-skip">Passer</button>
       </div>`
    );
    const finir = async (appreciation) => {
      if (appreciation) await ctx.noter(recette.id, appreciation);
      quitter();
    };
    wrap.querySelector('.up').addEventListener('click', () => finir('aime'));
    wrap.querySelector('.down').addEventListener('click', () => finir('naime_pas'));
    wrap.querySelector('.end-skip').addEventListener('click', () => finir(null));
    body.appendChild(wrap);

    annoncer('Bon appétit ! As-tu aimé ce plat ?');
  }

  rendreEtape();
  return screen;
}
