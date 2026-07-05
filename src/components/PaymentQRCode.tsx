import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { BusinessSettings, PaymentSettings } from "../types";

export function PaymentQRCode({
  business,
  payment
}: {
  business: BusinessSettings;
  payment: PaymentSettings;
}) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    const paymentUrl = `${window.location.origin}/pago`;

    QRCode.toDataURL(paymentUrl, {
      width: 360,
      margin: 1,
      color: {
        dark: "#111827",
        light: "#ffffff"
      }
    }).then(setSrc).catch(() => setSrc(""));
  }, []);

  return (
    <div className="qr-card payment-qr-card">
      {src ? <img src={src} alt="QR para abrir instrucciones de pago" /> : <div className="qr-placeholder">QR</div>}
      <strong>QR de pago</strong>
      <p>Escanea para abrir los datos de transferencia de {business.appName}.</p>
      <small>{payment.bankName} · {payment.accountHolder}</small>
    </div>
  );
}
