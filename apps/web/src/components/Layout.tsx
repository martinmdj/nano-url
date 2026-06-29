import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface-muted">
      <nav className="bg-white border-b border-surface-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/dashboard" className="text-lg font-bold text-primary-600 no-underline tracking-tight">
            Nano-URL
          </Link>
          <div className="flex items-center gap-5">
            <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-primary-600 no-underline transition-colors">
              Dashboard
            </Link>
            <Link to="/stats" className="text-sm font-medium text-slate-600 hover:text-primary-600 no-underline transition-colors">
              Stats
            </Link>
            <span className="text-xs text-slate-400">{user?.username}</span>
            <button
              className="btn-ghost text-xs px-3 py-1.5 border border-surface-border rounded-md"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}