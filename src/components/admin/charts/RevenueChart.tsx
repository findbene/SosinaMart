'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatPrice } from '@/lib/utils';

interface RevenueChartProps {
  data: { month: string; amount: number }[];
  height?: number;
  showGrid?: boolean;
  className?: string;
}

function RevenueTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
      <p className="font-medium">{label}</p>
      <p className="text-green-300 mt-0.5">{formatPrice(payload[0].value)}</p>
    </div>
  );
}

export function RevenueChart({ data, height = 280, showGrid = true, className }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={className} style={{ height }} >
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          No revenue data available
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          )}
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={50}
          />
          <Tooltip content={<RevenueTooltip />} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#16a34a"
            strokeWidth={2.5}
            fill="url(#revenueGradient)"
            dot={{ r: 4, fill: '#16a34a', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#16a34a', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
