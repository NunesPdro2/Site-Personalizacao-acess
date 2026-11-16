// Instala o que for preciso (só na primeira vez) e abre o site. Funciona em Windows, macOS e Linux.
// Uso: node scripts/iniciar.mjs          -> modo de edição/teste (vite)
//      node scripts/iniciar.mjs preview  -> gera a versão final (build) e abre ela
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ, arquivosFaltando } from './arquivos.mjs';

process.chdir(RAIZ);
const modo = process.argv[2] === 'preview' ? 'preview' : 'dev';

// Node mínimo exigido pelo Vite 8: 20.19+ ou 22.12+
const [maior, menor] = process.versions.node.split('.').map(Number);
if (!((maior === 20 && menor >= 19) || maior > 22 || (maior === 22 && menor >= 12))) {
  console.error(`\nSeu Node.js é a versão ${process.versions.node}, antiga demais.`);
  console.error('Instale a versão LTS em https://nodejs.org e rode de novo.\n');
  process.exit(1);
}

const faltando = arquivosFaltando();
if (faltando.includes('index.html')) {
  console.error('\nNão encontrei o index.html. Copie para esta pasta os arquivos que faltam:\n');
  faltando.forEach(f => console.error('  - ' + f));
  console.error('');
  process.exit(1);
}
if (faltando.length) {
  console.warn('\nAviso: estes arquivos não foram encontrados (partes do site podem não funcionar):');
  faltando.forEach(f => console.warn('  - ' + f));
  console.warn('');
}

const npm = (...args) => spawnSync('npm', args, { stdio: 'inherit', shell: true }).status ?? 1;

if (!existsSync(join(RAIZ, 'node_modules', 'vite'))) {
  console.log('Primeira execução: instalando dependências (precisa de internet, leva ~1 minuto)...\n');
  if (npm('install', '--no-audit', '--no-fund') !== 0) {
    console.error('\nA instalação falhou. Confira sua conexão com a internet e tente de novo.');
    process.exit(1);
  }
}

if (modo === 'preview') {
  if (npm('run', 'build') !== 0) process.exit(1);
  console.log('\nAbrindo a versão final do site... (Ctrl+C para encerrar)\n');
  process.exit(npm('run', 'preview', '--', '--open'));
}
console.log('\nAbrindo o site... (Ctrl+C para encerrar)\n');
process.exit(npm('run', 'dev', '--', '--open'));
