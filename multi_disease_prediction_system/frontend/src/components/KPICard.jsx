import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'up', // 'up' | 'down' | 'neutral'
  badge,
  iconBg = 'bg-primary-50 dark:bg-primary-950/60',
  iconColor = 'text-primary-600 dark:text-primary-400',
  className = '',
}) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-soft transition-all duration-200 hover:shadow-soft-lg ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-slate-850 dark:text-slate-100 font-sans tracking-tight">
              {value}
            </span>
            {badge && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                {badge}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className={`p-3 rounded-2xl ${iconBg} ${iconColor} shrink-0`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center space-x-2 text-xs">
          {trend && (
            <div
              className={`inline-flex items-center font-semibold ${
                trendType === 'up'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : trendType === 'down'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {trendType === 'up' && <TrendingUp className="w-3.5 h-3.5 mr-1" />}
              {trendType === 'down' && <TrendingDown className="w-3.5 h-3.5 mr-1" />}
              {trendType === 'neutral' && <Minus className="w-3.5 h-3.5 mr-1" />}
              <span>{trend}</span>
            </div>
          )}
          {subtitle && (
            <span className="text-slate-500 dark:text-slate-400 truncate">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
