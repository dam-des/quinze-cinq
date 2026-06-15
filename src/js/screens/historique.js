// historique.js — « Mes plats » : favoris (👍) + déjà cuisinés, re-cuisiner en 1 tap.

import { el, esc, ICONS } from '../ui.js';
import { illustrationPour } from '../data.js';

export default function renderHistorique(ctx) {
  const screen = el('<section class="screen actif" aria-label="Mes plats"></section>');
  const body = el('<div class="body-scroll" style="padding-top:calc(var(--safe-top) + 14px)"></div>');

  const back = el(`<button class="back">${ICONS.fleche} Retour</button>`);
  const retour = () => ctx.aller('reglages');
  back.addEventListener('click', retour);
  ctx.retour = retour;
  body.appendChild(back);
  body.appendChild(el('<h1 class="set-h">Mes plats</h1>'));

  const h = ctx.etat.historique || {};
  const cuisines = ctx.catalogue.recettes
    .filter((r) => h[r.id] && h[r.id].validation)
    .sort((a, b) => (h[b.id].validation || 0) - (h[a.id].validation || 0));

  if (cuisines.length === 0) {
    body.appendChild(
      el('<p class="ob-sub" style="margin-top:18px">Tu n’as pas encore cuisiné de plat. Lance-toi ce soir&nbsp;! 🍳</p>')
    );
    screen.appendChild(body);
    return screen;
  }

  const favoris = cuisines.filter((r) => h[r.id].appreciation === 'aime');
  const autres = cuisines.filter((r) => h[r.id].appreciation !== 'aime');

  const ligne = (r) => {
    const app = h[r.id].appreciation;
    const avis = app === 'aime' ? '👍' : app === 'naime_pas' ? '👎' : '';
    const row = el(
      `<button class="hist-row">
         <span class="hist-illu"><img src="${illustrationPour(r)}" alt="" aria-hidden="true" /></span>
         <span class="hist-txt"><span class="hist-nom">${esc(r.nom)}</span><span class="hist-meta">${r.temps_min} min · ${r.nb_comptables} ingrédients</span></span>
         <span class="hist-avis" aria-hidden="true">${avis}</span>
         <span class="chev">›</span>
       </button>`
    );
    row.addEventListener('click', () => ctx.ouvrirDetail(r));
    return row;
  };

  const groupe = (titre, liste) => {
    if (!liste.length) return;
    body.appendChild(el(`<div class="gl" style="margin-top:18px">${esc(titre)}</div>`));
    const card = el('<div class="set-card"></div>');
    liste.forEach((r) => card.appendChild(ligne(r)));
    body.appendChild(card);
  };

  groupe('Favoris', favoris);
  groupe('Déjà cuisinés', autres);

  screen.appendChild(body);
  return screen;
}
