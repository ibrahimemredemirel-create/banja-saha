import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Lock, LogIn, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const { login } = useData();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Lütfen giriş şifresini giriniz.');
      return;
    }
    setLoading(true);
    setError('');
    const res = await login(password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'Girdiğiniz şifre hatalı!');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.25rem'
    }}>
      <div className="form-card" style={{
        width: '100%',
        maxWidth: '420px',
        marginBottom: 0,
        padding: '2.25rem 2rem',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
        border: '1px solid var(--border-cyan)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.25rem' }}>
          <img
            src="/banja-logo.png"
            alt="banja."
            style={{ height: '58px', width: 'auto', objectFit: 'contain', marginBottom: '0.5rem' }}
          />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
            <span>Banja Saha</span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#c8ff29', display: 'inline-block' }} />
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Satış & Saha Ziyaret Yönetim Sistemi
          </span>
        </div>

        <div className="banja-gradient-line" style={{ margin: '0.75rem 0 1.5rem 0' }}>
          <div className="banja-gradient-fill" style={{ width: '100%' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={14} color="var(--primary-color)" />
              GİRİŞ ŞİFRESİ
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Şifrenizi giriniz..."
                style={{ width: '100%', paddingRight: '2.6rem', fontSize: '0.95rem' }}
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="current-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={showPassword ? 'Gizle' : 'Göster'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(248, 113, 113, 0.14)',
              border: '1px solid rgba(248, 113, 113, 0.35)',
              color: 'var(--danger)',
              fontSize: '0.82rem',
              fontWeight: 500
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', fontSize: '0.92rem' }}
          >
            <LogIn size={17} />
            {loading ? 'Giriş Yapılıyor...' : 'Sisteme Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
