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
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/ui/badge';
import { useToast } from '@/context/ToastContext';
import { formatPrice } from '@/lib/utils';
import { Breadcrumb } from '@/components/admin/Breadcrumb';

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
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { success, error } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock data
        setOrder({
          id: params.id as string,
          orderNumber: 'SM-2024-001',
          status: 'processing',
          customer: {
            name: 'Abebe Kebede',
            email: 'abebe@example.com',
            phone: '+1 470-359-7924',
            address: '123 Peachtree St, Atlanta, GA 30301',
          },
          items: [
            { id: '1', name: 'Berbere Spice', quantity: 2, price: 12.99 },
            { id: '2', name: 'Injera (Pack of 5)', quantity: 1, price: 15.99 },
            { id: '3', name: 'Ethiopian Coffee (1lb)', quantity: 1, price: 18.99 },
          ],
          subtotal: 60.96,
          shipping: 5.99,
          total: 66.95,
          notes: 'Please leave at the front door.',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
          statusHistory: [
            { status: 'pending', timestamp: new Date(Date.now() - 86400000).toISOString() },
            { status: 'processing', timestamp: new Date().toISOString(), note: 'Order is being prepared' },
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

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;

    setIsUpdating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setOrder(prev => prev ? { ...prev, status: newStatus as OrderDetail['status'] } : null);
      success(`Order status updated to ${newStatus}`, 'Status Updated');
    } catch (err) {
      error('Failed to update order status', 'Error');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
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
        <Button onClick={() => router.push('/admin/orders')}>Back to Orders</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Orders', href: '/admin/orders' },
        { label: order.orderNumber },
      ]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/orders')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
            <p className="text-gray-500">Placed on {formatDate(order.createdAt)}</p>
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Status timeline */}
      {order.status !== 'cancelled' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-6">Order Progress</h2>
          <div className="flex items-center justify-between">
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
                      className={`mt-2 text-sm ${
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

        {/* Customer & Actions */}
        <div className="space-y-6">
          {/* Customer info */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-semibold mb-4">Customer</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900">{order.customer.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <a href={`mailto:${order.customer.email}`} className="text-primary hover:underline">
                  {order.customer.email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <a href={`tel:${order.customer.phone}`} className="text-primary hover:underline">
                  {order.customer.phone}
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <span className="text-gray-600">{order.customer.address}</span>
              </div>
            </div>
          </div>

          {/* Order notes */}
          {order.notes && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-lg font-semibold mb-2">Notes</h2>
              <p className="text-gray-600">{order.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-semibold mb-4">Update Status</h2>
            <div className="space-y-2">
              {order.status === 'pending' && (
                <Button
                  className="w-full"
                  onClick={() => handleStatusUpdate('processing')}
                  disabled={isUpdating}
                >
                  Mark as Processing
                </Button>
              )}
              {order.status === 'processing' && (
                <Button
                  className="w-full"
                  onClick={() => handleStatusUpdate('shipped')}
                  disabled={isUpdating}
                >
                  Mark as Shipped
                </Button>
              )}
              {order.status === 'shipped' && (
                <Button
                  className="w-full"
                  onClick={() => handleStatusUpdate('delivered')}
                  disabled={isUpdating}
                >
                  Mark as Delivered
                </Button>
              )}
              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                <Button
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 hover:border-red-300"
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={isUpdating}
                >
                  Cancel Order
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
