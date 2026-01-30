
export enum ServiceStatus {
  INSPECTING = 'Inspecting',
  IN_PROGRESS = 'In Progress',
  READY = 'Ready'
}

export enum ServiceType {
  IN_SHOP = 'In Shop',
  PICKUP_DELIVERY = 'Pickup & Delivery'
}

export enum SubscriptionTier {
  NONE = 'None',
  SILVER = 'Silver',
  GOLD = 'Gold',
  PLATINUM = 'Platinum'
}

export interface SubscriptionRequest {
  id: string;
  clientName: string;
  phone: string;
  licensePlate: string;
  tier: SubscriptionTier;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface Subscription {
  tier: SubscriptionTier;
  startDate: string;
  endDate: string;
  benefits: string[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
}

export interface ClientInfo {
  id: string;
  name: string;
  phone: string;
  model: string;
  dateIn: string;
  licensePlate: string;
  address?: string;
  subscription?: Subscription;
}

export interface InspectionData {
  front: {
    handlebar: string;
    frontFork: string;
    tireRim: string;
    brakeSystem: string;
    lightsDashboard: string;
  };
  rear: {
    tireRim: string;
    suspension: string;
    exhaust: string;
    brakes: string;
    tailLight: string;
  };
  engine: {
    rightCover: string;
    leftCover: string;
    coolingSystem: string;
    performance: string;
  };
  driveSystem: {
    frontSprocket: string;
    rearSprocket: string;
    chain: string;
  };
}

export interface Job {
  id: string;
  client: ClientInfo;
  inspection: InspectionData;
  status: ServiceStatus;
  serviceType: ServiceType;
  items: InvoiceItem[];
  totalCost: number;
  technicianNotes: string;
  motorcyclePhoto?: string;
  nextOilChangeDate?: string;
  mileage?: number;
}
