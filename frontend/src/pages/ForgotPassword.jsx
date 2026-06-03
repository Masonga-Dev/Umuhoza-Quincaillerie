import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';

function ForgotPassword() {
  const [email, setEmail] = useState('admin@umuhoza.com');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await API.post('/auth/forgot-password', { email });
      setMessage(response.data.message || 'If the email exists, a password reset request has been sent.');
      if (response.data.temporaryPassword) {
        setMessage(
          `Temporary password created: ${response.data.temporaryPassword}. Use it to login and change your password.`
        );
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to reset password. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900">Forgot Password</h2>
      <p className="mt-2 text-slate-600">Enter your admin email to receive a temporary password.</p>
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isLoading ? 'Submitting...' : 'Send Reset'}
        </button>
      </form>
      <div className="mt-4 text-sm text-slate-600">
        Back to{' '}
        <Link className="font-semibold text-blue-600 hover:text-blue-700" to="/admin">
          Admin login
        </Link>
      </div>
    </div>
  );
}

export default ForgotPassword;
