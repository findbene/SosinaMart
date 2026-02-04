'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Users,
  DollarSign,
  Package,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { StatCard } from '@/components/ui/card';
import { OrderStatusBadge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  ordersChange: number;
  revenueChange: number;
  customersChange: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching dashboard data
    const fetchDashboardData = async () => {
      try {
        // In production, this would fetch from your API
        // For now, using mock data
        await new Promise(resolve => setTimeout(resolve, 1000));

        setStats({
          totalOrders: 156,
          totalRevenue: 12450.00,
          totalCustomers: 89,
          totalProducts: 45,
          ordersChange: 12.5,
          revenueChange: 8.3,
          customersChange: 15.2,
        });

        setRecentOrders([
          {
            id: '1',
            orderNumber: 'SM-2024-001',
            customerName: 'Abebe Kebede',
            total: 89.99,
            status: 'pending',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            orderNumber: 'SM-2024-002',
            customerName: 'Sara Hailu',
            total: 156.50,
            status: 'processing',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: '3',
            orderNumber: 'SM-2024-003',
            customerName: 'Dawit Mengistu',
            total: 245.00,
            status: 'shipped',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
          },
          {
            id: '4',
            orderNumber: 'SM-2024-004',
            customerName: 'Tigist Alemu',
            total: 78.25,
            status: 'delivered',
            createdAt: new Date(Date.now() - 259200000).toISOString(),
          },
          {
            id: '5',
            orderNumber: 'SM-2024-005',
            customerName: 'Yonas Bekele',
            total: 312.75,
            status: 'pending',
            createdAt: new Date(Date.now() - 345600000).toISOString(),
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening with your store.</p>
      </div>

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
          loading={isLoading}
        />
        <StatCard
          title="Total Revenue"
          value={formatPrice(stats?.totalRevenue ?? 0)}
          icon={<DollarSign className="h-5 w-5" />}
          trend={stats?.revenueChange ? {
            value: stats.revenueChange,
            label: 'vs last month',
          } : undefined}
          loading={isLoading}
        />
        <StatCard
          title="Customers"
          value={stats?.totalCustomers ?? 0}
          icon={<Users className="h-5 w-5" />}
          trend={stats?.customersChange ? {
            value: stats.customersChange,
            label: 'vs last month',
          } : undefined}
          loading={isLoading}
        />
        <StatCard
          title="Products"
          value={stats?.totalProducts ?? 0}
          icon={<Package className="h-5 w-5" />}
          loading={isLoading}
        />
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

        {isLoading ? (
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
                {recentOrders.map((order) => (
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
          className="p-4 bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all group"
        >
          <Package className="h-8 w-8 text-primary mb-2" />
          <h3 className="font-semibold text-gray-900 group-hover:text-primary">Manage Products</h3>
          <p className="text-sm text-gray-500">Add, edit or remove products</p>
        </Link>
        <Link
          href="/admin/customers"
          className="p-4 bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all group"
        >
          <Users className="h-8 w-8 text-primary mb-2" />
          <h3 className="font-semibold text-gray-900 group-hover:text-primary">View Customers</h3>
          <p className="text-sm text-gray-500">Manage customer relationships</p>
        </Link>
        <Link
          href="/admin/analytics"
          className="p-4 bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all group"
        >
          <TrendingUp className="h-8 w-8 text-primary mb-2" />
          <h3 className="font-semibold text-gray-900 group-hover:text-primary">View Analytics</h3>
          <p className="text-sm text-gray-500">Track sales and performance</p>
        </Link>
      </div>
    </div>
  );
}
