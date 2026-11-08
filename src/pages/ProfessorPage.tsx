import { useEffect, useRef, useState, type FormEvent } from 'react';
import { PageMetadata } from '../components/PageMetadata';

type Status = 'active' | 'blocked';
type Student = { id: string; email: string; status: Status; createdAt: number; lastLoginAt: number; version: string };
type StudentList = { users: Student[]; total: number; page: number; pages: number; pageSize: number };
type Overview = { total: number; active: number; blocked: number; recent: number };
class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }
async function readResponse(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body.error || 'Não foi possível carregar os dados. Tente novamente.', response.status);
  return body;
}
const date = (seconds: number) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(seconds * 1000));
const count = (value: number) => value.toLocaleString('pt-BR');

export function ProfessorPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [list, setList] = useState<StudentList | null>(null);
  const [draftSearch, setDraftSearch] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Status | 'all'>('all');
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restricted, setRestricted] = useState(false);
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<Student | null>(null);
  const [changing, setChanging] = useState(false);
  const [changeError, setChangeError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    const params = new URLSearchParams({ q: search, status, page: String(page) });
    const options = { cache: 'no-store' as const, signal: controller.signal };
    Promise.all([
      fetch('/api/professor/overview', options).then(readResponse),
      fetch(`/api/professor/users?${params}`, options).then(readResponse),
    ]).then(([summary, students]) => {
      if (controller.signal.aborted) return;
      setOverview(summary); setList(students); setRestricted(false);
    }).catch(cause => {
      if (controller.signal.aborted) return;
      setList(null); setOverview(null);
      if (cause instanceof ApiError && cause.status === 401) { window.location.replace('/professor/entrar'); return; }
      setRestricted(cause instanceof ApiError && cause.status === 403);
      setError(cause instanceof Error ? cause.message : 'Não foi possível conectar. Tente novamente.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [search, status, page, refresh]);

  useEffect(() => {
    if (selected && !dialog.current?.open) dialog.current?.showModal();
    if (!selected && dialog.current?.open) dialog.current.close();
  }, [selected]);

  function searchStudents(event: FormEvent) {
    event.preventDefault(); setPage(1); setSearch(draftSearch.trim()); setNotice('');
  }
  async function changeAccess() {
    if (!selected || changing) return;
    setChanging(true); setChangeError('');
    const newStatus: Status = selected.status === 'active' ? 'blocked' : 'active';
    try {
      await fetch(`/api/professor/users/${encodeURIComponent(selected.id)}/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, version: selected.version }),
      }).then(readResponse);
      setNotice(newStatus === 'blocked' ? `Acesso de ${selected.email} bloqueado. As sessões foram encerradas.` : `Acesso de ${selected.email} reativado. O aluno já pode entrar novamente.`);
      setSelected(null); setRefresh(value => value + 1);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) { window.location.replace('/professor/entrar'); return; }
      if (cause instanceof ApiError && cause.status === 409) { setSelected(null); setNotice(cause.message); setRefresh(value => value + 1); }
      else setChangeError(cause instanceof Error ? cause.message : 'Não foi possível alterar o acesso.');
    } finally { setChanging(false); }
  }

  return <>
    <PageMetadata title="Painel do professor" description="Administração dos cadastros e acessos aos simuladores." />
    <section className="container professor-page">
      <div className="professor-heading">
        <div><p className="eyebrow">Administração · acesso reservado</p><h1>Painel do professor</h1><p>Cadastros e acesso aos simuladores.</p></div>
        <a className="text-link" href="/">Voltar aos simuladores</a>
      </div>
      {restricted ? <div className="professor-empty"><h2>Acesso exclusivo do professor</h2><p>Você está conectado com uma conta de aluno. Use a conta Google autorizada para abrir este painel.</p><a className="button primary" href="/professor/entrar">Entrar com outra conta</a></div> : <>
        {error && <div className="auth-message auth-error" role="alert"><p>{error}</p><button className="plain-button" onClick={() => setRefresh(value => value + 1)}>Tentar novamente</button></div>}
        {overview && <dl className="professor-metrics" aria-label="Resumo dos cadastros">
          <div><dt>Alunos cadastrados</dt><dd>{count(overview.total)}</dd></div>
          <div><dt>Com acesso</dt><dd>{count(overview.active)}</dd></div>
          <div><dt>Bloqueados</dt><dd>{count(overview.blocked)}</dd></div>
          <div><dt>Entraram nos últimos 7 dias</dt><dd>{count(overview.recent)}</dd></div>
        </dl>}
        <section className="professor-register" aria-labelledby="students-title" aria-busy={loading}>
          <div className="professor-register-heading"><div><h2 id="students-title">Alunos</h2><p>O cadastro aparece depois da primeira entrada pelo Google.</p></div><button className="plain-button" disabled={loading} onClick={() => setRefresh(value => value + 1)}>Atualizar lista</button></div>
          <form className="professor-filters" onSubmit={searchStudents}>
            <div className="professor-search"><label htmlFor="student-search">Buscar por e-mail</label><input id="student-search" type="search" value={draftSearch} onChange={event => setDraftSearch(event.target.value)} placeholder="Digite parte do e-mail" maxLength={254} /></div>
            <div><label htmlFor="student-status">Situação do acesso</label><select id="student-status" value={status} onChange={event => { setStatus(event.target.value as Status | 'all'); setPage(1); }}><option value="all">Todos</option><option value="active">Com acesso</option><option value="blocked">Bloqueados</option></select></div>
            <button className="button primary" type="submit" disabled={loading}>Buscar</button>
          </form>
          {notice && <p className="auth-message" role="status">{notice}</p>}
          {loading && <p className="professor-loading" role="status">Atualizando cadastros…</p>}
          {list && <>
            <p className="professor-result-count" aria-live="polite">{count(list.total)} {list.total === 1 ? 'cadastro encontrado' : 'cadastros encontrados'}</p>
            {list.users.length ? <div className="professor-table-wrap" tabIndex={0} role="region" aria-label="Cadastros de alunos; role horizontalmente em telas pequenas">
              <table className="professor-table"><thead><tr><th scope="col">E-mail do aluno</th><th scope="col">Acesso</th><th scope="col">Cadastro</th><th scope="col">Última entrada</th><th scope="col">Administrar</th></tr></thead><tbody>
                {list.users.map(student => <tr key={student.id}>
                  <th scope="row" className="student-email">{student.email}</th>
                  <td><span className={`access-status ${student.status}`}>{student.status === 'active' ? 'Liberado' : 'Bloqueado'}</span></td>
                  <td><time dateTime={new Date(student.createdAt * 1000).toISOString()}>{date(student.createdAt)}</time></td>
                  <td><time dateTime={new Date(student.lastLoginAt * 1000).toISOString()}>{date(student.lastLoginAt)}</time></td>
                  <td><button className="plain-button" disabled={loading || changing} aria-label={`${student.status === 'active' ? 'Bloquear' : 'Reativar'} acesso de ${student.email}`} onClick={() => { setSelected(student); setChangeError(''); }}>{student.status === 'active' ? 'Bloquear' : 'Reativar'}</button></td>
                </tr>)}
              </tbody></table>
            </div> : <div className="professor-empty"><h3>{search || status !== 'all' ? 'Nenhum cadastro com esses filtros' : 'Nenhum aluno cadastrado ainda'}</h3><p>{search || status !== 'all' ? 'Tente outra busca ou altere a situação do acesso.' : 'Os alunos aparecerão aqui quando entrarem no site com a conta institucional.'}</p></div>}
            {list.pages > 1 && <nav className="professor-pagination" aria-label="Páginas de alunos"><button className="plain-button" disabled={loading || list.page <= 1} onClick={() => setPage(list.page - 1)}>Anterior</button><span>Página {list.page} de {list.pages}</span><button className="plain-button" disabled={loading || list.page >= list.pages} onClick={() => setPage(list.page + 1)}>Próxima</button></nav>}
          </>}
        </section>
        <p className="professor-footnote">Horários de Brasília. “Última entrada” indica a autenticação mais recente; não significa que o aluno esteja online. Este painel não registra notas ou desempenho nos simuladores.</p>
      </>}
    </section>
    <dialog className="access-dialog" ref={dialog} aria-labelledby="access-dialog-title" onCancel={event => { if (changing) event.preventDefault(); else setSelected(null); }} onClose={() => { if (!changing) setSelected(null); }}>
      {selected && <>
        <p className="eyebrow">Administrar acesso</p><h2 id="access-dialog-title">{selected.status === 'active' ? 'Bloquear esta conta?' : 'Reativar esta conta?'}</h2>
        <p className="dialog-email">{selected.email}</p>
        <p>{selected.status === 'active' ? 'As sessões atuais serão encerradas e o aluno não poderá entrar. Você poderá reativar o acesso depois.' : 'O aluno poderá entrar novamente pelo Google. As sessões anteriores continuarão encerradas.'}</p>
        {changeError && <p className="auth-message auth-error" role="alert">{changeError}</p>}
        <div className="access-dialog-actions"><button className="button secondary" autoFocus disabled={changing} onClick={() => setSelected(null)}>Cancelar</button><button className={`button ${selected.status === 'active' ? 'danger' : 'primary'}`} disabled={changing} onClick={() => void changeAccess()}>{changing ? 'Salvando…' : selected.status === 'active' ? 'Confirmar bloqueio' : 'Confirmar reativação'}</button></div>
      </>}
    </dialog>
  </>;
}
