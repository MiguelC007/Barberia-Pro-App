export type UserRole = "super_admin" | "owner" | "barber" | "client" | "guest";

export type BarberStatus = "available" | "busy" | "break" | "offline";
export type QueueStatus = "waiting" | "next" | "called" | "in_service" | "completed" | "done" | "skipped" | "cancelled";
export type QueueSource = "qr" | "manual" | "client" | "admin";
export type AppointmentStatus =
  | "pending"
  | "scheduled"
  | "confirmed"
  | "checked_in"
  | "in_service"
  | "cancelled"
  | "completed"
  | "no_show";
export type PaymentStatus = "pending" | "confirmed" | "rejected";

export interface MediaReference {
  id: string;
  type: "image" | "video" | "audio" | "file";
  name: string;
  url: string;
  createdAt: number;
  attachedTo?: "chat" | "ticket" | "appointment" | "payment";
}

export interface AppUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  barberId?: string | null;
  createdAt: number;
  active: boolean;
}

export interface Barber {
  id: string;
  userId?: string | null;
  name: string;
  phone: string;
  photo?: string;
  status: BarberStatus;
  currentQueueId?: string | null;
  currentClientName?: string | null;
  serviceStartedAt?: number | null;
  doneToday: number;
  specialties: string[];
  active: boolean;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  icon: string;
  imageUrl?: string;
  imageStoragePath?: string;
  active: boolean;
}

export interface QueueItem {
  id: string;
  barberShopId?: string;
  ticketCode?: string;
  dailySequenceNumber?: number;
  clientId?: string | null;
  clientName: string;
  clientPhone?: string;
  whatsapp?: string;
  deviceId?: string;
  source?: QueueSource;
  serviceId: string;
  serviceName?: string;
  estimatedDurationMinutes?: number;
  preferredBarberId?: string | null;
  assignedBarberId?: string | null;
  status: QueueStatus;
  note?: string;
  notes?: string;
  position?: number;
  createdAt?: number;
  waitStartedAt?: number;
  estimatedStartAt?: number | null;
  estimatedEndAt?: number | null;
  joinedAt: number;
  calledAt?: number | null;
  startedAt?: number | null;
  serviceStartedAt?: number | null;
  serviceEndedAt?: number | null;
  finishedAt?: number | null;
  completedAt?: number | null;
  skippedAt?: number | null;
  cancelledAt?: number | null;
  mediaReferences?: MediaReference[];
}

export interface Appointment {
  id: string;
  barberShopId?: string;
  clientId?: string | null;
  clientName: string;
  clientPhone?: string;
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  source: "manual" | "bot" | "client";
  createdAt: number;
  checkedInAt?: number | null;
  startedAt?: number | null;
  completedAt?: number | null;
  noShowAt?: number | null;
  graceMinutes?: number;
  mediaReferences?: MediaReference[];
}

export interface PaymentSettings {
  bankName: string;
  accountHolder: string;
  accountNumberMasked: string;
  whatsapp: string;
  qrNote: string;
  editableOnlyByOwner: boolean;
}

export interface BusinessSettings {
  appName: string;
  appSlug: string;
  logo: string;
  logoText: string;
  themeColor: string;
  address: string;
  whatsapp: string;
  hours: string;
  publicMessage: string;
  isMarketplace: false;
  ownerCanEditPayments: boolean;
  allowGuestClients: boolean;
}

export interface Payment {
  id: string;
  clientName: string;
  amount: number;
  status: PaymentStatus;
  proofText?: string;
  createdAt: number;
  confirmedAt?: number | null;
  mediaReferences?: MediaReference[];
}

export interface AppState {
  business: BusinessSettings;
  paymentSettings: PaymentSettings;
  users: AppUser[];
  barbers: Barber[];
  services: Service[];
  queue: QueueItem[];
  appointments: Appointment[];
  payments: Payment[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SessionUser extends AppUser {
  isDemo: boolean;
}
