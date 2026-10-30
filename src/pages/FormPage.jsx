import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Save } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ilIlceData } from '../data/iller';

const FormPage = () => {
  const { records, addRecord, updateRecord } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const editingRecord = location.state?.record;

  const [formData, setFormData] = useState({
    oncelik: 'Orta',
    sir: '',
    il: '',
    ilce: '',
    tesis: '',
    kortValidasyon: 'TBC',
    ziyaretDurumu: 'ESRA',
    tesisTuru: 'Açık',
    kortAdedi: '',
    adres: '',
    telefon: '',
    eposta: '',
    kontakKisi: '',
    kontakRolu: '',
    resmiWeb: '',
    kaynakUrl: '',
    dogrulamaNotu: '',
    sonKontrol: '',
    iletisimDurumu: 'Beklemede'
  });

  const [availableIlceler, setAvailableIlceler] = useState([]);

  useEffect(() => {
    if (editingRecord) {
      setFormData(editingRecord);
      const selectedIl = ilIlceData.find(i => i.il === editingRecord.il);
      setAvailableIlceler(selectedIl ? selectedIl.ilceleri : []);
    } else {
      // Otomatik Sıra No belirleme
      const maxSir = records.reduce((max, r) => Math.max(max, parseInt(r.sir || 0)), 0);
      setFormData(prev => ({ ...prev, sir: (maxSir + 1).toString() }));
    }
  }, [editingRecord, records]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'il') {
      const selectedIl = ilIlceData.find(i => i.il === value);
      setAvailableIlceler(selectedIl ? selectedIl.ilceleri : []);
      setFormData(prev => ({ ...prev, il: value, ilce: '' })); // İli değişince ilçeyi sıfırla
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingRecord) {
      updateRecord(editingRecord.id, formData);
      alert('Kayıt başarıyla güncellendi!');
      navigate('/dashboard'); // Güncelleme sonrası dashboard'a dön
    } else {
      addRecord(formData);
      alert('Kayıt başarıyla eklendi!');
      const maxSir = records.reduce((max, r) => Math.max(max, parseInt(r.sir || 0)), 0);
      setFormData({
        oncelik: 'Orta', sir: (maxSir + 2).toString(), il: '', ilce: '', tesis: '', 
        kortValidasyon: 'TBC', ziyaretDurumu: 'ESRA', tesisTuru: 'Açık', kortAdedi: '', 
        adres: '', telefon: '', eposta: '', kontakKisi: '', kontakRolu: '', 
        resmiWeb: '', kaynakUrl: '', dogrulamaNotu: '', sonKontrol: '', iletisimDurumu: 'Beklemede'
      });
      setAvailableIlceler([]);
    }
  };

  return (
    <div>
      <div className="header-flex">
        <div>
          <h1 style={{ color: 'var(--primary-color)' }}>
            {editingRecord ? 'Tesis Ziyareti Güncelle' : 'Saha Ziyareti Girişi'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {editingRecord ? 'Mevcut kaydı düzenliyorsunuz.' : 'Tesis bilgilerini ve ziyaret detaylarını aşağıdan girebilirsiniz.'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleSubmit} type="button">
          <Save size={18} />
          {editingRecord ? 'Güncelle' : 'Kaydet'}
        </button>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Temel Bilgiler</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Öncelik</label>
            <select className="form-control" name="oncelik" value={formData.oncelik} onChange={handleChange}>
              <option>Düşük</option>
              <option>Orta</option>
              <option>Yüksek</option>
            </select>
          </div>
          <div className="form-group">
            <label>Sır (No)</label>
            <input type="text" className="form-control" name="sir" value={formData.sir} disabled style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} title="Sıra numarası otomatik atanır." />
          </div>
          <div className="form-group">
            <label>İl</label>
            <select className="form-control" name="il" value={formData.il} onChange={handleChange} required>
              <option value="">İl Seçiniz</option>
              {ilIlceData.map(il => (
                <option key={il.il} value={il.il}>{il.il}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>İlçe / Bölge</label>
            <select className="form-control" name="ilce" value={formData.ilce} onChange={handleChange} required disabled={!formData.il}>
              <option value="">İlçe Seçiniz</option>
              {availableIlceler.map(ilce => (
                <option key={ilce} value={ilce}>{ilce}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Tesis Adı</label>
            <input type="text" className="form-control" name="tesis" value={formData.tesis} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Tesis Türü</label>
            <select className="form-control" name="tesisTuru" value={formData.tesisTuru} onChange={handleChange}>
              <option>Açık</option>
              <option>Kapalı</option>
              <option>Karma</option>
            </select>
          </div>
          <div className="form-group">
            <label>Kort Adedi</label>
            <input type="number" className="form-control" name="kortAdedi" value={formData.kortAdedi} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Kort Validasyon</label>
            <select className="form-control" name="kortValidasyon" value={formData.kortValidasyon} onChange={handleChange}>
              <option>TBC</option>
              <option>VAR</option>
              <option>YOK</option>
            </select>
          </div>
        </div>

        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', margin: '2rem 0 1.5rem' }}>İletişim & Durum</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Ziyaret Durumu</label>
            <select className="form-control" name="ziyaretDurumu" value={formData.ziyaretDurumu} onChange={handleChange}>
              <option>ESRA</option>
              <option>EMRE</option>
            </select>
          </div>
          <div className="form-group">
            <label>İletişim Durumu</label>
            <select className="form-control" name="iletisimDurumu" value={formData.iletisimDurumu} onChange={handleChange}>
              <option>Beklemede</option>
              <option>Ulaşılamadı</option>
              <option>İletişim Kuruldu</option>
              <option>Olumlu</option>
              <option>Olumsuz</option>
            </select>
          </div>
          <div className="form-group">
            <label>Telefon</label>
            <input type="text" className="form-control" name="telefon" value={formData.telefon} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>E-posta</label>
            <input type="email" className="form-control" name="eposta" value={formData.eposta} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Kontak Kişi (Kamuya Açık)</label>
            <input type="text" className="form-control" name="kontakKisi" value={formData.kontakKisi} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Kontak Rolü</label>
            <input type="text" className="form-control" name="kontakRolu" value={formData.kontakRolu} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Resmî Web</label>
            <input type="url" className="form-control" name="resmiWeb" value={formData.resmiWeb} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Kaynak URL</label>
            <input type="url" className="form-control" name="kaynakUrl" value={formData.kaynakUrl} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Son Kontrol Tarihi</label>
            <input type="date" className="form-control" name="sonKontrol" value={formData.sonKontrol} onChange={handleChange} />
          </div>
        </div>

        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', margin: '2rem 0 1.5rem' }}>Ek Detaylar</h3>
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="form-group">
            <label>Adres</label>
            <textarea className="form-control" name="adres" value={formData.adres} onChange={handleChange}></textarea>
          </div>
          <div className="form-group">
            <label>Doğrulama Notu</label>
            <textarea className="form-control" name="dogrulamaNotu" value={formData.dogrulamaNotu} onChange={handleChange}></textarea>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FormPage;
