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
  showTooltip?: boolean;
}

export function Badge({ badge, size = 'md', showTooltip = true }: BadgeProps) {
  const sizeClasses = {
    sm: 'h-6 text-xs',
    md: 'h-8 text-sm',
    lg: 'h-10 text-base'
  };

  return (
    <div className="relative group">
      <div
        className={`inline-flex items-center gap-1.5 px-3 rounded-full ${sizeClasses[size]} transition-all duration-200 hover:scale-105`}
        style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
      >
        <BadgeCheck className="w-4 h-4" />
        <span className="font-medium whitespace-nowrap">{badge.name}</span>
      </div>
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
          {badge.description}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
        </div>
      )}
    </div>
  );
}