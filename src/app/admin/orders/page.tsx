'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { formatPrice } from '@/lib/utils';
import { useOrders, type AdminOrder } from '@/hooks/useAdminData';
import { exportToCsv } from '@/lib/export';

export default function AdminOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: orders, isLoading } = useOrders();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredOrders = (orders ?? []).filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'orderNumber' as keyof AdminOrder,
      header: 'Order',
      sortable: true,
      render: (order: AdminOrder) => (
        <Link
          href={`/admin/orders/${order.id}`}
          className="font-medium text-primary hover:underline"
        >
          {order.orderNumber}
        </Link>
      ),
    },
    {
      key: 'customerName' as keyof AdminOrder,
      header: 'Customer',
      sortable: true,
      render: (order: AdminOrder) => (
        <div>
          <p className="font-medium text-gray-900">{order.customerName}</p>
          <p className="text-sm text-gray-500">{order.customerEmail}</p>
        </div>
      ),
    },
    {
      key: 'items' as keyof AdminOrder,
      header: 'Items',
      render: (order: AdminOrder) => (
        <span className="text-gray-600">{order.items} items</span>
      ),
    },
    {
      key: 'total' as keyof AdminOrder,
      header: 'Total',
      sortable: true,
      render: (order: AdminOrder) => (
        <span className="font-medium">{formatPrice(order.total)}</span>
      ),
    },
    {
      key: 'status' as keyof AdminOrder,
      header: 'Status',
      sortable: true,
      render: (order: AdminOrder) => <OrderStatusBadge status={order.status} />,
    },
    {
      key: 'createdAt' as keyof AdminOrder,
      header: 'Date',
      sortable: true,
      render: (order: AdminOrder) => (
        <span className="text-gray-500">{formatDate(order.createdAt)}</span>
      ),
    },
    {
      key: 'id' as keyof AdminOrder,
      header: '',
      render: (order: AdminOrder) => (
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
        <Button
          variant="outline"
          onClick={() => exportToCsv(filteredOrders, [
            { header: 'Order Number', accessor: (o) => o.orderNumber },
            { header: 'Customer', accessor: (o) => o.customerName },
            { header: 'Email', accessor: (o) => o.customerEmail },
            { header: 'Items', accessor: (o) => String(o.items) },
            { header: 'Total', accessor: (o) => o.total },
            { header: 'Status', accessor: (o) => o.status },
            { header: 'Date', accessor: (o) => formatDate(o.createdAt) },
          ], `orders-export-${new Date().toISOString().slice(0, 10)}`)}
        >
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
          const count = (orders ?? []).filter(o => o.status === s.status).length;
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
