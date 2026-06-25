import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#f5f5f5',
  },
  card: {
    background: '#fff',
    padding: 40,
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    width: 380,
  },
  title: { textAlign: 'center', marginBottom: 24, fontSize: 24, fontWeight: 700, color: '#1a73e8' },
  field: { marginBottom: 16 },
  label: { display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: 4,
    fontSize: 15,
    boxSizing: 'border-box' as const,
  },
  btn: {
    width: '100%',
    padding: 10,
    background: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 16,
    cursor: 'pointer',
    marginTop: 8,
  },
  toggle: {
    textAlign: 'center',
    marginTop: 16,
    color: '#1a73e8',
    cursor: 'pointer',
    fontSize: 14,
    background: 'none',
    border: 'none',
    textDecoration: 'underline',
  },
  error: { color: '#d32f2f', fontSize: 13, marginTop: 4 },
};

export default function Login() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('All fields are required');
      return;
    }
    if (isRegister && password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(username, password, confirmPassword);
      } else {
        await login(username, password);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Nano-URL</h1>
        <h2 style={{ textAlign: 'center', marginBottom: 20, fontSize: 18 }}>
          {isRegister ? 'Register' : 'Login'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
          {isRegister && (
            <div style={styles.field}>
              <label style={styles.label}>Confirm Password</label>
              <input
                style={styles.input}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
              />
            </div>
          )}
          {error && <div style={styles.error}>{error}</div>}
          <button style={styles.btn} type="submit" disabled={submitting}>
            {submitting ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
          </button>
        </form>
        <button style={styles.toggle} onClick={() => { setIsRegister(!isRegister); setError(''); }}>
          {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
        </button>
      </div>
    </div>
  );
}