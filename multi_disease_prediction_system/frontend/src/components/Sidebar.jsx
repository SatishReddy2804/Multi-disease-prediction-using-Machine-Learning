import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  HeartPulse,
  Activity,
  Brain,
  Stethoscope,
  History,
  Sliders,
  Radar,
  BarChart3,
  ShieldCheck,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    category: 'OVERVIEW',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    category: 'DISEASE PREDICTION MODULES',
    items: [
      { to: '/predict/heart', label: 'Cardiovascular', icon: HeartPulse, color: 'text-rose-500' },
      { to: '/predict/diabetes', label: 'Type 2 Diabetes', icon: Activity, color: 'text-blue-500' },
      { to: '/predict/parkinsons', label: "Parkinson's Voice", icon: Brain, color: 'text-purple-500' },
      { to: '/predict/liver', label: 'Hepatic / Liver', icon: Stethoscope, color: 'text-emerald-500' },
    ],
  },
  {
    category: 'CLINICAL SIMULATION & ANALYTICS',
    items: [
      { to: '/what-if', label: 'What-If Simulator', icon: Sliders },
      { to: '/cross-risk', label: 'Cross-Risk Radar', icon: Radar },
      { to: '/model-evaluation', label: 'Model Evaluation', icon: BarChart3 },
      { to: '/history', label: 'Prediction History', icon: History },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header in Sidebar */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <NavLink to="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-850 dark:text-slate-100 block leading-tight">
                ClinPredict AI
              </span>
              <span className="text-[10px] text-slate-400 block leading-tight">
                Decision Support
              </span>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {NAV_ITEMS.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 px-3 mb-2">
                {section.category}
              </h5>

              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                      }`
                    }
                  >
                    <Icon className={`w-4 h-4 ${item.color || ''}`} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer info box */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-750 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
              Secure Enclave Active
            </span>
            <span>All inference processed locally under HIPAA compliance mode.</span>
          </div>
        </div>
      </aside>
    </>
  );
}
