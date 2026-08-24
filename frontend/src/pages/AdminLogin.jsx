import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await API.post('/auth/login', { email, password });
      localStorage.setItem('umuhoza_token', response.data.token);
      setSuccess('Login successful! Redirecting to admin dashboard...');
      navigate('/admin/dashboard');
    } catch (err) {
      setError(
        err?.response?.data?.message || 'Login failed. Check your credentials and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes drawCurve {
          0% { stroke-dashoffset: 260; opacity: 0.4; }
          50% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: -260; opacity: 0.4; }
        }
      `}</style>

      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-3 py-3 sm:px-5">
        <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-slate-200 bg-slate-900 shadow-[0_25px_60px_rgba(15,23,42,0.18)] lg:max-h-[760px] lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-white sm:p-6 lg:p-7">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/75 to-slate-900/95" />

            <div className="relative flex h-full flex-col justify-between gap-5">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Umuhoza Quincaillerie logo" className="h-11 w-11 rounded-2xl border border-white/10 bg-white/5 object-contain p-1 shadow-lg shadow-black/20" />
                <div className="leading-tight">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-amber-300">Umuhoza</p>
                  <p className="text-[8px] uppercase tracking-[0.35em] text-slate-300">Quincaillerie</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-amber-400">Welcome back</p>
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Admin portal</h1>
                <p className="max-w-md text-sm text-slate-300">
                  Manage products, stock, sales and digital content from one secure dashboard.
                </p>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {[
                  ['📦', 'Products', 'Add and update stock'],
                  ['📊', 'Inventory', 'Track availability'],
                  ['🛒', 'Sales', 'Record transactions'],
                  ['📈', 'Reports', 'View insights'],
                ].map(([icon, title, text]) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 shadow-lg shadow-black/10 backdrop-blur-sm">
                    <div className="text-lg">{icon}</div>
                    <p className="mt-2 text-sm font-semibold text-white">{title}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-20 -translate-x-1/2 lg:block">
            <svg viewBox="0 0 120 900" preserveAspectRatio="none" className="h-full w-full">
              <path
                d="M 65 20 C 20 120, 10 240, 62 360 S 110 560, 66 820"
                fill="none"
                stroke="rgba(148,163,184,0.9)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeDasharray="14 14"
                style={{ animation: 'drawCurve 5.5s ease-in-out infinite' }}
              />
            </svg>
          </div>

          <div className="flex items-center justify-center bg-slate-100 p-4 sm:p-6 lg:p-7">
            <div className="w-full max-w-md rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(148,163,184,0.28)] sm:p-6">
              <div className="mb-5 flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 shadow-sm ring-1 ring-blue-200">
                  <img src="/logo.png" alt="Umuhoza Quincaillerie logo" className="h-8 w-8 object-contain" />
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-blue-600">Secure access</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">Admin Login</h2>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-[0.16em] text-slate-600">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-[0.16em] text-slate-600">Password</label>
                  <div className="relative mt-2">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 pr-14 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-2.5 flex items-center rounded-full px-2 text-[11px] font-medium text-slate-600 transition hover:text-slate-900"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    Remember me
                  </label>
                  <Link className="font-semibold text-blue-600 hover:text-blue-700" to="/admin/forgot-password">
                    Forgot password?
                  </Link>
                </div>

                {error && <p className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-700">{error}</p>}
                {success && <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">{success}</p>}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminLogin;
