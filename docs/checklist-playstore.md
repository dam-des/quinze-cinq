# Checklist mise en prod — Google Play (Quinze Cinq)

Package : `com.quinzecinq.app` · Version : `1.0 (versionCode 1)` (`android/app/build.gradle:10-11`)

## État réel vérifié (2026-11-22)

- **Compte développeur Google Play** : compte d'organisation existant (« DamDes Studio »,
  ID `5796895767907336501`, mêmes compte que Gamoria/Plantrace/Mergezzle) — **pas de frais à payer
  à nouveau**, le compte est déjà créé et actif.
- **Fiche Play Console pour Quinze Cinq** : n'existe pas encore. Le formulaire de création a été
  pré-rempli (nom « Quinze Cinq », package `com.quinzecinq.app`, français, Appli, gratuite) à
  l'adresse https://play.google.com/console/u/0/developers/5796895767907336501/app/create —
  **reste à faire, à la main** : cocher les 2 cases de déclaration (règlement du programme pour
  développeurs + lois US sur l'export) et cliquer « Créer une application ». Tentative automatique
  bloquée par le classificateur de sécurité (catégorie « Destructive or Unwanted Actions »),
  comportement attendu pour ce type de déclaration.
- **Clé de signature (keystore) Android** : **générée le 2026-11-22**
  (`~/quinzecinq-upload-keystore.jks`, alias `quinzecinq`, validité jusqu'en 2054, sauvegarde dans
  `~/Documents/quinze-cinq-keystore-backup/`, mot de passe dans le trousseau macOS sous
  `quinzecinq-keystore-storepass`). `android/app/build.gradle` câblé (`signingConfigs.release` lit
  `android/key.properties`, non versionné). AAB de test buildé et vérifié signé avec cette clé.
- **AdMob** : déjà câblé en PROD, comme côté iOS — `com.google.android.gms.ads.APPLICATION_ID`
  présent dans `android/app/src/main/AndroidManifest.xml:13-15`, blocs réels dans `src/js/ads.js:24-27`.
  Aucune action AdMob restante côté Android.
- **Service account fastlane-play** : déjà existant et configuré (`PLAY_JSON_KEY_PATH` dans
  `~/.zshrc`, partagé avec les autres apps) — mais sans permission sur Quinze Cinq tant que l'app
  n'existe pas dans Play Console (confirmé : `insert_edit` sur `com.quinzecinq.app` retourne 404).

## 1. Compte développeur Google Play
✅ Déjà fait (compte « DamDes Studio », partagé avec les autres apps) — rien à payer, rien à créer.

## 2. Créer la fiche app dans Play Console (action Damien — reste 2 clics)
1. Onglet déjà ouvert et pré-rempli par la session : nom, package, langue, type, gratuité.
   Cocher les 2 cases « Déclarations » puis cliquer **Créer une application**.
2. Métadonnées : cf. `store-assets/android-metadata.md` (titre, description courte/longue,
   catégorie Nourriture et boisson, tags).
3. **Visuels prêts** (2026-11-22, `tool/store_graphics.py` + `tool/store_marketing.py`) :
   icône 512×512 (`store-assets/play/icon.png`), image de présentation 1024×500
   (`store-assets/play/featureGraphic.png`), 4 captures mises en page 1080×1920
   (`fastlane/metadata/android/fr-FR/images/phoneScreenshots/`, uploadées automatiquement
   par `fastlane android upload` une fois l'app créée et la permission accordée).
4. URL de politique de confidentialité (champ obligatoire, bloquant) :
   `https://dam-des.github.io/quinze-cinq/privacy.html` — **déjà en ligne**, prête à coller.
5. Une fois l'app créée : accorder la permission au service account (§ ci-dessous), condition pour
   que `fastlane android upload` fonctionne.

### Permission du service account (action Damien, après la création de l'app)
[Play Console → Utilisateurs et autorisations](https://play.google.com/console/u/0/developers/5796895767907336501/users-and-permissions)
→ **Inviter de nouveaux utilisateurs** → coller l'e-mail
`fastlane-play@damdes-play-publisher.iam.gserviceaccount.com` → limiter l'accès à l'app
**Quinze Cinq** uniquement → cocher **« Mettre les applications à disposition de tous les
utilisateurs, exclure des appareils et utiliser la signature d'application Play »** (section
« Versions ») → Appliquer → Inviter un utilisateur. Détail et justification complète dans
`docs/FASTLANE_STORE_UPLOAD.md`.

## 3. Questionnaire Data Safety (action Damien)
- Brouillon complet prêt dans `store-assets/android-data-safety.md` (collecte/partage par type de
  donnée, cohérent avec AdMob réellement câblé). À reporter dans **Play Console › Politique de
  confidentialité et sécurité des données**.

## 4. Classification de contenu (action Damien)
- Brouillon complet prêt dans `store-assets/age-rating.md` (section Google Play / IARC). À remplir
  via le questionnaire externe IARC (**Play Console › Classification du contenu**) — cocher
  **Oui à la présence de publicité** (AdMob réel), sinon risque de rejet/suspension pour déclaration
  incohérente avec le SDK présent.

## 5. Clé de signature
✅ **Fait (2026-11-22)** — `~/quinzecinq-upload-keystore.jks` généré, sauvegardé dans
`~/Documents/quinze-cinq-keystore-backup/`, câblé dans `android/app/build.gradle` via
`android/key.properties` (non versionné, `.gitignore` à jour).

> Rappel : ce keystore ne sera **jamais régénéré automatiquement** par la suite — une fois la
> première version publiée, un changement de clé de signature empêcherait de la mettre à jour.

## 6. Build signé
✅ Vérifié fonctionnel le 2026-11-22 (`cd android && ./gradlew bundleRelease`, AAB signé confirmé
par `jarsigner -verify`). Deux façons de relancer :
```bash
bundle exec fastlane android release version:1.0.0   # recommandé : bump aussi la version iOS en phase
# ou directement :
cd android && ./gradlew bundleRelease
```
- Sortie : `android/app/build/outputs/bundle/release/app-release.aab` (ou
  `releases/android/vX.Y.Z/` via la lane fastlane).
- `minifyEnabled false` (actuel, `android/app/build.gradle` après le bloc signingConfigs) — à
  revoir plus tard si la taille pose problème, pas urgent pour la 1re soumission.

## 7. Piste de test avant production (action Damien)
- Google Play exige, pour un compte développeur personnel créé après nov. 2023, un **test fermé
  (closed testing)** avec **12 testeurs opt-in actifs pendant 14 jours continus** avant l'accès à la
  production (cf. `docs/cadrage.md` §7). Prévoir ce délai dans le planning de publication.
- Créer la piste de test interne/fermée dans **Play Console › Tester › Tests fermés**, inviter les
  testeurs, distribuer le lien d'opt-in.

## 8. Soumission (action Damien)
- Une fois les 14 jours de test fermé validés, promouvoir la version vers la **production** dans
  Play Console. **Ne jamais soumettre automatiquement** — ce geste reste entièrement manuel.
- Après publication : vérifier côté AdMob que l'app Android est bien reliée à sa fiche Play Store
  (même principe que pour iOS/App Store ID) pour que les pubs se diffusent correctement.
