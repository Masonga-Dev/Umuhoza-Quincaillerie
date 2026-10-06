import { createContext, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Phase 3 — Reusable shopping cart.
 * - Persists to localStorage (survives refresh)
 * - Holds product + variant identity, quantity, unit price snapshot
 * - NEVER touches inventory: stock is only validated server-side at checkout
 * - Unit price stored here is display-only; the backend re-prices every order
 */
const CartContext = createContext(null);

const STORAGE_KEY = 'umuhoza_cart_v1';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* quota */ }
  }, [items]);

  // Same product+variant always maps to one line
  const lineKey = (productId, variantId) => `${productId}::${variantId ?? 0}`;

  const addItem = (item, qty = 1) => {
    const {
      product_id, product_variant_id = null, name, variant_label = null,
      image_path = null, unit_price = 0, stock_quantity = null,
    } = item || {};
    if (!product_id) return;
    const amount = Math.max(1, Number.isInteger(Number(qty)) ? Number(qty) : 1);
    setItems(prev => {
      const key = lineKey(product_id, product_variant_id);
      const existing = prev.find(i => lineKey(i.product_id, i.product_variant_id) === key);
      if (existing) {
        return prev.map(i =>
          i.key === key
            ? { ...i, quantity: Math.min(i.quantity + amount, Number(i.stock_quantity ?? 10000)) }
            : i
        );
      }
      return [...prev, {
        key,
        product_id,
        product_variant_id,
        name: String(name || 'Item'),
        variant_label,
        image_path,
        unit_price: Number(unit_price) || 0,
        stock_quantity: stock_quantity == null ? null : Number(stock_quantity),
        quantity: Math.min(amount, Number(stock_quantity ?? 10000)),
      }];
    });
  };

  const updateQuantity = (key, qty) => {
    setItems(prev => prev
      .map(i => i.key === key
        ? { ...i, quantity: Math.max(1, Math.min(Number(qty) || 1, Number(i.stock_quantity ?? 10000))) }
        : i)
    );
  };

  const removeItem = (key) => setItems(prev => prev.filter(i => i.key !== key));
  const clearCart = () => setItems([]);

  const { count, subtotal } = useMemo(() => ({
    count: items.reduce((s, i) => s + i.quantity, 0),
    subtotal: items.reduce((s, i) => s + i.quantity * Number(i.unit_price || 0), 0),
  }), [items]);

  const value = { items, addItem, updateQuantity, removeItem, clearCart, count, subtotal };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
