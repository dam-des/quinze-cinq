# Checklist mise en prod — App Store (Quinze Cinq)

Bundle : `com.quinzecinq.app` · Team : `43W4PXPVHP` · Version : `1.0.0 (1)`

## 1. AdMob — créer les comptes/blocs (action toi)
Sur https://apps.admob.com :
1. **Créer 2 applications** (une par plateforme) : « Quinze Cinq » iOS et « Quinze Cinq » Android.
   → chacune donne un **App ID** au format `ca-app-pub-XXXX~YYYY`.
2. Pour **chaque** app, créer **2 blocs** : une **Bannière** et un **Interstitiel**.
   → chaque bloc donne un **ID de bloc** au format `ca-app-pub-XXXX/ZZZZ`.

**À m'envoyer (6 valeurs) :**
- App ID iOS / App ID Android
- Bannière iOS / Interstitiel iOS
- Bannière Android / Interstitiel Android

Je câble alors : `src/js/ads.js` (blocs + `PROD = true`), `Info.plist` (`GADApplicationIdentifier` iOS),
`AndroidManifest.xml` (`APPLICATION_ID` Android), et je colle la **liste SKAdNetwork complète**
(https://developers.google.com/admob/ios/ios14#skadnetwork).

## 2. Déjà fait côté code/config
- ATT (App Tracking Transparency) demandé avant pubs + `NSUserTrackingUsageDescription`.
- UMP (consentement) au 1er lancement.
- `ITSAppUsesNonExemptEncryption = false` (pas de question chiffrement au dépôt).
- Icône d'app = « 15/5 » net (asset catalog). **Sur appareil de dev, l'icône peut rester en cache :
  supprimer l'app puis réinstaller. Sur une install TestFlight/App Store (neuve), elle est correcte.**

## 3. App Store Connect (action toi)
1. https://appstoreconnect.apple.com › **Apps › +** › nouvelle app iOS, bundle `com.quinzecinq.app`.
2. Métadonnées : nom, sous-titre, description, mots-clés, catégorie (Cuisine/Food & Drink),
   URL de confidentialité (cf. `docs/` privacy), **captures d'écran** (6.7" + 6.5" requis).
3. **Confidentialité de l'app** (nutrition labels) : déclarer **Identifiants** + **Données d'usage**
   utilisés pour la **publicité tierce** + **suivi = Oui** (à cause d'AdMob).
4. Tarification : gratuit.

## 4. Build & upload (Xcode, action toi)
```bash
open ios/App/App.xcworkspace
```
- Scheme **App** › destination **Any iOS Device (arm64)**.
- **Product › Archive** (signature de **distribution** automatique avec le Team 43W4PXPVHP).
- Organizer › **Distribute App › App Store Connect › Upload**.
- Le build apparaît dans App Store Connect (TestFlight) après traitement.

> Le build de distribution doit être en **Release** et signé avec un profil **App Store**
> (Xcode gère en signature automatique). `npm run ios:usb` ne sert qu'au test sur appareil.

## 5. Avant d'envoyer en revue
- [ ] `PROD = true` + vrais IDs AdMob câblés (sinon pubs de test en prod = violation AdMob).
- [ ] Liste SKAdNetwork complète collée.
- [ ] Captures d'écran à jour.
- [ ] Test fermé TestFlight OK (icône, notif, pubs réelles, ATT/consentement).
