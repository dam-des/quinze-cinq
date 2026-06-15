#!/usr/bin/env bash
# Déploiement Wi-Fi de Quinze Cinq sur iPhone via `xcrun devicectl`.
# `npx cap run ios` (native-run) ne gère pas le Wi-Fi ; devicectl si.
# Prérequis : iPhone déverrouillé, sur le MÊME Wi-Fi que le Mac, Mode développeur activé.
# Usage : npm run ios:wifi   (ou : bash scripts/deploy-wifi.sh [DEVICE_ID])
set -e

DEV="${1:-84A4B532-76D1-5946-B957-3731114758BA}"   # identifiant devicectl de l'iPhone
BUNDLE="com.quinzecinq.app"

cd "$(dirname "$0")/.."
echo "→ Synchronisation des assets web…"
npx cap sync ios

cd ios/App
# DerivedData hors du projet (évite le conflit « CLEAN FAILED » sur ios/App/build).
DERIVED="/tmp/q5-derived"
echo "→ Build (device)…"
xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug -sdk iphoneos \
  -destination 'generic/platform=iOS' -derivedDataPath "$DERIVED" -allowProvisioningUpdates build \
  >/tmp/q5build.log 2>&1 || { echo "BUILD FAILED :"; grep -iE 'error:' /tmp/q5build.log | head; exit 1; }

APP="$DERIVED/Build/Products/Debug-iphoneos/App.app"
echo "→ Installation Wi-Fi…"
for i in $(seq 1 40); do
  if xcrun devicectl device install app --device "$DEV" "$APP" >/tmp/q5install.log 2>&1; then
    xcrun devicectl device process launch --device "$DEV" "$BUNDLE" >/dev/null 2>&1 || true
    echo "✓ Installée et lancée sur l'iPhone."
    exit 0
  fi
  echo "  iPhone pas encore joignable (essai $i) — garde-le déverrouillé…"
  sleep 6
done
echo "✗ Échec : iPhone injoignable. Vérifie : déverrouillé + même Wi-Fi que le Mac."
exit 1
