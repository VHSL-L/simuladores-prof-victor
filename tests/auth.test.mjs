import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import worker, { normalizeEmail, safeNext } from '../dist/_worker.js';

function database() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync('migrations/0001_auth.sql', 'utf8'));
  function prepare(query) {
    let values = [];
    return {
      bind(...args) { values = args; return this; },
      async first() { return sql.prepare(query).get(...values) ?? null; },
      async run() { return sql.prepare(query).run(...values); },
    };
  }
  return { sql, prepare, async batch(statements) {
    sql.exec('BEGIN');
    try { const out = []; for (const statement of statements) out.push(await statement.run()); sql.exec('COMMIT'); return out; }
    catch (error) { sql.exec('ROLLBACK'); throw error; }
  } };
}
function setup(t) {
  const db = database(); const mail = []; const jobs = [];
  t.after(async () => { await Promise.allSettled(jobs); db.sql.close(); });
  const env = { AUTH_DB: db, AUTH_SECRET: 'test-secret-that-is-at-least-32-characters-long', RESEND_API_KEY: 'test-key', AUTH_EMAIL_FROM: 'test@example.invalid',
    ASSETS: { fetch: async () => new Response('asset served') } };
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails');
    mail.push(JSON.parse(options.body));
    return new Response('{}', { status: 200 });
  });
  const request = (path, body, headers = {}, overrides = {}) => worker.fetch(new Request(`https://test.invalid${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Origin: 'https://test.invalid', 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1', ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }), { ...env, ...overrides }, { waitUntil: job => jobs.push(job) });
  const code = () => mail.at(-1).text.match(/\b\d{6}\b/)[0];
  const email = 'aluno@aluno.unc.br';
  async function login() {
    assert.equal((await request('/api/auth/send-code', { email })).status, 200);
    const response = await request('/api/auth/verify-code', { email, code: code(), next: '/rcp' });
    assert.equal(response.status, 200);
    return response.headers.get('Set-Cookie');
  }
  return { db, env, mail, request, code, email, login };
}

test('domínio exato e redirecionamento local', () => {
  assert.equal(normalizeEmail(' Aluno.Silva@ALUNO.UNC.BR '), 'aluno.silva@aluno.unc.br');
  for (const input of ['a@unc.br', 'a@aluno.unc.br.evil.com', 'a@sub.aluno.unc.br', 'a@aluno.unc.br\nBcc:x', 'a@@aluno.unc.br', 'a@aluno.unc.br.', '.a@aluno.unc.br', null]) assert.equal(normalizeEmail(input), null);
  for (const input of ['//evil.com', 'https://evil.com', '/\\evil.com', '/rcp?next=evil', null]) assert.equal(safeNext(input), '/');
});

test('site público abre; todas as entradas e arquivos dos simuladores exigem sessão', async t => {
  const { request } = setup(t);
  for (const path of ['/', '/sobre', '/entrar', '/privacidade', '/favicon.svg']) assert.equal((await request(path)).status, 200, path);
  const paths = ['/rcp', '/choque/', '/ventilacao-mecanica', '/simulators/rcp/index.html', '/simulators/choque/', '/simulators/ventilacao-mecanica/index.html', '/simulators%2frcp%2findex.html', '/%73imulators/rcp/index.html', '/assets/unknown.js.map'];
  for (const file of readdirSync('dist/assets')) if (/^(choque|ventilacao)-/.test(file)) paths.push('/assets/' + file);
  for (const path of paths) {
    const response = await request(path);
    assert.equal(response.status, 303, path);
    assert.ok(response.headers.get('Location').startsWith('/entrar?next='));
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  }
  const routes = JSON.parse(readFileSync('dist/_routes.json', 'utf8'));
  assert.deepEqual(routes, { version: 1, include: ['/*'], exclude: [] });
});

test('código, cookie seguro, sessão, arquivos privados e saída', async t => {
  const { request, login, mail, db, email } = setup(t);
  const session = await login();
  assert.match(session, /__Host-simuladores_session=[a-f0-9]{64}; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800/);
  assert.deepEqual(mail[0].to, [email]);
  const headers = { Cookie: session };
  assert.equal((await request('/simulators/rcp/index.html', undefined, headers)).status, 200);
  assert.equal((await (await request('/api/auth/session', undefined, headers)).json()).user.email, email);
  assert.equal(db.sql.prepare('SELECT count(*) n FROM login_codes').get().n, 0);
  assert.notEqual(db.sql.prepare('SELECT token_hash FROM sessions').get().token_hash, session.split('=')[1].split(';')[0]);
  const logout = await request('/api/auth/logout', {}, headers);
  assert.match(logout.headers.get('Set-Cookie'), /Max-Age=0/);
  assert.equal((await request('/rcp', undefined, headers)).status, 303);
});

test('código só pode ser consumido uma vez, mesmo com requisições concorrentes', async t => {
  const { request, email, code } = setup(t);
  await request('/api/auth/send-code', { email });
  const body = { email, code: code() };
  const result = await Promise.all([request('/api/auth/verify-code', body), request('/api/auth/verify-code', body)]);
  assert.deepEqual(result.map(r => r.status).sort(), [200, 400]);
  assert.equal((await request('/api/auth/verify-code', body)).status, 400);
});

test('código expira e fica bloqueado após cinco erros', async t => {
  const { request, email, code, db } = setup(t);
  await request('/api/auth/send-code', { email });
  const goodCode = code(); const badCode = goodCode === '000000' ? '111111' : '000000';
  for (let i = 0; i < 5; i++) assert.equal((await request('/api/auth/verify-code', { email, code: badCode })).status, 400);
  assert.equal((await request('/api/auth/verify-code', { email, code: goodCode })).status, 400);
  db.sql.prepare('UPDATE login_codes SET attempts=0, expires_at=0').run();
  assert.equal((await request('/api/auth/verify-code', { email, code: goodCode })).status, 400);
});

test('reenvio respeita intervalo, invalida código anterior e limita volume', async t => {
  const { request, email, code, db, mail } = setup(t);
  await request('/api/auth/send-code', { email }); const oldCode = code();
  assert.equal((await request('/api/auth/send-code', { email })).status, 429);
  db.sql.prepare('UPDATE login_codes SET sent_at=0').run();
  assert.equal((await request('/api/auth/send-code', { email })).status, 200);
  if (oldCode !== code()) assert.equal((await request('/api/auth/verify-code', { email, code: oldCode })).status, 400);
  for (let i = 0; i < 4; i++) { db.sql.prepare('UPDATE login_codes SET sent_at=0').run(); await request('/api/auth/send-code', { email }); }
  assert.equal((await request('/api/auth/send-code', { email })).status, 429);
  assert.ok(mail.length <= 5);
});

test('não envia a domínios externos nem aceita requisições de outra origem', async t => {
  const { request, mail, email } = setup(t);
  assert.equal((await request('/api/auth/send-code', { email: 'aluno@gmail.com' })).status, 400);
  assert.equal((await request('/api/auth/send-code', { email }, { Origin: 'https://evil.invalid' })).status, 403);
  assert.equal((await request('/api/auth/logout', {}, { Origin: 'null' })).status, 403);
  assert.equal(mail.length, 0);
});

test('erro no envio não informa sucesso nem deixa código utilizável', async t => {
  const { request, email, db } = setup(t);
  t.mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 429 }));
  assert.equal((await request('/api/auth/send-code', { email })).status, 503);
  assert.equal(db.sql.prepare('SELECT count(*) n FROM login_codes').get().n, 0);
});

test('sessão expirada, adulterada ou conta bloqueada não abre simulador', async t => {
  const { request, login, db } = setup(t);
  const Cookie = await login();
  assert.equal((await request('/rcp', undefined, { Cookie: '__Host-simuladores_session=' + 'a'.repeat(64) })).status, 303);
  db.sql.prepare("UPDATE users SET status='blocked'").run();
  assert.equal((await request('/rcp', undefined, { Cookie })).status, 303);
  db.sql.prepare("UPDATE users SET status='active'").run();
  db.sql.prepare('UPDATE sessions SET expires_at=0').run();
  assert.equal((await request('/rcp', undefined, { Cookie })).status, 303);
});

test('não libera planos pagos sem a futura integração e não confia em campos do cliente', async t => {
  const { request, email, login, db } = setup(t);
  const Cookie = await login();
  db.sql.prepare("UPDATE users SET access_kind='paid'").run();
  assert.equal((await request('/rcp', undefined, { Cookie })).status, 303);
  assert.equal((await request('/api/auth/send-code', { email: 'x@other.com', accessKind: 'unc', paid: true })).status, 400);
});

test('falta de configuração ou banco não cria bypass', async t => {
  const { request, email } = setup(t);
  assert.equal((await request('/api/auth/send-code', { email }, {}, { AUTH_SECRET: '' })).status, 503);
  assert.equal((await request('/rcp', undefined, {}, { AUTH_DB: undefined })).status, 303);
  assert.equal((await (await request('/api/auth/session', undefined, {}, { AUTH_DB: undefined })).json()).available, false);
});
