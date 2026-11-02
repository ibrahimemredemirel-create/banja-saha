import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { List, X, ExternalLink } from 'lucide-react';
import { getEffectiveToplamKort, sortVisitsLatestFirst, formatDateDisplay, normalizeDateToISO } from '../utils/excelExport';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { facilities, visits } = useData();
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState('');
  const [activeModalKey, setActiveModalKey] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveModalKey(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const registeredCities = Array.from(
    new Set(facilities.map(f => (f.il || '').trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, 'tr'));

  const filteredFacilities = selectedCity
    ? facilities.filter(f => f.il === selectedCity)
    : facilities;

  const filteredVisits = visits.filter(v =>
    filteredFacilities.some(f => f.id === v.facilityId)
  );

  // Current YYYY-MM for "BU AY YAPILAN ZİYARET SAYISI"
  const currentYearMonth = new Date().toISOString().slice(0, 7);

  // Data subsets for each card
  const visitedFacilityIds = new Set(filteredVisits.map(v => v.facilityId));
  const visitedFacilitiesList = filteredFacilities.filter(f => visitedFacilityIds.has(f.id));

  const thisMonthVisitsList = sortVisitsLatestFirst(
    filteredVisits.filter(v => normalizeDateToISO(v.ziyaretTarihi).startsWith(currentYearMonth))
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
    }
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
                {selectedCity ? `${selectedCity} Saha Raporu` : 'Tüm Türkiye Saha ve Kort Dashboard'}
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>İL FİLTRESİ:</label>
              <select
                className="form-control"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                style={{ minWidth: '180px', padding: '0.45rem 0.75rem' }}
              >
                <option value="">TÜM İLLER</option>
                {registeredCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
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
            <div className="stat-card" style={{ backgroundColor: '#0a161d', borderLeft: '3px solid #00d2ff' }}>
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

            <div className="stat-card" style={{ backgroundColor: '#0a161d', borderLeft: '3px solid #b6ff00' }}>
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

            <div className="stat-card" style={{ backgroundColor: '#0a161d', borderLeft: '3px solid #38bdf8' }}>
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

            <div className="stat-card" style={{ backgroundColor: '#0a161d', borderLeft: '3px solid #f87171' }}>
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
                  {selectedCity ? `${selectedCity} FİLTRESİ AKTİF` : 'DETAYLI KAYIT LİSTESİ'}
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
                  background: '#13242f',
                  border: '1px solid #243e4f',
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
                          <td style={{ fontWeight: 700, color: 'var(--primary-color)', padding: '0.6rem', fontSize: '0.82rem', wordBreak: 'break-word' }}>{f.tesis}</td>
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
                            <td style={{ fontWeight: 700, color: 'var(--primary-color)', padding: '0.6rem', fontSize: '0.82rem', wordBreak: 'break-word' }}>{f.tesis}</td>
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
                        backgroundColor: '#0b161e',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Tesis Grup Başlığı */}
                      <div style={{
                        padding: '0.7rem 1rem',
                        backgroundColor: '#0f202b',
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
                            backgroundColor: '#091319',
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
                            <th style={{ width: '13%', padding: '0.5rem 0.75rem', fontSize: '0.73rem' }}>TARİH</th>
                            <th style={{ width: '11%', padding: '0.5rem 0.5rem', fontSize: '0.73rem' }}>EKİP</th>
                            <th style={{ width: '12%', padding: '0.5rem 0.5rem', fontSize: '0.73rem' }}>SEBEP</th>
                            <th style={{ width: '16%', padding: '0.5rem 0.5rem', fontSize: '0.73rem' }}>KONTAK KİŞİ</th>
                            <th style={{ width: '18%', padding: '0.5rem 0.5rem', fontSize: '0.73rem' }}>SONUÇ</th>
                            <th style={{ width: '30%', padding: '0.5rem 0.75rem', fontSize: '0.73rem' }}>AÇIKLAMA</th>
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
                                {v.ziyaretSebebi || '-'}
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
