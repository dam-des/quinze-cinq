# Google Play Console — Data safety — brouillon

> Réponses proposées pour la section « Sécurité des données » de Play Console, format Google
> (collecte / partage par type de donnée). Damien valide/ajuste à la main dans la console.

## Résumé

- Un seul SDK tiers réseau embarqué : **Google AdMob/UMP**
  (`android/app/src/main/AndroidManifest.xml:13-15`, `com.google.android.gms.ads.APPLICATION_ID` ;
  `src/js/ads.js`).
- Pas de compte, pas de backend applicatif (voir justification détaillée dans
  `store-assets/ios-app-privacy.md` — mêmes faits, valables sur Android : `grep -rl supabase src/`
  vide, aucun écran de connexion dans `src/js/screens/`).
- **Toutes les données sont-elles chiffrées en transit ?** Non applicable à l'app elle-même (pas
  d'appel réseau applicatif) ; le trafic AdMob est géré par le SDK Google (HTTPS, hors périmètre de
  déclaration ici).
- **L'utilisateur peut-il demander la suppression de ses données ?** Oui par défaut : toutes les
  données sont locales (`src/js/storage.js`), désinstaller l'app les efface (`privacy.html:46`). Pas
  de données serveur à supprimer puisqu'il n'y a pas de serveur applicatif.

## Détail par type de donnée (catégories Google Play)

### Position
**Non collecté.** Aucune permission de localisation dans `AndroidManifest.xml`, aucun appel API
de géolocalisation dans `src/js/*.js`.

### Informations personnelles (nom, email, adresse, identifiants utilisateur, etc.)
**Non collecté.** Aucune création de compte (pas d'écran login dans `src/js/screens/`), confirmé par
`README.md` (« sans compte ni backend »).

### Informations financières
**Non collecté.** Pas d'achat intégré.

### Santé et fitness
**Non collecté.** L'estimation calorique (`src/js/calories.js`) porte sur le **plat** (calcul local
à partir des ingrédients de la recette), pas sur une donnée personnelle de santé de l'utilisateur ;
rien n'est saisi ni transmis par l'utilisateur à ce sujet.

### Messages
**Non collecté.** Pas de messagerie in-app.

### Photos et vidéos
**Non collecté.** Aucune permission caméra/galerie dans `AndroidManifest.xml`.

### Fichiers audio
**Non collecté.**

### Contacts
**Non collecté.** Aucune permission contacts.

### Activité dans l'app
**Collecté : Oui (partiellement, via AdMob)**
- Type : interactions publicitaires (impressions, clics) collectées par le SDK AdMob pour la
  diffusion et la mesure publicitaire.
- Partagé avec : **Google (AdMob)**, à des fins de **publicité tierce**.
- Traité de façon éphémère ou collecté : collecté par le SDK tiers (hors contrôle applicatif direct).
- Justification code : `src/js/ads.js:77-119` (bannière + interstitiel réels, `PROD = true`,
  blocs câblés `android/app/src/main/AndroidManifest.xml:13-15`). Aucune autre activité in-app
  (navigation entre écrans, choix de recette) n'est transmise à un serveur — tout reste local
  (`src/js/storage.js`).

### Informations sur l'appareil ou autres identifiants
**Collecté : Oui — Identifiant publicitaire**
- Partagé avec : **Google (AdMob)**
- Finalité déclarée : **Publicité**
- Obligatoire ou optionnel : lié au consentement UMP (`src/js/ads.js:66-70`, `requestConsentInfo` /
  `showConsentForm`) — en cas de refus, pub non personnalisée (moins de données utilisées), mais la
  **capacité** de collecte via le SDK existe et doit être déclarée.

### Contenu généré par l'utilisateur
**Non collecté.** Garde-manger/préférences = cases à cocher locales, jamais transmises
(`docs/cadrage.md` §9, clés de `storage.js`).

## Sécurité des données — champs globaux

- **Chiffrement en transit** : sans objet pour les données applicatives (aucune donnée envoyée) ;
  le trafic AdMob est géré par le SDK Google.
- **Révision par un tiers de sécurité** : Non (pas pertinent pour une app de ce périmètre).
- **Suppression des données** : Oui, via désinstallation (pas de compte, pas de serveur applicatif
  à solliciter).

## Points de vigilance

- Cohérence à vérifier avec `store-assets/ios-app-privacy.md` : mêmes faits, même SDK AdMob, aucune
  divergence attendue entre les deux déclarations.
- Si un SDK supplémentaire est intégré plus tard (ex. crash reporting), mettre à jour ce document
  et republier le questionnaire Data safety avant la mise à jour correspondante.
