/**
 * AI CRM Service — Gemini 2.5 Flash for admin intelligence
 *
 * Functions:
 * - generateCustomerInsight: AI summary of customer behavior
 * - answerNaturalLanguageQuery: NL to insight for dashboard queries
 * - generateSmartAlerts: AI-powered dashboard alerts
 *
 * All functions gracefully degrade without GEMINI_API_KEY.
 */

import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-2.5-flash';

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

// =============================================
// Customer Insight Generation
// =============================================

export interface CustomerInsightInput {
  name: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  daysSinceLastOrder: number | null;
  customerSince: string;
  healthScore: number;
  healthLabel: string;
  churnRisk: number;
  recentOrders: { orderNumber: string; total: number; status: string; createdAt: string }[];
}

export interface CustomerInsight {
  summary: string;
  purchasePattern: string;
  churnAnalysis: string;
  recommendations: string[];
}

export async function generateCustomerInsight(customer: CustomerInsightInput): Promise<CustomerInsight | null> {
  const client = getClient();
  if (!client) return null;

  const prompt = `You are a CRM analytics assistant for Sosina Mart, an Ethiopian grocery and cultural products store.

Analyze this customer and provide insights in JSON format:

Customer: ${customer.name}
- Total Orders: ${customer.totalOrders}
- Total Spent: $${customer.totalSpent.toFixed(2)}
- Average Order Value: $${customer.averageOrderValue.toFixed(2)}
- Days Since Last Order: ${customer.daysSinceLastOrder ?? 'Never ordered'}
- Customer Since: ${customer.customerSince}
- Health Score: ${customer.healthScore}/100 (${customer.healthLabel})
- Churn Risk: ${Math.round(customer.churnRisk * 100)}%
- Recent Orders: ${customer.recentOrders.map(o => `${o.orderNumber}: $${o.total} (${o.status})`).join(', ') || 'None'}

Return ONLY a JSON object with these fields:
{
  "summary": "2-3 sentence customer behavior summary",
  "purchasePattern": "1-2 sentences about their buying patterns",
  "churnAnalysis": "1-2 sentences about retention outlook",
  "recommendations": ["action 1", "action 2", "action 3"]
}`;

  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    const text = response.text?.trim() ?? '';
    // Extract JSON from potential markdown code blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as CustomerInsight;
  } catch {
    return null;
  }
}

// =============================================
// Natural Language Query
// =============================================

export interface NLQueryContext {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  recentOrders?: { customerName: string; total: number; status: string; createdAt: string }[];
  topProducts?: { name: string; sold: number; revenue: number }[];
  customerSegments?: { label: string; count: number }[];
}

export interface NLQueryResult {
  answer: string;
  type: 'text' | 'metric' | 'list';
  data?: { label: string; value: string }[];
}

export async function answerNaturalLanguageQuery(
  query: string,
  context: NLQueryContext
): Promise<NLQueryResult | null> {
  const client = getClient();
  if (!client) return null;

  const prompt = `You are a business intelligence assistant for Sosina Mart, an Ethiopian store.

Store context:
- Total Orders: ${context.totalOrders}
- Total Revenue: $${context.totalRevenue.toFixed(2)}
- Total Customers: ${context.totalCustomers}
- Total Products: ${context.totalProducts}
${context.topProducts ? `- Top Products: ${context.topProducts.map(p => `${p.name} ($${p.revenue})`).join(', ')}` : ''}
${context.customerSegments ? `- Customer Segments: ${context.customerSegments.map(s => `${s.label}: ${s.count}`).join(', ')}` : ''}
${context.recentOrders ? `- Recent Orders: ${context.recentOrders.slice(0, 5).map(o => `${o.customerName}: $${o.total} (${o.status})`).join(', ')}` : ''}

User question: "${query}"

Return ONLY a JSON object:
{
  "answer": "Clear, concise answer to the question (2-4 sentences max)",
  "type": "text" or "metric" or "list",
  "data": [{"label": "Label", "value": "Value"}] (optional, for metrics/lists)
}`;

  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    const text = response.text?.trim() ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as NLQueryResult;
  } catch {
    return null;
  }
}

// =============================================
// Smart Alerts Generation
// =============================================

export interface SmartAlertInput {
  totalOrders: number;
  totalRevenue: number;
  ordersChange: number;
  revenueChange: number;
  atRiskCustomers: number;
  totalCustomers: number;
  topProducts: { name: string; sold: number }[];
  recentOrders: { customerName: string; total: number; status: string }[];
}

export interface SmartAlert {
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  action?: string;
}

export async function generateSmartAlerts(input: SmartAlertInput): Promise<SmartAlert[]> {
  const client = getClient();
  if (!client) {
    // Return rule-based alerts without AI
    return generateFallbackAlerts(input);
  }

  const prompt = `You are a business intelligence assistant for Sosina Mart.

Current store metrics:
- Total Orders: ${input.totalOrders} (${input.ordersChange >= 0 ? '+' : ''}${input.ordersChange}% change)
- Total Revenue: $${input.totalRevenue.toFixed(2)} (${input.revenueChange >= 0 ? '+' : ''}${input.revenueChange}% change)
- At-Risk Customers: ${input.atRiskCustomers} of ${input.totalCustomers}
- Top Products: ${input.topProducts.map(p => `${p.name} (${p.sold} sold)`).join(', ')}

Generate 2-4 smart alerts for the admin dashboard. Return ONLY a JSON array:
[
  {
    "title": "Short alert title",
    "description": "1-2 sentence explanation",
    "type": "info" or "warning" or "success" or "urgent",
    "action": "Suggested action button text (optional)"
  }
]`;

  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    const text = response.text?.trim() ?? '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return generateFallbackAlerts(input);
    return JSON.parse(jsonMatch[0]) as SmartAlert[];
  } catch {
    return generateFallbackAlerts(input);
  }
}

// Rule-based fallback alerts (no AI needed)
function generateFallbackAlerts(input: SmartAlertInput): SmartAlert[] {
  const alerts: SmartAlert[] = [];

  if (input.revenueChange > 10) {
    alerts.push({
      title: 'Revenue is trending up',
      description: `Revenue increased ${input.revenueChange.toFixed(1)}% compared to last period. Keep the momentum going.`,
      type: 'success',
    });
  } else if (input.revenueChange < -10) {
    alerts.push({
      title: 'Revenue decline detected',
      description: `Revenue dropped ${Math.abs(input.revenueChange).toFixed(1)}% compared to last period. Consider running a promotion.`,
      type: 'warning',
      action: 'View Analytics',
    });
  }

  if (input.atRiskCustomers > 0) {
    const pct = Math.round((input.atRiskCustomers / Math.max(1, input.totalCustomers)) * 100);
    alerts.push({
      title: `${input.atRiskCustomers} customers at risk`,
      description: `${pct}% of your customers haven't ordered recently. Consider a win-back campaign.`,
      type: input.atRiskCustomers > 3 ? 'urgent' : 'warning',
      action: 'View At-Risk',
    });
  }

  if (input.topProducts.length > 0) {
    const top = input.topProducts[0];
    alerts.push({
      title: `${top.name} is your top seller`,
      description: `${top.sold} units sold this period. Consider featuring it more prominently.`,
      type: 'info',
    });
  }

  if (input.ordersChange > 15) {
    alerts.push({
      title: 'Order volume surging',
      description: `Orders are up ${input.ordersChange.toFixed(1)}% — great momentum. Ensure inventory is stocked.`,
      type: 'success',
    });
  }

  return alerts.slice(0, 4);
}
