import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    background: '#1a73e8',
    color: '#fff',
  },
  brand: { fontSize: 20, fontWeight: 700, color: '#fff', textDecoration: 'none' },
  links: { display: 'flex', gap: 20, alignItems: 'center' },
  link: { color: '#fff', textDecoration: 'none', fontSize: 15 },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid #fff',
    color: '#fff',
    padding: '6px 14px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 14,
  },
  main: { maxWidth: 960, margin: '0 auto', padding: '24px 16px' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <nav style={styles.nav}>
        <Link to="/dashboard" style={styles.brand}>
          Nano-URL
        </Link>
        <div style={styles.links}>
          <Link to="/dashboard" style={styles.link}>
            Dashboard
          </Link>
          <Link to="/stats" style={styles.link}>
            Stats
          </Link>
          <span style={{ fontSize: 14, opacity: 0.8 }}>{user?.username}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
      <main style={styles.main}>{children}</main>
    </div>
  );
}