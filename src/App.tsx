import { SiteLayout } from "./components/SiteLayout";
import { ClinicalSimulatorPage } from "./pages/ClinicalSimulatorPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RcpPage } from "./pages/RcpPage";
import { AboutPage } from "./pages/AboutPage";
import { LoginPage } from "./pages/LoginPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { ProfessorPage } from "./pages/ProfessorPage";

const normalizePath = (path: string) =>
  path !== "/" ? path.replace(/\/+$/, "") : path;

export default function App() {
  const path = normalizePath(window.location.pathname);

  let page;
  switch (path) {
    case "/professor":
      page = <ProfessorPage />;
      break;
    case "/professor/entrar":
      page = <LoginPage mode="professor" />;
      break;
    case "/entrar":
      page = <LoginPage />;
      break;
    case "/privacidade":
      page = <PrivacyPage />;
      break;
    case "/":
      page = <HomePage />;
      break;
    case "/bls":
      page = <ClinicalSimulatorPage slug="bls" title="BLS · suporte básico de vida" frameTitle="BLS adulto — prática guiada" description="Reconhecimento da parada, RCP e DEA em quatro casos guiados para estudantes da saúde." />;
      break;
    case "/gasometria":
      page = <ClinicalSimulatorPage slug="gasometria" title="Gasometria arterial" frameTitle="Gasometria arterial — casos guiados" description="Oito casos para interpretar pH, ânion gap e compensação, com cálculos comentados." />;
      break;
    case "/ecg":
      page = <ClinicalSimulatorPage slug="ecg" title="ECG na emergência" frameTitle="ECG na emergência — ritmos e abordagem inicial" description="Sete casos de ritmos no pronto atendimento: reconhecimento, estabilidade e abordagem inicial." />;
      break;
    case "/eletrolitos":
      page = <ClinicalSimulatorPage slug="eletrolitos" title="Distúrbios eletrolíticos" frameTitle="Distúrbios eletrolíticos — casos guiados" description="Seis casos para integrar sódio, potássio e magnésio aos sinais clínicos e às prioridades do atendimento." />;
      break;
    case "/via-aerea":
      page = <ClinicalSimulatorPage slug="via-aerea" title="Via aérea avançada" frameTitle="Via aérea avançada — casos ilustrados" description="Seis casos ilustrados para preparar a abordagem, priorizar oxigenação, confirmar o tubo e reconhecer quando mudar de plano." />;
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
