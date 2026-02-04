import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      size: {
        xs: 'h-6 w-6',
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
        '2xl': 'h-20 w-20',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null;
  alt?: string;
  fallback?: string | React.ReactNode;
}

function Avatar({ className, size, src, alt, fallback, ...props }: AvatarProps) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  const showFallback = !src || hasError;

  return (
    <div className={cn(avatarVariants({ size }), className)} {...props}>
      {!showFallback ? (
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="aspect-square h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <AvatarFallback size={size}>{fallback}</AvatarFallback>
      )}
    </div>
  );
}

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | null;
}

function AvatarFallback({ className, children, size, ...props }: AvatarFallbackProps) {
  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
    '2xl': 'h-10 w-10',
  };

  const textSizes = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
    '2xl': 'text-xl',
  };

  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center bg-gray-100 text-gray-600',
        className
      )}
      {...props}
    >
      {children ? (
        typeof children === 'string' ? (
          <span className={cn('font-medium', textSizes[size || 'md'])}>
            {children}
          </span>
        ) : (
          children
        )
      ) : (
        <User className={iconSizes[size || 'md']} />
      )}
    </div>
  );
}

// Helper to get initials from name
function getInitials(name: string, maxLength: number = 2): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, maxLength)
    .join('')
    .toUpperCase();
}

// User avatar with automatic initials
interface UserAvatarProps extends Omit<AvatarProps, 'fallback'> {
  name?: string;
}

function UserAvatar({ name, ...props }: UserAvatarProps) {
  const fallback = name ? getInitials(name) : undefined;
  return <Avatar {...props} fallback={fallback} />;
}

export { Avatar, AvatarFallback, UserAvatar, getInitials };
