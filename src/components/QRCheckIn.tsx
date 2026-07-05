import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QRCheckIn() {
  const [src, setSrc] = useState("");

  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}/turno`, {
      width: 360,
      margin: 1,
      color: {
        dark: "#111827",
        light: "#ffffff"
      }
    }).then(setSrc).catch(() => setSrc(""));
  }, []);

  return (
    <div className="qr-card">
      {src ? <img src={src} alt="QR de entrada para tomar turno" /> : <div className="qr-placeholder">QR</div>}
      <strong>QR de entrada</strong>
      <p>Al escanear, el cliente toma turno y recibe su ticket automaticamente.</p>
    </div>
  );
}
