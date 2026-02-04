/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/products/route';
import { PRODUCTS } from '@/lib/data';

// Mock Supabase (not configured in tests)
jest.mock('@/lib/supabase', () => ({
  supabase: null,
}));

describe('Products API', () => {
  describe('GET /api/products', () => {
    it('returns all products when no filters applied', async () => {
      const request = new NextRequest('http://localhost:3000/api/products');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThan(0);
    });

    it('filters products by category', async () => {
      const request = new NextRequest('http://localhost:3000/api/products?category=food');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      json.data.forEach((product: any) => {
        expect(product.category).toBe('food');
      });
    });

    it('filters products by search term', async () => {
      const request = new NextRequest('http://localhost:3000/api/products?search=coffee');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);

      // All returned products should match search term
      json.data.forEach((product: any) => {
        const matchesName = product.name.toLowerCase().includes('coffee');
        const matchesDesc = product.description?.toLowerCase().includes('coffee');
        expect(matchesName || matchesDesc).toBe(true);
      });
    });

    it('filters featured products', async () => {
      const request = new NextRequest('http://localhost:3000/api/products?featured=true');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      json.data.forEach((product: any) => {
        expect(product.featured).toBe(true);
      });
    });

    it('filters in-stock products', async () => {
      const request = new NextRequest('http://localhost:3000/api/products?inStock=true');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      json.data.forEach((product: any) => {
        expect(product.inStock).toBe(true);
      });
    });

    it('filters by price range', async () => {
      const request = new NextRequest('http://localhost:3000/api/products?minPrice=10&maxPrice=20');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      json.data.forEach((product: any) => {
        expect(product.price).toBeGreaterThanOrEqual(10);
        expect(product.price).toBeLessThanOrEqual(20);
      });
    });

    it('paginates results', async () => {
      const request = new NextRequest('http://localhost:3000/api/products?page=1&limit=5');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.length).toBeLessThanOrEqual(5);
      expect(json.meta).toBeDefined();
      expect(json.meta.page).toBe(1);
      expect(json.meta.limit).toBe(5);
    });

    it('returns second page of results', async () => {
      const request = new NextRequest('http://localhost:3000/api/products?page=2&limit=5');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.meta.page).toBe(2);
    });

    it('sorts products by price ascending', async () => {
      const request = new NextRequest('http://localhost:3000/api/products?sortBy=price&sortOrder=asc');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);

      for (let i = 1; i < json.data.length; i++) {
        expect(json.data[i].price).toBeGreaterThanOrEqual(json.data[i - 1].price);
      }
    });

    it('sorts products by price descending', async () => {
      const request = new NextRequest('http://localhost:3000/api/products?sortBy=price&sortOrder=desc');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);

      for (let i = 1; i < json.data.length; i++) {
        expect(json.data[i].price).toBeLessThanOrEqual(json.data[i - 1].price);
      }
    });

    it('returns validation error for invalid category', async () => {
      const request = new NextRequest('http://localhost:3000/api/products?category=invalid');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns validation error for negative price', async () => {
      const request = new NextRequest('http://localhost:3000/api/products?minPrice=-10');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
    });

    it('combines multiple filters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/products?category=food&inStock=true&minPrice=10'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      json.data.forEach((product: any) => {
        expect(product.category).toBe('food');
        expect(product.inStock).toBe(true);
        expect(product.price).toBeGreaterThanOrEqual(10);
      });
    });
  });
});
