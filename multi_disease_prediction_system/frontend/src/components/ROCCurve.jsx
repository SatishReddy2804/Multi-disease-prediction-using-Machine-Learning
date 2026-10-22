import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function ROCCurve({
  auc = '0.942',
  diseaseName = 'Cardiovascular Disease',
  className = '',
}) {
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const textColor = isDarkMode ? '#cbd5e1' : '#334155';
  const gridColor = isDarkMode ? 'rgba(71, 85, 105, 0.4)' : 'rgba(226, 232, 240, 0.8)';

  // ROC points: [FPR, TPR]
  const fprSteps = [0.0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

  const data = {
    labels: fprSteps.map((x) => x.toFixed(2)),
    datasets: [
      {
        label: `Ensemble Stacking (AUC = ${auc})`,
        data: [0.0, 0.62, 0.81, 0.89, 0.93, 0.96, 0.97, 0.98, 0.99, 1.0, 1.0, 1.0],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderWidth: 2.5,
        tension: 0.3,
        pointRadius: 2,
        fill: true,
      },
      {
        label: 'XGBoost Baseline (AUC = 0.908)',
        data: [0.0, 0.51, 0.72, 0.82, 0.87, 0.91, 0.93, 0.95, 0.97, 0.99, 1.0, 1.0],
        borderColor: '#10B981',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.3,
        pointRadius: 0,
      },
      {
        label: 'Random Guess (AUC = 0.500)',
        data: [0.0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        borderColor: '#94a3b8',
        borderWidth: 1.5,
        borderDash: [2, 2],
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: textColor,
          font: { size: 11, weight: '500' },
        },
      },
      tooltip: {
        callbacks: {
          title: (items) => `False Positive Rate: ${items[0].label}`,
          label: (context) => `True Positive Rate (Recall): ${(context.raw * 100).toFixed(1)}%`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'False Positive Rate (1 - Specificity)',
          color: textColor,
          font: { size: 11, weight: '600' },
        },
        grid: { color: gridColor },
        ticks: { color: textColor },
      },
      y: {
        title: {
          display: true,
          text: 'True Positive Rate (Sensitivity / Recall)',
          color: textColor,
          font: { size: 11, weight: '600' },
        },
        min: 0,
        max: 1.05,
        grid: { color: gridColor },
        ticks: { color: textColor },
      },
    },
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-soft ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100">
            ROC Discrimination Curve (AUC: {auc})
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sensitivity vs. 1-Specificity discriminator for {diseaseName}
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          AUC-ROC: {auc} (High Discrimination)
        </span>
      </div>

      <div className="h-72 w-full">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
