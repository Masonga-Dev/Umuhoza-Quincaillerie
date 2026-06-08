import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('umuhoza_token');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = () => {
    API.get('/categories')
      .then((response) => setCategories(response.data))
      .catch((err) => {
        console.error(err);
        setError('Unable to load categories.');
      })
      .finally(() => setLoading(false));
  };

  const resetForm = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!name.trim()) {
      return setError('Category name is required.');
    }

    setSaving(true);
    try {
      if (editingCategory) {
        await API.put(
          `/categories/${editingCategory.id}`,
          { name, description },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await API.post(
          '/categories',
          { name, description },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      resetForm();
      fetchCategories();
    } catch (submitError) {
      console.error(submitError);
      setError(submitError?.response?.data?.message || 'Unable to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || '');
    setError('');
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete category '${category.name}'?`)) {
      return;
    }

    try {
      await API.delete(`/categories/${category.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCategories();
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError?.response?.data?.message || 'Unable to delete category.');
    }
  };

  return (
    <AdminLayout currentPage="/admin/products/categories">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Categories</h2>
          <p className="mt-2 text-slate-600">Create and manage product categories used in the admin products module.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Category List</h3>
            {loading ? (
              <p className="mt-4 text-slate-600">Loading categories...</p>
            ) : categories.length ? (
              <div className="mt-4 space-y-3">
                {categories.map((category) => (
                  <div key={category.id} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{category.name}</p>
                      <p className="text-sm text-slate-600">{category.description || 'No description provided.'}</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(category)}
                        className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-slate-600">No categories found. Add a category to get started.</p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Category name"
                  className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  placeholder="Optional category description"
                  className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              {error && <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminCategories;
