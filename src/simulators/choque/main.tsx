import { createRoot } from "react-dom/client";
import Simulator from "./Simulator";
import "./globals.css";
import "./crt.css";

createRoot(document.getElementById("root")!).render(<Simulator />);
