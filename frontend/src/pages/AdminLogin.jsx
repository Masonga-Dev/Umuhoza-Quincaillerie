import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import { useLanguage } from '../i18n/LanguageContext';

/* ── Stroke icons — consistent line style used inside the fields ────────── */
const ICON = {
  className: 'h-5 w-5 shrink-0',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

function MailIcon() {
  return (
    <svg {...ICON}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg {...ICON}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg {...ICON}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg {...ICON}>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <path d="M2 2l20 20" />
    </svg>
  );
}

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const { t } = useLanguage();

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

      setSuccess(t('admin.login.success') || 'Login successful! Redirecting to admin dashboard...');

      navigate('/admin/dashboard');
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          t('admin.login.failed') || 'Login failed. Check your credentials and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* ── FULL-SCREEN SPLIT — two solid blocks, no gap, no radius, no shadow ── */
    <div className="flex min-h-screen w-full flex-col bg-white lg:h-screen lg:flex-row lg:overflow-hidden">

      {/* Short-viewport compaction — keeps the entire form on screen without scrolling */}
      <style>{`
        @media (max-height: 820px) {
          .lp { padding-top: 1.25rem !important; padding-bottom: 1.25rem !important; }
          .lp-logo { height: 3rem !important; width: 3rem !important; }
          .lp-name { margin-top: 0.6rem !important; }
          .lp-title { margin-top: 1.25rem !important; font-size: 1.75rem !important; line-height: 1.2 !important; }
          .lp-prompt { margin-top: 0.4rem !important; font-size: 0.95rem !important; }
          .lp-rule { margin-top: 0.7rem !important; }
          .lp-form { margin-top: 1.25rem !important; }
          .lp-form > * + * { margin-top: 0.7rem !important; }
          .lp-gap { margin-top: 0.35rem !important; }
          .lp-input { padding-top: 0.65rem !important; padding-bottom: 0.65rem !important; }
          .lp-submit { padding-top: 0.8rem !important; padding-bottom: 0.8rem !important; }
          .lp-help { margin-top: 1rem !important; }
        }
      `}</style>

      {/* ================= LEFT PANEL — white / light theme (45%) ================= */}
      <section className="relative flex min-h-screen w-full min-w-0 flex-col bg-white lg:h-full lg:min-h-0 lg:w-[45%] lg:overflow-y-auto">

        <div className="lp flex w-full max-w-[770px] flex-1 flex-col justify-center px-8 py-8 sm:px-12 xl:px-24">

          {/* BRAND — logo stacked over the business name */}
          <img
            src="/logo.png"
            alt="Umuhoza Quincaillerie logo"
            className="lp-logo h-16 w-16 object-contain"
          />

          <p className="lp-name mt-4 text-lg font-bold text-slate-900">
            {t('admin.appName')}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {t('admin.adminPanel')}
          </p>

          {/* HEADING — "Welcome Back!" */}
          <h1 className="lp-title mt-8 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 xl:text-5xl">
            {t('admin.login.welcome')}
          </h1>

          <p className="lp-prompt mt-3 text-base text-slate-500 xl:text-lg">
            {t('admin.login.signInPrompt')}
          </p>

          {/* Short accent divider */}
          <div className="lp-rule mt-4 h-[3px] w-10 rounded-full bg-slate-300" />


          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="lp-form mt-8 space-y-4"
          >

            {/* EMAIL */}
            <div>

              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-slate-700 xl:text-base"
              >
                {t('admin.login.email')}
              </label>

              <div className="lp-gap relative mt-2">

                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-500">
                  <MailIcon />
                </span>

                <input
                  id="login-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('admin.login.emailPlaceholder')}
                  required
                  className="lp-input w-full rounded-lg border-0 bg-slate-100 py-4 pl-12 pr-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500"
                />

              </div>

            </div>

            {/* PASSWORD */}
            <div>

              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-slate-700 xl:text-base"
              >
                {t('admin.login.password')}
              </label>

              <div className="lp-gap relative mt-2">

                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-500">
                  <LockIcon />
                </span>

                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('admin.login.passwordPlaceholder')}
                  required
                  className="lp-input w-full rounded-lg border-0 bg-slate-100 py-4 pl-12 pr-12 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500"
                />

                {/* EYE TOGGLE — icon inside the field */}
                <button
                  type="button"
                  aria-label={
                    showPassword ? t('admin.login.hide') : t('admin.login.show')
                  }
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-1 flex w-10 items-center justify-center text-slate-500 transition hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>

              </div>

            </div>

            {/* ERROR */}
            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}


            {/* SUCCESS */}
            {success && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
                {success}
              </p>
            )}


            {/* SUBMIT — orange gradient */}
            <button
              type="submit"
              disabled={isLoading}
              className="lp-submit flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 px-5 py-4 text-base font-bold text-white shadow-[0_18px_35px_rgba(249,115,22,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_45px_rgba(249,115,22,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? t('admin.login.signingIn') : t('admin.login.signIn')}
            </button>

          </form>


          {/* HELP LINE */}
          <p className="lp-help mt-8 text-center text-sm text-slate-500">
            {t('admin.login.signInHelp')}{' '}
            <Link
              to="/admin/forgot-password"
              className="font-semibold text-orange-600 transition hover:text-orange-700"
            >
              {t('admin.login.forgot')}
            </Link>
          </p>

        </div>

      </section>

      {/* ================= RIGHT PANEL — image + gradient overlay ONLY (no content) ================= */}
      <section className="relative hidden min-w-0 overflow-hidden bg-[#0f1b2d] lg:block lg:h-full lg:w-[55%]">

        {/* Full-bleed background image — cover, never stretched or distorted */}
        <img
          src="/home.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />

        {/* Subtle dark tint — keeps the image depth consistent with the app mood */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(15,27,45,0.08), rgba(15,27,45,0.30))',
          }}
        />

        {/* WHITE OVERLAY — continues the white form panel into the image and fades out,
            so the seam blends smoothly instead of showing a hard vertical line */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.70) 12%, rgba(255,255,255,0.38) 22%, rgba(255,255,255,0.12) 32%, rgba(255,255,255,0) 42%)',
          }}
        />

      </section>

    </div>
  );
}

export default AdminLogin;