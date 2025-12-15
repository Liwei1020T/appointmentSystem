// API Response Types

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Auth Types
export interface AuthUser {
  id: string;
  email: string;
  role: 'customer' | 'admin';
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  referred_by?: string;
}

export interface CreateOrderForm {
  string_id: string;
  tension?: number;
  notes?: string;
  use_package: boolean;
  package_id?: string;
  voucher_id?: string;
}

// Statistics Types
export interface DashboardStats {
  revenue: {
    orders: number;
    packages: number;
    total: number;
  };
  profit: number;
  order_count: number;
  package_sales: number;
  new_users: number;
  low_stock_items: Array<{
    brand: string;
    model: string;
    stock: number;
  }>;
}

export type { UserVoucher } from './database';
export type { Voucher } from './database';
export type { Package } from './database';
export type { User } from './database';
export type { StringInventory } from './database';
export type { UserPackage } from './database';
export type { Order } from './database';
export type { Payment } from './database';
