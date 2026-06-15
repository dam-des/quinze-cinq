// cooking.js — Mode cuisine plein écran : une étape à la fois, gros texte,
// écran maintenu allumé, minuteur d'étape, retours haptiques, 👍/👎 final.

import { el, esc, annoncer } from '../ui.js';
import { streakCuisine } from '../engine.js';
import * as keepawake from '../keepawake.js';
import * as haptics from '../haptics.js';

export default function renderCuisine(ctx, { recette }) {
  const etapes = recette.etapes;
  let i = 0;
  let timerId = null;

  keepawake.garderEveille(); // l'écran ne se verrouille pas pendant la cuisine

  const screen = el('<section class="screen actif" aria-label="Mode cuisine"></section>');
  const body = el('<div class="body-scroll" style="padding-top:0"></div>');
  screen.appendChild(body);

  const arreterTimer = () => {
    if (timerId) { clearInterval(timerId); timerId = null; }
  };
  const quitter = () => {
    arreterTimer();
    keepawake.laisserDormir();
    ctx.calculerProposition();
    ctx.aller('home');
  };

  const barres = (actives, total) =>
    Array.from({ length: total }, (_, k) => `<i class="${k < actives ? 'on' : ''}"></i>`).join('');

  function rendreEtape() {
    arreterTimer();
    body.innerHTML = '';
    const top = el(
      `<div class="cook-top">
         <button class="cook-close" aria-label="Quitter le mode cuisine">✕</button>
         <div class="cook-prog" aria-hidden="true">${barres(i + 1, etapes.length)}</div>
       </div>`
    );
    top.querySelector('.cook-close').addEventListener('click', quitter);
    body.appendChild(top);

    body.appendChild(el(`<div class="cook-step-no">Étape ${i + 1} sur ${etapes.length}</div>`));
    body.appendChild(el(`<h1 class="cook-text">${esc(etapes[i])}</h1>`));

    // Minuteur si l'étape mentionne une durée (« 8 min »).
    const m = etapes[i].match(/(\d+)\s*min/);
    if (m) {
      const minutes = parseInt(m[1], 10);
      let restant = minutes * 60;
      const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      const btn = el(`<button class="cook-timer">⏱ Lancer ${minutes} min</button>`);
      btn.addEventListener('click', () => {
        if (timerId) { // un tap pendant le décompte = arrêt
          arreterTimer();
          btn.classList.remove('running');
          btn.textContent = `⏱ Lancer ${minutes} min`;
          return;
        }
        haptics.impact('LIGHT');
        btn.classList.add('running');
        btn.textContent = `⏱ ${fmt(restant)}`;
        timerId = setInterval(() => {
          restant--;
          if (restant <= 0) {
            arreterTimer();
            btn.classList.remove('running');
            btn.classList.add('done');
            btn.textContent = '⏱ Terminé !';
            haptics.notif('SUCCESS');
            annoncer('Minuteur terminé.');
            return;
          }
          btn.textContent = `⏱ ${fmt(restant)}`;
        }, 1000);
      });
      body.appendChild(btn);
    }

    body.appendChild(el('<div class="spacer"></div>'));

    const nav = el('<div class="cook-nav"></div>');
    const prec = el('<button class="btn btn-ghost">Précédent</button>');
    prec.disabled = i === 0;
    prec.addEventListener('click', () => {
      if (i > 0) { haptics.selection(); i--; rendreEtape(); }
    });
    const dernier = i === etapes.length - 1;
    const suiv = el(`<button class="btn btn-primary">${dernier ? 'Terminer' : 'Étape suivante'}</button>`);
    suiv.addEventListener('click', () => {
      haptics.selection();
      i++;
      if (i >= etapes.length) rendreFin();
      else rendreEtape();
    });
    nav.append(prec, suiv);
    body.appendChild(nav);

    annoncer(`Étape ${i + 1} sur ${etapes.length}. ${etapes[i]}`);
  }

  function rendreFin() {
    arreterTimer();
    keepawake.laisserDormir();
    body.innerHTML = '';
    const top = el(
      `<div class="cook-top">
         <button class="cook-close" aria-label="Fermer">✕</button>
         <div class="cook-prog" aria-hidden="true">${barres(etapes.length, etapes.length)}</div>
       </div>`
    );
    top.querySelector('.cook-close').addEventListener('click', quitter);
    body.appendChild(top);

    const streak = streakCuisine(ctx.etat.historique, Date.now());
    const ligneStreak = streak >= 2 ? `<p class="end-streak">🔥 ${streak} soirs cuisinés d'affilée</p>` : '';
    const wrap = el(
      `<div class="end-wrap">
         <div class="end-emoji" aria-hidden="true">🍳</div>
         <h1 class="end-title">Bon appétit&nbsp;!</h1>
         ${ligneStreak}
         <p class="end-sub">Tu as aimé ce plat&nbsp;?</p>
         <div class="rate" role="group" aria-label="Ton avis sur ce plat">
           <button class="up" aria-label="J'ai aimé">👍</button>
           <button class="down" aria-label="Je n'ai pas aimé">👎</button>
         </div>
         <button class="end-skip">Passer</button>
       </div>`
    );
    const finir = async (appreciation) => {
      if (appreciation === 'aime') haptics.notif('SUCCESS');
      else if (appreciation === 'naime_pas') haptics.notif('WARNING');
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
