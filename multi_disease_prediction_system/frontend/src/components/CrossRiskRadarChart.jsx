import React, { useMemo } from 'react';
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
import { Activity, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const STANDARD_DOMAINS = [
  { key: 'heart', label: 'Cardiovascular (Heart)', path: '/predict/heart' },
  { key: 'diabetes', label: 'Type 2 Diabetes', path: '/predict/diabetes' },
  { key: 'liver', label: 'Hepatic (Liver)', path: '/predict/liver' },
  { key: 'parkinsons', label: "Parkinson's Voice", path: '/predict/parkinsons' },
];

/**
 * CrossRiskRadarChart
 *
 * Visualizes multi-organ syndromic risk.
 * Preserves missing values as unavailable rather than fabricating zero risk.
 */
export default function CrossRiskRadarChart({
  data: dataProp,
  scores,
  missingDiseases = [],
  cluster = '',
  loading = false,
  error = null,
  className = '',
}) {
  const isDarkMode =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');
  const textColor = isDarkMode ? '#cbd5e1' : '#334155';
  const gridColor = isDarkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(203, 213, 225, 0.7)';
  const angleLineColor = isDarkMode ? 'rgba(100, 116, 139, 0.4)' : 'rgba(203, 213, 225, 0.8)';

  // Build a lookup map of { diseaseKey: scorePercentage }
  const domainScoreMap = useMemo(() => {
    const map = {};

    if (Array.isArray(dataProp) && dataProp.length > 0) {
      dataProp.forEach((item) => {
        const rawKey = (item.disease_key || item.disease || '').toLowerCase();
        let normalizedKey = rawKey;
        if (rawKey.includes('heart') || rawKey.includes('cardio')) normalizedKey = 'heart';
        else if (rawKey.includes('diabet')) normalizedKey = 'diabetes';
        else if (rawKey.includes('liver') || rawKey.includes('hepat')) normalizedKey = 'liver';
        else if (rawKey.includes('parkinson')) normalizedKey = 'parkinsons';

        const rawScore = typeof item.score === 'number' ? item.score : parseFloat(item.score);
        if (!isNaN(rawScore) && rawScore !== null) {
          // If <= 1.0, convert probability to percentage
          map[normalizedKey] = rawScore <= 1.0 ? roundVal(rawScore * 100) : roundVal(rawScore);
        }
      });
    } else if (scores && typeof scores === 'object') {
      Object.entries(scores).forEach(([k, v]) => {
        const key = k.toLowerCase().trim();
        const raw = typeof v === 'number' ? v : parseFloat(v);
        if (!isNaN(raw) && raw !== null) {
          map[key] = raw <= 1.0 ? roundVal(raw * 100) : roundVal(raw);
        }
      });
    }

    return map;
  }, [dataProp, scores]);

  function roundVal(num) {
    return Math.round(num * 10) / 10;
  }

  // Count evaluated domains
  const evaluatedDomains = STANDARD_DOMAINS.filter((d) => domainScoreMap[d.key] !== undefined);
  const evaluatedCount = evaluatedDomains.length;
  const isPartial = evaluatedCount > 0 && evaluatedCount < STANDARD_DOMAINS.length;
  const hasData = evaluatedCount > 0;

  // Chart configuration:
  // If at least 3 domains are evaluated, we render a closed polygon on the radar.
  // If fewer than 3 domains are evaluated, radar polygons are geometrically incomplete,
  // so we show available points with clear notice and linear domain gauges below.
  const chartData = useMemo(() => {
    if (!hasData) return null;

    // Use standard 4 axes for consistent geometry
    const labels = STANDARD_DOMAINS.map((d) => d.label);
    const dataValues = STANDARD_DOMAINS.map((d) => {
      const val = domainScoreMap[d.key];
      return val !== undefined ? val : null;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Patient Risk Score (%)',
          data: dataValues,
          backgroundColor: isDarkMode ? 'rgba(20, 184, 166, 0.25)' : 'rgba(13, 148, 136, 0.20)',
          borderColor: isDarkMode ? '#2dd4bf' : '#0d9488',
          borderWidth: 2.5,
          pointBackgroundColor: isDarkMode ? '#2dd4bf' : '#0d9488',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: isDarkMode ? '#2dd4bf' : '#0d9488',
          pointRadius: 5,
          pointHoverRadius: 7,
          spanGaps: true,
        },
        {
          label: 'Clinical Warning Threshold (60%)',
          data: [60, 60, 60, 60],
          backgroundColor: 'transparent',
          borderColor: isDarkMode ? 'rgba(248, 113, 113, 0.65)' : 'rgba(239, 68, 68, 0.65)',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0,
        },
      ],
    };
  }, [domainScoreMap, hasData, isDarkMode]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 100,
          angleLines: { color: angleLineColor },
          grid: { color: gridColor },
          ticks: {
            stepSize: 20,
            color: textColor,
            backdropColor: 'transparent',
            callback: (v) => `${v}%`,
            font: { size: 10 },
          },
          pointLabels: {
            color: textColor,
            font: { size: 11, weight: '600' },
          },
        },
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: textColor,
            font: { size: 11, weight: '500' },
            boxWidth: 14,
            padding: 12,
          },
        },
        tooltip: {
          backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: isDarkMode ? '#f1f5f9' : '#0f172a',
          bodyColor: isDarkMode ? '#cbd5e1' : '#334155',
          borderColor: isDarkMode ? '#334155' : '#e2e8f0',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (ctx) => {
              if (ctx.raw === null || ctx.raw === undefined) {
                return `${ctx.dataset.label}: Not Evaluated`;
              }
              return `${ctx.dataset.label}: ${ctx.raw}%`;
            },
          },
        },
      },
    }),
    [textColor, gridColor, angleLineColor, isDarkMode]
  );

  // ── 1. Loading State ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm ${className}`}>
        <div className="h-80 w-full flex flex-col items-center justify-center space-y-3">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-teal-600 dark:border-teal-400" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Rendering multi-organ radar projection...
          </p>
        </div>
      </div>
    );
  }

  // ── 2. Error State ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/40 p-6 shadow-sm ${className}`}>
        <div className="h-80 w-full flex flex-col items-center justify-center text-red-600 dark:text-red-400 space-y-2">
          <AlertCircle className="w-8 h-8" />
          <p className="text-sm font-semibold">Radar Chart Unavailable</p>
          <p className="text-xs text-center max-w-sm text-red-500 dark:text-red-400/80">{error}</p>
        </div>
      </div>
    );
  }

  // ── 3. Empty State ──────────────────────────────────────────────────
  if (!hasData) {
    return (
      <div className={`bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center ${className}`}>
        <div className="h-64 w-full flex flex-col items-center justify-center space-y-3 text-slate-400 dark:text-slate-500">
          <Activity className="w-10 h-10 stroke-[1.5]" />
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No Organ Risk Inferences Active
          </h4>
          <p className="text-xs max-w-sm">
            Execute a cross-risk analysis or individual disease model predictions to plot multi-system risk coordinates.
          </p>
        </div>
      </div>
    );
  }

  // ── 4. Render Chart with Domain Statuses ────────────────────────────
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 w-full ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Multi-Organ Cross-Risk Radar
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isPartial
              ? `Partial Profile: ${evaluatedCount} of ${STANDARD_DOMAINS.length} organ domains evaluated`
              : 'Full Quad-Domain Syndromic Evaluation'}
          </p>
        </div>

        {cluster && (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            {cluster}
          </span>
        )}
      </div>

      {/* Partial Result Warning Notice */}
      {isPartial && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs text-amber-800 dark:text-amber-300">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <p>
            <strong>Partial Evaluation:</strong> Only {evaluatedCount} disease modules are included.
            Missing organ domains are marked as unavailable rather than zero to avoid misleading clinical interpretations.
          </p>
        </div>
      )}

      {/* Radar Canvas with Explicit Height Container */}
      <div className="h-72 w-full relative">
        <Radar data={chartData} options={chartOptions} />
      </div>

      {/* Domain Breakdown Table / Gauges */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Evaluated Organ Domains
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {STANDARD_DOMAINS.map((domain) => {
            const score = domainScoreMap[domain.key];
            const isEvaluated = score !== undefined;

            return (
              <div
                key={domain.key}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                  isEvaluated
                    ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                    : 'bg-slate-50/50 dark:bg-slate-900/40 border-dashed border-slate-200 dark:border-slate-800 opacity-70'
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {domain.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isEvaluated
                      ? score >= 60
                        ? 'High Clinical Concern'
                        : score >= 30
                        ? 'Moderate Risk'
                        : 'Low Baseline Risk'
                      : 'Not Evaluated'}
                  </div>
                </div>

                {isEvaluated ? (
                  <span
                    className={`font-mono font-bold text-xs px-2 py-0.5 rounded-lg ${
                      score >= 60
                        ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                        : score >= 30
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    {score}%
                  </span>
                ) : (
                  <Link
                    to={domain.path}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    Run Model <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
