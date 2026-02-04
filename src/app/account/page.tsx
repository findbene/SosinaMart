'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { Package, DollarSign, Clock, ArrowRight, ShoppingBag } from 'lucide-react';

interface OrderSummary {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  itemCount: number;
}

export default function AccountOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/orders?limit=5');
        const data = await response.json();

        if (data.success) {
          const orders = data.data || [];
          setRecentOrders(
            orders.map((order: { id: string; order_number: string; total: number; status: string; created_at: string; items: unknown }) => ({
              id: order.id,
              orderNumber: order.order_number,
              total: order.total,
              status: order.status,
              createdAt: order.created_at,
              itemCount: Array.isArray(order.items) ? order.items.length :
                        typeof order.items === 'string' ? JSON.parse(order.items).length : 0,
            }))
          );

          // Calculate stats
          const totalSpent = orders.reduce((sum: number, o: { total: number; status: string }) =>
            o.status !== 'cancelled' ? sum + o.total : sum, 0);
          const pendingOrders = orders.filter((o: { status: string }) =>
            ['pending', 'confirmed', 'processing'].includes(o.status)).length;

          setStats({
            totalOrders: orders.length,
            totalSpent,
            pendingOrders,
          });
        }
      } catch (error) {
        console.error('Failed to fetch account data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500">Here&apos;s an overview of your account</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={<Package className="h-8 w-8" />}
        />
        <StatCard
          title="Total Spent"
          value={formatPrice(stats.totalSpent)}
          icon={<DollarSign className="h-8 w-8" />}
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={<Clock className="h-8 w-8" />}
        />
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link
            href="/account/orders"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="h-12 w-12 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No orders yet</p>
              <Link
                href="/"
                className="text-primary hover:underline text-sm mt-2 inline-block"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      Order #{order.orderNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.itemCount} item{order.itemCount !== 1 ? 's' : ''} •{' '}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(order.total)}</p>
                    <Badge
                      variant={order.status as 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'}
                      size="sm"
                    >
                      {order.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
