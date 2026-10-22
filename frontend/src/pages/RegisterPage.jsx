import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldCheck, Mail, Lock, User, Building, ArrowRight, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'Attending Physician',
    department: 'Cardiology & Internal Medicine',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const { register, isConfigured } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) {
      toast.error('Please fill in all mandatory fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (!isConfigured) {
      toast.error('Supabase Auth is not configured. Please add VITE_SUPABASE_ANON_KEY to your .env file.');
      return;
    }

    setLoading(true);
    try {
      const res = await register(formData);
      if (res.confirmationPending) {
        toast.success('Registration successful! Please check your email to confirm your account.', { duration: 6000 });
        navigate('/login');
      } else {
        toast.success('Clinical profile created successfully.');
        navigate('/');
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
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
          Register Clinician Account
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
          Supabase-Authenticated Clinical Decision Support Access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white dark:bg-slate-800 py-8 px-6 shadow-soft-lg rounded-2xl border border-slate-200 dark:border-slate-700 sm:px-10 space-y-6">
          {!isConfigured && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Supabase Anon Key Required</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Registration requires your Supabase anon/publishable key. Obtain it from your Supabase Dashboard &rarr; Project Settings &rarr; API and set <code>VITE_SUPABASE_ANON_KEY</code> in <code>frontend/.env</code>.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Clinician Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-650 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500 dark:text-slate-100"
                  placeholder="Dr. Jordan Hayes, MD"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Institutional Email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-650 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500 dark:text-slate-100"
                  placeholder="physician@hospital.org"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Clinical Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-650 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500 dark:text-slate-100"
                >
                  <option value="Attending Physician">Attending Physician</option>
                  <option value="Resident Physician">Resident Physician</option>
                  <option value="Chief Medical Officer">Chief Medical Officer</option>
                  <option value="Cardiologist">Cardiologist</option>
                  <option value="Neurologist">Neurologist</option>
                  <option value="Endocrinologist">Endocrinologist</option>
                  <option value="Hepatologist">Hepatologist</option>
                  <option value="Clinical Researcher">Clinical Researcher</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hospital Department
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-650 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500 dark:text-slate-100"
                    placeholder="Internal Medicine"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-650 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500 dark:text-slate-100"
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-650 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500 dark:text-slate-100"
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition"
            >
              {loading ? 'Creating Credentials...' : 'Create Clinical Account'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Already have a clinical account?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Sign In Instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
