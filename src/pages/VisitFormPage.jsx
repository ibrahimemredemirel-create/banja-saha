import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Save, Smartphone, Trash2, Calendar, User, FileSpreadsheet, Upload, Search, X, Edit, Check, ChevronDown } from 'lucide-react';
import { downloadEmptyVisitTemplate, parseExcelVisits, sortVisitsLatestFirst, formatDateDisplay, normalizeDateToISO } from '../utils/excelExport';
import { useLocation, useNavigate } from 'react-router-dom';

const parseSelectedEmployeeList = (val) => {
  if (!val) return [];
  return String(val)
    .split(/\s*(?:&|,|\+)\s*/)
    .map(s => s.trim())
    .filter(Boolean);
};

const KONTAK_UNVANLAR = ['İŞLETME SAHİBİ', 'İŞLETMECİ', 'ANTRENÖR', 'ÇALIŞAN'];
const ZIYARET_SEBEPLERI = ['GÖRÜŞME', 'KEŞİF', 'KURULUM'];
const GORUSME_SEKILLERI = ['TELEFON', 'ONLİNE', 'YÜZ YÜZE', 'E POSTA', 'WHATSAPP'];
const ZIYARET_SONUCLARI = [
  'GÖRÜŞME DEVAM EDİYOR',
  'TEKLİF VERİLDİ',
  'TEKLİF VERİLECEK',
  'TEKLİF VERİLMEDİ',
  'SÖZLEŞME İMZALANDI',
  'OLUMSUZ'
];

const formatPhoneInput = (val) => {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  if (digits.length <= 9) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
};

const VisitFormPage = () => {
  const { facilities, visits, addVisit, updateVisit, bulkAddVisits, deleteVisit, employees } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const empDropdownRef = useRef(null);

  const [editingVisitId, setEditingVisitId] = useState(null);
  const [facilitySearch, setFacilitySearch] = useState('');
  const [showFacilityDropdown, setShowFacilityDropdown] = useState(false);
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);

  const [formData, setFormData] = useState({
    ziyaretTarihi: new Date().toISOString().split('T')[0],
    ziyaretEden: '',
    facilityId: '',
    ziyaretSebebi: '',
    gorusmeSekli: '',
    kontakKisi: '',
    kontakUnvan: '',
    telefon: '',
    eposta: '',
    ziyaretSonucu: '',
    aciklama: ''
  });

  // Tesis Bazlı Rapordan "Düzenle" ile gelindiyse formu doldur
  useEffect(() => {
    const incomingVisit = location.state?.visit;
    if (incomingVisit) {
      const matchedFac =
        location.state?.facility ||
        facilities.find(f => f.id === incomingVisit.facilityId);
      setEditingVisitId(incomingVisit.id);
      setFacilitySearch(matchedFac?.tesis || incomingVisit.tesisAdi || '');
      setFormData({
        ziyaretTarihi: normalizeDateToISO(incomingVisit.ziyaretTarihi),
        ziyaretEden: incomingVisit.ziyaretEden || '',
        facilityId: incomingVisit.facilityId || '',
        ziyaretSebebi: incomingVisit.ziyaretSebebi || '',
        gorusmeSekli: incomingVisit.gorusmeSekli || '',
        kontakKisi: incomingVisit.kontakKisi || '',
        kontakUnvan: incomingVisit.kontakUnvan || '',
        telefon: incomingVisit.telefon || '',
        eposta: incomingVisit.eposta || '',
        ziyaretSonucu: incomingVisit.ziyaretSonucu || '',
        aciklama: incomingVisit.aciklama || ''
      });
    }
  }, [location.state, facilities]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowFacilityDropdown(false);
      }
      if (empDropdownRef.current && !empDropdownRef.current.contains(e.target)) {
        setShowEmpDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const individualEmployees = React.useMemo(() => {
    const seen = new Set();
    const list = [];
    employees.forEach(emp => {
      parseSelectedEmployeeList(emp.name).forEach(part => {
        const key = part.toLocaleUpperCase('tr-TR');
        if (!seen.has(key)) {
          seen.add(key);
          list.push(key);
        }
      });
    });
    return list;
  }, [employees]);

  const selectedEmpList = parseSelectedEmployeeList(formData.ziyaretEden);

  const handleToggleEmployee = (empName) => {
    const current = parseSelectedEmployeeList(formData.ziyaretEden);
    const exists = current.some(n => n.toLocaleUpperCase('tr-TR') === empName.toLocaleUpperCase('tr-TR'));
    const next = exists
      ? current.filter(n => n.toLocaleUpperCase('tr-TR') !== empName.toLocaleUpperCase('tr-TR'))
      : [...current, empName];
    setFormData(prev => ({
      ...prev,
      ziyaretEden: next.join(' & ')
    }));
  };

  const matchingFacilities = facilities.filter(f => {
    const q = facilitySearch.trim().toLocaleLowerCase('tr-TR');
    if (!q) return true;
    const name = (f.tesis || '').toLocaleLowerCase('tr-TR');
    const city = (f.il || '').toLocaleLowerCase('tr-TR');
    return name.includes(q) || city.includes(q);
  });

  const handleFacilitySearchChange = (e) => {
    const val = e.target.value;
    setFacilitySearch(val);
    setShowFacilityDropdown(true);

    if (!val.trim()) {
      setFormData(prev => ({ ...prev, facilityId: '' }));
    } else {
      const currentSelected = facilities.find(f => f.id === formData.facilityId);
      if (currentSelected && currentSelected.tesis !== val) {
        setFormData(prev => ({ ...prev, facilityId: '' }));
      }
    }
  };

  const handleSelectFacility = (selectedFac) => {
    setFacilitySearch(selectedFac.tesis || '');
    setShowFacilityDropdown(false);
    setFormData(prev => ({
      ...prev,
      facilityId: selectedFac.id,
      kontakKisi: editingVisitId ? prev.kontakKisi : (selectedFac?.kontakKisi || prev.kontakKisi),
      kontakUnvan: editingVisitId ? prev.kontakUnvan : (selectedFac?.kontakUnvan || prev.kontakUnvan),
      telefon: editingVisitId ? prev.telefon : (selectedFac?.telefon || prev.telefon),
      eposta: editingVisitId ? prev.eposta : (selectedFac?.eposta || prev.eposta)
    }));
  };

  const handleClearFacilitySearch = () => {
    setFacilitySearch('');
    setFormData(prev => ({ ...prev, facilityId: '' }));
    setShowFacilityDropdown(false);
  };

  const handleExcelVisitUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { matchedVisits, unmatchedFacilities } = await parseExcelVisits(file, facilities);
      if (matchedVisits.length === 0) {
        if (unmatchedFacilities.length > 0) {
          alert(`Yüklenen ziyaretlerdeki tesisler sistemde kayıtlı tesislerle eşleşmedi (${unmatchedFacilities.slice(0, 5).join(', ')}). Lütfen önce Tesis Kayıt şablonunu yüklediğinizden emin olun.`);
        } else {
          alert('Yüklenen Excel dosyasında geçerli ziyaret satırı bulunamadı.');
        }
        return;
      }
      bulkAddVisits(matchedVisits);
      let msg = `${matchedVisits.length} adet ziyaret kaydı Excel'den tek seferde başarıyla eklendi!`;
      if (unmatchedFacilities.length > 0) {
        msg += `\n\nNot: Sistemde bulunamayan ${unmatchedFacilities.length} tesis satırı atlandı: ${unmatchedFacilities.slice(0, 5).join(', ')}`;
      }
      alert(msg);
    } catch (err) {
      alert('Ziyaret Excel dosyası okunurken bir hata oluştu: ' + err.message);
    } finally {
      e.target.value = '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'telefon') {
      setFormData(prev => ({ ...prev, telefon: formatPhoneInput(value) }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.facilityId) {
      alert('Lütfen arama kutusundan ziyaret edilen tesisi seçiniz!');
      return;
    }

    const payload = {
      ...formData,
      ziyaretTarihi: formData.ziyaretTarihi || 'Belirtilmedi'
    };

    if (editingVisitId) {
      updateVisit(editingVisitId, payload);
      alert('Ziyaret kaydı başarıyla güncellendi!');
      const targetFacId = formData.facilityId;
      setEditingVisitId(null);
      if (location.state?.visit) {
        navigate('/facility-report', { state: { selectedFacilityId: targetFacId } });
        return;
      }
    } else {
      addVisit(payload);
      alert('Ziyaret kaydı başarıyla eklendi!');
    }

    setFacilitySearch('');
    setShowFacilityDropdown(false);
    setShowEmpDropdown(false);
    setFormData({
      ziyaretTarihi: new Date().toISOString().split('T')[0],
      ziyaretEden: '',
      facilityId: '',
      ziyaretSebebi: '',
      gorusmeSekli: '',
      kontakKisi: '',
      kontakUnvan: '',
      telefon: '',
      eposta: '',
      ziyaretSonucu: '',
      aciklama: ''
    });
  };

  const handleLoadVisitForEdit = (v) => {
    const fac = facilities.find(f => f.id === v.facilityId);
    setEditingVisitId(v.id);
    setFacilitySearch(fac?.tesis || v.tesisAdi || '');
    setFormData({
      ziyaretTarihi: normalizeDateToISO(v.ziyaretTarihi),
      ziyaretEden: v.ziyaretEden || '',
      facilityId: v.facilityId || '',
      ziyaretSebebi: v.ziyaretSebebi || '',
      gorusmeSekli: v.gorusmeSekli || '',
      kontakKisi: v.kontakKisi || '',
      kontakUnvan: v.kontakUnvan || '',
      telefon: v.telefon || '',
      eposta: v.eposta || '',
      ziyaretSonucu: v.ziyaretSonucu || '',
      aciklama: v.aciklama || ''
    });
  };

  const selectedFacilityVisits = sortVisitsLatestFirst(
    visits.filter(v => v.facilityId === formData.facilityId)
  );

  return (
    <div>
      <form className="form-card" onSubmit={handleSubmit}>
        <div className="header-flex" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <span className="section-label">SAHA ZİYARET GİRİŞİ</span>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>
              {editingVisitId ? 'Ziyaret Kaydını Düzenle' : 'Yeni Ziyaret Kayıt Formu'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={handleExcelVisitUpload}
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => downloadEmptyVisitTemplate(facilities)}
              title="Ziyaret girişi için boş Excel şablonunu indir"
            >
              <FileSpreadsheet size={16} />
              Boş Ziyaret Şablonu
            </button>
            <button
              type="button"
              className="btn btn-lime"
              onClick={() => fileInputRef.current?.click()}
              title="Doldurduğunuz ziyaret Excel dosyasını tek seferde yükleyin"
            >
              <Upload size={16} />
              Excel'den Toplu Yükle
            </button>
            <button className="btn btn-primary" type="submit">
              <Save size={16} />
              {editingVisitId ? 'Değişiklikleri Kaydet' : 'Ziyareti Kaydet'}
            </button>
          </div>
        </div>

        <div className="banja-gradient-line">
          <div className="banja-gradient-fill" style={{ width: '100%' }} />
        </div>

        <div className="form-grid">
          {/* 1. ZİYARET TARİHİ */}
          <div className="form-group">
            <label>ZİYARET TARİHİ</label>
            <input
              type="date"
              className="form-control"
              name="ziyaretTarihi"
              value={formData.ziyaretTarihi}
              onChange={handleChange}
            />
          </div>

          {/* 2. ZİYARET EDEN (SAHA ÇALIŞANI - ÇOKLU SEÇİM) */}
          <div className="form-group" ref={empDropdownRef} style={{ position: 'relative' }}>
            <label>SAHA ÇALIŞANI (ZİYARET EDEN - ÇOKLU SEÇİM)</label>
            <button
              type="button"
              className="form-control"
              onClick={() => setShowEmpDropdown(prev => !prev)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left',
                cursor: 'pointer',
                color: selectedEmpList.length > 0 ? 'var(--text-main)' : '#4b6073'
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedEmpList.length > 0 ? selectedEmpList.join(' & ') : 'Seçiniz...'}
              </span>
              <ChevronDown size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            </button>

            {showEmpDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '0.3rem',
                maxHeight: '220px',
                overflowY: 'auto',
                backgroundColor: 'var(--dropdown-bg)',
                border: '1px solid var(--primary-color)',
                borderRadius: '10px',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.7)',
                zIndex: 110,
                padding: '0.35rem'
              }}>
                {individualEmployees.length === 0 ? (
                  <div style={{ padding: '0.7rem 0.85rem', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Kayıtlı saha çalışanı bulunamadı.
                  </div>
                ) : (
                  individualEmployees.map(empName => {
                    const isChecked = selectedEmpList.some(
                      n => n.toLocaleUpperCase('tr-TR') === empName.toLocaleUpperCase('tr-TR')
                    );
                    return (
                      <div
                        key={empName}
                        onClick={() => handleToggleEmployee(empName)}
                        style={{
                          padding: '0.6rem 0.8rem',
                          borderRadius: '7px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: isChecked ? 'rgba(0, 210, 255, 0.15)' : 'transparent',
                          color: isChecked ? 'var(--primary-color)' : 'var(--text-main)',
                          fontWeight: isChecked ? 700 : 500,
                          fontSize: '0.86rem',
                          marginBottom: '0.15rem'
                        }}
                      >
                        <span>{empName}</span>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          border: isChecked ? '1px solid var(--primary-color)' : '1px solid #334e62',
                          backgroundColor: isChecked ? 'var(--primary-color)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {isChecked && <Check size={13} color="#051014" strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* 3. TESİS (ARAMA ÇUBUĞU) */}
          <div className="form-group" ref={dropdownRef} style={{ position: 'relative' }}>
            <label>TESİS (ARA / SEÇİNİZ)</label>
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
                value={facilitySearch}
                onFocus={() => setShowFacilityDropdown(true)}
                onChange={handleFacilitySearchChange}
                placeholder="Tesis adı yazarak arayın..."
                style={{ width: '100%', paddingLeft: '2.35rem', paddingRight: '2.2rem' }}
                required
              />
              {facilitySearch && (
                <button
                  type="button"
                  onClick={handleClearFacilitySearch}
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
                  title="Temizle"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {showFacilityDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '0.3rem',
                maxHeight: '220px',
                overflowY: 'auto',
                backgroundColor: 'var(--dropdown-bg)',
                border: '1px solid var(--primary-color)',
                borderRadius: '10px',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.7)',
                zIndex: 100
              }}>
                {matchingFacilities.length === 0 ? (
                  <div style={{ padding: '0.8rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Eşleşen tesis bulunamadı.
                  </div>
                ) : (
                  matchingFacilities.map(f => {
                    const isActive = f.id === formData.facilityId;
                    return (
                      <div
                        key={f.id}
                        onClick={() => handleSelectFacility(f)}
                        style={{
                          padding: '0.7rem 0.9rem',
                          fontSize: '0.86rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border-subtle)',
                          backgroundColor: isActive ? 'rgba(0, 210, 255, 0.15)' : 'transparent',
                          color: isActive ? 'var(--primary-color)' : 'var(--text-main)',
                          fontWeight: isActive ? 700 : 500
                        }}
                      >
                        {f.tesis}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* 4. ZİYARET SEBEBİ */}
          <div className="form-group">
            <label>ZİYARET SEBEBİ</label>
            <select
              className="form-control"
              name="ziyaretSebebi"
              value={formData.ziyaretSebebi}
              onChange={handleChange}
            >
              <option value="">Seçiniz...</option>
              {ZIYARET_SEBEPLERI.map(sebep => (
                <option key={sebep} value={sebep}>{sebep}</option>
              ))}
            </select>
          </div>

          {/* 5. GÖRÜŞME ŞEKLİ */}
          <div className="form-group">
            <label>GÖRÜŞME ŞEKLİ</label>
            <select
              className="form-control"
              name="gorusmeSekli"
              value={formData.gorusmeSekli}
              onChange={handleChange}
            >
              <option value="">Seçiniz...</option>
              {GORUSME_SEKILLERI.map(sekil => (
                <option key={sekil} value={sekil}>{sekil}</option>
              ))}
            </select>
          </div>

          {/* 5. KONTAK KİŞİ */}
          <div className="form-group">
            <label>KONTAK KİŞİ</label>
            <input
              type="text"
              className="form-control"
              name="kontakKisi"
              value={formData.kontakKisi}
              onChange={handleChange}
              placeholder="Görüşülen yetkili adı soyadı"
            />
          </div>

          {/* 6. KONTAK UNVAN */}
          <div className="form-group">
            <label>KONTAK UNVAN</label>
            <select
              className="form-control"
              name="kontakUnvan"
              value={formData.kontakUnvan}
              onChange={handleChange}
            >
              <option value="">Seçiniz...</option>
              {KONTAK_UNVANLAR.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* 7. TELEFON */}
          <div className="form-group">
            <label>TELEFON</label>
            <input
              type="tel"
              inputMode="numeric"
              className="form-control"
              name="telefon"
              value={formData.telefon}
              onChange={handleChange}
              placeholder="05XX XXX XX XX"
            />
          </div>

          {/* 8. E POSTA */}
          <div className="form-group">
            <label>E POSTA</label>
            <input
              type="email"
              className="form-control"
              name="eposta"
              value={formData.eposta}
              onChange={handleChange}
              placeholder="ornek@tesis.com"
            />
          </div>

          {/* 9. ZİYARET SONUCU */}
          <div className="form-group">
            <label>ZİYARET SONUCU</label>
            <select
              className="form-control"
              name="ziyaretSonucu"
              value={formData.ziyaretSonucu}
              onChange={handleChange}
            >
              <option value="">Seçiniz...</option>
              {ZIYARET_SONUCLARI.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 10. AÇIKLAMA */}
        <div className="form-group" style={{ marginTop: '1.25rem' }}>
          <label>AÇIKLAMA</label>
          <textarea
            className="form-control"
            name="aciklama"
            value={formData.aciklama}
            onChange={handleChange}
            placeholder="Ziyaret notlarını giriniz..."
            rows={4}
          />
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" type="submit">
            <Save size={16} />
            {editingVisitId ? 'Değişiklikleri Kaydet' : 'Ziyareti Kaydet'}
          </button>
        </div>
      </form>

      {/* Seçili Tesise Ait Ziyaret Geçmişi */}
      {formData.facilityId && (
        <div className="dashboard-card">
          <span className="section-label">SEÇİLİ TESİS ZİYARETLERİ ({selectedFacilityVisits.length})</span>
          {selectedFacilityVisits.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Bu tesise ait önceki ziyaret kaydı bulunmuyor.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
              {selectedFacilityVisits.map(v => (
                <div
                  key={v.id}
                  style={{
                    backgroundColor: '#081015',
                    border: v.id === editingVisitId ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-color)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={14} /> {formatDateDisplay(v.ziyaretTarihi)}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleLoadVisitForEdit(v)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }}
                        title="Ziyareti Düzenle"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteVisit(v.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                        title="Ziyareti Sil"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <User size={13} /> {v.ziyaretEden} • {v.kontakKisi} {v.kontakUnvan ? `(${v.kontakUnvan})` : ''}
                  </div>
                  {(v.ziyaretSebebi || v.gorusmeSekli || v.ziyaretSonucu) && (
                    <div style={{ marginBottom: '0.4rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {v.ziyaretSebebi && (
                        <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>{v.ziyaretSebebi}</span>
                      )}
                      {v.gorusmeSekli && (
                        <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>{v.gorusmeSekli}</span>
                      )}
                      {v.ziyaretSonucu && (
                        <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>{v.ziyaretSonucu}</span>
                      )}
                    </div>
                  )}
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                    {v.aciklama}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VisitFormPage;
