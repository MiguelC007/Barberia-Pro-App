import type { AppState, AppUser } from "../types";
import { BARBERSHOP_CONFIG } from "../config/barbershop.config";

const now = Date.now();

export const demoUsers: Array<AppUser & { password: string }> = [
  {
    id: "user_super",
    name: "Miguel Carranza",
    email: "super@barberhn.com",
    password: "123456",
    phone: "50400000000",
    role: "super_admin",
    barberId: null,
    createdAt: now,
    active: true
  },
  {
    id: "user_owner",
    name: "Spencer",
    email: "spencer@spencerbarber.com",
    password: "123456",
    phone: "50400000000",
    role: "owner",
    barberId: "barber_spencer",
    createdAt: now,
    active: true
  }
];

export const initialAppState: AppState = {
  business: {
    ...BARBERSHOP_CONFIG,
    logoText: "SB",
    hours: "Lun-Sab 9:00 AM - 8:00 PM",
    publicMessage: "Toma tu turno al llegar, escanea el QR y mira tu tiempo estimado en vivo."
  },
  paymentSettings: {
    bankName: "Banco Demo",
    accountHolder: "Spencer Barber Shop",
    accountNumberMasked: "****0000",
    whatsapp: "50400000000",
    qrNote: "Pago manual por transferencia. Enviar comprobante por WhatsApp.",
    editableOnlyByOwner: true
  },
  users: demoUsers.map(({ password: _password, ...user }) => user),
  barbers: [
    {
      id: "barber_spencer",
      userId: "user_owner",
      name: "Spencer",
      phone: "50400000000",
      photo: "",
      status: "available",
      currentQueueId: null,
      currentClientName: null,
      serviceStartedAt: null,
      doneToday: 0,
      specialties: ["Fade", "Corte clasico", "Corte + Barba"],
      active: true
    }
  ],
  services: [
    {
      id: "service_classic",
      name: "Corte clasico",
      description: "Corte limpio y profesional para diario.",
      price: 120,
      duration: 25,
      icon: "SB",
      active: true
    },
    {
      id: "service_fade",
      name: "Fade / Degradado",
      description: "Degradado moderno con acabado limpio.",
      price: 150,
      duration: 35,
      icon: "SB",
      active: true
    },
    {
      id: "service_beard",
      name: "Corte + Barba",
      description: "Corte completo con perfilado de barba.",
      price: 200,
      duration: 45,
      icon: "SB",
      active: true
    },
    {
      id: "service_design",
      name: "Cejas / Diseno",
      description: "Detalles rapidos y diseno basico.",
      price: 80,
      duration: 15,
      icon: "SB",
      active: true
    }
  ],
  queue: [],
  appointments: [],
  payments: []
};
