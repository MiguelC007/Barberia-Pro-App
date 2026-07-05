import { useState } from "react";
import { Code2, Copy, RotateCcw } from "lucide-react";
import { useAppData } from "../services/localStore";
import { exportDataJson, resetDemoData } from "../services/settingsService";
import { RoleBadge } from "../components/RoleBadge";

export default function SuperAdminPanel() {
  const state = useAppData();
  const [message, setMessage] = useState("");

  function reset() {
    resetDemoData();
    setMessage("Datos demo reiniciados.");
  }

  async function copyJson() {
    await navigator.clipboard.writeText(exportDataJson());
    setMessage("JSON copiado al portapapeles.");
  }

  return (
    <div className="dashboard-grid">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Super Admin técnico</h2>
            <p>Este panel es para vos como creador/programador. No es para el dueño de la barbería.</p>
          </div>
          <Code2 />
        </div>

        <div className="alert info">
          Acceso total técnico: soporte, reset demo, exportación, revisión de usuarios y futuras herramientas de mantenimiento.
        </div>

        <div className="actions">
          <button className="btn danger" onClick={reset}><RotateCcw size={17} />Reset demo</button>
          <button className="btn blue" onClick={copyJson}><Copy size={17} />Exportar JSON</button>
        </div>

        {message && <div className="alert info">{message}</div>}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Usuarios demo</h2>
            <p>En producción estarían en Firebase Auth + Firestore.</p>
          </div>
        </div>

        <div className="stack">
          {state.users.map((user) => (
            <article className="list-item" key={user.id}>
              <div className="queue-number">{user.name.slice(0, 1)}</div>
              <div>
                <strong>{user.name}</strong>
                <p>{user.email || "sin correo"} · {user.phone || "sin teléfono"}</p>
              </div>
              <RoleBadge role={user.role} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
