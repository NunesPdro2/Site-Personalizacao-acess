# Gotas de Amor — Personalizados

Pacote para rodar o site em qualquer computador (Windows, macOS ou Linux).

## Passo a passo

1. Instale o **Node.js versão LTS** (20.19 ou mais nova): https://nodejs.org
2. Descompacte esta pasta em qualquer lugar.
3. Dê dois cliques em:
   - **Windows:** `ABRIR-SITE.bat`
   - **macOS:** `abrir-site.command` (na primeira vez: botão direito → Abrir)
   - **Linux:** `abrir-site.sh` (ou `npm start` no terminal)

Na primeira vez ele baixa as dependências (precisa de internet, ~1 minuto). Depois disso o navegador abre sozinho em `http://localhost:5173`. Para encerrar, feche a janela preta ou aperte `Ctrl+C`.

## Comandos (terminal)

| Comando | O que faz |
|---|---|
| `npm start` | instala (se preciso) e abre o site em modo de edição |
| `npm run site` | gera a versão final e abre ela em `http://localhost:4173` |
| `npm run build` | gera a pasta `dist/`, pronta para publicar em qualquer hospedagem estática |
| `npm run verificar` | confere se todos os arquivos do site estão na pasta |

## Acesso de teste (loja demonstrativa)

Esta versão é uma **loja de demonstração**: pagamento e frete são simulados e os dados ficam só no navegador.

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador (painel) | `admin@gotasdeamor.com` | `admin123` |
| Cliente | `cliente@gotasdeamor.com` | `cliente123` |

**Antes de usar de verdade:** em `auth.js` troque `SHOW_TEST_LOGIN = true` por `false` e mude a senha do administrador no painel.

## Cores (painel do administrador)

- Aba **Cores**: cadastre novas cores-base (escolha a cor e dê um nome), renomeie ou exclua. Ao adicionar, dá para oferecê-la já em todos os produtos.
- Aba **Produtos → Editar**: marque quais cores cada produto oferece ao cliente.
- A loja já vem com 11 cores-base (antes eram 3 a 4 por produto). Pedidos antigos mantêm a cor da época.

## Outros aparelhos na mesma rede

O Vite mostra, ao iniciar, um endereço `Network: http://192.168.x.x:5173`. Abra-o no celular conectado ao mesmo Wi-Fi. (O modo offline/instalável via service worker só funciona em `localhost` ou `https`.)

## Publicar

Rode `npm run build` e envie o conteúdo de `dist/` para Netlify, Vercel, GitHub Pages, Hostinger etc. Antes de cada atualização publicada, aumente o número em `VERSION` no `sw.js` (ex.: `gotas-v6`).

## Estrutura

```
index.html, admin.html        páginas da loja e do painel
manifest.webmanifest          dados do app instalável (ícones, cores)
app.js, auth.js, admin.js     scripts
store.js, styles.css, admin.css, sw.js
assets/                       imagens e bibliotecas (React, htm)
vite.config.mjs, scripts/     configuração e iniciador
```

Observação: os dados (catálogo e pedidos) ficam no `localStorage` do navegador de cada máquina.
