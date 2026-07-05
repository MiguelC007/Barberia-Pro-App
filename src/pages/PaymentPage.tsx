import { useState } from "react";
import { MessageCircle, Save } from "lucide-react";
import { MediaCapturePanel } from "../components/MediaCapturePanel";
import { MediaReferenceList } from "../components/MediaReferenceList";
import { PaymentQRCode } from "../components/PaymentQRCode";
import { RoleGuard } from "../context/RoleGuard";
import { useAuth } from "../context/AuthContext";
import { createPaymentProof, updatePaymentSettings } from "../services/paymentService";
import { useAppData } from "../services/localStore";
import type { MediaReference } from "../types";
import { maskAccount, whatsappLink } from "../utils/format";

export default function PaymentPage() {
  const state = useAppData();
  const { user } = useAuth();
  const [bankName, setBankName] = useState(state.paymentSettings.bankName);
  const [accountHolder, setAccountHolder] = useState(state.paymentSettings.accountHolder);
  const [accountNumber, setAccountNumber] = useState(state.paymentSettings.accountNumberMasked);
  const [whatsapp, setWhatsapp] = useState(state.paymentSettings.whatsapp);
  const [amount, setAmount] = useState(state.services.find((service) => service.active)?.price || 0);
  const [proofText, setProofText] = useState("");
  const [proofMedia, setProofMedia] = useState<MediaReference[]>([]);
  const [message, setMessage] = useState("");

  function saveSettings() {
    try {
      updatePaymentSettings({
        bankName,
        accountHolder,
        accountNumberMasked: maskAccount(accountNumber),
        whatsapp,
        qrNote: state.paymentSettings.qrNote,
        editableOnlyByOwner: true
      });
      setMessage("Datos de pago actualizados correctamente.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudieron actualizar los datos de pago.");
    }
  }

  function sendProof() {
    try {
      createPaymentProof({
        clientName: user?.name || "Cliente",
        amount,
        proofText: proofText || "Comprobante enviado por el cliente.",
        mediaReferences: proofMedia
      });
      setProofText("");
      setProofMedia([]);
      setMessage("Comprobante enviado correctamente. Queda pendiente de validación.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo registrar el comprobante.");
    }
  }

  async function addProofMedia(media: MediaReference[]) {
    setProofMedia((current) => [...current, ...media]);
  }

  return (
    <div className="dashboard-grid">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Pago por QR</h2>
            <p>Transfiere, adjunta tu comprobante y recibe confirmación desde administración.</p>
          </div>
        </div>

        <PaymentQRCode business={state.business} payment={state.paymentSettings} />

        <div className="summary-card">
          <strong>{state.business.appName}</strong>
          <p>Banco: {state.paymentSettings.bankName}</p>
          <p>Titular: {state.paymentSettings.accountHolder}</p>
          <p>Cuenta: {state.paymentSettings.accountNumberMasked}</p>
        </div>

        <div className="form-grid">
          <label>
            Monto pagado L
            <input type="number" min={1} value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
          </label>
          <label>
            Nota del comprobante
            <input value={proofText} onChange={(event) => setProofText(event.target.value)} placeholder="Ej. transferencia BAC 1234" />
          </label>
        </div>

        <MediaCapturePanel onAdd={addProofMedia} labels={{ photo: "Tomar foto del comprobante", video: "Grabar video", file: "Subir comprobante" }} />
        <MediaReferenceList items={proofMedia} title="Comprobante adjunto" />

        <div className="actions">
          <button className="btn primary" onClick={sendProof}>Ya realicé el pago</button>
          <a className="btn blue" href={whatsappLink(state.paymentSettings.whatsapp, `Hola, envío comprobante de pago para ${state.business.appName}.`)} target="_blank" rel="noreferrer">
            <MessageCircle size={17} />
            Enviar por WhatsApp
          </a>
        </div>

        {message && <div className="alert info">{message}</div>}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Configurar datos bancarios</h2>
            <p>Acceso privado para administración del negocio.</p>
          </div>
        </div>

        <RoleGuard
          allowed={["owner", "super_admin"]}
          fallback={<div className="alert danger">No tienes permiso para modificar los datos bancarios.</div>}
        >
          <div className="form-grid">
            <label>
              Banco
              <input value={bankName} onChange={(event) => setBankName(event.target.value)} />
            </label>
            <label>
              Titular
              <input value={accountHolder} onChange={(event) => setAccountHolder(event.target.value)} />
            </label>
            <label>
              Número de cuenta
              <input value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} />
            </label>
            <label>
              WhatsApp de comprobantes
              <input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} />
            </label>
          </div>
          <button className="btn primary" onClick={saveSettings}><Save size={17} /> Guardar QR de pago</button>
        </RoleGuard>
      </section>
    </div>
  );
}
