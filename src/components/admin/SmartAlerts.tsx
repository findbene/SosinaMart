'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Info, Zap, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartAlert {
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  action?: string;
}

const ALERT_STYLES = {
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: <Info className="h-4 w-4 text-blue-500" />,
    title: 'text-blue-900',
    desc: 'text-blue-700',
    actionClass: 'text-blue-600 hover:text-blue-800',
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    title: 'text-amber-900',
    desc: 'text-amber-700',
    actionClass: 'text-amber-600 hover:text-amber-800',
  },
  success: {
    bg: 'bg-green-50 border-green-200',
    icon: <TrendingUp className="h-4 w-4 text-green-500" />,
    title: 'text-green-900',
    desc: 'text-green-700',
    actionClass: 'text-green-600 hover:text-green-800',
  },
  urgent: {
    bg: 'bg-red-50 border-red-200',
    icon: <Zap className="h-4 w-4 text-red-500" />,
    title: 'text-red-900',
    desc: 'text-red-700',
    actionClass: 'text-red-600 hover:text-red-800',
  },
};

interface SmartAlertsProps {
  className?: string;
}

export function SmartAlerts({ className }: SmartAlertsProps) {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  useEffect(() => {
    let mounted = true;

    async function fetchAlerts() {
      try {
        const res = await fetch('/api/admin/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ type: 'alerts' }),
        });

        const json = await res.json();
        if (mounted && json.success && Array.isArray(json.data)) {
          setAlerts(json.data);
        }
      } catch {
        // Silently fail — alerts are non-critical
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchAlerts();
    return () => { mounted = false; };
  }, []);

  const dismiss = (index: number) => {
    setDismissed(prev => new Set(prev).add(index));
  };

  const visibleAlerts = alerts.filter((_, i) => !dismissed.has(i));

  if (isLoading || visibleAlerts.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {visibleAlerts.map((alert, i) => {
        const style = ALERT_STYLES[alert.type] || ALERT_STYLES.info;
        const originalIndex = alerts.indexOf(alert);

        return (
          <div
            key={originalIndex}
            className={cn('flex items-start gap-3 p-3 rounded-lg border', style.bg)}
          >
            <div className="mt-0.5 flex-shrink-0">{style.icon}</div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium', style.title)}>{alert.title}</p>
              <p className={cn('text-xs mt-0.5', style.desc)}>{alert.description}</p>
              {alert.action && (
                <button className={cn('text-xs font-medium mt-1', style.actionClass)}>
                  {alert.action}
                </button>
              )}
            </div>
            <button
              onClick={() => dismiss(originalIndex)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
