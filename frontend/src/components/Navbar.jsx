import React from 'react';
import { useAuth } from '../hooks/useAuth';
import DarkModeToggle from './DarkModeToggle';
import { User, LogOut, Shield, Bell, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="px-4 lg:px-8 py-3 flex items-center justify-between">
        {/* Left side: Hamburger on mobile + system name */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              AI
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-bold text-slate-850 dark:text-slate-100 tracking-tight">
                Multi-Disease Clinical AI
              </span>
              <span className="ml-2 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
                v1.0 Prod
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Dark mode toggle, notifications, user profile & logout */}
        <div className="flex items-center space-x-3">
          <DarkModeToggle />

          {/* System status pill */}
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Inference Online</span>
          </div>

          {/* User profile dropdown/button */}
          {user ? (
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-200 dark:border-slate-750">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {user.name || 'Dr. Clinician'}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {user.role || 'Attending Physician'}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-xs font-semibold px-4 py-2 rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
