import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { isSupabaseConfigured } from '../lib/supabase.js';
import '../styles/admin.css';

export default function AdminLogin() {
  const { user, isAdmin, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isSupabaseConfigured) {
    return (
      <div className="admin-login-screen">
        <div className="admin-login-card">
          <h1>Setup needed</h1>
          <p className="sub">
            Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to a <code>.env</code>{' '}
            file, then restart the dev server. See <code>.env.example</code>.
          </p>
          <Link to="/" className="admin-back-link">
            ← Back to the portfolio
          </Link>
        </div>
      </div>
    );
  }

  if (!loading && user && isAdmin) return <Navigate to="/admin" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const err = await signIn(email.trim(), password);
    setSubmitting(false);
    if (err) setError(err.message === 'Invalid login credentials' ? 'Wrong email or password.' : err.message);
  };

  return (
    <div className="admin-login-screen">
      <div className="admin-login-card">
        <h1>Admin</h1>
        <p className="sub">Sign in to manage the gallery.</p>

        {user && !isAdmin && !loading && (
          <p className="error-text" style={{ marginBottom: '1rem' }}>
            This account isn't set up as an admin yet.
          </p>
        )}

        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Log in'}
          </button>
        </form>

        <Link to="/" className="admin-back-link">
          ← Back to the portfolio
        </Link>
      </div>
    </div>
  );
}
