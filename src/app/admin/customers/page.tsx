'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Download, Eye, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerStatusBadge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { UserAvatar } from '@/components/ui/avatar';
import { formatPrice } from '@/lib/utils';
import { useCustomers, type AdminCustomer } from '@/hooks/useAdminData';
import { calculateHealthScore, getHealthDistribution, getLabelBgColor, type HealthScore, type HealthLabel } from '@/lib/customer-health';
import { HealthScoreBadge, HealthLabelBadge } from '@/components/admin/HealthScoreBadge';
import { exportToCsv } from '@/lib/export';

type CustomerWithHealth = AdminCustomer & { healthScore: number };

export default function AdminCustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');

  const { data: customers, isLoading } = useCustomers();

  // Compute health scores for all customers
  const healthMap = useMemo(() => {
    const map = new Map<string, HealthScore>();
    for (const c of customers ?? []) {
      map.set(c.id, calculateHealthScore({
        totalOrders: c.totalOrders,
        totalSpent: c.totalSpent,
        lastOrderAt: c.lastOrderAt,
        customerSince: c.customerSince,
        averageOrderValue: c.averageOrderValue,
      }));
    }
    return map;
  }, [customers]);

  const healthDistribution = useMemo(() => {
    return getHealthDistribution(Array.from(healthMap.values()));
  }, [healthMap]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Enrich customers with healthScore for sortable table
  const enrichedCustomers: CustomerWithHealth[] = useMemo(() => {
    return (customers ?? []).map(c => ({
      ...c,
      healthScore: healthMap.get(c.id)?.score ?? 0,
    }));
  }, [customers, healthMap]);

  const filteredCustomers = enrichedCustomers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'vip' ? customer.totalSpent >= 500 : customer.status === statusFilter);

    const health = healthMap.get(customer.id);
    const matchesHealth =
      healthFilter === 'all' ||
      health?.label === healthFilter;

    return matchesSearch && matchesStatus && matchesHealth;
  });

  const getSegmentCount = (segment: string) => {
    if (segment === 'all') return (customers ?? []).length;
    if (segment === 'vip') return (customers ?? []).filter(c => c.totalSpent >= 500).length;
    return (customers ?? []).filter(c => c.status === segment).length;
  };

  const columns = [
    {
      key: 'name' as keyof CustomerWithHealth,
      header: 'Customer',
      sortable: true,
      render: (customer: CustomerWithHealth) => (
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
      key: 'healthScore' as keyof CustomerWithHealth,
      header: 'Health',
      sortable: true,
      render: (customer: CustomerWithHealth) => {
        const health = healthMap.get(customer.id);
        if (!health) return null;
        return (
          <div className="flex items-center gap-2">
            <HealthScoreBadge health={health} size="sm" showLabel={false} />
            <HealthLabelBadge label={health.label} size="sm" />
          </div>
        );
      },
    },
    {
      key: 'status' as keyof CustomerWithHealth,
      header: 'Status',
      sortable: true,
      render: (customer: CustomerWithHealth) => <CustomerStatusBadge status={customer.status} />,
    },
    {
      key: 'totalOrders' as keyof CustomerWithHealth,
      header: 'Orders',
      sortable: true,
      render: (customer: CustomerWithHealth) => (
        <span className="text-gray-900">{customer.totalOrders}</span>
      ),
    },
    {
      key: 'totalSpent' as keyof CustomerWithHealth,
      header: 'Total Spent',
      sortable: true,
      render: (customer: CustomerWithHealth) => (
        <span className="font-medium">{formatPrice(customer.totalSpent)}</span>
      ),
    },
    {
      key: 'lastOrderAt' as keyof CustomerWithHealth,
      header: 'Last Order',
      sortable: true,
      render: (customer: CustomerWithHealth) => (
        <span className="text-gray-500">{formatDate(customer.lastOrderAt)}</span>
      ),
    },
    {
      key: 'id' as keyof CustomerWithHealth,
      header: '',
      render: (customer: CustomerWithHealth) => (
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

  const HEALTH_LABELS: HealthLabel[] = ['Champion', 'Loyal', 'Promising', 'At Risk', 'Lost'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer relationships</p>
        </div>
        <Button
          variant="outline"
          onClick={() => exportToCsv(filteredCustomers, [
            { header: 'Name', accessor: (c) => c.name },
            { header: 'Email', accessor: (c) => c.email },
            { header: 'Phone', accessor: (c) => c.phone || '' },
            { header: 'Status', accessor: (c) => c.status },
            { header: 'Health Score', accessor: (c) => c.healthScore },
            { header: 'Health Label', accessor: (c) => healthMap.get(c.id)?.label || '' },
            { header: 'Total Orders', accessor: (c) => c.totalOrders },
            { header: 'Total Spent', accessor: (c) => c.totalSpent },
            { header: 'Avg Order Value', accessor: (c) => c.averageOrderValue },
            { header: 'Last Order', accessor: (c) => formatDate(c.lastOrderAt) },
            { header: 'Customer Since', accessor: (c) => formatDate(c.customerSince) },
          ], `customers-export-${new Date().toISOString().slice(0, 10)}`)}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Segment Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'All', status: 'all', icon: '\uD83D\uDC65', color: 'from-gray-500 to-gray-600' },
          { label: 'Active', status: 'active', icon: '\uD83D\uDFE2', color: 'from-green-500 to-green-600' },
          { label: 'VIP', status: 'vip', icon: '\u2B50', color: 'from-amber-500 to-amber-600' },
          { label: 'Inactive', status: 'inactive', icon: '\uD83D\uDCA4', color: 'from-gray-400 to-gray-500' },
        ].map(s => (
          <button
            key={s.status}
            onClick={() => { setStatusFilter(s.status); setHealthFilter('all'); }}
            className={`p-4 rounded-xl border transition-all text-left ${statusFilter === s.status && healthFilter === 'all' ? 'ring-2 ring-primary border-primary bg-primary/5' : 'bg-white border-gray-200 hover:border-gray-300'}`}
          >
            <div className="text-lg mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{getSegmentCount(s.status)}</div>
            <div className="text-xs font-medium text-gray-500 mt-0.5">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Health Distribution */}
      {!isLoading && (customers ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Health Distribution</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setHealthFilter('all'); setStatusFilter('all'); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                healthFilter === 'all' ? 'ring-2 ring-primary bg-gray-100 text-gray-900' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              All ({(customers ?? []).length})
            </button>
            {HEALTH_LABELS.map(label => {
              const count = healthDistribution[label];
              if (count === 0) return null;
              return (
                <button
                  key={label}
                  onClick={() => { setHealthFilter(label); setStatusFilter('all'); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    healthFilter === label ? 'ring-2 ring-primary ' + getLabelBgColor(label) : getLabelBgColor(label) + ' opacity-70 hover:opacity-100'
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

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
