import React from 'react';
import { AlertTriangle, Clock, UserCheck, ArrowRight, ShieldCheck } from 'lucide-react';
import { formatProbability, getRiskColor } from '../utils/helpers';

export default function TriageTable({ triageItems = [], onSelectAction, className = '' }) {
  // Sample default clinical triage cases if none supplied
  const defaultItems = [
    {
      id: 'TR-101',
      patientName: 'Robert Vance',
      patientId: 'MRN-49210',
      priority: 'URGENT',
      finding: 'Acute ST Elevation & Severe Exertional Angina',
      disease: 'Cardiovascular',
      probability: 0.88,
      uncertainty: '±8%',
      trust: 'RELIABLE',
      action: 'Emergency Coronary Angiogram & CCU Admission',
      specialist: 'Cardiologist (Interventional)',
    },
    {
      id: 'TR-102',
      patientName: 'Eleanor Gray',
      patientId: 'MRN-77341',
      priority: 'HIGH',
      finding: 'Severe Postprandial Glucose & Elevated Transaminases',
      disease: 'Diabetes / Liver Syndromic',
      probability: 0.74,
      uncertainty: '±12%',
      trust: 'RELIABLE',
      action: 'Start Metformin Titration + Hepatic Ultrasound',
      specialist: 'Endocrinologist / Hepatologist',
    },
    {
      id: 'TR-103',
      patientName: 'Michael Scott',
      patientId: 'MRN-83921',
      priority: 'MODERATE',
      finding: 'Borderline Acoustic Voice Tremor & Cycle Jitter',
      disease: "Parkinson's Voice",
      probability: 0.58,
      uncertainty: '±22%',
      trust: 'UNCERTAIN',
      action: 'Schedule In-person UPDRS Motor Exam',
      specialist: 'Movement Disorder Neurologist',
    },
    {
      id: 'TR-104',
      patientName: 'Pam Beesly',
      patientId: 'MRN-33019',
      priority: 'ROUTINE',
      finding: 'Isolated Grade 1 Systolic BP with Normal Biomarkers',
      disease: 'Preventative Screening',
      probability: 0.22,
      uncertainty: '±6%',
      trust: 'RELIABLE',
      action: 'Outpatient Lifestyle & Dietary Counseling',
      specialist: 'Primary Care Physician',
    },
  ];

  const items = triageItems.length > 0 ? triageItems : defaultItems;

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800 animate-pulse';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'MODERATE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-soft overflow-hidden ${className}`}>
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-bold text-slate-850 dark:text-slate-100">
            Clinical Priority Triage & Decision Routing
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Algorithmic patient priority queuing based on multi-disease risk, uncertainty & clinical urgency
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">
          {items.length} Active Triage Cases
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-750">
            <tr>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4">Patient & MRN</th>
              <th className="py-3.5 px-4">Clinical Finding</th>
              <th className="py-3.5 px-4">Risk Probability</th>
              <th className="py-3.5 px-4">Uncertainty</th>
              <th className="py-3.5 px-4">Trust Status</th>
              <th className="py-3.5 px-4">Recommended Action</th>
              <th className="py-3.5 px-4">Specialist</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-slate-50/70 dark:hover:bg-slate-750/50 transition cursor-pointer"
                onClick={() => onSelectAction && onSelectAction(row)}
              >
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold border text-[11px] ${getPriorityBadge(row.priority)}`}>
                    {row.priority}
                  </span>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="font-semibold text-slate-850 dark:text-slate-200">{row.patientName}</div>
                  <div className="text-[11px] text-slate-400">{row.patientId}</div>
                </td>
                <td className="py-3.5 px-4 min-w-[200px]">
                  <span className="font-medium text-slate-800 dark:text-slate-200 block">{row.finding}</span>
                  <span className="text-[11px] text-slate-400">{row.disease}</span>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className="font-bold text-sm"
                    style={{ color: getRiskColor(row.probability) }}
                  >
                    {formatProbability(row.probability)}
                  </span>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400 font-mono">
                  {row.uncertainty}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                    row.trust === 'RELIABLE'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    {row.trust}
                  </span>
                </td>
                <td className="py-3.5 px-4 min-w-[220px] text-slate-700 dark:text-slate-300 font-medium">
                  {row.action}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap text-primary-600 dark:text-primary-400 font-semibold">
                  {row.specialist}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
