import {
  productQuerySchema,
  createOrderSchema,
  registerSchema,
  loginSchema,
  validate,
  formatZodErrors,
} from '@/lib/validations';

describe('productQuerySchema', () => {
  it('should accept valid query parameters', () => {
    const result = productQuerySchema.safeParse({
      category: 'food',
      search: 'coffee',
      featured: 'true',
      inStock: 'true',
      minPrice: '10',
      maxPrice: '100',
      page: '1',
      limit: '20',
    });

    expect(result.success).toBe(true);
  });

  it('should provide defaults for missing optional fields', () => {
    const result = productQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sortOrder).toBe('asc');
    }
  });

  it('should reject invalid category', () => {
    const result = productQuerySchema.safeParse({
      category: 'invalid-category',
    });

    expect(result.success).toBe(false);
  });

  it('should coerce string numbers to numbers', () => {
    const result = productQuerySchema.safeParse({
      page: '5',
      limit: '50',
      minPrice: '10.99',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(5);
      expect(result.data.limit).toBe(50);
      expect(result.data.minPrice).toBe(10.99);
    }
  });

  it('should reject negative prices', () => {
    const result = productQuerySchema.safeParse({
      minPrice: '-10',
    });

    expect(result.success).toBe(false);
  });

  it('should limit page size to 100', () => {
    const result = productQuerySchema.safeParse({
      limit: '200',
    });

    expect(result.success).toBe(false);
  });
});

describe('createOrderSchema', () => {
  const validOrder = {
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '4703597924',
      address: '123 Main St, Atlanta, GA 30301',
    },
    items: [
      { productId: 'prod-1', name: 'Test Product', quantity: 2, price: 10.99 },
    ],
    notes: 'Leave at door',
  };

  it('should accept valid order data', () => {
    const result = createOrderSchema.safeParse(validOrder);
    expect(result.success).toBe(true);
  });

  it('should reject missing required fields', () => {
    const result = createOrderSchema.safeParse({
      customer: { name: 'John Doe' },
    });

    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      customer: { ...validOrder.customer, email: 'invalid-email' },
    });

    expect(result.success).toBe(false);
  });

  it('should reject empty items array', () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      items: [],
    });

    expect(result.success).toBe(false);
  });

  it('should reject items with zero quantity', () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      items: [{ productId: 'prod-1', name: 'Test', quantity: 0, price: 10.99 }],
    });

    expect(result.success).toBe(false);
  });

  it('should reject items with negative price', () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      items: [{ productId: 'prod-1', name: 'Test', quantity: 1, price: -10 }],
    });

    expect(result.success).toBe(false);
  });

  it('should accept optional notes', () => {
    const orderWithoutNotes = {
      customer: validOrder.customer,
      items: validOrder.items,
    };

    const result = createOrderSchema.safeParse(orderWithoutNotes);
    expect(result.success).toBe(true);
  });
});

describe('registerSchema', () => {
  const validUser = {
    email: 'test@example.com',
    password: 'SecurePass123!',
    firstName: 'John',
    lastName: 'Doe',
    phone: '4703597924',
  };

  it('should accept valid registration data', () => {
    const result = registerSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('should reject short passwords', () => {
    const result = registerSchema.safeParse({
      ...validUser,
      password: 'short',
    });

    expect(result.success).toBe(false);
  });

  it('should reject invalid email format', () => {
    const result = registerSchema.safeParse({
      ...validUser,
      email: 'not-an-email',
    });

    expect(result.success).toBe(false);
  });

  it('should reject empty first name', () => {
    const result = registerSchema.safeParse({
      ...validUser,
      firstName: '',
    });

    expect(result.success).toBe(false);
  });

  it('should accept optional phone', () => {
    const userWithoutPhone = { ...validUser };
    delete (userWithoutPhone as Partial<typeof validUser>).phone;

    const result = registerSchema.safeParse(userWithoutPhone);
    expect(result.success).toBe(true);
  });
});

describe('loginSchema', () => {
  it('should accept valid login credentials', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-valid',
      password: 'password123',
    });

    expect(result.success).toBe(false);
  });

  it('should reject empty password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    });

    expect(result.success).toBe(false);
  });
});

describe('validate helper', () => {
  it('should return success with parsed data', () => {
    const result = validate(loginSchema, {
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.errors).toBeUndefined();
  });

  it('should return errors for invalid data', () => {
    const result = validate(loginSchema, {
      email: 'invalid',
      password: '',
    });

    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
  });
});

describe('formatZodErrors', () => {
  it('should format Zod errors into field-message pairs', () => {
    const result = validate(loginSchema, {
      email: 'invalid',
      password: '',
    });

    if (!result.success && result.errors) {
      const formatted = formatZodErrors(result.errors);
      expect(formatted).toBeInstanceOf(Object);
      expect(Object.keys(formatted).length).toBeGreaterThan(0);
    }
  });
});
