import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="center-screen">
      <div className="loader-card">
        <h2>Ruta no encontrada</h2>
        <p>La página que buscás no existe en esta app.</p>
        <Link className="btn primary" to="/">Volver al inicio</Link>
      </div>
    </div>
  );
}
