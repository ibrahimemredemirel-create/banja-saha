import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Save, FileSpreadsheet, Upload } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { downloadEmptyFacilityTemplate, parseExcelFacilities, getEffectiveToplamKort, normalizeDateToISO } from '../utils/excelExport';

const KATEGORILER = ['T1', 'T2', 'T3', 'TEST / DENEME'];
const ILLER = [
  'İSTANBUL',
  'ANKARA',
  'İZMİR',
  'ADANA',
  'ADIYAMAN',
  'AFYONKARAHİSAR',
  'AĞRI',
  'AKSARAY',
  'AMASYA',
  'ANTALYA',
  'ARDAHAN',
  'ARTVİN',
  'AYDIN',
  'BALIKESİR',
  'BARTIN',
  'BATMAN',
  'BAYBURT',
  'BİLECİK',
  'BİNGÖL',
  'BİTLİS',
  'BOLU',
  'BURDUR',
  'BURSA',
  'ÇANAKKALE',
  'ÇANKIRI',
  'ÇORUM',
  'DENİZLİ',
  'DİYARBAKIR',
  'DÜZCE',
  'EDİRNE',
  'ELAZIĞ',
  'ERZİNCAN',
  'ERZURUM',
  'ESKİŞEHİR',
  'GAZİANTEP',
  'GİRESUN',
  'GÜMÜŞHANE',
  'HAKKARİ',
  'HATAY',
  'IĞDIR',
  'ISPARTA',
  'KAHRAMANMARAŞ',
  'KARABÜK',
  'KARAMAN',
  'KARS',
  'KASTAMONU',
  'KAYSERİ',
  'KIRIKKALE',
  'KIRKLARELİ',
  'KIRŞEHİR',
  'KİLİS',
  'KOCAELİ',
  'KONYA',
  'KÜTAHYA',
  'MALATYA',
  'MANİSA',
  'MARDİN',
  'MERSİN',
  'MUĞLA',
  'MUŞ',
  'NEVŞEHİR',
  'NİĞDE',
  'ORDU',
  'OSMANİYE',
  'RİZE',
  'SAKARYA',
  'SAMSUN',
  'SİİRT',
  'SİNOP',
  'SİVAS',
  'ŞANLIURFA',
  'ŞIRNAK',
  'TEKİRDAĞ',
  'TOKAT',
  'TRABZON',
  'TUNCELİ',
  'UŞAK',
  'VAN',
  'YALOVA',
  'YOZGAT',
  'ZONGULDAK'
];
const TESIS_TURLERI = [
  'PADEL KORTU',
  'TENİS KULÜBÜ',
  'SPOR KULÜBÜ / WELLNESS',
  'AKADEMİ',
  'OTEL',
  'KAMU KURUMU'
];
const KORT_VALIDATIONS = ['TBC', 'VAR', 'YOK'];
const PARA_BIRIMLERI = ['TL', 'EURO', 'DOLAR'];
const KONTAK_UNVANLAR = ['İŞLETME SAHİBİ', 'İŞLETMECİ', 'ANTRENÖR', 'ÇALIŞAN'];

const formatPhoneInput = (val) => {
  // Allow only digits and spaces/phone formatting
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  if (digits.length <= 9) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
};

const getInitialState = (nextSir) => ({
  sir: nextSir,
  kayitTarihi: new Date().toISOString().split('T')[0],
  tesis: '',
  kategori: '',
  il: '',
  ilce: '',
  tesisTuru: '',
  kortValidation: '',
  acikKort: '',
  kapaliKort: '',
  doubleKort: '',
  singleKort: '',
  toplamKort: 0,
  acilisSaati: '',
  kapanisSaati: '',
  kortSaatUcreti: '',
  paraBirimi: '',
  acikAdres: '',
  webSitesi: '',
  kontakKisi: '',
  kontakUnvan: '',
  telefon: '',
  eposta: '',
  aciklamaNot: ''
});

const FacilityFormPage = () => {
  const { facilities, addFacility, bulkAddFacilities, updateFacility } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const editingFacility = location.state?.facility;
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState(() => getInitialState('1'));

  useEffect(() => {
    if (editingFacility) {
      setFormData({
        ...getInitialState(editingFacility.sir || '1'),
        ...editingFacility,
        kayitTarihi: normalizeDateToISO(editingFacility.kayitTarihi) || new Date().toISOString().split('T')[0],
        toplamKort: getEffectiveToplamKort(editingFacility)
      });
    } else {
      const maxSir = facilities.reduce((max, r) => Math.max(max, parseInt(r.sir || 0) || 0), 0);
      setFormData(getInitialState((maxSir + 1).toString()));
    }
  }, [editingFacility, facilities]);

  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsedItems = await parseExcelFacilities(file);
      if (parsedItems.length === 0) {
        alert('Yüklenen Excel dosyasında geçerli tesis satırı bulunamadı.');
        return;
      }
      bulkAddFacilities(parsedItems);
      alert(`${parsedItems.length} adet tesis kaydı Excel'den tek seferde başarıyla eklendi!`);
      navigate('/manage-facilities');
    } catch (err) {
      alert('Excel dosyası okunurken bir hata oluştu: ' + err.message);
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

    if (name === 'acikKort' || name === 'kapaliKort') {
      const nextVal = value === '' ? '' : Math.max(0, parseInt(value) || 0).toString();
      setFormData(prev => {
        const nextAcik = name === 'acikKort' ? (parseInt(nextVal) || 0) : (parseInt(prev.acikKort) || 0);
        const nextKapali = name === 'kapaliKort' ? (parseInt(nextVal) || 0) : (parseInt(prev.kapaliKort) || 0);
        return {
          ...prev,
          [name]: nextVal,
          toplamKort: nextAcik + nextKapali
        };
      });
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      toplamKort: getEffectiveToplamKort(formData)
    };

    if (editingFacility) {
      updateFacility(editingFacility.id, payload);
      alert('Tesis kaydı başarıyla güncellendi!');
      navigate('/manage-facilities');
    } else {
      addFacility(payload);
      alert('Yeni tesis kaydı başarıyla eklendi!');
      const maxSir = facilities.reduce((max, r) => Math.max(max, parseInt(r.sir || 0) || 0), 0);
      setFormData(getInitialState((maxSir + 2).toString()));
    }
  };

  return (
    <div>
      <form className="form-card" onSubmit={handleSubmit}>
        <div className="header-flex" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <span className="section-label">TESİS KAYIT FORMU</span>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>
              {editingFacility ? `Tesis Kaydı Düzenle (${formData.tesis})` : 'Yeni Tesis Kayıt'}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={handleExcelUpload}
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={downloadEmptyFacilityTemplate}
              title="Tesis girişi için sütun başlıkları hazır boş Excel şablonunu indir"
            >
              <FileSpreadsheet size={16} />
              Boş Excel Şablonu İndir
            </button>
            <button
              type="button"
              className="btn btn-lime"
              onClick={() => fileInputRef.current?.click()}
              title="Doldurduğunuz Excel dosyasındaki tüm tesisleri tek seferde kaydedin"
            >
              <Upload size={16} />
              Excel'den Toplu Yükle
            </button>
            <button className="btn btn-primary" type="submit">
              <Save size={16} />
              Kaydet
            </button>
          </div>
        </div>

        <div className="banja-gradient-line">
          <div className="banja-gradient-fill" style={{ width: '100%' }} />
        </div>

        <div className="form-grid">
          {/* 1. SIRA */}
          <div className="form-group">
            <label>SIRA (OTOMATİK ID)</label>
            <input
              type="text"
              className="form-control"
              name="sir"
              value={formData.sir}
              readOnly
              disabled
            />
          </div>

          {/* 2. KAYIT TARİHİ */}
          <div className="form-group">
            <label>KAYIT TARİHİ</label>
            <input
              type="date"
              className="form-control"
              name="kayitTarihi"
              value={formData.kayitTarihi}
              onChange={handleChange}
              required
            />
          </div>

          {/* 3. TESİS */}
          <div className="form-group">
            <label>TESİS</label>
            <input
              type="text"
              className="form-control"
              name="tesis"
              value={formData.tesis}
              onChange={handleChange}
              placeholder="Tesis adını giriniz..."
              required
            />
          </div>

          {/* 4. KATEGORİ */}
          <div className="form-group">
            <label>KATEGORİ</label>
            <select className="form-control" name="kategori" value={formData.kategori} onChange={handleChange}>
              <option value="">Seçiniz...</option>
              {KATEGORILER.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          {/* 5. İL */}
          <div className="form-group">
            <label>İL</label>
            <select className="form-control" name="il" value={formData.il} onChange={handleChange}>
              <option value="">Seçiniz...</option>
              {ILLER.map(il => <option key={il} value={il}>{il}</option>)}
            </select>
          </div>

          {/* 6. İLÇE/BÖLGE */}
          <div className="form-group">
            <label>İLÇE / BÖLGE</label>
            <input
              type="text"
              className="form-control"
              name="ilce"
              value={formData.ilce}
              onChange={handleChange}
              placeholder="İlçe veya bölge yazınız..."
            />
          </div>

          {/* 7. TESİS TÜRÜ */}
          <div className="form-group">
            <label>TESİS TÜRÜ</label>
            <select className="form-control" name="tesisTuru" value={formData.tesisTuru} onChange={handleChange}>
              <option value="">Seçiniz...</option>
              {TESIS_TURLERI.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* 8. KORT VALIDATION */}
          <div className="form-group">
            <label>KORT VALIDATION</label>
            <select className="form-control" name="kortValidation" value={formData.kortValidation} onChange={handleChange}>
              <option value="">Seçiniz...</option>
              {KORT_VALIDATIONS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {/* 9. AÇIK KORT */}
          <div className="form-group">
            <label>AÇIK KORT (SAYI)</label>
            <input
              type="number"
              min="0"
              className="form-control"
              name="acikKort"
              value={formData.acikKort}
              onChange={handleChange}
            />
          </div>

          {/* 10. KAPALI KORT */}
          <div className="form-group">
            <label>KAPALI KORT (SAYI)</label>
            <input
              type="number"
              min="0"
              className="form-control"
              name="kapaliKort"
              value={formData.kapaliKort}
              onChange={handleChange}
            />
          </div>

          {/* 11. DOUBLE KORT */}
          <div className="form-group">
            <label>DOUBLE KORT (SAYI)</label>
            <input
              type="number"
              min="0"
              className="form-control"
              name="doubleKort"
              value={formData.doubleKort}
              onChange={handleChange}
            />
          </div>

          {/* 12. SINGLE KORT */}
          <div className="form-group">
            <label>SINGLE KORT (SAYI)</label>
            <input
              type="number"
              min="0"
              className="form-control"
              name="singleKort"
              value={formData.singleKort}
              onChange={handleChange}
            />
          </div>

          {/* 13. TOPLAM KORT */}
          <div className="form-group">
            <label>TOPLAM KORT</label>
            <input
              type="number"
              className="form-control"
              name="toplamKort"
              value={getEffectiveToplamKort(formData)}
              readOnly
              disabled
            />
          </div>

          {/* 14. AÇILIŞ SAATİ */}
          <div className="form-group">
            <label>AÇILIŞ SAATİ</label>
            <input
              type="time"
              className="form-control"
              name="acilisSaati"
              value={formData.acilisSaati}
              onChange={handleChange}
            />
          </div>

          {/* 15. KAPANIŞ SAATİ */}
          <div className="form-group">
            <label>KAPANIŞ SAATİ</label>
            <input
              type="time"
              className="form-control"
              name="kapanisSaati"
              value={formData.kapanisSaati}
              onChange={handleChange}
            />
          </div>

          {/* 16. KORT SAAT ÜCRETİ + PARA BİRİMİ */}
          <div className="form-group">
            <label>KORT SAAT ÜCRETİ</label>
            <div style={{ display: 'flex', gap: '0.45rem', width: '100%' }}>
              <input
                type="number"
                min="0"
                className="form-control"
                name="kortSaatUcreti"
                value={formData.kortSaatUcreti}
                onChange={handleChange}
                placeholder="Ücret"
                style={{ flex: '1 1 auto', minWidth: 0, width: '100%' }}
              />
              <select
                className="form-control"
                name="paraBirimi"
                value={formData.paraBirimi}
                onChange={handleChange}
                style={{ width: '88px', flexShrink: 0, padding: '0.65rem 0.5rem' }}
              >
                <option value="">Seçiniz</option>
                {PARA_BIRIMLERI.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* 18. WEB SİTESİ */}
          <div className="form-group">
            <label>WEB SİTESİ</label>
            <input
              type="text"
              className="form-control"
              name="webSitesi"
              value={formData.webSitesi}
              onChange={handleChange}
              placeholder="www.ornek.com"
            />
          </div>

          {/* 19. KONTAK KİŞİ */}
          <div className="form-group">
            <label>KONTAK KİŞİ</label>
            <input
              type="text"
              className="form-control"
              name="kontakKisi"
              value={formData.kontakKisi}
              onChange={handleChange}
              placeholder="Ad Soyad"
            />
          </div>

          {/* 20. KONTAK UNVAN */}
          <div className="form-group">
            <label>KONTAK UNVAN</label>
            <select className="form-control" name="kontakUnvan" value={formData.kontakUnvan} onChange={handleChange}>
              <option value="">Seçiniz...</option>
              {KONTAK_UNVANLAR.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* 21. TELEFON */}
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

          {/* 22. E POSTA */}
          <div className="form-group">
            <label>E POSTA</label>
            <input
              type="email"
              className="form-control"
              name="eposta"
              value={formData.eposta}
              onChange={handleChange}
              placeholder="iletisim@tesis.com"
            />
          </div>
        </div>

        {/* 17. AÇIK ADRES & 23. AÇIKLAMA NOT */}
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '1.25rem' }}>
          <div className="form-group">
            <label>AÇIK ADRES</label>
            <textarea
              className="form-control"
              name="acikAdres"
              value={formData.acikAdres}
              onChange={handleChange}
              placeholder="Tesisin açık adresini giriniz..."
              rows={4}
            />
          </div>
          <div className="form-group">
            <label>AÇIKLAMA NOT</label>
            <textarea
              className="form-control"
              name="aciklamaNot"
              value={formData.aciklamaNot}
              onChange={handleChange}
              placeholder="Tesis hakkında detaylı açıklama ve notlar..."
              rows={4}
            />
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" type="submit">
            <Save size={16} />
            Kaydet
          </button>
        </div>
      </form>
    </div>
  );
};

export default FacilityFormPage;
