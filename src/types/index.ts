export type SystemType = 'analog' | 'ip' | 'wireless';

export type BrandKey = 'hikvision' | 'dahua' | 'hilook' | 'ezviz';

export type CameraResolution = '2MP' | '5MP' | '8MP';

export type LensType = '2.8' | '3.6' | '6' | '12';

export interface LensConfig {
  fov: number; // degrees
  len: number; // meters range
  desc: string;
}

export interface ProductItem {
  id: string;
  name: string;
  brand: BrandKey;
  category: 'camera' | 'dvr' | 'nvr' | 'cable' | 'box' | 'rack' | 'hdd' | 'power';
  resolution?: CameraResolution;
  channels?: number;
  capacity?: string;
  cost: number;
  techPrice: number;
  active: boolean;
}

export interface ShopProduct {
  id: string;
  title: string;
  brand: BrandKey;
  category: 'cameras' | 'recorders' | 'storage' | 'cables' | 'accessories' | 'smart_kits';
  price: number; // Wholesale / Client retail EGP
  cost: number;  // Wholesale cost EGP
  image: string;
  badge?: string;
  inStock: boolean;
  resolution?: CameraResolution;
  specs: string[];
  description: string;
}

export interface CartItem {
  product: ShopProduct;
  quantity: number;
}

export interface TechnicianApplication {
  id: string;
  created_at: string;
  fullName: string;
  nationalId: string; // 14 digits Egyptian National ID
  phone: string;
  governorate: string;
  experienceYears: number;
  specialization: ('analog' | 'ip' | 'access_control' | 'intercom')[];
  toolsOwned: string[];
  criminalRecordPledged: boolean;
  legalAgreementAccepted: boolean;
  signatureText: string;
  status: 'pending_review' | 'approved' | 'interview_scheduled' | 'rejected';
}

export interface CalculatorState {
  systemType: SystemType;
  brand: BrandKey;
  res: CameraResolution;
  cams: number;
  cable: number;
  box: number;
  hddSize: 'none' | '1TB' | '2TB' | '4TB' | '8TB';
  rack: boolean;
  powerSupply: boolean;
  connectors: boolean;
  includeLabor: boolean;
  laborPerCam: number;
  laborPerMeter: number;
  mode: 'percent' | 'fixed';
  margin: number;
  techMode: boolean;
}

export interface QuoteLine {
  label: string;
  qty: number;
  unitCost: number;
  totalCost: number;
  category: string;
}

export interface QuoteResult {
  lines: QuoteLine[];
  cost: number;
  profit: number;
  laborCost: number;
  total: number;
  channelCount: number;
}

export interface OrderRecord {
  id: string;
  created_at: string;
  customerName: string;
  phone: string;
  address: string;
  notes?: string;
  systemSummary: string;
  items: string[];
  cost: number;
  profit: number;
  total: number;
  status: 'new' | 'shipping' | 'delivered' | 'cancelled';
  source?: 'calculator' | 'shop' | '3d';
}

export interface Layout3DElement {
  id: string;
  type: 'wall' | 'camera' | 'cable' | 'box' | 'rack' | 'door' | 'window' | 'switch' | 'power';
  x: number;
  z: number;
  x2?: number;
  z2?: number;
  rotation?: number;
  lens?: LensType;
  label?: string;
}

export const OFFICIAL_CHANNELS = {
  phone: '01121275069',
  phoneDisplay: '01121275069',
  phoneDial: '+201121275069',
  whatsappUrl: 'https://wa.me/201121275069',
  messengerUrl: 'https://m.me/1402785336244205',
  messengerPageId: '1402785336244205',
  facebookUrl: 'https://www.facebook.com/share/1E2TTc59My/',
  instagramUrl: 'https://www.instagram.com/camzone_eg?dlrf=MWhoN3B0Y3NuNzIzcw==',
} as const;
