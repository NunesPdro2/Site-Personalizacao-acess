import { arquivosFaltando } from './arquivos.mjs';

const faltando = arquivosFaltando();
if (!faltando.length) {
  console.log('✔ Todos os arquivos do site estão presentes.');
} else {
  console.log('\nFaltam estes arquivos na pasta do projeto:\n');
  faltando.forEach(f => console.log('  - ' + f));
  console.log('\nCopie-os para a pasta do projeto (mesmo lugar do package.json; as imagens vão em assets/).');
  if (faltando.includes('index.html')) process.exitCode = 1;
}
