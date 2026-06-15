# Prompt de démarrage — à copier-coller dans Claude Code

> Colle ce message au démarrage, avec les fichiers du dossier dans le contexte.

---

Tu vas développer le **POC** d'une application mobile à partir d'un dossier de conception complet.
Ne réinvente rien : tout est déjà décidé dans les fichiers fournis.

**Lis d'abord ces fichiers, dans cet ordre :**
1. `cadrage_app_repas.md` — la spécification maître (concept, workflow, moteur, écrans, design, conformité).
2. `recettes_poc.json` — les 10 recettes du POC (garde-manger de base + données).
3. `cas_de_test_moteur.md` — les comportements attendus du moteur de matching.
4. `maquettes_15-5.html` — la référence visuelle des 6 écrans (direction « Encre & citron »).
5. (`recettes_50.json` — la base complète pour le passage en MVP, pas nécessaire au POC.)

**Objectif :** construire le POC décrit, en **HTML/CSS/JS vanilla wrappé avec Capacitor** (iOS + Android),
**100 % offline**, sans compte ni backend.

**Ordre de développement imposé :**
1. `engine.js` (le moteur de matching) en premier — code **pur**, testable isolément. Écris des tests
   unitaires qui couvrent `cas_de_test_moteur.md` et fais-les passer **avant** de brancher l'UI.
2. Les 6 écrans (onboarding, accueil, détail, mode cuisine, fin/avis, réglages) selon les maquettes et
   la direction visuelle figée (section 13 du cadrage : tokens de couleur, Bricolage Grotesque + Hanken
   Grotesk, jaune `#FFC400` en accent unique).
3. La persistance locale (Capacitor Preferences, clés de la section 9).
4. En dernier : AdMob + consentement UMP (identifiants de test au POC) et les notifications locales.

**Contraintes à respecter absolument :**
- Les critères d'acceptation (section 16) et les points de vigilance (section 17) du cadrage.
- Récence par **decay**, pas d'exclusion stricte (pas de « sac mélangé »).
- Filtres durs (équipement, préférences, exclusions) **jamais** relâchés.
- Jamais d'écran vide (relâchement progressif, section 10.5).
- Ne dilue pas l'angle produit : un seul plat proposé, 15 min / 5 ingrédients.
- Accessibilité visée WCAG 2.1 AA (checklist section 13).

**Illustrations :** les **7 visuels de catégorie sont fournis** dans `illustrations/` (`feculent.svg`,
`oeufs.svg`, `volaille.svg`, `poisson.svg`, `viande.svg`, `vegetarien.svg`, `soupe.svg`) — trait encre +
accent jaune, fond transparent. **Intègre-les tels quels, ne les redessine pas.** Le visuel d'un plat se
choisit via son champ `categorie`. Affichage sur la carte du plat (accueil) et en tête du détail, dans
le conteneur à fond jaune pâle (gradient `#FFF4D2 → #FFFBEF`), comme dans `maquettes_15-5.html`. Un champ
optionnel `illustration` par plat pourra venir plus tard.

Pose-moi une question si un point te paraît ambigu, sinon commence par `engine.js` et ses tests.
