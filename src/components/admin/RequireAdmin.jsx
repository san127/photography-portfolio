import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { isSupabaseConfigured } from '../../lib/supabase.js';

export default function RequireAdmin({ children }) {
  const { user, isAdmin, loading } = useAuth();

  if (!isSupabaseConfigured) return <Navigate to="/admin/login" replace />;

  if (loading) {
    return <div className="state-block" style={{ padding: '6rem 1rem' }}>Loading…</div>;
  }

  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;

  return children;
}
