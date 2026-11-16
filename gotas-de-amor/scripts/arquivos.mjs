// Lista dos arquivos do site (a mesma do service worker) e verificação do que está presente.
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

export const PAGINAS = ['index.html', 'admin.html'];
// Arquivos "soltos" (scripts clássicos, CSS, service worker e imagens). O Vite não os copia
// sozinho no build, então vite.config.mjs os copia para a pasta dist.
export const ESTATICOS = ['sw.js', 'styles.css', 'store.js', 'auth.js', 'app.js', 'admin.js', 'admin.css', 'manifest.webmanifest', 'assets'];

const NECESSARIOS = [
  ...PAGINAS, 'manifest.webmanifest', 'styles.css', 'store.js', 'auth.js', 'app.js', 'admin.js', 'admin.css', 'sw.js',
  'assets/vendor/react.production.min.js', 'assets/vendor/react-dom.production.min.js', 'assets/vendor/htm.js',
  'assets/favicon.svg', 'assets/logo-original.jpg', 'assets/hero.png', 'assets/products.png',
  'assets/icon-192.png', 'assets/icon-512.png', 'assets/icon-maskable-512.png'
];

export function arquivosFaltando() {
  return NECESSARIOS.filter(f => !existsSync(join(RAIZ, f)));
}
