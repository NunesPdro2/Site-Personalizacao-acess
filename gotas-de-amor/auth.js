'use strict';
// Contas da loja: clientes e administrador. Usado pela loja (index.html) e pelo painel (admin.html).
//
// COMO FUNCIONA
//  - Cliente: cria a conta na própria loja ("Criar conta") e depois entra com e-mail e senha.
//  - Administrador: existe uma conta de administrador, criada automaticamente na primeira visita.
//    Só ela abre o painel (admin.html) e altera produtos, categorias e pedidos.
//  - Contas e sessão ficam salvas no navegador (localStorage). As senhas são guardadas com hash
//    (PBKDF2 + sal), nunca em texto puro.
//
// BOTÃO DE TESTE
//  Enquanto SHOW_TEST_LOGIN for true, a tela de login mostra o botão "Preencher como administrador",
//  que digita o e-mail e a senha de teste abaixo. Antes de publicar a loja de verdade:
//  troque para false e mude a senha do administrador no painel (Configurações).
//
// LIMITE IMPORTANTE
//  Como o site é estático (sem servidor), toda a conferência acontece no navegador. Isso serve para
//  separar cliente e administrador na rotina da loja, mas não impede alguém com conhecimento técnico
//  de mexer nos dados do próprio navegador. Para proteção real é preciso login em um servidor.
(() => {
  const SHOW_TEST_LOGIN = true;
  const TEST_ADMIN = Object.freeze({ name: 'Administrador', email: 'admin@gotasdeamor.com', password: 'admin123' });

  const TEST_CLIENT = Object.freeze({ name: 'Cliente teste', email: 'cliente@gotasdeamor.com', password: 'cliente123' });
  const USERS_KEY = 'gotas-users-v1';
  const SESSION_KEY = 'gotas-session-v1';
  const SESSION_HOURS = { admin: 12, client: 24 * 30 };
  const enc = new TextEncoder();
  const listeners = new Set();

  // ---- Senha ---------------------------------------------------------------------------------
  const toHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  const randomHex = n => { const a = new Uint8Array(n); crypto.getRandomValues(a); return toHex(a); };
  const hasSubtle = () => !!(window.crypto && crypto.subtle);
  async function hashPassword(pw, salt, algo) {
    if (algo === 'pbkdf2' && hasSubtle()) {
      const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
      return toHex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 120000 }, key, 256));
    }
    // Reserva para quando o arquivo é aberto direto do disco (sem crypto.subtle). Mais fraca.
    let h = 0x811c9dc5; const text = salt + pw;
    for (let r = 0; r < 2000; r++) for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return 'w' + h.toString(16);
  }
  async function makeCredential(pw) {
    const algo = hasSubtle() ? 'pbkdf2' : 'weak', salt = randomHex(16);
    return { salt, hash: await hashPassword(pw, salt, algo), algo };
  }

  // ---- Armazenamento -------------------------------------------------------------------------
  const readUsers = () => {
    try {
      const list = JSON.parse(localStorage.getItem(USERS_KEY));
      return Array.isArray(list) ? list.filter(u => u && u.id && u.email && u.salt && u.hash && (u.role === 'admin' || u.role === 'client')) : [];
    } catch { return []; }
  };
  const writeUsers = list => { try { localStorage.setItem(USERS_KEY, JSON.stringify(list)); return true; } catch { return false; } };
  const publicUser = u => ({ id: u.id, name: u.name, email: u.email, role: u.role });
  const normEmail = v => String(v || '').trim().toLowerCase();
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Sessão atual (lida sempre do armazenamento, junto com a conta: o papel vem da conta, não da sessão).
  function current() {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY));
      if (!s || !s.id || !(s.exp > Date.now())) return null;
      const u = readUsers().find(x => x.id === s.id);
      return u ? publicUser(u) : null;
    } catch { return null; }
  }
  function startSession(u) {
    const hours = SESSION_HOURS[u.role] || 12;
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ id: u.id, exp: Date.now() + hours * 3600 * 1000 })); } catch { return false; }
    emit(); return true;
  }
  function emit() { const u = current(); listeners.forEach(fn => { try { fn(u); } catch { /* um ouvinte com erro não derruba os outros */ } }); }
  // Entrar ou sair em outra aba também vale aqui (o painel fecha sozinho se o login sumir).
  window.addEventListener('storage', e => { if (e.key === SESSION_KEY || e.key === USERS_KEY) emit(); });

  // ---- Conta de administrador (criada na primeira visita) ------------------------------------
  let seeding = null;
  function ensureAdmin() {
    if (!seeding) seeding = (async () => {
      if (readUsers().some(u => u.role === 'admin')) return;
      const cred = await makeCredential(TEST_ADMIN.password);
      const fresh = readUsers();
      if (fresh.some(u => u.role === 'admin')) return; // outra aba criou enquanto calculávamos
      writeUsers([...fresh, { id: 'u-' + randomHex(8), name: TEST_ADMIN.name, email: TEST_ADMIN.email, role: 'admin', createdAt: new Date().toISOString(), ...cred }]);
    })().catch(() => { seeding = null; });
    return seeding;
  }

  let clientSeeding;
  async function ensureTestClient() {
    if (!SHOW_TEST_LOGIN) return;
    await ensureAdmin();
    if (!clientSeeding) clientSeeding = (async () => {
      if (readUsers().some(u => u.email === TEST_CLIENT.email)) return;
      const cred = await makeCredential(TEST_CLIENT.password);
      const users = readUsers();
      if (!users.some(u => u.email === TEST_CLIENT.email) && !writeUsers([...users, {
        id: 'u-' + randomHex(8), name: TEST_CLIENT.name, email: TEST_CLIENT.email,
        role: 'client', createdAt: new Date().toISOString(), ...cred
      }])) throw new Error('Não foi possível criar a conta teste.');
    })().catch(error => { clientSeeding = null; throw error; });
    return clientSeeding;
  }

  // ---- Ações ---------------------------------------------------------------------------------
  const fail = message => ({ ok: false, message });
  let failures = 0, lockUntil = 0;

  async function login(email, password) {
    await ensureAdmin();
    const wait = lockUntil - Date.now();
    if (wait > 0) return fail(`Muitas tentativas. Aguarde ${Math.ceil(wait / 1000)} s para tentar de novo.`);
    const user = readUsers().find(u => u.email === normEmail(email));
    let ok = false;
    try { ok = user ? (await hashPassword(String(password || ''), user.salt, user.algo)) === user.hash : (await hashPassword('x', 'x', 'pbkdf2'), false); }
    catch { return fail('O navegador não conseguiu conferir a senha.'); }
    if (!ok) {
      if (++failures >= 5) { lockUntil = Date.now() + 30000; failures = 0; }
      return fail('E-mail ou senha incorretos.');
    }
    failures = 0;
    if (!startSession(user)) return fail('O navegador não conseguiu salvar o login. Verifique se ele permite armazenamento do site.');
    return { ok: true, user: publicUser(user) };
  }

  async function register({ name, email, password }) {
    await ensureAdmin();
    const cleanName = String(name || '').trim().replace(/\s+/g, ' ');
    const mail = normEmail(email);
    if (cleanName.length < 2 || cleanName.length > 80) return fail('Informe seu nome (de 2 a 80 letras).');
    if (!EMAIL_RE.test(mail) || mail.length > 100) return fail('Informe um e-mail válido.');
    if (String(password || '').length < 6) return fail('A senha precisa ter pelo menos 6 caracteres.');
    const users = readUsers();
    if (users.some(u => u.email === mail)) return fail('Já existe uma conta com esse e-mail. Tente entrar.');
    let cred;
    try { cred = await makeCredential(String(password)); } catch { return fail('O navegador não conseguiu proteger a senha.'); }
    const user = { id: 'u-' + randomHex(8), name: cleanName, email: mail, role: 'client', createdAt: new Date().toISOString(), ...cred };
    if (!writeUsers([...readUsers(), user])) return fail('O navegador não conseguiu salvar a conta. Verifique se ele permite armazenamento do site.');
    if (!startSession(user)) return fail('Conta criada, mas não foi possível entrar. Tente fazer login.');
    return { ok: true, user: publicUser(user) };
  }

  function logout() { try { localStorage.removeItem(SESSION_KEY); } catch { /* ignora */ } emit(); }

  async function changePassword(currentPw, newPw) {
    const me = current(); if (!me) return fail('Entre na sua conta primeiro.');
    const users = readUsers(), user = users.find(u => u.id === me.id);
    if (!user || (await hashPassword(String(currentPw || ''), user.salt, user.algo)) !== user.hash) return fail('A senha atual não confere.');
    if (String(newPw || '').length < 6) return fail('A nova senha precisa ter pelo menos 6 caracteres.');
    Object.assign(user, await makeCredential(String(newPw)));
    return writeUsers(users) ? { ok: true } : fail('O navegador não conseguiu salvar a nova senha.');
  }

  window.GotasAuth = {
    ready: ensureAdmin(),
    current,
    isAdmin: () => { const u = current(); return !!u && u.role === 'admin'; },
    login, register, logout, changePassword,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    testLoginEnabled: SHOW_TEST_LOGIN,
    ensureTestClient,
    testClient: SHOW_TEST_LOGIN ? { email: TEST_CLIENT.email, password: TEST_CLIENT.password } : null,
    testAdmin: SHOW_TEST_LOGIN ? { email: TEST_ADMIN.email, password: TEST_ADMIN.password } : null
  };
})();
