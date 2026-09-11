#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Construit l'aperçu web de production :
#   1. npx expo export --platform web   -> dist/
#   2. copie vers dist-app/ avec des chemins simplifiés :
#        - bundle principal           -> /app.js?v=<version>
#        - police Ionicons            -> /ionicons.ttf
#      (certains proxys d'aperçu filtrent les chemins longs type
#       /_expo/static/... ou contenant "node_modules")
#
# Usage : bash scripts/build-web-preview.sh
# ---------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")/.."

# ---------------------------------------------------------------------------
# Patch web react-navigation : sur web, l'écran d'onglet actif reçoit
# pointerEvents 'box-none' — valeur INVALIDE en CSS. Le navigateur refuse
# la mise à jour et laisse l'ancien 'none' (écran inactif) : au retour sur
# un onglet déjà visité, l'écran reste définitivement non cliquable (les
# clics passent au travers vers l'écran précédent). On remplace par 'auto'
# (valide). Uniquement pour le build web : en natif, 'box-none' est géré
# correctement et EAS réinstalle node_modules sans ce patch.
# ---------------------------------------------------------------------------
NAVFILE="node_modules/@react-navigation/bottom-tabs/lib/module/views/BottomTabView.js"
NAVFILE_CJS="node_modules/@react-navigation/bottom-tabs/lib/commonjs/views/BottomTabView.js"
for f in "$NAVFILE" "$NAVFILE_CJS"; do
  if [ -f "$f" ]; then
    sed -i "s/pointerEvents: isFocused ? 'box-none' : 'none'/pointerEvents: isFocused ? 'auto' : 'none'/" "$f" || true
  fi
done
echo "==> Patch react-navigation (pointer-events onglets web) appliqué."

echo "==> Export Expo (web)..."
npx expo export --platform web

echo "==> Préparation de dist-app/..."
rm -rf dist-app
cp -r dist dist-app

# Nom réel du bundle généré
BUNDLE=$(ls dist-app/_expo/static/js/web/*.js | head -1)
BUNDLE_NAME=$(basename "$BUNDLE")

# Bundle -> /app.js
mv "$BUNDLE" dist-app/app.js

# Police Ionicons -> /ionicons.ttf
IONICONS=$(find dist-app/assets -name "Ionicons.*.ttf" | head -1)
if [ -n "$IONICONS" ]; then
  cp "$IONICONS" dist-app/ionicons.ttf
  IONICONS_NAME=$(basename "$IONICONS")
  # Remplace toutes les références au chemin long par le chemin simple
  sed -i "s|assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/${IONICONS_NAME}|ionicons.ttf|g" dist-app/app.js
fi

# Version incrémentée pour casser les caches (basée sur l'horodatage)
V=$(date +%s)
sed -i "s|src=\"/_expo/static/js/web/${BUNDLE_NAME}\"|src=\"/app.js?v=${V}\"|" dist-app/index.html

# Le dossier _expo n'est plus nécessaire
rm -rf dist-app/_expo

echo "==> OK : dist-app prêt (app.js?v=${V})"
grep -o 'src="[^"]*"' dist-app/index.html
