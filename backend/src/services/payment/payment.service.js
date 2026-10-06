/**
 * Phase 7/8 — Payment service (provider interface + mock service).
 *
 * The checkout flow never talks to a provider directly; it goes through
 * initiatePayment()/recordProviderResult() here, so swapping the mock for
 * real IremboPay credentials later requires ZERO checkout changes.
 *
 * Required env vars when going live (never exposed to the frontend):
 *   IREMBOPAY_API_KEY
 *   IREMBOPAY_SECRET
 *   IREMBOPAY_MERCHANT_ID
 *   IREMBOPAY_CALLBACK_URL
 *   IREMBOPAY_CREATE_URL   — full URL of the provider's charge endpoint
 *   IREMBOPAY_VERIFY_URL   — full URL of the provider's status endpoint
 *   IREMBOPAY_WEBHOOK_SECRET — HMAC secret for webhook signature verification
 *
 * No endpoints are invented: the real provider only activates when the
 * operator supplies CREATE/VERIFY URLs. Otherwise a Mock provider is used
 * (development + automated tests) with the exact same interface.
 */

const MODE_MOCK = 'mock';
const MODE_LIVE = 'irembopay';

function liveConfigured() {
  return Boolean(
    process.env.IREMBOPAY_API_KEY &&
    process.env.IREMBOPAY_SECRET &&
    process.env.IREMBOPAY_MERCHANT_ID &&
    process.env.IREMBOPAY_CREATE_URL &&
    process.env.IREMBOPAY_VERIFY_URL
  );
}

export function currentMode() {
  return liveConfigured() ? MODE_LIVE : MODE_MOCK;
}

/**
 * Mock provider — same contract as the live one.
 * createPayment()  → { provider_reference, instructions }
 * verifyPayment()  → { status: 'Paid' | 'Failed' | 'Processing', raw }
 */
const mockProvider = {
  name: 'MockPay',
  async createPayment({ reference, amount, currency, method }) {
    return {
      provider_reference: `MOCK-${reference}`,
      instructions: `Mock provider: dial *182*1*1# to simulate paying ${amount} ${currency} with ${method}.`,
      mock: true,
    };
  },
  async verifyPayment() {
    // The mock never marks anything Paid by itself — the webhook (or an admin)
    // remains the only source of truth, exactly like in production.
    return { status: 'Processing', raw: { mocked: true } };
  },
};

/**
 * Live IremboPay provider — activated only by operator-supplied env config.
 */
const irembopayProvider = {
  name: 'IremboPay',
  async createPayment({ reference, amount, currency, method, callbackUrl }) {
    const res = await fetch(process.env.IREMBOPAY_CREATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.IREMBOPAY_API_KEY}`,
        'X-Merchant-Id': process.env.IREMBOPAY_MERCHANT_ID,
        'X-Secret': process.env.IREMBOPAY_SECRET,
      },
      body: JSON.stringify({
        reference,
        amount,
        currency,
        payment_method: method,
        callback_url: callbackUrl || process.env.IREMBOPAY_CALLBACK_URL,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`IremboPay createPayment failed (${res.status}): ${text.slice(0, 200)}`);
    }
    const data = await res.json();
    return {
      provider_reference: data.provider_reference || data.transaction_id || null,
      instructions: data.instructions || data.payment_url || null,
      raw: data,
      mock: false,
    };
  },
  async verifyPayment(reference) {
    const url = `${process.env.IREMBOPAY_VERIFY_URL}?reference=${encodeURIComponent(reference)}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.IREMBOPAY_API_KEY}`,
        'X-Merchant-Id': process.env.IREMBOPAY_MERCHANT_ID,
        'X-Secret': process.env.IREMBOPAY_SECRET,
      },
    });
    if (!res.ok) throw new Error(`IremboPay verify failed (${res.status})`);
    const data = await res.json();
    const s = String(data.status || '').toLowerCase();
    const status = s === 'paid' || s === 'success' ? 'Paid'
      : s === 'failed' ? 'Failed'
      : s === 'pending' || s === 'processing' ? 'Processing'
      : 'Processing';
    return { status, raw: data };
  },
};

function getProvider() {
  return liveConfigured() ? irembopayProvider : mockProvider;
}

/**
 * Start a provider payment for an existing payment_intent (row in `payments`).
 * Never trusts amounts from the client — `amount` must come from the DB row.
 */
export async function initiatePayment({ reference, amount, currency = 'RWF', method, callbackUrl }) {
  const provider = getProvider();
  const created = await provider.createPayment({ reference, amount, currency, method, callbackUrl });
  return { provider: provider.name, ...created };
}

/**
 * Ask the provider for the authoritative status of a reference.
 * Used by the backend to double-check a webhook claim (never the frontend).
 */
export async function verifyPaymentWithProvider(reference) {
  const provider = getProvider();
  return provider.verifyPayment(reference);
}
