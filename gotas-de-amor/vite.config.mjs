import { defineConfig } from 'vite';
import { cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ, PAGINAS, ESTATICOS } from './scripts/arquivos.mjs';

// Site com duas páginas (loja e painel). Só entram as que existirem.
const input = Object.fromEntries(
  PAGINAS.filter(p => existsSync(join(RAIZ, p))).map(p => [p.replace('.html', ''), join(RAIZ, p)])
);

// No build, copia scripts clássicos, CSS, sw.js e imagens para dist, com os mesmos nomes
// que o service worker (sw.js) e as páginas esperam.
const copiarEstaticos = {
  name: 'copiar-estaticos',
  apply: 'build',
  closeBundle() {
    for (const item of ESTATICOS) {
      if (existsSync(join(RAIZ, item))) cpSync(join(RAIZ, item), join(RAIZ, 'dist', item), { recursive: true });
    }
  }
};

export default defineConfig({
  root: RAIZ,
  base: './',               // o site funciona em qualquer pasta ou endereço
  server: { host: true, port: 5173 },   // host: true = também acessível por outros aparelhos da mesma rede
  preview: { host: true, port: 4173 },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: { input },
    rolldownOptions: { input }
  },
  plugins: [copiarEstaticos]
});
