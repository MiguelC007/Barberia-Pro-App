import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { initializeAppStore } from "../services/localStore";
import { AppRoutes } from "./routes";

export default function App() {
  useEffect(() => {
    return initializeAppStore();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
