'use strict';
// Dados e regras compartilhados entre a loja (index.html) e o painel (admin.html):
// catálogo, pedidos, ícones, validação de imagens. Não mexe na interface da loja.
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
// Modelos de produto (formato da prévia, áreas de estampa, tamanhos e cores). Produtos novos escolhem um modelo.
const SHAPES = {
  camiseta: { label: 'Camiseta', position: '0% 0%', sizes: ['P', 'M', 'G', 'GG'], colors: ['#fffdf7', '#e8bdc8', '#b9d3df', '#353737', '#b7cfb0', '#f6d9a8', '#cdbfe0', '#c75b5b', '#2f3e5c', '#9a9a9a'], areas: garmentAreas({ x: 123, y: 90, rot: 22 }) },
  caneca: { label: 'Caneca', position: '100% 0%', sizes: ['325 ml'], colors: ['#fffdf7', '#e8bdc8', '#b9d3df', '#353737', '#b7cfb0', '#f6d9a8', '#cdbfe0', '#c75b5b', '#2f3e5c', '#9a9a9a'], areas: [
    defArea('front', 'Frente', 'na frente', 'front', 'block', { cx: 192, cy: 215.5, w: 152, h: 121 }, { help: 'Lado principal da caneca.' }),
    defArea('back', 'Verso', 'no verso', 'back', 'block', { cx: 192, cy: 215.5, w: 152, h: 121 }, { help: 'Outro lado da caneca, oposto à frente.' })
  ] },
  ecobag: { label: 'Ecobag', position: '0% 100%', sizes: ['35 × 40 cm'], colors: ['#eee2ca', '#fffdf7', '#e8bdc8', '#b9d3df', '#353737', '#b7cfb0', '#f6d9a8', '#cdbfe0', '#c75b5b', '#2f3e5c', '#9a9a9a'], areas: [
    defArea('front', 'Frente', 'na frente', 'front', 'block', { cx: 200, cy: 236, w: 150, h: 140 }, { help: 'Lado principal da ecobag.' }),
    defArea('back', 'Verso', 'no verso', 'back', 'block', { cx: 200, cy: 236, w: 150, h: 140 }, { help: 'Outro lado da ecobag, oposto à frente.' })
  ] },
  moletom: { label: 'Moletom', position: '100% 100%', sizes: ['P', 'M', 'G', 'GG'], colors: ['#b9d3df', '#e8bdc8', '#fffdf7', '#353737', '#b7cfb0', '#f6d9a8', '#cdbfe0', '#c75b5b', '#2f3e5c', '#9a9a9a'], areas: garmentAreas({ x: 122, y: 94, rot: 27 }) }
};
// Catálogo padrão. O administrador pode editar tudo; as mudanças ficam salvas neste navegador.
const DEFAULT_CATEGORIES = [{ id: 'camisetas', label: 'Camisetas' }, { id: 'canecas', label: 'Canecas' }, { id: 'bolsas', label: 'Ecobags' }, { id: 'roupas', label: 'Roupas' }];
const DEFAULT_PRODUCTS = [
  { id: 'camiseta', shape: 'camiseta', name: 'Camiseta com a sua essência', short: 'Camiseta personalizada', category: 'camisetas', price: 59.90, extraArea: 10, detail: 'Algodão · frente, costas ou ombro', tag: 'A sua ideia veste bem', stock: 20, active: true, photo: '' },
  { id: 'caneca', shape: 'caneca', name: 'Caneca cheia de afeto', short: 'Caneca personalizada', category: 'canecas', price: 39.90, extraArea: 8, detail: 'Cerâmica · modelo de 325 ml', tag: 'Carinho em cada gole', stock: 30, active: true, photo: '' },
  { id: 'ecobag', shape: 'ecobag', name: 'Ecobag para levar histórias', short: 'Ecobag personalizada', category: 'bolsas', price: 44.90, extraArea: 8, detail: 'Tecido de algodão · 35 × 40 cm', tag: 'Leve um pouco de você', stock: 15, active: true, photo: '' },
  { id: 'moletom', shape: 'moletom', name: 'Moletom que abraça', short: 'Moletom personalizado', category: 'roupas', price: 119.90, extraArea: 15, detail: 'Gola redonda · frente, costas ou ombro', tag: 'Um abraço com estilo', stock: 12, active: true, photo: '' }
];
const AREA_LABELS = { front: 'Frente', back: 'Costas', shoulderR: 'Ombro direito', shoulderL: 'Ombro esquerdo' };
const COLOR_NAMES = { '#fffdf7': 'Branco', '#e8bdc8': 'Rosa', '#b9d3df': 'Azul', '#353737': 'Grafite', '#eee2ca': 'Natural' };
// Paleta de cores-base da loja. O administrador pode acrescentar, renomear e remover cores (aba Cores do painel).
const DEFAULT_PALETTE = [
  { hex: '#fffdf7', name: 'Branco' }, { hex: '#e8bdc8', name: 'Rosa' }, { hex: '#b9d3df', name: 'Azul' }, { hex: '#353737', name: 'Grafite' }, { hex: '#eee2ca', name: 'Natural' },
  { hex: '#b7cfb0', name: 'Verde sálvia' }, { hex: '#f6d9a8', name: 'Amarelo suave' }, { hex: '#cdbfe0', name: 'Lilás' }, { hex: '#c75b5b', name: 'Vermelho' }, { hex: '#2f3e5c', name: 'Azul-marinho' }, { hex: '#9a9a9a', name: 'Cinza' }
];
const MAX_PALETTE = 40;
const FONTS = ['Georgia', 'Arial', 'cursive'];
const FONT_WIDTH = { Georgia: .58, Arial: .55, cursive: .5 }; // largura média de um caractere, em múltiplos do tamanho da letra
const HEART = 'M0 4-25-19C-45-39-12-57 0-35 12-57 45-39 25-19Z';
const HEX = /^#[a-f\d]{6}$/i;
const IMAGE_URL = /^data:image\/(png|jpeg|webp);base64,/;
const STORAGE = { cart: 'gotas-cart-v1', orders: 'gotas-orders-v1', coupon: 'gotas-coupon-v1', catalog: 'gotas-catalog-v1' };
const PHOTO_URL = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const ORDER_STATUS = { pending: 'Em andamento', done: 'Feito', late: 'Atrasado', canceled: 'Cancelado' };
const CUSTOMER_STATUS = { done: 'Pedido concluído', late: 'Atrasado', canceled: 'Cancelado' };
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
  card: '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 9h20M6 15h3"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  logout: '<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'
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

// ---- Catálogo editável (produtos e categorias) ----------------------------------------------
// Fica salvo neste navegador. Sem alterações do administrador, vale o catálogo padrão acima.
let CATALOG = { categories: [], products: [] };
let PRODUCTS = [];
const RECORD_FIELDS = ['id', 'shape', 'name', 'short', 'category', 'price', 'extraArea', 'detail', 'tag', 'stock', 'active', 'photo', 'colors'];
const toRecord = p => Object.fromEntries(RECORD_FIELDS.map(k => [k, p[k]]));
const cleanText = (v, max) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const slug = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 34) || 'item';
const ID_RE = /^[a-z0-9-]{1,40}$/;
function sanitizePalette(raw) {
  const out = [], seen = new Set();
  for (const c of Array.isArray(raw) ? raw : []) {
    const hex = c && typeof c.hex === 'string' && HEX.test(c.hex) ? c.hex.toLowerCase() : '', name = cleanText(c && c.name, 24);
    if (!hex || seen.has(hex)) continue;
    seen.add(hex); out.push({ hex, name: name || hex.toUpperCase() });
    if (out.length >= MAX_PALETTE) break;
  }
  return out.length ? out : DEFAULT_PALETTE.map(c => ({ ...c }));
}
function sanitizeCatalog(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  // Sem paleta no que veio (ex.: salvar só produtos), mantém a paleta atual da loja.
  const palette = sanitizePalette(src.palette !== undefined ? src.palette : CATALOG.palette);
  const inPalette = new Set(palette.map(c => c.hex));
  const pickColors = (list, shape) => {
    let out = [...new Set((Array.isArray(list) ? list : []).filter(h => typeof h === 'string' && HEX.test(h)).map(h => h.toLowerCase()))].filter(h => inPalette.has(h)).slice(0, MAX_PALETTE);
    if (!out.length) out = SHAPES[shape].colors.filter(h => inPalette.has(h));
    return out.length ? out : [palette[0].hex];
  };
  const categories = [], seen = new Set();
  for (const c of Array.isArray(src.categories) ? src.categories : []) {
    const id = c && typeof c.id === 'string' && ID_RE.test(c.id) ? c.id : '', label = cleanText(c && c.label, 30);
    if (!id || !label || id === 'todos' || seen.has(id)) continue;
    seen.add(id); categories.push({ id, label });
  }
  if (!categories.length) DEFAULT_CATEGORIES.forEach(c => categories.push({ ...c }));
  const products = [], ids = new Set();
  for (const r of Array.isArray(src.products) ? src.products : []) {
    if (!r || typeof r !== 'object' || !ID_RE.test(r.id || '') || ids.has(r.id) || !SHAPES[r.shape]) continue;
    const name = cleanText(r.name, 80); if (!name) continue;
    ids.add(r.id);
    products.push({
      id: r.id, shape: r.shape, name, short: cleanText(r.short, 60) || name,
      category: categories.some(c => c.id === r.category) ? r.category : categories[0].id,
      price: Math.round(clamp(r.price, 0.01, 100000, 1) * 100) / 100,
      extraArea: Math.round(clamp(r.extraArea, 0, 10000, 0) * 100) / 100,
      detail: cleanText(r.detail, 120), tag: cleanText(r.tag, 40),
      stock: Math.round(clamp(r.stock, 0, 9999, 0)), active: r.active !== false,
      photo: typeof r.photo === 'string' && r.photo.length < 600000 && PHOTO_URL.test(r.photo) ? r.photo : '',
      colors: pickColors(r.colors, r.shape)
    });
  }
  if (!products.length) DEFAULT_PRODUCTS.forEach(p => products.push({ ...p, colors: pickColors(null, p.shape) }));
  return { categories, products, palette };
}
function buildProduct(rec, categories) {
  const shape = SHAPES[rec.shape];
  return { ...rec, label: (categories.find(c => c.id === rec.category) || categories[0]).label, position: shape.position, sizes: shape.sizes, colors: rec.colors, areas: shape.areas };
}
function applyCatalog(raw) {
  CATALOG = sanitizeCatalog(raw);
  PRODUCTS = CATALOG.products.map(r => buildProduct(r, CATALOG.categories));
  for (const c of CATALOG.palette) COLOR_NAMES[c.hex] = c.name;
}
applyCatalog(readStorage(STORAGE.catalog, null));
const productById = id => PRODUCTS.find(p => p.id === id);
const shopProducts = () => PRODUCTS.filter(p => p.active);
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

// Itens da sacola: só produtos que existem e estão à venda.
const sanitizeCart = list => (Array.isArray(list) ? list : []).filter(item => item && productById(item.productId)?.active && Number.isInteger(item.qty) && item.qty > 0 && item.qty <= 30 && item.design).map(item => ({ ...item, design: normalizeDesign(item.design, productById(item.productId)) }));
// Pedidos: aceita pedidos antigos (sem status) e descarta registros inválidos.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function normalizeOrders(list) {
  return (Array.isArray(list) ? list : []).filter(o => o && typeof o === 'object' && typeof o.id === 'string' && Array.isArray(o.items)).map(o => ({
    ...o,
    status: ORDER_STATUS[o.status] ? o.status : 'pending',
    dueDate: typeof o.dueDate === 'string' && DATE_RE.test(o.dueDate) ? o.dueDate : '',
    stage: Math.round(clamp(o.stage, 0, 3, 0)),
    items: o.items.filter(Boolean).map(item => ({ ...item, design: upgradeDesign(item.design) }))
  }));
}
let orders = normalizeOrders(readStorage(STORAGE.orders, []));
// Aviso curto na tela. Na página do painel não há #toast, então simplesmente não mostra nada.
let toastTimer;
function toast(message) { const el = $('#toast'); if (!el) return; el.textContent = message; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 4000); }

// ---- Validação do arquivo de arte (somente PNG e JPG) -------------------------------------
// Não confiamos só em file.type/extensão (podem ser renomeados): conferimos a assinatura real do arquivo.
const ART_MAX_BYTES = 5 * 1024 * 1024;
const ART_FORMAT_MSG = 'Envie uma imagem JPG ou PNG de até 5 MB.';
function detectImageType(b) {
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 && b[4] === 0x0D && b[5] === 0x0A && b[6] === 0x1A && b[7] === 0x0A) return 'png';
  if (b.length >= 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'jpg';
  return null;
}
async function validateArtFile(file) {
  const ext = (file.name.match(/\.([^.]+)$/) || [])[1]?.toLowerCase() || '';
  const extType = ext === 'png' ? 'png' : (ext === 'jpg' || ext === 'jpeg') ? 'jpg' : null;
  if (!file.size) return { ok: false, message: 'Esse arquivo está vazio. ' + ART_FORMAT_MSG };
  if (file.size > ART_MAX_BYTES) return { ok: false, message: 'Essa imagem tem ' + (file.size / 1048576).toFixed(1).replace('.', ',') + ' MB. O limite é 5 MB.' };
  if (!extType) return { ok: false, message: 'Formato não aceito' + (ext ? ' (.' + ext + ')' : '') + '. ' + ART_FORMAT_MSG };
  let real = null;
  try { real = detectImageType(new Uint8Array(await file.slice(0, 16).arrayBuffer())); } catch { return { ok: false, message: 'Não foi possível ler esse arquivo. Tente outro.' }; }
  if (!real) return { ok: false, message: 'Esse arquivo não parece ser uma imagem JPG ou PNG de verdade. ' + ART_FORMAT_MSG };
  // Conteúdo é PNG/JPG de verdade: aceita mesmo se a extensão foi trocada entre .png e .jpg.
  return { ok: true, type: real };
}

// ---- Avisos de mudança + sincronização entre abas ----------------------------------------------
// A loja e o painel (outra página) escutam este evento para se atualizar.
function notifyDataChanged() { window.dispatchEvent(new CustomEvent('gotas:data-changed')); }
window.addEventListener('storage', event => {
  if (event.key === STORAGE.catalog) { applyCatalog(readStorage(STORAGE.catalog, null)); notifyDataChanged(); }
  if (event.key === STORAGE.orders) { orders = normalizeOrders(readStorage(STORAGE.orders, [])); notifyDataChanged(); }
});

// Interface usada pelo painel: leitura e gravação do catálogo e dos pedidos.
window.GotasStore = {
  icons: ICONS, money, slug, SHAPES, ORDER_STATUS, ID_RE,
  getProducts: () => PRODUCTS,
  getCategories: () => CATALOG.categories,
  getPalette: () => CATALOG.palette,
  MAX_PALETTE, HEX,
  getOrders: () => orders,
  toRecord, describeAreas, sanitizeCatalog, normalizeOrders,
  defaults: () => ({ categories: DEFAULT_CATEGORIES.map(c => ({ ...c })), products: DEFAULT_PRODUCTS.map(p => ({ ...p })), palette: DEFAULT_PALETTE.map(c => ({ ...c })) }),
  subscribe(fn) { window.addEventListener('gotas:data-changed', fn); return () => window.removeEventListener('gotas:data-changed', fn); },
  saveCatalog(raw) {
    const clean = sanitizeCatalog(raw);
    try { localStorage.setItem(STORAGE.catalog, JSON.stringify(clean)); } catch { return false; }
    applyCatalog(clean); notifyDataChanged(); return true;
  },
  saveOrders(list) {
    const clean = normalizeOrders(list);
    try { localStorage.setItem(STORAGE.orders, JSON.stringify(clean)); } catch { return false; }
    orders = clean; notifyDataChanged(); return true;
  },
  async imageToDataUrl(file, maxSide = 700) {
    const check = await validateArtFile(file);
    if (!check.ok) throw new Error(check.message);
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio)); canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
    return canvas.toDataURL('image/webp', .8);
  }
};
