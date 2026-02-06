'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Download, Eye, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerStatusBadge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { UserAvatar } from '@/components/ui/avatar';
import { formatPrice } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'vip';
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
  createdAt: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 800));

        setCustomers([
          {
            id: '1',
            name: 'Abebe Kebede',
            email: 'abebe@example.com',
            phone: '+1 470-359-7924',
            status: 'vip',
            totalOrders: 12,
            totalSpent: 1245.50,
            lastOrderAt: new Date().toISOString(),
            createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '2',
            name: 'Sara Hailu',
            email: 'sara@example.com',
            phone: '+1 404-555-0123',
            status: 'active',
            totalOrders: 5,
            totalSpent: 456.25,
            lastOrderAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '3',
            name: 'Dawit Mengistu',
            email: 'dawit@example.com',
            status: 'active',
            totalOrders: 3,
            totalSpent: 189.00,
            lastOrderAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '4',
            name: 'Tigist Alemu',
            email: 'tigist@example.com',
            phone: '+1 678-555-0456',
            status: 'inactive',
            totalOrders: 1,
            totalSpent: 78.25,
            lastOrderAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '5',
            name: 'Yonas Bekele',
            email: 'yonas@example.com',
            status: 'vip',
            totalOrders: 8,
            totalSpent: 892.50,
            lastOrderAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'name' as keyof Customer,
      header: 'Customer',
      sortable: true,
      render: (customer: Customer) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={customer.name} size="sm" />
          <div>
            <Link
              href={`/admin/customers/${customer.id}`}
              className="font-medium text-gray-900 hover:text-primary"
            >
              {customer.name}
            </Link>
            <p className="text-sm text-gray-500">{customer.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status' as keyof Customer,
      header: 'Status',
      sortable: true,
      render: (customer: Customer) => <CustomerStatusBadge status={customer.status} />,
    },
    {
      key: 'totalOrders' as keyof Customer,
      header: 'Orders',
      sortable: true,
      render: (customer: Customer) => (
        <span className="text-gray-900">{customer.totalOrders}</span>
      ),
    },
    {
      key: 'totalSpent' as keyof Customer,
      header: 'Total Spent',
      sortable: true,
      render: (customer: Customer) => (
        <span className="font-medium">{formatPrice(customer.totalSpent)}</span>
      ),
    },
    {
      key: 'lastOrderAt' as keyof Customer,
      header: 'Last Order',
      sortable: true,
      render: (customer: Customer) => (
        <span className="text-gray-500">{formatDate(customer.lastOrderAt)}</span>
      ),
    },
    {
      key: 'id' as keyof Customer,
      header: '',
      render: (customer: Customer) => (
        <div className="flex items-center gap-1">
          <Link href={`mailto:${customer.email}`}>
            <Button variant="ghost" size="sm">
              <Mail className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/admin/customers/${customer.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer relationships</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Segment Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'All', status: 'all', icon: '👥', color: 'from-gray-500 to-gray-600' },
          { label: 'Active', status: 'active', icon: '🟢', color: 'from-green-500 to-green-600' },
          { label: 'VIP', status: 'vip', icon: '⭐', color: 'from-amber-500 to-amber-600' },
          { label: 'Inactive', status: 'inactive', icon: '💤', color: 'from-gray-400 to-gray-500' },
        ].map(s => {
          const count = s.status === 'all' ? customers.length : customers.filter(c => c.status === s.status).length;
          return (
            <button
              key={s.status}
              onClick={() => setStatusFilter(s.status)}
              className={`p-4 rounded-xl border transition-all text-left ${statusFilter === s.status ? 'ring-2 ring-primary border-primary bg-primary/5' : 'bg-white border-gray-200 hover:border-gray-300'}`}
            >
              <div className="text-lg mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-xs font-medium text-gray-500 mt-0.5">{s.label}</div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {/* Customers table */}
      <DataTable
        data={filteredCustomers}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No customers found"
      />
    </div>
  );
}
