import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { List, X, ExternalLink, Calendar, Check, ChevronDown, RotateCcw, MapPin, Tag, Flame } from 'lucide-react';
import { getEffectiveToplamKort, sortVisitsLatestFirst, formatDateDisplay, normalizeDateToISO, normalizeKategori } from '../utils/excelExport';
import { useNavigate } from 'react-router-dom';

const MONTH_NAMES_TR = {
  '01': 'Ocak',
  '02': 'Şubat',
  '03': 'Mart',
  '04': 'Nisan',
  '05': 'Mayıs',
  '06': 'Haziran',
  '07': 'Temmuz',
  '08': 'Ağustos',
  '09': 'Eylül',
  '10': 'Ekim',
  '11': 'Kasım',
  '12': 'Aralık'
};

const formatYearMonthTR = (ym, currentYm) => {
  if (ym === 'BELIRTILMEDI') return 'Tarihi Belirtilmeyenler';
  const [yyyy, mm] = (ym || '').split('-');
  if (!yyyy || !mm) return ym;
  const label = `${MONTH_NAMES_TR[mm] || mm} ${yyyy}`;
  return ym === currentYm ? `${label} (Bu Ay)` : label;
};

const DashboardPage = () => {
  const { facilities, visits } = useData();
  const navigate = useNavigate();
  const [selectedCities, setSelectedCities] = useState([]); // Boş dizi = TÜM İLLER
  const [selectedMonths, setSelectedMonths] = useState([]); // Boş dizi = TÜM ZAMANLAR (ALL TIME)
  const [selectedCategories, setSelectedCategories] = useState([]); // Boş dizi = TÜM KATEGORİLER
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [activeModalKey, setActiveModalKey] = useState(null);
  const monthDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveModalKey(null);
        setShowMonthDropdown(false);
        setShowCityDropdown(false);
      }
    };
    const handleClickOutside = (e) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target)) {
        setShowMonthDropdown(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target)) {
        setShowCityDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const registeredCities = Array.from(
    new Set(facilities.map(f => (f.il || '').trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, 'tr'));

  const toggleCitySelection = (city) => {
    setSelectedCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  const selectAllCities = () => {
    setSelectedCities([]);
  };

  // 1. İl filtresine göre tesisler
  const cityFilteredFacilities = selectedCities.length === 0
    ? facilities
    : facilities.filter(f => selectedCities.includes(f.il));

  // Kategori seçenekleri ve bu illerdeki tesis sayıları (T1, T2, T3, TEST / DENEME)
  const STANDARD_CATEGORIES = ['T1', 'T2', 'T3', 'TEST / DENEME'];

  const { categoryList, categoryCounts } = React.useMemo(() => {
    const counts = { 'T1': 0, 'T2': 0, 'T3': 0, 'TEST / DENEME': 0 };
    let unassigned = 0;

    cityFilteredFacilities.forEach(f => {
      const cat = normalizeKategori(f.kategori);
      if (!cat) {
        unassigned++;
      } else if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });

    const list = [...STANDARD_CATEGORIES];
    if (unassigned > 0) {
      counts['BELİRTİLMEMİŞ'] = unassigned;
      list.push('BELİRTİLMEMİŞ');
    }

    return { categoryList: list, categoryCounts: counts };
  }, [cityFilteredFacilities]);

  const toggleCategorySelection = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const selectAllCategories = () => {
    setSelectedCategories([]);
  };

  // 2. Kategori filtresi de uygulanmış tesisler
  const filteredFacilities = cityFilteredFacilities.filter(f => {
    if (selectedCategories.length === 0) return true;
    const cat = normalizeKategori(f.kategori) || 'BELİRTİLMEMİŞ';
    return selectedCategories.includes(cat);
  });

  // Current YYYY-MM for "BU AY YAPILAN ZİYARET SAYISI"
  const currentYearMonth = new Date().toISOString().slice(0, 7);

  // Mevcut ay + son 6 ay + verilerde geçen tüm ayları birleştir
  const availableMonths = React.useMemo(() => {
    const monthSet = new Set();
    monthSet.add(currentYearMonth);

    // Son 6 ayı her zaman seçeneklerde göster
    const now = new Date();
    for (let i = 1; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthSet.add(ym);
    }

    let hasUndated = false;
    visits.forEach(v => {
      const iso = normalizeDateToISO(v.ziyaretTarihi);
      if (iso && /^\d{4}-\d{2}/.test(iso)) {
        monthSet.add(iso.slice(0, 7));
      } else {
        hasUndated = true;
      }
    });

    const sorted = Array.from(monthSet).sort((a, b) => b.localeCompare(a));
    if (hasUndated) {
      sorted.push('BELIRTILMEDI');
    }
    return sorted;
  }, [visits, currentYearMonth]);

  const toggleMonthSelection = (ym) => {
    setSelectedMonths(prev =>
      prev.includes(ym) ? prev.filter(m => m !== ym) : [...prev, ym]
    );
  };

  const selectAllTime = () => {
    setSelectedMonths([]);
  };

  // İl ve kategori filtresine uyan tesislerin tüm ziyaretleri
  const facFilteredVisits = visits.filter(v =>
    filteredFacilities.some(f => f.id === v.facilityId)
  );

  // Zaman filtresi de uygulanmış ziyaretler (selectedMonths boşsa Tüm Zamanlar)
  const filteredVisits = selectedMonths.length === 0
    ? facFilteredVisits
    : facFilteredVisits.filter(v => {
        const iso = normalizeDateToISO(v.ziyaretTarihi);
        const ym = iso && /^\d{4}-\d{2}/.test(iso) ? iso.slice(0, 7) : 'BELIRTILMEDI';
        return selectedMonths.includes(ym);
      });

  // Data subsets for each card
  const visitedFacilityIds = new Set(filteredVisits.map(v => v.facilityId));
  const visitedFacilitiesList = filteredFacilities.filter(f => visitedFacilityIds.has(f.id));

  const thisMonthVisitsList = sortVisitsLatestFirst(
    facFilteredVisits.filter(v => normalizeDateToISO(v.ziyaretTarihi).startsWith(currentYearMonth))
  );
  const allVisitsList = sortVisitsLatestFirst(filteredVisits);

  const acikKortFacilities = filteredFacilities.filter(f => (parseInt(f.acikKort || 0) || 0) > 0);
  const kapaliKortFacilities = filteredFacilities.filter(f => (parseInt(f.kapaliKort || 0) || 0) > 0);
  const doubleKortFacilities = filteredFacilities.filter(f => (parseInt(f.doubleKort || 0) || 0) > 0);
  const singleKortFacilities = filteredFacilities.filter(f => (parseInt(f.singleKort || 0) || 0) > 0);

  const teklifVerildiVisits = sortVisitsLatestFirst(
    filteredVisits.filter(v => v.ziyaretSonucu === 'TEKLİF VERİLDİ')
  );
  const teklifVerilmediVisits = sortVisitsLatestFirst(
    filteredVisits.filter(
      v => v.ziyaretSonucu === 'TEKLİF VERİLMEDİ' || v.ziyaretSonucu === 'TEKLİF VERİLECEK'
    )
  );
  const gorusmeDevamVisits = sortVisitsLatestFirst(
    filteredVisits.filter(v => v.ziyaretSonucu === 'GÖRÜŞME DEVAM EDİYOR')
  );
  const olumsuzVisits = sortVisitsLatestFirst(
    filteredVisits.filter(v => v.ziyaretSonucu === 'OLUMSUZ')
  );

  // Görüşme şekli (türü) bazında ziyaretler
  const normalizeGorusmeSekli = (raw) => {
    const s = (raw || '').toString().toLocaleUpperCase('tr-TR');
    if (!s) return '';
    if (s.includes('ONLİNE') || s.includes('ONLINE')) return 'ONLINE';
    if (s.includes('YÜZ') || s.includes('YUZ')) return 'YUZYUZE';
    if (s.includes('WHATSAPP') || s === 'WP') return 'WHATSAPP';
    if (s.includes('TELEFON') || s === 'TEL') return 'TELEFON';
    if (s.includes('POSTA') || s.includes('MAİL') || s.includes('MAIL')) return 'EPOSTA';
    return '';
  };
  const GORUSME_TURU_CARDS = [
    { key: 'GORUSME_ONLINE', code: 'ONLINE', label: 'ONLİNE', color: '#00d2ff' },
    { key: 'GORUSME_YUZYUZE', code: 'YUZYUZE', label: 'YÜZ YÜZE', color: 'var(--accent-lime)' },
    { key: 'GORUSME_TELEFON', code: 'TELEFON', label: 'TELEFON', color: '#38bdf8' },
    { key: 'GORUSME_WHATSAPP', code: 'WHATSAPP', label: 'WHATSAPP', color: '#25d366' },
    { key: 'GORUSME_EPOSTA', code: 'EPOSTA', label: 'E-POSTA', color: '#a78bfa' }
  ].map(card => {
    const items = sortVisitsLatestFirst(
      filteredVisits.filter(v => normalizeGorusmeSekli(v.gorusmeSekli) === card.code)
    );
    return {
      ...card,
      items,
      count: items.length,
      facilityCount: new Set(items.map(v => v.facilityId)).size
    };
  });

  // KPI Counts
  const kayitliTesisSayisi = filteredFacilities.length;
  const ziyaretEdilenTesisSayisi = visitedFacilitiesList.length;
  const buAyZiyaretSayisi = thisMonthVisitsList.length;
  const toplamZiyaretSayisi = allVisitsList.length;
  const acikKortluTesisSayisi = acikKortFacilities.length;
  const kapaliKortluTesisSayisi = kapaliKortFacilities.length;
  const doubleKortluTesisSayisi = doubleKortFacilities.length;
  const singleKortluTesisSayisi = singleKortFacilities.length;

  const teklifVerildiCount = teklifVerildiVisits.length;
  const teklifVerilmediCount = teklifVerilmediVisits.length;
  const gorusmeDevamCount = gorusmeDevamVisits.length;
  const olumsuzCount = olumsuzVisits.length;

  const teklifVerildiFacilityCount = new Set(teklifVerildiVisits.map(v => v.facilityId)).size;
  const teklifVerilmediFacilityCount = new Set(teklifVerilmediVisits.map(v => v.facilityId)).size;
  const gorusmeDevamFacilityCount = new Set(gorusmeDevamVisits.map(v => v.facilityId)).size;
  const olumsuzFacilityCount = new Set(olumsuzVisits.map(v => v.facilityId)).size;

  // Ziyaret listesini tesislere göre grupla
  const groupVisitsByFacility = (visitItems = []) => {
    const map = new Map();
    visitItems.forEach(v => {
      const fac = facilities.find(f => f.id === v.facilityId);
      const key = v.facilityId || v.tesisAdi || v.id;
      if (!map.has(key)) {
        map.set(key, {
          key,
          facility: fac || null,
          tesisAdi: fac?.tesis || v.tesisAdi || 'Bilinmeyen Tesis',
          il: fac?.il || '-',
          ilce: fac?.ilce || '',
          visits: []
        });
      }
      map.get(key).visits.push(v);
    });
    return Array.from(map.values()).map(group => ({
      ...group,
      visits: sortVisitsLatestFirst(group.visits)
    }));
  };

  const visitCoveragePercent = kayitliTesisSayisi > 0
    ? Math.min(100, Math.round((ziyaretEdilenTesisSayisi / kayitliTesisSayisi) * 100))
    : 0;

  // En çok etkileşime girilen (en çok ziyaret edilen) tesisler
  const topInteractedFacilities = React.useMemo(() => {
    const list = filteredFacilities.map(fac => {
      const facVisits = sortVisitsLatestFirst(filteredVisits.filter(v => v.facilityId === fac.id));
      const latestVisit = facVisits[0] || null;
      return {
        facility: fac,
        visitCount: facVisits.length,
        latestVisit,
        visits: facVisits
      };
    }).filter(item => item.visitCount > 0);

    list.sort((a, b) => {
      if (b.visitCount !== a.visitCount) {
        return b.visitCount - a.visitCount;
      }
      const dateA = a.latestVisit?.ziyaretTarihi || '';
      const dateB = b.latestVisit?.ziyaretTarihi || '';
      return dateB.localeCompare(dateA);
    });

    return list.slice(0, 10);
  }, [filteredFacilities, filteredVisits]);

  const getDashboardTitle = () => {
    if (selectedCities.length === 0) {
      return 'Tüm Türkiye Saha ve Kort Dashboard';
    }
    if (selectedCities.length === 1) {
      return `${selectedCities[0]} Saha Raporu`;
    }
    if (selectedCities.length <= 3) {
      return `${selectedCities.join(', ')} Saha Raporu`;
    }
    return `${selectedCities.slice(0, 3).join(', ')} +${selectedCities.length - 3} İl Saha Raporu`;
  };

  const getFilterSummaryText = () => {
    const parts = [];
    if (selectedCities.length === 1) parts.push(selectedCities[0]);
    else if (selectedCities.length > 1) parts.push(`${selectedCities.length} İl Seçili`);
    if (selectedCategories.length > 0) parts.push(`Kategori: ${selectedCategories.join(', ')}`);
    if (selectedMonths.length === 1) parts.push(formatYearMonthTR(selectedMonths[0], currentYearMonth));
    else if (selectedMonths.length > 1) parts.push(`${selectedMonths.length} Ay Seçili`);
    return parts.length > 0 ? `${parts.join(' • ')} AKTİF` : 'DETAYLI KAYIT LİSTESİ';
  };

  // Modal configuration map
  const MODAL_CONFIG = {
    KAYITLI_TESIS: {
      title: 'Kayıtlı Tesisler Listesi',
      type: 'facility',
      items: filteredFacilities
    },
    ZIYARET_EDILEN_TESIS: {
      title: 'Ziyaret Edilen Tesisler Listesi',
      type: 'visited_facility',
      items: visitedFacilitiesList
    },
    BU_AY_ZIYARET: {
      title: 'Bu Ay Yapılan Ziyaretler',
      type: 'visit',
      items: thisMonthVisitsList
    },
    TOPLAM_ZIYARET: {
      title: 'Toplam Ziyaretler Listesi',
      type: 'visit',
      items: allVisitsList
    },
    ACIK_KORT: {
      title: 'Açık Kortu Olan Tesisler',
      type: 'facility',
      items: acikKortFacilities
    },
    KAPALI_KORT: {
      title: 'Kapalı Kortu Olan Tesisler',
      type: 'facility',
      items: kapaliKortFacilities
    },
    DOUBLE_KORT: {
      title: 'Double Kortu Olan Tesisler',
      type: 'facility',
      items: doubleKortFacilities
    },
    SINGLE_KORT: {
      title: 'Single Kortu Olan Tesisler',
      type: 'facility',
      items: singleKortFacilities
    },
    TEKLIF_VERILDI: {
      title: 'Ziyaret Sonucu: Teklif Verildi',
      type: 'visit',
      items: teklifVerildiVisits
    },
    TEKLIF_VERILMEDI: {
      title: 'Ziyaret Sonucu: Teklif Verilmedi / Verilecek',
      type: 'visit',
      items: teklifVerilmediVisits
    },
    GORUSME_DEVAM: {
      title: 'Ziyaret Sonucu: Görüşme Devam Ediyor',
      type: 'visit',
      items: gorusmeDevamVisits
    },
    OLUMSUZ: {
      title: 'Ziyaret Sonucu: Olumsuz',
      type: 'visit',
      items: olumsuzVisits
    },
    ...Object.fromEntries(
      GORUSME_TURU_CARDS.map(card => [
        card.key,
        { title: `Görüşme Türü: ${card.label}`, type: 'visit', items: card.items }
      ])
    )
  };

  const activeModal = activeModalKey ? MODAL_CONFIG[activeModalKey] : null;

  const renderCardHeader = (title, modalKey) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
      <span className="stat-title">{title}</span>
      <button
        type="button"
        onClick={() => setActiveModalKey(modalKey)}
        style={{
          background: 'rgba(0, 210, 255, 0.1)',
          border: '1px solid rgba(0, 210, 255, 0.28)',
          color: 'var(--primary-color)',
          borderRadius: '6px',
          width: '28px',
          height: '28px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 0.2s'
        }}
        title="Detaylı Listeyi Gör"
      >
        <List size={15} />
      </button>
    </div>
  );

  return (
    <div className="page-flex-container">
      {/* Üst Başlık ve İlerleme Çizgisi (Sabit kalır) */}
      <div className="sticky-filter-section">
        <div className="dashboard-card" style={{ padding: '1.25rem 1.5rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="section-label">GENEL SAHA ÖZETİ</span>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                {getDashboardTitle()}
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* ÇOKLU SEÇİMLİ ZAMAN FİLTRESİ */}
              <div ref={monthDropdownRef} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    ZAMAN:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMonthDropdown(prev => !prev);
                      setShowCityDropdown(false);
                    }}
                    className="form-control"
                    style={{
                      minWidth: '200px',
                      padding: '0.45rem 0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderColor: selectedMonths.length > 0 ? 'var(--primary-color)' : 'var(--border-color)'
                    }}
                  >
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontSize: '0.83rem',
                      fontWeight: 600,
                      color: selectedMonths.length > 0 ? 'var(--primary-color)' : 'var(--text-main)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '170px'
                    }}>
                      <Calendar size={14} color="var(--primary-color)" style={{ flexShrink: 0 }} />
                      {selectedMonths.length === 0
                        ? 'TÜM ZAMANLAR'
                        : selectedMonths.length === 1
                          ? formatYearMonthTR(selectedMonths[0], currentYearMonth)
                          : `${selectedMonths.length} Ay Seçili`}
                    </span>
                    <ChevronDown size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  </button>
                </div>

                {showMonthDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.4rem',
                    width: '285px',
                    maxHeight: '340px',
                    overflowY: 'auto',
                    backgroundColor: 'var(--dropdown-bg)',
                    border: '1px solid var(--primary-color)',
                    borderRadius: '10px',
                    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
                    zIndex: 120,
                    padding: '0.45rem'
                  }}>
                    {/* TÜM ZAMANLAR (ALL TIME) SEÇENEĞİ */}
                    <div
                      onClick={selectAllTime}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: selectedMonths.length === 0 ? 'rgba(0, 210, 255, 0.16)' : 'transparent',
                        color: selectedMonths.length === 0 ? 'var(--primary-color)' : 'var(--text-main)',
                        fontWeight: 700,
                        fontSize: '0.83rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        marginBottom: '0.3rem'
                      }}
                    >
                      <span>TÜM ZAMANLAR (ALL TIME)</span>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: selectedMonths.length === 0 ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                        backgroundColor: selectedMonths.length === 0 ? 'var(--primary-color)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {selectedMonths.length === 0 && <Check size={13} color="#051014" strokeWidth={3} />}
                      </div>
                    </div>

                    <div style={{
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.04em'
                    }}>
                      AY SEÇİMİ (ÇOKLU SEÇİM YAPABİLİRSİNİZ)
                    </div>

                    {availableMonths.map(ym => {
                      const isChecked = selectedMonths.includes(ym);
                      const monthVisitCount = facFilteredVisits.filter(v => {
                        const iso = normalizeDateToISO(v.ziyaretTarihi);
                        const vYm = iso && /^\d{4}-\d{2}/.test(iso) ? iso.slice(0, 7) : 'BELIRTILMEDI';
                        return vYm === ym;
                      }).length;

                      return (
                        <div
                          key={ym}
                          onClick={() => toggleMonthSelection(ym)}
                          style={{
                            padding: '0.55rem 0.75rem',
                            borderRadius: '7px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: isChecked ? 'rgba(182, 255, 0, 0.12)' : 'transparent',
                            color: isChecked ? 'var(--accent-lime)' : 'var(--text-main)',
                            fontWeight: isChecked ? 700 : 500,
                            fontSize: '0.82rem',
                            marginBottom: '0.15rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>{formatYearMonthTR(ym, currentYearMonth)}</span>
                            <span style={{
                              fontSize: '0.7rem',
                              color: isChecked ? 'var(--accent-lime)' : 'var(--text-muted)',
                              backgroundColor: 'var(--pill-bg)',
                              padding: '0.1rem 0.45rem',
                              borderRadius: '999px',
                              border: '1px solid var(--border-subtle)'
                            }}>
                              {monthVisitCount}
                            </span>
                          </div>

                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            border: isChecked ? '1px solid var(--accent-lime)' : '1px solid var(--border-color)',
                            backgroundColor: isChecked ? 'var(--accent-lime)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {isChecked && <Check size={13} color="#051014" strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ÇOKLU SEÇİMLİ İL FİLTRESİ */}
              <div ref={cityDropdownRef} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    İL:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCityDropdown(prev => !prev);
                      setShowMonthDropdown(false);
                    }}
                    className="form-control"
                    style={{
                      minWidth: '180px',
                      padding: '0.45rem 0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderColor: selectedCities.length > 0 ? 'var(--primary-color)' : 'var(--border-color)'
                    }}
                  >
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontSize: '0.83rem',
                      fontWeight: 600,
                      color: selectedCities.length > 0 ? 'var(--primary-color)' : 'var(--text-main)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '150px'
                    }}>
                      <MapPin size={14} color="var(--primary-color)" style={{ flexShrink: 0 }} />
                      {selectedCities.length === 0
                        ? 'TÜM İLLER'
                        : selectedCities.length === 1
                          ? selectedCities[0]
                          : `${selectedCities.length} İl Seçili`}
                    </span>
                    <ChevronDown size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  </button>
                </div>

                {showCityDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.4rem',
                    width: '260px',
                    maxHeight: '340px',
                    overflowY: 'auto',
                    backgroundColor: 'var(--dropdown-bg)',
                    border: '1px solid var(--primary-color)',
                    borderRadius: '10px',
                    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
                    zIndex: 120,
                    padding: '0.45rem'
                  }}>
                    {/* TÜM İLLER SEÇENEĞİ */}
                    <div
                      onClick={selectAllCities}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: selectedCities.length === 0 ? 'rgba(0, 210, 255, 0.16)' : 'transparent',
                        color: selectedCities.length === 0 ? 'var(--primary-color)' : 'var(--text-main)',
                        fontWeight: 700,
                        fontSize: '0.83rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        marginBottom: '0.3rem'
                      }}
                    >
                      <span>TÜM İLLER</span>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: selectedCities.length === 0 ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                        backgroundColor: selectedCities.length === 0 ? 'var(--primary-color)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {selectedCities.length === 0 && <Check size={13} color="#051014" strokeWidth={3} />}
                      </div>
                    </div>

                    <div style={{
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.04em'
                    }}>
                      İL SEÇİMİ (ÇOKLU SEÇİM)
                    </div>

                    {registeredCities.map(city => {
                      const isChecked = selectedCities.includes(city);
                      const cityFacCount = facilities.filter(f => f.il === city).length;

                      return (
                        <div
                          key={city}
                          onClick={() => toggleCitySelection(city)}
                          style={{
                            padding: '0.55rem 0.75rem',
                            borderRadius: '7px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: isChecked ? 'rgba(0, 210, 255, 0.12)' : 'transparent',
                            color: isChecked ? 'var(--primary-color)' : 'var(--text-main)',
                            fontWeight: isChecked ? 700 : 500,
                            fontSize: '0.82rem',
                            marginBottom: '0.15rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>{city}</span>
                            <span style={{
                              fontSize: '0.7rem',
                              color: isChecked ? 'var(--primary-color)' : 'var(--text-muted)',
                              backgroundColor: 'var(--pill-bg)',
                              padding: '0.1rem 0.45rem',
                              borderRadius: '999px',
                              border: '1px solid var(--border-subtle)'
                            }}>
                              {cityFacCount}
                            </span>
                          </div>

                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            border: isChecked ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
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
                    })}
                  </div>
                )}
              </div>

              {/* FİLTRELERİ TEMİZLE BUTONU */}
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setSelectedCities([]);
                  setSelectedMonths([]);
                  setSelectedCategories([]);
                  setShowMonthDropdown(false);
                  setShowCityDropdown(false);
                }}
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.78rem',
                  whiteSpace: 'nowrap',
                  opacity: (selectedCities.length > 0 || selectedMonths.length > 0 || selectedCategories.length > 0) ? 1 : 0.65,
                  borderColor: (selectedCities.length > 0 || selectedMonths.length > 0 || selectedCategories.length > 0) ? 'var(--primary-color)' : undefined,
                  color: (selectedCities.length > 0 || selectedMonths.length > 0 || selectedCategories.length > 0) ? 'var(--primary-color)' : undefined
                }}
                title="Tüm filtreleri (Zaman, İl, Kategori) sıfırla"
              >
                <RotateCcw size={14} />
                Temizle
              </button>
            </div>
          </div>

          {/* KATEGORİ FİLTRESİ PİLL / BUTONLARI */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
            marginTop: '0.85rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Tag size={13} color="var(--primary-color)" /> KATEGORİ:
            </span>

            <button
              type="button"
              onClick={selectAllCategories}
              style={{
                padding: '0.3rem 0.7rem',
                borderRadius: '20px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: selectedCategories.length === 0 ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                backgroundColor: selectedCategories.length === 0 ? 'rgba(0, 210, 255, 0.18)' : 'var(--card-sub-bg)',
                color: selectedCategories.length === 0 ? 'var(--primary-color)' : 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                transition: 'all 0.2s'
              }}
            >
              <span>TÜMÜ</span>
              <span style={{
                backgroundColor: selectedCategories.length === 0 ? 'rgba(0, 210, 255, 0.25)' : 'rgba(0,0,0,0.15)',
                color: selectedCategories.length === 0 ? 'var(--primary-color)' : 'var(--text-muted)',
                padding: '0.05rem 0.45rem',
                borderRadius: '10px',
                fontSize: '0.7rem'
              }}>
                {cityFilteredFacilities.length}
              </span>
            </button>

            {categoryList.map(cat => {
              const isSelected = selectedCategories.includes(cat);
              const count = categoryCounts[cat] || 0;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategorySelection(cat)}
                  style={{
                    padding: '0.3rem 0.7rem',
                    borderRadius: '20px',
                    fontSize: '0.76rem',
                    fontWeight: isSelected ? 700 : 600,
                    cursor: 'pointer',
                    border: isSelected ? '1px solid var(--accent-lime)' : '1px solid var(--border-color)',
                    backgroundColor: isSelected ? 'rgba(182, 255, 0, 0.16)' : 'var(--card-sub-bg)',
                    color: isSelected ? 'var(--accent-lime)' : 'var(--text-main)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{cat}</span>
                  <span style={{
                    backgroundColor: isSelected ? 'rgba(0,0,0,0.3)' : 'var(--pill-bg)',
                    color: isSelected ? 'var(--accent-lime)' : 'var(--text-muted)',
                    padding: '0.05rem 0.45rem',
                    borderRadius: '10px',
                    fontSize: '0.7rem',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="banja-gradient-line" style={{ marginBottom: 0 }}>
            <div className="banja-gradient-fill" style={{ width: `${Math.max(visitCoveragePercent, 8)}%` }} />
          </div>
        </div>
      </div>

      <div className="page-scroll-body">
        {/* 8 Ana KPI Kartı (Yukarıda 4, Altta 4 Kart) */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card" style={{ borderLeft: '3px solid var(--primary-color)' }}>
            {renderCardHeader('KAYITLI TESİS SAYISI', 'KAYITLI_TESIS')}
            <span className="stat-value">{kayitliTesisSayisi}</span>
          </div>

          <div className="stat-card" style={{ borderLeft: '3px solid #38bdf8' }}>
            {renderCardHeader('ZİYARET EDİLEN TESİS SAYISI', 'ZIYARET_EDILEN_TESIS')}
            <span className="stat-value" style={{ color: '#38bdf8' }}>{ziyaretEdilenTesisSayisi}</span>
          </div>

          <div className="stat-card" style={{ borderLeft: '3px solid var(--accent-lime)' }}>
            {renderCardHeader('BU AY YAPILAN ZİYARET SAYISI', 'BU_AY_ZIYARET')}
            <span className="stat-value" style={{ color: 'var(--accent-lime)' }}>{buAyZiyaretSayisi}</span>
          </div>

          <div className="stat-card" style={{ borderLeft: '3px solid var(--primary-color)' }}>
            {renderCardHeader('TOPLAM ZİYARET SAYISI', 'TOPLAM_ZIYARET')}
            <span className="stat-value">{toplamZiyaretSayisi}</span>
          </div>
        </div>

        {/* GÖRÜŞME TÜRÜ KARTLARI */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {GORUSME_TURU_CARDS.map(card => (
            <div key={card.key} className="stat-card" style={{ borderLeft: `3px solid ${card.color}` }}>
              {renderCardHeader(card.label, card.key)}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                <span className="stat-value" style={{ color: card.color }}>{card.count}</span>
                {card.count > 0 && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    ({card.facilityCount} Tesis)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card" style={{ borderLeft: '3px solid #00d2ff' }}>
            {renderCardHeader('AÇIK KORTU OLAN TESİS SAYISI', 'ACIK_KORT')}
            <span className="stat-value">{acikKortluTesisSayisi}</span>
          </div>

          <div className="stat-card" style={{ borderLeft: '3px solid #38bdf8' }}>
            {renderCardHeader('KAPALI KORTU OLAN TESİS SAYISI', 'KAPALI_KORT')}
            <span className="stat-value">{kapaliKortluTesisSayisi}</span>
          </div>

          <div className="stat-card" style={{ borderLeft: '3px solid var(--accent-lime)' }}>
            {renderCardHeader('DOUBLE KORTU OLAN TESİS', 'DOUBLE_KORT')}
            <span className="stat-value">{doubleKortluTesisSayisi}</span>
          </div>

          <div className="stat-card" style={{ borderLeft: '3px solid #a78bfa' }}>
            {renderCardHeader('SİNGLE KORTU OLAN TESİS', 'SINGLE_KORT')}
            <span className="stat-value">{singleKortluTesisSayisi}</span>
          </div>
        </div>

        {/* 9. ZİYARET SONUCU KARTI */}
        <div className="dashboard-card" style={{ marginBottom: 0 }}>
          <span className="section-label" style={{ marginBottom: '0.85rem' }}>ZİYARET SONUÇ ÖZETİ</span>

          <div className="stats-grid" style={{ marginBottom: 0, gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="stat-card" style={{ backgroundColor: 'var(--card-sub-bg)', borderLeft: '3px solid #00d2ff' }}>
              {renderCardHeader('TEKLİF VERİLDİ', 'TEKLIF_VERILDI')}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                <span className="stat-value" style={{ color: '#00d2ff' }}>{teklifVerildiCount}</span>
                {teklifVerildiCount > 0 && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    ({teklifVerildiFacilityCount} Tesis)
                  </span>
                )}
              </div>
            </div>

            <div className="stat-card" style={{ backgroundColor: 'var(--card-sub-bg)', borderLeft: '3px solid #b6ff00' }}>
              {renderCardHeader('TEKLİF VERİLMEDİ / VERİLECEK', 'TEKLIF_VERILMEDI')}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                <span className="stat-value" style={{ color: '#b6ff00' }}>{teklifVerilmediCount}</span>
                {teklifVerilmediCount > 0 && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    ({teklifVerilmediFacilityCount} Tesis)
                  </span>
                )}
              </div>
            </div>

            <div className="stat-card" style={{ backgroundColor: 'var(--card-sub-bg)', borderLeft: '3px solid #38bdf8' }}>
              {renderCardHeader('GÖRÜŞME DEVAM EDİYOR', 'GORUSME_DEVAM')}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                <span className="stat-value" style={{ color: '#38bdf8' }}>{gorusmeDevamCount}</span>
                {gorusmeDevamCount > 0 && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    ({gorusmeDevamFacilityCount} Tesis)
                  </span>
                )}
              </div>
            </div>

            <div className="stat-card" style={{ backgroundColor: 'var(--card-sub-bg)', borderLeft: '3px solid #f87171' }}>
              {renderCardHeader('OLUMSUZ', 'OLUMSUZ')}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                <span className="stat-value" style={{ color: '#f87171' }}>{olumsuzCount}</span>
                {olumsuzCount > 0 && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    ({olumsuzFacilityCount} Tesis)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 10. SIK ETKİLEŞİME GİRİLEN TESİSLER BÖLÜMÜ */}
        <div className="dashboard-card" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <span className="section-label" style={{ marginBottom: '0.2rem' }}>ETKİLEŞİM ANALİZİ</span>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Flame size={18} color="#ff7b00" /> SIK ETKİLEŞİME GİRİLEN TESİSLER (EN ÇOK GÖRÜŞÜLENLER)
              </h3>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Filtrelere göre en çok ziyaret ve görüşme yapılan ilk 10 tesis
            </span>
          </div>

          {topInteractedFacilities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Seçilen filtrelere uygun görüşme yapılan tesis bulunmuyor.
            </div>
          ) : (
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', whiteSpace: 'normal', tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th style={{ width: '6%', padding: '0.65rem 0.5rem', fontSize: '0.75rem', textAlign: 'center' }}>SIRA</th>
                    <th style={{ width: '27%', padding: '0.65rem 0.6rem', fontSize: '0.75rem' }}>TESİS ADI</th>
                    <th style={{ width: '14%', padding: '0.65rem 0.5rem', fontSize: '0.75rem' }}>İL / İLÇE</th>
                    <th style={{ width: '10%', padding: '0.65rem 0.5rem', fontSize: '0.75rem', textAlign: 'center' }}>KATEGORİ</th>
                    <th style={{ width: '12%', padding: '0.65rem 0.5rem', fontSize: '0.75rem', textAlign: 'center' }}>GÖRÜŞME SAYISI</th>
                    <th style={{ width: '14%', padding: '0.65rem 0.5rem', fontSize: '0.75rem' }}>SON GÖRÜŞME</th>
                    <th style={{ width: '17%', padding: '0.65rem 0.5rem', fontSize: '0.75rem' }}>SON DURUM</th>
                  </tr>
                </thead>
                <tbody>
                  {topInteractedFacilities.map((item, idx) => {
                    const fac = item.facility;
                    const latest = item.latestVisit;
                    return (
                      <tr key={fac.id}>
                        <td style={{ textAlign: 'center', padding: '0.65rem 0.5rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            backgroundColor: idx === 0 ? 'rgba(255, 184, 0, 0.2)' : idx === 1 ? 'rgba(0, 210, 255, 0.2)' : idx === 2 ? 'rgba(182, 255, 0, 0.2)' : 'var(--card-sub-bg)',
                            color: idx === 0 ? '#ffb800' : idx === 1 ? '#00d2ff' : idx === 2 ? 'var(--accent-lime)' : 'var(--text-muted)',
                            border: idx === 0 ? '1px solid #ffb800' : idx === 1 ? '1px solid #00d2ff' : idx === 2 ? '1px solid var(--accent-lime)' : '1px solid var(--border-color)'
                          }}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td style={{ padding: '0.65rem 0.6rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '0.84rem' }}>
                            {fac.tesis}
                          </div>
                          {fac.kapsamDurumu && (
                            <span
                              className={`badge ${fac.kapsamDurumu === 'KAPSAM DAHİLİNDE' ? 'badge-success' : 'badge-danger'}`}
                              style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', marginTop: '0.2rem', display: 'inline-block' }}
                            >
                              {fac.kapsamDurumu}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.65rem 0.5rem', fontSize: '0.8rem' }}>
                          {fac.il || '-'}{fac.ilce ? ` / ${fac.ilce}` : ''}
                        </td>
                        <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                          <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                            {normalizeKategori(fac.kategori) || 'Belirtilmedi'}
                          </span>
                        </td>
                        <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                          <span className="badge badge-success" style={{ fontSize: '0.78rem', fontWeight: 700, padding: '0.25rem 0.6rem' }}>
                            {item.visitCount} Görüşme
                          </span>
                        </td>
                        <td style={{ padding: '0.65rem 0.5rem', fontSize: '0.8rem' }}>
                          <div>{latest ? formatDateDisplay(latest.ziyaretTarihi) : '-'}</div>
                          {latest?.ziyaretEden && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                              {latest.ziyaretEden}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.65rem 0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            {latest?.ziyaretSonucu ? (
                              <span
                                className={`badge ${latest.ziyaretSonucu === 'TEKLİF VERİLDİ' ? 'badge-success' : latest.ziyaretSonucu === 'OLUMSUZ' ? 'badge-danger' : 'badge-warning'}`}
                                style={{ fontSize: '0.68rem', whiteSpace: 'normal', textAlign: 'center' }}
                              >
                                {latest.ziyaretSonucu}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>-</span>
                            )}
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', flexShrink: 0 }}
                              onClick={() => navigate('/facility-report', { state: { selectedFacilityId: fac.id } })}
                              title="Tesis Raporuna Git"
                            >
                              <ExternalLink size={11} /> Rapor
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

      {/* Detaylı Liste Popup Penceresi (Modal) */}
      {activeModal && (
        <div
          onClick={() => setActiveModalKey(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 12, 16, 0.78)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '96%',
              maxWidth: '1180px',
              maxHeight: '85vh',
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--primary-color)',
              borderRadius: '14px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Modal Üst Başlık ve Sağ Köşede X Butonu */}
            <div style={{
              padding: '1rem 1.35rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div>
                <span className="section-label" style={{ marginBottom: '0.15rem' }}>
                  {getFilterSummaryText()}
                </span>
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
                  {activeModal.type === 'visit'
                    ? `${activeModal.title} (${groupVisitsByFacility(activeModal.items).length} Tesis / ${activeModal.items.length} Görüşme)`
                    : `${activeModal.title} (${activeModal.items.length})`}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalKey(null)}
                style={{
                  background: 'var(--btn-outline-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal İçerik Tablosu (Sağa sola scroll olmadan tam sığan görünüm) */}
            <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', overflowX: 'hidden', flex: 1 }}>
              {activeModal.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  Bu karta ait listelenecek kayıt bulunmuyor.
                </div>
              ) : activeModal.type === 'facility' ? (
                <div className="table-container" style={{ overflowX: 'hidden' }}>
                  <table style={{ width: '100%', whiteSpace: 'normal', tableLayout: 'fixed' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '26%', padding: '0.65rem 0.6rem', fontSize: '0.76rem' }}>TESİS ADI</th>
                        <th style={{ width: '11%', padding: '0.65rem 0.5rem', fontSize: '0.76rem' }}>İL</th>
                        <th style={{ width: '13%', padding: '0.65rem 0.5rem', fontSize: '0.76rem' }}>İLÇE / BÖLGE</th>
                        <th style={{ width: '13%', padding: '0.65rem 0.5rem', fontSize: '0.76rem' }}>TESİS TÜRÜ</th>
                        <th style={{ width: '6%', padding: '0.65rem 0.35rem', fontSize: '0.74rem', textAlign: 'center' }}>AÇIK</th>
                        <th style={{ width: '6%', padding: '0.65rem 0.35rem', fontSize: '0.74rem', textAlign: 'center' }}>KAPALI</th>
                        <th style={{ width: '6%', padding: '0.65rem 0.35rem', fontSize: '0.74rem', textAlign: 'center' }}>DBL</th>
                        <th style={{ width: '6%', padding: '0.65rem 0.35rem', fontSize: '0.74rem', textAlign: 'center' }}>SNG</th>
                        <th style={{ width: '6%', padding: '0.65rem 0.35rem', fontSize: '0.74rem', textAlign: 'center' }}>TOPLAM</th>
                        <th style={{ width: '7%', padding: '0.65rem 0.4rem', fontSize: '0.76rem', textAlign: 'right' }}>DETAY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeModal.items.map(f => (
                        <tr key={f.id}>
                          <td style={{ fontWeight: 700, color: 'var(--primary-color)', padding: '0.6rem', fontSize: '0.82rem', wordBreak: 'break-word' }}>
                            <div>{f.tesis}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                              {normalizeKategori(f.kategori) && (
                                <span className="badge badge-neutral" style={{ fontSize: '0.67rem', padding: '0.12rem 0.45rem' }}>
                                  {normalizeKategori(f.kategori)}
                                </span>
                              )}
                              {f.kapsamDurumu && (
                                <span
                                  className={`badge ${f.kapsamDurumu === 'KAPSAM DAHİLİNDE' ? 'badge-success' : 'badge-danger'}`}
                                  style={{ fontSize: '0.67rem', padding: '0.12rem 0.45rem' }}
                                >
                                  {f.kapsamDurumu}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '0.6rem 0.5rem', fontSize: '0.8rem' }}>{f.il || '-'}</td>
                          <td style={{ padding: '0.6rem 0.5rem', fontSize: '0.8rem', wordBreak: 'break-word' }}>{f.ilce || '-'}</td>
                          <td style={{ padding: '0.6rem 0.5rem', fontSize: '0.78rem' }}>{f.tesisTuru || '-'}</td>
                          <td style={{ padding: '0.6rem 0.35rem', fontSize: '0.82rem', textAlign: 'center' }}>{f.acikKort || 0}</td>
                          <td style={{ padding: '0.6rem 0.35rem', fontSize: '0.82rem', textAlign: 'center' }}>{f.kapaliKort || 0}</td>
                          <td style={{ padding: '0.6rem 0.35rem', fontSize: '0.82rem', textAlign: 'center' }}>{f.doubleKort || 0}</td>
                          <td style={{ padding: '0.6rem 0.35rem', fontSize: '0.82rem', textAlign: 'center' }}>{f.singleKort || 0}</td>
                          <td style={{ fontWeight: 700, color: 'var(--accent-lime)', padding: '0.6rem 0.35rem', fontSize: '0.84rem', textAlign: 'center' }}>
                            {getEffectiveToplamKort(f)}
                          </td>
                          <td style={{ padding: '0.6rem 0.4rem', textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                              onClick={() => navigate('/facility-report', { state: { selectedFacilityId: f.id } })}
                            >
                              <ExternalLink size={12} /> Rapor
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : activeModal.type === 'visited_facility' ? (
                <div className="table-container" style={{ overflowX: 'hidden' }}>
                  <table style={{ width: '100%', whiteSpace: 'normal', tableLayout: 'fixed' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '28%', padding: '0.65rem 0.6rem', fontSize: '0.76rem' }}>TESİS ADI</th>
                        <th style={{ width: '12%', padding: '0.65rem 0.5rem', fontSize: '0.76rem' }}>İL</th>
                        <th style={{ width: '14%', padding: '0.65rem 0.5rem', fontSize: '0.76rem' }}>İLÇE / BÖLGE</th>
                        <th style={{ width: '10%', padding: '0.65rem 0.5rem', fontSize: '0.76rem', textAlign: 'center' }}>ZİYARET</th>
                        <th style={{ width: '13%', padding: '0.65rem 0.5rem', fontSize: '0.76rem' }}>SON TARİH</th>
                        <th style={{ width: '15%', padding: '0.65rem 0.5rem', fontSize: '0.76rem' }}>SON SONUÇ</th>
                        <th style={{ width: '8%', padding: '0.65rem 0.4rem', fontSize: '0.76rem', textAlign: 'right' }}>DETAY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeModal.items.map(f => {
                        const facVisits = sortVisitsLatestFirst(
                          filteredVisits.filter(v => v.facilityId === f.id)
                        );
                        const latest = facVisits[0] || {};
                        return (
                          <tr key={f.id}>
                            <td style={{ fontWeight: 700, color: 'var(--primary-color)', padding: '0.6rem', fontSize: '0.82rem', wordBreak: 'break-word' }}>
                            <div>{f.tesis}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                              {normalizeKategori(f.kategori) && (
                                <span className="badge badge-neutral" style={{ fontSize: '0.67rem', padding: '0.12rem 0.45rem' }}>
                                  {normalizeKategori(f.kategori)}
                                </span>
                              )}
                              {f.kapsamDurumu && (
                                <span
                                  className={`badge ${f.kapsamDurumu === 'KAPSAM DAHİLİNDE' ? 'badge-success' : 'badge-danger'}`}
                                  style={{ fontSize: '0.67rem', padding: '0.12rem 0.45rem' }}
                                >
                                  {f.kapsamDurumu}
                                </span>
                              )}
                            </div>
                          </td>
                            <td style={{ padding: '0.6rem 0.5rem', fontSize: '0.8rem' }}>{f.il || '-'}</td>
                            <td style={{ padding: '0.6rem 0.5rem', fontSize: '0.8rem', wordBreak: 'break-word' }}>{f.ilce || '-'}</td>
                            <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                              <span className="badge badge-success">{facVisits.length}</span>
                            </td>
                            <td style={{ padding: '0.6rem 0.5rem', fontSize: '0.8rem' }}>{formatDateDisplay(latest.ziyaretTarihi)}</td>
                            <td style={{ padding: '0.6rem 0.5rem' }}>
                              {latest.ziyaretSonucu ? (
                                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{latest.ziyaretSonucu}</span>
                              ) : '-'}
                            </td>
                            <td style={{ padding: '0.6rem 0.4rem', textAlign: 'right' }}>
                              <button
                                type="button"
                                className="btn btn-outline"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                                onClick={() => navigate('/facility-report', { state: { selectedFacilityId: f.id } })}
                              >
                                <ExternalLink size={12} /> Rapor
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {groupVisitsByFacility(activeModal.items).map((group, groupIdx) => (
                    <div
                      key={group.key}
                      style={{
                        border: '1px solid var(--border-color)',
                        borderLeft: '3px solid var(--primary-color)',
                        borderRadius: '10px',
                        backgroundColor: 'var(--card-sub-bg)',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Tesis Grup Başlığı */}
                      <div style={{
                        padding: '0.7rem 1rem',
                        backgroundColor: 'var(--th-bg)',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            backgroundColor: 'var(--pill-bg)',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)'
                          }}>
                            #{groupIdx + 1}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--primary-color)' }}>
                            {group.tesisAdi}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            ({group.il}{group.ilce ? ` / ${group.ilce}` : ''})
                          </span>
                          {group.facility && normalizeKategori(group.facility.kategori) && (
                            <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                              {normalizeKategori(group.facility.kategori)}
                            </span>
                          )}
                          <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                            {group.visits.length} Görüşme
                          </span>
                        </div>

                        {group.facility && (
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '0.28rem 0.65rem', fontSize: '0.74rem' }}
                            onClick={() => navigate('/facility-report', { state: { selectedFacilityId: group.facility.id } })}
                          >
                            <ExternalLink size={12} /> Tesis Raporu
                          </button>
                        )}
                      </div>

                      {/* Tesise Ait Yapılan Görüşmeler Tablosu */}
                      <table style={{ width: '100%', whiteSpace: 'normal', tableLayout: 'fixed' }}>
                        <thead>
                          <tr>
                            <th style={{ width: '12%', padding: '0.5rem 0.75rem', fontSize: '0.73rem' }}>TARİH</th>
                            <th style={{ width: '11%', padding: '0.5rem 0.5rem', fontSize: '0.73rem' }}>EKİP</th>
                            <th style={{ width: '14%', padding: '0.5rem 0.5rem', fontSize: '0.73rem' }}>SEBEP / ŞEKİL</th>
                            <th style={{ width: '16%', padding: '0.5rem 0.5rem', fontSize: '0.73rem' }}>KONTAK KİŞİ</th>
                            <th style={{ width: '18%', padding: '0.5rem 0.5rem', fontSize: '0.73rem' }}>SONUÇ</th>
                            <th style={{ width: '29%', padding: '0.5rem 0.75rem', fontSize: '0.73rem' }}>AÇIKLAMA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.visits.map(v => (
                            <tr key={v.id}>
                              <td style={{ padding: '0.55rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}>
                                {formatDateDisplay(v.ziyaretTarihi)}
                              </td>
                              <td style={{ padding: '0.55rem 0.5rem' }}>
                                <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{v.ziyaretEden || '-'}</span>
                              </td>
                              <td style={{ padding: '0.55rem 0.5rem', fontSize: '0.78rem' }}>
                                {[v.ziyaretSebebi, v.gorusmeSekli].filter(Boolean).join(' / ') || '-'}
                              </td>
                              <td style={{ padding: '0.55rem 0.5rem', fontSize: '0.79rem', wordBreak: 'break-word' }}>
                                {v.kontakKisi || '-'}
                                {v.kontakUnvan ? <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}> ({v.kontakUnvan})</span> : ''}
                              </td>
                              <td style={{ padding: '0.55rem 0.5rem' }}>
                                {v.ziyaretSonucu ? (
                                  <span className={`badge ${v.ziyaretSonucu === 'TEKLİF VERİLDİ' ? 'badge-success' : v.ziyaretSonucu === 'OLUMSUZ' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.68rem', whiteSpace: 'normal', textAlign: 'center' }}>
                                    {v.ziyaretSonucu}
                                  </span>
                                ) : '-'}
                              </td>
                              <td style={{ padding: '0.55rem 0.75rem', fontSize: '0.8rem', wordBreak: 'break-word' }}>
                                {v.aciklama || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
