'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Phone,
  Mail,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: string;
  notes?: string;
  createdAt: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  statusHistory: {
    status: string;
    timestamp: string;
    note?: string;
  }[];
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

export default function AccountOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock data - replace with actual API call
        setOrder({
          id: params.id as string,
          orderNumber: 'SM-2024-001',
          status: 'shipped',
          items: [
            { id: '1', name: 'Berbere Spice (1lb)', quantity: 2, price: 12.99 },
            { id: '2', name: 'Injera (Pack of 5)', quantity: 1, price: 15.99 },
            { id: '3', name: 'Ethiopian Coffee (1lb)', quantity: 1, price: 18.99 },
          ],
          subtotal: 60.96,
          shipping: 5.99,
          total: 66.95,
          shippingAddress: '123 Peachtree St, Atlanta, GA 30301',
          notes: 'Please leave at the front door.',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          trackingNumber: 'USPS123456789',
          statusHistory: [
            { status: 'pending', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
            { status: 'processing', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), note: 'Order is being prepared' },
            { status: 'shipped', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), note: 'Package shipped via USPS' },
          ],
        });
      } catch (err) {
        console.error('Failed to fetch order:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [params.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCurrentStatusIndex = () => {
    if (!order) return -1;
    return statusSteps.findIndex(step => step.key === order.status);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Order not found</h2>
        <p className="text-gray-600 mb-4">The order you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push('/account/orders')}>Back to Orders</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/account/orders')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Orders
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="text-gray-500">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Status timeline */}
      {order.status !== 'cancelled' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-6">Order Progress</h2>
          <div className="flex items-center justify-between mb-6">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const currentIndex = getCurrentStatusIndex();
              const isCompleted = index <= currentIndex;
              const isCurrent = index === currentIndex;

              return (
                <React.Fragment key={step.key}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`mt-2 text-sm text-center ${
                        isCompleted ? 'text-gray-900 font-medium' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        index < currentIndex ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Estimated delivery & tracking */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
            {order.estimatedDelivery && order.status !== 'delivered' && (
              <div className="flex-1">
                <p className="text-sm text-gray-500">Estimated Delivery</p>
                <p className="font-medium text-gray-900">{formatDate(order.estimatedDelivery)}</p>
              </div>
            )}
            {order.trackingNumber && (
              <div className="flex-1">
                <p className="text-sm text-gray-500">Tracking Number</p>
                <p className="font-medium text-primary">{order.trackingNumber}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancelled status */}
      {order.status === 'cancelled' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <h2 className="text-lg font-semibold text-red-900">Order Cancelled</h2>
              <p className="text-red-700">This order has been cancelled. Contact support for assistance.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order items */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Order Items</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {order.items.map((item) => (
              <div key={item.id} className="p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                  <p className="text-sm text-gray-500">{formatPrice(item.price)} each</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{formatPrice(order.shipping)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold pt-2 border-t">
              <span>Total</span>
              <span className="text-primary">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping & support */}
        <div className="space-y-6">
          {/* Shipping address */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-semibold mb-3">Shipping Address</h2>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <span className="text-gray-600">{order.shippingAddress}</span>
            </div>
          </div>

          {/* Order notes */}
          {order.notes && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-lg font-semibold mb-2">Delivery Notes</h2>
              <p className="text-gray-600">{order.notes}</p>
            </div>
          )}

          {/* Status history */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-semibold mb-3">Order Timeline</h2>
            <div className="space-y-4">
              {order.statusHistory.map((event, index) => (
                <div key={index} className="flex gap-3">
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    {index < order.statusHistory.length - 1 && (
                      <div className="absolute top-4 left-0.5 w-1 h-full bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium text-gray-900 capitalize">{event.status}</p>
                    {event.note && <p className="text-sm text-gray-600">{event.note}</p>}
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(event.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Need help */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Need Help?</h3>
                <p className="text-sm text-gray-600 mb-3">Contact us for any questions about your order.</p>
                <div className="space-y-1 text-sm">
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a href="tel:+14703597924" className="text-primary hover:underline">
                      (470) 359-7924
                    </a>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href="mailto:support@sosinamart.com" className="text-primary hover:underline">
                      support@sosinamart.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
