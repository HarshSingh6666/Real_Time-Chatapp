import { UserStatus } from '@/types/chat';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: UserStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

const statusClasses = {
  online: 'bg-online',
  away: 'bg-away',
  offline: 'bg-offline',
};

export const StatusIndicator = ({ status, size = 'md', className }: StatusIndicatorProps) => {
  return (
    <span
      className={cn(
        'rounded-full ring-2 ring-background',
        sizeClasses[size],
        statusClasses[status],
        className
      )}
    />
  );
};
