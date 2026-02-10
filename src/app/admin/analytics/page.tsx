'use client';

import React, { useState } from 'react';
import {
  ShoppingCart,
  DollarSign,
  Users,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { useAnalytics } from '@/hooks/useAdminData';
import { RevenueChart, OrdersChart, CategoryPieChart } from '@/components/admin/charts';
import { exportToCsv } from '@/lib/export';

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const { data, isLoading } = useAnalytics(timeRange);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Track your store performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
          <Button
            variant="outline"
            onClick={() => {
              if (!data) return;
              exportToCsv(data.revenue.monthly, [
                { header: 'Month', accessor: (m) => m.month },
                { header: 'Revenue', accessor: (m) => m.amount },
              ], `analytics-revenue-${timeRange}-${new Date().toISOString().slice(0, 10)}`);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatPrice(data?.revenue.total ?? 0)}
          icon={<DollarSign className="h-5 w-5" />}
          trend={data?.revenue.change ? {
            value: data.revenue.change,
            label: 'vs last period',
          } : undefined}
          loading={isLoading}
        />
        <StatCard
          title="Total Orders"
          value={data?.orders.total ?? 0}
          icon={<ShoppingCart className="h-5 w-5" />}
          trend={data?.orders.change ? {
            value: data.orders.change,
            label: 'vs last period',
          } : undefined}
          loading={isLoading}
        />
        <StatCard
          title="Total Customers"
          value={data?.customers.total ?? 0}
          icon={<Users className="h-5 w-5" />}
          loading={isLoading}
        />
        <StatCard
          title="New Customers"
          value={data?.customers.newThisMonth ?? 0}
          icon={<Users className="h-5 w-5" />}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Revenue Trend</h2>
            {data?.revenue.change !== undefined && (
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${data.revenue.change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {data.revenue.change >= 0 ? '+' : ''}{data.revenue.change}%
              </span>
            )}
          </div>
          {isLoading ? (
            <div className="h-[280px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <RevenueChart data={data?.revenue.monthly ?? []} height={280} />
          )}
        </div>

        {/* Order status breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Order Status</h2>
          {isLoading ? (
            <div className="h-[280px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <OrdersChart data={data?.orders.byStatus ?? []} height={280} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Top Products</h2>
          </div>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {data?.topProducts.map((product, index) => (
                <div key={product.id} className="p-4 flex items-center gap-4">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.sold} sold</p>
                  </div>
                  <span className="font-medium text-gray-900">{formatPrice(product.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category breakdown - pie chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Sales by Category</h2>
          {isLoading ? (
            <div className="h-[280px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <CategoryPieChart data={data?.topCategories ?? []} height={280} />
          )}
        </div>
      </div>
    </div>
  );
}
