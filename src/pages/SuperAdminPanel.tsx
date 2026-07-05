import { useState } from "react";
import { Copy, Settings2, Wrench } from "lucide-react";
import { useAppData } from "../services/localStore";
import { exportDataJson, resetDemoData } from "../services/settingsService";
import { RoleBadge } from "../components/RoleBadge";

export default function SuperAdminPanel() {
  const state = useAppData();
  const [message, setMessage] = useState("");

  function reset() {
    resetDemoData();
    setMessage("Entorno local restaurado correctamente.");
  }

  async function copyJson() {
    await navigator.clipboard.writeText(exportDataJson());
    setMessage("Exportación JSON copiada al portapapeles.");
  }

  return (
    <div className="dashboard-grid">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Superadministración</h2>
            <p>Soporte, mantenimiento, exportación y configuración avanzada del sistema.</p>
          </div>
          <Settings2 />
        </div>

        <div className="alert info">
          Acceso reservado para mantenimiento, respaldo operativo y soporte de implementación.
        </div>

        <div className="actions">
          <button className="btn danger" onClick={reset}><Wrench size={17} />Restaurar entorno local</button>
          <button className="btn blue" onClick={copyJson}><Copy size={17} />Exportar JSON</button>
        </div>

        {message && <div className="alert info">{message}</div>}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Usuarios del sistema</h2>
            <p>Perfiles disponibles en la base actual del negocio.</p>
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
