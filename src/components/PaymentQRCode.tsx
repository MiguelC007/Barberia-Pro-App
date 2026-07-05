import { useEffect, useMemo, useState } from "react";
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

  const qrText = useMemo(() => {
    return [
      `Negocio: ${business.appName}`,
      `Banco: ${payment.bankName}`,
      `Titular: ${payment.accountHolder}`,
      `Cuenta: ${payment.accountNumberMasked}`,
      `WhatsApp: ${payment.whatsapp}`,
      payment.qrNote
    ].join("\n");
  }, [business, payment]);

  useEffect(() => {
    QRCode.toDataURL(qrText, {
      width: 360,
      margin: 1,
      color: {
        dark: "#111827",
        light: "#ffffff"
      }
    }).then(setSrc).catch(() => setSrc(""));
  }, [qrText]);

  return (
    <div className="qr-card">
      {src ? <img src={src} alt="QR de pago" /> : <div className="qr-placeholder">QR</div>}
      <strong>QR de pago</strong>
      <p>{payment.bankName} · {payment.accountHolder}</p>
    </div>
  );
}
