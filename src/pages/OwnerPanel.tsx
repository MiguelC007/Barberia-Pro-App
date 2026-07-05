import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { MediaReferenceList } from "../components/MediaReferenceList";
import { StatCard } from "../components/StatCard";
import { addBarber, removeBarber } from "../services/barberService";
import { getBasicAnalytics } from "../services/analyticsService";
import { useAppData } from "../services/localStore";
import { confirmPayment, rejectPayment } from "../services/paymentService";
import { addService, removeService } from "../services/serviceService";
import { updateBusinessSettings } from "../services/settingsService";
import { moneyLempiras } from "../utils/format";

export default function OwnerPanel() {
  const state = useAppData();
  const analytics = getBasicAnalytics();
  const [business, setBusiness] = useState(state.business);
  const [newService, setNewService] = useState({ name: "", description: "", price: 150, duration: 30, icon: "SB" });
  const [newBarber, setNewBarber] = useState({ name: "", phone: "50400000000" });
  const [message, setMessage] = useState("");

  function saveBusiness() {
    updateBusinessSettings(business);
    setMessage("Configuracion de barberia actualizada.");
  }

  function createService() {
    try {
      addService(newService);
      setNewService({ name: "", description: "", price: 150, duration: 30, icon: "SB" });
      setMessage("Servicio agregado.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo agregar el servicio.");
    }
  }

  function createBarber() {
    try {
      addBarber({ name: newBarber.name, phone: newBarber.phone });
      setNewBarber({ name: "", phone: "50400000000" });
      setMessage("Barbero agregado.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo agregar el barbero.");
    }
  }

  function safeRemoveService(serviceId: string) {
    try {
      removeService(serviceId);
      setMessage("Servicio eliminado.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo eliminar el servicio.");
    }
  }

  function safeRemoveBarber(barberId: string) {
    try {
      removeBarber(barberId);
      setMessage("Barbero eliminado.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo eliminar el barbero.");
    }
  }

  return (
    <div className="grid gap-lg">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Panel dueno/admin</h2>
            <p>Control de la barberia, servicios, barberos y metricas basicas.</p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard label="Atendidos hoy" value={analytics.doneToday} />
          <StatCard label="Citas" value={analytics.appointments} />
          <StatCard label="Servicios" value={analytics.services} />
          <StatCard label="Barberos" value={analytics.barbers} />
          <StatCard label="Turnos activos" value={analytics.waiting} />
          <StatCard label="Pagos pendientes" value={analytics.paymentsPending} />
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Personalizacion de app</h2>
              <p>Datos visibles para clientes.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>Nombre de barberia<input value={business.appName} onChange={(event) => setBusiness({ ...business, appName: event.target.value })} /></label>
            <label>Iniciales logo<input value={business.logoText} maxLength={3} onChange={(event) => setBusiness({ ...business, logoText: event.target.value })} /></label>
            <label>Color principal<input type="color" value={business.themeColor} onChange={(event) => setBusiness({ ...business, themeColor: event.target.value })} /></label>
            <label>WhatsApp<input value={business.whatsapp} onChange={(event) => setBusiness({ ...business, whatsapp: event.target.value })} /></label>
            <label>Direccion<input value={business.address} onChange={(event) => setBusiness({ ...business, address: event.target.value })} /></label>
            <label>Horario<input value={business.hours} onChange={(event) => setBusiness({ ...business, hours: event.target.value })} /></label>
          </div>

          <label>
            Mensaje publico
            <textarea value={business.publicMessage} onChange={(event) => setBusiness({ ...business, publicMessage: event.target.value })} />
          </label>

          <button className="btn primary" onClick={saveBusiness}><Save size={17} />Guardar app</button>
          {message && <div className="alert info">{message}</div>}
        </div>

        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Servicios y precios</h2>
              <p>Editable solo por dueno o Super Admin.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>Servicio<input value={newService.name} onChange={(event) => setNewService({ ...newService, name: event.target.value })} /></label>
            <label>Descripcion<input value={newService.description} onChange={(event) => setNewService({ ...newService, description: event.target.value })} /></label>
            <label>Precio L<input type="number" value={newService.price} onChange={(event) => setNewService({ ...newService, price: Number(event.target.value) })} /></label>
            <label>Duracion min<input type="number" value={newService.duration} onChange={(event) => setNewService({ ...newService, duration: Number(event.target.value) })} /></label>
            <label>Icono<input value={newService.icon} onChange={(event) => setNewService({ ...newService, icon: event.target.value })} /></label>
          </div>

          <button className="btn primary" onClick={createService}>Agregar servicio</button>

          <div className="divider" />
          <div className="stack">
            {state.services.map((service) => (
              <article className="list-item" key={service.id}>
                <div className="queue-number">{service.icon}</div>
                <div>
                  <strong>{service.name}</strong>
                  <p>{moneyLempiras(service.price)} - {service.duration} min</p>
                </div>
                <button className="btn danger" onClick={() => safeRemoveService(service.id)}><Trash2 size={16} /></button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Barberos</h2>
            <p>Crear o eliminar barberos de esta app privada.</p>
          </div>
        </div>

        <div className="form-grid">
          <label>Nombre<input value={newBarber.name} onChange={(event) => setNewBarber({ ...newBarber, name: event.target.value })} /></label>
          <label>WhatsApp<input value={newBarber.phone} onChange={(event) => setNewBarber({ ...newBarber, phone: event.target.value })} /></label>
        </div>

        <button className="btn primary" onClick={createBarber}>Agregar barbero</button>

        <div className="divider" />
        <div className="stack">
          {state.barbers.map((barber) => (
            <article className="list-item" key={barber.id}>
              <div className="queue-number">{barber.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <strong>{barber.name}</strong>
                <p>{barber.phone} - {barber.status}</p>
              </div>
              <button className="btn danger" onClick={() => safeRemoveBarber(barber.id)}><Trash2 size={16} /></button>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Pagos pendientes</h2>
            <p>Confirmacion manual para comprobantes enviados por QR o WhatsApp.</p>
          </div>
        </div>

        <div className="stack">
          {state.payments.filter((payment) => payment.status === "pending").length ? (
            state.payments.filter((payment) => payment.status === "pending").map((payment) => (
              <article className="list-item" key={payment.id}>
                <div className="queue-number">L</div>
                <div>
                  <strong>{payment.clientName}</strong>
                  <p>{moneyLempiras(payment.amount)} - {payment.proofText}</p>
                  <MediaReferenceList items={payment.mediaReferences || []} title="Comprobante" />
                </div>
                <div className="actions">
                  <button className="btn success" onClick={() => confirmPayment(payment.id)}>Confirmar</button>
                  <button className="btn danger" onClick={() => rejectPayment(payment.id)}>Rechazar</button>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">No hay pagos pendientes.</div>
          )}
        </div>
      </section>
    </div>
  );
}
