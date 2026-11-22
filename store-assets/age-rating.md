# Classification d'âge — App Store (Age Rating) + Google Play (Content rating) — brouillon

> Réponses proposées, basées sur le contenu réel de l'app (recettes de cuisine). Damien valide dans
> les deux consoles (le questionnaire Google Play se fait via un formulaire externe IARC).

## Contenu réel de l'app (rappel factuel)

- Écrans : onboarding, accueil (proposition de plat), détail de recette, mode cuisine (étapes),
  réglages, politique de confidentialité (`src/js/screens/`).
- Pas de texte libre saisi par l'utilisateur, pas de réseau social, pas de partage, pas de chat.
- Pas de contenu généré par d'autres utilisateurs (UGC) : les recettes viennent d'un fichier JSON
  embarqué (`src/data/recettes_50.json`), pas d'un serveur ni d'autres utilisateurs.
- Publicité tierce (AdMob) présente — bannière + interstitiel (`src/js/ads.js`).

## App Store Connect — Age Rating

| Question Apple | Réponse | Justification |
|---|---|---|
| Violence réaliste/cartoon/fantastique | Aucune | Contenu = recettes de cuisine, aucune image ou texte violent. |
| Contenu sexuel/nudité | Aucun | Sans objet. |
| Langage grossier/humour noir | Aucun | Textes = noms de plats, ingrédients, étapes de préparation. |
| Thèmes matures/drogue/alcool/tabac | Aucun | Aucune recette à base d'alcool comme thème ciblé ; pas de contenu éditorial sur drogue/tabac. |
| Jeux d'argent simulés | Aucun | Pas de mécanique de jeu d'argent. |
| Contenu horrifique/effrayant | Aucun | Sans objet. |
| Contenus générés par les utilisateurs non modérés | Non | Pas d'UGC : recettes embarquées en local, pas de saisie libre partagée (`src/js/data.js`). |
| Réseautage non surveillé entre utilisateurs (chat, partage) | Non | Pas de fonctionnalité sociale ni de communication entre utilisateurs. |
| **Publicités tierces non ciblées à un public spécifique** | **Oui** | AdMob bannière + interstitiel réels (`src/js/ads.js:10-29`, `PROD = true`). **Déclaration obligatoire : "Advertising" / "Unrestricted Web Access" selon la case Apple — répondre Oui à la présence de publicité tierce, sinon risque de rejet pour déclaration incohérente avec le SDK présent.** |

**Classification attendue : 4+** (aucun contenu sensible), avec la case publicité tierce cochée Oui.

## Google Play Console — Content rating (questionnaire IARC)

| Section IARC | Réponse | Justification |
|---|---|---|
| Violence | Aucune | Idem ci-dessus. |
| Contenu sexuel | Aucun | Idem. |
| Langage choquant | Aucun | Idem. |
| Substances contrôlées (drogue/alcool/tabac) | Aucune référence | Pas de mise en avant de recettes à base d'alcool comme produit ; pas de section "cocktails". *(Si le catalogue contient une recette avec de l'alcool comme simple ingrédient culinaire, cela reste en général classé "référence" légère — vérifier `src/data/*.json` si doute, mais aucune recette de ce type identifiée dans le périmètre actuel.)* |
| Jeux d'argent simulés | Non | Sans objet. |
| Contenu généré par les utilisateurs | Non | Pas d'UGC (recettes embarquées, pas de partage entre utilisateurs). |
| Interactions entre utilisateurs (chat, partage de localisation) | Non | Aucune fonctionnalité sociale. |
| **Publicité dans l'app** | **Oui** | AdMob bannière + interstitiel réels (`android/app/src/main/AndroidManifest.xml:13-15`, `src/js/ads.js`). À déclarer explicitement dans le questionnaire IARC (case "Does this app contain ads?" = Oui) — **une réponse Non serait incohérente avec le SDK câblé et peut entraîner un rejet ou une suspension.** |
| Partage de la position | Non | Pas de géolocalisation. |
| Achats intégrés | Non | Pas d'IAP configuré. |

**Classification IARC attendue : PEGI 3 / Tout public**, avec la case publicité cochée Oui.

## Point d'attention commun (rappel du brief)

> Classification d'âge : si pubs, Advertising = Oui (sinon rejet automatique).

C'est bien le cas ici (AdMob réel, `PROD = true`) : les deux questionnaires doivent cocher la
présence de publicité tierce, même si la classification de contenu finale reste la plus basse
possible (4+ / Tout public) compte tenu de l'absence de contenu sensible.
