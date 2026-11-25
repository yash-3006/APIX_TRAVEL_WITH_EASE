import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  FileText,
  Plane,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useApix } from '../context/ApixContext';
import { UserRole } from '../types/apix';
import { validateEmail } from '../utils/apixAnalytics';

export function AuthPage() {
  const { login, register } = useApix();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('traveler');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('arjun.mehta@apix.in');
  const [password, setPassword] = useState('traveler123');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setFieldErrors({});
    setFormError(null);
    if (nextMode === 'register') {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
    } else {
      applyDemoCredentials(role);
    }
  };

  const applyDemoCredentials = (targetRole: UserRole) => {
    setRole(targetRole);
    setFieldErrors({});
    setFormError(null);
    if (targetRole === 'admin') {
      setEmail('admin@apix.in');
      setPassword('admin123');
    } else {
      setEmail('arjun.mehta@apix.in');
      setPassword('traveler123');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errors: Record<string, string> = {};

    if (mode === 'register' && name.trim().length < 2) {
      errors.name = 'Please enter your full name (at least 2 characters).';
    }
    if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (mode === 'register' && password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    window.setTimeout(() => {
      if (mode === 'login') {
        const res = login(email, password, role);
        if (!res.ok) {
          setFormError(res.error ?? 'Authentication failed.');
        }
      } else {
        const res = register({ name, email, password, role });
        if (!res.ok) {
          setFormError(res.error ?? 'Registration failed.');
        }
      }
      setSubmitting(false);
    }, 260);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-white">
      {/* Left Brand Showcase Panel */}
      <section className="lg:col-span-6 xl:col-span-7 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-xl tracking-tight leading-none">APIX</p>
            <p className="text-xs text-blue-200/80 mt-0.5">Airfare Price Index</p>
          </div>
        </div>

        <div className="relative z-10 my-12 lg:my-0 max-w-xl">
          <h1
            className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight leading-[1.12] text-white"
            style={{ textWrap: 'balance' }}
          >
            Historical airfare intelligence for smarter Indian domestic travel.
          </h1>
          <p className="mt-5 text-base text-slate-300 leading-relaxed">
            Compare fares across major Indian carriers, benchmark routes against a
            base-100 Airfare Price Index, and generate route-wise analytical PDF reports.
          </p>

          {/* Clean Index Preview Strip */}
          <div className="mt-10 grid sm:grid-cols-3 gap-4 border-t border-white/10 pt-8">
            <div>
              <div className="flex items-center gap-2 text-blue-300 text-xs font-medium">
                <TrendingUp className="w-4 h-4" />
                <span>Index Engine</span>
              </div>
              <p className="mt-2 text-sm text-slate-200 font-medium">
                Low, Moderate & High fare bands across 12 months
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-medium">
                <BarChart3 className="w-4 h-4" />
                <span>Carrier Matrix</span>
              </div>
              <p className="mt-2 text-sm text-slate-200 font-medium">
                IndiGo, Air India, Vistara, Akasa Air & SpiceJet
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sky-300 text-xs font-medium">
                <FileText className="w-4 h-4" />
                <span>Instant Exports</span>
              </div>
              <p className="mt-2 text-sm text-slate-200 font-medium">
                Route-wise executive summaries in PDF & CSV
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 border-t border-white/10 pt-6">
          <span>APIX Frontend Analytics Prototype · Simulated Historical Dataset</span>
          <span>INR (₹) · Indian Domestic Corridors</span>
        </div>
      </section>

      {/* Right Authentication Form Panel */}
      <section className="lg:col-span-6 xl:col-span-5 flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-slate-50">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-7 sm:p-8 shadow-sm">
          {/* Login / Register Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg mb-6" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => switchMode('register')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {mode === 'login' ? 'Sign in to APIX' : 'Create your APIX account'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {mode === 'login'
                ? 'Choose a workspace role or enter your registered credentials.'
                : 'Register as a Traveler or Administrator to explore the prototype.'}
            </p>
          </div>

          {/* Role Selector for Demo */}
          <div className="mb-5">
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              Workspace Role
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (mode === 'login') {
                    applyDemoCredentials('traveler');
                  } else {
                    setRole('traveler');
                  }
                }}
                className={`px-3.5 py-2.5 rounded-lg border text-left transition-colors ${
                  role === 'traveler'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <p className="text-sm font-semibold">Traveler</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Search, compare & trends
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (mode === 'login') {
                    applyDemoCredentials('admin');
                  } else {
                    setRole('admin');
                  }
                }}
                className={`px-3.5 py-2.5 rounded-lg border text-left transition-colors ${
                  role === 'admin'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <p className="text-sm font-semibold">Administrator</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Manage carriers & fares
                </p>
              </button>
            </div>
          </div>

          {formError && (
            <div
              role="alert"
              className="mb-4 px-3.5 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700"
            >
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Ananya Sharma"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
                {fieldErrors.name && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.name}</p>
                )}
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@apix.in"
                autoComplete="email"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              {fieldErrors.email && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-confirm"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Confirm Password
                </label>
                <input
                  id="auth-confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-rose-600 mt-1">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>
                {submitting
                  ? 'Verifying...'
                  : mode === 'login'
                  ? `Sign In as ${role === 'admin' ? 'Administrator' : 'Traveler'}`
                  : 'Create Account'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-2.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Demo Credentials (Click role above to autofill)</span>
              </div>
              <div className="text-xs text-slate-600 space-y-1 font-mono bg-slate-50 rounded-lg p-3 border border-slate-200/70">
                <p>Traveler: arjun.mehta@apix.in / traveler123</p>
                <p>Admin:    admin@apix.in / admin123</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
