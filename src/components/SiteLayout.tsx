import type { ReactNode } from "react";

const navItems = [
  ["Início", "/"],
  ["Ventilação Mecânica", "/ventilacao-mecanica"],
  ["Choque", "/choque"],
  ["RCP", "/rcp"],
  ["Sobre", "/sobre"],
] as const;

type SiteLayoutProps = {
  children: ReactNode;
  currentPath: string;
};

function NavLinks({ currentPath }: { currentPath: string }) {
  return (
    <>
      {navItems.map(([label, href]) => (
        <a
          href={href}
          key={href}
          aria-current={currentPath === href ? "page" : undefined}
        >
          {label}
        </a>
      ))}
    </>
  );
}

export function SiteLayout({ children, currentPath }: SiteLayoutProps) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="/" aria-label="Ir para o início">
            <span className="brand-mark" aria-hidden="true">VH</span>
            <span>Simuladores do Prof. Victor Hugo Sant&apos;Ana</span>
          </a>
          <nav className="desktop-nav" aria-label="Navegação principal">
            <NavLinks currentPath={currentPath} />
          </nav>
          <details className="mobile-nav">
            <summary>Menu</summary>
            <nav aria-label="Navegação principal no celular">
              <NavLinks currentPath={currentPath} />
            </nav>
          </details>
        </div>
      </header>

      <main>{children}</main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <strong>Simuladores do Prof. Victor Hugo Sant&apos;Ana</strong>
            <p>Ferramentas para ensino e treinamento médico.</p>
          </div>
          <nav aria-label="Navegação do rodapé">
            <a href="/sobre">Sobre</a>
            <a href="/sobre#aviso-importante">Aviso importante</a>
            <a href="/sobre#referencias">Referências</a>
          </nav>
          <p className="footer-meta">
            © {new Date().getFullYear()} Prof. Victor Hugo Sant&apos;Ana
          </p>
        </div>
      </footer>
    </div>
  );
}
