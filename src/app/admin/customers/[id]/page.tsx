'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingCart,
  DollarSign,
  MessageSquare,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerStatusBadge, OrderStatusBadge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPrice } from '@/lib/utils';

interface CustomerOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

interface CustomerInteraction {
  id: string;
  type: 'note' | 'email' | 'call';
  content: string;
  createdAt: string;
  createdBy: string;
}

interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'vip';
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderAt: string | null;
  createdAt: string;
  orders: CustomerOrder[];
  interactions: CustomerInteraction[];
}

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));

        setCustomer({
          id: params.id as string,
          name: 'Abebe Kebede',
          email: 'abebe@example.com',
          phone: '+1 470-359-7924',
          address: '123 Peachtree St, Atlanta, GA 30301',
          status: 'vip',
          totalOrders: 12,
          totalSpent: 1245.50,
          averageOrderValue: 103.79,
          lastOrderAt: new Date().toISOString(),
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          orders: [
            {
              id: '1',
              orderNumber: 'SM-2024-001',
              total: 89.99,
              status: 'delivered',
              createdAt: new Date().toISOString(),
            },
            {
              id: '2',
              orderNumber: 'SM-2024-002',
              total: 156.50,
              status: 'shipped',
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: '3',
              orderNumber: 'SM-2023-045',
              total: 245.00,
              status: 'delivered',
              createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
          interactions: [
            {
              id: '1',
              type: 'note',
              content: 'Customer prefers delivery in the evening.',
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              createdBy: 'Admin',
            },
            {
              id: '2',
              type: 'email',
              content: 'Sent promotional email for Ethiopian New Year sale.',
              createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
              createdBy: 'System',
            },
          ],
        });
      } catch (err) {
        console.error('Failed to fetch customer:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomer();
  }, [params.id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    // In production, this would call an API
    if (customer) {
      setCustomer({
        ...customer,
        interactions: [
          {
            id: Date.now().toString(),
            type: 'note',
            content: newNote,
            createdAt: new Date().toISOString(),
            createdBy: 'Admin',
          },
          ...customer.interactions,
        ],
      });
    }
    setNewNote('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Customer not found</h2>
        <p className="text-gray-600 mb-4">The customer you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push('/admin/customers')}>Back to Customers</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/customers')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
      </div>

      {/* Customer profile card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <UserAvatar name={customer.name} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
              <CustomerStatusBadge status={customer.status} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${customer.email}`} className="hover:text-primary">
                  {customer.email}
                </a>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${customer.phone}`} className="hover:text-primary">
                    {customer.phone}
                  </a>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{customer.address}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Customer since {formatDate(customer.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-sm">Total Orders</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{customer.totalOrders}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Total Spent</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatPrice(customer.totalSpent)}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Avg. Order</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatPrice(customer.averageOrderValue)}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Last Order</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{formatDate(customer.lastOrderAt)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Orders ({customer.orders.length})</TabsTrigger>
          <TabsTrigger value="interactions">Notes & Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <div className="bg-white rounded-lg border border-gray-200">
            {customer.orders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No orders yet
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {customer.orders.map((order) => (
                  <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <OrderStatusBadge status={order.status} />
                      <span className="font-medium">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="interactions">
          <div className="bg-white rounded-lg border border-gray-200">
            {/* Add note form */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex gap-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this customer..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                  rows={2}
                />
                <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            {/* Interactions list */}
            {customer.interactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No notes or activity yet
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {customer.interactions.map((interaction) => (
                  <div key={interaction.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900">{interaction.content}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {interaction.createdBy} &middot; {formatDate(interaction.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
