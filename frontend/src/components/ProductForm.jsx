import { useEffect, useState } from 'react';

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function ProductForm({ initialValue = {}, categories = [], onSave, submitLabel }) {
  const [form, setForm] = useState({
    category_id: initialValue.category_id || '',
    sku: initialValue.sku || '',
    name: initialValue.name || '',
    description: initialValue.description || '',
    cost_price: initialValue.cost_price ?? '',
    selling_price: initialValue.selling_price ?? '',
    stock_quantity: initialValue.stock_quantity ?? '',
    minimum_stock: initialValue.minimum_stock ?? 5,
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(initialValue.image_path ? `${BACKEND_BASE}/${initialValue.image_path}` : null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const blobUrl = URL.createObjectURL(file);
      setPreviewUrl(blobUrl);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.name.trim()) {
      return setError('Product name is required.');
    }
    if (!form.sku.trim()) {
      return setError('SKU is required.');
    }
    if (!form.category_id) {
      return setError('Category is required.');
    }
    if (Number(form.selling_price) < 0) {
      return setError('Selling price cannot be negative.');
    }
    if (Number(form.stock_quantity) < 0) {
      return setError('Stock quantity cannot be negative.');
    }

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
    } catch (saveError) {
      setError(saveError?.response?.data?.message || saveError?.message || 'Unable to save the product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">{submitLabel}</h2>
        <p className="mt-2 text-sm text-slate-600">Add or update product details for the store catalog.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Category</label>
          <select
            value={form.category_id}
            onChange={(event) => handleChange('category_id', event.target.value)}
            className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">SKU</label>
          <input
            type="text"
            value={form.sku}
            onChange={(event) => handleChange('sku', event.target.value)}
            placeholder="e.g. UMU-001"
            className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Product Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(event) => handleChange('name', event.target.value)}
            placeholder="Enter product name"
            className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={form.description}
            onChange={(event) => handleChange('description', event.target.value)}
            rows={4}
            placeholder="A short description of the product"
            className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Cost Price</label>
          <input
            type="number"
            step="0.01"
            value={form.cost_price}
            onChange={(event) => handleChange('cost_price', event.target.value)}
            placeholder="0.00"
            className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Selling Price</label>
          <input
            type="number"
            step="0.01"
            value={form.selling_price}
            onChange={(event) => handleChange('selling_price', event.target.value)}
            placeholder="0.00"
            className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Current Stock</label>
          <input
            type="number"
            value={form.stock_quantity}
            onChange={(event) => handleChange('stock_quantity', event.target.value)}
            placeholder="0"
            className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Minimum Stock</label>
          <input
            type="number"
            value={form.minimum_stock}
            onChange={(event) => handleChange('minimum_stock', event.target.value)}
            placeholder="5"
            className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Product Image</label>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex-1 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-sm text-slate-700" />
            </div>
            {previewUrl && (
              <div className="h-20 w-20 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}

export default ProductForm;
