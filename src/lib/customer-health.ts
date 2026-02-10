/**
 * Customer Health Scoring — RFM-based algorithm
 *
 * Recency  (0-33 pts): Days since last order
 * Frequency (0-33 pts): Orders per month average
 * Monetary  (0-34 pts): Total spend relative to average
 *
 * Score: 0-100
 * Labels: Champion (80-100), Loyal (60-79), Promising (40-59), At Risk (20-39), Lost (0-19)
 */

// =============================================
// Types
// =============================================

export type HealthLabel = 'Champion' | 'Loyal' | 'Promising' | 'At Risk' | 'Lost';

export interface HealthScore {
  score: number;        // 0-100
  label: HealthLabel;
  color: string;        // Tailwind color class
  colorHex: string;     // Hex for SVG / charts
  recency: number;      // 0-33
  frequency: number;    // 0-33
  monetary: number;     // 0-34
  churnRisk: number;    // 0-1 probability
  recommendedActions: string[];
}

export interface CustomerHealthInput {
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;  // ISO date
  customerSince: string;       // ISO date
  averageOrderValue: number;
  daysSinceLastOrder?: number | null;
}

// =============================================
// Constants
// =============================================

// Average customer benchmarks (used for relative scoring)
const AVG_MONTHLY_ORDERS = 1.5;
const AVG_TOTAL_SPENT = 300;

// =============================================
// Scoring Functions
// =============================================

function scoreRecency(daysSinceLastOrder: number | null): number {
  if (daysSinceLastOrder === null) return 0; // Never ordered
  if (daysSinceLastOrder <= 7) return 33;
  if (daysSinceLastOrder <= 14) return 28;
  if (daysSinceLastOrder <= 30) return 25;
  if (daysSinceLastOrder <= 60) return 15;
  if (daysSinceLastOrder <= 90) return 8;
  return 0;
}

function scoreFrequency(totalOrders: number, monthsAsCustomer: number): number {
  if (monthsAsCustomer <= 0 || totalOrders === 0) return 0;
  const ordersPerMonth = totalOrders / monthsAsCustomer;
  const ratio = ordersPerMonth / AVG_MONTHLY_ORDERS;

  if (ratio >= 2.0) return 33;
  if (ratio >= 1.5) return 28;
  if (ratio >= 1.0) return 22;
  if (ratio >= 0.5) return 15;
  if (ratio >= 0.25) return 8;
  return 3;
}

function scoreMonetary(totalSpent: number): number {
  const ratio = totalSpent / AVG_TOTAL_SPENT;

  if (ratio >= 3.0) return 34;
  if (ratio >= 2.0) return 28;
  if (ratio >= 1.5) return 22;
  if (ratio >= 1.0) return 17;
  if (ratio >= 0.5) return 10;
  if (ratio > 0) return 5;
  return 0;
}

// =============================================
// Label & Color Mapping
// =============================================

function getLabel(score: number): HealthLabel {
  if (score >= 80) return 'Champion';
  if (score >= 60) return 'Loyal';
  if (score >= 40) return 'Promising';
  if (score >= 20) return 'At Risk';
  return 'Lost';
}

function getColor(label: HealthLabel): { color: string; colorHex: string } {
  switch (label) {
    case 'Champion':
      return { color: 'text-green-600', colorHex: '#16a34a' };
    case 'Loyal':
      return { color: 'text-lime-600', colorHex: '#65a30d' };
    case 'Promising':
      return { color: 'text-yellow-600', colorHex: '#ca8a04' };
    case 'At Risk':
      return { color: 'text-orange-600', colorHex: '#ea580c' };
    case 'Lost':
      return { color: 'text-red-600', colorHex: '#dc2626' };
  }
}

export function getLabelBgColor(label: HealthLabel): string {
  switch (label) {
    case 'Champion': return 'bg-green-100 text-green-800';
    case 'Loyal': return 'bg-lime-100 text-lime-800';
    case 'Promising': return 'bg-yellow-100 text-yellow-800';
    case 'At Risk': return 'bg-orange-100 text-orange-800';
    case 'Lost': return 'bg-red-100 text-red-800';
  }
}

// =============================================
// Churn Prediction
// =============================================

function predictChurn(daysSinceLastOrder: number | null, totalOrders: number, monthsAsCustomer: number): number {
  // No orders ever — high churn
  if (totalOrders === 0 || daysSinceLastOrder === null) return 0.9;

  // Calculate expected order gap based on frequency
  const avgGapDays = monthsAsCustomer > 0
    ? (monthsAsCustomer * 30) / totalOrders
    : 30;

  // How many "expected gaps" have passed since last order
  const gapRatio = daysSinceLastOrder / avgGapDays;

  if (gapRatio <= 1.0) return 0.05;   // Within expected gap
  if (gapRatio <= 1.5) return 0.15;   // Slightly overdue
  if (gapRatio <= 2.0) return 0.35;   // Overdue
  if (gapRatio <= 3.0) return 0.55;   // Significantly overdue
  if (gapRatio <= 5.0) return 0.75;   // Likely churned
  return 0.9;                          // Almost certainly churned
}

// =============================================
// Recommended Actions
// =============================================

function getRecommendedActions(label: HealthLabel, daysSinceLastOrder: number | null, totalOrders: number): string[] {
  switch (label) {
    case 'Champion':
      return [
        'Send exclusive VIP offers or early access to new products',
        'Request a product review or testimonial',
        'Offer a loyalty reward or referral bonus',
      ];
    case 'Loyal':
      return [
        'Send personalized product recommendations',
        'Offer a small discount on their next order',
        'Invite to loyalty or rewards program',
      ];
    case 'Promising':
      return [
        'Send a curated collection based on past purchases',
        'Offer free shipping on next order',
        'Share new arrivals that match their interests',
      ];
    case 'At Risk':
      return [
        `Send a win-back email — last order was ${daysSinceLastOrder ?? 'unknown'} days ago`,
        'Offer a time-limited discount to re-engage',
        'Ask for feedback on their experience',
      ];
    case 'Lost':
      return totalOrders > 0
        ? [
            'Send a re-engagement campaign with a strong offer',
            'Survey to understand why they stopped ordering',
            'Consider a phone call for high-value lost customers',
          ]
        : [
            'Send a welcome series with best-selling products',
            'Offer a first-order discount',
            'Showcase customer reviews and social proof',
          ];
  }
}

// =============================================
// Main Scoring Function
// =============================================

export function calculateHealthScore(input: CustomerHealthInput): HealthScore {
  const now = new Date();

  // Calculate days since last order
  let daysSinceLastOrder: number | null = input.daysSinceLastOrder ?? null;
  if (daysSinceLastOrder === null && input.lastOrderAt) {
    const lastOrder = new Date(input.lastOrderAt);
    daysSinceLastOrder = Math.floor((now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Calculate months as customer
  const customerSinceDate = new Date(input.customerSince);
  const monthsAsCustomer = Math.max(0.5,
    (now.getTime() - customerSinceDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  // Score each dimension
  const recency = scoreRecency(daysSinceLastOrder);
  const frequency = scoreFrequency(input.totalOrders, monthsAsCustomer);
  const monetary = scoreMonetary(input.totalSpent);

  const score = Math.min(100, recency + frequency + monetary);
  const label = getLabel(score);
  const { color, colorHex } = getColor(label);
  const churnRisk = predictChurn(daysSinceLastOrder, input.totalOrders, monthsAsCustomer);
  const recommendedActions = getRecommendedActions(label, daysSinceLastOrder, input.totalOrders);

  return {
    score,
    label,
    color,
    colorHex,
    recency,
    frequency,
    monetary,
    churnRisk,
    recommendedActions,
  };
}

/**
 * Batch-calculate health scores for a list of customers.
 */
export function calculateBatchHealthScores(
  customers: CustomerHealthInput[]
): HealthScore[] {
  return customers.map(calculateHealthScore);
}

/**
 * Get health distribution summary from a list of scores.
 */
export function getHealthDistribution(scores: HealthScore[]): Record<HealthLabel, number> {
  const dist: Record<HealthLabel, number> = {
    Champion: 0,
    Loyal: 0,
    Promising: 0,
    'At Risk': 0,
    Lost: 0,
  };
  for (const s of scores) {
    dist[s.label]++;
  }
  return dist;
}
