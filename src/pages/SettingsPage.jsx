import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { UserPlus, Edit, Trash2, Save, X, Download, Copy, Check, KeyRound } from 'lucide-react';
import { exportToExcel, copyFacilitiesForExcel } from '../utils/excelExport';
import { BanjaIconSmall } from '../components/Layout';

const SettingsPage = () => {
  const { facilities, visits, employees, addEmployee, updateEmployee, deleteEmployee, clearAllData, changePassword } = useData();
  const [nameInput, setNameInput] = useState('');
  const [editingEmpId, setEditingEmpId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPasswordInput.trim() || newPasswordInput.trim().length < 3) {
      alert('Lütfen en az 3 karakterli yeni bir şifre giriniz.');
      return;
    }
    const res = await changePassword(newPasswordInput.trim());
    if (res.ok) {
      setNewPasswordInput('');
      setPasswordStatus('Giriş şifresi başarıyla güncellendi!');
      setTimeout(() => setPasswordStatus(''), 3000);
    } else {
      alert(res.error || 'Şifre güncellenirken bir hata oluştu.');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Tüm kayıtlı tesisleri ve ziyaret verilerini tamamen silmek istediğinize emin misiniz?')) {
      clearAllData();
      alert('Tüm tesis ve ziyaret kayıtları sıfırlandı.');
    }
  };

  const handleCopyExcel = async () => {
    const count = await copyFacilitiesForExcel(facilities, visits, true);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    if (count === 0) {
      alert('Henüz kopyalanacak tesis kaydı bulunmuyor (Sadece sütun başlıkları panoya kopyalandı).');
    }
  };

  const handleDownloadExcel = () => {
    exportToExcel(facilities, visits);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = nameInput.trim().toLocaleUpperCase('tr-TR');
    if (!cleaned) {
      alert('Lütfen saha çalışanı adını giriniz.');
      return;
    }

    if (editingEmpId) {
      updateEmployee(editingEmpId, cleaned);
      setEditingEmpId(null);
      setNameInput('');
    } else {
      addEmployee(cleaned);
      setNameInput('');
    }
  };

  const handleSelectEdit = (emp) => {
    setEditingEmpId(emp.id);
    setNameInput(emp.name);
  };

  const handleCancelEdit = () => {
    setEditingEmpId(null);
    setNameInput('');
  };

  const handleDelete = (emp) => {
    if (window.confirm(`"${emp.name}" isimli saha çalışanını silmek istediğinize emin misiniz?`)) {
      deleteEmployee(emp.id);
      if (editingEmpId === emp.id) {
        handleCancelEdit();
      }
    }
  };

  return (
    <div style={{ maxWidth: '860px' }}>
      {/* Üstten Ayarlara Taşınan Excel Aktarım ve Sistem Barı */}
      <div className="top-navbar" style={{ marginBottom: '1.5rem' }}>
        <div className="top-navbar-left">
          <BanjaIconSmall />
          <h1 className="top-navbar-title">Ayarlar & Veri Aktarımı</h1>
        </div>

        <div className="top-navbar-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleCopyExcel}
            title="Excel şablonuyla birebir aynı sütun sırasıyla panoya kopyalar (Excel'de Ctrl+V yapabilirsiniz)"
          >
            {copied ? <Check size={16} color="#b6ff00" /> : <Copy size={16} />}
            {copied ? 'Panoya Kopyalandı!' : 'Excel İçin Kopyala'}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownloadExcel}
            title="Aynı sütun ve başlık şablonunda .xlsx olarak indirir"
          >
            <Download size={16} />
            Excel'e Aktar (.xlsx)
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={handleClearAll}
            style={{ color: 'var(--danger)', borderColor: 'rgba(248, 113, 113, 0.45)' }}
            title="Tüm tesis ve ziyaret verilerini sıfırlar"
          >
            <Trash2 size={16} />
            Verileri Sıfırla
          </button>

          <div className="status-pill">
            <span className="status-dot" />
            Banja Saha
          </div>
        </div>
      </div>

      <div className="form-card">
        <span className="section-label">SİSTEM AYARLARI</span>
        <h2 style={{ margin: 0, fontSize: '1.15rem' }}>
          {editingEmpId ? 'Saha Çalışanı Düzenle' : 'Saha Çalışanı Ekle'}
        </h2>

        <div className="banja-gradient-line">
          <div className="banja-gradient-fill" style={{ width: '100%' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '240px' }}>
            <label>SAHA ÇALIŞANI EKLE (İSİM SOYİSİM)</label>
            <input
              type="text"
              className="form-control"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Örn: AHMET YILMAZ"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ height: '41px' }}>
            {editingEmpId ? <Save size={16} /> : <UserPlus size={16} />}
            {editingEmpId ? 'Güncelle' : 'Kaydet'}
          </button>

          {editingEmpId && (
            <button type="button" className="btn btn-outline" onClick={handleCancelEdit} style={{ height: '41px' }}>
              <X size={16} />
              İptal
            </button>
          )}
        </form>
      </div>

      <div className="dashboard-card">
        <span className="section-label">KAYITLI SAHA EKİBİ ({employees.length})</span>
        <h3 style={{ marginBottom: '1rem' }}>Saha Çalışanları Listesi</h3>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>SIRA</th>
                <th>SAHA ÇALIŞANI ADI</th>
                <th style={{ textAlign: 'right' }}>İŞLEMLER</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                    Henüz kayıtlı saha çalışanı bulunmuyor.
                  </td>
                </tr>
              )}
              {employees.map((emp, idx) => {
                const isEditing = emp.id === editingEmpId;
                return (
                  <tr
                    key={emp.id}
                    style={{
                      backgroundColor: isEditing ? 'rgba(0, 210, 255, 0.12)' : undefined
                    }}
                  >
                    <td style={{ width: '80px' }}>
                      <span className="badge badge-neutral">{idx + 1}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: isEditing ? 'var(--primary-color)' : 'var(--text-main)' }}>
                      {emp.name}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', marginRight: '0.5rem' }}
                        onClick={() => handleSelectEdit(emp)}
                      >
                        <Edit size={14} />
                        Düzenle
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{
                          padding: '0.35rem 0.7rem',
                          fontSize: '0.78rem',
                          color: 'var(--danger)',
                          borderColor: 'rgba(248, 113, 113, 0.4)'
                        }}
                        onClick={() => handleDelete(emp)}
                      >
                        <Trash2 size={14} />
                        Sil
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Giriş Şifresi Değiştirme Kartı */}
      <div className="form-card">
        <span className="section-label">GÜVENLİK AYARLARI</span>
        <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Giriş Şifresini Değiştir</h2>

        <div className="banja-gradient-line">
          <div className="banja-gradient-fill" style={{ width: '100%' }} />
        </div>

        <form onSubmit={handlePasswordChange} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '240px' }}>
            <label>YENİ GİRİŞ ŞİFRESİ (TÜM CİHAZLAR İÇİN GEÇERLİ OLUR)</label>
            <input
              type="text"
              className="form-control"
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              placeholder="Yeni şifreyi yazınız (Varsayılan: banja2026)"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ height: '41px' }}>
            <KeyRound size={16} />
            Şifreyi Güncelle
          </button>
        </form>
        {passwordStatus && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.84rem', color: 'var(--accent-lime)', fontWeight: 600 }}>
            {passwordStatus}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
