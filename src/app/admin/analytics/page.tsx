'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { StatCard } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';

interface AnalyticsData {
  revenue: {
    total: number;
    change: number;
    monthly: { month: string; amount: number }[];
  };
  orders: {
    total: number;
    change: number;
    byStatus: { status: string; count: number }[];
  };
  customers: {
    total: number;
    newThisMonth: number;
    returning: number;
  };
  topProducts: {
    id: string;
    name: string;
    sold: number;
    revenue: number;
  }[];
  topCategories: {
    category: string;
    orders: number;
    revenue: number;
  }[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 800));

        setData({
          revenue: {
            total: 12450.00,
            change: 8.3,
            monthly: [
              { month: 'Sep', amount: 8200 },
              { month: 'Oct', amount: 9100 },
              { month: 'Nov', amount: 10500 },
              { month: 'Dec', amount: 11200 },
              { month: 'Jan', amount: 12450 },
            ],
          },
          orders: {
            total: 156,
            change: 12.5,
            byStatus: [
              { status: 'Pending', count: 12 },
              { status: 'Processing', count: 8 },
              { status: 'Shipped', count: 15 },
              { status: 'Delivered', count: 118 },
              { status: 'Cancelled', count: 3 },
            ],
          },
          customers: {
            total: 89,
            newThisMonth: 12,
            returning: 77,
          },
          topProducts: [
            { id: '1', name: 'Berbere Spice (1lb)', sold: 45, revenue: 584.55 },
            { id: '2', name: 'Ethiopian Coffee (1lb)', sold: 38, revenue: 721.62 },
            { id: '3', name: 'Injera (Pack of 5)', sold: 32, revenue: 511.68 },
            { id: '4', name: 'Mitmita Spice (8oz)', sold: 28, revenue: 307.72 },
            { id: '5', name: 'Teff Flour (5lb)', sold: 25, revenue: 374.75 },
          ],
          topCategories: [
            { category: 'Spices', orders: 85, revenue: 1892.45 },
            { category: 'Coffee', orders: 52, revenue: 1456.00 },
            { category: 'Food', orders: 48, revenue: 1124.50 },
            { category: 'Traditional Clothes', orders: 25, revenue: 2875.00 },
            { category: 'Kitchenware', orders: 18, revenue: 892.25 },
          ],
        });
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  const maxRevenue = data?.revenue.monthly ? Math.max(...data.revenue.monthly.map(m => m.amount)) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Track your store performance</p>
        </div>
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
        {/* Revenue chart (simplified bar chart) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Revenue Trend</h2>
            {data?.revenue.change && (
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${data.revenue.change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {data.revenue.change >= 0 ? '+' : ''}{data.revenue.change}%
              </span>
            )}
          </div>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="h-64 flex items-end justify-between gap-4">
              {data?.revenue.monthly.map((month, index) => (
                <div key={month.month} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-primary/20 rounded-t-lg relative group cursor-pointer hover:bg-primary/30 transition-colors"
                    style={{ height: `${(month.amount / maxRevenue) * 100}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {formatPrice(month.amount)}
                    </div>
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg transition-all"
                      style={{ height: `${Math.min(100, (month.amount / maxRevenue) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 mt-2">{month.month}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order status breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-6">Order Status</h2>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {data?.orders.byStatus.map((item) => {
                const total = data.orders.total;
                const percentage = total > 0 ? (item.count / total) * 100 : 0;

                return (
                  <div key={item.status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{item.status}</span>
                      <span className="font-medium">{item.count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
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

        {/* Top categories */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Top Categories</h2>
          </div>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {data?.topCategories.map((category, index) => (
                <div key={category.category} className="p-4 flex items-center gap-4">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{category.category}</p>
                    <p className="text-sm text-gray-500">{category.orders} orders</p>
                  </div>
                  <span className="font-medium text-gray-900">{formatPrice(category.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
