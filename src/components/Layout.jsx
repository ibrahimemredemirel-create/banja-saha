import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  ListFilter,
  FileBarChart2,
  Smartphone,
  Settings,
  LogOut
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
            color: '#f1f5f9',
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

        <button
          type="button"
          onClick={logout}
          className="sidebar-link"
          style={{
            marginTop: 'auto',
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
