'use client';

import React from 'react';
import {
  MessageSquare,
  Mail,
  Phone,
  ShoppingCart,
  UserPlus,
  FileText,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimelineEvent {
  id: string;
  type: 'note' | 'email' | 'call' | 'order' | 'signup' | 'status_change' | 'system';
  title: string;
  description?: string;
  author?: string;
  timestamp: string;
  meta?: Record<string, string>;
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const EVENT_ICONS: Record<TimelineEvent['type'], { icon: React.ReactNode; bg: string }> = {
  note: { icon: <MessageSquare className="h-3.5 w-3.5 text-blue-600" />, bg: 'bg-blue-100' },
  email: { icon: <Mail className="h-3.5 w-3.5 text-purple-600" />, bg: 'bg-purple-100' },
  call: { icon: <Phone className="h-3.5 w-3.5 text-green-600" />, bg: 'bg-green-100' },
  order: { icon: <ShoppingCart className="h-3.5 w-3.5 text-amber-600" />, bg: 'bg-amber-100' },
  signup: { icon: <UserPlus className="h-3.5 w-3.5 text-emerald-600" />, bg: 'bg-emerald-100' },
  status_change: { icon: <FileText className="h-3.5 w-3.5 text-gray-600" />, bg: 'bg-gray-100' },
  system: { icon: <Clock className="h-3.5 w-3.5 text-gray-500" />, bg: 'bg-gray-100' },
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function ActivityTimeline({ events, className }: ActivityTimelineProps) {
  if (events.length === 0) {
    return (
      <div className={cn('py-8 text-center text-gray-500', className)}>
        No activity yet
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Vertical line */}
      <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200" />

      <div className="space-y-0">
        {events.map((event, index) => {
          const { icon, bg } = EVENT_ICONS[event.type] || EVENT_ICONS.system;
          const isLast = index === events.length - 1;

          return (
            <div key={event.id} className={cn('relative flex gap-4 pl-0', !isLast && 'pb-4')}>
              {/* Icon node */}
              <div className={cn('relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', bg)}>
                {icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">{event.title}</p>
                  <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                    {formatRelativeTime(event.timestamp)}
                  </span>
                </div>
                {event.description && (
                  <p className="text-sm text-gray-600 mt-0.5">{event.description}</p>
                )}
                {event.author && (
                  <p className="text-xs text-gray-400 mt-1">by {event.author}</p>
                )}
                {event.meta && Object.keys(event.meta).length > 0 && (
                  <div className="flex gap-3 mt-1.5">
                    {Object.entries(event.meta).map(([key, value]) => (
                      <span key={key} className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
