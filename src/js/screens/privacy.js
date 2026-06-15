// privacy.js — Politique de confidentialité in-app (version POC, alignée store).

import { el, ICONS } from '../ui.js';

export default function renderConfidentialite(ctx) {
  const screen = el('<section class="screen actif" aria-label="Politique de confidentialité"></section>');
  const body = el('<div class="body-scroll" style="padding-top:calc(var(--safe-top) + 14px)"></div>');

  const back = el(`<button class="back">${ICONS.fleche} Retour</button>`);
  const retour = () => ctx.aller('reglages');
  back.addEventListener('click', retour);
  ctx.retour = retour; // active le balayage retour
  body.appendChild(back);

  body.appendChild(el('<h1 class="set-h">Confidentialité</h1>'));
  body.appendChild(
    el(`<div class="legal">
      <p>Quinze Cinq fonctionne <b>100 % hors ligne</b>. L'application ne crée aucun compte et
      ne collecte aucune donnée personnelle.</p>

      <h2>Données stockées sur ton appareil</h2>
      <p>Ton garde-manger, ton équipement, tes préférences, ton historique de plats et le réglage
      du rappel restent <b>uniquement sur ton téléphone</b> (stockage local). Rien n'est envoyé sur
      un serveur. Désinstaller l'app efface ces données.</p>

      <h2>Notifications</h2>
      <p>Le rappel quotidien est une <b>notification locale</b> planifiée sur ton appareil. Aucune
      donnée n'est transmise. Tu peux l'activer ou la désactiver à tout moment dans les réglages.</p>

      <h2>Publicité</h2>
      <p>L'app affiche des publicités via Google AdMob pour rester gratuite. Avant toute publicité
      personnalisée, ton <b>consentement</b> est recueilli (formulaire UMP). En cas de refus, des
      publicités non personnalisées sont affichées. Tu peux revoir ton choix dans
      « Publicités &amp; consentement ».</p>

      <h2>Contact</h2>
      <p>Une question ? Écris à l'éditeur depuis la fiche de l'application sur le store.</p>
    </div>`)
  );

  screen.appendChild(body);
  return screen;
}
