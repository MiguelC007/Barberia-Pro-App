import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "../components/Layout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import AppointmentsPage from "../pages/AppointmentsPage";
import BarberPanel from "../pages/BarberPanel";
import ChatBotPage from "../pages/ChatBotPage";
import ClientHome from "../pages/ClientHome";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import OwnerPanel from "../pages/OwnerPanel";
import PaymentPage from "../pages/PaymentPage";
import QueuePage from "../pages/QueuePage";
import SuperAdminPanel from "../pages/SuperAdminPanel";
import TicketEntryPage from "../pages/TicketEntryPage";
import TvScreenPage from "../pages/TvScreenPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/turno" element={<TicketEntryPage />} />
      <Route path="/tv" element={<TvScreenPage />} />
      <Route path="/pantalla" element={<Navigate to="/tv" replace />} />
      <Route path="/entrada" element={<Navigate to="/turno" replace />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<ClientHome />} />
          <Route path="/fila" element={<QueuePage />} />
          <Route path="/citas" element={<AppointmentsPage />} />
          <Route path="/chatbot" element={<ChatBotPage />} />
          <Route path="/pago" element={<PaymentPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowed={["barber", "owner", "super_admin"]} />}>
        <Route element={<Layout />}>
          <Route path="/barbero" element={<BarberPanel />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowed={["owner", "super_admin"]} />}>
        <Route element={<Layout />}>
          <Route path="/dueno" element={<OwnerPanel />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowed={["super_admin"]} />}>
        <Route element={<Layout />}>
          <Route path="/super-admin" element={<SuperAdminPanel />} />
        </Route>
      </Route>

      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
