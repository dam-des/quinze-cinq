# Upload automatisé vers App Store Connect / Play Console

> Ajouté le 2026-11-22, lanes `fastlane ios upload` / `fastlane android upload`
> (fichier `fastlane/Fastfile`). Même pattern que sur Gamoria et Plantrace
> (voir `~/Documents/retro-vault/docs/FASTLANE_STORE_UPLOAD.md`) — remplace
> l'étape manuelle Transporter / upload direct Play Console décrite dans
> `docs/checklist-appstore.md` et `docs/checklist-playstore.md`, **seulement
> pour l'envoi du binaire**, voir garde-fous ci-dessous.

## Ce que ça fait, et surtout ce que ça ne fait pas

- `fastlane ios upload version:X.Y.Z` envoie l'IPA déjà buildé
  (`releases/ios/vX.Y.Z/QuinzeCinq_vX.Y.Z.ipa`, produit par `fastlane ios
  release`) sur App Store Connect. **`submit_for_review: false`,
  `automatic_release: false`** : le build arrive en traitement, mais rien
  n'est soumis à la review ni mis en ligne tout seul.
- `fastlane android upload version:X.Y.Z` envoie l'AAB déjà buildé
  (`releases/android/vX.Y.Z/QuinzeCinq_vX.Y.Z.aab`) sur la piste
  **production** de Play Console, en **`release_status: "draft"`** : la
  release est créée mais le rollout ne démarre pas.
- Dans les deux cas, la bascule finale (« Soumettre à la review » côté
  Apple, « Publier » côté Google) reste un clic manuel, volontairement.

## État au 2026-11-22

- **App Store Connect** : la fiche existait déjà (`app_id=6783429160`, SKU
  `quinzecinq-001`, créée le 2026-06-23) avec un build (version 1) déjà
  traité et sélectionné pour la version 1.0. Catégorie (Food & Drink),
  sous-titre, description et mots-clés remplis via l'API ConnectAPI
  (`store-assets/texts/description_fr.txt`). **Restent à faire à la main**
  (compliance, voir plus bas) : App Privacy (nutrition labels), classification
  d'âge, pricing/territoires, captures d'écran, URL de confidentialité (le
  champ ASC n'a pas encore été rempli automatiquement — coller
  `https://dam-des.github.io/quinze-cinq/privacy.html` une fois le site en
  ligne confirmé), puis Soumettre à la review.
- **Play Console** : aucune fiche n'existait. Le formulaire de création a
  été pré-rempli (nom, package `com.quinzecinq.app`, français, Appli,
  gratuite) mais **les deux cases de déclaration (règlement du programme
  pour développeurs + lois US sur l'export) et le clic final « Créer une
  application » ont été volontairement laissés à Damien** — tentative
  bloquée par le classificateur de sécurité (catégorie « Destructive or
  Unwanted Actions »), comportement attendu pour ce type de déclaration,
  identique au blocage déjà rencontré sur Gamoria pour l'octroi de
  permission de publication.
- **Clé de signature Android** : générée le 2026-11-22
  (`~/quinzecinq-upload-keystore.jks`, sauvegarde dans
  `~/Documents/quinze-cinq-keystore-backup/`, mot de passe aussi dans le
  trousseau macOS sous le service `quinzecinq-keystore-storepass`). AAB de
  test déjà buildé et vérifié signé avec cette clé.

## 1. App Store Connect — clé API

**Déjà fait, partagée avec les autres apps du compte** (Gamoria, Plantrace) :
variables d'environnement `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_PATH` déjà
exportées dans `~/.zshrc`. Rien à régénérer — une clé App Store Connect au
rôle **App Manager** gère n'importe quelle app du compte, pas une seule.

## 2. Google Play — compte de service

**Déjà fait pour l'essentiel**, comme sur Gamoria :

1. ✅ Compte de service `fastlane-play@damdes-play-publisher
   .iam.gserviceaccount.com`, clé JSON déjà présente
   (`~/.play/damdes-play.json`), variable `PLAY_JSON_KEY_PATH` déjà exportée
   dans `~/.zshrc`.
2. ❌ **Reste à faire, à la main par Damien, une fois l'app créée dans Play
   Console** (voir § État ci-dessus) : ce compte de service n'a **aucune
   permission** sur Quinze Cinq tant que l'app n'existe pas et que la
   permission n'est pas accordée explicitement. Marche à suivre une fois
   l'app créée :
   [Play Console → Utilisateurs et autorisations](https://play.google.com/console/u/0/developers/5796895767907336501/users-and-permissions)
   → **Inviter de nouveaux utilisateurs** → coller l'e-mail
   `fastlane-play@damdes-play-publisher.iam.gserviceaccount.com` → limiter
   l'accès à l'app **Quinze Cinq** uniquement → cocher **« Mettre les
   applications à disposition de tous les utilisateurs, exclure des
   appareils et utiliser la signature d'application Play »** (section
   « Versions ») → Appliquer → Inviter un utilisateur.

   Même raison que sur Gamoria : la lane cible la piste **production**
   (`track: "production"`), même en `draft` — Play Console découpe les
   permissions par piste, pas par statut brouillon/publié, donc il faut la
   permission de publication production même si le tooling ne s'en sert
   jamais pour publier réellement.

## 3. Utilisation

```sh
fastlane ios release version:1.0.0   # build + signe l'IPA
fastlane ios upload version:1.0.0    # envoie cette IPA sur App Store Connect
fastlane ios select_build version:1.0.0  # (déjà fait pour le build 1 via script ad hoc)

fastlane android release version:1.0.0   # build + signe l'AAB
fastlane android upload version:1.0.0    # envoie cet AAB sur Play Console (brouillon)
                                          # — échouera tant que la permission §2 n'est pas accordée
```

## Compliance — volontairement non automatisée

Classification d'âge et App Privacy / Data Safety ne sont **pas** remplies
via l'API dans ce projet : ce sont des déclarations formelles à Apple/Google,
avec des questionnaires guidés côté UI justement parce que l'ordre des
questions compte. Les réponses sont préparées et sourcées (fichier:ligne)
dans `store-assets/age-rating.md`, `store-assets/ios-app-privacy.md` et
`store-assets/android-data-safety.md` — à reporter à la main dans chaque
console plutôt qu'à écrire en brut via l'API.

## Sécurité

- `.p8`, le JSON du compte de service et le keystore Android ne sont
  **jamais** commités (patterns dans `.gitignore`) — uniquement référencés
  par chemin via variable d'environnement ou `android/key.properties`.
- Si l'un de ces fichiers est un jour exposé, le révoquer immédiatement
  depuis App Store Connect / Google Cloud Console, et pour le keystore
  Android : impossible à révoquer — une app déjà publiée reste liée à sa
  clé de signature pour toujours, d'où la sauvegarde dans
  `~/Documents/quinze-cinq-keystore-backup/`.
