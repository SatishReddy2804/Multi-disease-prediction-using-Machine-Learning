import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function CrossRiskRadarChart({
  scores,
  data: dataProp,
  cluster = 'Cardiometabolic Risk Cluster',
  className = '',
}) {
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const textColor = isDarkMode ? '#cbd5e1' : '#334155';
  const gridColor = isDarkMode ? 'rgba(71, 85, 105, 0.4)' : 'rgba(226, 232, 240, 0.8)';

  // Support both scores object or radar_chart_data array
  let heartVal = 40;
  let diabetesVal = 50;
  let liverVal = 25;
  let parkinsonsVal = 20;

  if (Array.isArray(dataProp) && dataProp.length > 0) {
    dataProp.forEach((item) => {
      const d = (item.disease || '').toLowerCase();
      const s = typeof item.score === 'number' ? item.score : parseFloat(item.score) || 0;
      if (d.includes('heart')) heartVal = s;
      else if (d.includes('diabet')) diabetesVal = s;
      else if (d.includes('liver')) liverVal = s;
      else if (d.includes('parkinson')) parkinsonsVal = s;
    });
  } else if (scores) {
    heartVal = Math.round((scores.heart ?? 0.4) * 100);
    diabetesVal = Math.round((scores.diabetes ?? 0.5) * 100);
    liverVal = Math.round((scores.liver ?? 0.25) * 100);
    parkinsonsVal = Math.round((scores.parkinsons ?? 0.2) * 100);
  }

  const data = {
    labels: ['Cardiovascular', 'Type 2 Diabetes', 'Hepatic / Liver', "Parkinson's Voice"],
    datasets: [
      {
        label: 'Patient Risk Profile',
        data: [heartVal, diabetesVal, liverVal, parkinsonsVal],
        backgroundColor: 'rgba(37, 99, 235, 0.25)',
        borderColor: '#2563EB',
        borderWidth: 2.5,
        pointBackgroundColor: '#2563EB',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#2563EB',
        pointRadius: 4,
      },
      {
        label: 'Clinical Danger Threshold (60%)',
        data: [60, 60, 60, 60],
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderColor: 'rgba(239, 68, 68, 0.6)',
        borderWidth: 1.5,
        borderDash: [4, 4],
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
          font: { size: 12, weight: '500' },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw}%`,
        },
      },
    },
    scales: {
      r: {
        angleLines: { color: gridColor },
        grid: { color: gridColor },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 20,
          color: textColor,
          backdropColor: 'transparent',
          callback: (value) => `${value}%`,
        },
        pointLabels: {
          color: textColor,
          font: { size: 12, weight: '600' },
        },
      },
    },
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-soft ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100">
            Multi-Organ Cross-Risk Radar
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Syndromic multi-disease interaction across organ domains
          </p>
        </div>
        {cluster && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
            Cluster: {cluster}
          </span>
        )}
      </div>

      <div className="h-72 w-full">
        <Radar data={data} options={options} />
      </div>
    </div>
  );
}
