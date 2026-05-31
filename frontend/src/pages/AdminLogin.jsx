import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

function AdminLogin() {
  const [email, setEmail] = useState('admin@umuhoza.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await API.post('/auth/login', { email, password });
      localStorage.setItem('umuhoza_token', response.data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Login failed. Check your credentials and try again.');
    }
  };

  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900">Admin Login</h2>
      <p className="mt-2 text-slate-600">Use the administrator account to manage products, inventory, and sales.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-white shadow hover:bg-blue-700">
          Sign In
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;
