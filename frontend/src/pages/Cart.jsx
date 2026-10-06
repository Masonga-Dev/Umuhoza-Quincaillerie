import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../cart/CartContext';
import { imgUrl } from '../utils/imgUrl';

function fmtPrice(v) {
  return Number(v || 0).toLocaleString('en-RW');
}

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart, subtotal } = useCart();
  const navigate = useNavigate();

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-3xl">🛒</div>
        <h1 className="text-xl font-bold text-slate-800">Your cart is empty</h1>
        <p className="mt-1 text-sm text-slate-500">Browse our products and add what you need.</p>
        <Link
          to="/products"
          className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Shopping Cart</h1>
        <button
          onClick={clearCart}
          className="text-sm font-semibold text-slate-400 transition hover:text-red-500"
        >
          Clear cart
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <div className="space-y-3">
          {items.map(item => (
            <div
              key={item.key}
              className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {item.image_path
                  ? <img src={imgUrl(item.image_path)} alt={item.name} className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center text-2xl">🛠️</div>}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-800">{item.name}</p>
                {item.variant_label && (
                  <p className="text-xs text-slate-500">{item.variant_label}</p>
                )}
                <p className="mt-0.5 text-sm font-semibold text-orange-600">
                  {fmtPrice(item.unit_price)} RWF
                  {item.stock_quantity != null && (
                    <span className="ml-2 font-normal text-slate-400">
                      {item.stock_quantity > 0 ? `${item.stock_quantity} in stock` : 'out of stock'}
                    </span>
                  )}
                </p>

                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center rounded-xl border border-slate-200">
                    <button
                      onClick={() => updateQuantity(item.key, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="px-3 py-1.5 text-slate-500 transition hover:text-orange-500 disabled:opacity-30"
                      aria-label="Decrease quantity"
                    >−</button>
                    <span className="min-w-[2rem] text-center text-sm font-semibold text-slate-800">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.key, item.quantity + 1)}
                      className="px-3 py-1.5 text-slate-500 transition hover:text-orange-500"
                      aria-label="Increase quantity"
                    >+</button>
                  </div>

                  <button
                    onClick={() => removeItem(item.key)}
                    className="text-xs font-semibold text-slate-400 transition hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="font-bold text-slate-800">{fmtPrice(item.unit_price * item.quantity)} RWF</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">Order Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span>{fmtPrice(subtotal)} RWF</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Delivery fee</span>
              <span className="text-xs font-semibold text-slate-400">Calculated at checkout</span>
            </div>
          </div>
          <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 font-bold text-slate-800">
            <span>Subtotal</span>
            <span className="text-orange-600">{fmtPrice(subtotal)} RWF</span>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="mt-5 w-full rounded-2xl bg-orange-500 py-3 font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600"
          >
            Proceed to Checkout
          </button>
          <Link
            to="/products"
            className="mt-3 block w-full rounded-2xl border-2 border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-600 transition hover:border-orange-300 hover:text-orange-600"
          >
            Continue shopping
          </Link>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
            Final prices and stock are always confirmed by our server at checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
