// cooking.js — Mode cuisine plein écran : une étape à la fois, gros texte,
// illustration de catégorie, écran maintenu allumé, MINUTEUR PERSISTANT (continue
// en fond quand on change d'étape), retours haptiques, 👍/👎 final.

import { el, esc, annoncer } from '../ui.js';
import { streakCuisine } from '../engine.js';
import { iconePourEtape } from '../icones.js';
import * as keepawake from '../keepawake.js';
import * as haptics from '../haptics.js';
import * as notifications from '../notifications.js';

export default function renderCuisine(ctx, { recette }) {
  const etapes = recette.etapes;
  let i = 0;
  // Minuteur de cuisine : vit hors du rendu d'étape → continue à tourner même
  // quand on avance / recule pour lire la suite. { interval, restant, etape }.
  let timer = null;

  keepawake.garderEveille(); // l'écran ne se verrouille pas pendant la cuisine

  const screen = el('<section class="screen actif" aria-label="Mode cuisine"></section>');
  const body = el('<div class="body-scroll" style="padding-top:0"></div>');
  screen.appendChild(body);

  // Barre de minuteur persistante (toujours visible, ne défile pas, survit aux étapes).
  const bar = el(
    `<div class="timer-bar" role="status" aria-live="polite" hidden>
       <span class="timer-bar-txt"></span>
       <button class="timer-bar-pause" aria-label="Mettre en pause">Pause</button>
       <button class="timer-bar-stop" aria-label="Arrêter le minuteur">Arrêter</button>
     </div>`
  );
  const barTxt = bar.querySelector('.timer-bar-txt');
  const barPause = bar.querySelector('.timer-bar-pause');
  barPause.addEventListener('click', () => basculerPause());
  bar.querySelector('.timer-bar-stop').addEventListener('click', () => arreterTimer());
  screen.appendChild(bar);

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Reflète l'état du minuteur (en cours / en pause) sur la barre + le bouton d'étape.
  function majAffichage() {
    if (timer) {
      barTxt.textContent =
        `${timer.enPause ? '⏸' : '⏱'} ${fmt(timer.restant)} · étape ${timer.etape + 1}` +
        (timer.enPause ? ' · en pause' : '');
      barPause.textContent = timer.enPause ? 'Reprendre' : 'Pause';
      barPause.setAttribute('aria-label', timer.enPause ? 'Reprendre le minuteur' : 'Mettre en pause');
    }
    const btn = body.querySelector('.cook-timer');
    if (!btn) return;
    const minutes = parseInt(btn.dataset.minutes, 10);
    if (timer && timer.etape === i) {
      btn.classList.add('running');
      btn.classList.remove('done');
      btn.textContent = timer.enPause
        ? `⏸ ${fmt(timer.restant)} · taper pour reprendre`
        : `⏱ ${fmt(timer.restant)} · taper pour mettre en pause`;
    } else {
      btn.classList.remove('running', 'done');
      btn.textContent = `⏱ Lancer ${minutes} min`;
    }
  }

  function tick() {
    timer.restant--;
    if (timer.restant <= 0) {
      clearInterval(timer.interval);
      notifications.annulerMinuteur(); // évite le doublon si app au premier plan
      const etapeIdx = timer.etape;
      timer = null;
      barTxt.textContent = `⏱ Terminé · étape ${etapeIdx + 1}`;
      barPause.hidden = true;
      haptics.notif('SUCCESS');
      annoncer('Minuteur terminé.');
      majAffichage();
      setTimeout(() => { if (!timer) bar.hidden = true; }, 6000);
      return;
    }
    majAffichage();
  }

  function arreterTimer() {
    if (timer) { clearInterval(timer.interval); timer = null; }
    notifications.annulerMinuteur(); // plus de notif de fin si on stoppe/quitte
    bar.hidden = true;
    barPause.hidden = false;
    majAffichage();
  }

  function basculerPause() {
    if (!timer) return;
    if (timer.enPause) {
      // Reprendre : relance le décompte + reprogramme la notif de fin.
      timer.enPause = false;
      notifications.lancerMinuteur(timer.restant, `Étape ${timer.etape + 1} : c’est prêt ! 🍳`);
      timer.interval = setInterval(tick, 1000);
      haptics.impact('LIGHT');
    } else {
      // Pause : fige le décompte + annule la notif (heure de fin inconnue tant qu'en pause).
      timer.enPause = true;
      clearInterval(timer.interval);
      timer.interval = null;
      notifications.annulerMinuteur();
      haptics.selection();
    }
    majAffichage();
  }

  function lancerTimer(secondes, etapeIdx) {
    if (timer) { clearInterval(timer.interval); notifications.annulerMinuteur(); }
    haptics.impact('LIGHT');
    timer = { restant: secondes, etape: etapeIdx, interval: null, enPause: false };
    // Alerte « téléphone » : notification sonore à la fin, même app fermée / écran éteint.
    notifications.lancerMinuteur(secondes, `Étape ${etapeIdx + 1} : c’est prêt ! 🍳`);
    bar.hidden = false;
    barPause.hidden = false;
    timer.interval = setInterval(tick, 1000);
    majAffichage();
  }

  const quitter = () => {
    arreterTimer();
    keepawake.laisserDormir();
    ctx.calculerProposition();
    ctx.aller('home');
  };

  const barres = (actives, total) =>
    Array.from({ length: total }, (_, k) => `<i class="${k < actives ? 'on' : ''}"></i>`).join('');

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

    body.appendChild(el(`<div class="cook-step-no">Étape ${i + 1} sur ${etapes.length}</div>`));
    // Icône d'action au-dessus du texte (décorative : le texte porte le sens).
    body.appendChild(
      el(`<div class="cook-step-icon"><img src="${iconePourEtape(etapes[i])}" alt="" aria-hidden="true" /></div>`)
    );
    body.appendChild(el(`<h1 class="cook-text">${esc(etapes[i])}</h1>`));

    // Minuteur si l'étape mentionne une durée (« 8 min »).
    const m = etapes[i].match(/(\d+)\s*min/);
    if (m) {
      const minutes = parseInt(m[1], 10);
      const btn = el(`<button class="cook-timer" data-minutes="${minutes}">⏱ Lancer ${minutes} min</button>`);
      btn.addEventListener('click', () => {
        if (timer && timer.etape === i) { basculerPause(); return; } // tap = pause / reprise
        lancerTimer(minutes * 60, i);
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

    majAffichage(); // reflète un minuteur déjà en cours / en pause sur cette étape
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
