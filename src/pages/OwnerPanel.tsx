import { useEffect, useMemo, useState } from "react";
import { Copy, Save, Trash2 } from "lucide-react";
import { MediaReferenceList } from "../components/MediaReferenceList";
import { StatCard } from "../components/StatCard";
import { addBarber, removeBarber } from "../services/barberService";
import { getBasicAnalytics } from "../services/analyticsService";
import { useAppData } from "../services/localStore";
import { confirmPayment, rejectPayment, updatePaymentSettings } from "../services/paymentService";
import { addService, removeService, updateService } from "../services/serviceService";
import { updateBusinessSettings } from "../services/settingsService";
import { moneyLempiras, maskAccount } from "../utils/format";
import { getServiceImage } from "../utils/serviceImages";

export default function OwnerPanel() {
  const state = useAppData();
  const analytics = getBasicAnalytics();
  const [business, setBusiness] = useState(state.business);
  const [payment, setPayment] = useState(state.paymentSettings);
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    price: 150,
    duration: 30,
    icon: "SB",
    imageUrl: "",
    imageStoragePath: ""
  });
  const [newBarber, setNewBarber] = useState({ name: "", phone: "50400000000" });
  const [message, setMessage] = useState("");
  const serviceDrafts = useMemo(
    () =>
      Object.fromEntries(
        state.services.map((service) => [
          service.id,
          {
            name: service.name,
            description: service.description,
            price: service.price,
            duration: service.duration,
            icon: service.icon,
            imageUrl: service.imageUrl || "",
            imageStoragePath: service.imageStoragePath || ""
          }
        ])
      ),
    [state.services]
  );
  const [draftMap, setDraftMap] = useState(serviceDrafts);

  useEffect(() => {
    setDraftMap(serviceDrafts);
  }, [serviceDrafts]);

  function syncDraft(serviceId: string, field: string, value: string | number) {
    setDraftMap((current) => ({
      ...current,
      [serviceId]: {
        ...current[serviceId],
        [field]: value
      }
    }));
  }

  function saveBusiness() {
    updateBusinessSettings(business);
    setMessage("Configuración general actualizada.");
  }

  function savePayment() {
    try {
      updatePaymentSettings({
        ...payment,
        accountNumberMasked: maskAccount(payment.accountNumberMasked)
      });
      setMessage("Datos bancarios actualizados.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudieron guardar los datos bancarios.");
    }
  }

  function createService() {
    try {
      addService(newService);
      setNewService({ name: "", description: "", price: 150, duration: 30, icon: "SB", imageUrl: "", imageStoragePath: "" });
      setMessage("Servicio agregado correctamente.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo agregar el servicio.");
    }
  }

  function saveService(serviceId: string) {
    try {
      updateService(serviceId, draftMap[serviceId]);
      setMessage("Servicio actualizado.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo guardar el servicio.");
    }
  }

  function createBarber() {
    try {
      addBarber({ name: newBarber.name, phone: newBarber.phone });
      setNewBarber({ name: "", phone: "50400000000" });
      setMessage("Barbero agregado correctamente.");
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

  async function copyTvLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/tv`);
    setMessage("Enlace de pantalla pública copiado.");
  }

  return (
    <div className="grid gap-lg">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Panel de administración</h2>
            <p>Control operativo de la barbería, servicios, barberos, pagos y branding.</p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard label="Atendidos hoy" value={analytics.doneToday} />
          <StatCard label="Citas activas" value={analytics.appointments} />
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
              <h2>Branding y operación</h2>
              <p>Datos visibles para clientes y para la pantalla pública.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>Nombre de la barbería<input value={business.appName} onChange={(event) => setBusiness({ ...business, appName: event.target.value })} /></label>
            <label>Iniciales del logo<input value={business.logoText} maxLength={3} onChange={(event) => setBusiness({ ...business, logoText: event.target.value })} /></label>
            <label>Color principal<input type="color" value={business.themeColor} onChange={(event) => setBusiness({ ...business, themeColor: event.target.value })} /></label>
            <label>WhatsApp<input value={business.whatsapp} onChange={(event) => setBusiness({ ...business, whatsapp: event.target.value })} /></label>
            <label>Dirección<input value={business.address} onChange={(event) => setBusiness({ ...business, address: event.target.value })} /></label>
            <label>Horario<input value={business.hours} onChange={(event) => setBusiness({ ...business, hours: event.target.value })} /></label>
          </div>

          <label>
            Mensaje público
            <textarea value={business.publicMessage} onChange={(event) => setBusiness({ ...business, publicMessage: event.target.value })} />
          </label>

          <div className="actions">
            <button className="btn primary" onClick={saveBusiness}><Save size={17} />Guardar cambios</button>
            <button className="btn ghost" onClick={copyTvLink}><Copy size={17} />Copiar enlace TV</button>
          </div>
          {message && <div className="alert info">{message}</div>}
        </div>

        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Datos bancarios</h2>
              <p>Información usada en pago QR y validación manual de comprobantes.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>Banco<input value={payment.bankName} onChange={(event) => setPayment({ ...payment, bankName: event.target.value })} /></label>
            <label>Titular<input value={payment.accountHolder} onChange={(event) => setPayment({ ...payment, accountHolder: event.target.value })} /></label>
            <label>Cuenta<input value={payment.accountNumberMasked} onChange={(event) => setPayment({ ...payment, accountNumberMasked: event.target.value })} /></label>
            <label>WhatsApp de pagos<input value={payment.whatsapp} onChange={(event) => setPayment({ ...payment, whatsapp: event.target.value })} /></label>
          </div>

          <label>
            Nota del QR
            <textarea value={payment.qrNote} onChange={(event) => setPayment({ ...payment, qrNote: event.target.value })} />
          </label>

          <button className="btn primary" onClick={savePayment}><Save size={17} />Guardar banco</button>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Servicios e imágenes</h2>
            <p>Las imágenes quedan preparadas para URL pública y futura sincronización con Firebase Storage.</p>
          </div>
        </div>

        <div className="form-grid">
          <label>Servicio<input value={newService.name} onChange={(event) => setNewService({ ...newService, name: event.target.value })} /></label>
          <label>Descripción<input value={newService.description} onChange={(event) => setNewService({ ...newService, description: event.target.value })} /></label>
          <label>Precio L<input type="number" value={newService.price} onChange={(event) => setNewService({ ...newService, price: Number(event.target.value) })} /></label>
          <label>Duración min<input type="number" value={newService.duration} onChange={(event) => setNewService({ ...newService, duration: Number(event.target.value) })} /></label>
          <label>Etiqueta<input value={newService.icon} onChange={(event) => setNewService({ ...newService, icon: event.target.value })} /></label>
          <label>URL de imagen<input value={newService.imageUrl} onChange={(event) => setNewService({ ...newService, imageUrl: event.target.value })} placeholder="https://..." /></label>
          <label>Ruta Storage<input value={newService.imageStoragePath} onChange={(event) => setNewService({ ...newService, imageStoragePath: event.target.value })} placeholder="services/service-id/cover.jpg" /></label>
        </div>

        <button className="btn primary" onClick={createService}>Agregar servicio</button>

        <div className="divider" />
        <div className="stack">
          {state.services.map((service) => (
            <article className="service-admin-card" key={service.id}>
              <img src={getServiceImage(service)} alt={service.name} className="service-admin-preview" />
              <div className="service-admin-content">
                <div className="form-grid">
                  <label>Nombre<input value={draftMap[service.id]?.name || ""} onChange={(event) => syncDraft(service.id, "name", event.target.value)} /></label>
                  <label>Descripción<input value={draftMap[service.id]?.description || ""} onChange={(event) => syncDraft(service.id, "description", event.target.value)} /></label>
                  <label>Precio<input type="number" value={draftMap[service.id]?.price || 0} onChange={(event) => syncDraft(service.id, "price", Number(event.target.value))} /></label>
                  <label>Duración<input type="number" value={draftMap[service.id]?.duration || 0} onChange={(event) => syncDraft(service.id, "duration", Number(event.target.value))} /></label>
                  <label>Etiqueta<input value={draftMap[service.id]?.icon || ""} onChange={(event) => syncDraft(service.id, "icon", event.target.value)} /></label>
                  <label>URL de imagen<input value={draftMap[service.id]?.imageUrl || ""} onChange={(event) => syncDraft(service.id, "imageUrl", event.target.value)} /></label>
                  <label>Ruta Storage<input value={draftMap[service.id]?.imageStoragePath || ""} onChange={(event) => syncDraft(service.id, "imageStoragePath", event.target.value)} /></label>
                </div>

                <div className="actions">
                  <button className="btn primary" onClick={() => saveService(service.id)}><Save size={16} />Guardar</button>
                  <button className="btn danger" onClick={() => safeRemoveService(service.id)}><Trash2 size={16} />Eliminar</button>
                </div>
                <p>{moneyLempiras(service.price)} · {service.duration} min</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Barberos</h2>
            <p>Alta y baja de barberos del sistema.</p>
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
                <p>{barber.phone} · {barber.status}</p>
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
            <p>Validación manual de comprobantes enviados por QR o WhatsApp.</p>
          </div>
        </div>

        <div className="stack">
          {state.payments.filter((paymentItem) => paymentItem.status === "pending").length ? (
            state.payments.filter((paymentItem) => paymentItem.status === "pending").map((paymentItem) => (
              <article className="list-item" key={paymentItem.id}>
                <div className="queue-number">L</div>
                <div>
                  <strong>{paymentItem.clientName}</strong>
                  <p>{moneyLempiras(paymentItem.amount)} · {paymentItem.proofText}</p>
                  <MediaReferenceList items={paymentItem.mediaReferences || []} title="Comprobante" />
                </div>
                <div className="actions">
                  <button className="btn success" onClick={() => confirmPayment(paymentItem.id)}>Confirmar</button>
                  <button className="btn danger" onClick={() => rejectPayment(paymentItem.id)}>Rechazar</button>
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
