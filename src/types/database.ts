// Database Types - TypeScript interfaces for Prisma models

export interface User {
  id: string;
  email: string;
  phone?: string;
  full_name?: string;
  referral_code: string;
  referred_by?: string;
  points: number;
  role: 'customer' | 'admin';
  tier: 'standard' | 'bronze' | 'silver' | 'gold' | 'platinum';
  total_spent?: number | { toNumber(): number };
  totalSpent?: number | { toNumber(): number };
  created_at: string;
  updated_at: string;
}

export interface StringInventory {
  id: string;
  model: string;
  brand: string;
  cost_price?: number;
  costPrice?: number | { toNumber(): number }; // Prisma Decimal
  selling_price?: number;
  sellingPrice?: number | { toNumber(): number }; // Prisma Decimal
  price?: number;
  stock: number;
  minimum_stock?: number;
  minimumStock?: number;
  color?: string | null;
  gauge?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  specification?: string | null;
  isRecommended?: boolean;
  is_recommended?: boolean;
  // String characteristics
  elasticity?: string | null;  // 弹性: low, medium, high
  durability?: string | null;  // 耐久: low, medium, high
  control?: string | null;     // 控球: low, medium, high
  active: boolean;
  created_at?: string;
  createdAt?: Date | string;
  updated_at?: string;
  updatedAt?: Date | string;
}

export interface Order {
  id: string;
  user_id: string;
  string_id: string;
  tension?: number;
  price: number;
  cost?: number;
  profit?: number;
  discount: number;
  discount_amount?: number;
  final_price?: number;
  payment_status?: string;
  status: 'pending' | 'in_progress' | 'completed';
  use_package: boolean;
  package_used_id?: string;
  voucher_used_id?: string;
  voucher_id?: string;
  notes?: string;
  completed_at?: string;
  cancelled_at?: string | null;
  created_at: string;
  updated_at: string;
  string?: {
    brand?: string;
    model?: string;
    specification?: string | null;
  };
  packageUsed?: UserPackage;
  payment?: {
    id?: string;
    amount?: number;
    status?: string;
    payment_method?: string;
    transaction_id?: string;
    created_at?: string;
  };
  payments?: Array<{
    id?: string;
    amount?: number;
    status?: string;
    provider?: string;
    created_at?: string;
    updated_at?: string;
    paid_at?: string;
  }>;
  voucher?: {
    id?: string;
    voucher?: {
      id?: string;
      name?: string | null;
      type?: string | null;
      value?: number | null;
    };
  };
  items?: OrderItem[];  // New: Multi-racket support
}

// New: Order item for multi-racket support
export interface OrderItem {
  id: string;
  order_id: string;
  orderId?: string;
  string_id: string;
  stringId?: string;
  tension_vertical: number;
  tensionVertical?: number;
  tension_horizontal: number;
  tensionHorizontal?: number;
  racket_brand?: string;
  racketBrand?: string;
  racket_model?: string;
  racketModel?: string;
  racket_photo: string;  // Required
  racketPhoto?: string;
  notes?: string;
  price: number;
  created_at: string;
  createdAt?: Date | string;
  updated_at: string;
  updatedAt?: Date | string;
  string?: {
    id?: string;
    brand?: string;
    model?: string;
    sellingPrice?: number | { toNumber(): number };
  };
}


export interface Payment {
  id: string;
  order_id?: string;
  package_id?: string;
  user_id: string;
  amount: number;
  provider: 'tng' | 'cash'; // Only TNG QR Code and Cash payment
  status: 'pending' | 'pending_verification' | 'success' | 'failed';
  transaction_id?: string;
  receipt_url?: string;
  receipt_uploaded_at?: string;
  verified_by?: string;
  verified_at?: string;
  admin_notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  name: string;
  description?: string;
  times: number;
  price: number;
  original_price?: number;
  validity_days: number;
  active: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPackage {
  id: string;
  user_id: string;
  package_id: string;
  remaining: number;
  original_times: number;
  expiry: string;
  status: 'active' | 'expired' | 'depleted';
  created_at: string;
  updated_at: string;
  expires_at?: string | null;
  package?: {
    id: string;
    name: string;
    times: number;
    validity_days?: number | null;
  };
}

export interface Voucher {
  id: string;
  code: string;
  name: string;
  type: 'fixed_amount' | 'percentage' | 'fixed' | 'FIXED' | 'PERCENTAGE' | 'percentage_off' | string;
  value: number | { toNumber(): number }; // Prisma Decimal support
  active: boolean;
  // snake_case (optional for Prisma compatibility)
  min_purchase?: number | { toNumber(): number };
  max_uses?: number | null;
  used_count?: number;
  points_cost?: number;
  points_required?: number | null;
  valid_from?: string;
  valid_until?: string;
  created_at?: string;
  // camelCase (optional for Prisma compatibility)
  minPurchase?: number | { toNumber(): number };
  maxUses?: number | null;
  usedCount?: number;
  pointsCost?: number;
  validFrom?: string | Date;
  validUntil?: string | Date;
  createdAt?: string | Date;
  // shared
  discount_type?: 'fixed' | 'percentage';
  discount_value?: number;
  max_discount?: number | null;
  description?: string | null;
  validityDays?: number | null;
  validity_days?: number | null;
  isAutoIssue?: boolean;
  is_auto_issue?: boolean;
  isFirstOrderOnly?: boolean;
  is_first_order_only?: boolean;
}

export interface UserVoucher {
  id: string;
  user_id: string;
  voucher_id: string;
  status: 'active' | 'used' | 'expired';
  used_at?: string;
  order_id?: string;
  expiry: string;
  created_at: string;
  voucher?: {
    id: string;
    code: string;
    name?: string | null;
    discount_type?: 'fixed' | 'percentage';
    discount_value?: number;
    min_purchase?: number | null;
    max_discount?: number | null;
    description?: string | null;
  };
  expires_at?: string | null;
  used?: boolean;
}

export interface PointsLog {
  id: string;
  user_id: string;
  amount: number;
  type: 'order' | 'referral' | 'redeem' | 'admin_grant';
  reference_id?: string;
  description?: string;
  balance_after: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'order' | 'package' | 'promo' | 'system';
  read: boolean;
  action_url?: string;
  created_at: string;
}
