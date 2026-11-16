#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "O Node.js não está instalado. Instale a versão LTS em https://nodejs.org e rode de novo."
  open https://nodejs.org/ 2>/dev/null
  read -p "Pressione Enter para fechar..."; exit 1
fi
node scripts/iniciar.mjs
