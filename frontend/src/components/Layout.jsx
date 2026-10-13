import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ErrorBoundary from './ErrorBoundary';
import { ChevronRight, Home } from 'lucide-react';

const BREADCRUMB_MAP = {
  '': 'Dashboard',
  'predict': 'Prediction Modules',
  'heart': 'Cardiovascular Disease',
  'diabetes': 'Type 2 Diabetes',
  'parkinsons': "Parkinson's Disease",
  'liver': 'Liver Disease',
  'history': 'Prediction History',
  'what-if': 'What-If Simulator',
  'cross-risk': 'Cross-Risk Analysis',
  'model-evaluation': 'Model Evaluation',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const pathParts = location.pathname.split('/').filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans transition-colors">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        {/* Top Navbar */}
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />

        {/* Breadcrumb Navigation Bar */}
        <div className="px-4 lg:px-8 py-2.5 bg-slate-100/60 dark:bg-slate-850/60 border-b border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 overflow-x-auto">
          <Link
            to="/"
            className="flex items-center hover:text-primary-600 dark:hover:text-primary-400 transition"
          >
            <Home className="w-3.5 h-3.5 mr-1" />
            <span>Home</span>
          </Link>

          {pathParts.map((part, idx) => {
            const url = `/${pathParts.slice(0, idx + 1).join('/')}`;
            const isLast = idx === pathParts.length - 1;
            const label = BREADCRUMB_MAP[part] || part;

            return (
              <React.Fragment key={url}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {isLast ? (
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {label}
                  </span>
                ) : (
                  <Link
                    to={url}
                    className="hover:text-primary-600 dark:hover:text-primary-400 transition truncate"
                  >
                    {label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Page Content Container */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
