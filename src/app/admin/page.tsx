'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Users,
  DollarSign,
  Package,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import { StatCard } from '@/components/ui/card';
import { OrderStatusBadge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { useDashboardStats, useOrders, useAnalytics } from '@/hooks/useAdminData';
import { NLQueryBar } from '@/components/admin/NLQueryBar';
import { SmartAlerts } from '@/components/admin/SmartAlerts';
import { RevenueChart } from '@/components/admin/charts';

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentOrders, isLoading: ordersLoading } = useOrders({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics('30d');

  const isLoading = statsLoading || ordersLoading;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back!</h1>
        <p className="text-white/80 mt-1">Here&apos;s what&apos;s happening with your store today.</p>
      </div>

      {/* AI Query Bar */}
      <NLQueryBar />

      {/* Smart Alerts */}
      <SmartAlerts />

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders ?? 0}
          icon={<ShoppingCart className="h-5 w-5" />}
          trend={stats?.ordersChange ? {
            value: stats.ordersChange,
            label: 'vs last month',
          } : undefined}
          loading={statsLoading}
        />
        <StatCard
          title="Total Revenue"
          value={formatPrice(stats?.totalRevenue ?? 0)}
          icon={<DollarSign className="h-5 w-5" />}
          trend={stats?.revenueChange ? {
            value: stats.revenueChange,
            label: 'vs last month',
          } : undefined}
          loading={statsLoading}
        />
        <StatCard
          title="Customers"
          value={stats?.totalCustomers ?? 0}
          icon={<Users className="h-5 w-5" />}
          trend={stats?.customersChange ? {
            value: stats.customersChange,
            label: 'vs last month',
          } : undefined}
          loading={statsLoading}
        />
        <StatCard
          title="Products"
          value={stats?.totalProducts ?? 0}
          icon={<Package className="h-5 w-5" />}
          loading={statsLoading}
        />
      </div>

      {/* Revenue trend mini chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
          <Link
            href="/admin/analytics"
            className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1"
          >
            Full analytics
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        {analyticsLoading ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <RevenueChart data={analytics?.revenue.monthly ?? []} height={200} />
        )}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1"
          >
            View all
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {ordersLoading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders?.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {order.customerName}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status as any} />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/products"
          className="p-5 bg-white rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all group"
        >
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3">
            <Package className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 group-hover:text-primary">Manage Products</h3>
          <p className="text-sm text-gray-500 mt-1">Add, edit or remove products</p>
        </Link>
        <Link
          href="/admin/customers"
          className="p-5 bg-white rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all group"
        >
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-3">
            <Users className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 group-hover:text-primary">View Customers</h3>
          <p className="text-sm text-gray-500 mt-1">Manage customer relationships</p>
        </Link>
        <Link
          href="/admin/analytics"
          className="p-5 bg-white rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all group"
        >
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-3">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 group-hover:text-primary">View Analytics</h3>
          <p className="text-sm text-gray-500 mt-1">Track sales and performance</p>
        </Link>
      </div>
    </div>
  );
}
