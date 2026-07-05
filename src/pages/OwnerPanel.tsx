import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Copy, ImagePlus, Save, Trash2, X } from "lucide-react";
import { MediaReferenceList } from "../components/MediaReferenceList";
import { StatCard } from "../components/StatCard";
import { addBarber, removeBarber } from "../services/barberService";
import { getBasicAnalytics } from "../services/analyticsService";
import { mutateAppState, useAppData } from "../services/localStore";
import { confirmPayment, rejectPayment, updatePaymentSettings } from "../services/paymentService";
import { addService, removeService, updateService } from "../services/serviceService";
import { updateBusinessSettings } from "../services/settingsService";
import type { InspirationItem, Service } from "../types";
import { moneyLempiras, maskAccount } from "../utils/format";
import { fileToDataUrl } from "../utils/imageFiles";
import { getEditableInspirationItems, getInspirationImage } from "../utils/inspiration";
import { getServiceImage } from "../utils/serviceImages";

type ServiceDraft = {
  name: string;
  description: string;
  price: number;
  duration: number;
  icon: string;
  imageUrl: string;
  imageStoragePath: string;
};

type InspirationDraft = {
  title: string;
  description: string;
  imageUrl: string;
  imageStoragePath: string;
  active: boolean;
};

function buildServiceDraft(service: Service): ServiceDraft {
  return {
    name: service.name,
    description: service.description,
    price: service.price,
    duration: service.duration,
    icon: service.icon || "",
    imageUrl: service.imageUrl || "",
    imageStoragePath: service.imageStoragePath || ""
  };
}

async function readImageInput(event: ChangeEvent<HTMLInputElement>): Promise<string | null> {
  const file = event.currentTarget.files?.[0];
  event.currentTarget.value = "";

  if (!file) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Selecciona una imagen válida.");
  }

  return fileToDataUrl(file);
}

function editableUrlValue(value: string): string {
  return value.startsWith("data:image/") ? "" : value;
}

function imageUrlPlaceholder(value: string): string {
  return value.startsWith("data:image/") ? "Imagen cargada desde archivo" : "https://...";
}

export default function OwnerPanel() {
  const state = useAppData();
  const analytics = getBasicAnalytics();
  const [business, setBusiness] = useState(state.business);
  const [payment, setPayment] = useState(state.paymentSettings);
  const [newService, setNewService] = useState<ServiceDraft>({
    name: "",
    description: "",
    price: 150,
    duration: 30,
    icon: "",
    imageUrl: "",
    imageStoragePath: ""
  });
  const [newBarber, setNewBarber] = useState({ name: "", phone: "50400000000" });
  const [message, setMessage] = useState("");

  const serviceDrafts = useMemo<Record<string, ServiceDraft>>(
    () =>
      Object.fromEntries(
        state.services.map((service) => [
          service.id,
          buildServiceDraft(service)
        ])
      ) as Record<string, ServiceDraft>,
    [state.services]
  );

  const [draftMap, setDraftMap] = useState<Record<string, ServiceDraft>>(serviceDrafts);

  const inspirationItems = useMemo(
    () => getEditableInspirationItems(state.inspiration),
    [state.inspiration]
  );

  const inspirationDrafts = useMemo<Record<string, InspirationDraft>>(
    () =>
      Object.fromEntries(
        inspirationItems.map((item) => [
          item.id,
          {
            title: item.title,
            description: item.description,
            imageUrl: item.imageUrl || "",
            imageStoragePath: item.imageStoragePath || "",
            active: item.active
          }
        ])
      ) as Record<string, InspirationDraft>,
    [inspirationItems]
  );

  const [inspirationMap, setInspirationMap] = useState<Record<string, InspirationDraft>>(inspirationDrafts);

  useEffect(() => {
    setDraftMap(serviceDrafts);
  }, [serviceDrafts]);

  useEffect(() => {
    setInspirationMap(inspirationDrafts);
  }, [inspirationDrafts]);

  function syncDraft(serviceId: string, field: keyof ServiceDraft, value: string | number) {
    setDraftMap((current) => ({
      ...current,
      [serviceId]: {
        ...current[serviceId],
        [field]: value
      }
    }));
  }

  function syncInspiration(itemId: string, field: keyof InspirationDraft, value: string | boolean) {
    setInspirationMap((current) => ({
      ...current,
      [itemId]: {
        ...current[itemId],
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
      setNewService({ name: "", description: "", price: 150, duration: 30, icon: "", imageUrl: "", imageStoragePath: "" });
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

  async function handleNewServiceImage(event: ChangeEvent<HTMLInputElement>) {
    try {
      const imageUrl = await readImageInput(event);
      if (!imageUrl) return;

      setNewService((current) => ({
        ...current,
        imageUrl,
        imageStoragePath: ""
      }));
      setMessage("Imagen cargada para el nuevo servicio. Agrega el servicio para conservarla.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo cargar la imagen.");
    }
  }

  async function handleServiceImage(serviceId: string, event: ChangeEvent<HTMLInputElement>) {
    try {
      const imageUrl = await readImageInput(event);
      if (!imageUrl) return;

      setDraftMap((current) => ({
        ...current,
        [serviceId]: {
          ...current[serviceId],
          imageUrl,
          imageStoragePath: ""
        }
      }));
      setMessage("Imagen cargada. Presiona Guardar para conservar el cambio.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo cargar la imagen.");
    }
  }

  function clearServiceImage(serviceId: string) {
    setDraftMap((current) => ({
      ...current,
      [serviceId]: {
        ...current[serviceId],
        imageUrl: "",
        imageStoragePath: ""
      }
    }));
    setMessage("Imagen removida del borrador. Presiona Guardar para aplicar.");
  }

  function saveInspirationItem(itemId: string) {
    const draft = inspirationMap[itemId];

    if (!draft?.title.trim()) {
      setMessage("El nombre de la inspiración es obligatorio.");
      return;
    }

    mutateAppState((current) => ({
      ...current,
      inspiration: getEditableInspirationItems(current.inspiration).map((item) =>
        item.id === itemId
          ? {
              ...item,
              title: draft.title.trim(),
              description: draft.description.trim(),
              imageUrl: draft.imageUrl.trim(),
              imageStoragePath: draft.imageStoragePath.trim(),
              active: draft.active
            }
          : item
      )
    }));

    setMessage("Inspiración actualizada.");
  }

  async function handleInspirationImage(itemId: string, event: ChangeEvent<HTMLInputElement>) {
    try {
      const imageUrl = await readImageInput(event);
      if (!imageUrl) return;

      setInspirationMap((current) => ({
        ...current,
        [itemId]: {
          ...current[itemId],
          imageUrl,
          imageStoragePath: ""
        }
      }));
      setMessage("Imagen cargada. Presiona Guardar para conservar el cambio.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo cargar la imagen.");
    }
  }

  function clearInspirationImage(itemId: string) {
    setInspirationMap((current) => ({
      ...current,
      [itemId]: {
        ...current[itemId],
        imageUrl: "",
        imageStoragePath: ""
      }
    }));
    setMessage("Imagen removida del borrador. Presiona Guardar para aplicar.");
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

  const newServicePreview: Service = {
    id: "new_service_preview",
    ...newService,
    active: true
  };

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
            <label>
              Nombre de la barbería
              <input value={business.appName} onChange={(event) => setBusiness({ ...business, appName: event.target.value })} />
            </label>

            <label>
              Iniciales del logo
              <input value={business.logoText} maxLength={3} onChange={(event) => setBusiness({ ...business, logoText: event.target.value })} />
            </label>

            <label>
              Color principal
              <input type="color" value={business.themeColor} onChange={(event) => setBusiness({ ...business, themeColor: event.target.value })} />
            </label>

            <label>
              WhatsApp
              <input value={business.whatsapp} onChange={(event) => setBusiness({ ...business, whatsapp: event.target.value })} />
            </label>

            <label>
              Dirección
              <input value={business.address} onChange={(event) => setBusiness({ ...business, address: event.target.value })} />
            </label>

            <label>
              Horario
              <input value={business.hours} onChange={(event) => setBusiness({ ...business, hours: event.target.value })} />
            </label>
          </div>

          <label>
            Mensaje público
            <textarea value={business.publicMessage} onChange={(event) => setBusiness({ ...business, publicMessage: event.target.value })} />
          </label>

          <div className="actions">
            <button className="btn primary" onClick={saveBusiness}>
              <Save size={17} />
              Guardar cambios
            </button>

            <button className="btn ghost" onClick={copyTvLink}>
              <Copy size={17} />
              Copiar enlace TV
            </button>
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
            <label>
              Banco
              <input value={payment.bankName} onChange={(event) => setPayment({ ...payment, bankName: event.target.value })} />
            </label>

            <label>
              Titular
              <input value={payment.accountHolder} onChange={(event) => setPayment({ ...payment, accountHolder: event.target.value })} />
            </label>

            <label>
              Cuenta
              <input value={payment.accountNumberMasked} onChange={(event) => setPayment({ ...payment, accountNumberMasked: event.target.value })} />
            </label>

            <label>
              WhatsApp de pagos
              <input value={payment.whatsapp} onChange={(event) => setPayment({ ...payment, whatsapp: event.target.value })} />
            </label>
          </div>

          <label>
            Nota del QR
            <textarea value={payment.qrNote} onChange={(event) => setPayment({ ...payment, qrNote: event.target.value })} />
          </label>

          <button className="btn primary" onClick={savePayment}>
            <Save size={17} />
            Guardar banco
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Servicios e imágenes</h2>
            <p>Actualiza nombre, precio, duración e imagen visible para clientes.</p>
          </div>
        </div>

        <div className="service-create-grid">
          <div className="service-admin-image-box">
            <img src={getServiceImage(newServicePreview)} alt="Vista previa del nuevo servicio" className="service-admin-preview" />

            <label className="btn ghost file-button">
              <ImagePlus size={16} />
              Subir imagen
              <input type="file" accept="image/*" onChange={(event) => void handleNewServiceImage(event)} />
            </label>

            {newService.imageUrl && (
              <button className="btn danger" onClick={() => setNewService((current) => ({ ...current, imageUrl: "", imageStoragePath: "" }))}>
                <X size={16} />
                Quitar imagen
              </button>
            )}
          </div>

          <div className="form-grid">
            <label>
              Servicio
              <input value={newService.name} onChange={(event) => setNewService({ ...newService, name: event.target.value })} />
            </label>

            <label>
              Descripción
              <input value={newService.description} onChange={(event) => setNewService({ ...newService, description: event.target.value })} />
            </label>

            <label>
              Precio L
              <input type="number" value={newService.price} onChange={(event) => setNewService({ ...newService, price: Number(event.target.value) })} />
            </label>

            <label>
              Duración min
              <input type="number" value={newService.duration} onChange={(event) => setNewService({ ...newService, duration: Number(event.target.value) })} />
            </label>

            <label>
              Etiqueta opcional
              <input value={newService.icon} onChange={(event) => setNewService({ ...newService, icon: event.target.value })} placeholder="Ej. SB, ✂️ o vacío" />
            </label>

            <label>
              URL de imagen opcional
              <input
                value={editableUrlValue(newService.imageUrl)}
                onChange={(event) => setNewService({ ...newService, imageUrl: event.target.value, imageStoragePath: "" })}
                placeholder={imageUrlPlaceholder(newService.imageUrl)}
              />
            </label>
          </div>
        </div>

        <button className="btn primary" onClick={createService}>
          Agregar servicio
        </button>

        <div className="divider" />

        <div className="stack">
          {state.services.map((service) => {
            const draft = draftMap[service.id] || buildServiceDraft(service);
            const previewService: Service = { ...service, ...draft };

            return (
              <article className="service-admin-card" key={service.id}>
                <div className="service-admin-image-box">
                  <img src={getServiceImage(previewService)} alt={draft.name} className="service-admin-preview" />

                  <div className="service-admin-image-actions">
                    <label className="btn ghost file-button">
                      <ImagePlus size={16} />
                      Cambiar foto
                      <input type="file" accept="image/*" onChange={(event) => void handleServiceImage(service.id, event)} />
                    </label>

                    {draft.imageUrl && (
                      <button className="btn danger" onClick={() => clearServiceImage(service.id)}>
                        <X size={16} />
                        Quitar
                      </button>
                    )}
                  </div>
                </div>

                <div className="service-admin-content">
                  <div className="form-grid">
                    <label>
                      Nombre
                      <input value={draft.name} onChange={(event) => syncDraft(service.id, "name", event.target.value)} />
                    </label>

                    <label>
                      Descripción
                      <input value={draft.description} onChange={(event) => syncDraft(service.id, "description", event.target.value)} />
                    </label>

                    <label>
                      Precio
                      <input type="number" value={draft.price} onChange={(event) => syncDraft(service.id, "price", Number(event.target.value))} />
                    </label>

                    <label>
                      Duración
                      <input type="number" value={draft.duration} onChange={(event) => syncDraft(service.id, "duration", Number(event.target.value))} />
                    </label>

                    <label>
                      Etiqueta opcional
                      <input value={draft.icon} onChange={(event) => syncDraft(service.id, "icon", event.target.value)} placeholder="Vacío = no mostrar etiqueta" />
                    </label>

                    <label>
                      URL de imagen opcional
                      <input
                        value={editableUrlValue(draft.imageUrl)}
                        onChange={(event) => syncDraft(service.id, "imageUrl", event.target.value)}
                        placeholder={imageUrlPlaceholder(draft.imageUrl)}
                      />
                    </label>
                  </div>

                  <div className="actions">
                    <button className="btn primary" onClick={() => saveService(service.id)}>
                      <Save size={16} />
                      Guardar
                    </button>

                    <button className="btn danger" onClick={() => safeRemoveService(service.id)}>
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </div>

                  <p>{moneyLempiras(draft.price)} · {draft.duration} min</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Galería de inspiración</h2>
            <p>Edita imágenes, URLs y textos que aparecen en la página principal.</p>
          </div>
        </div>

        <div className="cards-grid owner-trend-grid">
          {inspirationItems.map((item) => {
            const draft =
              inspirationMap[item.id] || {
                title: item.title,
                description: item.description,
                imageUrl: item.imageUrl || "",
                imageStoragePath: item.imageStoragePath || "",
                active: item.active
              };

            const previewItem: InspirationItem = {
              id: item.id,
              title: draft.title,
              description: draft.description,
              imageUrl: draft.imageUrl,
              imageStoragePath: draft.imageStoragePath,
              active: draft.active
            };

            return (
              <article className="owner-trend-card" key={item.id}>
                <img src={getInspirationImage(previewItem)} alt={draft.title} className="owner-trend-preview" />

                <div className="owner-trend-content">
                  <div className="form-grid">
                    <label>
                      Nombre
                      <input value={draft.title} onChange={(event) => syncInspiration(item.id, "title", event.target.value)} />
                    </label>

                    <label>
                      Descripción
                      <input value={draft.description} onChange={(event) => syncInspiration(item.id, "description", event.target.value)} />
                    </label>

                    <label className="owner-image-url-field">
                      URL de imagen opcional
                      <input
                        value={editableUrlValue(draft.imageUrl)}
                        onChange={(event) => syncInspiration(item.id, "imageUrl", event.target.value)}
                        placeholder={imageUrlPlaceholder(draft.imageUrl)}
                      />
                    </label>
                  </div>

                  <p className="field-help">
                    Puedes pegar una URL pública o subir una imagen desde tu computadora/celular. Si subes archivo, queda guardado localmente y listo para sincronizar después.
                  </p>

                  <div className="actions">
                    <label className="btn ghost file-button">
                      <ImagePlus size={16} />
                      Cambiar imagen
                      <input type="file" accept="image/*" onChange={(event) => void handleInspirationImage(item.id, event)} />
                    </label>

                    {draft.imageUrl && (
                      <button className="btn danger" onClick={() => clearInspirationImage(item.id)}>
                        <X size={16} />
                        Quitar
                      </button>
                    )}

                    <button className="btn primary" onClick={() => saveInspirationItem(item.id)}>
                      <Save size={16} />
                      Guardar
                    </button>
                  </div>

                  <label className="inline-check">
                    <input
                      type="checkbox"
                      checked={draft.active}
                      onChange={(event) => syncInspiration(item.id, "active", event.target.checked)}
                    />
                    Mostrar en inicio
                  </label>
                </div>
              </article>
            );
          })}
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
          <label>
            Nombre
            <input value={newBarber.name} onChange={(event) => setNewBarber({ ...newBarber, name: event.target.value })} />
          </label>

          <label>
            WhatsApp
            <input value={newBarber.phone} onChange={(event) => setNewBarber({ ...newBarber, phone: event.target.value })} />
          </label>
        </div>

        <button className="btn primary" onClick={createBarber}>
          Agregar barbero
        </button>

        <div className="divider" />

        <div className="stack">
          {state.barbers.map((barber) => (
            <article className="list-item" key={barber.id}>
              <div className="queue-number">{barber.name.slice(0, 2).toUpperCase()}</div>

              <div>
                <strong>{barber.name}</strong>
                <p>{barber.phone} · {barber.status}</p>
              </div>

              <button className="btn danger" onClick={() => safeRemoveBarber(barber.id)}>
                <Trash2 size={16} />
              </button>
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
            state.payments
              .filter((paymentItem) => paymentItem.status === "pending")
              .map((paymentItem) => (
                <article className="list-item" key={paymentItem.id}>
                  <div className="queue-number">L</div>

                  <div>
                    <strong>{paymentItem.clientName}</strong>
                    <p>{moneyLempiras(paymentItem.amount)} · {paymentItem.proofText}</p>
                    <MediaReferenceList items={paymentItem.mediaReferences || []} title="Comprobante" />
                  </div>

                  <div className="actions">
                    <button className="btn success" onClick={() => confirmPayment(paymentItem.id)}>
                      Confirmar
                    </button>

                    <button className="btn danger" onClick={() => rejectPayment(paymentItem.id)}>
                      Rechazar
                    </button>
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
