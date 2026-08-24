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
          0% { stroke-dashoffset: 240; opacity: 0.45; }
          50% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: -240; opacity: 0.45; }
        }
      `}</style>

      <div className="flex min-h-screen items-center justify-center bg-[#eef3ff] px-3 py-3 sm:px-5">
        <div className="relative mx-auto w-full max-w-[1260px] overflow-hidden rounded-[32px] bg-[#071d3d] shadow-[0_35px_80px_rgba(4,11,28,0.2)] lg:h-[760px]">
          <div className="absolute inset-y-0 right-0 hidden w-[46%] bg-[#f5f4f7] lg:block" />

          <div className="relative z-10 grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(60,118,255,0.18),_transparent_28%),linear-gradient(135deg,#07182f,#0a234e_38%,#07182f_100%)] px-8 py-8 text-white sm:px-10 lg:px-12 lg:py-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(255,255,255,0.15),transparent_20%),radial-gradient(circle_at_60%_30%,rgba(255,174,0,0.12),transparent_18%)]" />

              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="Umuhoza Quincaillerie logo" className="h-12 w-12 rounded-xl border border-[#f2c94c]/40 bg-[#f9f5ea]/5 object-contain p-1.5" />
                  <div className="leading-none">
                    <p className="text-[12px] font-black uppercase tracking-[0.28em] text-[#f7c75c]">Umuhoza</p>
                    <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.32em] text-slate-200">Quincaillerie</p>
                  </div>
                </div>

                <div className="space-y-4 pt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#f7c75c]">Welcome back!</p>
                  <h1 className="max-w-[520px] text-4xl font-black leading-[1.06] tracking-[-0.04em] text-white sm:text-5xl">
                    <span className="block">Admin</span>
                    <span className="bg-gradient-to-r from-[#63d0ff] via-[#75a7ff] to-[#8d6dff] bg-clip-text text-transparent">
                      Dashboard
                    </span>
                  </h1>
                  <p className="max-w-md text-base text-slate-300">
                    Sign in to manage your store, track inventory, process sales and grow your business.
                  </p>
                </div>

                <div className="max-w-[500px] rounded-[28px] border border-[#63d0ff]/20 bg-[#112758]/80 p-5 shadow-[0_20px_40px_rgba(17,32,87,0.4)] backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4ea6ff] to-[#286ef2] shadow-[0_12px_26px_rgba(70,125,255,0.45)]">
                      <span className="text-2xl">✓</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Secure Admin Access</h2>
                      <p className="mt-1 text-sm text-slate-300">
                        Your data is protected with industry-standard security and encryption.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid max-w-[540px] gap-3 sm:grid-cols-2">
                  {[
                    ['📦', 'Manage Products', 'Add, edit and organize your products', '#8a5cf6', 'purple'],
                    ['📊', 'Track Inventory', 'Monitor stock levels in real-time', '#3b82f6', 'blue'],
                    ['🛒', 'Record Sales', 'Process sales and manage transactions', '#10b981', 'green'],
                    ['📈', 'Analytics & Reports', 'View insights and grow your business', '#f59e0b', 'amber'],
                  ].map(([icon, title, text, colour]) => (
                    <div
                      key={title}
                      className="rounded-[22px] border border-white/10 bg-slate-950/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm"
                    >
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${colour}, rgba(255,255,255,0.18))` }}
                      >
                        {icon}
                      </div>
                      <p className="mt-3 text-lg font-semibold text-white">{title}</p>
                      <p className="mt-1 text-xs text-slate-300">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative hidden bg-[#f5f4f7] lg:block">
              <div className="absolute inset-y-0 left-[-90px] w-[190px] bg-[#071d3d]" />
              <svg viewBox="0 0 260 760" className="absolute left-[-118px] top-0 h-full w-[220px] opacity-100" preserveAspectRatio="none">
                <path
                  d="M 160 0 C 70 120, 58 220, 130 320 S 190 550, 150 760"
                  fill="none"
                  stroke="rgba(99,208,255,0.9)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="18 15"
                  style={{ animation: 'drawCurve 7s ease-in-out infinite' }}
                />
              </svg>
            </div>

            <div className="flex items-center justify-center bg-[#f4f1f7] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
              <div className="w-full max-w-[430px] rounded-[32px] bg-[#f7f5f9] p-7 shadow-[0_30px_60px_rgba(96,112,146,0.15)] ring-1 ring-slate-200/80">
                <div className="mb-8 flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#eef4ff] ring-1 ring-[#dfe8ff] shadow-[0_15px_25px_rgba(94,115,255,0.15)]">
                    <img src="/logo.png" alt="Umuhoza Quincaillerie logo" className="h-9 w-9 object-contain" />
                  </div>
                  <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] text-slate-900">Admin Login</h2>
                  <p className="mt-2 max-w-[320px] text-sm text-slate-500">
                    Use your administrator account to access the dashboard and manage your store.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.17em] text-slate-500">Email Address</label>
                    <div className="relative mt-2">
                      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                        ✉
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.17em] text-slate-500">Password</label>
                    <div className="relative mt-2">
                      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                        🔒
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 pr-20 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-500 transition hover:text-slate-700"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <label className="inline-flex items-center gap-2 text-slate-600">
                      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      Remember me
                    </label>
                    <Link className="font-semibold text-indigo-600 transition hover:text-indigo-700" to="/admin/forgot-password">
                      Forgot password?
                    </Link>
                  </div>

                  {error && <p className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-700">{error}</p>}
                  {success && <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">{success}</p>}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#7c4dff] via-[#4a76ff] to-[#3aa6ff] px-5 py-3.5 text-lg font-bold text-white shadow-[0_18px_30px_rgba(89,98,255,0.35)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                    <span className="ml-2 text-xl">→</span>
                  </button>
                </form>

                <div className="mt-7 text-center text-sm text-slate-500">or continue with</div>

                <div className="mt-4 flex items-center justify-center gap-3">
                  {['G', '◌', '◍'].map((symbol, index) => (
                    <button
                      key={index}
                      type="button"
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminLogin;
