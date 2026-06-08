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
    <div className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-8 overflow-hidden rounded-[2rem] bg-slate-900 shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 p-10 text-white sm:p-12 lg:p-16">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/70 to-slate-900/95" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.32em] text-amber-300 shadow-sm shadow-black/10">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400 text-slate-950">U</div>
                <div>
                  <p className="font-semibold leading-none">UMUHOZA</p>
                  <p className="text-xs uppercase tracking-[0.26em] text-white/80">QUINCAILLERIE</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.32em] text-amber-400">Welcome Back!</p>
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Admin Login</h1>
                <p className="max-w-lg text-slate-300">
                  Access your dashboard to manage products, inventory, sales, and website content.
                </p>
              </div>
            </div>

            <div className="space-y-5 rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-2xl shadow-black/20">
              <div className="space-y-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20">
                  <span className="text-xl">🔒</span>
                </div>
                <p className="text-sm uppercase tracking-[0.32em] text-amber-300">Secure Admin Access</p>
                <p className="text-slate-200">Your data is protected with industry-standard security.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                <p className="text-xl font-semibold text-white">📦 Manage Products</p>
                <p className="mt-2 text-sm text-slate-400">Add, edit and organize products</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                <p className="text-xl font-semibold text-white">📊 Track Inventory</p>
                <p className="mt-2 text-sm text-slate-400">Monitor stock levels</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                <p className="text-xl font-semibold text-white">🛒 Record Sales</p>
                <p className="mt-2 text-sm text-slate-400">Process sales and generate reports</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                <p className="text-xl font-semibold text-white">📈 Analytics & Reports</p>
                <p className="mt-2 text-sm text-slate-400">View business insights</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center bg-slate-100 p-10 sm:p-12 lg:p-16">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-300/20">
            <div className="mb-8 flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl text-blue-700 shadow-sm">
                🔒
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-slate-900">Admin Login</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Use the administrator account to manage products, inventory and sales.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <div className="relative mt-3">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 pr-16 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center rounded-full px-3 text-sm font-medium text-slate-600 transition hover:text-slate-900"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-600">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  Remember me
                </label>
                <Link className="font-semibold text-blue-600 hover:text-blue-700" to="/admin/forgot-password">
                  Forgot password?
                </Link>
              </div>

              {error && <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              {success && <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-3xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
