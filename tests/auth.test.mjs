import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import worker, { normalizeEmail, safeNext } from '../dist/_worker.js';
import { PROFESSOR_EMAIL } from '../server/access-policy.mjs';

const { privateKey, publicKey } = await generateKeyPair('RS256');
const publicJwk = { ...await exportJWK(publicKey), kid: 'test-key', alg: 'RS256', use: 'sig' };
const clientId = '123456-test.apps.googleusercontent.com';
const email = 'aluno@aluno.unc.br';
function database() {
  const sql = new DatabaseSync(':memory:');
  let queue = Promise.resolve();
  for (const migration of readdirSync('migrations').sort()) sql.exec(readFileSync('migrations/' + migration, 'utf8'));
  function prepare(query) {
    let values = [];
    return {
      bind(...args) { values = args; return this; },
      async first() { return sql.prepare(query).get(...values) ?? null; },
      async run() { return sql.prepare(query).run(...values); },
      async all() { return { results: sql.prepare(query).all(...values) }; },
    };
  }
  return { sql, prepare, batch(statements) {
    const job = queue.then(async () => {
      sql.exec('BEGIN');
      try { const out = []; for (const statement of statements) out.push(await statement.run()); sql.exec('COMMIT'); return out; }
      catch (error) { sql.exec('ROLLBACK'); throw error; }
    });
    queue = job.catch(() => {}); return job;
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
  for (const path of ['/', '/sobre', '/entrar', '/professor/entrar', '/privacidade', '/favicon.svg']) assert.equal((await request(path)).status, 200, path);
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

const professorClaims = { email: PROFESSOR_EMAIL, sub: 'google-professor-1', hd: undefined };

test('somente a conta Google exata do professor recebe a função administrativa', async t => {
  const { request, login, start, token, db } = setup(t);
  const Cookie = await login(professorClaims);
  assert.match(Cookie, /Max-Age=28800/);
  assert.equal((await (await request('/api/auth/session', undefined, { Cookie })).json()).user.role, 'professor');
  assert.equal((await request('/api/professor/overview', undefined, { Cookie })).status, 200);
  assert.equal((await request('/simulators/rcp/index.html', undefined, { Cookie })).status, 200);
  const challenge = await start();
  for (const overrides of [
    { email: 'another@gmail.com' }, { email: 'santana.lourenco+admin@gmail.com' },
    { email: PROFESSOR_EMAIL + '.evil.com' }, { email: PROFESSOR_EMAIL, email_verified: false },
  ]) {
    assert.equal((await request('/api/auth/google/verify', { credential: await token(challenge.nonce, { ...professorClaims, sub: 'attacker', ...overrides }), role: 'professor' }, { Cookie: challenge.Cookie })).status, 403);
  }
  assert.equal(db.sql.prepare("SELECT count(*) n FROM users WHERE role='professor'").get().n, 1);
});

test('sem sessão e alunos não podem ler ou alterar cadastros, mesmo forjando função', async t => {
  const { request, login, start, token, db } = setup(t);
  assert.equal((await request('/api/professor/overview')).status, 401);
  const redirect = await request('/professor');
  assert.equal(redirect.status, 303); assert.match(redirect.headers.get('location'), /^\/professor\/entrar/);
  const Cookie = await login();
  for (const path of ['/api/professor/overview', '/api/professor/users']) assert.equal((await request(path, undefined, { Cookie, 'X-Role': 'professor' })).status, 403);
  const id = db.sql.prepare('SELECT id FROM users').get().id;
  assert.equal((await request(`/api/professor/users/${id}/status`, { status: 'blocked', version: '', role: 'professor' }, { Cookie })).status, 403);
  const challenge = await start();
  assert.equal((await request('/api/auth/google/verify', { credential: await token(challenge.nonce), mode: 'professor' }, { Cookie: challenge.Cookie })).status, 403);
  db.sql.prepare("UPDATE users SET role='professor'").run();
  assert.equal((await request('/api/professor/overview', undefined, { Cookie })).status, 401);
});

test('painel conta apenas alunos institucionais e pagina mais de cinquenta cadastros', async t => {
  const { request, login, db } = setup(t); const Cookie = await login(professorClaims);
  const now = Math.floor(Date.now() / 1000);
  const insert = db.sql.prepare('INSERT INTO users (id,email,google_sub,status,created_at,last_login_at) VALUES (?,?,?,?,?,?)');
  for (let i = 0; i < 62; i++) insert.run(`student-${String(i).padStart(3, '0')}`, `student${i}@aluno.unc.br`, `google-student-${i}`, i < 5 ? 'blocked' : 'active', now, i < 12 ? now : now - 10 * 86400);
  db.sql.prepare("INSERT INTO users (id,email,access_kind,created_at,last_login_at) VALUES ('paid','external@example.invalid','paid',?,?)").run(now,now);
  const overview = await (await request('/api/professor/overview', undefined, { Cookie })).json();
  assert.deepEqual(overview, { total: 62, active: 57, blocked: 5, recent: 12 });
  const all = [];
  for (let page = 1; page <= 3; page++) {
    const response = await request(`/api/professor/users?page=${page}`, undefined, { Cookie });
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    const list = await response.json();
    assert.equal(list.total, 62); assert.equal(list.pages, 3); assert.ok(list.users.length <= 25);
    all.push(...list.users);
  }
  assert.equal(new Set(all.map(u => u.id)).size, 62);
  assert.deepEqual(Object.keys(all[0]).sort(), ['id','email','status','createdAt','lastLoginAt','version'].sort());
  const filtered = await (await request('/api/professor/users?status=blocked&q=student1', undefined, { Cookie })).json();
  assert.equal(filtered.total, 1); assert.equal(filtered.users[0].email, 'student1@aluno.unc.br');
  assert.equal((await (await request('/api/professor/users?q=%25', undefined, { Cookie })).json()).total, 0);
  assert.equal((await request('/api/professor/users?page=-1', undefined, { Cookie })).status, 400);
  assert.equal((await request('/api/professor/users?status=professor', undefined, { Cookie })).status, 400);
});

test('bloqueio encerra sessões, impede novo login e reativação não revive sessão antiga', async t => {
  const { request, login, start, token, db } = setup(t);
  const studentCookie = await login(); const professorCookie = await login(professorClaims);
  const student = db.sql.prepare("SELECT id FROM users WHERE role='student'").get();
  const path = `/api/professor/users/${student.id}/status`;
  assert.equal((await request(path, { status: 'blocked', version: '' }, { Cookie: professorCookie })).status, 200);
  assert.equal((await request('/rcp', undefined, { Cookie: studentCookie })).status, 303);
  assert.equal(db.sql.prepare('SELECT count(*) n FROM sessions WHERE user_id=?').get(student.id).n, 0);
  const challenge = await start();
  assert.equal((await request('/api/auth/google/verify', { credential: await token(challenge.nonce) }, { Cookie: challenge.Cookie })).status, 403);
  const version = db.sql.prepare('SELECT last_access_change FROM users WHERE id=?').get(student.id).last_access_change;
  assert.equal((await request(path, { status: 'active', version }, { Cookie: professorCookie })).status, 200);
  assert.equal((await request('/rcp', undefined, { Cookie: studentCookie })).status, 303);
  const newCookie = await login(); assert.equal((await request('/rcp', undefined, { Cookie: newCookie })).status, 200);
  const changes = db.sql.prepare('SELECT previous_status,new_status,actor_id FROM access_changes ORDER BY rowid').all();
  assert.deepEqual(changes.map(x => [x.previous_status,x.new_status]), [['active','blocked'],['blocked','active']]);
  assert.ok(changes.every(x => x.actor_id !== student.id));
});

test('origem externa, alteração da própria conta e corpo inválido são rejeitados', async t => {
  const { request, login, db } = setup(t); await login(); const Cookie = await login(professorClaims);
  const student = db.sql.prepare("SELECT id FROM users WHERE role='student'").get();
  const professor = db.sql.prepare("SELECT id FROM users WHERE role='professor'").get();
  const path = `/api/professor/users/${student.id}/status`;
  assert.equal((await request(path, { status:'blocked', version:'' }, { Cookie, Origin:'https://evil.invalid' })).status, 403);
  assert.equal((await request(path, { status:'professor', version:'' }, { Cookie })).status, 400);
  assert.equal((await request(path, { status:'blocked' }, { Cookie })).status, 400);
  assert.equal((await request(`/api/professor/users/${professor.id}/status`, { status:'blocked',version:'' }, { Cookie })).status, 404);
  assert.equal((await request(path, undefined, { Cookie })).status, 405);
  assert.equal(db.sql.prepare('SELECT count(*) n FROM access_changes').get().n, 0);
});

test('ações concorrentes e versões antigas não duplicam alterações nem auditoria', async t => {
  const { request, login, db } = setup(t); await login(); const Cookie = await login(professorClaims);
  const { id } = db.sql.prepare("SELECT id FROM users WHERE role='student'").get();
  const path = `/api/professor/users/${id}/status`;
  const results = await Promise.all([request(path, { status:'blocked',version:'' }, { Cookie }), request(path, { status:'blocked',version:'' }, { Cookie })]);
  assert.deepEqual(results.map(r=>r.status).sort(), [200,409]);
  assert.equal(db.sql.prepare('SELECT count(*) n FROM access_changes').get().n, 1);
  assert.equal((await request(path, { status:'active',version:'' }, { Cookie })).status, 409);
  assert.equal(db.sql.prepare('SELECT status FROM users WHERE id=?').get(id).status, 'blocked');
});

test('falha da auditoria desfaz o bloqueio e preserva as sessões', async t => {
  const { request, login, db } = setup(t); const studentCookie = await login(); const Cookie = await login(professorClaims);
  const { id } = db.sql.prepare("SELECT id FROM users WHERE role='student'").get();
  db.sql.exec("CREATE TRIGGER fail_audit BEFORE INSERT ON access_changes BEGIN SELECT RAISE(ABORT, 'test failure'); END");
  assert.equal((await request(`/api/professor/users/${id}/status`, {status:'blocked',version:''}, {Cookie})).status, 503);
  assert.equal(db.sql.prepare('SELECT status FROM users WHERE id=?').get(id).status, 'active');
  assert.equal((await request('/rcp', undefined, {Cookie:studentCookie})).status, 200);
});

test('sessão administrativa expirada ou professor bloqueado perde acesso ao painel', async t => {
  const { request, login, db } = setup(t); const Cookie = await login(professorClaims);
  db.sql.prepare("UPDATE users SET status='blocked' WHERE role='professor'").run();
  assert.equal((await request('/api/professor/users', undefined, {Cookie})).status, 401);
  db.sql.prepare("UPDATE users SET status='active' WHERE role='professor'").run();
  db.sql.prepare('UPDATE sessions SET expires_at=0').run();
  assert.equal((await request('/api/professor/overview', undefined, {Cookie})).status, 401);
});


test('novos módulos e seus arquivos clínicos exigem sessão e preservam o destino após login', async t => {
  const {request,login}=setup(t); const Cookie=await login();
  for(const slug of ['bls','gasometria','ecg','eletrolitos','via-aerea']){
    assert.equal(safeNext('/'+slug),'/'+slug);
    const blocked=await request('/'+slug);assert.equal(blocked.status,303);
    assert.equal(blocked.headers.get('Location'),'/entrar?next=%2F'+slug);
    assert.equal((await request('/'+slug,undefined,{Cookie})).status,200);
    const html='/simulators/'+slug+'/index.html';
    assert.equal((await request(html)).status,303);
    assert.equal((await request(html,undefined,{Cookie})).status,200);
    const entry=[...readFileSync('dist'+html,'utf8').matchAll(/<script[^>]*src="([^"]+)"/g)]
      .map(match=>match[1]).find(file=>file.startsWith('/assets/main-'));
    assert.ok(entry, 'O módulo deve possuir um arquivo clínico próprio');
    assert.equal((await request(entry)).status,303,entry);
    assert.equal((await request(entry,undefined,{Cookie})).status,200,entry);
  }
});


test('fotografias locais exigem sessão, inclusive o arquivo aberto diretamente', async t => {
 const {request,login}=setup(t),Cookie=await login();
 const photos=readdirSync('dist/assets').filter(name=>/^(bag|scope|tube|suction|supraglottic|sensor)-.*\.jpg$/.test(name));
 assert.equal(photos.length,6);
 for(const photo of photos){
  const url='/assets/'+photo;
  const anonymous=await request(url);
  assert.equal(anonymous.status,303);
  assert.equal(anonymous.headers.get('Cache-Control'),'private, no-store');
  assert.equal((await request(url,undefined,{Cookie})).status,200);
 }
});
