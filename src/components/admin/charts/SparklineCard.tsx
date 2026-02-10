'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

interface SparklineCardProps {
  title: string;
  value: string | number;
  data: number[];
  change?: number;
  color?: 'green' | 'blue' | 'amber' | 'purple';
  icon?: React.ReactNode;
  className?: string;
}

const COLOR_MAP = {
  green: { stroke: '#16a34a', fill: '#16a34a' },
  blue: { stroke: '#3b82f6', fill: '#3b82f6' },
  amber: { stroke: '#f59e0b', fill: '#f59e0b' },
  purple: { stroke: '#8b5cf6', fill: '#8b5cf6' },
};

export function SparklineCard({
  title,
  value,
  data,
  change,
  color = 'green',
  icon,
  className,
}: SparklineCardProps) {
  const colors = COLOR_MAP[color];
  const chartData = data.map((v, i) => ({ i, v }));

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-4', className)}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <p className={cn(
              'text-xs font-medium mt-0.5',
              change >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {change >= 0 ? '+' : ''}{change}% vs last period
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-gray-50">
            {icon}
          </div>
        )}
      </div>
      {chartData.length > 1 && (
        <div className="mt-2">
          <ResponsiveContainer width="100%" height={48}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.fill} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={colors.fill} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={colors.stroke}
                strokeWidth={1.5}
                fill={`url(#spark-${color})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
