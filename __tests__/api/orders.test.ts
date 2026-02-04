/**
 * @jest-environment node
 */

// Note: Order API tests require authentication, which requires mocking getServerSession
// These tests demonstrate the pattern for testing authenticated endpoints

import { NextRequest } from 'next/server';

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: null,
}));

// Mock auth options
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

import { getServerSession } from 'next-auth';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('Orders API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('requires authentication for GET /api/orders', async () => {
      mockGetServerSession.mockResolvedValue(null);

      // Import after mocking
      const { GET } = await import('@/app/api/orders/route');

      const request = new NextRequest('http://localhost:3000/api/orders');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('allows authenticated users to access orders', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'customer',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any);

      const { GET } = await import('@/app/api/orders/route');

      const request = new NextRequest('http://localhost:3000/api/orders');
      const response = await GET(request);
      const json = await response.json();

      // Without Supabase, returns empty array
      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toEqual([]);
    });
  });

  describe('Order Creation', () => {
    const validOrderData = {
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '4703597924',
        address: '123 Main St, Atlanta, GA 30301',
      },
      items: [
        { productId: 'prod-1', name: 'Test Product', quantity: 2, price: 12.99 },
      ],
      notes: 'Please leave at door',
    };

    it('allows public checkout for POST /api/orders', async () => {
      // POST is intentionally public for guest checkout
      mockGetServerSession.mockResolvedValue(null);

      const { POST } = await import('@/app/api/orders/route');

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify(validOrderData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const json = await response.json();

      // Since Supabase is mocked as null, it returns a dev mock order
      expect(response.status).toBe(201);
      expect(json.success).toBe(true);
    });

    it('validates order data', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', role: 'customer' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any);

      const { POST } = await import('@/app/api/orders/route');

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({ customerName: 'John' }), // Missing required fields
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Order Status', () => {
    it('requires admin role to update order status', async () => {
      // Customer trying to update status
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', role: 'customer' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any);

      const { PATCH } = await import('@/app/api/orders/[id]/status/route');

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'shipped' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request, { params: { id: 'order-1' } });
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('allows admin to update order status', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any);

      const { PATCH } = await import('@/app/api/orders/[id]/status/route');

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'shipped' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request, { params: { id: 'order-1' } });

      // Without Supabase, will return not found or similar
      // The key is that auth passed
      expect(response.status).not.toBe(403);
    });
  });
});
