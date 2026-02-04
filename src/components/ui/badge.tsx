import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-white',
        secondary: 'border-transparent bg-gray-100 text-gray-900',
        success: 'border-transparent bg-green-100 text-green-800',
        warning: 'border-transparent bg-yellow-100 text-yellow-800',
        error: 'border-transparent bg-red-100 text-red-800',
        info: 'border-transparent bg-blue-100 text-blue-800',
        outline: 'border-gray-300 text-gray-700',
        // Status badges for orders
        pending: 'border-transparent bg-yellow-100 text-yellow-800',
        confirmed: 'border-transparent bg-blue-100 text-blue-800',
        processing: 'border-transparent bg-purple-100 text-purple-800',
        shipped: 'border-transparent bg-indigo-100 text-indigo-800',
        delivered: 'border-transparent bg-green-100 text-green-800',
        cancelled: 'border-transparent bg-red-100 text-red-800',
        // Customer status
        active: 'border-transparent bg-green-100 text-green-800',
        inactive: 'border-transparent bg-gray-100 text-gray-800',
        blocked: 'border-transparent bg-red-100 text-red-800',
        vip: 'border-transparent bg-amber-100 text-amber-800',
        // Additional variants
        destructive: 'border-transparent bg-red-100 text-red-800',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-[10px]',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

// Status badge helper component
interface StatusBadgeProps {
  status: string;
  size?: 'default' | 'sm' | 'lg';
}

function StatusBadge({ status, size = 'default' }: StatusBadgeProps) {
  const statusVariant = status.toLowerCase() as BadgeProps['variant'];

  // Map status to display text
  const displayText = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge variant={statusVariant} size={size}>
      {displayText}
    </Badge>
  );
}

// Order status badge
interface OrderStatusBadgeProps {
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  size?: 'default' | 'sm' | 'lg';
}

function OrderStatusBadge({ status, size = 'default' }: OrderStatusBadgeProps) {
  const labels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  return (
    <Badge variant={status} size={size}>
      {labels[status]}
    </Badge>
  );
}

// Customer status badge
interface CustomerStatusBadgeProps {
  status: 'active' | 'inactive' | 'blocked' | 'vip';
  size?: 'default' | 'sm' | 'lg';
}

function CustomerStatusBadge({ status, size = 'default' }: CustomerStatusBadgeProps) {
  const labels = {
    active: 'Active',
    inactive: 'Inactive',
    blocked: 'Blocked',
    vip: 'VIP',
  };

  return (
    <Badge variant={status} size={size}>
      {labels[status]}
    </Badge>
  );
}

export { Badge, badgeVariants, StatusBadge, OrderStatusBadge, CustomerStatusBadge };
