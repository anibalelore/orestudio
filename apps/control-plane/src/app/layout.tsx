import type { ReactNode } from "react";
import "./styles.css";
export const metadata = { title: "ORE Studio Control Plane", description: "Dirección de una agencia ORE autoalojada" };
export default function Layout({ children }: { children: ReactNode }) { return <html lang="es"><body><header><span className="mark">ORE</span><nav>Oficina · Clientes · Proyectos · Decisiones</nav></header><main>{children}</main></body></html>; }
