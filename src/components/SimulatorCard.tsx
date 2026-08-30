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
      <div className="card-topline">
        <span className="card-index" aria-hidden="true">{index}</span>
        <span className={available ? "status available" : "status"}>
          {available ? "Disponível" : "Em breve"}
        </span>
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {available && href ? (
        <a className="button primary" href={href}>Iniciar simulador</a>
      ) : (
        <span className="button disabled" aria-disabled="true">Em breve</span>
      )}
    </article>
  );
}
