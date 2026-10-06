/**
 * Security middleware (spec §28) — no external dependencies.
 *
 * 1. securityHeaders  — baseline response headers (CSP kept permissive for the
 *    React SPA + uploaded images; adapt in prod via env if needed).
 * 2. rateLimit        — fixed-window in-memory limiter, keyed by IP+route class.
 *                        Auth and checkout endpoints get a tighter budget.
 * 3. corsOptions      — allow-list built from CORS_ORIGINS env var; falls back
 *                        to dev origins so local Vite still works.
 */

export function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
}

// ── Rate limiter ──────────────────────────────────────────────────────────────
const buckets = new Map(); // key -> { count, resetAt }
let lastSweep = Date.now();

function sweep(now) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}

export function rateLimit({ windowMs = 60_000, max = 300, prefix = 'global' } = {}) {
  return (req, res, next) => {
    // Health checks / static uploads are not limited
    if (req.path.startsWith('/uploads')) return next();
    const now = Date.now();
    sweep(now);
    const key = `${prefix}:${req.ip}`;
    let b = buckets.get(key);
    if (!b || b.resetAt <= now) {
      b = { count: 0, resetAt: now + windowMs };
      buckets.set(key, b);
    }
    b.count += 1;
    if (b.count > max) {
      const retry = Math.ceil((b.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retry));
      return res.status(429).json({ message: 'Too many requests. Please try again shortly.' });
    }
    next();
  };
}

// ── CORS allow-list ───────────────────────────────────────────────────────────
export function corsOptions() {
  const fromEnv = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  // CORS_ORIGINS=* opts out of filtering entirely (not recommended in prod).
  if (fromEnv.includes('*')) return { origin: true, credentials: false };
  const allowed = fromEnv; // explicit allow-list wins when provided
  const devLocal = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4000', 'http://127.0.0.1:4000'];
  const suffixes = ['.vercel.app']; // deployed frontend previews
  return {
    origin(origin, cb) {
      // Server-to-server / curl / same-origin requests have no Origin header
      if (!origin) return cb(null, true);
      if (allowed.length ? allowed.includes(origin) : false) return cb(null, true);
      if (!allowed.length && (devLocal.includes(origin) || suffixes.some(s => origin.endsWith(s)))) return cb(null, true);
      // Not allowed: respond without CORS headers instead of erroring the request
      cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  };
}
