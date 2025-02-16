import { BadgeCheck } from 'lucide-react';

export interface Badge {
  id: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
}

interface BadgeProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
}

export function Badge({ badge, size = 'md' }: BadgeProps) {
  const sizeClasses = {
    sm: 'h-6 text-xs',
    md: 'h-8 text-sm',
    lg: 'h-10 text-base'
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 rounded-full ${sizeClasses[size]}`}
      style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
      title={badge.description}
    >
      <BadgeCheck className="w-4 h-4" />
      <span className="font-medium">{badge.name}</span>
    </div>
  );
}