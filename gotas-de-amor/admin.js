'use strict';
// Painel do administrador (React + htm, sem etapa de compilação).
// Página separada (admin.html): só abre para quem entrou com a conta de administrador (auth.js).
// Os dados (catálogo e pedidos) ficam no navegador, via store.js. Veja o aviso de limites no auth.js.
(() => {
  const S = window.GotasStore, Auth = window.GotasAuth;
  if (!Auth || !Auth.isAdmin()) { location.replace('index.html?entrar=admin'); return; }
  if (!S || !window.React || !window.ReactDOM || !window.htm) { document.getElementById('admin-root').textContent = 'Não foi possível carregar o painel. Recarregue a página.'; return; }
  const { useState, useEffect, useRef, useCallback } = React;
  const html = htm.bind(React.createElement);

  // ---- Utilidades ------------------------------------------------------------------------------
  const money = S.money;
  const fmtDate = iso => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('pt-BR'); };
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const toNumber = v => Number(String(v).trim().replace(',', '.'));
  const uniqueId = (base, taken) => { let id = base, n = 2; while (taken.has(id)) id = `${base.slice(0, 34)}-${n++}`; return id; };
  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const csvCell = v => { let t = String(v ?? ''); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return `"${t.replace(/"/g, '""')}"`; };
  const addressText = o => o.address ? [`${o.address.street}, ${o.address.number}${o.address.complement ? ' · ' + o.address.complement : ''}`, `${o.address.district} · ${o.address.city}/${o.address.state}`, `CEP ${o.address.cep}`].join(' — ') : '';
  const itemsText = o => o.items.map(i => `${i.qty} × ${i.name || 'Produto'} (${i.size})`).join('; ');
  const isOverdue = o => o.status === 'pending' && o.dueDate && o.dueDate < todayISO();

  const Icon = ({ name }) => html`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML=${{ __html: S.icons[name] || '' }}></svg>`;

  // Atualiza o componente quando o catálogo ou os pedidos mudam (aqui, na loja ou em outra aba).
  function useStoreVersion() {
    const [, setV] = useState(0);
    useEffect(() => S.subscribe(() => setV(v => v + 1)), []);
  }

  // ---- Pedidos ---------------------------------------------------------------------------------
  const STATUS_ORDER = ['pending', 'late', 'done', 'canceled'];

  function OrderCard({ order, onPatch, onDelete }) {
    const [confirm, setConfirm] = useState(false);
    const overdue = isOverdue(order);
    const setStatus = status => {
      if (status === order.status) return;
      const patch = { status, statusAt: new Date().toISOString() };
      if (status === 'done') patch.stage = 3; else if (order.status === 'done') patch.stage = 2;
      onPatch(order.id, patch);
    };
    const customer = order.customer || {};
    return html`<article class=${'adm-order st-' + order.status}>
      <div class="adm-order-head">
        <div><h4>${order.id}</h4><small class="small-muted">${fmtDate(order.createdAt)}</small></div>
        <div class="adm-badges">
          ${overdue && html`<span class="adm-chip warn">Prazo vencido</span>`}
          <span class=${'adm-chip st-' + order.status}>${S.ORDER_STATUS[order.status]}</span>
        </div>
      </div>
      <div class="adm-order-body">
        <div>
          <p class="adm-label">Cliente</p>
          <p>${customer.name || 'Sem nome (pedido antigo)'}${customer.phone ? ` · ${customer.phone}` : ''}${customer.email ? ` · ${customer.email}` : ''}</p>
          <p class="adm-label">Entrega</p>
          <p>${order.delivery === 'pickup' ? 'Retirada na loja' : addressText(order) || 'Entrega no endereço'}</p>
        </div>
        <div>
          <p class="adm-label">Itens</p>
          ${order.items.map((i, n) => html`<p key=${n}>${i.qty} × ${i.name || 'Produto'} · ${i.size}
            ${S.describeAreas(i.productId, i.design).map((l, k) => html`<small key=${k} class="adm-sub">${l}</small>`)}
            ${i.note && html`<small class="adm-sub">Obs.: ${i.note}</small>`}</p>`)}
        </div>
      </div>
      <div class="adm-order-foot">
        <div class="adm-seg" role="group" aria-label=${'Situação do pedido ' + order.id}>
          ${STATUS_ORDER.map(st => html`<button type="button" key=${st} class=${'st-' + st} aria-pressed=${order.status === st} onClick=${() => setStatus(st)}>${S.ORDER_STATUS[st]}</button>`)}
        </div>
        <label class="adm-inline">Prazo<input type="date" value=${order.dueDate || ''} onChange=${e => onPatch(order.id, { dueDate: e.target.value })} /></label>
        <strong class="adm-total">${money(order.total)}</strong>
        ${confirm
          ? html`<span class="adm-confirm"><button type="button" class="link-button danger" onClick=${() => onDelete(order.id)}>Confirmar exclusão</button><button type="button" class="link-button" onClick=${() => setConfirm(false)}>Não</button></span>`
          : html`<button type="button" class="link-button" onClick=${() => setConfirm(true)}>Excluir</button>`}
      </div>
    </article>`;
  }

  function OrdersTab({ say }) {
    const orders = S.getOrders();
    const [view, setView] = useState('all'), [q, setQ] = useState('');
    const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const count = st => orders.filter(o => o.status === st).length;
    const shown = orders.filter(o => (view === 'all' || o.status === view) && norm(`${o.id} ${o.customer?.name || ''} ${o.customer?.phone || ''}`).includes(norm(q.trim())));
    const revenue = orders.filter(o => o.status !== 'canceled').reduce((s, o) => s + (Number(o.total) || 0), 0);
    const patch = (id, p) => { if (!S.saveOrders(orders.map(o => o.id === id ? { ...o, ...p } : o))) say('Não foi possível salvar. O armazenamento do navegador pode estar cheio.', 'error'); };
    const remove = id => { if (S.saveOrders(orders.filter(o => o.id !== id))) say('Pedido excluído.'); };
    const exportCsv = () => {
      const head = ['Pedido', 'Data', 'Cliente', 'Telefone', 'E-mail', 'Itens', 'Entrega', 'Endereço', 'Pagamento', 'Total', 'Situação', 'Prazo'];
      const rows = orders.map(o => [o.id, fmtDate(o.createdAt), o.customer?.name, o.customer?.phone, o.customer?.email, itemsText(o), o.delivery === 'pickup' ? 'Retirada' : 'Entrega', addressText(o), o.payment === 'pix' ? 'Pix' : 'Cartão', Number(o.total).toFixed(2).replace('.', ','), S.ORDER_STATUS[o.status], o.dueDate]);
      download('pedidos-gotas-de-amor.csv', '﻿' + [head, ...rows].map(r => r.map(csvCell).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
    };
    const tabs = [['all', 'Todos', orders.length], ...STATUS_ORDER.map(st => [st, S.ORDER_STATUS[st], count(st)])];
    return html`<section>
      <div class="adm-stats">
        <div><span>${orders.length}</span><small>pedidos</small></div>
        <div><span>${count('pending')}</span><small>em andamento</small></div>
        <div><span>${count('late') + orders.filter(isOverdue).length}</span><small>atrasados ou com prazo vencido</small></div>
        <div><span>${money(revenue)}</span><small>soma dos pedidos (sem cancelados)</small></div>
      </div>
      <div class="adm-toolbar">
        <div class="adm-pills" role="group" aria-label="Filtrar pedidos por situação">
          ${tabs.map(([key, label, n]) => html`<button type="button" key=${key} aria-pressed=${view === key} onClick=${() => setView(key)}>${label} <b>${n}</b></button>`)}
        </div>
        <input class="adm-search" type="search" placeholder="Buscar por código ou cliente" aria-label="Buscar pedidos" value=${q} onInput=${e => setQ(e.target.value)} />
        <button type="button" class="button secondary adm-small" onClick=${exportCsv} disabled=${!orders.length}>Exportar CSV</button>
      </div>
      ${shown.length
        ? shown.map(o => html`<${OrderCard} key=${o.id} order=${o} onPatch=${patch} onDelete=${remove} />`)
        : html`<div class="empty-state adm-empty"><h3>${orders.length ? 'Nenhum pedido nesse filtro.' : 'Ainda não há pedidos.'}</h3><p>${orders.length ? 'Tente outra situação ou limpe a busca.' : 'Faça um pedido de teste na loja e ele aparece aqui.'}</p></div>`}
    </section>`;
  }

  // ---- Financeiro: valores em centavos para evitar erros de arredondamento ---------------------
  const EXPENSES_KEY = 'gotas-expenses-v1';
  const validExpense = e => e && typeof e.id === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(e.month) && typeof e.description === 'string' && Number.isSafeInteger(e.cents) && e.cents > 0;
  const readExpenses = () => { try { const data = JSON.parse(localStorage.getItem(EXPENSES_KEY) || '[]'); return Array.isArray(data) ? data.filter(validExpense) : []; } catch { return []; } };
  const monthKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const orderMonth = o => { const d = new Date(o.status === 'done' ? (o.statusAt || o.createdAt) : o.createdAt); return Number.isNaN(d.getTime()) ? '' : monthKey(d); };
  function financeRows(orders, expenses, end, count) {
    const [year, month] = end.split('-').map(Number);
    return Array.from({ length: count }, (_, i) => {
      const date = new Date(year, month - count + i, 1), key = monthKey(date);
      const selected = orders.filter(o => orderMonth(o) === key);
      const sum = status => selected.filter(o => status.includes(o.status)).reduce((n, o) => n + Math.round(Math.max(0, Number(o.total) || 0) * 100), 0);
      const revenue = sum(['done']), costs = expenses.filter(e => e.month === key).reduce((n, e) => n + e.cents, 0);
      return { key, label: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), revenue, costs, profit: revenue - costs, canceled: sum(['canceled']), pending: sum(['pending', 'late']) };
    });
  }
  function FinanceTab({ say }) {
    const [end, setEnd] = useState(() => monthKey(new Date()));
    const [count, setCount] = useState(6);
    const [expenses, setExpenses] = useState(readExpenses);
    const [month, setMonth] = useState(() => monthKey(new Date()));
    const [description, setDescription] = useState(''), [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    useEffect(() => { const refresh = e => { if (e.key === EXPENSES_KEY || e.key === null) setExpenses(readExpenses()); }; window.addEventListener('storage', refresh); return () => window.removeEventListener('storage', refresh); }, []);
    const rows = financeRows(S.getOrders(), expenses, end, count);
    const total = key => rows.reduce((sum, r) => sum + r[key], 0);
    const cash = cents => money(cents / 100);
    const save = next => { try { localStorage.setItem(EXPENSES_KEY, JSON.stringify(next)); setExpenses(next); return true; } catch { say('Não foi possível salvar as despesas.', 'error'); return false; } };
    const add = e => {
      e.preventDefault(); setError('');
      const value = toNumber(amount), cents = Math.round(value * 100);
      if (!description.trim() || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !Number.isFinite(value) || cents <= 0 || cents > 10000000000) return setError('Informe mês, descrição e um valor válido maior que zero (até R$ 100 milhões).');
      if (save([...readExpenses(), { id: crypto.randomUUID(), month, description: description.trim().slice(0, 120), cents }])) { setDescription(''); setAmount(''); say('Despesa registrada.'); }
    };
    const selectedExpenses = expenses.filter(e => rows.some(r => r.key === e.month)).sort((a, b) => b.month.localeCompare(a.month));
    const max = Math.max(1, ...rows.flatMap(r => [r.revenue, r.costs, Math.abs(r.profit)]));
    const exportCsv = () => download('financeiro-gotas-de-amor.csv', '\uFEFF' + [['Mês', 'Receita', 'Despesas', 'Resultado', 'Cancelados', 'Em aberto'], ...rows.map(r => [r.key, ...['revenue', 'costs', 'profit', 'canceled', 'pending'].map(k => (r[k] / 100).toFixed(2).replace('.', ','))])].map(r => r.map(csvCell).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
    return html`<section class="finance-section">
      <div class="adm-toolbar"><div class="finance-title"><h2>Rendimento da loja</h2><p class="small-muted">Acompanhe receitas, despesas e o resultado de cada mês.</p></div><button class="button secondary adm-small" onClick=${exportCsv}>Exportar CSV</button></div>
      <div class="adm-toolbar finance-filters">
        <label>Período<select value=${count} onChange=${e => setCount(Number(e.target.value))}><option value="1">Um mês</option><option value="3">Últimos 3 meses</option><option value="6">Últimos 6 meses</option><option value="12">Últimos 12 meses</option></select></label>
        <label>Mês final<input type="month" value=${end} onChange=${e => { if (/^\d{4}-(0[1-9]|1[0-2])$/.test(e.target.value)) setEnd(e.target.value); }} /></label>
        <button class="button secondary adm-small" onClick=${() => { setCount(1); setEnd(monthKey(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1))); }}>Mês passado</button>
        <button class="button secondary adm-small" onClick=${() => { setCount(1); setEnd(monthKey(new Date())); }}>Mês atual</button>
      </div>
      <div class="adm-stats"><div><span>${cash(total('revenue'))}</span><small>Receita de pedidos feitos</small></div><div><span>${cash(total('costs'))}</span><small>Despesas registradas</small></div><div><span class=${total('profit') < 0 ? 'fin-loss' : 'fin-gain'}>${cash(total('profit'))}</span><small>${total('profit') < 0 ? 'Prejuízo' : 'Lucro'} estimado</small></div><div><span>${total('revenue') ? (total('profit') / total('revenue') * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%' : '—'}</span><small>Margem sobre a receita</small></div></div>
      <p class="small-muted adm-hint">Receita pela data em que o pedido foi marcado como Feito (pedidos antigos usam a data de criação). Resultado = receita − despesas lançadas. Cadastre materiais, fretes, taxas e outras despesas para uma estimativa completa. Cancelados e pedidos em aberto não entram na receita.</p>
      <div class="finance-charts">${['comparison', 'profit'].map(kind => html`<div class="adm-card" key=${kind}><h4>${kind === 'profit' ? 'Lucro ou prejuízo mensal' : 'Receita × despesas'}</h4><div class="finance-bars">${rows.map(r => html`<div class="finance-bar-row" key=${r.key}><b>${r.label}</b><div>${(kind === 'profit' ? [['Resultado', r.profit, r.profit < 0 ? 'loss' : 'gain']] : [['Receita', r.revenue, 'income'], ['Despesas', r.costs, 'expense']]).map(([label, value, color]) => html`<div class="finance-bar-item" key=${label}><span>${label}: ${cash(value)}</span><div class="finance-track"><div class=${'finance-bar ' + color} style=${{ width: `${Math.abs(value) / max * 100}%` }}></div></div></div>`)}</div></div>`)}</div></div>`)}</div>
      <div class="adm-card finance-table-wrap"><h4>Resumo por mês</h4><table class="finance-table"><caption class="small-muted">Valores em reais; cancelamentos representam vendas não realizadas.</caption><thead><tr>${['Mês', 'Receita', 'Despesas', 'Lucro / prejuízo', 'Cancelados', 'Em aberto'].map(t => html`<th key=${t} scope="col">${t}</th>`)}</tr></thead><tbody>${rows.map(r => html`<tr key=${r.key}><th scope="row">${r.label}</th>${['revenue', 'costs', 'profit', 'canceled', 'pending'].map(k => html`<td key=${k} class=${k === 'profit' ? (r.profit < 0 ? 'fin-loss' : 'fin-gain') : ''}>${cash(r[k])}</td>`)}</tr>`)}</tbody></table></div>
      <form class="adm-card" onSubmit=${add}><h4>Registrar despesa</h4><div class="form-row adm-row3"><label>Mês<input type="month" required value=${month} onChange=${e => setMonth(e.target.value)} /></label><label>Descrição<input required maxlength="120" placeholder="Ex.: materiais, frete ou taxas" value=${description} onInput=${e => setDescription(e.target.value)} /></label><label>Valor (R$)<input required inputmode="decimal" placeholder="0,00" value=${amount} onInput=${e => setAmount(e.target.value)} /></label></div><p class="form-error" role="alert">${error}</p><button class="button primary adm-small" type="submit">Adicionar despesa</button></form>
      <div class="adm-card"><h4>Despesas do período</h4>${!selectedExpenses.length ? html`<p class="small-muted">Nenhuma despesa registrada neste período.</p>` : selectedExpenses.map(e => html`<div class="finance-expense" key=${e.id}><span><small>${e.month.split('-').reverse().join('/')}</small><br />${e.description}</span><strong>${cash(e.cents)}</strong><button class="link-button danger" onClick=${() => { if (window.confirm('Excluir esta despesa?')) save(readExpenses().filter(x => x.id !== e.id)); }}>Excluir</button></div>`)}</div>
    </section>`;
  }

  // ---- Produtos --------------------------------------------------------------------------------
  function ProductForm({ initial, isNew, categories, onSave, onCancel, onDelete, canRemove, say }) {
    const [f, setF] = useState(() => ({
      name: initial.name, short: initial.short === initial.name ? '' : initial.short, price: String(initial.price).replace('.', ','), extraArea: String(initial.extraArea).replace('.', ','),
      category: initial.category, detail: initial.detail, tag: initial.tag, stock: String(initial.stock), active: initial.active, shape: initial.shape, photo: initial.photo || '', colors: initial.colors || []
    }));
    const palette = S.getPalette();
    const toggleColor = hex => setF(prev => ({ ...prev, colors: prev.colors.includes(hex) ? prev.colors.filter(h => h !== hex) : [...prev.colors, hex] }));
    const changeShape = e => { const shape = e.target.value; setF(prev => ({ ...prev, shape, colors: S.SHAPES[shape].colors.filter(h => palette.some(c => c.hex === h)) })); };
    const [err, setErr] = useState(''), [confirm, setConfirm] = useState(false), [busy, setBusy] = useState(false);
    const set = k => e => setF(prev => ({ ...prev, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
    const pickPhoto = async e => {
      const file = e.target.files && e.target.files[0]; e.target.value = ''; if (!file) return;
      setBusy(true); setErr('');
      try { const url = await S.imageToDataUrl(file, 700); setF(prev => ({ ...prev, photo: url })); } catch (ex) { setErr(ex.message || 'Não foi possível abrir essa imagem.'); }
      setBusy(false);
    };
    const submit = e => {
      e.preventDefault(); setErr('');
      const name = f.name.trim(), price = toNumber(f.price), extra = toNumber(f.extraArea === '' ? '0' : f.extraArea), stock = toNumber(f.stock === '' ? '0' : f.stock);
      if (name.length < 2) return setErr('Dê um nome ao produto (pelo menos 2 letras).');
      if (!Number.isFinite(price) || price <= 0 || price > 100000) return setErr('Informe um preço maior que zero.');
      if (!Number.isFinite(extra) || extra < 0 || extra > 10000) return setErr('O valor da área extra deve ser zero ou mais.');
      if (!Number.isInteger(stock) || stock < 0 || stock > 9999) return setErr('O estoque deve ser um número inteiro, de 0 a 9999.');
      if (!categories.some(c => c.id === f.category)) return setErr('Escolha uma categoria.');
      if (!f.colors.length) return setErr('Escolha pelo menos uma cor-base para o cliente.');
      const err2 = onSave({ ...initial, name, short: f.short.trim() || name, price: Math.round(price * 100) / 100, extraArea: Math.round(extra * 100) / 100, category: f.category, detail: f.detail.trim(), tag: f.tag.trim(), stock, active: f.active, shape: f.shape, photo: f.photo, colors: f.colors });
      if (err2) setErr(err2);
    };
    return html`<form class="adm-form" onSubmit=${submit}>
      <h4>${isNew ? 'Novo produto' : 'Editar produto'}</h4>
      <div class="form-row">
        <label>Nome na vitrine<input value=${f.name} maxlength="80" onInput=${set('name')} required /></label>
        <label>Nome curto <span class="small-muted">(sacola e pedidos, opcional)</span><input value=${f.short} maxlength="60" onInput=${set('short')} placeholder=${f.name || 'Igual ao nome'} /></label>
      </div>
      <div class="form-row adm-row3">
        <label>Preço (R$)<input inputmode="decimal" value=${f.price} onInput=${set('price')} required /></label>
        <label>Cada área extra (R$)<input inputmode="decimal" value=${f.extraArea} onInput=${set('extraArea')} /></label>
        <label>Estoque<input inputmode="numeric" value=${f.stock} onInput=${set('stock')} /></label>
      </div>
      <div class="form-row">
        <label>Categoria<select value=${f.category} onChange=${set('category')}>${categories.map(c => html`<option key=${c.id} value=${c.id}>${c.label}</option>`)}</select></label>
        <label>Modelo da prévia<select value=${f.shape} onChange=${changeShape} disabled=${!isNew}>${Object.entries(S.SHAPES).map(([id, sh]) => html`<option key=${id} value=${id}>${sh.label}</option>`)}</select>
          ${!isNew && html`<span class="small-muted">O modelo não muda depois de criado.</span>`}</label>
      </div>
      <label>Descrição curta<input value=${f.detail} maxlength="120" onInput=${set('detail')} placeholder="Ex.: Algodão · frente, costas ou ombro" /></label>
      <label>Selo no cartão <span class="small-muted">(opcional)</span><input value=${f.tag} maxlength="40" onInput=${set('tag')} placeholder="Ex.: Novidade" /></label>
      <fieldset class="adm-colors"><legend>Cores-base que o cliente pode escolher</legend>
        <div class="adm-color-grid">${palette.map(c => html`<label key=${c.hex} class=${'adm-color-pick' + (f.colors.includes(c.hex) ? ' on' : '')}><input type="checkbox" checked=${f.colors.includes(c.hex)} onChange=${() => toggleColor(c.hex)} /><i style=${{ background: c.hex }}></i><span>${c.name}</span></label>`)}</div>
        <p class="small-muted">Precisa de outra cor? Cadastre na aba <a href="#cores">Cores</a>.</p>
      </fieldset>
      <div class="adm-photo">
        <span class=${'adm-thumb big' + (f.photo ? ' custom' : '')} style=${f.photo ? { '--photo': `url("${f.photo}")` } : { '--position': S.SHAPES[f.shape].position }}></span>
        <div>
          <label class="button secondary adm-small adm-file">${busy ? 'Carregando…' : 'Enviar foto do produto'}<input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" onChange=${pickPhoto} /></label>
          ${f.photo && html`<button type="button" class="link-button" onClick=${() => setF(prev => ({ ...prev, photo: '' }))}>Usar a foto padrão</button>`}
          <p class="small-muted">JPG ou PNG até 5 MB. Sem foto, a vitrine usa a imagem padrão do modelo.</p>
        </div>
      </div>
      <label class="checkbox-label"><input type="checkbox" checked=${f.active} onChange=${set('active')} /><span>Visível na loja</span></label>
      <p class="form-error" role="alert">${err}</p>
      <div class="adm-actions">
        <button class="button primary" type="submit" disabled=${busy}>${isNew ? 'Adicionar produto' : 'Salvar alterações'}</button>
        <button class="button secondary" type="button" onClick=${onCancel}>Cancelar</button>
        ${!isNew && (confirm
          ? html`<span class="adm-confirm"><button type="button" class="link-button danger" onClick=${onDelete}>Confirmar exclusão</button><button type="button" class="link-button" onClick=${() => setConfirm(false)}>Não</button></span>`
          : html`<button type="button" class="link-button danger" disabled=${!canRemove} title=${canRemove ? '' : 'A loja precisa ter pelo menos um produto visível'} onClick=${() => setConfirm(true)}>Excluir produto</button>`)}
      </div>
    </form>`;
  }

  function ProductsTab({ say }) {
    const products = S.getProducts(), categories = S.getCategories();
    const [editing, setEditing] = useState(null); // id | 'new' | null
    const records = products.map(S.toRecord);
    const persist = (list, okMsg) => {
      if (!S.saveCatalog({ categories, products: list })) { say('Não foi possível salvar. O armazenamento do navegador pode estar cheio (tente fotos menores).', 'error'); return 'Não foi possível salvar.'; }
      say(okMsg); setEditing(null); return '';
    };
    const visibleLeft = excludeId => records.some(p => p.id !== excludeId && p.active);
    const save = rec => {
      if (editing === 'new') {
        const id = uniqueId(S.slug(rec.name), new Set(records.map(p => p.id)));
        return persist([...records, { ...rec, id }], 'Produto adicionado.');
      }
      if (!rec.active && !visibleLeft(rec.id)) return 'A loja precisa ter pelo menos um produto visível.';
      return persist(records.map(p => p.id === rec.id ? rec : p), 'Produto salvo.');
    };
    const remove = id => { if (!visibleLeft(id)) return say('A loja precisa ter pelo menos um produto visível.', 'error'); persist(records.filter(p => p.id !== id), 'Produto excluído.'); };
    const blank = { id: '', shape: 'camiseta', name: '', short: '', category: categories[0].id, price: 49.9, extraArea: 8, detail: '', tag: '', stock: 20, active: true, photo: '', colors: S.SHAPES.camiseta.colors.filter(h => S.getPalette().some(c => c.hex === h)) };
    return html`<section>
      <div class="adm-toolbar">
        <p class="small-muted adm-hint grow">As mudanças aparecem na loja na hora. Pedidos antigos guardam o nome e o preço da época.</p>
        <button type="button" class="button primary adm-small" onClick=${() => setEditing('new')} disabled=${editing === 'new'}><${Icon} name="plus" /> Novo produto</button>
      </div>
      ${editing === 'new' && html`<${ProductForm} key="new" isNew=${true} initial=${blank} categories=${categories} onSave=${save} onCancel=${() => setEditing(null)} say=${say} />`}
      <div class="adm-list">
        ${products.map(p => editing === p.id
          ? html`<${ProductForm} key=${p.id} initial=${S.toRecord(p)} categories=${categories} onSave=${save} onCancel=${() => setEditing(null)} onDelete=${() => remove(p.id)} canRemove=${visibleLeft(p.id)} say=${say} />`
          : html`<article class=${'adm-row' + (p.active ? '' : ' off')} key=${p.id}>
              <span class=${'adm-thumb' + (p.photo ? ' custom' : '')} style=${p.photo ? { '--photo': `url("${p.photo}")` } : { '--position': p.position }}></span>
              <div class="adm-row-main"><h4>${p.name}</h4><p class="small-muted">${p.label} · ${S.SHAPES[p.shape].label} · estoque ${p.stock}${p.active ? '' : ' · oculto na loja'}</p></div>
              <strong>${money(p.price)}</strong>
              <button type="button" class="button secondary adm-small" onClick=${() => setEditing(p.id)}><${Icon} name="edit" /> Editar</button>
            </article>`)}
      </div>
    </section>`;
  }

  // ---- Categorias ------------------------------------------------------------------------------
  function CategoryRow({ cat, used, onRename, onDelete }) {
    const [label, setLabel] = useState(cat.label), [confirm, setConfirm] = useState(false);
    useEffect(() => setLabel(cat.label), [cat.label]);
    return html`<article class="adm-row">
      <div class="adm-row-main">
        <input value=${label} maxlength="30" aria-label=${'Nome da categoria ' + cat.label} onInput=${e => setLabel(e.target.value)} onKeyDown=${e => { if (e.key === 'Enter') { e.preventDefault(); onRename(cat.id, label); } }} />
        <p class="small-muted">${used} ${used === 1 ? 'produto' : 'produtos'}</p>
      </div>
      <button type="button" class="button secondary adm-small" onClick=${() => onRename(cat.id, label)} disabled=${label.trim() === cat.label}>Salvar nome</button>
      ${confirm
        ? html`<span class="adm-confirm"><button type="button" class="link-button danger" onClick=${() => onDelete(cat.id)}>Confirmar</button><button type="button" class="link-button" onClick=${() => setConfirm(false)}>Não</button></span>`
        : html`<button type="button" class="icon-button" aria-label=${'Excluir categoria ' + cat.label} title=${used ? 'Mova ou exclua os produtos desta categoria primeiro' : 'Excluir categoria'} disabled=${used > 0} onClick=${() => setConfirm(true)}><${Icon} name="trash" /></button>`}
    </article>`;
  }

  function CategoriesTab({ say }) {
    const categories = S.getCategories(), products = S.getProducts();
    const [name, setName] = useState('');
    const persist = (list, msg) => { if (S.saveCatalog({ categories: list, products: products.map(S.toRecord) })) { say(msg); return true; } say('Não foi possível salvar.', 'error'); return false; };
    const clash = (label, exceptId) => categories.some(c => c.id !== exceptId && c.label.toLowerCase() === label.toLowerCase());
    const add = e => {
      e.preventDefault(); const label = name.trim();
      if (label.length < 2) return say('Dê um nome à categoria (pelo menos 2 letras).', 'error');
      if (clash(label)) return say('Já existe uma categoria com esse nome.', 'error');
      const id = uniqueId(S.slug(label), new Set([...categories.map(c => c.id), 'todos']));
      if (persist([...categories, { id, label }], 'Categoria adicionada.')) setName('');
    };
    const rename = (id, raw) => {
      const label = raw.trim();
      if (label.length < 2) return say('O nome precisa ter pelo menos 2 letras.', 'error');
      if (clash(label, id)) return say('Já existe uma categoria com esse nome.', 'error');
      persist(categories.map(c => c.id === id ? { ...c, label } : c), 'Nome atualizado.');
    };
    const remove = id => {
      if (categories.length <= 1) return say('Mantenha pelo menos uma categoria.', 'error');
      persist(categories.filter(c => c.id !== id), 'Categoria excluída.');
    };
    return html`<section>
      <p class="small-muted adm-hint">As categorias viram os filtros da vitrine. Categorias sem produtos visíveis não aparecem para o cliente.</p>
      <form class="adm-add" onSubmit=${add}>
        <input value=${name} maxlength="30" placeholder="Nova categoria (ex.: Almofadas)" aria-label="Nome da nova categoria" onInput=${e => setName(e.target.value)} />
        <button class="button primary adm-small" type="submit"><${Icon} name="plus" /> Adicionar</button>
      </form>
      <div class="adm-list">
        ${categories.map(c => html`<${CategoryRow} key=${c.id} cat=${c} used=${products.filter(p => p.category === c.id).length} onRename=${rename} onDelete=${remove} />`)}
      </div>
    </section>`;
  }

  // ---- Cores -----------------------------------------------------------------------------------
  function ColorRow({ color, used, onRename, onDelete, canRemove }) {
    const [name, setName] = useState(color.name), [confirm, setConfirm] = useState(false);
    useEffect(() => setName(color.name), [color.name]);
    return html`<article class="adm-row">
      <span class="adm-swatch" style=${{ background: color.hex }}></span>
      <div class="adm-row-main">
        <input value=${name} maxlength="24" aria-label=${'Nome da cor ' + color.name} onInput=${e => setName(e.target.value)} onKeyDown=${e => { if (e.key === 'Enter') { e.preventDefault(); onRename(color.hex, name); } }} />
        <p class="small-muted">${color.hex.toUpperCase()} · usada em ${used} ${used === 1 ? 'produto' : 'produtos'}</p>
      </div>
      <button type="button" class="button secondary adm-small" onClick=${() => onRename(color.hex, name)} disabled=${name.trim() === color.name}>Salvar nome</button>
      ${confirm
        ? html`<span class="adm-confirm"><button type="button" class="link-button danger" onClick=${() => onDelete(color.hex)}>Confirmar</button><button type="button" class="link-button" onClick=${() => setConfirm(false)}>Não</button></span>`
        : html`<button type="button" class="icon-button" aria-label=${'Excluir cor ' + color.name} title=${canRemove ? 'Excluir cor' : 'Mantenha pelo menos uma cor'} disabled=${!canRemove} onClick=${() => setConfirm(true)}><${Icon} name="trash" /></button>`}
    </article>`;
  }

  function ColorsTab({ say }) {
    const palette = S.getPalette(), categories = S.getCategories(), products = S.getProducts();
    const [hex, setHex] = useState('#d9a5b5'), [name, setName] = useState(''), [toAll, setToAll] = useState(true);
    const persist = (pal, recs, msg) => { if (S.saveCatalog({ categories, products: recs, palette: pal })) { say(msg); return true; } say('Não foi possível salvar.', 'error'); return false; };
    const records = () => products.map(S.toRecord);
    const add = e => {
      e.preventDefault(); const label = name.trim(), h = hex.toLowerCase();
      if (!S.HEX.test(h)) return say('Escolha uma cor válida.', 'error');
      if (label.length < 2) return say('Dê um nome à cor (pelo menos 2 letras).', 'error');
      if (palette.some(c => c.hex === h)) return say('Essa cor já está na paleta.', 'error');
      if (palette.some(c => c.name.toLowerCase() === label.toLowerCase())) return say('Já existe uma cor com esse nome.', 'error');
      if (palette.length >= S.MAX_PALETTE) return say('A paleta chegou ao limite de ' + S.MAX_PALETTE + ' cores.', 'error');
      const recs = records().map(p => toAll ? { ...p, colors: [...p.colors, h] } : p);
      if (persist([...palette, { hex: h, name: label }], recs, 'Cor adicionada.')) setName('');
    };
    const rename = (h, raw) => {
      const label = raw.trim();
      if (label.length < 2) return say('O nome precisa ter pelo menos 2 letras.', 'error');
      if (palette.some(c => c.hex !== h && c.name.toLowerCase() === label.toLowerCase())) return say('Já existe uma cor com esse nome.', 'error');
      persist(palette.map(c => c.hex === h ? { ...c, name: label } : c), records(), 'Nome atualizado.');
    };
    const remove = h => {
      if (palette.length <= 1) return say('Mantenha pelo menos uma cor.', 'error');
      persist(palette.filter(c => c.hex !== h), records(), 'Cor excluída.');
    };
    return html`<section>
      <p class="small-muted adm-hint">Estas são as cores-base de camisetas, canecas, ecobags e moletons. Cada produto escolhe quais delas oferecer (aba Produtos). Pedidos antigos continuam mostrando a cor da época.</p>
      <form class="adm-form adm-color-form" onSubmit=${add}>
        <h4>Nova cor</h4>
        <div class="adm-add">
          <input type="color" value=${hex} onInput=${e => setHex(e.target.value)} aria-label="Escolher a cor" class="adm-colorinput" />
          <input value=${name} maxlength="24" placeholder="Nome da cor (ex.: Terracota)" aria-label="Nome da nova cor" onInput=${e => setName(e.target.value)} />
          <button class="button primary adm-small" type="submit"><${Icon} name="plus" /> Adicionar</button>
        </div>
        <label class="checkbox-label"><input type="checkbox" checked=${toAll} onChange=${e => setToAll(e.target.checked)} /><span>Oferecer esta cor em todos os produtos</span></label>
      </form>
      <div class="adm-list">
        ${palette.map(c => html`<${ColorRow} key=${c.hex} color=${c} used=${products.filter(p => p.colors.includes(c.hex)).length} onRename=${rename} onDelete=${remove} canRemove=${palette.length > 1} />`)}
      </div>
    </section>`;
  }

  // ---- Configurações ---------------------------------------------------------------------------
  function SettingsTab({ say }) {
    const [cur, setCur] = useState(''), [n1, setN1] = useState(''), [n2, setN2] = useState(''), [err, setErr] = useState(''), [confirmReset, setConfirmReset] = useState(false);
    const fileRef = useRef(null);
    const changePw = async e => {
      e.preventDefault(); setErr('');
      if (n1 !== n2) return setErr('As senhas novas não conferem.');
      const res = await Auth.changePassword(cur, n1);
      if (!res.ok) return setErr(res.message);
      setCur(''); setN1(''); setN2(''); say('Senha alterada.');
    };
    const backup = () => {
      const data = { app: 'gotas-de-amor', version: 1, exportedAt: new Date().toISOString(), catalog: { categories: S.getCategories(), products: S.getProducts().map(S.toRecord), palette: S.getPalette() }, orders: S.getOrders(), expenses: readExpenses() };
      download(`backup-gotas-de-amor-${todayISO()}.json`, JSON.stringify(data), 'application/json');
    };
    const restore = async e => {
      const file = e.target.files && e.target.files[0]; e.target.value = ''; if (!file) return;
      if (file.size > 8 * 1024 * 1024) return say('Arquivo grande demais para ser um backup desta loja.', 'error');
      try {
        const data = JSON.parse(await file.text());
        if (!data || data.app !== 'gotas-de-amor' || !data.catalog) throw new Error('formato');
        const orders = S.normalizeOrders(data.orders);
        if (data.expenses !== undefined) {
          if (!Array.isArray(data.expenses) || !data.expenses.every(validExpense)) throw new Error('despesas inválidas');
          localStorage.setItem(EXPENSES_KEY, JSON.stringify(data.expenses));
        }
        if (!S.saveCatalog(data.catalog) || !S.saveOrders(orders)) return say('Não foi possível salvar o backup.', 'error');
        say(`Backup restaurado: ${S.getProducts().length} produtos e ${orders.length} pedidos.`);
      } catch { say('Esse arquivo não parece ser um backup desta loja.', 'error'); }
    };
    const reset = () => { if (S.saveCatalog(S.defaults())) { say('Catálogo restaurado para o padrão.'); setConfirmReset(false); } else say('Não foi possível salvar.', 'error'); };
    return html`<section class="adm-settings">
      <form class="adm-card" onSubmit=${changePw}>
        <h4>Alterar senha</h4>
        <p class="small-muted">Conta do administrador: ${(Auth.current() || {}).email}.${Auth.testLoginEnabled ? ' O botão de teste do login só funciona com a senha padrão.' : ''}</p>
        <label>Senha atual<input type="password" autocomplete="current-password" value=${cur} onInput=${e => setCur(e.target.value)} required /></label>
        <div class="form-row">
          <label>Nova senha<input type="password" autocomplete="new-password" value=${n1} onInput=${e => setN1(e.target.value)} required /></label>
          <label>Repita a nova senha<input type="password" autocomplete="new-password" value=${n2} onInput=${e => setN2(e.target.value)} required /></label>
        </div>
        <p class="form-error" role="alert">${err}</p>
        <button class="button primary adm-small" type="submit">Salvar senha</button>
      </form>
      <div class="adm-card">
        <h4>Backup</h4>
        <p class="small-muted">Os dados ficam só neste navegador. Baixe um backup para guardar ou levar para outro aparelho (inclui catálogo, pedidos e despesas).</p>
        <div class="adm-actions">
          <button type="button" class="button secondary adm-small" onClick=${backup}>Baixar backup</button>
          <button type="button" class="button secondary adm-small" onClick=${() => fileRef.current && fileRef.current.click()}>Restaurar de um arquivo</button>
          <input ref=${fileRef} type="file" accept=".json,application/json" hidden onChange=${restore} />
        </div>
        <p class="small-muted">Restaurar substitui catálogo e pedidos; despesas são substituídas quando incluídas no arquivo.</p>
      </div>
      <div class="adm-card">
        <h4>Catálogo padrão</h4>
        <p class="small-muted">Volta produtos e categorias ao que veio de fábrica. Os pedidos não são apagados.</p>
        ${confirmReset
          ? html`<span class="adm-confirm"><button type="button" class="link-button danger" onClick=${reset}>Sim, restaurar</button><button type="button" class="link-button" onClick=${() => setConfirmReset(false)}>Não</button></span>`
          : html`<button type="button" class="button secondary adm-small" onClick=${() => setConfirmReset(true)}>Restaurar catálogo padrão</button>`}
      </div>
    </section>`;
  }

  // ---- Painel ----------------------------------------------------------------------------------
  const TABS = [['orders', 'Pedidos', 'package', 'pedidos'], ['finance', 'Financeiro', 'card', 'financeiro'], ['products', 'Produtos', 'bag', 'produtos'], ['categories', 'Categorias', 'palette', 'categorias'], ['colors', 'Cores', 'sparkles', 'cores'], ['settings', 'Configurações', 'info', 'configuracoes']];
  const tabFromHash = () => (TABS.find(t => '#' + t[3] === location.hash) || TABS[0])[0];

  function AdminApp() {
    useStoreVersion();
    const [user, setUser] = useState(() => Auth.current());
    const [tab, setTab] = useState(tabFromHash);
    const [notice, setNotice] = useState(null);
    const timer = useRef(0);
    const say = useCallback((text, kind = 'ok') => { setNotice({ text, kind }); clearTimeout(timer.current); timer.current = setTimeout(() => setNotice(null), 5000); }, []);
    const isAdmin = !!user && user.role === 'admin';

    // Se o login sumir (saiu em outra aba, sessão expirou), o painel fecha sozinho.
    useEffect(() => {
      const same = (a, b) => a === b || (a && b && a.id === b.id && a.role === b.role);
      const check = () => setUser(prev => { const now = Auth.current(); return same(prev, now) ? prev : now; });
      const off = Auth.subscribe(check), timerId = setInterval(check, 30000);
      return () => { off(); clearInterval(timerId); };
    }, []);
    useEffect(() => { if (!isAdmin) location.replace('index.html?entrar=admin'); }, [isAdmin]);
    useEffect(() => { const onHash = () => setTab(tabFromHash()); window.addEventListener('hashchange', onHash); return () => window.removeEventListener('hashchange', onHash); }, []);

    if (!isAdmin) return html`<p class="adm-gate" role="status">Verificando acesso…</p>`;
    const go = id => { setTab(id); try { history.replaceState(null, '', '#' + TABS.find(t => t[0] === id)[3]); } catch { /* ignora */ } };
    const leave = () => { Auth.logout(); location.href = 'index.html'; };
    const body = tab === 'finance' ? html`<${FinanceTab} say=${say} />` : tab === 'orders' ? html`<${OrdersTab} say=${say} />` : tab === 'products' ? html`<${ProductsTab} say=${say} />` : tab === 'categories' ? html`<${CategoriesTab} say=${say} />` : tab === 'colors' ? html`<${ColorsTab} say=${say} />` : html`<${SettingsTab} say=${say} />`;
    return html`<div class="admin-page">
      <header class="admin-topbar">
        <a class="admin-brand" href="index.html" aria-label="Voltar para a loja"><img src="assets/logo-original.jpg" alt="" width="44" height="44" /><span><b>Painel da loja</b><small>Área restrita ao administrador</small></span></a>
        <div class="adm-head-actions">
          <span class="adm-user">${user.name}</span>
          <a class="link-button" href="index.html"><${Icon} name="eye" /> Ver a loja</a>
          <button type="button" class="link-button" onClick=${leave}><${Icon} name="logout" /> Sair</button>
        </div>
      </header>
      <div class="adm-shell">
        <nav class="adm-tabs" aria-label="Seções do painel">
          ${TABS.map(([id, label, ic]) => html`<button type="button" key=${id} aria-current=${tab === id ? 'page' : undefined} onClick=${() => go(id)}><${Icon} name=${ic} /> ${label}</button>`)}
        </nav>
        <div class="adm-notice" role="status" aria-live="polite">${notice && html`<p class=${'adm-msg ' + notice.kind}>${notice.text}</p>`}</div>
        <div class="adm-content">${body}</div>
      </div>
    </div>`;
  }

  const mount = document.getElementById('admin-root');
  mount.textContent = '';
  ReactDOM.createRoot(mount).render(html`<${AdminApp} />`);
})();
