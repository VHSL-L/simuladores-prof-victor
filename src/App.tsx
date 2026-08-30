import { SiteLayout } from "./components/SiteLayout";
import { ClinicalSimulatorPage } from "./pages/ClinicalSimulatorPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RcpPage } from "./pages/RcpPage";
import { AboutPage } from "./pages/AboutPage";

const normalizePath = (path: string) =>
  path !== "/" ? path.replace(/\/+$/, "") : path;

export default function App() {
  const path = normalizePath(window.location.pathname);

  let page;
  switch (path) {
    case "/":
      page = <HomePage />;
      break;
    case "/rcp":
      page = <RcpPage />;
      break;
    case "/ventilacao-mecanica":
      page = (
        <ClinicalSimulatorPage
          slug="ventilacao-mecanica"
          frameTitle="VentilaLab — Simulador do Prof. Victor"
          title="Ventilação Mecânica"
          description="Treinamento de raciocínio e tomada de decisão em ventilação mecânica."
        />
      );
      break;
    case "/choque":
      page = (
        <ClinicalSimulatorPage
          slug="choque"
          frameTitle="Sala de Choque do Prof. Victor"
          title="Choque"
          description="Avaliação e tomada de decisão no atendimento ao paciente em choque."
        />
      );
      break;
    case "/sobre":
      page = <AboutPage />;
      break;
    default:
      page = <NotFoundPage />;
  }

  return <SiteLayout currentPath={path}>{page}</SiteLayout>;
}
