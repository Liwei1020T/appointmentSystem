import React from 'react';
import { Card } from './Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

/**
 * Stats card component for dashboard metrics
 * 
 * @param title - Stat title/label
 * @param value - Stat value
 * @param icon - Optional icon
 * @param trend - Optional trend indicator
 */
export const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon,
  trend,
  className = ''
}) => {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 flex items-center gap-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{trend.value}</span>
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
