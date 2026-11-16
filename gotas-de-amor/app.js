'use strict';
// Interface da loja. Os dados (catálogo, pedidos, validação) vêm de store.js; o login vem de auth.js.
let cart = sanitizeCart(readStorage(STORAGE.cart, []));
let coupon = readStorage(STORAGE.coupon, '') === 'AMOR10' ? 'AMOR10' : '';
let filter = 'todos';
let editorProduct = shopProducts()[0] || PRODUCTS[0];
let design = { base: '', areas: {} };
let activeArea = 'front';
let previewView = 'front';
let previewZoom = false;
const uploadSeq = {};
const pendingUploads = new Set();
let checkout = {};
let checkoutStep = 1;
const cartSubtotal = () => Math.round(cart.reduce((sum, item) => sum + unitPrice(item.productId, item.design) * item.qty, 0) * 100) / 100;
const discount = () => coupon === 'AMOR10' ? Math.round(cartSubtotal() * .1 * 100) / 100 : 0;
const shipping = () => checkout.delivery === 'delivery' ? 18.90 : 0;
const total = () => cartSubtotal() - discount() + shipping();
function openDialog(id) { $$('dialog[open]').forEach(d => d.close()); document.body.classList.add('modal-open'); const dialog = $('#' + id); dialog.showModal(); dialog.scrollTop = 0; }
function saveCart() { writeStorage(STORAGE.cart, cart); $('#cart-count').textContent = cart.reduce((sum, item) => sum + item.qty, 0); $('.bag-button').setAttribute('aria-label', `Abrir sacola, ${$('#cart-count').textContent} itens`); }

function renderFilters() {
  const used = new Set(shopProducts().map(p => p.category));
  const cats = CATALOG.categories.filter(c => used.has(c.id));
  if (filter !== 'todos' && !used.has(filter)) filter = 'todos';
  $('#filters').innerHTML = [{ id: 'todos', label: 'Todos os produtos' }, ...cats].map(c => `<button class="filter ${c.id === filter ? 'active' : ''}" data-filter="${esc(c.id)}" aria-pressed="${c.id === filter}">${esc(c.label)}</button>`).join('');
}
function renderProducts() {
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const query = norm($('#product-search').value.trim());
  const products = shopProducts().filter(p => (filter === 'todos' || p.category === filter) && norm(`${p.name} ${p.label} ${p.detail} ${placementSummary(p)}`).includes(query));
  const card = p => {
    const out = p.stock <= 0;
    const photo = p.photo ? ` custom" style="--photo:url('${p.photo}')` : '" style="--position:' + p.position;
    return `<article class="product-card"><button class="product-photo${photo}" data-personalize="${esc(p.id)}" aria-label="Personalizar ${esc(p.short)}" ${out ? 'disabled' : ''}>${p.tag ? `<span class="product-tag">${esc(p.tag)}</span>` : ''}${out ? '<span class="product-tag sold-out">Esgotado</span>' : ''}</button><div class="product-category">${esc(p.label)}</div><h3>${esc(p.name)}</h3><p>${esc(p.detail)}</p><p class="product-areas">Estampe: ${esc(placementSummary(p))}</p><div class="product-price"><small>a partir de</small> ${money(p.price)}</div><button class="personalize-button" data-personalize="${esc(p.id)}" ${out ? 'disabled' : ''}>${out ? 'Esgotado por enquanto' : `Personalizar do meu jeito ${icon('arrow')}`}</button></article>`;
  };
  $('#product-grid').innerHTML = products.length ? products.map(card).join('') : `<div class="empty-state">${icon('search')}<h3>Ainda não encontramos esse presente.</h3><p>Tente buscar por outro nome ou veja todos os produtos.</p><button class="button secondary" data-action="clear-search">Ver todos os produtos</button></div>`;
  $('#product-results').textContent = `${products.length} produtos encontrados`;
}

// ---- Prévia -------------------------------------------------------------------------------
// SVG vetorial para uma prévia editável: a arte enviada nunca é executada como HTML.
function silhouette(product, color, view) {
  const back = view === 'back';
  if (product.shape === 'caneca') {
    const mug = `<path d="M285 139h25c58 0 58 108 0 108h-25" fill="none" stroke="${color}" stroke-width="27"/><path d="M292 140h20c42 0 42 106-1 106h-18" fill="none" stroke="#b4a59b" stroke-opacity=".35" stroke-width="2"/><path d="M89 118h204v169c-3 38-200 38-204 0Z" fill="${color}" stroke="#c4b6aa"/><ellipse cx="191" cy="118" rx="102" ry="21" fill="${color}" stroke="#c4b6aa"/><ellipse cx="191" cy="118" rx="92" ry="13" fill="#dfd6c9"/>`;
    return back ? `<g transform="translate(382 0) scale(-1 1)">${mug}</g>` : mug; // no verso o cabo aparece do outro lado
  }
  if (product.shape === 'ecobag') return `<path d="M145 150V97c0-73 110-73 110 0v53" fill="none" stroke="${color}" stroke-width="18"/><path d="M144 150V97c0-73 110-73 110 0v53" fill="none" stroke="#b9a996" stroke-opacity=".5"/><path d="M86 134h228l-10 212H96Z" fill="${color}" stroke="#c4b6aa"/><path d="M99 144h202M108 332h184" stroke="#b9a996" stroke-dasharray="2 3" fill="none"/>`;
  if (product.shape === 'moletom') { const n = back ? 9 : 28, m = back ? 16 : 48; return `<path d="m147 65-49 25-67 198 49 18 49-137-7 169h156l-7-169 49 137 49-18-67-198-49-25c-15 ${n}-91 ${n}-106 0Z" fill="${color}" stroke="#b6b5b1"/><path d="M147 65c10 ${m} 96 ${m} 106 0M124 322h152M35 274l48 18m234 0 48-18" fill="none" stroke="#9a9f9e" stroke-opacity=".6" stroke-width="5"/>`; }
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
  const chosen = productById(id);
  const found = chosen && chosen.active ? chosen : shopProducts()[0];
  if (!found) { toast('Nenhum produto disponível no momento.'); return; }
  if (found.stock <= 0) { toast('Esse produto está esgotado por enquanto.'); return; }
  editorProduct = found;
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
  const check = await validateArtFile(file);
  if (!check.ok) { if (sequence === uploadSeq[areaId]) { $('#editor-error').textContent = check.message; $('#art-upload').value = ''; } return; }
  $('#editor-error').textContent = '';
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
    return `<article class="cart-item"><div class="cart-thumb">${productPreview(p, item.design, 'cart-' + i, true)}</div><div class="cart-item-info"><div class="cart-item-top"><h3>${esc(p.short)}</h3><button class="icon-button" data-remove="${esc(item.id)}" aria-label="Remover ${esc(p.short)}">${icon('trash')}</button></div><p>${esc(item.size)} · ${COLOR_NAMES[item.design.base] || 'Personalizado'}${n > 1 ? ` · ${n} áreas de estampa` : ''}</p><p>${lines.map(esc).join('<br>')}</p>${item.note ? `<p>Obs.: ${esc(item.note)}</p>` : ''}<div class="quantity-control"><button data-quantity="${item.id}" data-delta="-1" aria-label="Diminuir quantidade" ${item.qty <= 1 ? 'disabled' : ''}>−</button><span>${item.qty}</span><button data-quantity="${item.id}" data-delta="1" aria-label="Aumentar quantidade" ${stockUsed(item.productId) >= p.stock ? 'disabled' : ''}>+</button></div><p class="item-price">${money(unitPrice(item.productId, item.design) * item.qty)}</p></div></article>`;
  }).join('') + `<label for="coupon-input">Um carinho extra</label><form id="coupon-form" class="coupon-row"><input id="coupon-input" placeholder="Seu cupom" aria-label="Cupom de desconto" value="${coupon}" maxlength="20"><button class="button secondary" type="submit">Aplicar</button></form><p class="coupon-hint" id="coupon-message" role="status">${coupon ? 'AMOR10 aplicado: 10% de desconto. <button class="link-button" data-action="remove-coupon">Remover</button>' : 'Experimente o cupom demonstrativo AMOR10.'}</p>${totalsHTML(false)}<p id="cart-error" class="form-error" role="alert"></p><button class="button primary full" data-action="checkout">Continuar para o pedido ${icon('arrow')}</button><p class="cart-bottom-note">Compra demonstrativa · nenhuma cobrança será feita.</p>`;
}
function stockUsed(id) { return cart.filter(i => i.productId === id).reduce((s, i) => s + i.qty, 0); }
function totalsHTML(withShipping = true) { return `<div class="totals"><div><span>Produtos</span><span>${money(cartSubtotal())}</span></div>${coupon ? `<div class="rose"><span>Desconto AMOR10</span><span>− ${money(discount())}</span></div>` : ''}<div><span>${withShipping ? 'Entrega' : 'Frete'}</span><span>${withShipping ? (shipping() ? money(shipping()) : 'Retirada gratuita') : 'Na próxima etapa'}</span></div><div class="total"><span>Total${withShipping ? '' : ' parcial'}</span><span>${money(cartSubtotal() - discount() + (withShipping ? shipping() : 0))}</span></div></div>`; }
function beginCheckout() {
  if (!cart.length) return;
  const over = PRODUCTS.find(p => stockUsed(p.id) > p.stock);
  if (over) { const el = $('#cart-error'); if (el) el.textContent = `Só há ${over.stock} unidade(s) de “${over.short}” disponíveis. Ajuste a quantidade na sacola.`; return; } const me = Auth.current(); checkout = { name: me && me.role === 'client' ? me.name.slice(0, 80) : '', cpf: '', phone: '', email: me && me.role === 'client' ? me.email.slice(0, 100) : '', cep: '', street: '', number: '', complement: '', district: '', city: '', state: '', delivery: 'pickup', payment: 'pix', result: 'approved' }; checkoutStep = 1; renderCheckout(); openDialog('checkout-dialog'); }
function formField(name, label, opts = '') { return `<label>${label}<input name="${name}" value="${esc(checkout[name] || '')}" ${opts}></label>`; }
function renderCheckout() {
  $$('.checkout-progress li').forEach((li, i) => { li.classList.toggle('active', i + 1 === checkoutStep); li.classList.toggle('done', i + 1 < checkoutStep); });
  let body = '';
  if (checkoutStep === 1) body = `<form id="customer-form"><h3 class="checkout-body-title">Para quem vai esse carinho?</h3>${formField('name', 'Nome completo', 'required minlength="3" maxlength="80" autocomplete="off" placeholder="Ex.: Maria de Exemplo"')}<div class="form-row">${formField('cpf', 'CPF fictício · 11 dígitos', 'required inputmode="numeric" pattern="[0-9]{11}" maxlength="11" autocomplete="off" placeholder="00000000000" title="Use 11 números fictícios, sem pontuação"')}${formField('phone', 'Telefone fictício com DDD', 'required type="tel" inputmode="tel" pattern="[0-9]{10,11}" maxlength="11" autocomplete="off" placeholder="11999999999" title="Use 10 ou 11 números, sem pontuação"')}</div>${formField('email', 'E-mail fictício (opcional)', 'type="email" maxlength="100" autocomplete="off" placeholder="exemplo@example.com"')}<p class="small-muted">Seus dados são usados apenas nesta simulação e não são enviados a uma loja.</p><div class="checkout-actions"><button class="button secondary" type="button" data-action="back-cart">Voltar à sacola</button><button class="button primary" type="submit">Escolher entrega ${icon('arrow')}</button></div></form>`;
  if (checkoutStep === 2) body = `<form id="delivery-form"><h3 class="checkout-body-title">Como prefere receber?</h3><label class="delivery-option"><input type="radio" name="delivery" value="pickup" ${checkout.delivery === 'pickup' ? 'checked' : ''}><span>Retirada na loja<small>Local e prazo a combinar na operação real</small></span><strong>Grátis</strong></label><label class="delivery-option"><input type="radio" name="delivery" value="delivery" ${checkout.delivery === 'delivery' ? 'checked' : ''}><span>Entrega no endereço<small>Exemplo: 5 a 8 dias úteis após a produção</small></span><strong>${money(18.90)}</strong></label><div id="address-fields" ${checkout.delivery === 'pickup' ? 'hidden' : ''}><div class="form-row">${formField('cep', 'CEP fictício', 'required pattern="[0-9]{8}" maxlength="8" inputmode="numeric" placeholder="00000000" title="Digite 8 números, sem pontuação"')}${formField('state', 'UF', 'required pattern="[A-Za-z]{2}" maxlength="2" placeholder="SP"')}</div>${formField('street', 'Rua / Avenida', 'required maxlength="120" placeholder="Rua de Exemplo"')}<div class="form-row">${formField('number', 'Número', 'required maxlength="12" placeholder="123"')}${formField('complement', 'Complemento (opcional)', 'maxlength="80" placeholder="Apto, bloco…"')}</div><div class="form-row">${formField('district', 'Bairro', 'required maxlength="60"')}${formField('city', 'Cidade', 'required maxlength="60"')}</div></div><p class="small-muted">Frete, disponibilidade e prazos são ilustrativos. A produção real depende da confirmação da arte e do pagamento.</p><div class="checkout-actions"><button class="button secondary" type="button" data-checkout-step="1">Voltar</button><button class="button primary" type="submit">Conferir pedido ${icon('arrow')}</button></div></form>`;
  if (checkoutStep === 3) body = `<h3 class="checkout-body-title">Um último olhar em cada detalhe.</h3>${cart.map(i => { const p = productById(i.productId); return `<div class="review-line"><span>${i.qty} × ${esc(p.short)}<small>${esc(i.size)} · ${COLOR_NAMES[i.design.base] || 'Personalizado'} · Arte aprovada</small>${describeAreas(i.productId, i.design).map(line => `<small>${esc(line)}</small>`).join('')}${i.note ? `<small>Obs.: ${esc(i.note)}</small>` : ''}</span><strong>${money(unitPrice(i.productId, i.design) * i.qty)}</strong></div>`; }).join('')}<div class="address-summary"><p><strong>${esc(checkout.name)}</strong> · ${esc(checkout.phone)}</p><p>${checkout.delivery === 'pickup' ? 'Retirada na loja — local a combinar (simulação).' : `${esc(checkout.street)}, ${esc(checkout.number)}${checkout.complement ? ' · ' + esc(checkout.complement) : ''}<br>${esc(checkout.district)} · ${esc(checkout.city)} / ${esc(checkout.state.toUpperCase())} · CEP ${esc(checkout.cep)}`}</p><button class="link-button" data-checkout-step="1">Corrigir dados</button> · <button class="link-button" data-checkout-step="2">Alterar entrega</button></div>${totalsHTML()}<div class="checkout-actions"><button class="button secondary" data-checkout-step="2">Voltar</button><button class="button primary" data-checkout-step="4">Ir para pagamento ${icon('arrow')}</button></div>`;
  if (checkoutStep === 4) body = `<form id="payment-form"><h3 class="checkout-body-title">Escolha como deseja testar.</h3><div class="form-row"><label class="payment-option"><input type="radio" name="payment" value="pix" ${checkout.payment === 'pix' ? 'checked' : ''}><span>Pix<small>Simulação de aprovação</small></span></label><label class="payment-option"><input type="radio" name="payment" value="card" ${checkout.payment === 'card' ? 'checked' : ''}><span>Cartão<small>Sem inserir dados reais</small></span></label></div><div class="payment-simulation"><span>${icon(checkout.payment === 'pix' ? 'sparkles' : 'card')}</span><h3>${checkout.payment === 'pix' ? 'Pix demonstrativo' : 'Cartão demonstrativo'}</h3><p>${checkout.payment === 'pix' ? 'Nenhuma chave ou QR Code real é gerado.' : 'Não é necessário informar número, validade ou código do cartão.'}<br>O botão abaixo permite testar o resultado do pagamento.</p><label class="payment-test">Resultado do teste<select id="payment-result" name="result"><option value="approved" ${checkout.result === 'approved' ? 'selected' : ''}>Pagamento aprovado</option><option value="declined" ${checkout.result === 'declined' ? 'selected' : ''}>Pagamento não aprovado</option></select></label></div>${totalsHTML()}<p id="payment-error" class="form-error" role="alert"></p><div class="checkout-actions"><button class="button secondary" type="button" data-checkout-step="3">Voltar</button><button class="button primary" type="submit">Simular pagamento ${icon('check')}</button></div></form>`;
  $('#checkout-body').innerHTML = body;
  if (checkoutStep === 2) updateAddressVisibility();
  $('#checkout-dialog').scrollTop = 0;
}
function captureCheckoutForm() { const form = $('form', $('#checkout-body')); if (form) for (const [key, value] of new FormData(form)) checkout[key] = String(value).trim(); }
function updateAddressVisibility() { const needsAddress = checkout.delivery === 'delivery'; $('#address-fields').hidden = !needsAddress; $$('#address-fields input').forEach(input => { input.disabled = !needsAddress; }); }
function completeOrder() {
  const now = new Date();
  const items = cart.map(i => ({ id: i.id, productId: i.productId, qty: i.qty, size: i.size, note: i.note, unit: unitPrice(i.productId, i.design), name: productById(i.productId)?.short || 'Produto', design: slimDesign(i.design) }));
  const order = { id: `GA-${now.getTime().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`, createdAt: now.toISOString(), items, subtotal: cartSubtotal(), discount: discount(), shipping: shipping(), total: total(), delivery: checkout.delivery, payment: checkout.payment, stage: 0, status: 'pending', dueDate: '',
    customer: { name: String(checkout.name || '').slice(0, 80), phone: String(checkout.phone || '').slice(0, 11), email: String(checkout.email || '').slice(0, 100) },
    address: checkout.delivery === 'delivery' ? { cep: checkout.cep, street: checkout.street, number: checkout.number, complement: checkout.complement || '', district: checkout.district, city: checkout.city, state: String(checkout.state || '').toUpperCase() } : null };
  orders.unshift(order);
  if (orders.length > 200) orders.length = 200;
  writeStorage(STORAGE.orders, orders); notifyDataChanged();
  cart = []; coupon = ''; writeStorage(STORAGE.coupon, ''); saveCart();
  checkout = {}; renderOrders(order.id); openDialog('orders-dialog');
}
function renderOrders(successId) {
  const root = $('#orders-content');
  if (!orders.length) { root.innerHTML = `<div class="empty-state">${icon('package')}<h3>Sua primeira história começa aqui.</h3><p>Você ainda não tem pedidos neste navegador.</p><button class="button primary" data-close="orders-dialog">Explorar produtos ${icon('arrow')}</button></div>`; return; }
  const itemLine = i => { const lines = describeAreas(i.productId, i.design); return `<div class="order-line">${i.qty} × ${esc(i.name || productById(i.productId)?.short || 'Produto')} · ${esc(i.size)}${lines.length ? `<span class="order-areas">${lines.map(esc).join('<br>')}</span>` : ''}</div>`; };
  const stageLabels = order => ['Recebido', 'Em produção', order.delivery === 'pickup' ? 'Pronto para retirada' : 'Enviado', 'Entregue'];
  const pill = order => order.status === 'pending' ? `${['Pedido recebido', 'Em produção', order.delivery === 'pickup' ? 'Pronto para retirada' : 'Enviado', 'Entregue'][order.stage || 0]} · demo` : `${CUSTOMER_STATUS[order.status]} · demo`;
  root.innerHTML = (successId ? `<div class="success-banner"><span>${icon('check')}</span><h3>Seu carinho ganhou forma!</h3><p>Pedido demonstrativo criado. Pagamento simulado com sucesso.<br>Nenhuma compra real ou produção foi iniciada.</p></div>` : `<p class="small-muted" style="margin-bottom:18px">Pedidos demonstrativos salvos neste navegador. As etapas abaixo são uma simulação.</p>`) + orders.map(order => `<article class="order-card"><div class="order-header"><div><h3>${esc(order.id)}</h3><small>${new Date(order.createdAt).toLocaleString('pt-BR')}</small></div><span class="status-pill ${esc(order.status)}">${esc(pill(order))}</span></div><div class="order-items">${order.items.map(itemLine).join('')}</div>${order.status === 'canceled' ? '<p class="small-muted">Este pedido foi cancelado pela loja.</p>' : `<div class="order-tracking">${stageLabels(order).map((l, i) => `<div class="${i <= (order.stage || 0) ? 'current' : ''}">${l}</div>`).join('')}</div>`}${order.status === 'late' ? '<p class="small-muted">A loja marcou este pedido como atrasado.</p>' : ''}<div class="order-total"><span>${order.payment === 'pix' ? 'Pix' : 'Cartão'} · pagamento simulado</span><strong>${money(order.total)}</strong></div><div class="order-tools">${(order.stage || 0) < 3 && (order.status === 'pending' || order.status === 'late') ? `<button class="button secondary" data-advance="${esc(order.id)}">Simular próxima etapa ${icon('arrow')}</button>` : (order.status === 'canceled' ? '' : '<span class="small-muted">Simulação concluída ♡</span>')}<button class="link-button" data-download="${esc(order.id)}">Baixar resumo</button></div></article>`).join('');
}
function downloadOrder(id) {
  const order = orders.find(o => o.id === id); if (!order) return;
  const text = ['GOTAS DE AMOR — PEDIDO DEMONSTRATIVO', order.id, new Date(order.createdAt).toLocaleString('pt-BR'), '', ...order.items.map(i => `${i.qty} × ${i.name || productById(i.productId)?.short || 'Produto'} | ${i.size} | ${COLOR_NAMES[i.design.base] || 'Personalizado'}\n${describeAreas(i.productId, i.design).map(line => 'Estampa — ' + line).join('\n')}\nObservação: ${i.note || 'nenhuma'}`), '', `Produtos: ${money(order.subtotal)}`, `Desconto: ${money(order.discount)}`, `Frete: ${money(order.shipping)}`, `Total: ${money(order.total)}`, `Entrega: ${order.delivery === 'pickup' ? 'Retirada' : 'Entrega no endereço'}`, `Pagamento: ${order.payment === 'pix' ? 'Pix' : 'Cartão'} (simulado)`, '', 'Este resumo não é comprovante de pagamento nem nota fiscal.', 'Nenhum pedido foi enviado à produção e nenhum valor foi cobrado.'].join('\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = `${order.id}.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.addEventListener('click', event => {
  const modeButton = event.target.closest('[data-login-mode]'); if (modeButton) { loginMode = modeButton.dataset.loginMode; renderLogin(); return; }
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
  const advance = event.target.closest('[data-advance]'); if (advance) { const order = orders.find(o => o.id === advance.dataset.advance); if (order && order.stage < 3) { order.stage++; writeStorage(STORAGE.orders, orders); notifyDataChanged(); renderOrders(); } return; }
  const download = event.target.closest('[data-download]'); if (download) { downloadOrder(download.dataset.download); return; }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'cart' || action === 'back-cart') { renderCart(); openDialog('cart-dialog'); }
  if (action === 'orders') { renderOrders(); openDialog('orders-dialog'); }
  if (action === 'login') openLogin();
  if (action === 'logout') { Auth.logout(); loginMode = 'login'; loginNotice = ''; renderLogin(); toast('Você saiu da conta.'); }
  if (action === 'fill-admin') fillTestAdmin();
  if (action === 'fill-client') fillTestClient();
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
renderFilters(); hydrateIcons(); renderProducts(); saveCart();

// ---- Atualização da loja quando catálogo/pedidos mudam (painel em outra aba, por exemplo) -------
function refreshShop() {
  const before = cart.length;
  cart = sanitizeCart(cart);
  renderFilters(); renderProducts(); saveCart();
  if ($('#cart-dialog').open) renderCart();
  if ($('#orders-dialog').open) renderOrders();
  if (cart.length < before) toast('Alguns itens saíram do catálogo e foram removidos da sua sacola.');
}
window.addEventListener('gotas:data-changed', refreshShop);

// ---- Conta: entrar, criar conta, sair (cliente e administrador) -------------------------------
// Só o administrador vê o link do painel (admin.html). O painel confere o login de novo ao abrir.
const Auth = window.GotasAuth;
let loginMode = 'login', loginNotice = '', loginNext = '', renderedFor;
const firstName = u => (u.name || '').trim().split(/\s+/)[0] || 'cliente';
function renderAccount() {
  const user = Auth.current();
  $$('[data-account-label]').forEach(el => { el.textContent = user ? `Olá, ${firstName(user)}` : 'Entrar'; });
  $('#account-button').setAttribute('aria-label', user ? `Minha conta: ${user.name}` : 'Entrar ou criar conta');
  $$('[data-admin-only]').forEach(el => { el.hidden = !(user && user.role === 'admin'); });
  if ($('#login-dialog').open && renderedFor !== (user ? user.id : null)) renderLogin();
}
function renderLogin() {
  const user = Auth.current(), root = $('#login-body'), reg = loginMode === 'register';
  renderedFor = user ? user.id : null;
  $('#login-title').textContent = user ? 'Minha conta' : reg ? 'Criar conta' : 'Entrar';
  const notice = loginNotice ? `<p class="login-notice" role="status">${esc(loginNotice)}</p>` : '';
  if (user) {
    const admin = user.role === 'admin';
    root.innerHTML = `${notice}<div class="account-card"><span class="account-avatar" aria-hidden="true">${esc(firstName(user).charAt(0).toUpperCase())}</span><div><strong>${esc(user.name)}</strong><small>${esc(user.email)}</small><span class="role-chip ${admin ? 'admin' : 'client'}">${admin ? 'Administrador' : 'Cliente'}</span></div></div>${admin ? `<a class="button primary full" href="admin.html">Abrir o painel da loja ${icon('arrow')}</a><p class="small-muted login-hint">Só a conta de administrador pode alterar produtos, categorias e pedidos.</p>` : '<p class="small-muted login-hint">Você está conectada como cliente. Seus dados já vêm preenchidos no pedido.</p>'}<div class="login-links"><button class="button secondary" type="button" data-action="orders">Meus pedidos</button><button class="button secondary" type="button" data-action="logout">Sair</button></div>`;
    return;
  }
  const field = (name, label, type, extra = '') => `<label>${label}<input id="login-${name}" name="${name}" type="${type}" required ${extra}></label>`;
  root.innerHTML = `${notice}<div class="login-tabs" role="group" aria-label="Entrar ou criar conta"><button type="button" data-login-mode="login" aria-pressed="${!reg}">Já tenho conta</button><button type="button" data-login-mode="register" aria-pressed="${reg}">Criar conta</button></div>
<form id="login-form" class="login-form">${reg ? field('name', 'Seu nome', 'text', 'minlength="2" maxlength="80" autocomplete="name"') : ''}${field('email', 'E-mail', 'email', `maxlength="100" autocomplete="${reg ? 'email' : 'username'}"`)}${field('password', 'Senha', 'password', `minlength="${reg ? 6 : 1}" autocomplete="${reg ? 'new-password' : 'current-password'}"`)}${reg ? field('password2', 'Repita a senha', 'password', 'minlength="6" autocomplete="new-password"') + '<p class="small-muted">Use pelo menos 6 caracteres.</p>' : ''}<p id="login-error" class="form-error" role="alert"></p><button class="button primary full" type="submit">${reg ? 'Criar conta e entrar' : 'Entrar'}</button></form>${!reg && Auth.testLoginEnabled ? `<div class="login-test"><p class="small-muted"><strong>Modo de teste.</strong> Escolha uma conta para preencher os dados de acesso.</p><button class="button secondary full" type="button" data-action="fill-admin">Preencher como administrador</button><button class="button secondary full" style="margin-top:8px" type="button" data-action="fill-client">Preencher como cliente</button></div>` : ''}`;
}
function openLogin() { renderLogin(); openDialog('login-dialog'); const first = $('#login-body input'); if (first) first.focus(); }
async function fillTestClient() {
  if (!Auth.testLoginEnabled) return;
  try {
    await Auth.ensureTestClient();
    if (loginMode !== 'login') { loginMode = 'login'; renderLogin(); }
    $('#login-email').value = Auth.testClient.email;
    $('#login-password').value = Auth.testClient.password;
    $('#login-error').textContent = '';
    $('#login-form button[type="submit"]').focus();
  } catch { $('#login-error').textContent = 'Não foi possível criar a conta teste. Verifique o armazenamento do navegador.'; }
}
function fillTestAdmin() {
  if (!Auth.testLoginEnabled) return;
  if (loginMode !== 'login') { loginMode = 'login'; renderLogin(); }
  $('#login-email').value = Auth.testAdmin.email; $('#login-password').value = Auth.testAdmin.password;
  $('#login-error').textContent = '';
  $('#login-form button[type="submit"]').focus();
}
document.addEventListener('submit', async event => {
  if (event.target.id !== 'login-form') return;
  event.preventDefault();
  const form = event.target, error = $('#login-error'), button = $('button[type="submit"]', form), data = Object.fromEntries(new FormData(form));
  error.textContent = '';
  if (loginMode === 'register' && data.password !== data.password2) { error.textContent = 'As senhas não conferem.'; return; }
  const label = button.textContent; button.disabled = true; button.textContent = 'Conferindo…';
  const result = loginMode === 'register' ? await Auth.register({ name: data.name, email: data.email, password: data.password }) : await Auth.login(data.email, data.password);
  button.disabled = false; button.textContent = label;
  if (!result.ok) { error.textContent = result.message; return; }
  const user = result.user;
  if (user.role === 'admin' && loginNext) { location.href = loginNext; return; }
  if (user.role === 'admin') { loginNotice = 'Você entrou como administrador.'; renderLogin(); return; }
  $('#login-dialog').close(); toast(`Olá, ${firstName(user)}! Você entrou na sua conta.`);
});
$('#login-dialog').addEventListener('close', () => { loginNotice = ''; loginNext = ''; });
Auth.subscribe(renderAccount);
renderAccount();
// O painel manda quem não é administrador para cá (index.html?entrar=admin).
(() => {
  const wanted = new URLSearchParams(location.search).get('entrar');
  if (!wanted) return;
  history.replaceState(null, '', location.pathname + location.hash);
  if (wanted !== 'admin') return;
  const user = Auth.current();
  if (user && user.role === 'admin') { location.replace('admin.html'); return; }
  loginNext = 'admin.html';
  loginNotice = user ? 'O painel é só para o administrador. Saia desta conta e entre com a conta de administrador.' : 'O painel da loja é restrito. Entre como administrador para continuar.';
  openLogin();
})();

// ---- Instalação (PWA) -----------------------------------------------------------------------
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
