type SimulatorCardProps = {
  title: string;
  description: string;
  href?: string;
  available?: boolean;
  index: string;
};

export function SimulatorCard({
  title,
  description,
  href,
  available = false,
  index,
}: SimulatorCardProps) {
  return (
    <article className="simulator-card">
      <span className="card-index" aria-hidden="true">{index}</span>
      <div className="card-content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {available && href ? (
        <a className="module-link" href={href} aria-label={`Abrir simulador de ${title}`}>Abrir simulador <span aria-hidden="true">↗</span></a>
      ) : (
        <span className="module-unavailable">Em breve</span>
      )}
    </article>
  );
}
