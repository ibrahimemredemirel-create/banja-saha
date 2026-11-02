import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Edit, Trash2, RotateCcw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getEffectiveToplamKort, formatDateDisplay, normalizeKategori } from '../utils/excelExport';

const FacilityListPage = () => {
  const { facilities, deleteFacility } = useData();
  const navigate = useNavigate();

  const [selectedId, setSelectedId] = useState(null);
  const [filterTesis, setFilterTesis] = useState('');
  const [filterIl, setFilterIl] = useState('');
  const [filterKortTuru, setFilterKortTuru] = useState('');

  // Kayıtlı tesislerdeki benzersiz iller
  const registeredIller = Array.from(
    new Set(facilities.map(f => (f.il || '').trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, 'tr'));

  const isTesisActive = filterTesis.trim() !== '';

  // Filtreleme
  const filteredFacilities = facilities.filter(f => {
    if (isTesisActive) {
      const query = filterTesis.trim().toLocaleLowerCase('tr-TR');
      const name = (f.tesis || '').toLocaleLowerCase('tr-TR');
      if (!name.includes(query)) return false;
    }
    if (filterIl && f.il !== filterIl) return false;
    if (filterKortTuru === 'AÇIK KORT' && (parseInt(f.acikKort || 0) || 0) <= 0) return false;
    if (filterKortTuru === 'KAPALI KORT' && (parseInt(f.kapaliKort || 0) || 0) <= 0) return false;
    return true;
  });

  const selectedFacility = facilities.find(f => f.id === selectedId);

  const handleTopEdit = () => {
    if (!selectedFacility) {
      alert('Lütfen önce tablodan düzenlemek istediğiniz tesisi seçiniz.');
      return;
    }
    navigate('/new-facility', { state: { facility: selectedFacility } });
  };

  const handleTopDelete = () => {
    if (!selectedFacility) {
      alert('Lütfen önce tablodan silmek istediğiniz tesisi seçiniz.');
      return;
    }
    if (window.confirm(`"${selectedFacility.tesis}" kaydını ve ilişkili ziyaretlerini silmek istediğinize emin misiniz?`)) {
      deleteFacility(selectedFacility.id);
      setSelectedId(null);
    }
  };

  const resetFilters = () => {
    setFilterTesis('');
    setFilterIl('');
    setFilterKortTuru('');
  };

  return (
    <div className="page-flex-container">
      {/* Üst Filtreler ve Düzenle / Sil Aksiyon Barı (Sabit kalır) */}
      <div className="sticky-filter-section">
        <div className="dashboard-card" style={{ marginBottom: 0 }}>
          <div className="header-flex" style={{ marginBottom: '0.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="section-label">KAYIT YÖNETİMİ & FİLTRELEME</span>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
                Kayıt Listesi ({filteredFacilities.length} / {facilities.length} Tesis)
              </h2>
            </div>

            {/* Üstte Düzenle ve Sil Seçenekleri */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {selectedFacility && (
                <span className="badge badge-success" style={{ marginRight: '0.25rem' }}>
                  Seçili: {selectedFacility.tesis}
                </span>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleTopEdit}
                style={{ opacity: selectedFacility ? 1 : 0.65 }}
              >
                <Edit size={16} />
                DÜZENLE
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleTopDelete}
                style={{
                  color: 'var(--danger)',
                  borderColor: 'rgba(248, 113, 113, 0.45)',
                  opacity: selectedFacility ? 1 : 0.65
                }}
              >
                <Trash2 size={16} />
                SİL
              </button>
            </div>
          </div>

          <div className="banja-gradient-line">
            <div className="banja-gradient-fill" style={{ width: '100%' }} />
          </div>

          {/* 1. Tesis Arama Çubuğu + 2. İl Açılır Menü + 3. Kort Türü Açılır Menü + Temizle Butonu */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.85rem', alignItems: 'end' }}>
            <div className="form-group">
              <label>TESİS FİLTRESİ (ARAMA)</label>
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
                  value={filterTesis}
                  onChange={(e) => setFilterTesis(e.target.value)}
                  placeholder="Tesis adı yazarak ara..."
                  disabled={Boolean(filterIl || filterKortTuru)}
                  style={{ width: '100%', paddingLeft: '2.35rem' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>İL FİLTRESİ</label>
              <select
                className="form-control"
                value={filterIl}
                onChange={(e) => setFilterIl(e.target.value)}
                disabled={Boolean(isTesisActive || filterKortTuru)}
              >
                <option value="">Tüm İller</option>
                {registeredIller.map(il => (
                  <option key={il} value={il}>{il}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>KORT TÜRÜ FİLTRESİ</label>
              <select
                className="form-control"
                value={filterKortTuru}
                onChange={(e) => setFilterKortTuru(e.target.value)}
                disabled={Boolean(isTesisActive || filterIl)}
              >
                <option value="">Tümü (Açık & Kapalı)</option>
                <option value="AÇIK KORT">AÇIK KORT</option>
                <option value="KAPALI KORT">KAPALI KORT</option>
              </select>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={resetFilters}
              style={{
                height: '40px',
                padding: '0 0.85rem',
                fontSize: '0.78rem',
                whiteSpace: 'nowrap'
              }}
              title="Filtreleri Temizle"
            >
              <RotateCcw size={14} />
              Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Tablo Bölümü */}
      <div className="page-scroll-body">
        <div className="dashboard-card">
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            İpucu: Düzenlemek veya silmek istediğiniz tesisin satırına tıklayarak seçin, ardından üstteki <strong>DÜZENLE</strong> veya <strong>SİL</strong> butonuna basın.
          </p>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>SEÇ</th>
                  <th>SIRA</th>
                  <th>KAYIT TARİHİ</th>
                  <th>TESİS</th>
                  <th>KATEGORİ</th>
                  <th>KAPSAM</th>
                  <th>İL</th>
                  <th>İLÇE/BÖLGE</th>
                  <th>TESİS TÜRÜ</th>
                  <th>VALIDATION</th>
                  <th>AÇIK KORT</th>
                  <th>KAPALI KORT</th>
                  <th>DOUBLE</th>
                  <th>SINGLE</th>
                  <th>TOPLAM KORT</th>
                  <th>SAATLER</th>
                  <th>ÜCRET</th>
                  <th>KONTAK KİŞİ</th>
                  <th>UNVAN</th>
                  <th>TELEFON</th>
                  <th>E POSTA</th>
                </tr>
              </thead>
              <tbody>
                {filteredFacilities.length === 0 && (
                  <tr>
                    <td colSpan="21" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      Kriterlere uygun tesis kaydı bulunamadı.
                    </td>
                  </tr>
                )}
                {filteredFacilities.map(facility => {
                  const isSelected = facility.id === selectedId;
                  const toplam = getEffectiveToplamKort(facility);
                  return (
                    <tr
                      key={facility.id}
                      onClick={() => setSelectedId(isSelected ? null : facility.id)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'rgba(0, 210, 255, 0.14)' : undefined,
                        borderLeft: isSelected ? '3px solid var(--primary-color)' : undefined
                      }}
                    >
                      <td>
                        <input
                          type="radio"
                          checked={isSelected}
                          onChange={() => setSelectedId(facility.id)}
                          style={{ accentColor: 'var(--primary-color)', cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td><span className="badge badge-success">{facility.sir}</span></td>
                      <td>{formatDateDisplay(facility.kayitTarihi)}</td>
                      <td style={{ fontWeight: 700, color: isSelected ? 'var(--primary-color)' : 'var(--text-main)' }}>
                        {facility.tesis}
                      </td>
                      <td><span className="badge badge-neutral">{normalizeKategori(facility.kategori) || '-'}</span></td>
                      <td>
                        {facility.kapsamDurumu ? (
                          <span
                            className={`badge ${facility.kapsamDurumu === 'KAPSAM DAHİLİNDE' ? 'badge-success' : 'badge-danger'}`}
                            style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                          >
                            {facility.kapsamDurumu}
                          </span>
                        ) : '-'}
                      </td>
                      <td>{facility.il}</td>
                      <td>{facility.ilce}</td>
                      <td>{facility.tesisTuru}</td>
                      <td>{facility.kortValidation}</td>
                      <td>{facility.acikKort || 0}</td>
                      <td>{facility.kapaliKort || 0}</td>
                      <td>{facility.doubleKort || 0}</td>
                      <td>{facility.singleKort || 0}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-lime)' }}>{toplam}</td>
                      <td>{facility.acilisSaati && facility.kapanisSaati ? `${facility.acilisSaati} - ${facility.kapanisSaati}` : '-'}</td>
                      <td>{facility.kortSaatUcreti ? `${facility.kortSaatUcreti} ${facility.paraBirimi || ''}` : '-'}</td>
                      <td>{facility.kontakKisi || '-'}</td>
                      <td>{facility.kontakUnvan || '-'}</td>
                      <td>{facility.telefon || '-'}</td>
                      <td>{facility.eposta || '-'}</td>
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

export default FacilityListPage;
