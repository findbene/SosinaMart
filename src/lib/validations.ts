import { z } from 'zod';

// ============================================
// Common Schemas
// ============================================

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(
    /^\+?[\d\s\-().]{10,}$/,
    'Invalid phone number format'
  );

export const uuidSchema = z.string().uuid('Invalid ID format');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// Product Schemas
// ============================================

export const productCategorySchema = z.enum(['food', 'kitchenware', 'artifacts']);

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive('Price must be positive'),
  category: productCategorySchema,
  image: z.string().url('Invalid image URL').optional(),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  category: productCategorySchema.optional(),
  search: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  inStock: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: z.enum(['name', 'price', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  ...paginationSchema.shape,
});

export const productSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// ============================================
// Order Schemas
// ============================================

export const orderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);

export const orderItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  image: z.string().optional(),
});

export const customerInfoSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().min(1, 'Address is required').max(500),
});

export const createOrderSchema = z.object({
  customer: customerInfoSchema,
  items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
  notes: z.string().max(1000).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
  note: z.string().max(500).optional(),
});

export const orderQuerySchema = z.object({
  status: orderStatusSchema.optional(),
  customerId: z.string().optional(),
  customerEmail: z.string().email().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'total', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  ...paginationSchema.shape,
});

// ============================================
// Customer Schemas
// ============================================

export const customerStatusSchema = z.enum(['active', 'inactive', 'blocked']);

export const createCustomerSchema = z.object({
  email: emailSchema,
  phone: phoneSchema.optional(),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  address: z.string().max(500).optional(),
  marketingConsent: z.boolean().default(false),
});

export const updateCustomerSchema = z.object({
  phone: phoneSchema.optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  address: z.string().max(500).optional(),
  status: customerStatusSchema.optional(),
  marketingConsent: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
});

export const customerQuerySchema = z.object({
  status: customerStatusSchema.optional(),
  segment: z.string().optional(),
  search: z.string().optional(),
  minOrders: z.coerce.number().int().min(0).optional(),
  minSpent: z.coerce.number().min(0).optional(),
  sortBy: z.enum(['createdAt', 'totalOrders', 'totalSpent', 'lastName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  ...paginationSchema.shape,
});

export const createInteractionSchema = z.object({
  type: z.enum(['email', 'phone', 'chat', 'note', 'order', 'support']),
  subject: z.string().min(1).max(200),
  content: z.string().max(5000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================
// Customer Segment Schemas
// ============================================

export const segmentOperatorSchema = z.enum([
  'eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'in', 'notIn'
]);

export const segmentRuleSchema = z.object({
  field: z.string(),
  operator: segmentOperatorSchema,
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
});

export const createSegmentSchema = z.object({
  name: z.string().min(1, 'Segment name is required').max(100),
  description: z.string().max(500).optional(),
  rules: z.array(segmentRuleSchema).min(1, 'At least one rule is required'),
  isActive: z.boolean().default(true),
});

export const updateSegmentSchema = createSegmentSchema.partial();

// ============================================
// Authentication Schemas
// ============================================

export const registerSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: phoneSchema.optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// ============================================
// AI / Chat Schemas
// ============================================

export const chatMessageRoleSchema = z.enum(['user', 'assistant', 'system']);

export const chatMessageSchema = z.object({
  role: chatMessageRoleSchema,
  content: z.string().min(1).max(10000),
});

export const sendChatMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000),
  sessionId: z.string().uuid().optional(),
  context: z.object({
    currentPage: z.string().optional(),
    cartItems: z.array(z.string()).optional(),
    customerId: z.string().optional(),
  }).optional(),
});

export const getRecommendationsSchema = z.object({
  productIds: z.array(z.string()).optional(),
  cartItems: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(20).default(6),
});

// ============================================
// Type Exports
// ============================================

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
export type ProductSearch = z.infer<typeof productSearchSchema>;

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatus = z.infer<typeof updateOrderStatusSchema>;
export type OrderQuery = z.infer<typeof orderQuerySchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type CustomerInfo = z.infer<typeof customerInfoSchema>;

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerQuery = z.infer<typeof customerQuerySchema>;
export type CreateInteraction = z.infer<typeof createInteractionSchema>;

export type CreateSegmentInput = z.infer<typeof createSegmentSchema>;
export type UpdateSegmentInput = z.infer<typeof updateSegmentSchema>;
export type SegmentRule = z.infer<typeof segmentRuleSchema>;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export type SendChatMessage = z.infer<typeof sendChatMessageSchema>;
export type GetRecommendations = z.infer<typeof getRecommendationsSchema>;

// ============================================
// Validation Helper
// ============================================

/**
 * Validate data against a Zod schema and return typed result
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Format Zod validation errors for API response
 */
export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}
