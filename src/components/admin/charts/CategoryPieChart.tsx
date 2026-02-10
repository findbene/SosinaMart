'use client';

import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { formatPrice } from '@/lib/utils';

interface CategoryData {
  category: string;
  orders: number;
  revenue: number;
}

interface CategoryPieChartProps {
  data: CategoryData[];
  height?: number;
  className?: string;
}

const COLORS = ['#16a34a', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

function CategoryTooltip({ active, payload }: {
  active?: boolean;
  payload?: { payload: CategoryData; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
      <p className="font-medium">{item.category}</p>
      <p className="text-green-300 mt-0.5">{formatPrice(item.revenue)}</p>
      <p className="text-gray-300">{item.orders} orders</p>
    </div>
  );
}

export function CategoryPieChart({ data, height = 280, className }: CategoryPieChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  if (!data || data.length === 0) {
    return (
      <div className={className} style={{ height }}>
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          No category data available
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-col lg:flex-row items-center gap-4">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              dataKey="revenue"
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                  opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.5}
                  style={{ transition: 'opacity 0.2s' }}
                />
              ))}
            </Pie>
            <Tooltip content={<CategoryTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap lg:flex-col gap-2 min-w-[140px]">
          {data.map((item, index) => {
            const pct = totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : '0';
            return (
              <button
                key={item.category}
                className={`flex items-center gap-2 text-left text-xs px-2 py-1 rounded transition-colors ${
                  hoveredIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-gray-700 truncate">{item.category}</span>
                <span className="text-gray-400 ml-auto">{pct}%</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
