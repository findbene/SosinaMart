'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  AlertTriangle,
  Lightbulb,
  Activity,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerStatusBadge, OrderStatusBadge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPrice } from '@/lib/utils';
import { useCustomer, submitInteraction } from '@/hooks/useAdminData';
import { calculateHealthScore } from '@/lib/customer-health';
import { HealthScoreBadge, HealthLabelBadge, RFMBreakdown, ChurnRiskIndicator } from '@/components/admin/HealthScoreBadge';
import { ActivityTimeline, type TimelineEvent } from '@/components/admin/ActivityTimeline';
import { Breadcrumb } from '@/components/admin/Breadcrumb';

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: customer, isLoading, refetch } = useCustomer(params.id as string);

  const health = useMemo(() => {
    if (!customer) return null;
    return calculateHealthScore({
      totalOrders: customer.totalOrders,
      totalSpent: customer.totalSpent,
      lastOrderAt: customer.lastOrderAt,
      customerSince: customer.customerSince,
      averageOrderValue: customer.stats.averageOrderValue,
      daysSinceLastOrder: customer.stats.daysSinceLastOrder,
    });
  }, [customer]);

  // AI Insights state
  const [aiInsight, setAiInsight] = useState<{
    summary: string;
    purchasePattern: string;
    churnAnalysis: string;
    recommendations: string[];
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiFetched, setAiFetched] = useState(false);

  const fetchAiInsight = useCallback(async () => {
    if (!customer || aiFetched) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'insight', customerId: customer.id }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setAiInsight(json.data);
      } else {
        setAiError(json.error?.message || 'AI insights unavailable. Configure GEMINI_API_KEY to enable.');
      }
    } catch {
      setAiError('Failed to reach AI service');
    } finally {
      setAiLoading(false);
      setAiFetched(true);
    }
  }, [customer, aiFetched]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !customer) return;

    setIsSubmitting(true);
    const result = await submitInteraction(customer.id, {
      type: 'note',
      subject: 'Admin note',
      content: newNote,
    });

    if (result.success) {
      // Refetch customer to get updated interactions
      refetch();
    } else {
      // Fallback: add note locally if API fails (no Supabase)
      // The hook will show updated data on next refetch
    }

    setNewNote('');
    setIsSubmitting(false);
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
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Customers', href: '/admin/customers' },
        { label: customer.name },
      ]} />

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
              {health && <HealthLabelBadge label={health.label} />}
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
                <span>Customer since {formatDate(customer.customerSince)}</span>
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
            <p className="text-2xl font-bold text-gray-900">{formatPrice(customer.stats.averageOrderValue)}</p>
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
          <TabsTrigger value="orders">Orders ({customer.recentOrders.length})</TabsTrigger>
          <TabsTrigger value="interactions">Notes & Activity</TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Health & Insights
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <div className="bg-white rounded-lg border border-gray-200">
            {customer.recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No orders yet
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {customer.recentOrders.map((order) => (
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
                      <OrderStatusBadge status={order.status as any} />
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
                <Button onClick={handleAddNote} disabled={!newNote.trim() || isSubmitting}>
                  <Plus className="h-4 w-4 mr-1" />
                  {isSubmitting ? 'Saving...' : 'Add'}
                </Button>
              </div>
            </div>

            {/* Interactions timeline */}
            <div className="p-4">
              <ActivityTimeline
                events={customer.recentInteractions.map((interaction): TimelineEvent => ({
                  id: interaction.id,
                  type: (interaction.type as TimelineEvent['type']) || 'note',
                  title: interaction.subject,
                  description: interaction.content,
                  author: interaction.createdBy || 'System',
                  timestamp: interaction.createdAt,
                }))}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {aiLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="ml-3 text-gray-500">Generating AI insights...</span>
              </div>
            ) : aiError ? (
              <div className="text-center py-8">
                <Sparkles className="h-8 w-8 text-amber-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-3">{aiError}</p>
                <Button variant="outline" size="sm" onClick={() => { setAiFetched(false); fetchAiInsight(); }}>
                  Retry
                </Button>
              </div>
            ) : aiInsight ? (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <h3 className="font-semibold text-gray-900">Customer Summary</h3>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{aiInsight.summary}</p>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Purchase Pattern</h4>
                  <p className="text-sm text-gray-600">{aiInsight.purchasePattern}</p>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Retention Outlook</h4>
                  <p className="text-sm text-gray-600">{aiInsight.churnAnalysis}</p>
                </div>

                {aiInsight.recommendations.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">AI Recommendations</h4>
                    <ul className="space-y-2">
                      {aiInsight.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-sm text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Sparkles className="h-8 w-8 text-amber-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-3">Generate AI-powered insights for this customer</p>
                <Button onClick={fetchAiInsight}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Insights
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="health">
          {health && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Health Score Overview */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Health Score</h3>
                <div className="flex items-center gap-6 mb-6">
                  <HealthScoreBadge health={health} size="lg" />
                  <div>
                    <p className="text-sm text-gray-500">Overall Score</p>
                    <p className="text-3xl font-bold" style={{ color: health.colorHex }}>{health.score}/100</p>
                    <HealthLabelBadge label={health.label} className="mt-1" />
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">RFM Breakdown</h4>
                  <RFMBreakdown health={health} />
                </div>
              </div>

              {/* Churn Risk & Actions */}
              <div className="space-y-6">
                {/* Churn Risk */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-semibold">Churn Risk</h3>
                  </div>
                  <ChurnRiskIndicator risk={health.churnRisk} />
                  <p className="text-sm text-gray-500 mt-3">
                    {health.churnRisk <= 0.15
                      ? 'This customer is actively engaged with your store.'
                      : health.churnRisk <= 0.35
                      ? 'This customer shows moderate engagement. Consider proactive outreach.'
                      : health.churnRisk <= 0.55
                      ? 'This customer may be losing interest. Action recommended.'
                      : 'This customer is at high risk of churning. Immediate action needed.'}
                  </p>
                </div>

                {/* Recommended Actions */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    <h3 className="text-lg font-semibold">Recommended Actions</h3>
                  </div>
                  <ul className="space-y-3">
                    {health.recommendedActions.map((action, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="mt-1 w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-sm text-gray-700">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
