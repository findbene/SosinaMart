'use client';

import React, { useState } from 'react';
import { Plus, X, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// =============================================
// Types
// =============================================

export interface SegmentRule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface Segment {
  id?: string;
  name: string;
  description: string;
  rules: SegmentRule[];
  isActive: boolean;
}

// =============================================
// Field Definitions
// =============================================

const FIELDS = [
  { key: 'total_spent', label: 'Total Spent', type: 'number' as const },
  { key: 'total_orders', label: 'Total Orders', type: 'number' as const },
  { key: 'average_order_value', label: 'Avg Order Value', type: 'number' as const },
  { key: 'days_since_last_order', label: 'Days Since Last Order', type: 'number' as const },
  { key: 'days_since_signup', label: 'Days Since Signup', type: 'number' as const },
  { key: 'health_score', label: 'Health Score', type: 'number' as const },
  { key: 'status', label: 'Status', type: 'select' as const },
];

const NUMBER_OPERATORS = [
  { key: 'gte', label: '>=' },
  { key: 'lte', label: '<=' },
  { key: 'gt', label: '>' },
  { key: 'lt', label: '<' },
  { key: 'eq', label: '=' },
];

const SELECT_OPERATORS = [
  { key: 'eq', label: 'is' },
  { key: 'neq', label: 'is not' },
];

const STATUS_VALUES = ['active', 'inactive', 'blocked'];

// =============================================
// Preset Segments
// =============================================

const PRESET_SEGMENTS: Segment[] = [
  {
    name: 'VIP Customers',
    description: 'High-value customers who spent over $500',
    rules: [{ id: 'p1', field: 'total_spent', operator: 'gte', value: '500' }],
    isActive: true,
  },
  {
    name: 'Champions',
    description: 'Top-performing customers with health score 80+',
    rules: [{ id: 'p2', field: 'health_score', operator: 'gte', value: '80' }],
    isActive: true,
  },
  {
    name: 'At Risk',
    description: 'Customers who haven\'t ordered in 90+ days',
    rules: [{ id: 'p3', field: 'days_since_last_order', operator: 'gte', value: '90' }],
    isActive: true,
  },
  {
    name: 'Repeat Buyers',
    description: 'Customers with 3 or more orders',
    rules: [{ id: 'p4', field: 'total_orders', operator: 'gte', value: '3' }],
    isActive: true,
  },
  {
    name: 'New Customers',
    description: 'Customers who joined in the last 30 days',
    rules: [{ id: 'p5', field: 'days_since_signup', operator: 'lte', value: '30' }],
    isActive: true,
  },
  {
    name: 'High Value',
    description: 'Avg order value over $100',
    rules: [{ id: 'p6', field: 'average_order_value', operator: 'gte', value: '100' }],
    isActive: true,
  },
];

// =============================================
// Rule Row Component
// =============================================

interface RuleRowProps {
  rule: SegmentRule;
  onChange: (rule: SegmentRule) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function RuleRow({ rule, onChange, onRemove, canRemove }: RuleRowProps) {
  const field = FIELDS.find(f => f.key === rule.field);
  const operators = field?.type === 'select' ? SELECT_OPERATORS : NUMBER_OPERATORS;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={rule.field}
        onChange={(e) => onChange({ ...rule, field: e.target.value, value: '' })}
        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
      >
        {FIELDS.map(f => (
          <option key={f.key} value={f.key}>{f.label}</option>
        ))}
      </select>

      <select
        value={rule.operator}
        onChange={(e) => onChange({ ...rule, operator: e.target.value })}
        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
      >
        {operators.map(o => (
          <option key={o.key} value={o.key}>{o.label}</option>
        ))}
      </select>

      {field?.type === 'select' && rule.field === 'status' ? (
        <select
          value={rule.value}
          onChange={(e) => onChange({ ...rule, value: e.target.value })}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="">Select...</option>
          {STATUS_VALUES.map(v => (
            <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
          ))}
        </select>
      ) : (
        <input
          type="number"
          value={rule.value}
          onChange={(e) => onChange({ ...rule, value: e.target.value })}
          placeholder="Value"
          className="w-24 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      )}

      {canRemove && (
        <button
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// =============================================
// SegmentBuilder Component
// =============================================

interface SegmentBuilderProps {
  onSave?: (segment: Segment) => void;
  className?: string;
}

export function SegmentBuilder({ onSave, className }: SegmentBuilderProps) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [segment, setSegment] = useState<Segment>({
    name: '',
    description: '',
    rules: [{ id: crypto.randomUUID?.() ?? String(Date.now()), field: 'total_spent', operator: 'gte', value: '' }],
    isActive: true,
  });

  const addRule = () => {
    setSegment({
      ...segment,
      rules: [
        ...segment.rules,
        { id: crypto.randomUUID?.() ?? String(Date.now()), field: 'total_spent', operator: 'gte', value: '' },
      ],
    });
  };

  const updateRule = (index: number, updated: SegmentRule) => {
    const rules = [...segment.rules];
    rules[index] = updated;
    setSegment({ ...segment, rules });
  };

  const removeRule = (index: number) => {
    setSegment({ ...segment, rules: segment.rules.filter((_, i) => i !== index) });
  };

  const loadPreset = (preset: Segment) => {
    setSegment({ ...preset, rules: preset.rules.map(r => ({ ...r })) });
    setShowBuilder(true);
  };

  const handleSave = () => {
    if (!segment.name.trim()) return;
    onSave?.(segment);
    setSegment({
      name: '',
      description: '',
      rules: [{ id: crypto.randomUUID?.() ?? String(Date.now()), field: 'total_spent', operator: 'gte', value: '' }],
      isActive: true,
    });
    setShowBuilder(false);
  };

  const handleReset = () => {
    setSegment({
      name: '',
      description: '',
      rules: [{ id: crypto.randomUUID?.() ?? String(Date.now()), field: 'total_spent', operator: 'gte', value: '' }],
      isActive: true,
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Preset Segments */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Segments</h3>
        <div className="flex flex-wrap gap-2">
          {PRESET_SEGMENTS.map((preset, i) => (
            <button
              key={i}
              onClick={() => loadPreset(preset)}
              className="px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-700 rounded-full border border-gray-200 hover:bg-primary/5 hover:border-primary hover:text-primary transition-all"
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Segment Builder */}
      {!showBuilder ? (
        <Button variant="outline" onClick={() => setShowBuilder(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Segment
        </Button>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Custom Segment</h3>
            <button onClick={() => setShowBuilder(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Segment Name</label>
              <input
                type="text"
                value={segment.name}
                onChange={(e) => setSegment({ ...segment, name: e.target.value })}
                placeholder="e.g., High-Value At Risk"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input
                type="text"
                value={segment.description}
                onChange={(e) => setSegment({ ...segment, description: e.target.value })}
                placeholder="Brief description..."
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Rules <span className="text-gray-400">(all must match)</span>
            </label>
            <div className="space-y-2">
              {segment.rules.map((rule, index) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  onChange={(updated) => updateRule(index, updated)}
                  onRemove={() => removeRule(index)}
                  canRemove={segment.rules.length > 1}
                />
              ))}
            </div>
            <button
              onClick={addRule}
              className="mt-2 text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Add condition
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!segment.name.trim()}>
              <Save className="h-3.5 w-3.5 mr-1" />
              Save Segment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
