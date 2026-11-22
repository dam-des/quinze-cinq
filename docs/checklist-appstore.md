# Checklist mise en prod — App Store (Quinze Cinq)

Bundle : `com.quinzecinq.app` · Team : `43W4PXPVHP` · Version : `1.0.0 (1)`

## 1. Déjà fait côté code/config
- **AdMob réel, câblé en PROD (vérifié 2026-11-21)** : `src/js/ads.js:10` (`PROD = true`), blocs
  bannière + interstitiel réels pour iOS et Android (`src/js/ads.js:19-27`), `GADApplicationIdentifier`
  présent dans `ios/App/App/Info.plist:49-50`, `com.google.android.gms.ads.APPLICATION_ID` présent
  dans `android/app/src/main/AndroidManifest.xml:13-15`. **Aucun compte/bloc AdMob à créer, cette
  étape est terminée** — l'ancienne section « créer les comptes/blocs AdMob » de cette checklist est
  donc obsolète et a été retirée.
- ATT (App Tracking Transparency) demandé avant pubs + `NSUserTrackingUsageDescription`.
- UMP (consentement) au 1er lancement.
- `ITSAppUsesNonExemptEncryption = false` (pas de question chiffrement au dépôt).
- Icône d'app = « 15/5 » net (asset catalog). **Sur appareil de dev, l'icône peut rester en cache :
  supprimer l'app puis réinstaller. Sur une install TestFlight/App Store (neuve), elle est correcte.**
- **Fiche App Store Connect déjà créée** (découvert 2026-11-22, `app_id=6783429160`,
  SKU `quinzecinq-001`, créée le 2026-06-23) — un build (version 1) existait déjà et a été
  sélectionné pour la version 1.0. Catégorie (Food & Drink), sous-titre, description, mots-clés,
  URL de confidentialité et URL de support remplis via l'API ConnectAPI (script ponctuel, cf.
  `docs/FASTLANE_STORE_UPLOAD.md`) à partir de `store-assets/ios-metadata.md`.
- **Page vitrine en ligne** (2026-11-22) : https://dam-des.github.io/quinze-cinq/ — privacy :
  https://dam-des.github.io/quinze-cinq/privacy.html
- Pipeline fastlane en place (`fastlane/Fastfile`) : `ios release` / `ios upload` /
  `ios select_build` — voir `docs/FASTLANE_STORE_UPLOAD.md` pour les identifiants (déjà
  configurés, partagés avec Gamoria/Plantrace) et l'usage.

## 2. Reste à faire à la main dans App Store Connect (action toi)
1. **Confidentialité de l'app** (nutrition labels) : cf. `store-assets/ios-app-privacy.md` —
   déclarer **Identifiants** + **Données d'usage** utilisés pour la **publicité tierce** +
   **suivi = Oui** (à cause d'AdMob). Volontairement non rempli via l'API (déclaration formelle,
   questionnaire guidé).
2. **Classification d'âge** : cf. `store-assets/age-rating.md` — cocher la présence de publicité
   tierce (Oui), sinon risque de rejet pour déclaration incohérente. Même raison, non automatisé.
3. **Captures d'écran** (6.7" + 6.5" requis) — pas encore produites dans ce lot (simulateur trop
   lent/capricieux lors de la tentative du 2026-11-21).
4. Tarification : gratuit (pas encore confirmé dans l'UI).
5. **Soumettre à la review** : geste humain final, volontairement jamais automatisé.

## 3. Build & upload — deux façons de faire

**Via fastlane (nouveau, recommandé)** :
```bash
bundle exec fastlane ios release version:1.0.0
bundle exec fastlane ios upload version:1.0.0
bundle exec fastlane ios select_build version:1.0.0
```

**Via Xcode (historique, toujours valide)** :
```bash
open ios/App/App.xcworkspace
```
- Scheme **App** › destination **Any iOS Device (arm64)**.
- **Product › Archive** (signature de **distribution** automatique avec le Team 43W4PXPVHP).
- Organizer › **Distribute App › App Store Connect › Upload** (ou via Transporter si export .ipa).
- Le build apparaît dans App Store Connect (TestFlight) après traitement.

> Le build de distribution doit être en **Release** et signé avec un profil **App Store**
> (Xcode gère en signature automatique). `npm run ios:usb` ne sert qu'au test sur appareil.

## 4. Avant d'envoyer en revue
- [x] `PROD = true` + vrais IDs AdMob câblés (vérifié `src/js/ads.js:10` et `:19-27` — sinon pubs de
  test en prod = violation AdMob).
- [x] Liste SKAdNetwork complète collée (vérifié `ios/App/App/Info.plist` — 50 entrées
  `SKAdNetworkIdentifier`).
- [x] URL de politique de confidentialité et URL de support valides et en ligne (page vitrine) —
  renseignées sur la fiche le 2026-11-22.
- [ ] Captures d'écran à jour (build Release sur simulateur ou appareil, aucune bannière DEBUG visible).
- [ ] App Privacy + classification d'âge déclarées dans l'UI (brouillons prêts, cf. § 2).
- [ ] Test fermé TestFlight OK (icône, notif, pubs réelles, ATT/consentement).
- [ ] Après publication : associer l'app iOS à sa fiche App Store dans AdMob (App Store ID) —
  sinon aucune pub ne se diffuse malgré le câblage code.
