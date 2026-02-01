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
