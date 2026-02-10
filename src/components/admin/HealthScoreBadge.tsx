'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { HealthScore, HealthLabel } from '@/lib/customer-health';
import { getLabelBgColor } from '@/lib/customer-health';

// =============================================
// Circular Progress Ring (SVG)
// =============================================

interface RingProps {
  score: number;
  colorHex: string;
  size: number;
  strokeWidth: number;
}

function ScoreRing({ score, colorHex, size, strokeWidth }: RingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={colorHex}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  );
}

// =============================================
// Size Configurations
// =============================================

const SIZES = {
  sm: { ring: 32, stroke: 3, textClass: 'text-xs font-bold', labelClass: 'hidden' },
  md: { ring: 48, stroke: 4, textClass: 'text-sm font-bold', labelClass: 'text-[10px] text-gray-500' },
  lg: { ring: 80, stroke: 6, textClass: 'text-xl font-bold', labelClass: 'text-xs text-gray-500 mt-0.5' },
} as const;

// =============================================
// HealthScoreBadge
// =============================================

interface HealthScoreBadgeProps {
  health: HealthScore;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function HealthScoreBadge({ health, size = 'md', showLabel = true, className }: HealthScoreBadgeProps) {
  const config = SIZES[size];

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative">
        <ScoreRing
          score={health.score}
          colorHex={health.colorHex}
          size={config.ring}
          strokeWidth={config.stroke}
        />
        {/* Score number centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(config.textClass, health.color)}>{health.score}</span>
        </div>
      </div>
      {showLabel && size !== 'sm' && (
        <span className={config.labelClass}>{health.label}</span>
      )}
    </div>
  );
}

// =============================================
// Health Label Badge (pill style)
// =============================================

interface HealthLabelBadgeProps {
  label: HealthLabel;
  size?: 'sm' | 'default';
  className?: string;
}

export function HealthLabelBadge({ label, size = 'default', className }: HealthLabelBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold',
        getLabelBgColor(label),
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
        className
      )}
    >
      {label}
    </span>
  );
}

// =============================================
// RFM Breakdown Card
// =============================================

interface RFMBreakdownProps {
  health: HealthScore;
  className?: string;
}

export function RFMBreakdown({ health, className }: RFMBreakdownProps) {
  const dimensions = [
    { label: 'Recency', value: health.recency, max: 33, desc: 'How recently they ordered' },
    { label: 'Frequency', value: health.frequency, max: 33, desc: 'How often they order' },
    { label: 'Monetary', value: health.monetary, max: 34, desc: 'How much they spend' },
  ];

  return (
    <div className={cn('space-y-3', className)}>
      {dimensions.map((dim) => {
        const pct = (dim.value / dim.max) * 100;
        return (
          <div key={dim.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700 font-medium">{dim.label}</span>
              <span className="text-gray-500">{dim.value}/{dim.max}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: health.colorHex }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{dim.desc}</p>
          </div>
        );
      })}
    </div>
  );
}

// =============================================
// Churn Risk Indicator
// =============================================

interface ChurnRiskProps {
  risk: number; // 0-1
  className?: string;
}

export function ChurnRiskIndicator({ risk, className }: ChurnRiskProps) {
  const pct = Math.round(risk * 100);
  let color: string;
  let label: string;

  if (pct <= 15) {
    color = 'text-green-600';
    label = 'Low';
  } else if (pct <= 35) {
    color = 'text-yellow-600';
    label = 'Moderate';
  } else if (pct <= 55) {
    color = 'text-orange-600';
    label = 'High';
  } else {
    color = 'text-red-600';
    label = 'Critical';
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: pct <= 15 ? '#16a34a' : pct <= 35 ? '#ca8a04' : pct <= 55 ? '#ea580c' : '#dc2626',
          }}
        />
      </div>
      <span className={cn('text-sm font-medium whitespace-nowrap', color)}>
        {pct}% — {label}
      </span>
    </div>
  );
}
