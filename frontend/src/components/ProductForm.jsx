import { useEffect, useState } from 'react';

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function generateSKU() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `UMU-${random}`;
}

function inputClass() {
  return 'mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100';
}

function ProductForm({ initialValue = {}, categories = [], onSave, submitLabel }) {
  const isNew = !initialValue.id;

  const [form, setForm] = useState({
    category_id: initialValue.category_id || '',
    sku: initialValue.sku || (isNew ? generateSKU() : ''),
    name: initialValue.name || '',
    description: initialValue.description || '',
    cost_price: initialValue.cost_price ?? '',
    selling_price: initialValue.selling_price ?? '',
    stock_quantity: initialValue.stock_quantity ?? '',
    minimum_stock: initialValue.minimum_stock ?? 5,
  });

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(
    initialValue.image_path ? `${BACKEND_BASE}/${initialValue.image_path}` : null
  );
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
  };

  const handleGenerateSKU = () => handleChange('sku', generateSKU());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Product name is required.');
    if (!form.sku.trim()) return setError('SKU is required.');
    if (!form.category_id) return setError('Category is required.');
    if (Number(form.selling_price) < 0) return setError('Selling price cannot be negative.');
    if (Number(form.stock_quantity) < 0) return setError('Stock quantity cannot be negative.');

    setIsSubmitting(true);
    try {
      await onSave(
        {
          ...form,
          cost_price: Number(form.cost_price || 0),
          selling_price: Number(form.selling_price || 0),
          stock_quantity: Number(form.stock_quantity || 0),
          minimum_stock: Number(form.minimum_stock || 5),
        },
        imageFile
      );
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to save the product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{submitLabel}</h2>
        <p className="mt-1 text-sm text-slate-500">Fill in the details below to save this product to the catalog.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={form.category_id}
            onChange={(e) => handleChange('category_id', e.target.value)}
            className={inputClass()}
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* SKU + Generate */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            SKU <span className="text-red-500">*</span>
            <span className="ml-1 text-xs font-normal text-slate-400">(Stock Keeping Unit)</span>
          </label>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              required
              value={form.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
              placeholder="UMU-XXXXXX"
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={handleGenerateSKU}
              className="flex-shrink-0 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Generate
            </button>
          </div>
        </div>

        {/* Product Name */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Enter product name"
            className={inputClass()}
          />
        </div>

        {/* Description */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            placeholder="Brief description of the product"
            className={inputClass()}
          />
        </div>

        {/* Cost Price */}
        <div>
          <label className="block text-sm font-medium text-slate-700">Cost Price (RWF)</label>
          <input
            type="number"
            step="1"
            min="0"
            value={form.cost_price}
            onChange={(e) => handleChange('cost_price', e.target.value)}
            placeholder="0"
            className={inputClass()}
          />
        </div>

        {/* Selling Price */}
        <div>
          <label className="block text-sm font-medium text-slate-700">Selling Price (RWF)</label>
          <input
            type="number"
            step="1"
            min="0"
            value={form.selling_price}
            onChange={(e) => handleChange('selling_price', e.target.value)}
            placeholder="0"
            className={inputClass()}
          />
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm font-medium text-slate-700">Current Stock (units)</label>
          <input
            type="number"
            min="0"
            value={form.stock_quantity}
            onChange={(e) => handleChange('stock_quantity', e.target.value)}
            placeholder="0"
            className={inputClass()}
          />
        </div>

        {/* Min Stock */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Minimum Stock
            <span className="ml-1 text-xs font-normal text-slate-400">(Low Stock alert threshold)</span>
          </label>
          <input
            type="number"
            min="0"
            value={form.minimum_stock}
            onChange={(e) => handleChange('minimum_stock', e.target.value)}
            placeholder="5"
            className={inputClass()}
          />
        </div>

        {/* Image Upload */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Product Image</label>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label className="cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-4 text-sm text-slate-600 transition hover:border-blue-400 hover:bg-blue-50">
              <span className="font-medium text-blue-600">Choose image</span>
              <span className="ml-1">or drag here</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="sr-only"
              />
            </label>

            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-24 w-24 rounded-2xl border border-slate-200 object-cover shadow-sm"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <span className="text-sm text-slate-400">No image selected</span>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-400">Accepted: JPG, PNG, WEBP. Max 10 MB.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving…
            </>
          ) : submitLabel}
        </button>
        {isSubmitting && (
          <span className="text-sm text-slate-500">Please wait, uploading…</span>
        )}
      </div>
    </form>
  );
}

export default ProductForm;
