import React from 'react';

export default function LoadingSpinner({ size = 'md', text = 'Processing clinical inference...', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 space-y-3 ${className}`}>
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-primary-200 border-t-primary-600 animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 animate-pulse text-center">
          {text}
        </p>
      )}
    </div>
  );
}
