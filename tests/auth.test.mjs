import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import worker, { normalizeEmail, safeNext } from '../dist/_worker.js';

const { privateKey, publicKey } = await generateKeyPair('RS256');
const publicJwk = { ...await exportJWK(publicKey), kid: 'test-key', alg: 'RS256', use: 'sig' };
const clientId = '123456-test.apps.googleusercontent.com';
const email = 'aluno@aluno.unc.br';
function database() {
  const sql = new DatabaseSync(':memory:');
  for (const migration of readdirSync('migrations').sort()) sql.exec(readFileSync('migrations/' + migration, 'utf8'));
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
  const db = database(); const jobs = [];
  t.after(async () => { await Promise.allSettled(jobs); db.sql.close(); });
  const env = { AUTH_DB: db, GOOGLE_CLIENT_ID: clientId, ASSETS: { fetch: async () => new Response('asset served') } };
  t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(String(url), 'https://www.googleapis.com/oauth2/v3/certs');
    return new Response(JSON.stringify({ keys: [publicJwk] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  const request = (path, body, headers = {}, overrides = {}) => worker.fetch(new Request(`https://test.invalid${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Origin: 'https://test.invalid', 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1', ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }), { ...env, ...overrides }, { waitUntil: job => jobs.push(job) });
  async function start(headers = {}) {
    const response = await request('/api/auth/google/start', {}, headers);
    assert.equal(response.status, 200);
    return { ...await response.json(), Cookie: response.headers.getSetCookie()[0].split(';')[0] };
  }
  async function token(nonce, overrides = {}, key = privateKey) {
    const now = Math.floor(Date.now() / 1000);
    return new SignJWT({ sub: 'google-stable-student-1', email, email_verified: true, hd: 'aluno.unc.br', nonce,
      iss: 'https://accounts.google.com', aud: clientId, iat: now, exp: now + 3600, ...overrides,
    }).setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).sign(key);
  }
  async function login(overrides = {}, oldCookie = '') {
    const challenge = await start();
    const credential = await token(challenge.nonce, overrides);
    const response = await request('/api/auth/google/verify', { credential, next: '/rcp' }, { Cookie: `${challenge.Cookie}; ${oldCookie}` });
    assert.equal(response.status, 200, await response.clone().text());
    assert.equal((await response.json()).next, '/rcp');
    return response.headers.getSetCookie().find(c => c.startsWith('__Host-simuladores_session='));
  }
  return { db, env, request, start, token, login };
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
  assert.deepEqual(JSON.parse(readFileSync('dist/_routes.json', 'utf8')), { version: 1, include: ['/*'], exclude: [] });
});

test('conta Google verificada cria cookie seguro e sessão; saída revoga acesso', async t => {
  const { request, login, db } = setup(t);
  const Cookie = await login();
  assert.match(Cookie, /__Host-simuladores_session=[a-f0-9]{64}; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800/);
  assert.equal((await request('/simulators/rcp/index.html', undefined, { Cookie })).status, 200);
  assert.equal((await (await request('/api/auth/session', undefined, { Cookie })).json()).user.email, email);
  assert.equal(db.sql.prepare('SELECT count(*) n FROM google_challenges').get().n, 0);
  assert.equal(db.sql.prepare('SELECT google_sub FROM users').get().google_sub, 'google-stable-student-1');
  assert.notEqual(db.sql.prepare('SELECT token_hash FROM sessions').get().token_hash, Cookie.split('=')[1].split(';')[0]);
  const logout = await request('/api/auth/logout', {}, { Cookie });
  assert.match(logout.headers.get('Set-Cookie'), /Max-Age=0/);
  assert.equal((await request('/rcp', undefined, { Cookie })).status, 303);
});

test('identidade é vinculada ao navegador e não pode ser repetida, inclusive concorrentemente', async t => {
  const { request, start, token, db } = setup(t);
  const challenge = await start();
  const body = { credential: await token(challenge.nonce) };
  assert.equal((await request('/api/auth/google/verify', body)).status, 400);
  const another = await start();
  assert.equal((await request('/api/auth/google/verify', body, { Cookie: another.Cookie })).status, 401);
  const responses = await Promise.all([request('/api/auth/google/verify', body, { Cookie: challenge.Cookie }), request('/api/auth/google/verify', body, { Cookie: challenge.Cookie })]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 400]);
  assert.equal((await request('/api/auth/google/verify', body, { Cookie: challenge.Cookie })).status, 400);
  assert.equal(db.sql.prepare('SELECT count(*) n FROM sessions').get().n, 1);
});

test('rejeita assinatura falsa, emissor, cliente, tempo e campos obrigatórios inválidos', async t => {
  const { request, start, token, db } = setup(t);
  const challenge = await start();
  const wrongKey = (await generateKeyPair('RS256')).privateKey;
  const bad = [
    await token(challenge.nonce, {}, wrongKey),
    ...await Promise.all([{ iss: 'https://evil.invalid' }, { aud: 'other.apps.googleusercontent.com' }, { azp: 'other.apps.googleusercontent.com' }, { exp: 1 }, { exp: undefined }, { iat: 1 }, { iat: Math.floor(Date.now() / 1000) + 600 }, { nonce: undefined }, { sub: '' }].map(c => token(challenge.nonce, c))),
  ];
  for (const credential of bad) assert.equal((await request('/api/auth/google/verify', { credential }, { Cookie: challenge.Cookie })).status, 401);
  assert.equal(db.sql.prepare('SELECT count(*) n FROM sessions').get().n, 0);
});

test('rejeita Gmail pessoal, domínio parecido, e-mail não verificado e falta de vínculo Workspace', async t => {
  const { request, start, token, db } = setup(t);
  const challenge = await start();
  for (const overrides of [{ email: 'aluno@gmail.com' }, { email: 'a@aluno.unc.br.evil.com' }, { email_verified: false }, { email_verified: 'true' }, { hd: 'unc.br' }, { hd: 'evil.com' }, { hd: undefined }]) {
    const credential = await token(challenge.nonce, overrides);
    const response = await request('/api/auth/google/verify', { credential, email, accessKind: 'unc', paid: true }, { Cookie: challenge.Cookie });
    assert.ok([401, 403].includes(response.status));
  }
  assert.equal(db.sql.prepare('SELECT count(*) n FROM sessions').get().n, 0);
});

test('tentativa expira; começar novamente reutiliza somente desafios válidos', async t => {
  const { request, start, token, db } = setup(t);
  const first = await start(); const second = await start({ Cookie: first.Cookie });
  assert.equal(first.nonce, second.nonce);
  db.sql.prepare('UPDATE google_challenges SET expires_at=0').run();
  assert.equal((await request('/api/auth/google/verify', { credential: await token(first.nonce) }, { Cookie: first.Cookie })).status, 400);
  assert.notEqual((await start({ Cookie: first.Cookie })).nonce, first.nonce);
});

test('rejeita origem externa, métodos e corpos indevidos; rotas de código foram desativadas', async t => {
  const { request } = setup(t);
  for (const path of ['/api/auth/google/start', '/api/auth/google/verify', '/api/auth/logout']) {
    assert.equal((await request(path, {}, { Origin: 'https://evil.invalid' })).status, 403);
    assert.equal((await request(path, {}, { Origin: 'null' })).status, 403);
    assert.equal((await request(path)).status, 405);
  }
  assert.equal((await request('/api/auth/google/start', {}, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await request('/api/auth/google/verify', { credential: 'x'.repeat(9000) })).status, 413);
  for (const path of ['/api/auth/send-code', '/api/auth/verify-code']) assert.equal((await request(path, { email })).status, 404);
});

test('sessão expirada, adulterada ou conta bloqueada não abre simulador', async t => {
  const { request, login, db } = setup(t); const Cookie = await login();
  assert.equal((await request('/rcp', undefined, { Cookie: '__Host-simuladores_session=' + 'a'.repeat(64) })).status, 303);
  db.sql.prepare("UPDATE users SET status='blocked'").run();
  assert.equal((await request('/rcp', undefined, { Cookie })).status, 303);
  db.sql.prepare("UPDATE users SET status='active'").run();
  db.sql.prepare('UPDATE sessions SET expires_at=0').run();
  assert.equal((await request('/rcp', undefined, { Cookie })).status, 303);
});

test('identidade estável não vincula automaticamente outro usuário com o mesmo e-mail; rotação revoga sessão anterior', async t => {
  const { request, start, token, login, db } = setup(t);
  const first = await login();
  const second = await login({}, first.split(';')[0]);
  assert.equal((await request('/rcp', undefined, { Cookie: first })).status, 303);
  assert.equal((await request('/rcp', undefined, { Cookie: second })).status, 200);
  assert.equal(db.sql.prepare('SELECT count(*) n FROM users').get().n, 1);
  const challenge = await start();
  assert.equal((await request('/api/auth/google/verify', { credential: await token(challenge.nonce, { sub: 'different-account' }) }, { Cookie: challenge.Cookie })).status, 403);
});

test('não libera categoria paga nem reativa conta bloqueada em um novo login', async t => {
  const { request, start, token, login, db } = setup(t); const Cookie = await login();
  for (const change of ["access_kind='paid'", "access_kind='unc', status='blocked'"]) {
    db.sql.prepare('UPDATE users SET ' + change).run();
    assert.equal((await request('/rcp', undefined, { Cookie })).status, 303);
    const challenge = await start();
    assert.equal((await request('/api/auth/google/verify', { credential: await token(challenge.nonce) }, { Cookie: challenge.Cookie })).status, 403);
  }
});

test('limita abuso sem armazenar endereço IP aberto', async t => {
  const { request, db } = setup(t);
  assert.equal((await request('/api/auth/google/start', {})).status, 200);
  db.sql.prepare('UPDATE auth_limits SET count=300').run();
  const response = await request('/api/auth/google/start', {});
  assert.equal(response.status, 429); assert.ok(Number(response.headers.get('Retry-After')) > 0);
  assert.ok(!JSON.stringify(db.sql.prepare('SELECT * FROM auth_limits').all()).includes('192.0.2.1'));
});

test('falta de configuração, banco ou identidade Google não cria bypass', async t => {
  const { request, login, db } = setup(t);
  assert.equal((await request('/api/auth/google/start', {}, {}, { GOOGLE_CLIENT_ID: '' })).status, 503);
  assert.equal((await request('/rcp', undefined, {}, { AUTH_DB: undefined })).status, 303);
  assert.equal((await (await request('/api/auth/session', undefined, {}, { AUTH_DB: undefined })).json()).available, false);
  const Cookie = await login(); db.sql.prepare('UPDATE users SET google_sub=NULL').run();
  assert.equal((await request('/rcp', undefined, { Cookie })).status, 303);
});
