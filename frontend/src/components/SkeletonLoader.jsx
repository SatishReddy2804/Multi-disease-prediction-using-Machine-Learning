import React from 'react';

export default function SkeletonLoader({ type = 'card', count = 1, className = '' }) {
  const renderItem = (index) => {
    switch (type) {
      case 'kpi':
        return (
          <div key={index} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 animate-pulse space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            </div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
          </div>
        );

      case 'table-row':
        return (
          <tr key={index} className="animate-pulse border-b border-slate-100 dark:border-slate-800">
            <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" /></td>
            <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" /></td>
            <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16" /></td>
            <td className="py-4 px-4"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20" /></td>
            <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12" /></td>
          </tr>
        );

      case 'form':
        return (
          <div key={index} className="space-y-6 animate-pulse">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        );

      case 'card':
      default:
        return (
          <div key={index} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 animate-pulse space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            </div>
            <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
          </div>
        );
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {[...Array(count)].map((_, i) => renderItem(i))}
    </div>
  );
}
