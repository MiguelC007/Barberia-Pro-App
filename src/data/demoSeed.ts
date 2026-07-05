import type { AppState, AppUser } from "../types";
import { BARBERSHOP_CONFIG } from "../config/barbershop.config";
import { defaultInspirationItems } from "../utils/inspiration";

const now = Date.now();

const serviceImages = {
  classic:
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80",
  fade:
    "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=1200&q=80",
  beard:
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80",
  detail:
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80"
};

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
    hours: "Lun-Sáb 9:00 a. m. - 8:00 p. m.",
    publicMessage: "Escanea el QR al llegar, recibe tu ticket y sigue tu turno en tiempo real."
  },
  paymentSettings: {
    bankName: "Banco configurado",
    accountHolder: "Spencer Barber Shop",
    accountNumberMasked: "****0000",
    whatsapp: "50400000000",
    qrNote: "Pago por transferencia. Comparte tu comprobante por WhatsApp para validación.",
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
      specialties: ["Fade", "Corte clásico", "Corte + barba"],
      active: true
    }
  ],
  services: [
    {
      id: "service_classic",
      name: "Corte clásico",
      description: "Corte limpio y profesional para el día a día.",
      price: 120,
      duration: 25,
      icon: "SB",
      imageUrl: serviceImages.classic,
      imageStoragePath: "",
      active: true
    },
    {
      id: "service_fade",
      name: "Fade / Degradado",
      description: "Degradado moderno con acabado preciso y prolijo.",
      price: 150,
      duration: 35,
      icon: "SB",
      imageUrl: serviceImages.fade,
      imageStoragePath: "",
      active: true
    },
    {
      id: "service_beard",
      name: "Corte + barba",
      description: "Atención completa con perfilado de barba incluido.",
      price: 200,
      duration: 45,
      icon: "SB",
      imageUrl: serviceImages.beard,
      imageStoragePath: "",
      active: true
    },
    {
      id: "service_design",
      name: "Cejas / Diseño",
      description: "Detalles rápidos y definición estética profesional.",
      price: 80,
      duration: 15,
      icon: "SB",
      imageUrl: serviceImages.detail,
      imageStoragePath: "",
      active: true
    }
  ],
  inspiration: defaultInspirationItems,
  queue: [],
  appointments: [],
  payments: []
};
