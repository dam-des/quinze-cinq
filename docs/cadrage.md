# Document de cadrage — App de suggestion de repas (nom à définir)

> Prompt de reprise destiné à **Claude Code**. Conception figée, prête pour POC.
> Données associées : `recettes_poc.json`. Référence visuelle : `maquettes_15-5.html`.
> Direction de design retenue : **Encre & citron** (§13).

---

## 1. Contexte & objectif

Deuxième app mobile d'un développeur indépendant (comptes Apple Developer + Google Play Console
personnels actifs ; 1re app « Gamoria » déjà publiée). Objectif : rentabiliser les licences via la
publicité (AdMob), sur une app à forte rétention quotidienne. Conception faite en amont (ce document) ;
développement confié à Claude Code.

## 2. Le concept et son angle

**Promesse (différenciation centrale, à ne JAMAIS diluer) :**

> « Le soir, on décide pour toi. Toujours un plat, prêt en 15 minutes, 5 ingrédients max. »

- **Anti-charge mentale** : l'app décide à la place de l'utilisateur. **Un seul plat** proposé. Bouton
  « Autre chose » comme soupape.
- **Garantie tangible** : 15 min max et 5 ingrédients comptables max (hors basiques de placard : sel,
  poivre, huile, eau, beurre).
- **Effort minimal** : garde-manger pré-rempli ; au quotidien, l'utilisateur ne coche que le frais du
  soir, ou rien (« Surprends-moi »).

## 3. Analyse concurrentielle & positionnement

Marché fragmenté ; **aucun concurrent ne cumule les trois piliers** instant + décideur + contraint (15/5).

- **Catalogues frigo** (Frigo Magic ~4000 recettes, Crumb IA, SuperCook 11M+, KitchenPal) : misent sur
  le volume / des listes à parcourir. Les utilisateurs s'y perdent.
- **Planificateurs** (Jow 9M+, MesMenus, WeChef, Mealime) : organisation de la semaine + courses, effort
  en amont. Outil du « dimanche », pas du « 18h décide pour moi ».
- **Apps 15 min / 5 ingrédients** (5ingredients15minutes.com = site web ; « Recettes de 15 minutes » =
  catalogue statique ; RecipeChef = gestionnaire de recettes perso) : aucune ne fait de suggestion
  unique automatique.

| | Catalogue (parcourir) | Décideur (un seul plat) |
|---|---|---|
| Planification (semaine) | Jow, MesMenus, WeChef | — |
| Instant (ce soir) | Frigo Magic, Crumb, SuperCook | **← Notre place** |

Pièges à ne pas reproduire : surcharge d'options, dépendance backend coûteuse, inscription obligatoire.
Notre force : zéro inscription, zéro friction, un plat en quelques secondes, 100 % offline.

## 4. Décisions produit (figées)

- **Une seule proposition** à la fois (+ « Autre chose »).
- **Garde-manger pré-rempli par défaut** ; l'utilisateur retire ce qu'il n'a pas. Basique manquant →
  signalé (« il te manque peut-être : X »), pas exclu d'office.
- **Saisie quotidienne facultative** : un plat est proposé d'emblée ; cocher du frais est optionnel.
- **Tout local** : aucune collecte, aucun compte, aucun backend, offline. (La notification est locale.)

## 5. Stack & contraintes techniques

- **HTML / CSS / JS vanilla**, wrappé via **Capacitor** (iOS + Android).
- **Base de recettes embarquée** (JSON), aucune dépendance réseau pour la logique.
- **Persistance locale** via **Capacitor Preferences**.
- Seuls accès « système » : SDK AdMob (réseau) et notifications locales (pas de réseau).

### Dépendances cibles (à versionner par Claude Code)
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`
- `@capacitor/preferences` (persistance)
- `@capacitor/local-notifications` (rappel quotidien — **local**, pas de push serveur)
- `@capacitor-community/admob` (bannière + interstitiel + consentement UMP — vérifier le support UMP)
- Vanilla JS suffit (4–6 écrans) ; rester léger si structuration.

## 6. Architecture du projet (proposition)

```
/src
  index.html
  /css  styles.css           # design tokens (§13) + styles
  /js
    app.js                   # bootstrap, routing écrans, init AdMob/UMP/notifs
    data.js                  # chargement de recettes_poc.json
    engine.js                # MOTEUR DE MATCHING (cœur, §10) — pur, testable isolément
    storage.js               # wrapper Capacitor Preferences (§9)
    notifications.js         # wrapper local-notifications (planif/annulation rappel)
    screens/
      onboarding.js
      home.js                # proposition + vignettes frais + "Autre chose"
      detail.js              # détail plat + quantités + "Je cuisine ça"
      cooking.js             # MODE CUISINE plein écran (étapes une à une) + 👍/👎 final
      settings.js
  /data  recettes_poc.json   # garde-manger + 10 recettes (fourni)
  /illustrations             # 7 SVG par catégorie FOURNIS (feculent, oeufs, volaille, poisson,
                             #   viande, vegetarien, soupe) — trait encre + jaune, transparent,
                             #   offline. À intégrer tels quels (ne pas redessiner). Choix via `categorie`.
/capacitor.config.json
```

`engine.js` pur (entrées → sortie, sans effet de bord). `storage.js` et `notifications.js` isolent les
API natives. Les écrans n'affichent et n'appellent que le moteur/le storage.

## 7. Conformité (priorisée)

**Obligatoire :**
- **RGPD** : aucune donnée personnelle collectée (tout local, notif locale incluse). Seul point RGPD =
  AdMob → **UMP SDK (consentement)** avant toute pub ciblée ; refus → pub non personnalisée. Prévoir
  **politique de confidentialité** (in-app + stores).
- **Permission notifications** : demandée en **opt-in contextuel** (pas au démarrage brutal) ; refus
  géré proprement, réactivable dans Réglages. Notif locale → aucune donnée transmise.
- **Déclarations stores** : App Privacy (Apple) + Data Safety (Google) reflétant AdMob + l'usage de la
  permission notifications.
- **Google Play** : compte perso post-nov. 2023 → **test fermé (12 testeurs opt-in, 14 j continus)**
  avant production. +~14 j au planning.

**Recommandé (non obligatoire ici — microentreprise + hors secteurs EAA — mais visé comme qualité) :**
- **Accessibilité WCAG 2.1 AA** (checklist §13).

**Naturellement couvert :** sécurité (surface faible, pas de backend ni compte ; aucun secret en dur,
HTTPS only, dépendances à jour).

## 8. Modèle de données

### Garde-manger de base (pré-rempli)
Pâtes, riz, œufs, farine, huile d'olive, beurre, oignon, ail, lait, moutarde, bouillon cube, tomates
concassées, thon en conserve, maïs, chapelure.

### Schéma d'une recette
```json
{
  "id": "slug-unique",
  "nom": "Nom affiché",
  "temps_min": 15,
  "portions": 2,
  "ingredient_vedette": "frais star (matching quotidien) ou null si 100% placard",
  "categorie": "feculent | oeufs | volaille | poisson | viande | vegetarien | soupe",
  "ingredients": [
    { "nom": "...", "type": "base | frais", "quantite": { "valeur": 4, "unite": null } }
  ],
  "nb_comptables": 3,
  "equipement_requis": [],
  "etapes": ["Étape courte 1.", "Étape courte 2."],
  "tags": ["vegetarien", "enfant_friendly", "porc"]
}
```

> Convention d'exclusion : un tag de **contenu** (ex. `porc` = le plat contient du porc) permet à
> l'exclusion utilisateur correspondante de retirer le plat. Le filtre dur retire les plats **portant**
> le tag exclu.

**Conventions :**
- `type: base` = supposé au placard ; `type: frais` = à avoir / à cocher.
- `nb_comptables` ≤ 5, hors basiques de placard.
- `quantite` : `{ valeur, unite }` pour la **portion de base** (= `portions`). `unite: null` → comptable
  (« 4 œufs ») ; sinon `"g"`, `"boîte"`, `"tranches"`, `"gousses"`, `"c. à café"`… Assaisonnements de
  fond sans quantité, hors décompte. **Quantités affichées dès le POC.**
- `equipement_requis` : `[]` = poêle/plaque ; sinon `["four"]` / `["airfryer"]`. **Équipement utilisateur**,
  filtré selon ce qu'il possède.
- `ingredient_vedette: null` = plat 100 % placard → proposable sans saisie.
- Le **recalcul automatique** des quantités selon le nombre de convives reste v1.1.
- `illustration` (optionnel) : visuel par plat. **Par défaut, le visuel se déduit de `categorie`**
  (7 illustrations SVG réutilisables). Un override par-plat (champ `illustration`) est possible plus tard.

## 9. Persistance locale (Capacitor Preferences)

| Clé                | Contenu                                                                                  |
|--------------------|------------------------------------------------------------------------------------------|
| `onboarding_done`  | `true` une fois l'onboarding terminé                                                      |
| `garde_manger`     | tableau des basiques **possédés**                                                         |
| `equipements`      | `{ "four": bool, "airfryer": bool }`                                                      |
| `preferences`      | `{ "vegetarien": bool, "enfant_friendly": bool, "exclusions": [..] }`                     |
| `historique`       | `{ "<recetteId>": { "validation": <ts>, "affichage": <ts>, "appreciation": "aime\|naime_pas\|null" } }` |
| `reglage_notif`    | `{ "actif": bool, "heure": "18:00" }`                                                     |
| `consentement_pub` | statut UMP (selon l'API du plugin)                                                        |

L'historique **par catégorie** se recalcule depuis `historique` + la `categorie` de chaque recette.

## 10. Moteur de matching (cœur — `engine.js`)

Ne fait PAS qu'un filtre binaire : **classe** les plats par score et en sort **un seul**.

### Entrées
`garde_manger`, `equipements`, `frais_du_jour` (peut être vide), `preferences`, `historique`.

### Étape 1 — Filtres durs (JAMAIS relâchés)
Éliminer si : `equipement_requis` non couvert ; OU violation d'une préférence dure (végé → tag requis ;
exclusion → tag interdit présent).

### Étape 2 — Réalisabilité ingrédients
- **Pleinement réalisable** : tous les `base` ∈ garde_manger ET tous les `frais` ∈ frais_du_jour.
- **Réalisable avec appoint** : ≤ 1 frais manquant → autorisé, signalé.
- Mode « Surprends-moi » (`frais_du_jour` vide) : ≤ 1 frais manquant ; plats 100 % placard prioritaires.

### Étape 3 — Scoring (du score le plus durable au plus volatil)
Score de base (ex. 100), puis :
- **Préférence apprise (durable)** : `appreciation = aime` → **bonus** modéré durable ;
  `naime_pas` → **malus fort** durable (le plat tombe tout en bas, ne ressort qu'en dernier recours via
  relâchement — pas d'exclusion définitive au POC). Distinct de la récence : c'est un goût, pas une
  question de timing.
- **Récence du plat (temporaire, decay)** : fort si validé aujourd'hui, ~nul après ~4 jours. **Espacer
  sans obliger à parcourir toute la base** ; un favori revient toutes les ~1-2 semaines, indépendamment
  de la taille de la base. (PAS de « sac mélangé » qui épuise tout avant de répéter.)
- **Diversité catégorie** : malus léger si la `categorie` a été vue/validée dans les ~3 derniers jours.
- **Affichage récent** : petit malus court (~2 j) si zappé récemment.
- **Appoint** : léger malus si un ingrédient manque.
- **Frais coché** : bonus si le plat utilise un frais explicitement coché ce soir.

Classer par score décroissant ; **égalités départagées aléatoirement**.

### Étape 4 — « Autre chose »
Propose le **suivant**, marque le précédent comme « affiché », ne répète pas dans la session.

### Étape 5 — Relâchement anti-écran-vide (CRITIQUE sur petite base)
Si 0 candidat, relâcher **les malus soft uniquement**, dans l'ordre : (1) appoint → 2 frais manquants ;
(2) annuler diversité ; (3) annuler récence. Garantir ≥ 1 proposition.
> Les filtres durs ne sont **jamais** relâchés. Le malus « 👎 » se relâche **en tout dernier** (après
> récence), pour respecter le goût de l'utilisateur autant que possible.

### Validation & appréciation
- « Je cuisine ça » (depuis le détail) → écrit `validation` (ts) → ouvre le **mode cuisine**.
- À la fin du mode cuisine, le 👍/👎 (optionnel) écrit `appreciation`.
- Ouvrir le détail sans cuisiner = simple `affichage`.

## 11. Workflow détaillé

### Temps 1 — Premier lancement (onboarding, une seule fois)
1. Écran de marque (logo 15/5 + promesse en une ligne).
2. **Placard de base** (pré-rempli ; retirer ce qu'on n'a pas).
3. **Équipement** (Four, Airfryer).
4. **Préférences** (végé, plats enfants, exclusions).
5. **Opt-in rappel quotidien** (« un petit rappel le soir ? ») → si oui, demande la permission notif.
6. **Consentement publicitaire (UMP)** — juste avant l'entrée, aucune pub chargée avant ce choix.
7. Arrivée sur l'**accueil** avec une première proposition affichée.

### Temps 2 — Usage quotidien (cœur récurrent)
Ouverture → l'app affiche **immédiatement un plat** (« Surprends-moi », via placard + équipement +
préférences + historique). Trois voies :
- **Ça me va** → « Voir la recette » → **détail** (ingrédients + quantités, ce qu'on a / ce qui manque,
  étapes) → « **Je cuisine ça** » → **mode cuisine** plein écran (étapes une à une) → fin → **👍/👎**.
- **Autre chose** → plat suivant (sans répétition de session).
- **Orienter** → taper une/des **vignette(s) de frais** → matching relancé vers ces ingrédients.

Pub : bannière discrète permanente en bas de l'accueil ; **interstitiel** après plusieurs « Autre chose »
(jamais au lancement, jamais pendant une action).

### Temps 3 — Réglages (ponctuel)
Modifier placard / équipement / préférences ; **rappel quotidien** (on/off + heure) ; confidentialité
(politique + consentement pub).

### États & cas limites (à gérer explicitement)
- **Première utilisation** (pas d'historique) : scoring de base pur.
- **Frais coché sans plat correspondant** : pas d'écran vide → message (« aucune idée avec X ce soir —
  en voici une autre ») + proposition de repli.
- **Session épuisée / petite base** : le relâchement (§10.5) fournit toujours une proposition.
- **Filtres durs** (équipement, préférences) : jamais contournés.
- **Plat noté 👎** : quitte les propositions courantes (ne revient qu'en dernier recours).

## 12. Écrans (POC)

1. **Onboarding** (marque → placard → équipement → préférences → opt-in notif → consentement UMP).
2. **Accueil / proposition** : un plat héros avec **illustration de catégorie** en tête de carte,
   badges 15min/5ingr/équipement, vignettes frais, « Voir la recette » + « Autre chose », bannière pub.
   Jamais d'écran vide (§10.5).
3. **Détail** : **illustration de catégorie** en tête, nom, temps, portions, équipement, ingrédients
   **avec quantités** (distinguant ce qu'on a / ce qui manque), étapes ; bouton « Je cuisine ça ».
4. **Mode cuisine** (plein écran) : une étape à la fois, gros texte lisible à distance, indicateur de
   progression, navigation précédent/suivant ; dernière étape → « Bon appétit » + **👍/👎** optionnel.
5. **Réglages** : placard, équipement, préférences, rappel quotidien (on/off + heure), confidentialité.

## 13. Direction de design — « Encre & citron » (figée)

Tokens de couleur :
- `--surface: #FFFFFF` · `--ink: #16171B` · `--ink-soft: #71747C` · `--ink-faint: #A6A8AE`
- `--accent: #FFC400` (jaune — **seule couleur d'accent**) · `--accent-deep: #E0A500`
- `--line: #ECECE6` · `--line-strong: #E0E0D9` · `--chip: #F5F5F0`

Typographie :
- Display (titres, nom de plat, badges chiffrés, logo) : **Bricolage Grotesque** (600–800).
- Corps / UI : **Hanken Grotesk** (400–700).

Règles d'usage :
- Jaune **en aplat uniquement** (badge durée, logo, chip active), jamais en texte sur blanc.
- **Action principale = encre pleine** (`#16171B`, texte blanc) ; secondaire = contour encre.
- Rayons : cartes 20–22 px, boutons 14 px, chips 999 px. Bordures hairline `--line`.
- Le **plat est toujours le héros** de l'accueil. Référence : `maquettes_15-5.html`.

**Checklist accessibilité (WCAG 2.1 AA) :** HTML sémantique (`<button>`, `<label>`, titres) ; ARIA +
états annoncés (nouvelle proposition, étape du mode cuisine) ; focus visible ; cibles ≥ 44 px ;
contraste ≥ 4.5:1 ; pas d'info portée par la seule couleur ; labels explicites (vignettes, 👍/👎) ;
compatible VoiceOver / TalkBack. Mode cuisine : texte large, navigation simple.

## 14. Monétisation (AdMob)

- **UMP SDK** (consentement) obligatoire avant pub ciblée.
- **Bannière** discrète en bas de l'accueil.
- **Interstitiel** : jamais au lancement ni pendant une action ; après plusieurs « Autre chose »
  (ex. tous les 4-5). Non-respect = risque de suspension AdMob.
- **Rewarded** (évolution) : « voir plus d'idées », « débloquer la liste de courses ».
- Le **rappel quotidien** (notif locale) renforce la rétention → plus d'impressions, sans collecte.
- Revenu attendu modeste ; la rétention quotidienne est le vrai levier.
- POC : utiliser les **identifiants AdMob de test**.

## 15. Périmètre

**POC (immédiat)** : 10 recettes (`recettes_poc.json`), moteur complet, onboarding, accueil, détail avec
quantités, **illustrations de catégorie (7 SVG)**, **mode cuisine**, **👍/👎**, **rappel quotidien**,
réglages, persistance, AdMob en mode test.

**MVP (lancement)** : ~50 recettes (grille ci-dessous), AdMob + UMP réels, politique de confidentialité,
déclarations stores.

**Hors périmètre — v1.1+ :** liste de courses (+ rewarded ad), favoris/historique consultable, recalcul
automatique des quantités selon convives, génération IA optionnelle, filtres avancés, planning de
semaine, saisonnalité, « ne plus jamais proposer » (exclusion dure volontaire).

### Grille de répartition des 50 (MVP)
Féculents (pâtes/riz) : 12 · Œufs/omelettes : 6 · Volaille : 8 · Poisson & conserves : 6 · Viande
rapide : 6 · Végé/légumes : 8 · Soupes & salades-repas : 4. Transverse : ≥ ~15 enfant-friendly,
≥ ~15 végé, 8-10 airfryer.

## 16. Critères d'acceptation du POC (Definition of Done)

1. Au lancement, **sans saisie**, un plat réalisable s'affiche en < 1 s.
2. L'onboarding influence le matching (retirer un basique, cocher Airfryer, activer végé changent les
   propositions de façon cohérente).
3. Les plats `airfryer` n'apparaissent **que** si Airfryer est coché.
4. Une préférence dure est **toujours** respectée (en végé, aucun plat non-végé proposé).
5. « Autre chose » propose un plat **différent**, sans répéter dans la session.
6. « Je cuisine ça » enregistre la validation et ouvre le **mode cuisine** (étapes une à une, navigables,
   gros texte).
7. Un plat cuisiné n'est **pas** reproposé immédiatement, mais **réapparaît** après le decay (pas de sac
   mélangé : la base ne se vide pas).
8. Un **👎** retire le plat des propositions courantes ; un **👍** le favorise durablement.
9. **Jamais d'écran vide** : le relâchement (§10.5) fournit toujours une proposition (testé sur 10 plats).
10. La **notification quotidienne** se planifie à l'heure réglée et se reprogramme chaque jour ; on/off
    fonctionne ; refus de permission géré proprement.
11. Les données **persistent** après fermeture/réouverture.
12. Navigation et actions principales **utilisables au lecteur d'écran**.

## 17. Points de vigilance connus

- **Petite base (POC)** → relâchement anti-écran-vide (§10.5, §16.9) sollicité vite : tester en priorité.
- **Ne pas diluer l'angle** : un seul plat, 15 min / 5 ingrédients.
- **Récence ≠ exclusion** : decay, pas « sac mélangé » (§10.3).
- **👎 ≠ bannissement** : malus fort durable, mais relâché en dernier recours (§10.5).
- **Permission notif** : opt-in contextuel, jamais au démarrage brutal (§7, §11).
- **AdMob** : pub non intrusive obligatoire ; pub perso désactivée si public enfants ciblé.
- **Nom de l'app** : non arrêté (placeholder). Logo « 15/5 », nom de store proposé « Quinze Cinq ».

---

*Fin du document. Dossier de relais : `PROMPT_CLAUDE_CODE.md` (prompt de lancement) · ce cadrage ·
`recettes_poc.json` (10, POC) · `recettes_50.json` (50, MVP) · `cas_de_test_moteur.md` (validation) ·
`maquettes_15-5.html` (référence visuelle, 6 écrans) · `illustrations/` (7 SVG de catégorie fournis).*
