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
      const response = await API.post('/auth/login', {
        email,
        password,
      });

      localStorage.setItem('umuhoza_token', response.data.token);

      setSuccess('Login successful! Redirecting to admin dashboard...');

      navigate('/admin/dashboard');
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Login failed. Check your credentials and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: '📦',
      title: 'Manage Products',
      description: 'Add, edit and organize your products',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      icon: '📊',
      title: 'Track Inventory',
      description: 'Monitor stock levels in real-time',
      color: 'from-blue-500 to-cyan-400',
    },
    {
      icon: '🛒',
      title: 'Record Sales',
      description: 'Process sales and manage transactions',
      color: 'from-emerald-500 to-teal-400',
    },
    {
      icon: '📈',
      title: 'Analytics & Reports',
      description: 'View insights and grow your business',
      color: 'from-orange-500 to-yellow-400',
    },
  ];

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-12px) translateX(6px);
          }
        }

        @keyframes glow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes moveLine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(300%);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.15);
          }
          50% {
            box-shadow: 0 0 40px rgba(99, 102, 241, 0.35);
          }
        }
      `}</style>

      {/* MAIN PAGE */}
      <div className="min-h-screen bg-slate-100 lg:h-screen lg:overflow-hidden">

        <div className="grid min-h-screen lg:grid-cols-2">

          {/* ================= LEFT SIDE ================= */}
          <section className="relative hidden overflow-hidden bg-[#07162f] text-white lg:flex lg:flex-col lg:justify-between">

            {/* Background gradients */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(74,120,255,0.18),transparent_28%),radial-gradient(circle_at_20%_80%,rgba(124,58,237,0.12),transparent_25%),linear-gradient(135deg,#061226,#0a2047_55%,#07162f)]" />

            {/* Decorative dots */}
            <div className="absolute bottom-10 left-10 grid grid-cols-8 gap-3 opacity-30">
              {Array.from({ length: 32 }).map((_, index) => (
                <span
                  key={index}
                  className="h-1 w-1 rounded-full bg-purple-400"
                />
              ))}
            </div>

            {/* Animated glowing lines */}
            <div
              className="absolute left-12 top-1/3 h-[2px] w-24 rotate-[-30deg] bg-cyan-400 blur-[1px]"
              style={{ animation: 'float 4s ease-in-out infinite' }}
            />

            <div
              className="absolute right-32 top-20 h-[3px] w-20 rotate-[-40deg] bg-blue-400 blur-[1px]"
              style={{ animation: 'float 5s ease-in-out infinite' }}
            />

            <div
              className="absolute bottom-16 right-28 h-[3px] w-20 rotate-[-35deg] bg-yellow-400"
              style={{ animation: 'float 6s ease-in-out infinite' }}
            />

            {/* Hardware background image */}
            <div className="absolute right-0 top-0 h-full w-[52%] opacity-[0.10]">
              <img
                src="/hardware-tools.jpg"
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            {/* CONTENT */}
            <div className="relative z-10 flex h-full flex-col justify-between px-8 py-8 xl:px-14 xl:py-10">

              {/* TOP */}
              <div>

                {/* LOGO */}
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-400/40 bg-yellow-400/10 shadow-lg">
                    <img
                      src="/logo.png"
                      alt="Umuhoza Quincaillerie logo"
                      className="h-9 w-9 object-contain"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.25em] text-white">
                      UMUHOZA
                    </p>

                    <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-yellow-300">
                      QUINCAILLERIE
                    </p>
                  </div>
                </div>

                {/* WELCOME */}
                <div className="mt-10 xl:mt-14">

                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-yellow-300">
                    Welcome Back!
                  </p>

                  <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-tight xl:text-6xl">
                    Admin{' '}
                    <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                      Dashboard
                    </span>
                  </h1>

                  <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 xl:text-lg">
                    Sign in to manage your store, track inventory,
                    process sales and grow your business.
                  </p>
                </div>

                {/* SECURITY */}
                <div className="mt-8 max-w-xl rounded-3xl border border-blue-400/20 bg-blue-950/40 p-5 backdrop-blur-md xl:mt-10">

                  <div className="flex items-center gap-4">

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 text-2xl shadow-lg">
                      🛡️
                    </div>

                    <div>
                      <h2 className="text-lg font-bold">
                        Secure Admin Access
                      </h2>

                      <p className="mt-1 text-sm leading-relaxed text-slate-300">
                        Your data is protected with industry-standard
                        security and encryption.
                      </p>
                    </div>

                  </div>
                </div>

              </div>

              {/* FEATURES */}
              <div className="mt-8 grid grid-cols-2 gap-4">

                {features.map((feature) => (
                  <div
                    key={feature.title}
                    className="group rounded-3xl border border-white/10 bg-slate-950/35 p-4 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-blue-400/30 hover:bg-slate-900/60"
                  >

                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} text-xl shadow-lg`}
                    >
                      {feature.icon}
                    </div>

                    <h3 className="mt-3 text-sm font-bold xl:text-base">
                      {feature.title}
                    </h3>

                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      {feature.description}
                    </p>

                  </div>
                ))}

              </div>

            </div>

            {/* CURVED DIVIDER */}
            <div className="absolute right-[-1px] top-0 z-20 hidden h-full w-28 lg:block">
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="h-full w-full"
              >
                <path
                  d="M100,0 C35,20 35,45 55,65 C70,80 60,92 45,100 L100,100 Z"
                  fill="#f8fafc"
                />
              </svg>
            </div>

          </section>


          {/* ================= RIGHT SIDE ================= */}
          <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#f8fafc] via-[#eef2ff] to-[#f5f3ff] px-5 py-8 lg:h-screen lg:min-h-0 lg:py-6">

            {/* Background decorations */}
            <div className="absolute right-10 top-10 grid grid-cols-6 gap-3 opacity-30">
              {Array.from({ length: 30 }).map((_, index) => (
                <span
                  key={index}
                  className="h-1.5 w-1.5 rounded-full bg-indigo-400"
                />
              ))}
            </div>

            <div
              className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-purple-300/20 blur-3xl"
              style={{ animation: 'float 7s ease-in-out infinite' }}
            />

            <div
              className="absolute right-0 top-1/4 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl"
              style={{ animation: 'float 6s ease-in-out infinite' }}
            />

            {/* LOGIN CARD */}
            <div className="relative z-10 w-full max-w-[480px]">

              <div
                className="rounded-[32px] border border-white/80 bg-white/85 p-6 shadow-[0_25px_80px_rgba(70,80,120,0.18)] backdrop-blur-xl sm:p-8 xl:p-9"
                style={{ animation: 'pulseGlow 4s ease-in-out infinite' }}
              >

                {/* LOGIN HEADER */}
                <div className="text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 shadow-lg">
                    <span className="text-3xl">🔐</span>
                  </div>

                  <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900">
                    Admin Login
                  </h2>

                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
                    Use your administrator account to access the
                    dashboard and manage your store.
                  </p>

                </div>


                {/* FORM */}
                <form
                  onSubmit={handleSubmit}
                  className="mt-7 space-y-4"
                >

                  {/* EMAIL */}
                  <div>

                    <label className="text-sm font-semibold text-slate-700">
                      Email Address
                    </label>

                    <div className="relative mt-2">

                      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                        ✉
                      </span>

                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                      />

                    </div>

                  </div>


                  {/* PASSWORD */}
                  <div>

                    <label className="text-sm font-semibold text-slate-700">
                      Password
                    </label>

                    <div className="relative mt-2">

                      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                        🔒
                      </span>

                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3.5 pr-20 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((prev) => !prev)
                        }
                        className="absolute inset-y-0 right-4 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>

                    </div>

                  </div>


                  {/* OPTIONS */}
                  <div className="flex items-center justify-between gap-3 pt-1 text-sm">

                    <label className="flex cursor-pointer items-center gap-2 text-slate-600">

                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />

                      Remember me

                    </label>

                    <Link
                      to="/admin/forgot-password"
                      className="font-semibold text-indigo-600 transition hover:text-indigo-800"
                    >
                      Forgot password?
                    </Link>

                  </div>


                  {/* ERROR */}
                  {error && (
                    <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </p>
                  )}


                  {/* SUCCESS */}
                  {success && (
                    <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {success}
                    </p>
                  )}


                  {/* SUBMIT BUTTON */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 px-5 py-3.5 text-base font-bold text-white shadow-[0_18px_35px_rgba(79,70,229,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_45px_rgba(79,70,229,0.45)] disabled:cursor-not-allowed disabled:opacity-70"
                  >

                    {isLoading ? 'Signing in...' : 'Sign In'}

                    {!isLoading && (
                      <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    )}

                  </button>

                </form>


                {/* FOOTER */}
                <div className="mt-6 flex items-center gap-3">

                  <div className="h-px flex-1 bg-slate-200" />

                  <span className="text-xs text-slate-400">
                    Secure access
                  </span>

                  <div className="h-px flex-1 bg-slate-200" />

                </div>

                <p className="mt-4 text-center text-xs text-slate-400">
                  Umuhoza Quincaillerie Management System.
                </p>

              </div>

            </div>

          </section>

        </div>

      </div>
    </>
  );
}

export default AdminLogin;