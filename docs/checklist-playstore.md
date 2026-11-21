# Checklist mise en prod — Google Play (Quinze Cinq)

Package : `com.quinzecinq.app` · Version : `1.0 (versionCode 1)` (`android/app/build.gradle:10-11`)

## État réel vérifié (2026-11-21)

- **Compte développeur Google Play** : non connu/non confirmé dans ce repo. Aucune trace de
  configuration Play Console (pas de `google-play-service-account.json`, pas de référence dans les
  scripts). **À vérifier/créer côté Damien.**
- **Clé de signature (keystore) Android** : **aucune trouvée**
  (`find android -iname "*.jks" -o -iname "*.keystore"` → vide). `android/app/build.gradle` ne
  définit aucun `signingConfigs` pour le build `release` (`android/app/build.gradle:17-22`) — la
  signature de release n'est pas câblée. **Rien n'est encore fait côté Android pour la signature.**
- **AdMob** : déjà câblé en PROD, comme côté iOS — `com.google.android.gms.ads.APPLICATION_ID`
  présent dans `android/app/src/main/AndroidManifest.xml:13-15`, blocs réels dans `src/js/ads.js:24-27`.
  Aucune action AdMob restante côté Android.

## 1. Compte développeur Google Play (action Damien)
1. https://play.google.com/console/signup — frais unique **~25 $**, si pas déjà fait pour un autre
   projet (le document de cadrage mentionne un compte Google Play personnel actif pour une 1re app
   « Gamoria » — à confirmer si c'est le même compte à réutiliser ou un compte dédié).
2. Accepter les accords développeur, configurer les infos de paiement/marchand si besoin pour les
   futures pubs/achats (ici pas d'IAP, donc optionnel).

## 2. Créer la fiche app dans Play Console (action Damien)
1. **Play Console › Créer une application** : nom « Quinze Cinq », langue par défaut français,
   app gratuite.
2. Métadonnées : cf. `store-assets/android-metadata.md` (titre, description courte/longue,
   catégorie Nourriture et boisson, tags).
3. Visuels : icône, captures d'écran (cf. liste des écrans à produire, format 1080×1920),
   image de présentation (feature graphic 1024×500) — à produire séparément si demandé.
4. URL de politique de confidentialité (champ obligatoire, bloquant) : page vitrine à publier
   d'abord (contenu déjà rédigé dans `privacy.html`).

## 3. Questionnaire Data Safety (action Damien)
- Brouillon complet prêt dans `store-assets/android-data-safety.md` (collecte/partage par type de
  donnée, cohérent avec AdMob réellement câblé). À reporter dans **Play Console › Politique de
  confidentialité et sécurité des données**.

## 4. Classification de contenu (action Damien)
- Brouillon complet prêt dans `store-assets/age-rating.md` (section Google Play / IARC). À remplir
  via le questionnaire externe IARC (**Play Console › Classification du contenu**) — cocher
  **Oui à la présence de publicité** (AdMob réel), sinon risque de rejet/suspension pour déclaration
  incohérente avec le SDK présent.

## 5. Clé de signature (action Damien — bloquant pour tout build release)
Aucun keystore trouvé dans le repo. Deux options :
- **Play App Signing (recommandé)** : laisser Google gérer la clé d'upload et la clé de signature
  finale — générer une clé d'upload locale (`keytool -genkey -v -keystore <chemin hors repo>.jks
  -keyalg RSA -keysize 2048 -validity 10000 -alias quinzecinq`), **à ne jamais committer dans le
  repo** (stocker hors repo + sauvegarder dans un gestionnaire de secrets).
- Configurer ensuite `android/app/build.gradle` avec un `signingConfigs.release` qui lit le
  keystore (via variables d'environnement ou `local.properties` non versionné), **pas de secret en
  clair dans le repo** (cf. règle sécurité globale).

> Un keystore existant n'est jamais régénéré automatiquement — si un ancien keystore existe ailleurs
> (autre machine, autre sauvegarde) pour ce `applicationId`, le retrouver plutôt qu'en créer un
> nouveau (un changement de clé de signature empêche de mettre à jour une app déjà publiée).

## 6. Build signé (action Damien, une fois la clé en place)
```bash
cd android && ./gradlew bundleRelease
```
(ou via Android Studio : **Build › Generate Signed Bundle / APK › Android App Bundle**)
- Sortie attendue : `android/app/build/outputs/bundle/release/app-release.aab`.
- Vérifier que `minifyEnabled false` (actuel, `android/app/build.gradle:18`) n'est pas bloquant pour
  la taille — à revoir plus tard si besoin, pas urgent pour la 1re soumission.

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
