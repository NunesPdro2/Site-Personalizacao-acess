'use strict';

// Catálogo ilustrativo. Configure preços e disponibilidade reais antes de vender.
//
// Áreas de estampa: cada produto lista os lugares onde a arte pode ser aplicada.
//  - type 'block': área maior (frente, costas, caneca, ecobag), com imagem e frase em várias linhas.
//  - type 'line': área pequena (ombro), com símbolo/imagem pequena e frase curta em uma linha.
//  - box: posição no desenho de 400 × 400 da prévia (centro cx/cy, largura w, altura h e rotação rot).
//  - extraArea: valor ilustrativo cobrado por cada área além da primeira (use 0 para não cobrar).
const SHOULDER_HELP = 'Área pequena junto à gola: cabe uma frase curta (até 16 caracteres) ou um símbolo. Direito e esquerdo são sob o ponto de vista de quem veste.';
const defArea = (id, label, where, view, type, box, extra = {}) => ({ id, label, where, view, type, box, maxText: type === 'line' ? 16 : 36, ...extra });
const garmentAreas = shoulder => [
  defArea('front', 'Frente', 'na frente', 'front', 'block', { cx: 200, cy: 213.5, w: 122, h: 143 }, { help: 'Centro da peça, bem visível. Boa para frases e imagens.' }),
  defArea('back', 'Costas', 'nas costas', 'back', 'block', { cx: 200, cy: 205, w: 134, h: 160 }, { help: 'Espaço generoso nas costas, ótimo para frases maiores e imagens.' }),
  defArea('shoulderR', 'Ombro direito', 'no ombro direito', 'front', 'line', { cx: shoulder.x, cy: shoulder.y, w: 46, h: 16, rot: -shoulder.rot }, { group: 'Ombros', help: SHOULDER_HELP }),
  defArea('shoulderL', 'Ombro esquerdo', 'no ombro esquerdo', 'front', 'line', { cx: 400 - shoulder.x, cy: shoulder.y, w: 46, h: 16, rot: shoulder.rot }, { group: 'Ombros', help: SHOULDER_HELP })
];
const PRODUCTS = [
  { id: 'camiseta', name: 'Camiseta com a sua essência', short: 'Camiseta personalizada', category: 'camisetas', label: 'Camisetas', price: 59.90, extraArea: 10, detail: 'Algodão · frente, costas ou ombro', tag: 'A sua ideia veste bem', position: '0% 0%', stock: 20, sizes: ['P', 'M', 'G', 'GG'], colors: ['#fffdf7', '#e8bdc8', '#b9d3df', '#353737'], areas: garmentAreas({ x: 123, y: 90, rot: 22 }) },
  { id: 'caneca', name: 'Caneca cheia de afeto', short: 'Caneca personalizada', category: 'canecas', label: 'Canecas', price: 39.90, extraArea: 8, detail: 'Cerâmica · modelo de 325 ml', tag: 'Carinho em cada gole', position: '100% 0%', stock: 30, sizes: ['325 ml'], colors: ['#fffdf7', '#e8bdc8', '#b9d3df'], areas: [
    defArea('front', 'Frente', 'na frente', 'front', 'block', { cx: 192, cy: 215.5, w: 152, h: 121 }, { help: 'Lado principal da caneca.' }),
    defArea('back', 'Verso', 'no verso', 'back', 'block', { cx: 192, cy: 215.5, w: 152, h: 121 }, { help: 'Outro lado da caneca, oposto à frente.' })
  ] },
  { id: 'ecobag', name: 'Ecobag para levar histórias', short: 'Ecobag personalizada', category: 'bolsas', label: 'Ecobags', price: 44.90, extraArea: 8, detail: 'Tecido de algodão · 35 × 40 cm', tag: 'Leve um pouco de você', position: '0% 100%', stock: 15, sizes: ['35 × 40 cm'], colors: ['#eee2ca', '#fffdf7', '#e8bdc8'], areas: [
    defArea('front', 'Frente', 'na frente', 'front', 'block', { cx: 200, cy: 236, w: 150, h: 140 }, { help: 'Lado principal da ecobag.' }),
    defArea('back', 'Verso', 'no verso', 'back', 'block', { cx: 200, cy: 236, w: 150, h: 140 }, { help: 'Outro lado da ecobag, oposto à frente.' })
  ] },
  { id: 'moletom', name: 'Moletom que abraça', short: 'Moletom personalizado', category: 'roupas', label: 'Roupas', price: 119.90, extraArea: 15, detail: 'Gola redonda · frente, costas ou ombro', tag: 'Um abraço com estilo', position: '100% 100%', stock: 12, sizes: ['P', 'M', 'G', 'GG'], colors: ['#b9d3df', '#e8bdc8', '#fffdf7', '#353737'], areas: garmentAreas({ x: 122, y: 94, rot: 27 }) }
];
const AREA_LABELS = { front: 'Frente', back: 'Costas', shoulderR: 'Ombro direito', shoulderL: 'Ombro esquerdo' };
const COLOR_NAMES = { '#fffdf7': 'Branco', '#e8bdc8': 'Rosa', '#b9d3df': 'Azul', '#353737': 'Grafite', '#eee2ca': 'Natural' };
const FONTS = ['Georgia', 'Arial', 'cursive'];
const FONT_WIDTH = { Georgia: .58, Arial: .55, cursive: .5 }; // largura média de um caractere, em múltiplos do tamanho da letra
const HEART = 'M0 4-25-19C-45-39-12-57 0-35 12-57 45-39 25-19Z';
const HEX = /^#[a-f\d]{6}$/i;
const IMAGE_URL = /^data:image\/(png|jpeg|webp);base64,/;
const STORAGE = { cart: 'gotas-cart-v1', orders: 'gotas-orders-v1', coupon: 'gotas-coupon-v1' };
const ICONS = {
  bag: '<path d="M5 7h14l1 14H4L5 7Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  package: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="M3 8v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5V15"/>',
  arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>',
  down: '<path d="M12 4v15m-5-5 5 5 5-5"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13"/><path d="M12 8H7.5A2.5 2.5 0 1 1 10 5.5L12 8Zm0 0h4.5A2.5 2.5 0 1 0 14 5.5L12 8Z"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-3.7c-1.5-1 .5-3.3 2-3.3h2a3 3 0 0 0 3-3 9 9 0 0 0-9-8Z"/><circle cx="7.5" cy="10" r=".6"/><circle cx="10" cy="6.7" r=".6"/><circle cx="14.3" cy="6.7" r=".6"/><circle cx="17.3" cy="10" r=".6"/>',
  sparkles: '<path d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2L12 3ZM20 2v4m-2-2h4M3 18v4m-2-2h4"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
  card: '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 9h20M6 15h3"/>'
};
const $ = (q, parent = document) => parent.querySelector(q);
const $$ = (q, parent = document) => [...parent.querySelectorAll(q)];
const money = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (value, min, max, fallback) => { const n = Number(value); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback; };
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.heart}</svg>`;
function hydrateIcons(parent = document) { $$('[data-icon]', parent).forEach(el => { el.innerHTML = icon(el.dataset.icon); }); }
function readStorage(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function writeStorage(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { toast('O navegador não conseguiu salvar. Suas alterações permanecem nesta sessão.'); return false; } }

const productById = id => PRODUCTS.find(p => p.id === id);
const placementSummary = p => [...new Set(p.areas.map(a => a.group || a.label))].join(' · ');

// ---- Artes por área ------------------------------------------------------------------------
// design = { base: cor da peça, areas: { front: { on, text, font, ink, image, imageName, scale, x, y }, back: {...}, ... } }
function newArea(def) {
  return { on: def.id === 'front', text: def.id === 'front' ? 'Feito de amor' : '', font: 'Georgia', ink: '#ad5470', image: '', imageName: '', scale: def.type === 'line' ? 100 : 85, x: 0, y: 0 };
}
function sanitizeArea(raw, def) {
  const base = newArea(def), src = raw && typeof raw === 'object' ? raw : {};
  return {
    on: true,
    text: typeof src.text === 'string' ? src.text.slice(0, def.maxText) : base.text,
    font: FONTS.includes(src.font) ? src.font : base.font,
    ink: HEX.test(src.ink) ? src.ink : base.ink,
    image: typeof src.image === 'string' && IMAGE_URL.test(src.image) ? src.image : '',
    imageName: typeof src.imageName === 'string' ? src.imageName.slice(0, 80) : '',
    scale: clamp(src.scale, 40, def.type === 'line' ? 100 : 130, base.scale),
    x: clamp(src.x, -35, 35, 0),
    y: clamp(src.y, -35, 35, 0)
  };
}
// Converte o formato antigo (uma única arte na frente) para o formato por áreas.
function upgradeDesign(raw) {
  const d = raw && typeof raw === 'object' ? raw : {};
  if (d.areas && typeof d.areas === 'object') return d;
  const { base, ...art } = d;
  return { base, areas: { front: { on: true, ...art } } };
}
function normalizeDesign(raw, product) {
  const d = upgradeDesign(raw), areas = {};
  for (const def of product.areas) if (d.areas[def.id] && d.areas[def.id].on !== false) areas[def.id] = sanitizeArea(d.areas[def.id], def);
  if (!Object.keys(areas).length) areas.front = sanitizeArea({}, product.areas[0]);
  return { base: product.colors.includes(d.base) ? d.base : product.colors[0], areas };
}
const activeCount = d => Object.values(d.areas || {}).filter(a => a.on !== false).length;
const unitPrice = (productId, d) => { const p = productById(productId); return Math.round((p.price + p.extraArea * Math.max(0, activeCount(d) - 1)) * 100) / 100; };
// Linhas de texto simples, como "Frente: “Feito de amor”" (quem usa escapa o HTML).
function describeAreas(productId, d) {
  const product = productById(productId);
  const order = id => { const i = product ? product.areas.findIndex(a => a.id === id) : -1; return i < 0 ? 99 : i; };
  return Object.entries(d?.areas || {}).filter(([, a]) => a && a.on !== false).sort((a, b) => order(a[0]) - order(b[0])).map(([id, a]) => {
    const label = product?.areas.find(def => def.id === id)?.label || AREA_LABELS[id] || id;
    const parts = [];
    if (a.image || a.hasImage) parts.push('imagem');
    if (a.text) parts.push(`“${a.text}”`);
    return `${label}: ${parts.join(' + ') || 'arte padrão'}`;
  });
}
// Para o pedido salvo guardamos só o necessário (sem os dados da imagem, que ocupam muito espaço).
const slimDesign = d => ({ base: d.base, areas: Object.fromEntries(Object.entries(d.areas).map(([id, a]) => [id, { on: true, text: a.text, font: a.font, ink: a.ink, hasImage: !!a.image, imageName: a.imageName }])) });

let cart = readStorage(STORAGE.cart, []);
let orders = readStorage(STORAGE.orders, []);
if (!Array.isArray(cart)) cart = [];
if (!Array.isArray(orders)) orders = [];
cart = cart.filter(item => item && productById(item.productId) && Number.isInteger(item.qty) && item.qty > 0 && item.qty <= 30 && item.design).map(item => ({ ...item, design: normalizeDesign(item.design, productById(item.productId)) }));
orders = orders.filter(order => order && Array.isArray(order.items)).map(order => ({ ...order, items: order.items.filter(Boolean).map(item => ({ ...item, design: upgradeDesign(item.design) })) }));
let coupon = readStorage(STORAGE.coupon, '') === 'AMOR10' ? 'AMOR10' : '';
let filter = 'todos';
let editorProduct = PRODUCTS[0];
let design = { base: '', areas: {} };
let activeArea = 'front';
let previewView = 'front';
let previewZoom = false;
const uploadSeq = {};
const pendingUploads = new Set();
let checkout = {};
let checkoutStep = 1;
let toastTimer;
const cartSubtotal = () => Math.round(cart.reduce((sum, item) => sum + unitPrice(item.productId, item.design) * item.qty, 0) * 100) / 100;
const discount = () => coupon === 'AMOR10' ? Math.round(cartSubtotal() * .1 * 100) / 100 : 0;
const shipping = () => checkout.delivery === 'delivery' ? 18.90 : 0;
const total = () => cartSubtotal() - discount() + shipping();
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 4000); }
function openDialog(id) { $$('dialog[open]').forEach(d => d.close()); document.body.classList.add('modal-open'); const dialog = $('#' + id); dialog.showModal(); dialog.scrollTop = 0; }
function saveCart() { writeStorage(STORAGE.cart, cart); $('#cart-count').textContent = cart.reduce((sum, item) => sum + item.qty, 0); $('.bag-button').setAttribute('aria-label', `Abrir sacola, ${$('#cart-count').textContent} itens`); }

function renderProducts() {
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const query = norm($('#product-search').value.trim());
  const products = PRODUCTS.filter(p => (filter === 'todos' || p.category === filter) && norm(`${p.name} ${p.label} ${p.detail} ${placementSummary(p)}`).includes(query));
  $('#product-grid').innerHTML = products.length ? products.map(p => `<article class="product-card"><button class="product-photo" data-personalize="${p.id}" style="--position:${p.position}" aria-label="Personalizar ${p.short}"><span class="product-tag">${p.tag}</span></button><div class="product-category">${p.label}</div><h3>${p.name}</h3><p>${p.detail}</p><p class="product-areas">Estampe: ${placementSummary(p)}</p><div class="product-price"><small>a partir de</small> ${money(p.price)}</div><button class="personalize-button" data-personalize="${p.id}">Personalizar do meu jeito ${icon('arrow')}</button></article>`).join('') : `<div class="empty-state">${icon('search')}<h3>Ainda não encontramos esse presente.</h3><p>Tente buscar por camiseta, caneca, ecobag ou moletom.</p><button class="button secondary" data-action="clear-search">Ver todos os produtos</button></div>`;
  $('#product-results').textContent = `${products.length} produtos encontrados`;
}

// ---- Prévia -------------------------------------------------------------------------------
// SVG vetorial para uma prévia editável: a arte enviada nunca é executada como HTML.
function silhouette(product, color, view) {
  const back = view === 'back';
  if (product.id === 'caneca') {
    const mug = `<path d="M285 139h25c58 0 58 108 0 108h-25" fill="none" stroke="${color}" stroke-width="27"/><path d="M292 140h20c42 0 42 106-1 106h-18" fill="none" stroke="#b4a59b" stroke-opacity=".35" stroke-width="2"/><path d="M89 118h204v169c-3 38-200 38-204 0Z" fill="${color}" stroke="#c4b6aa"/><ellipse cx="191" cy="118" rx="102" ry="21" fill="${color}" stroke="#c4b6aa"/><ellipse cx="191" cy="118" rx="92" ry="13" fill="#dfd6c9"/>`;
    return back ? `<g transform="translate(382 0) scale(-1 1)">${mug}</g>` : mug; // no verso o cabo aparece do outro lado
  }
  if (product.id === 'ecobag') return `<path d="M145 150V97c0-73 110-73 110 0v53" fill="none" stroke="${color}" stroke-width="18"/><path d="M144 150V97c0-73 110-73 110 0v53" fill="none" stroke="#b9a996" stroke-opacity=".5"/><path d="M86 134h228l-10 212H96Z" fill="${color}" stroke="#c4b6aa"/><path d="M99 144h202M108 332h184" stroke="#b9a996" stroke-dasharray="2 3" fill="none"/>`;
  if (product.id === 'moletom') { const n = back ? 9 : 28, m = back ? 16 : 48; return `<path d="m147 65-49 25-67 198 49 18 49-137-7 169h156l-7-169 49 137 49-18-67-198-49-25c-15 ${n}-91 ${n}-106 0Z" fill="${color}" stroke="#b6b5b1"/><path d="M147 65c10 ${m} 96 ${m} 106 0M124 322h152M35 274l48 18m234 0 48-18" fill="none" stroke="#9a9f9e" stroke-opacity=".6" stroke-width="5"/>`; }
  const n = back ? 6 : 27, m = back ? 16 : 46;
  return `<path d="m148 66-45 18-69 71 52 43 40-38-3 179h154l-3-179 40 38 52-43-69-71-45-18c-17 ${n}-87 ${n}-104 0Z" fill="${color}" stroke="#c4b6aa"/><path d="M148 67c10 ${m} 94 ${m} 104 0M128 327h144M43 149l44 37m226 0 44-37" fill="none" stroke="#b6aaa0" stroke-opacity=".5" stroke-width="2"/>`;
}
// Arte de uma área, desenhada em torno do centro da área (0, 0).
function areaArt(def, a) {
  const ink = HEX.test(a.ink) ? a.ink : '#ad5470';
  const font = FONTS.includes(a.font) ? a.font : 'Georgia';
  const image = typeof a.image === 'string' && IMAGE_URL.test(a.image) ? a.image : '';
  const text = (a.text || '').trim();
  const { w, h } = def.box, k = w / 120;
  const move = `translate(${(Number(a.x) || 0) * k} ${(Number(a.y) || 0) * k}) scale(${(Number(a.scale) || 85) / 100})`;
  if (def.type === 'line') {
    // Área pequena: símbolo (coração ou imagem) à esquerda e frase em uma linha, ajustada ao espaço.
    const size = +(h * .8).toFixed(2), cw = FONT_WIDTH[font], chars = Math.max(1, [...text].length);
    const fs = text ? Math.max(2.5, Math.min(h * .7, (w - 4 - size - 3) / (chars * cw))) : 0;
    const x0 = -(size + (text ? 3 + chars * fs * cw : 0)) / 2;
    const symbol = image ? `<image href="${image}" x="${+x0.toFixed(2)}" y="${-size / 2}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>` : `<path d="${HEART}" transform="translate(${+(x0 + size / 2).toFixed(2)} ${+(21 * size / 64).toFixed(2)}) scale(${+(size / 64).toFixed(4)})" fill="${ink}" opacity=".85"/>`;
    const label = text ? `<text x="${+(x0 + size + 3).toFixed(2)}" y="${+(fs * .34).toFixed(2)}" fill="${ink}" font-family="${font}" font-size="${+fs.toFixed(2)}">${esc(text)}</text>` : '';
    return `<g transform="${move}">${symbol}${label}</g>`;
  }
  const lines = text.match(/.{1,18}(?:\s|$)|.{1,18}/g) || [];
  const caption = lines.slice(0, 3).map((line, i) => `<tspan x="0" dy="${i === 0 ? 0 : 16}">${esc(line.trim())}</tspan>`).join('');
  return `<g transform="${move}">${image ? `<image href="${image}" x="-60" y="-63" width="120" height="100" preserveAspectRatio="xMidYMid meet"/>` : `<path d="${HEART}" fill="${ink}" opacity=".85"/>`}<text x="0" y="${image ? 53 : 28}" text-anchor="middle" fill="${ink}" font-family="${font}" font-size="14">${caption}</text></g>`;
}
// opts: { view: 'front' | 'back', activeArea: id da área em edição, zoom: amplia a área em edição }
function productPreview(product, art, unique = 'main', mini = false, opts = {}) {
  const color = product.colors.includes(art.base) ? art.base : product.colors[0];
  const state = art.areas || {};
  const isOn = id => !!state[id] && state[id].on !== false;
  const view = opts.view || (product.areas.find(d => isOn(d.id)) || product.areas[0]).view;
  const here = product.areas.filter(d => d.view === view);
  const live = here.filter(d => isOn(d.id));
  const place = d => `translate(${d.box.cx} ${d.box.cy})${d.box.rot ? ` rotate(${d.box.rot})` : ''}`;
  const guides = mini ? '' : here.map(d => {
    const current = opts.activeArea === d.id, on = isOn(d.id);
    const style = current ? 'fill="#a94c69" fill-opacity=".06" stroke="#a94c69" stroke-width="1.1" stroke-dasharray="4 3"' : on ? 'fill="none" stroke="#bca5a7" stroke-width=".8" stroke-dasharray="4 4"' : 'fill="none" stroke="#cdbdb9" stroke-opacity=".7" stroke-width=".7" stroke-dasharray="2 4"';
    return `<g transform="${place(d)}"><rect x="${-d.box.w / 2}" y="${-d.box.h / 2}" width="${d.box.w}" height="${d.box.h}" rx="3" ${style}/></g>`;
  }).join('');
  const clips = live.map(d => `<clipPath id="print-${unique}-${d.id}"><rect x="${-d.box.w / 2}" y="${-d.box.h / 2}" width="${d.box.w}" height="${d.box.h}" rx="3"/></clipPath>`).join('');
  const prints = live.map(d => `<g transform="${place(d)}"><g clip-path="url(#print-${unique}-${d.id})">${areaArt(d, state[d.id])}</g></g>`).join('');
  let viewBox = '0 0 400 400';
  const focus = opts.zoom && product.areas.find(d => d.id === opts.activeArea);
  if (focus && focus.view === view) {
    const size = Math.min(400, Math.max(120, Math.max(focus.box.w, focus.box.h) * 2.6));
    viewBox = `${+clamp(focus.box.cx - size / 2, 0, 400 - size, 0).toFixed(1)} ${+clamp(focus.box.cy - size / 2, 0, 400 - size, 0).toFixed(1)} ${+size.toFixed(1)} ${+size.toFixed(1)}`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="Prévia de ${esc(product.short)} com a sua arte"><defs><filter id="shadow-${unique}" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="9" stdDeviation="8" flood-color="#746255" flood-opacity=".14"/></filter>${clips}</defs><ellipse cx="200" cy="356" rx="123" ry="12" fill="#ded1c4" opacity=".4"/><g filter="url(#shadow-${unique})">${silhouette(product, color, view)}</g>${guides}${prints}</svg>`;
}

// ---- Editor -------------------------------------------------------------------------------
const areaDef = id => editorProduct.areas.find(a => a.id === id);
function renderPreview() {
  $('#preview-stage').innerHTML = productPreview(editorProduct, design, 'main', false, { view: previewView, activeArea, zoom: previewZoom });
  $$('.preview-tools [data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === previewView)));
  $('.preview-tools [data-zoom]').setAttribute('aria-pressed', String(previewZoom));
  const backLabel = (editorProduct.areas.find(d => d.id === 'back')?.label || 'Costas').toLowerCase();
  $('#preview-caption-text').textContent = `Prévia ilustrativa · ${previewView === 'back' ? backLabel : 'frente'} do produto${previewZoom ? ' (ampliada)' : ''}`;
}
function invalidateApproval() { $('#approve-art').checked = false; $('#editor-error').textContent = ''; }
function updatePrice() {
  const n = activeCount(design), names = editorProduct.areas.filter(d => design.areas[d.id].on).map(d => d.label);
  $('#editor-price').textContent = money(unitPrice(editorProduct.id, design));
  $('#editor-price-note').textContent = n > 1 ? `${n} áreas · inclui ${money(editorProduct.extraArea * (n - 1))} de estampas extras` : `Cada área extra: + ${money(editorProduct.extraArea)}`;
  $('#area-summary').textContent = `Será estampado em: ${names.join(', ')}.`;
}
function updateAreaTabs() {
  $$('.area-tab').forEach(btn => {
    const id = btn.dataset.area, on = design.areas[id].on;
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-pressed', String(id === activeArea));
    $('.sr-only', btn).textContent = on ? ' (com estampa)' : ' (sem estampa)';
  });
}
function refreshUploadStatus() {
  const a = design.areas[activeArea];
  $('#upload-status').hidden = !a.image;
  $('#upload-name').textContent = a.imageName || 'Imagem enviada';
}
// Mostra no formulário os valores da área que está sendo editada.
function loadAreaControls() {
  const def = areaDef(activeArea), a = design.areas[activeArea];
  $('#area-enabled').checked = a.on;
  $('#area-enabled-label').textContent = `Estampar ${def.where}`;
  $('#area-help').textContent = def.help;
  $('#area-controls').disabled = !a.on;
  $('#editor-text').maxLength = def.maxText;
  $('#editor-text').value = a.text;
  $('#text-limit').textContent = `Até ${def.maxText} caracteres`;
  $('#editor-font').value = a.font;
  $('#editor-ink').value = a.ink;
  $('#art-scale').max = def.type === 'line' ? 100 : 130;
  $('#art-scale').value = a.scale;
  $('#art-x').value = a.x;
  $('#art-y').value = a.y;
  $('#art-upload').value = '';
  $('#copy-front').hidden = activeArea === 'front';
  refreshUploadStatus();
}
function selectArea(id) {
  const def = areaDef(id); if (!def) return;
  activeArea = id; previewView = def.view; previewZoom = def.type === 'line'; // o ombro abre ampliado
  updateAreaTabs(); loadAreaControls(); renderPreview();
}
function setView(view) {
  if (areaDef(activeArea).view === view) return;
  const target = editorProduct.areas.find(d => d.view === view);
  if (target) selectArea(target.id);
}
function openEditor(id) {
  editorProduct = productById(id) || PRODUCTS[0];
  design = { base: editorProduct.colors[0], areas: Object.fromEntries(editorProduct.areas.map(d => [d.id, newArea(d)])) };
  activeArea = 'front'; previewView = 'front'; previewZoom = false;
  Object.keys(uploadSeq).forEach(key => { uploadSeq[key]++; }); pendingUploads.clear();
  $('#editor-form').reset();
  $('#editor-product-title').textContent = editorProduct.short;
  $('#editor-product-detail').textContent = editorProduct.detail;
  $('#editor-size').innerHTML = editorProduct.sizes.map(s => `<option>${s}</option>`).join('');
  $('#editor-size').disabled = editorProduct.sizes.length === 1;
  $('#editor-qty').max = editorProduct.stock;
  $('#base-colors').innerHTML = editorProduct.colors.map((c, i) => `<button type="button" class="swatch ${i === 0 ? 'selected' : ''}" data-color="${c}" style="--swatch:${c}" title="${COLOR_NAMES[c]}" aria-label="Cor ${COLOR_NAMES[c]}" aria-pressed="${i === 0}"></button>`).join('');
  $('#area-tabs').innerHTML = editorProduct.areas.map(d => `<button type="button" class="area-tab" data-area="${d.id}" aria-pressed="false"><span class="area-dot" aria-hidden="true"></span>${d.label}<span class="sr-only"></span></button>`).join('');
  $('.preview-tools [data-view="back"]').textContent = editorProduct.areas.find(d => d.id === 'back').label;
  $('#editor-error').textContent = '';
  loadAreaControls(); updateAreaTabs(); updatePrice(); renderPreview(); openDialog('editor-dialog');
}
function syncDesign() {
  const a = design.areas[activeArea];
  a.text = $('#editor-text').value;
  a.font = $('#editor-font').value;
  a.ink = $('#editor-ink').value;
  a.scale = Number($('#art-scale').value);
  a.x = Number($('#art-x').value);
  a.y = Number($('#art-y').value);
  invalidateApproval(); renderPreview();
}
async function processUpload(file) {
  if (!file) return;
  const areaId = activeArea, def = areaDef(areaId);
  const sequence = uploadSeq[areaId] = (uploadSeq[areaId] || 0) + 1;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { $('#editor-error').textContent = 'Envie uma imagem JPG, PNG ou WebP de até 5 MB.'; $('#art-upload').value = ''; return; }
  pendingUploads.add(areaId);
  invalidateApproval();
  try {
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, (def.type === 'line' ? 320 : 700) / Math.max(bitmap.width, bitmap.height)); // áreas pequenas guardam imagens menores
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio)); canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
    if (sequence !== uploadSeq[areaId]) return;
    const a = design.areas[areaId];
    a.image = canvas.toDataURL('image/webp', .82); a.imageName = file.name.slice(0, 80);
    if (areaId === activeArea) refreshUploadStatus();
    renderPreview();
  } catch { if (sequence === uploadSeq[areaId]) $('#editor-error').textContent = 'Não foi possível abrir essa imagem. Tente outro arquivo.'; }
  finally { if (sequence === uploadSeq[areaId]) pendingUploads.delete(areaId); }
}

// ---- Sacola e pedido ----------------------------------------------------------------------
function renderCart() {
  const root = $('#cart-content');
  if (!cart.length) { root.innerHTML = `<div class="empty-state">${icon('bag')}<h3>Sua sacola espera uma boa ideia.</h3><p>Que tal criar um presente com a sua essência?</p><button class="button primary" data-close="cart-dialog">Explorar produtos ${icon('arrow')}</button></div>`; return; }
  root.innerHTML = cart.map((item, i) => {
    const p = productById(item.productId), lines = describeAreas(item.productId, item.design), n = activeCount(item.design);
    return `<article class="cart-item"><div class="cart-thumb">${productPreview(p, item.design, 'cart-' + i, true)}</div><div class="cart-item-info"><div class="cart-item-top"><h3>${p.short}</h3><button class="icon-button" data-remove="${item.id}" aria-label="Remover ${p.short}">${icon('trash')}</button></div><p>${esc(item.size)} · ${COLOR_NAMES[item.design.base] || 'Personalizado'}${n > 1 ? ` · ${n} áreas de estampa` : ''}</p><p>${lines.map(esc).join('<br>')}</p>${item.note ? `<p>Obs.: ${esc(item.note)}</p>` : ''}<div class="quantity-control"><button data-quantity="${item.id}" data-delta="-1" aria-label="Diminuir quantidade" ${item.qty <= 1 ? 'disabled' : ''}>−</button><span>${item.qty}</span><button data-quantity="${item.id}" data-delta="1" aria-label="Aumentar quantidade" ${stockUsed(item.productId) >= p.stock ? 'disabled' : ''}>+</button></div><p class="item-price">${money(unitPrice(item.productId, item.design) * item.qty)}</p></div></article>`;
  }).join('') + `<label for="coupon-input">Um carinho extra</label><form id="coupon-form" class="coupon-row"><input id="coupon-input" placeholder="Seu cupom" aria-label="Cupom de desconto" value="${coupon}" maxlength="20"><button class="button secondary" type="submit">Aplicar</button></form><p class="coupon-hint" id="coupon-message" role="status">${coupon ? 'AMOR10 aplicado: 10% de desconto. <button class="link-button" data-action="remove-coupon">Remover</button>' : 'Experimente o cupom demonstrativo AMOR10.'}</p>${totalsHTML(false)}<button class="button primary full" data-action="checkout">Continuar para o pedido ${icon('arrow')}</button><p class="cart-bottom-note">Compra demonstrativa · nenhuma cobrança será feita.</p>`;
}
function stockUsed(id) { return cart.filter(i => i.productId === id).reduce((s, i) => s + i.qty, 0); }
function totalsHTML(withShipping = true) { return `<div class="totals"><div><span>Produtos</span><span>${money(cartSubtotal())}</span></div>${coupon ? `<div class="rose"><span>Desconto AMOR10</span><span>− ${money(discount())}</span></div>` : ''}<div><span>${withShipping ? 'Entrega' : 'Frete'}</span><span>${withShipping ? (shipping() ? money(shipping()) : 'Retirada gratuita') : 'Na próxima etapa'}</span></div><div class="total"><span>Total${withShipping ? '' : ' parcial'}</span><span>${money(cartSubtotal() - discount() + (withShipping ? shipping() : 0))}</span></div></div>`; }
function beginCheckout() { if (!cart.length) return; checkout = { name: '', cpf: '', phone: '', email: '', cep: '', street: '', number: '', complement: '', district: '', city: '', state: '', delivery: 'pickup', payment: 'pix', result: 'approved' }; checkoutStep = 1; renderCheckout(); openDialog('checkout-dialog'); }
function formField(name, label, opts = '') { return `<label>${label}<input name="${name}" value="${esc(checkout[name] || '')}" ${opts}></label>`; }
function renderCheckout() {
  $$('.checkout-progress li').forEach((li, i) => { li.classList.toggle('active', i + 1 === checkoutStep); li.classList.toggle('done', i + 1 < checkoutStep); });
  let body = '';
  if (checkoutStep === 1) body = `<form id="customer-form"><h3 class="checkout-body-title">Para quem vai esse carinho?</h3>${formField('name', 'Nome completo', 'required minlength="3" maxlength="80" autocomplete="off" placeholder="Ex.: Maria de Exemplo"')}<div class="form-row">${formField('cpf', 'CPF fictício · 11 dígitos', 'required inputmode="numeric" pattern="[0-9]{11}" maxlength="11" autocomplete="off" placeholder="00000000000" title="Use 11 números fictícios, sem pontuação"')}${formField('phone', 'Telefone fictício com DDD', 'required type="tel" inputmode="tel" pattern="[0-9]{10,11}" maxlength="11" autocomplete="off" placeholder="11999999999" title="Use 10 ou 11 números, sem pontuação"')}</div>${formField('email', 'E-mail fictício (opcional)', 'type="email" maxlength="100" autocomplete="off" placeholder="exemplo@example.com"')}<p class="small-muted">Seus dados são usados apenas nesta simulação e não são enviados a uma loja.</p><div class="checkout-actions"><button class="button secondary" type="button" data-action="back-cart">Voltar à sacola</button><button class="button primary" type="submit">Escolher entrega ${icon('arrow')}</button></div></form>`;
  if (checkoutStep === 2) body = `<form id="delivery-form"><h3 class="checkout-body-title">Como prefere receber?</h3><label class="delivery-option"><input type="radio" name="delivery" value="pickup" ${checkout.delivery === 'pickup' ? 'checked' : ''}><span>Retirada na loja<small>Local e prazo a combinar na operação real</small></span><strong>Grátis</strong></label><label class="delivery-option"><input type="radio" name="delivery" value="delivery" ${checkout.delivery === 'delivery' ? 'checked' : ''}><span>Entrega no endereço<small>Exemplo: 5 a 8 dias úteis após a produção</small></span><strong>${money(18.90)}</strong></label><div id="address-fields" ${checkout.delivery === 'pickup' ? 'hidden' : ''}><div class="form-row">${formField('cep', 'CEP fictício', 'required pattern="[0-9]{8}" maxlength="8" inputmode="numeric" placeholder="00000000" title="Digite 8 números, sem pontuação"')}${formField('state', 'UF', 'required pattern="[A-Za-z]{2}" maxlength="2" placeholder="SP"')}</div>${formField('street', 'Rua / Avenida', 'required maxlength="120" placeholder="Rua de Exemplo"')}<div class="form-row">${formField('number', 'Número', 'required maxlength="12" placeholder="123"')}${formField('complement', 'Complemento (opcional)', 'maxlength="80" placeholder="Apto, bloco…"')}</div><div class="form-row">${formField('district', 'Bairro', 'required maxlength="60"')}${formField('city', 'Cidade', 'required maxlength="60"')}</div></div><p class="small-muted">Frete, disponibilidade e prazos são ilustrativos. A produção real depende da confirmação da arte e do pagamento.</p><div class="checkout-actions"><button class="button secondary" type="button" data-checkout-step="1">Voltar</button><button class="button primary" type="submit">Conferir pedido ${icon('arrow')}</button></div></form>`;
  if (checkoutStep === 3) body = `<h3 class="checkout-body-title">Um último olhar em cada detalhe.</h3>${cart.map(i => { const p = productById(i.productId); return `<div class="review-line"><span>${i.qty} × ${p.short}<small>${esc(i.size)} · ${COLOR_NAMES[i.design.base] || 'Personalizado'} · Arte aprovada</small>${describeAreas(i.productId, i.design).map(line => `<small>${esc(line)}</small>`).join('')}${i.note ? `<small>Obs.: ${esc(i.note)}</small>` : ''}</span><strong>${money(unitPrice(i.productId, i.design) * i.qty)}</strong></div>`; }).join('')}<div class="address-summary"><p><strong>${esc(checkout.name)}</strong> · ${esc(checkout.phone)}</p><p>${checkout.delivery === 'pickup' ? 'Retirada na loja — local a combinar (simulação).' : `${esc(checkout.street)}, ${esc(checkout.number)}${checkout.complement ? ' · ' + esc(checkout.complement) : ''}<br>${esc(checkout.district)} · ${esc(checkout.city)} / ${esc(checkout.state.toUpperCase())} · CEP ${esc(checkout.cep)}`}</p><button class="link-button" data-checkout-step="1">Corrigir dados</button> · <button class="link-button" data-checkout-step="2">Alterar entrega</button></div>${totalsHTML()}<div class="checkout-actions"><button class="button secondary" data-checkout-step="2">Voltar</button><button class="button primary" data-checkout-step="4">Ir para pagamento ${icon('arrow')}</button></div>`;
  if (checkoutStep === 4) body = `<form id="payment-form"><h3 class="checkout-body-title">Escolha como deseja testar.</h3><div class="form-row"><label class="payment-option"><input type="radio" name="payment" value="pix" ${checkout.payment === 'pix' ? 'checked' : ''}><span>Pix<small>Simulação de aprovação</small></span></label><label class="payment-option"><input type="radio" name="payment" value="card" ${checkout.payment === 'card' ? 'checked' : ''}><span>Cartão<small>Sem inserir dados reais</small></span></label></div><div class="payment-simulation"><span>${icon(checkout.payment === 'pix' ? 'sparkles' : 'card')}</span><h3>${checkout.payment === 'pix' ? 'Pix demonstrativo' : 'Cartão demonstrativo'}</h3><p>${checkout.payment === 'pix' ? 'Nenhuma chave ou QR Code real é gerado.' : 'Não é necessário informar número, validade ou código do cartão.'}<br>O botão abaixo permite testar o resultado do pagamento.</p><label class="payment-test">Resultado do teste<select id="payment-result" name="result"><option value="approved" ${checkout.result === 'approved' ? 'selected' : ''}>Pagamento aprovado</option><option value="declined" ${checkout.result === 'declined' ? 'selected' : ''}>Pagamento não aprovado</option></select></label></div>${totalsHTML()}<p id="payment-error" class="form-error" role="alert"></p><div class="checkout-actions"><button class="button secondary" type="button" data-checkout-step="3">Voltar</button><button class="button primary" type="submit">Simular pagamento ${icon('check')}</button></div></form>`;
  $('#checkout-body').innerHTML = body;
  if (checkoutStep === 2) updateAddressVisibility();
  $('#checkout-dialog').scrollTop = 0;
}
function captureCheckoutForm() { const form = $('form', $('#checkout-body')); if (form) for (const [key, value] of new FormData(form)) checkout[key] = String(value).trim(); }
function updateAddressVisibility() { const needsAddress = checkout.delivery === 'delivery'; $('#address-fields').hidden = !needsAddress; $$('#address-fields input').forEach(input => { input.disabled = !needsAddress; }); }
function completeOrder() {
  const now = new Date();
  const items = cart.map(i => ({ id: i.id, productId: i.productId, qty: i.qty, size: i.size, note: i.note, unit: unitPrice(i.productId, i.design), design: slimDesign(i.design) }));
  const order = { id: `GA-${now.getTime().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`, createdAt: now.toISOString(), items, subtotal: cartSubtotal(), discount: discount(), shipping: shipping(), total: total(), delivery: checkout.delivery, payment: checkout.payment, stage: 0 };
  orders.unshift(order);
  if (orders.length > 15) orders.length = 15;
  writeStorage(STORAGE.orders, orders);
  cart = []; coupon = ''; writeStorage(STORAGE.coupon, ''); saveCart();
  checkout = {}; renderOrders(order.id); openDialog('orders-dialog');
}
function renderOrders(successId) {
  const root = $('#orders-content');
  if (!orders.length) { root.innerHTML = `<div class="empty-state">${icon('package')}<h3>Sua primeira história começa aqui.</h3><p>Você ainda não tem pedidos neste navegador.</p><button class="button primary" data-close="orders-dialog">Explorar produtos ${icon('arrow')}</button></div>`; return; }
  const itemLine = i => { const lines = describeAreas(i.productId, i.design); return `<div class="order-line">${i.qty} × ${esc(productById(i.productId)?.short || 'Produto')} · ${esc(i.size)}${lines.length ? `<span class="order-areas">${lines.map(esc).join('<br>')}</span>` : ''}</div>`; };
  root.innerHTML = (successId ? `<div class="success-banner"><span>${icon('check')}</span><h3>Seu carinho ganhou forma!</h3><p>Pedido demonstrativo criado. Pagamento simulado com sucesso.<br>Nenhuma compra real ou produção foi iniciada.</p></div>` : `<p class="small-muted" style="margin-bottom:18px">Pedidos demonstrativos salvos neste navegador. As etapas abaixo são uma simulação.</p>`) + orders.map(order => `<article class="order-card"><div class="order-header"><div><h3>${esc(order.id)}</h3><small>${new Date(order.createdAt).toLocaleString('pt-BR')}</small></div><span class="status-pill">${['Pedido recebido', 'Em produção', order.delivery === 'pickup' ? 'Pronto para retirada' : 'Enviado', 'Entregue'][order.stage || 0]} · demo</span></div><div class="order-items">${order.items.map(itemLine).join('')}</div><div class="order-tracking">${['Recebido', 'Em produção', order.delivery === 'pickup' ? 'Pronto para retirada' : 'Enviado', 'Entregue'].map((s, i) => `<div class="${i <= (order.stage || 0) ? 'current' : ''}">${s}</div>`).join('')}</div><div class="order-total"><span>${order.payment === 'pix' ? 'Pix' : 'Cartão'} · pagamento simulado</span><strong>${money(order.total)}</strong></div><div class="order-tools">${(order.stage || 0) < 3 ? `<button class="button secondary" data-advance="${esc(order.id)}">Simular próxima etapa ${icon('arrow')}</button>` : '<span class="small-muted">Simulação concluída ♡</span>'}<button class="link-button" data-download="${esc(order.id)}">Baixar resumo</button></div></article>`).join('');
}
function downloadOrder(id) {
  const order = orders.find(o => o.id === id); if (!order) return;
  const text = ['GOTAS DE AMOR — PEDIDO DEMONSTRATIVO', order.id, new Date(order.createdAt).toLocaleString('pt-BR'), '', ...order.items.map(i => `${i.qty} × ${productById(i.productId)?.short || 'Produto'} | ${i.size} | ${COLOR_NAMES[i.design.base] || 'Personalizado'}\n${describeAreas(i.productId, i.design).map(line => 'Estampa — ' + line).join('\n')}\nObservação: ${i.note || 'nenhuma'}`), '', `Produtos: ${money(order.subtotal)}`, `Desconto: ${money(order.discount)}`, `Frete: ${money(order.shipping)}`, `Total: ${money(order.total)}`, `Entrega: ${order.delivery === 'pickup' ? 'Retirada' : 'Entrega no endereço'}`, `Pagamento: ${order.payment === 'pix' ? 'Pix' : 'Cartão'} (simulado)`, '', 'Este resumo não é comprovante de pagamento nem nota fiscal.', 'Nenhum pedido foi enviado à produção e nenhum valor foi cobrado.'].join('\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = `${order.id}.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.addEventListener('click', event => {
  const personalize = event.target.closest('[data-personalize]'); if (personalize) { openEditor(personalize.dataset.personalize); return; }
  const close = event.target.closest('[data-close]'); if (close) { $('#' + close.dataset.close).close(); return; }
  const filterButton = event.target.closest('[data-filter]'); if (filterButton) { filter = filterButton.dataset.filter; $$('.filter').forEach(b => { b.classList.toggle('active', b === filterButton); b.setAttribute('aria-pressed', b === filterButton); }); renderProducts(); return; }
  const swatch = event.target.closest('[data-color]'); if (swatch) { design.base = swatch.dataset.color; $$('.swatch').forEach(b => { b.classList.toggle('selected', b === swatch); b.setAttribute('aria-pressed', b === swatch); }); invalidateApproval(); renderPreview(); return; }
  const areaButton = event.target.closest('[data-area]'); if (areaButton) { selectArea(areaButton.dataset.area); return; }
  const viewButton = event.target.closest('[data-view]'); if (viewButton) { setView(viewButton.dataset.view); return; }
  if (event.target.closest('[data-zoom]')) { previewZoom = !previewZoom; renderPreview(); return; }
  const remove = event.target.closest('[data-remove]'); if (remove) { cart = cart.filter(i => i.id !== remove.dataset.remove); saveCart(); renderCart(); return; }
  const quantity = event.target.closest('[data-quantity]'); if (quantity) { const item = cart.find(i => i.id === quantity.dataset.quantity); const delta = Number(quantity.dataset.delta); if (item && item.qty + delta >= 1 && (delta < 0 || stockUsed(item.productId) < productById(item.productId).stock)) { item.qty += delta; saveCart(); renderCart(); } return; }
  const step = event.target.closest('[data-checkout-step]'); if (step) { captureCheckoutForm(); checkoutStep = Number(step.dataset.checkoutStep); renderCheckout(); return; }
  const advance = event.target.closest('[data-advance]'); if (advance) { const order = orders.find(o => o.id === advance.dataset.advance); if (order && order.stage < 3) { order.stage++; writeStorage(STORAGE.orders, orders); renderOrders(); } return; }
  const download = event.target.closest('[data-download]'); if (download) { downloadOrder(download.dataset.download); return; }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'cart' || action === 'back-cart') { renderCart(); openDialog('cart-dialog'); }
  if (action === 'orders') { renderOrders(); openDialog('orders-dialog'); }
  if (action === 'checkout') beginCheckout();
  if (action === 'clear-search') { $('#product-search').value = ''; $('.filter[data-filter="todos"]').click(); }
  if (action === 'remove-coupon') { coupon = ''; writeStorage(STORAGE.coupon, ''); renderCart(); }
});
document.addEventListener('submit', event => {
  const id = event.target.id;
  if (!['editor-form', 'coupon-form', 'customer-form', 'delivery-form', 'payment-form'].includes(id)) return;
  event.preventDefault();
  if (id === 'editor-form') {
    if (pendingUploads.size) { $('#editor-error').textContent = 'Aguarde a imagem terminar de carregar.'; return; }
    const qty = Number($('#editor-qty').value);
    if (!Number.isInteger(qty) || qty < 1 || qty + stockUsed(editorProduct.id) > editorProduct.stock) { $('#editor-error').textContent = `Estoque demonstrativo: ${Math.max(0, editorProduct.stock - stockUsed(editorProduct.id))} unidades disponíveis para adicionar.`; return; }
    if (!$('#approve-art').checked) return;
    cart.push({ id: `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`, productId: editorProduct.id, qty, size: $('#editor-size').value, design: normalizeDesign(design, editorProduct), note: $('#editor-note').value.trim().slice(0, 300), approved: true });
    saveCart(); renderCart(); openDialog('cart-dialog'); toast('Sua criação foi adicionada à sacola. ♡');
  }
  if (id === 'coupon-form') { const value = $('#coupon-input').value.trim().toUpperCase(); if (value !== 'AMOR10') { $('#coupon-message').textContent = 'Cupom não encontrado. Nesta demonstração, use AMOR10.'; } else { coupon = value; writeStorage(STORAGE.coupon, coupon); renderCart(); } }
  if (id === 'customer-form' || id === 'delivery-form') { captureCheckoutForm(); checkoutStep++; renderCheckout(); }
  if (id === 'payment-form') { captureCheckoutForm(); if (checkout.result === 'declined') { $('#payment-error').textContent = 'Pagamento não aprovado na simulação. Escolha outro meio ou mude o resultado para “Pagamento aprovado” e tente novamente.'; } else { completeOrder(); } }
});
$('#product-search').addEventListener('input', renderProducts);
['editor-text', 'editor-font', 'editor-ink', 'art-scale', 'art-x', 'art-y'].forEach(id => $('#' + id).addEventListener('input', syncDesign));
$('#art-upload').addEventListener('change', event => processUpload(event.target.files[0]));
$('#remove-art').addEventListener('click', () => {
  const id = activeArea, a = design.areas[id];
  uploadSeq[id] = (uploadSeq[id] || 0) + 1; pendingUploads.delete(id);
  a.image = ''; a.imageName = ''; $('#art-upload').value = '';
  refreshUploadStatus(); invalidateApproval(); renderPreview();
});
$('#area-enabled').addEventListener('change', event => {
  const a = design.areas[activeArea];
  if (!event.target.checked && activeCount(design) <= 1) { event.target.checked = true; $('#editor-error').textContent = 'Deixe pelo menos uma área com estampa.'; return; }
  a.on = event.target.checked;
  $('#area-controls').disabled = !a.on;
  updateAreaTabs(); updatePrice(); invalidateApproval(); renderPreview();
});
$('#copy-front').addEventListener('click', () => {
  const front = design.areas.front, a = design.areas[activeArea], def = areaDef(activeArea);
  Object.assign(a, { text: front.text.slice(0, def.maxText), font: front.font, ink: front.ink, image: front.image, imageName: front.imageName });
  loadAreaControls(); invalidateApproval(); renderPreview();
});
$('#editor-size').addEventListener('change', invalidateApproval);
document.addEventListener('change', event => { if (event.target.name === 'delivery') { checkout.delivery = event.target.value; updateAddressVisibility(); } if (event.target.name === 'payment') { captureCheckoutForm(); renderCheckout(); } });
$('#mobile-menu-button').addEventListener('click', () => { const open = $('#mobile-nav').hidden; $('#mobile-nav').hidden = !open; $('#mobile-menu-button').setAttribute('aria-expanded', open); });
$$('#mobile-nav a, #mobile-nav button').forEach(a => a.addEventListener('click', () => { $('#mobile-nav').hidden = true; $('#mobile-menu-button').setAttribute('aria-expanded', false); }));
$$('dialog').forEach(dialog => { dialog.addEventListener('close', () => { if (!$('dialog[open]')) document.body.classList.remove('modal-open'); }); dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } }); });
$('#year').textContent = new Date().getFullYear();
hydrateIcons(); renderProducts(); saveCart();
