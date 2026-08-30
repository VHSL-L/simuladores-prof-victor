import { PageMetadata } from "../components/PageMetadata";

export function NotFoundPage() {
  return (
    <>
      <PageMetadata title="Página não encontrada" description="Página não encontrada." />
      <section className="simple-page container">
        <p className="eyebrow">Erro 404</p>
        <h1>Página não encontrada</h1>
        <p>O endereço informado não corresponde a uma página desta plataforma.</p>
        <a className="button primary" href="/">Voltar ao início</a>
      </section>
    </>
  );
}
