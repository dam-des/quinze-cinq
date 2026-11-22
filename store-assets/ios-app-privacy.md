# App Store Connect — App Privacy (nutrition labels) — brouillon

> Réponses proposées pour le questionnaire « App Privacy » d'App Store Connect, avec justification
> factuelle sourcée pour chaque type de donnée. Damien valide/ajuste à la main dans la console.

## Résumé

- **Suivi (tracking) = Oui.** AdMob utilise l'identifiant publicitaire pour de la publicité tierce ;
  App Tracking Transparency est demandé avant (`src/js/ads.js:62-64`, `requestTrackingAuthorization`).
- Un seul SDK tiers réseau embarqué : **Google AdMob/UMP** (`src/js/ads.js`, `ios/App/App/Info.plist:49-50`
  `GADApplicationIdentifier`). Aucun autre SDK réseau (pas de Supabase/Sentry/analytics propre —
  confirmé ci-dessous).
- Pas de compte utilisateur, pas de backend applicatif : `grep -rl supabase src/` ne retourne aucun
  fichier (le dossier `supabase/` à la racine est un résidu non importé par le code embarqué,
  confirmé par l'absence d'import dans `src/`). `README.md` §Architecture décrit une app
  « 100 % offline », aucune dépendance réseau pour la logique métier.

## Détail par type de donnée (catégories Apple)

### Identifiants
**Identifiant publicitaire** — **Collecté : Oui**
- Lié à l'utilisateur : Non (lié à l'appareil, pas à une identité)
- Utilisé pour : **Publicité tierce** (AdMob)
- Utilisé pour le suivi (tracking) : **Oui**
- Justification : `src/js/ads.js:62-64` (ATT demandé avant initialisation AdMob) ; `ads.js:10-29`
  (blocs AdMob bannière + interstitiel réels, `PROD = true`) ; AdMob utilise par nature
  l'IDFA/identifiant publicitaire pour la pub ciblée, sauf refus ATT (pub non personnalisée dans ce cas,
  cf. `privacy.html:56-58`).

### Données d'usage
**Interactions publicitaires / données de diagnostic publicitaire** — **Collecté : Oui**
- Utilisé pour : **Publicité tierce** (AdMob)
- Utilisé pour le suivi : **Oui** (dans la mesure où AdMob peut les relier à l'identifiant publicitaire
  côté Google en l'absence de refus)
- Justification : `src/js/ads.js:77-119` (affichage bannière + interstitiel via le SDK AdMob, qui
  collecte nativement des données d'usage pour la diffusion et la mesure publicitaire). Aucune
  collecte d'usage applicatif propre (pas d'event d'analytics custom dans `src/js/*.js`).

### Contenu utilisateur
**Non collecté.**
- Justification : aucun champ de saisie libre envoyé où que ce soit ; le garde-manger/préférences
  sont des cases à cocher stockées localement (`src/js/storage.js`, clés listées dans
  `docs/cadrage.md` §9) et ne quittent jamais l'appareil. Aucun appel réseau applicatif
  (`grep -rl supabase src/` vide ; pas de `fetch(` vers un backend métier dans `src/js/*.js`).

### Identité (nom, email, etc.)
**Non collecté.**
- Justification : aucune création de compte, aucun écran de connexion dans
  `src/js/screens/` (onboarding, home, detail, cooking, settings, privacy — aucun écran « login »).
  Confirmé par `README.md` : « App mobile 100 % offline, sans compte ni backend ».

### Coordonnées (email, téléphone, adresse)
**Non collecté.** Même justification que ci-dessus — aucun formulaire de contact in-app ; le contact
support est une adresse e-mail statique affichée dans `privacy.html:68`, jamais transmise par l'app.

### Localisation
**Non collecté.**
- Justification : aucune permission de localisation déclarée, aucun appel à une API de géolocalisation
  dans `src/js/*.js` (recherche de `geolocation`/`Geolocation` : aucune occurrence).

### Historique de navigation / achats
**Non collecté.** L'app n'a pas de navigateur intégré ni d'achat intégré (pas d'IAP configuré,
confirmé par l'absence de plugin `@capacitor-community/in-app-purchases` ou équivalent).

### Santé & fitness
**Non collecté.** L'estimation calorique (`src/js/calories.js`) est calculée **localement** à partir
des ingrédients de la recette (table `TABLE_KCAL`), jamais saisie ni transmise par l'utilisateur ;
ce n'est pas une donnée de santé personnelle au sens Apple (c'est une information nutritionnelle sur
le plat, pas sur la personne).

### Données financières
**Non collecté.** Pas de paiement in-app.

### Contacts
**Non collecté.** Aucune permission d'accès aux contacts dans `ios/App/App/Info.plist`.

### Diagnostics (hors publicité)
**Non collecté.** Pas de SDK de crash reporting/analytics (pas de Sentry, Firebase Analytics ou
équivalent dans les dépendances — vérifier `package.json`/Podfile si un SDK est ajouté plus tard,
il faudra alors mettre cette section à jour).

## Points de vigilance avant de valider dans App Store Connect

1. Si un SDK est ajouté plus tard (crash reporting, analytics), **ce document doit être mis à jour
   avant** de republier — ne jamais laisser la déclaration en décalage avec le code réel.
2. Le statut ATT/UMP doit rester cohérent : en cas de refus de tracking, AdMob bascule en pub non
   personnalisée (déjà géré, `privacy.html:56-58`), mais la déclaration "Tracking = Oui" reste valable
   car la **capacité** de tracking existe (c'est ce qu'Apple évalue, pas le taux d'opt-in réel).
