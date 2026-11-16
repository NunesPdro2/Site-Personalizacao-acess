#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "O Node.js não está instalado. Instale a versão LTS em https://nodejs.org (ou pelo gerenciador de pacotes da sua distribuição) e rode de novo."
  exit 1
fi
node scripts/iniciar.mjs
