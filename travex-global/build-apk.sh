#!/usr/bin/env bash
# ============================================================
#  TRAVEX GLOBAL — CRÉATION DE L'APK (AUTO-SUFFISANT)
#  macOS / Linux
# ------------------------------------------------------------
#  Ce script installe tout ce qui manque (Node.js, dépendances,
#  EAS) puis compile l'APK Android dans le cloud Expo.
#  Résultat : un lien de téléchargement .apk installable.
#
#  UTILISATION :
#    chmod +x build-apk.sh
#    ./build-apk.sh
#
#  Il faut ensuite se connecter à un compte Expo (gratuit).
# ============================================================

set -e
BLUE='\033[1;34m'; GREEN='\033[1;32m'; RED='\033[1;31m'; NC='\033[0m'
info(){ echo -e "${BLUE}▶ ${NC}$1"; }
ok(){ echo -e "${GREEN}✅ ${NC}$1"; }
err(){ echo -e "${RED}❌ ${NC}$1"; }

# ------------------------------------------------------------
# 1) Vérifier / installer Node.js
# ------------------------------------------------------------
NODE_MAJOR=0
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR=$(node -v | sed 's/^v//' | cut -d. -f1)
fi

if [ "$NODE_MAJOR" -lt 18 ]; then
  info "Node.js n'est pas présent ou est trop ancien (requis : 18+). Installation en cours..."
  UNAME=$(uname -s)
  if [ "$UNAME" = "Linux" ]; then
    info "Détection : Linux -> installation via script NodeSource..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  elif [ "$UNAME" = "Darwin" ]; then
    info "Détection : macOS -> installation via Homebrew..."
    if command -v brew >/dev/null 2>&1; then
      brew install node
    else
      info "Homebrew absent -> installation du .pkg Node.js..."
      curl -fsSL https://nodejs.org/dist/v20.11.0/node-v20.11.0.pkg -o /tmp/node.pkg
      sudo installer -pkg /tmp/node.pkg -target /
    fi
  else
    err "Système non reconnu. Installe Node.js manuellement sur https://nodejs.org puis relance ce script."
    exit 1
  fi
  ok "Node.js installé."
fi

ensure_node(){
  if ! command -v node >/dev/null 2>&1; then
    export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
  fi
}
ensure_node
NODE_VER=$(node -v)
ok "Node.js : $NODE_VER"
info "npm : $(npm -v)"

# ------------------------------------------------------------
# 2) Dependencies du projet
# ------------------------------------------------------------
info "Installation des dépendances du projet (npm install)…"
npm install
ok "Dépendances installées."

# ------------------------------------------------------------
# 3) Outil EAS (Expo Application Services)
# ------------------------------------------------------------
if ! command -v eas >/dev/null 2>&1; then
  info "Installation de l'outil EAS (global)…"
  npm install -g eas-cli
fi
ok "EAS : $(eas --version 2>/dev/null || echo 'installé')"

# ------------------------------------------------------------
# 4) Connexion compte Expo (nécessaire)
# ------------------------------------------------------------
info "Connexion à ton compte Expo (un navigateur va s'ouvrir)."
info "Si tu n'as pas de compte : https://expo.dev/signup (gratuit, via Google)."
if eas whoami >/dev/null 2>&1; then
  ok "Déjà connecté en tant que : $(eas whoami)"
else
  eas login
fi
ok "Connexion OK."

# ------------------------------------------------------------
# 5) Lier le projet au compte Expo
# ------------------------------------------------------------
info "Liaison du projet à ton compte (eas init)…"
if [ -z "$(grep -A2 '"eas"' app.json | grep projectId | sed 's/.*: *"\(.*\)".*/\1/')" ]; then
  eas init --force || eas init
else
  info "Projet déjà lié."
fi
ok "Projet lié."

# ------------------------------------------------------------
# 6) Build APK (profile preview -> APK signé installable)
# ------------------------------------------------------------
info "Compilation de l'APK dans le cloud (5 à 10 minutes)…"
info "Profile 'preview' = APK signé, installable directement sur Android."
echo ""
echo "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo "  Quand EAS demande confirmation, réponds  y / Enter."
echo "  (Keystore : réponds  y / Enter pour en générer un.)"
echo "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
eas build -p android --profile preview

ok "Build terminé !"
echo ""
echo "──────────────────────────────────────────────────────────"
echo "  📱 TON APK EST PRÊT — COPY LE LIEN CI-DESSUS :"
echo "  (il est aussi dans https://expo.dev -> Builds)"
echo "  1) Ouvre le lien  -> télécharge le fichier .apk"
echo "  2) Envoie-le sur ton téléphone (WhatsApp / câble / cloud)"
echo "  3) Ouvre le .apk -> 'Installer'"
echo "  -> autorise 'Installation depuis des sources inconnues' si demandé"
echo "──────────────────────────────────────────────────────────"
