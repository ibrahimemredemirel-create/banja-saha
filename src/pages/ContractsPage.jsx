import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { 
  FileCheck, 
  PlusCircle, 
  Search, 
  Calendar, 
  Building2, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Edit, 
  Trash2, 
  X, 
  Save, 
  ExternalLink,
  DollarSign,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDateDisplay } from '../utils/excelExport';

const CONTRACT_STATUSES = [
  { value: 'AKTİF', label: 'Aktif', color: 'var(--accent-lime)' },
  { value: 'YENİLEME BEKLİYOR', label: 'Yenileme Bekliyor', color: '#f59e0b' },
  { value: 'SÜRESİ DOLDU', label: 'Süresi Doldu', color: 'var(--danger)' },
  { value: 'FESHEDİLDİ', label: 'Feshedildi', color: '#94a3b8' }
];

// Gün farkını hesapla
const getRemainingDays = (endDateStr) => {
  if (!endDateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDateStr);
  end.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function ContractsPage() {
  const { facilities, contracts, addContract, updateContract, deleteContract, employees } = useData();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedFacilitySearch, setSelectedFacilitySearch] = useState('');
  const [showFacilityPicker, setShowFacilityPicker] = useState(false);

  // Form State
  const initialForm = {
    facilityId: '',
    tesisAdi: '',
    sozlesmeTarihi: new Date().toISOString().split('T')[0],
    baslangicTarihi: new Date().toISOString().split('T')[0],
    bitisTarihi: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    durum: 'AKTİF',
    sozlesmeBedeli: '',
    yetkiliKisi: '',
    telefon: '',
    temsilci: '',
    notlar: ''
  };

  const [formData, setFormData] = useState(initialForm);

  // İlgili tesisi seçince otomatik bilgileri doldur
  const handleSelectFacility = (facility) => {
    setFormData(prev => ({
      ...prev,
      facilityId: facility.id,
      tesisAdi: facility.tesis || '',
      yetkiliKisi: facility.kontakKisi || prev.yetkiliKisi || '',
      telefon: facility.telefon || prev.telefon || ''
    }));
    setSelectedFacilitySearch(facility.tesis || '');
    setShowFacilityPicker(false);
  };

  const handleEdit = (contract) => {
    setEditingId(contract.id);
    setFormData({
      facilityId: contract.facilityId || '',
      tesisAdi: contract.tesisAdi || '',
      sozlesmeTarihi: contract.sozlesmeTarihi || '',
      baslangicTarihi: contract.baslangicTarihi || '',
      bitisTarihi: contract.bitisTarihi || '',
      durum: contract.durum || 'AKTİF',
      sozlesmeBedeli: contract.sozlesmeBedeli || '',
      yetkiliKisi: contract.yetkiliKisi || '',
      telefon: contract.telefon || '',
      temsilci: contract.temsilci || '',
      notlar: contract.notlar || ''
    });
    setSelectedFacilitySearch(contract.tesisAdi || '');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`"${name || 'Bu tesis'}" sözleşmesini silmek istediğinize emin misiniz?`)) {
      deleteContract(id);
      if (editingId === id) {
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    setSelectedFacilitySearch('');
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.tesisAdi && !formData.facilityId) {
      alert('Lütfen bir tesis seçiniz veya tesis adı giriniz.');
      return;
    }

    const payload = {
      ...formData,
      tesisAdi: formData.tesisAdi.trim()
    };

    if (editingId) {
      updateContract(editingId, payload);
    } else {
      addContract(payload);
    }
    resetForm();
  };

  // İstatistikler
  const stats = useMemo(() => {
    const totalContracts = contracts.length;
    const uniqueFacilities = new Set(contracts.map(c => c.facilityId || c.tesisAdi)).size;
    
    let active = 0;
    let expiringSoon = 0; // 30 gün içinde bitecek
    let expired = 0;

    contracts.forEach(c => {
      const days = getRemainingDays(c.bitisTarihi);
      if (c.durum === 'FESHEDİLDİ' || c.durum === 'SÜRESİ DOLDU' || (days !== null && days < 0)) {
        expired++;
      } else if (days !== null && days <= 30) {
        expiringSoon++;
        active++;
      } else {
        active++;
      }
    });

    return { totalContracts, uniqueFacilities, active, expiringSoon, expired };
  }, [contracts]);

  // Filtreleme
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      if (searchTerm) {
        const query = searchTerm.toLocaleLowerCase('tr-TR');
        const name = (c.tesisAdi || '').toLocaleLowerCase('tr-TR');
        const contact = (c.yetkiliKisi || '').toLocaleLowerCase('tr-TR');
        const rep = (c.temsilci || '').toLocaleLowerCase('tr-TR');
        if (!name.includes(query) && !contact.includes(query) && !rep.includes(query)) {
          return false;
        }
      }

      if (statusFilter !== 'ALL') {
        const days = getRemainingDays(c.bitisTarihi);
        if (statusFilter === 'EXPIRING_SOON') {
          if (days === null || days < 0 || days > 30) return false;
        } else if (statusFilter === 'EXPIRED') {
          if (c.durum !== 'SÜRESİ DOLDU' && (days === null || days >= 0)) return false;
        } else if (c.durum !== statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [contracts, searchTerm, statusFilter]);

  // Tesis Arama Sonuçları
  const facilityMatches = useMemo(() => {
    if (!selectedFacilitySearch.trim()) return facilities.slice(0, 10);
    const q = selectedFacilitySearch.toLocaleLowerCase('tr-TR');
    return facilities.filter(f => (f.tesis || '').toLocaleLowerCase('tr-TR').includes(q)).slice(0, 15);
  }, [facilities, selectedFacilitySearch]);

  return (
    <div className="page-flex-container">
      {/* Üst Sabit Alan: İstatistikler ve Aksiyon Butonu */}
      <div className="sticky-filter-section">
        <div className="dashboard-card" style={{ marginBottom: 0, padding: '1.2rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="section-label">ANLAŞMALAR & SÖZLEŞME TAKİBİ</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileCheck size={20} color="var(--accent-lime)" />
                Sözleşmeli Tesisler ({stats.uniqueFacilities} Tesis / {stats.totalContracts} Sözleşme)
              </h3>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (showForm) resetForm();
                else setShowForm(true);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
            >
              {showForm ? <X size={17} /> : <PlusCircle size={17} />}
              {showForm ? 'Formu Kapat' : 'Yeni Sözleşme Ekle'}
            </button>
          </div>

          {/* Hızlı Özet Sayaçları */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: '1rem', marginBottom: 0 }}>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--accent-lime)', padding: '0.75rem 1rem', minHeight: 'auto' }}>
              <span className="stat-title">SÖZLEŞMELİ TESİS</span>
              <span className="stat-value" style={{ color: 'var(--accent-lime)', fontSize: '1.45rem' }}>
                {stats.uniqueFacilities}
              </span>
            </div>

            <div className="stat-card" style={{ borderLeft: '3px solid #00d2ff', padding: '0.75rem 1rem', minHeight: 'auto' }}>
              <span className="stat-title">AKTİF SÖZLEŞMELER</span>
              <span className="stat-value" style={{ color: '#00d2ff', fontSize: '1.45rem' }}>
                {stats.active}
              </span>
            </div>

            <div className="stat-card" style={{ borderLeft: '3px solid #f59e0b', padding: '0.75rem 1rem', minHeight: 'auto' }}>
              <span className="stat-title">BİTİŞİ YAKLAŞAN (30 GÜN)</span>
              <span className="stat-value" style={{ color: '#f59e0b', fontSize: '1.45rem' }}>
                {stats.expiringSoon}
              </span>
            </div>

            <div className="stat-card" style={{ borderLeft: '3px solid var(--danger)', padding: '0.75rem 1rem', minHeight: 'auto' }}>
              <span className="stat-title">SÜRESİ DOLAN / FESİH</span>
              <span className="stat-value" style={{ color: 'var(--danger)', fontSize: '1.45rem' }}>
                {stats.expired}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="page-scroll-body">
        {/* YENİ / DÜZENLEME FORMU */}
        {showForm && (
          <div className="dashboard-card" style={{ border: '1px solid var(--primary-color)', animation: 'fadeIn 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FileCheck size={18} color="var(--primary-color)" />
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                  {editingId ? 'Sözleşmeyi Düzenle' : 'Yeni Tesis Sözleşmesi Girişi'}
                </h4>
              </div>
              <button
                type="button"
                onClick={resetForm}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {/* 1. Tesis Seçimi */}
                <div className="form-group" style={{ position: 'relative' }}>
                  <label>TESİS ADI *</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tesis ara veya seç..."
                      value={selectedFacilitySearch}
                      onChange={(e) => {
                        setSelectedFacilitySearch(e.target.value);
                        setFormData(prev => ({ ...prev, tesisAdi: e.target.value }));
                        setShowFacilityPicker(true);
                      }}
                      onFocus={() => setShowFacilityPicker(true)}
                      required
                    />
                  </div>

                  {/* Tesis Dropdown Önerileri */}
                  {showFacilityPicker && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      zIndex: 100,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                      marginTop: '4px'
                    }}>
                      <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                        Kayıtlı Tesisler ({facilityMatches.length} sonuç):
                      </div>
                      {facilityMatches.map(f => (
                        <div
                          key={f.id}
                          onClick={() => handleSelectFacility(f)}
                          style={{
                            padding: '0.6rem 0.75rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border-subtle)',
                            fontSize: '0.85rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--card-sub-bg)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{f.tesis}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                              ({f.il || '-'} / {f.ilce || '-'})
                            </span>
                          </div>
                          {f.kategori && (
                            <span className="badge" style={{ fontSize: '0.7rem' }}>{f.kategori}</span>
                          )}
                        </div>
                      ))}
                      {facilityMatches.length === 0 && (
                        <div style={{ padding: '0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          Eşleşen tesis bulunamadı. Yazdığınız isimle kaydedilecektir.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Sözleşme (İmza) Tarihi */}
                <div className="form-group">
                  <label>SÖZLEŞME İMZA TARİHİ *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.sozlesmeTarihi}
                    onChange={(e) => setFormData({ ...formData, sozlesmeTarihi: e.target.value })}
                    required
                  />
                </div>

                {/* 3. Başlangıç Tarihi */}
                <div className="form-group">
                  <label>BAŞLANGIÇ TARİHİ *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.baslangicTarihi}
                    onChange={(e) => setFormData({ ...formData, baslangicTarihi: e.target.value })}
                    required
                  />
                </div>

                {/* 4. Bitiş Tarihi */}
                <div className="form-group">
                  <label>BİTİŞ TARİHİ *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.bitisTarihi}
                    onChange={(e) => setFormData({ ...formData, bitisTarihi: e.target.value })}
                    required
                  />
                </div>

                {/* 5. Durum */}
                <div className="form-group">
                  <label>SÖZLEŞME DURUMU</label>
                  <select
                    className="form-control"
                    value={formData.durum}
                    onChange={(e) => setFormData({ ...formData, durum: e.target.value })}
                  >
                    {CONTRACT_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* 6. Sözleşme Bedeli / Şartı */}
                <div className="form-group">
                  <label>SÖZLEŞME BEDELİ / MODELİ</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Örn: 20.000 TL/Ay veya Komisyon %15"
                    value={formData.sozlesmeBedeli}
                    onChange={(e) => setFormData({ ...formData, sozlesmeBedeli: e.target.value })}
                  />
                </div>

                {/* 7. Yetkili Kişi */}
                <div className="form-group">
                  <label>TESİS YETKİLİSİ</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Yetkili ad soyad"
                    value={formData.yetkiliKisi}
                    onChange={(e) => setFormData({ ...formData, yetkiliKisi: e.target.value })}
                  />
                </div>

                {/* 8. Yetkili Telefon */}
                <div className="form-group">
                  <label>YETKİLİ TELEFON</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="05xx xxx xx xx"
                    value={formData.telefon}
                    onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                  />
                </div>

                {/* 9. Satış Temsilcisi */}
                <div className="form-group">
                  <label>SÖZLEŞMEYİ İMZALAYAN TEMSİLCİ</label>
                  <select
                    className="form-control"
                    value={formData.temsilci}
                    onChange={(e) => setFormData({ ...formData, temsilci: e.target.value })}
                  >
                    <option value="">Seçiniz...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.name}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 10. Notlar */}
              <div className="form-group" style={{ marginTop: '0.75rem' }}>
                <label>AÇIKLAMA & ÖZEL NOTLAR</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Sözleşme şartları, özel maddeler veya teslimat notları..."
                  value={formData.notlar}
                  onChange={(e) => setFormData({ ...formData, notlar: e.target.value })}
                />
              </div>

              {/* Butonlar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={resetForm}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  <Save size={16} />
                  {editingId ? 'Sözleşmeyi Güncelle' : 'Sözleşmeyi Kaydet'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LİSTELEME & FİLTRELER */}
        <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: '220px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tesis, yetkili veya temsilci ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '32px' }}
                />
              </div>
            </div>

            {/* Durum Filtre Butonları */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[
                { key: 'ALL', label: 'TÜMÜ' },
                { key: 'AKTİF', label: 'AKTİF' },
                { key: 'EXPIRING_SOON', label: 'BİTİŞİ YAKLAŞAN' },
                { key: 'EXPIRED', label: 'SÜRESİ DOLAN' },
                { key: 'FESHEDİLDİ', label: 'FESHEDİLEN' }
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.76rem',
                    fontWeight: statusFilter === f.key ? 700 : 600,
                    cursor: 'pointer',
                    border: statusFilter === f.key ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                    backgroundColor: statusFilter === f.key ? 'rgba(0, 210, 255, 0.16)' : 'var(--card-sub-bg)',
                    color: statusFilter === f.key ? 'var(--primary-color)' : 'var(--text-muted)',
                    transition: 'all 0.2s'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* SÖZLEŞMELER TABLOSU */}
          {filteredContracts.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileCheck size={42} style={{ opacity: 0.35, marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.95rem' }}>
                {contracts.length === 0 ? 'Henüz kayıtlı bir sözleşme bulunmuyor.' : 'Arama kriterlerine uygun sözleşme bulunamadı.'}
              </p>
              {contracts.length === 0 && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowForm(true)}
                  style={{ marginTop: '1rem' }}
                >
                  <PlusCircle size={16} /> İlk Sözleşmeyi Ekle
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>TESİS ADI</th>
                    <th>İMZA TARİHİ</th>
                    <th>BAŞLANGIÇ</th>
                    <th>BİTİŞ</th>
                    <th>DURUM & KALAN SÜRE</th>
                    <th>BEDEL / MODEL</th>
                    <th>YETKİLİ & İLETİŞİM</th>
                    <th>TEMSİLCİ</th>
                    <th style={{ textAlign: 'center' }}>İŞLEMLER</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map(contract => {
                    const matchedFacility = facilities.find(f => f.id === contract.facilityId);
                    const remainingDays = getRemainingDays(contract.bitisTarihi);

                    let statusBadgeColor = 'var(--accent-lime)';
                    let statusLabel = contract.durum || 'AKTİF';

                    if (contract.durum === 'FESHEDİLDİ') {
                      statusBadgeColor = '#94a3b8';
                    } else if (remainingDays !== null && remainingDays < 0) {
                      statusBadgeColor = 'var(--danger)';
                      statusLabel = 'Süresi Doldu';
                    } else if (remainingDays !== null && remainingDays <= 30) {
                      statusBadgeColor = '#f59e0b';
                      statusLabel = `${remainingDays} Gün Kaldı`;
                    } else if (remainingDays !== null) {
                      statusLabel = `${remainingDays} Gün Kaldı`;
                    }

                    return (
                      <tr key={contract.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                            {contract.tesisAdi}
                          </div>
                          {matchedFacility && (
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {matchedFacility.il} / {matchedFacility.ilce}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.83rem', whiteSpace: 'nowrap' }}>
                          {formatDateDisplay(contract.sozlesmeTarihi)}
                        </td>
                        <td style={{ fontSize: '0.83rem', whiteSpace: 'nowrap' }}>
                          {formatDateDisplay(contract.baslangicTarihi)}
                        </td>
                        <td style={{ fontSize: '0.83rem', whiteSpace: 'nowrap' }}>
                          {formatDateDisplay(contract.bitisTarihi)}
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: `${statusBadgeColor}22`,
                              color: statusBadgeColor,
                              border: `1px solid ${statusBadgeColor}66`,
                              fontWeight: 700,
                              fontSize: '0.76rem'
                            }}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.83rem', fontWeight: 600 }}>
                          {contract.sozlesmeBedeli || '-'}
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>
                          <div>{contract.yetkiliKisi || '-'}</div>
                          {contract.telefon && (
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{contract.telefon}</div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary-color)' }}>
                          {contract.temsilci || '-'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => handleEdit(contract)}
                              style={{
                                background: 'rgba(0, 210, 255, 0.1)',
                                border: '1px solid rgba(0, 210, 255, 0.3)',
                                color: 'var(--primary-color)',
                                borderRadius: '4px',
                                padding: '4px 6px',
                                cursor: 'pointer'
                              }}
                              title="Düzenle"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(contract.id, contract.tesisAdi)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: 'var(--danger)',
                                borderRadius: '4px',
                                padding: '4px 6px',
                                cursor: 'pointer'
                              }}
                              title="Sil"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
