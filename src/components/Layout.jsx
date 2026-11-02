import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  ListFilter,
  FileBarChart2,
  Smartphone,
  Settings,
  LogOut,
  Download,
  Sun,
  Moon
} from 'lucide-react';
import { useData } from '../context/DataContext';

export const BanjaLogoFull = () => (
  <img
    src="/banja-logo.png"
    alt="banja."
    style={{
      height: '54px',
      width: 'auto',
      display: 'block',
      objectFit: 'contain',
      marginLeft: '-4px'
    }}
  />
);

export const BanjaIconSmall = () => (
  <img
    src="/banja-icon.png"
    alt="b."
    style={{
      height: '34px',
      width: 'auto',
      display: 'block',
      objectFit: 'contain'
    }}
  />
);

const Layout = () => {
  const { logout, cloudStatus } = useData();
  const [installPrompt, setInstallPrompt] = useState(() => window.__deferredPwaPrompt || null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('banja_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('banja_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    const onAvailable = () => setInstallPrompt(window.__deferredPwaPrompt || null);
    window.addEventListener('pwa-install-available', onAvailable);
    return () => window.removeEventListener('pwa-install-available', onAvailable);
  }, []);

  const handleInstallApp = async () => {
    const promptEvent = installPrompt || window.__deferredPwaPrompt;
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice;
    window.__deferredPwaPrompt = null;
    setInstallPrompt(null);
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="brand-container">
          <BanjaLogoFull />
          <div style={{
            marginTop: '0.25rem',
            paddingLeft: '0.25rem',
            fontSize: '0.92rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}>
            <span>Banja Saha</span>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#c8ff29',
              display: 'inline-block'
            }} />
          </div>
        </div>

        <div className="brand-subcard">
          <div className="brand-avatar">BS</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Banja Saha Ekibi
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {cloudStatus === 'synced' ? 'Bulut Veritabanı Aktif' : 'Satış & Tesis Operasyon'}
            </div>
          </div>
        </div>
        
        <NavLink 
          to="/" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          end
        >
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>
        
        <NavLink 
          to="/new-facility" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <PlusCircle size={18} />
          Tesis Kayıt
        </NavLink>

        <NavLink 
          to="/manage-facilities" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <ListFilter size={18} />
          Kayıt Listesi
        </NavLink>

        <NavLink 
          to="/facility-report" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <FileBarChart2 size={18} />
          Tesis Bazlı Rapor
        </NavLink>

        <NavLink 
          to="/visit-entry" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Smartphone size={18} />
          Ziyaret Giriş
        </NavLink>

        <NavLink 
          to="/settings" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Settings size={18} />
          Ayarlar
        </NavLink>

        {installPrompt && (
          <button
            type="button"
            onClick={handleInstallApp}
            className="sidebar-link"
            style={{
              background: 'rgba(182, 255, 0, 0.14)',
              borderColor: 'rgba(182, 255, 0, 0.45)',
              color: 'var(--accent-lime)',
              cursor: 'pointer',
              fontWeight: 700,
              width: '100%',
              textAlign: 'left'
            }}
            title="Tam ekran mobil uygulama olarak yükle"
          >
            <Download size={18} />
            Uygulamayı Yükle
          </button>
        )}

        {/* Açık / Koyu Tema Değiştirme Butonu */}
        <button
          type="button"
          onClick={toggleTheme}
          className="sidebar-link"
          style={{
            marginTop: 'auto',
            background: 'none',
            cursor: 'pointer',
            color: 'var(--text-main)',
            width: '100%',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '0.85rem'
          }}
          title={theme === 'dark' ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={18} color="#f59e0b" />
              <span>Açık Tema</span>
            </>
          ) : (
            <>
              <Moon size={18} color="#0284c7" />
              <span>Koyu Tema</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={logout}
          className="sidebar-link"
          style={{
            marginTop: '0.2rem',
            background: 'none',
            cursor: 'pointer',
            color: 'var(--danger)',
            width: '100%',
            textAlign: 'left'
          }}
          title="Sistemden Çıkış Yap"
        >
          <LogOut size={18} />
          Çıkış Yap
        </button>
      </div>

      <div className="main-content">
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
