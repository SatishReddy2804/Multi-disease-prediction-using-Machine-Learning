import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function FeatureImportanceChart({ features = [], className = '' }) {
  if (!features || features.length === 0) return null;

  const sorted = [...features].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  const labels = sorted.map((f) => f.name);
  const dataValues = sorted.map((f) => Number((f.impact * 100).toFixed(1)));

  // Red/coral for risk drivers, emerald/teal for protective
  const backgroundColors = dataValues.map((val) =>
    val >= 0 ? 'rgba(239, 68, 68, 0.85)' : 'rgba(16, 185, 129, 0.85)'
  );
  const borderColors = dataValues.map((val) =>
    val >= 0 ? 'rgb(220, 38, 38)' : 'rgb(5, 150, 105)'
  );

  const data = {
    labels,
    datasets: [
      {
        label: 'Relative Impact Score (%)',
        data: dataValues,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  };

  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const textColor = isDarkMode ? '#94a3b8' : '#475569';
  const gridColor = isDarkMode ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.raw;
            return val >= 0 ? `+${val}% Risk Contributing Factor` : `${val}% Risk Mitigating Factor`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: {
          color: textColor,
          callback: (value) => `${value}%`,
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: textColor,
          font: { size: 12, weight: '500' },
        },
      },
    },
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-soft ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100">
            SHAP Explainability: Feature Importance
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Top clinical biomarker weights driving this specific patient assessment
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-slate-500">Increases Risk</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-500">Decreases Risk</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
