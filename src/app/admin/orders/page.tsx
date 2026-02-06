'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { formatPrice } from '@/lib/utils';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Mock data - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 800));

        setOrders([
          {
            id: '1',
            orderNumber: 'SM-2024-001',
            customerName: 'Abebe Kebede',
            customerEmail: 'abebe@example.com',
            items: 3,
            total: 89.99,
            status: 'pending',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            orderNumber: 'SM-2024-002',
            customerName: 'Sara Hailu',
            customerEmail: 'sara@example.com',
            items: 5,
            total: 156.50,
            status: 'processing',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: '3',
            orderNumber: 'SM-2024-003',
            customerName: 'Dawit Mengistu',
            customerEmail: 'dawit@example.com',
            items: 2,
            total: 245.00,
            status: 'shipped',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
          },
          {
            id: '4',
            orderNumber: 'SM-2024-004',
            customerName: 'Tigist Alemu',
            customerEmail: 'tigist@example.com',
            items: 1,
            total: 78.25,
            status: 'delivered',
            createdAt: new Date(Date.now() - 259200000).toISOString(),
          },
          {
            id: '5',
            orderNumber: 'SM-2024-005',
            customerName: 'Yonas Bekele',
            customerEmail: 'yonas@example.com',
            items: 4,
            total: 312.75,
            status: 'pending',
            createdAt: new Date(Date.now() - 345600000).toISOString(),
          },
          {
            id: '6',
            orderNumber: 'SM-2024-006',
            customerName: 'Hana Tesfaye',
            customerEmail: 'hana@example.com',
            items: 2,
            total: 125.00,
            status: 'cancelled',
            createdAt: new Date(Date.now() - 432000000).toISOString(),
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'orderNumber' as keyof Order,
      header: 'Order',
      sortable: true,
      render: (order: Order) => (
        <Link
          href={`/admin/orders/${order.id}`}
          className="font-medium text-primary hover:underline"
        >
          {order.orderNumber}
        </Link>
      ),
    },
    {
      key: 'customerName' as keyof Order,
      header: 'Customer',
      sortable: true,
      render: (order: Order) => (
        <div>
          <p className="font-medium text-gray-900">{order.customerName}</p>
          <p className="text-sm text-gray-500">{order.customerEmail}</p>
        </div>
      ),
    },
    {
      key: 'items' as keyof Order,
      header: 'Items',
      render: (order: Order) => (
        <span className="text-gray-600">{order.items} items</span>
      ),
    },
    {
      key: 'total' as keyof Order,
      header: 'Total',
      sortable: true,
      render: (order: Order) => (
        <span className="font-medium">{formatPrice(order.total)}</span>
      ),
    },
    {
      key: 'status' as keyof Order,
      header: 'Status',
      sortable: true,
      render: (order: Order) => <OrderStatusBadge status={order.status} />,
    },
    {
      key: 'createdAt' as keyof Order,
      header: 'Date',
      sortable: true,
      render: (order: Order) => (
        <span className="text-gray-500">{formatDate(order.createdAt)}</span>
      ),
    },
    {
      key: 'id' as keyof Order,
      header: '',
      render: (order: Order) => (
        <Link href={`/admin/orders/${order.id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage and track customer orders</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Pending', status: 'pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
          { label: 'Processing', status: 'processing', color: 'bg-blue-100 text-blue-800 border-blue-200' },
          { label: 'Shipped', status: 'shipped', color: 'bg-purple-100 text-purple-800 border-purple-200' },
          { label: 'Delivered', status: 'delivered', color: 'bg-green-100 text-green-800 border-green-200' },
          { label: 'Cancelled', status: 'cancelled', color: 'bg-red-100 text-red-800 border-red-200' },
        ].map(s => {
          const count = orders.filter(o => o.status === s.status).length;
          return (
            <button
              key={s.status}
              onClick={() => setStatusFilter(statusFilter === s.status ? 'all' : s.status)}
              className={`p-3 rounded-xl border text-center transition-all ${statusFilter === s.status ? s.color + ' ring-2 ring-offset-1 ring-current' : 'bg-white border-gray-200 hover:border-gray-300'}`}
            >
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs font-medium mt-0.5">{s.label}</div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders table */}
      <DataTable
        data={filteredOrders}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No orders found"
      />
    </div>
  );
}
