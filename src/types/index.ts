// Product Types
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: ProductCategory;
  image: string;
  inStock?: boolean;
  featured?: boolean;
}

export type ProductCategory = "food" | "kitchenware" | "artifacts";

// Cart Types
export interface CartItem extends Product {
  quantity: number;
}

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  customer: CustomerInfo;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  notes?: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

// Carousel Types
export interface CarouselItem {
  id: string;
  type: "image" | "video";
  src: string;
  title: string;
  alt?: string;
}

// UI Types
export interface NavLink {
  label: string;
  href: string;
  category?: ProductCategory;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

// Store Info
export interface StoreInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  socialLinks: SocialLink[];
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// =============================================
// Customer Types (CRM)
// =============================================

export interface Customer {
  id: string;
  userId?: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  address?: string;
  status: CustomerStatus;
  emailVerified: boolean;
  marketingConsent: boolean;
  notes?: string;
  // CRM Stats
  customerSince: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderAt?: string;
  lastInteractionAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CustomerStatus = 'active' | 'inactive' | 'blocked';

export interface CustomerSegment {
  id: string;
  name: string;
  description?: string;
  rules: SegmentRule[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SegmentRule {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'notIn';
  value: string | number | boolean | string[];
}

export interface CustomerInteraction {
  id: string;
  customerId: string;
  type: InteractionType;
  subject: string;
  content?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  createdAt: string;
}

export type InteractionType = 'email' | 'phone' | 'chat' | 'note' | 'order' | 'support';

// =============================================
// Order Types (Extended)
// =============================================

export interface OrderStatusHistoryEntry {
  id: string;
  orderId: string;
  status: OrderStatus;
  note?: string;
  createdBy?: string;
  createdAt: string;
}

export interface OrderWithHistory extends Order {
  statusHistory: OrderStatusHistoryEntry[];
}

// =============================================
// Chat Types (AI)
// =============================================

export interface ChatSession {
  id: string;
  customerId?: string;
  userId?: string;
  status: ChatSessionStatus;
  startedAt: string;
  endedAt?: string;
  lastActivityAt: string;
}

export type ChatSessionStatus = 'active' | 'closed' | 'transferred';

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatMessageRole;
  content: string;
  metadata?: {
    suggestedProducts?: string[];
    suggestedActions?: string[];
  };
  createdAt: string;
}

export type ChatMessageRole = 'user' | 'assistant' | 'system';

export interface ChatResponse {
  reply: string;
  sessionId: string;
  suggestedProducts?: Product[];
  suggestedActions?: string[];
}

// =============================================
// User Types (Authentication)
// =============================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export type UserRole = 'customer' | 'admin';

// =============================================
// Toast Types (UI)
// =============================================

export interface Toast {
  id: string;
  title?: string;
  description: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// =============================================
// Pagination Types
// =============================================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
