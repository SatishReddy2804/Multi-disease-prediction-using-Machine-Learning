import React from 'react';
import { normalizeProbability, formatProbability, getRiskColor } from '../utils/helpers';

export default function RadialConfidenceRing({
  probability = 0,
  size = 160,
  strokeWidth = 12,
  label = 'Risk Probability',
  showSubtext = true,
  className = '',
}) {
  const norm = normalizeProbability(probability);
  const percentage = Math.round(norm * 100);
  const color = getRiskColor(norm);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - norm * circumference;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 transition-all duration-700 ease-out"
        >
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
            fill="transparent"
          />
          {/* Active progress stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Inner Centered Percentage & Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className="text-3xl font-extrabold tracking-tight font-sans transition-colors duration-300"
            style={{ color }}
          >
            {formatProbability(norm)}
          </span>
          {showSubtext && (
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
              {label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
