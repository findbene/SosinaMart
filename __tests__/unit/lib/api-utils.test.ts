/**
 * @jest-environment node
 */
import { NextResponse } from 'next/server';
import {
  createApiResponse,
  createApiError,
  getPaginationParams,
  createPaginationMeta,
} from '@/lib/api-utils';

describe('createApiResponse', () => {
  it('should create a success response with data', async () => {
    const data = { id: 1, name: 'Test' };
    const response = createApiResponse(data);

    expect(response).toBeInstanceOf(NextResponse);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual(data);
    expect(json.error).toBeUndefined();
  });

  it('should include meta when provided', async () => {
    const data = [{ id: 1 }, { id: 2 }];
    const meta = { page: 1, limit: 10, total: 100, totalPages: 10 };
    const response = createApiResponse(data, meta);

    const json = await response.json();
    expect(json.meta).toEqual(meta);
  });

  it('should use 200 status by default', () => {
    const response = createApiResponse({ test: true });
    expect(response.status).toBe(200);
  });

  it('should allow custom status code', () => {
    const response = createApiResponse({ created: true }, undefined, 201);
    expect(response.status).toBe(201);
  });
});

describe('createApiError', () => {
  it('should create an error response', async () => {
    const response = createApiError('NOT_FOUND', 'Item not found', 404);

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('NOT_FOUND');
    expect(json.error.message).toBe('Item not found');
    expect(response.status).toBe(404);
  });

  it('should include additional details when provided', async () => {
    const details = { field: 'email', reason: 'invalid format' };
    const response = createApiError('VALIDATION_ERROR', 'Invalid input', 400, details);

    const json = await response.json();
    expect(json.error.details).toEqual(details);
  });

  it('should use 400 as default status', () => {
    const response = createApiError('INTERNAL_ERROR', 'Something went wrong');
    expect(response.status).toBe(400);
  });
});

describe('createPaginationMeta', () => {
  it('should calculate pagination metadata correctly', () => {
    const meta = createPaginationMeta(1, 10, 100);

    expect(meta).toEqual({
      page: 1,
      limit: 10,
      total: 100,
      totalPages: 10,
    });
  });

  it('should handle partial last page', () => {
    const meta = createPaginationMeta(1, 10, 25);

    expect(meta?.totalPages).toBe(3);
  });

  it('should handle zero total', () => {
    const meta = createPaginationMeta(1, 10, 0);

    expect(meta?.totalPages).toBe(0);
  });

  it('should handle single page', () => {
    const meta = createPaginationMeta(1, 10, 5);

    expect(meta?.totalPages).toBe(1);
  });
});

describe('getPaginationParams', () => {
  it('should parse pagination from query params', () => {
    const request = {
      nextUrl: {
        searchParams: new URLSearchParams('page=2&limit=25'),
      },
    } as any;

    const params = getPaginationParams(request);

    expect(params.page).toBe(2);
    expect(params.limit).toBe(25);
    expect(params.offset).toBe(25);
  });

  it('should use defaults for missing params', () => {
    const request = {
      nextUrl: {
        searchParams: new URLSearchParams(''),
      },
    } as any;

    const params = getPaginationParams(request);

    expect(params.page).toBe(1);
    expect(params.limit).toBe(20);
    expect(params.offset).toBe(0);
  });

  it('should enforce minimum page of 1', () => {
    const request = {
      nextUrl: {
        searchParams: new URLSearchParams('page=-5'),
      },
    } as any;

    const params = getPaginationParams(request);

    expect(params.page).toBe(1);
  });

  it('should enforce maximum limit of 100', () => {
    const request = {
      nextUrl: {
        searchParams: new URLSearchParams('limit=500'),
      },
    } as any;

    const params = getPaginationParams(request);

    expect(params.limit).toBe(100);
  });

  it('should calculate offset correctly', () => {
    const request = {
      nextUrl: {
        searchParams: new URLSearchParams('page=3&limit=10'),
      },
    } as any;

    const params = getPaginationParams(request);

    expect(params.offset).toBe(20); // (3-1) * 10
  });
});
