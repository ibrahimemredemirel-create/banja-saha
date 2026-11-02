import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { sortVisitsLatestFirst, formatDateDisplay } from '../utils/excelExport';
import { Search, X, Edit, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const getResultBadgeClass = (sonuc) => {
  if (sonuc === 'TEKLİF VERİLDİ') return 'badge-success';
  if (sonuc === 'OLUMSUZ') return 'badge-danger';
  return 'badge-warning';
};

const FacilityReportPage = () => {
  const { facilities, visits, deleteVisit } = useData();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const dropdownRef = useRef(null);

  // Ziyaret düzenlemeden geri dönüldüğünde seçili tesisi koru
  useEffect(() => {
    const returnFacilityId = location.state?.selectedFacilityId;
    if (returnFacilityId) {
      const fac = facilities.find(f => f.id === returnFacilityId);
      if (fac) {
        setSelectedFacilityId(fac.id);
        setSearchQuery(fac.tesis || '');
      }
    }
  }, [location.state, facilities]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matchingFacilities = facilities.filter(f => {
    const q = searchQuery.trim().toLocaleLowerCase('tr-TR');
    if (!q) return true;
    const name = (f.tesis || '').toLocaleLowerCase('tr-TR');
    const city = (f.il || '').toLocaleLowerCase('tr-TR');
    const dist = (f.ilce || '').toLocaleLowerCase('tr-TR');
    const sir = String(f.sir || '');
    return name.includes(q) || city.includes(q) || dist.includes(q) || sir === q;
  });

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setShowDropdown(true);

    if (!val.trim()) {
      setSelectedFacilityId('');
      setSelectedVisitId(null);
    } else {
      const currentSelected = facilities.find(f => f.id === selectedFacilityId);
      if (currentSelected && currentSelected.tesis !== val) {
        setSelectedFacilityId('');
        setSelectedVisitId(null);
      }
    }
  };

  const handleSelectFacility = (f) => {
    setSelectedFacilityId(f.id);
    setSearchQuery(f.tesis || '');
    setSelectedVisitId(null);
    setShowDropdown(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedFacilityId('');
    setSelectedVisitId(null);
    setShowDropdown(false);
  };

  const selectedFacility = facilities.find(f => f.id === selectedFacilityId);

  // Seçili tesise ait ziyaretler
  const facilityVisits = selectedFacility
    ? sortVisitsLatestFirst(visits.filter(v => v.facilityId === selectedFacilityId))
    : [];

  const ziyaretSayisi = facilityVisits.length;
  const sonZiyaretSonucu = facilityVisits.length > 0 ? facilityVisits[0].ziyaretSonucu : 'ZİYARET YOK';

  const handleEditVisit = (visitObj) => {
    const targetVisit = visitObj || facilityVisits.find(v => v.id === selectedVisitId);
    if (!targetVisit) {
      alert('Lütfen önce tablodan düzenlemek istediğiniz ziyareti seçiniz.');
      return;
    }
    navigate('/visit-entry', {
      state: {
        visit: targetVisit,
        facility: selectedFacility
      }
    });
  };

  const handleDeleteVisit = (visitObj) => {
    const targetVisit = visitObj || facilityVisits.find(v => v.id === selectedVisitId);
    if (!targetVisit) {
      alert('Lütfen önce tablodan silmek istediğiniz ziyareti seçiniz.');
      return;
    }
    if (window.confirm('Seçili ziyaret kaydını silmek istediğinize emin misiniz?')) {
      deleteVisit(targetVisit.id);
      if (selectedVisitId === targetVisit.id) {
        setSelectedVisitId(null);
      }
    }
  };

  return (
    <div className="page-flex-container">
      {/* Üstte Arama Çubuğu Şeklinde "TESİS SEÇİNİZ" (Sabit kalır) */}
      <div className="sticky-filter-section">
        <div className="dashboard-card" style={{ marginBottom: 0 }}>
          <span className="section-label">TESİS BAZLI DETAYLI RAPOR</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '0.25rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem', flex: '1 1 280px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.55rem' }}>
              <span>{selectedFacility ? `${selectedFacility.tesis} - Tesis Raporu` : 'Tesis Seçiniz'}</span>
              {selectedFacility && selectedFacility.kapsamDurumu && (
                <span
                  className={`badge ${selectedFacility.kapsamDurumu === 'KAPSAM DAHİLİNDE' ? 'badge-success' : 'badge-danger'}`}
                  style={{ fontSize: '0.74rem' }}
                >
                  {selectedFacility.kapsamDurumu}
                </span>
              )}
            </h2>

            <div ref={dropdownRef} style={{ minWidth: '320px', flex: '0 1 440px', position: 'relative' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary-color)', display: 'block', marginBottom: '0.35rem' }}>
                TESİS ARA / SEÇİNİZ
              </label>
              <div style={{ position: 'relative' }}>
                <Search
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  type="text"
                  className="form-control"
                  value={searchQuery}
                  onFocus={() => setShowDropdown(true)}
                  onChange={handleSearchChange}
                  placeholder="Tesis adı veya il yazarak arayın..."
                  style={{ width: '100%', paddingLeft: '2.35rem', paddingRight: '2.2rem' }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    style={{
                      position: 'absolute',
                      right: '0.65rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Aramayı Temizle"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Arama Sonuçları Açılır Listesi */}
              {showDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '0.35rem',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  backgroundColor: '#0c1821',
                  border: '1px solid var(--primary-color)',
                  borderRadius: '10px',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65)',
                  zIndex: 100
                }}>
                  {matchingFacilities.length === 0 ? (
                    <div style={{ padding: '0.85rem 1rem', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      Eşleşen tesis bulunamadı.
                    </div>
                  ) : (
                    matchingFacilities.map(f => {
                      const isActive = f.id === selectedFacilityId;
                      return (
                        <div
                          key={f.id}
                          onClick={() => handleSelectFacility(f)}
                          style={{
                            padding: '0.65rem 1rem',
                            fontSize: '0.84rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border-subtle)',
                            backgroundColor: isActive ? 'rgba(0, 210, 255, 0.15)' : 'transparent',
                            color: isActive ? 'var(--primary-color)' : 'var(--text-main)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <span style={{ fontWeight: isActive ? 700 : 500 }}>
                            {f.tesis}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                            {f.il} {f.ilce ? `/ ${f.ilce}` : ''}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="banja-gradient-line" style={{ marginBottom: 0 }}>
            <div className="banja-gradient-fill" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Scrollable Body: 8 Kart + Ziyaret Tablosu */}
      <div className="page-scroll-body">
        {/* Altta Kartlar (Yukarıda 4, Altta 4 Kart - Tesis seçili değilse tamamen boş) */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card" style={{ borderLeft: '3px solid var(--primary-color)', minHeight: '96px' }}>
            <span className="stat-title">İL</span>
            <span className="stat-value" style={{ fontSize: '1.35rem' }}>
              {selectedFacility ? (selectedFacility.il || '') : ''}
            </span>
          </div>

          <div className="stat-card" style={{ borderLeft: '3px solid #38bdf8', minHeight: '96px' }}>
            <span className="stat-title">İLÇE / BÖLGE</span>
            <span className="stat-value" style={{ fontSize: '1.35rem' }}>
              {selectedFacility ? (selectedFacility.ilce || '') : ''}
            </span>
          </div>

          <div className="stat-card" style={{ borderLeft: '3px solid var(--primary-color)', minHeight: '96px' }}>
            <span className="stat-title">AÇIK KORT</span>
            <span className="stat-value">
              {selectedFacility ? (selectedFacility.acikKort ?? '') : ''}
            </span>
          </div>

          <div className="stat-card" style={{ borderLeft: '3px solid #38bdf8', minHeight: '96px' }}>
            <span className="stat-title">KAPALI KORT</span>
            <span className="stat-value">
              {selectedFacility ? (selectedFacility.kapaliKort ?? '') : ''}
            </span>
          </div>

          <div className="stat-card" style={{ borderLeft: '3px solid var(--accent-lime)', minHeight: '96px' }}>
            <span className="stat-title">DOUBLE</span>
            <span className="stat-value" style={{ color: 'var(--accent-lime)' }}>
              {selectedFacility ? (selectedFacility.doubleKort ?? '') : ''}
            </span>
          </div>

          <div className="stat-card" style={{ borderLeft: '3px solid #a78bfa', minHeight: '96px' }}>
            <span className="stat-title">SİNGLE</span>
            <span className="stat-value" style={{ color: '#a78bfa' }}>
              {selectedFacility ? (selectedFacility.singleKort ?? '') : ''}
            </span>
          </div>

          <div className="stat-card" style={{ borderLeft: '3px solid var(--primary-color)', minHeight: '96px' }}>
            <span className="stat-title">ZİYARET SAYISI</span>
            <span className="stat-value" style={{ color: 'var(--primary-color)' }}>
              {selectedFacility ? ziyaretSayisi : ''}
            </span>
          </div>

          <div className="stat-card" style={{ borderLeft: '3px solid var(--accent-lime)', minHeight: '96px' }}>
            <span className="stat-title">ZİYARET SONUCU (SON ZİYARET)</span>
            <span className="stat-value" style={{ fontSize: '1.1rem', color: 'var(--accent-lime)', marginTop: '0.25rem' }}>
              {selectedFacility ? sonZiyaretSonucu : ''}
            </span>
          </div>
        </div>

        {/* Kartların Altında Tablo Listeleme */}
        <div className="dashboard-card">
          <div className="header-flex" style={{ marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <span className="section-label">TESİS ZİYARET GEÇMİŞİ TABLOSU</span>
              <h3 style={{ margin: 0 }}>
                {selectedFacility ? `${selectedFacility.tesis} — Yapılan Ziyaretler (${facilityVisits.length})` : 'Ziyaret Geçmişi'}
              </h3>
            </div>

            {selectedFacility && facilityVisits.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleEditVisit(null)}
                  style={{ opacity: selectedVisitId ? 1 : 0.7 }}
                >
                  <Edit size={15} />
                  DÜZENLE
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => handleDeleteVisit(null)}
                  style={{
                    color: 'var(--danger)',
                    borderColor: 'rgba(248, 113, 113, 0.45)',
                    opacity: selectedVisitId ? 1 : 0.7
                  }}
                >
                  <Trash2 size={15} />
                  SİL
                </button>
              </div>
            )}
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>SEÇ</th>
                  <th>ZİYARET TARİHİ</th>
                  <th>ZİYARET EDEN</th>
                  <th>ZİYARET SEBEBİ</th>
                  <th>GÖRÜŞME ŞEKLİ</th>
                  <th>KONTAK KİŞİ</th>
                  <th>KONTAK UNVAN</th>
                  <th>ZİYARET SONUCU</th>
                  <th>AÇIKLAMA</th>
                  <th>TELEFON</th>
                  <th>E POSTA</th>
                  <th>İŞLEMLER</th>
                </tr>
              </thead>
              <tbody>
                {!selectedFacility && (
                  <tr>
                    <td colSpan="12" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      Lütfen yukarıdaki arama çubuğundan bir tesis seçiniz.
                    </td>
                  </tr>
                )}
                {selectedFacility && facilityVisits.length === 0 && (
                  <tr>
                    <td colSpan="12" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      Seçili tesise ait henüz ziyaret kaydı bulunmuyor.
                    </td>
                  </tr>
                )}
                {facilityVisits.map(v => {
                  const isVisitSelected = v.id === selectedVisitId;
                  return (
                    <tr
                      key={v.id}
                      onClick={() => setSelectedVisitId(isVisitSelected ? null : v.id)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isVisitSelected ? 'rgba(0, 210, 255, 0.14)' : undefined,
                        borderLeft: isVisitSelected ? '3px solid var(--primary-color)' : undefined
                      }}
                    >
                      <td>
                        <input
                          type="radio"
                          checked={isVisitSelected}
                          onChange={() => setSelectedVisitId(v.id)}
                          style={{ accentColor: 'var(--primary-color)', cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatDateDisplay(v.ziyaretTarihi)}</td>
                      <td>
                        <span className="badge badge-neutral">{v.ziyaretEden || '-'}</span>
                      </td>
                      <td>{v.ziyaretSebebi || '-'}</td>
                      <td>{v.gorusmeSekli || '-'}</td>
                      <td>{v.kontakKisi || '-'}</td>
                      <td>{v.kontakUnvan || '-'}</td>
                      <td>
                        {v.ziyaretSonucu ? (
                          <span className={`badge ${getResultBadgeClass(v.ziyaretSonucu)}`}>
                            {v.ziyaretSonucu}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={{ whiteSpace: 'normal', minWidth: '240px' }}>{v.aciklama || '-'}</td>
                      <td>{v.telefon || '-'}</td>
                      <td>{v.eposta || '-'}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', marginRight: '0.4rem' }}
                          onClick={() => handleEditVisit(v)}
                        >
                          <Edit size={13} /> Düzenle
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'rgba(248, 113, 113, 0.4)' }}
                          onClick={() => handleDeleteVisit(v)}
                        >
                          <Trash2 size={13} /> Sil
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityReportPage;
