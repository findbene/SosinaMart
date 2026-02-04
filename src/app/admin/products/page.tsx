'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Search, Plus, Edit2, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { formatPrice } from '@/lib/utils';
import { PRODUCTS } from '@/lib/data';
import { Product } from '@/types';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setProducts(PRODUCTS);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const columns = [
    {
      key: 'name' as keyof Product,
      header: 'Product',
      sortable: true,
      render: (product: Product) => (
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{product.name}</p>
            <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category' as keyof Product,
      header: 'Category',
      sortable: true,
      render: (product: Product) => (
        <Badge variant="outline" className="capitalize">
          {product.category.replace('-', ' ')}
        </Badge>
      ),
    },
    {
      key: 'price' as keyof Product,
      header: 'Price',
      sortable: true,
      render: (product: Product) => (
        <span className="font-medium">{formatPrice(product.price)}</span>
      ),
    },
    {
      key: 'inStock' as keyof Product,
      header: 'Status',
      render: (product: Product) => (
        <Badge variant={product.inStock ? 'success' : 'destructive'}>
          {product.inStock ? 'In Stock' : 'Out of Stock'}
        </Badge>
      ),
    },
    {
      key: 'id' as keyof Product,
      header: '',
      render: (product: Product) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary capitalize"
        >
          {categories.map((category) => (
            <option key={category} value={category} className="capitalize">
              {category === 'all' ? 'All Categories' : category.replace('-', ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Products table */}
      <DataTable
        data={filteredProducts}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No products found"
      />
    </div>
  );
}
