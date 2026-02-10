'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface OrdersChartProps {
  data: { status: string; count: number }[];
  height?: number;
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  Pending: '#f59e0b',
  Confirmed: '#3b82f6',
  Processing: '#8b5cf6',
  Shipped: '#06b6d4',
  Delivered: '#16a34a',
  Cancelled: '#ef4444',
};

function OrdersTooltip({ active, payload }: {
  active?: boolean;
  payload?: { payload: { status: string; count: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
      <p className="font-medium">{item.status}</p>
      <p className="mt-0.5">{item.count} orders</p>
    </div>
  );
}

export function OrdersChart({ data, height = 280, className }: OrdersChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={className} style={{ height }}>
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          No order data available
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="status"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            width={40}
            allowDecimals={false}
          />
          <Tooltip content={<OrdersTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_COLORS[entry.status] || '#6b7280'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
