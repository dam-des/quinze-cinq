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
- Textes marketing + déclarations de confidentialité/âge rédigés en brouillon dans `store-assets/`
  (`ios-metadata.md`, `ios-app-privacy.md`, `age-rating.md`) — à relire et coller dans App Store
  Connect.

## 2. App Store Connect (action toi)
1. https://appstoreconnect.apple.com › **Apps › +** › nouvelle app iOS, bundle `com.quinzecinq.app`.
2. Métadonnées : nom, sous-titre, description, mots-clés (cf. `store-assets/ios-metadata.md`),
   catégorie (Cuisine/Food & Drink), URL de confidentialité (page vitrine à publier d'abord),
   **captures d'écran** (6.7" + 6.5" requis — cf. liste des écrans à produire).
3. **Confidentialité de l'app** (nutrition labels) : cf. `store-assets/ios-app-privacy.md` —
   déclarer **Identifiants** + **Données d'usage** utilisés pour la **publicité tierce** +
   **suivi = Oui** (à cause d'AdMob).
4. **Classification d'âge** : cf. `store-assets/age-rating.md` — cocher la présence de publicité
   tierce (Oui), sinon risque de rejet pour déclaration incohérente.
5. Tarification : gratuit.

## 3. Build & upload (Xcode, action toi)
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
- [ ] Captures d'écran à jour (build Release sur simulateur ou appareil, aucune bannière DEBUG visible).
- [ ] Test fermé TestFlight OK (icône, notif, pubs réelles, ATT/consentement).
- [ ] URL de politique de confidentialité et URL de support valides et en ligne (page vitrine).
- [ ] Après publication : associer l'app iOS à sa fiche App Store dans AdMob (App Store ID) —
  sinon aucune pub ne se diffuse malgré le câblage code.
