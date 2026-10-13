import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldCheck, Lock, Mail, ArrowRight, UserCheck, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('clinician@hospital.org');
  const [password, setPassword] = useState('clinicalDemo2026!');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Clinical session authenticated successfully.');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setLoading(true);
    try {
      await login('dr.vance@cardiology.med', 'demoPassword123');
      toast.success('Signed in with Demo Attending Physician profile!');
      navigate(from, { replace: true });
    } catch {
      toast.error('Demo sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-soft-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-850 dark:text-slate-100 tracking-tight">
          Clinical Decision Support Login
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
          Multi-Disease Predictive AI & Risk Stratification Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-6 shadow-soft-lg rounded-2xl border border-slate-200 dark:border-slate-700 sm:px-10 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hospital Email / Clinical ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-650 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500 dark:text-slate-100"
                  placeholder="physician@hospital.org"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Enclave Access Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-650 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500 dark:text-slate-100"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition"
            >
              {loading ? 'Authenticating Credentials...' : 'Sign In to Clinical Dashboard'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-800 px-2 text-slate-400 font-semibold tracking-wider">
                Or Quick Access
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-650 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-750 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <Stethoscope className="w-4 h-4 mr-2 text-primary-500" />
            Demo Access (Attending Physician)
          </button>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have clinical credentials?{' '}
            <Link
              to="/register"
              className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Register Clinical Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
