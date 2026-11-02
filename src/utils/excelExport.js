import * as XLSX from 'xlsx';

export const normalizeKategori = (raw) => {
  if (!raw) return '';
  const s = String(raw).trim().toUpperCase();
  if (s === '1' || s === '1*' || s === 'T1' || s === 'TI' || s === 'T 1') return 'T1';
  if (s === '2' || s === '2*' || s === 'T2' || s === 'T 2') return 'T2';
  if (s === '3' || s === '3*' || s === 'T3' || s === 'T 3') return 'T3';
  if (s.includes('TEST') || s.includes('DENEME')) return 'TEST / DENEME';
  return s;
};

export const TESIS_TEMPLATE_COLUMNS = [
  { header: 'SIRA', key: 'sir' },
  { header: 'KAYIT TARİHİ', key: 'kayitTarihi' },
  { header: 'TESİS', key: 'tesis' },
  { header: 'KATEGORİ', key: 'kategori' },
  { header: 'KAPSAM DURUMU', key: 'kapsamDurumu' },
  { header: 'İL', key: 'il' },
  { header: 'İLÇE/BÖLGE', key: 'ilce' },
  { header: 'TESİS TÜRÜ', key: 'tesisTuru' },
  { header: 'KORT VALIDATION', key: 'kortValidation' },
  { header: 'AÇIK KORT', key: 'acikKort' },
  { header: 'KAPALI KORT', key: 'kapaliKort' },
  { header: 'DOUBLE KORT', key: 'doubleKort' },
  { header: 'SINGLE KORT', key: 'singleKort' },
  { header: 'TOPLAM KORT', key: 'toplamKort' },
  { header: 'AÇILIŞ SAATİ', key: 'acilisSaati' },
  { header: 'KAPANIŞ SAATİ', key: 'kapanisSaati' },
  { header: 'KORT SAAT ÜCRETİ', key: 'kortSaatUcreti' },
  { header: 'PARA BİRİMİ', key: 'paraBirimi' },
  { header: 'AÇIK ADRES', key: 'acikAdres' },
  { header: 'WEB SİTESİ', key: 'webSitesi' },
  { header: 'KONTAK KİŞİ', key: 'kontakKisi' },
  { header: 'KONTAK UNVAN', key: 'kontakUnvan' },
  { header: 'TELEFON', key: 'telefon' },
  { header: 'E POSTA', key: 'eposta' },
  { header: 'AÇIKLAMA NOT', key: 'aciklamaNot' }
];

export const ZIYARET_TEMPLATE_COLUMNS = [
  { header: 'ZİYARET TARİHİ', key: 'ziyaretTarihi' },
  { header: 'TESİS', key: 'tesis' },
  { header: 'ZİYARET EDEN', key: 'ziyaretEden' },
  { header: 'ZİYARET SEBEBİ', key: 'ziyaretSebebi' },
  { header: 'GÖRÜŞME ŞEKLİ', key: 'gorusmeSekli' },
  { header: 'KONTAK KİŞİ', key: 'kontakKisi' },
  { header: 'KONTAK UNVAN', key: 'kontakUnvan' },
  { header: 'TELEFON', key: 'telefon' },
  { header: 'E POSTA', key: 'eposta' },
  { header: 'ZİYARET SONUCU', key: 'ziyaretSonucu' },
  { header: 'AÇIKLAMA', key: 'aciklama' }
];

export const FACILITY_EXCEL_COLUMNS = [
  ...TESIS_TEMPLATE_COLUMNS,
  { header: 'SON ZİYARET TARİHİ', key: 'sonZiyaretTarihi' },
  { header: 'SON ZİYARET SONUCU', key: 'sonZiyaretSonucu' }
];

export const getEffectiveToplamKort = (f) => {
  const acik = parseInt(f?.acikKort || 0) || 0;
  const kapali = parseInt(f?.kapaliKort || 0) || 0;
  if (acik + kapali > 0) {
    return acik + kapali;
  }
  return parseInt(f?.toplamKort || 0) || 0;
};

export const normalizeDateToISO = (val) => {
  if (val === undefined || val === null) return '';
  const str = String(val).trim();
  if (!str || str === 'Belirtilmedi' || str === '-') return '';

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // DD/MM/YYYY or DD.MM.YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, '0');
    const mm = dmyMatch[2].padStart(2, '0');
    const yyyy = dmyMatch[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  return str;
};

export const formatDateDisplay = (val) => {
  if (val === undefined || val === null) return '-';
  const str = String(val).trim();
  if (!str) return '-';
  if (str === 'Belirtilmedi') return 'Belirtilmedi';

  // YYYY-MM-DD -> DD/MM/YYYY
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }

  // DD.MM.YYYY or DD-MM-YYYY or DD/MM/YYYY -> DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, '0');
    const mm = dmyMatch[2].padStart(2, '0');
    const yyyy = dmyMatch[3];
    return `${dd}/${mm}/${yyyy}`;
  }

  return str;
};

const formatExcelDateValue = (val) => {
  if (val === undefined || val === null || String(val).trim() === '') {
    return '';
  }
  // Excel serial date number
  if (typeof val === 'number' && val > 20000 && val < 90000) {
    const utcDays = Math.floor(val - 25569);
    const dateObj = new Date(utcDays * 86400 * 1000);
    return dateObj.toISOString().split('T')[0];
  }
  return normalizeDateToISO(val) || String(val).trim();
};

export const downloadEmptyFacilityTemplate = () => {
  const wb = XLSX.utils.book_new();
  const headers = TESIS_TEMPLATE_COLUMNS.map(c => c.header);

  const ws = XLSX.utils.aoa_to_sheet([headers]);
  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 6, 16) }));
  XLSX.utils.book_append_sheet(wb, ws, 'Tesis Kayit Sablonu');

  XLSX.writeFile(wb, 'Banja_Tesis_Kayit_Sablonu.xlsx');
};

export const downloadEmptyVisitTemplate = (facilities = []) => {
  const wb = XLSX.utils.book_new();
  const headers = ZIYARET_TEMPLATE_COLUMNS.map(c => c.header);

  const ws = XLSX.utils.aoa_to_sheet([headers]);
  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 6, 18) }));
  XLSX.utils.book_append_sheet(wb, ws, 'Ziyaret Giris Sablonu');

  if (facilities.length > 0) {
    const refHeaders = ['SIRA', 'TESİS', 'İL', 'İLÇE/BÖLGE'];
    const refRows = facilities.map(f => [f.sir || '', f.tesis || '', f.il || '', f.ilce || '']);
    const wsRef = XLSX.utils.aoa_to_sheet([refHeaders, ...refRows]);
    wsRef['!cols'] = [{ wch: 10 }, { wch: 30 }, { wch: 16 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsRef, 'Kayitli Tesis Listesi');
  }

  XLSX.writeFile(wb, 'Banja_Ziyaret_Giris_Sablonu.xlsx');
};

export const parseExcelFacilities = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const today = new Date().toISOString().split('T')[0];

        const parsed = rawRows
          .map((row) => {
            const normalizedRow = {};
            Object.keys(row).forEach(k => {
              normalizedRow[k.trim().toLocaleUpperCase('tr-TR')] = row[k];
            });

            const getVal = (headerName) => {
              const norm = headerName.trim().toLocaleUpperCase('tr-TR');
              return normalizedRow[norm] !== undefined ? String(normalizedRow[norm]).trim() : '';
            };

            const tesisName = getVal('TESİS') || getVal('TESİS ADI') || getVal('TESIS');
            if (!tesisName) return null;

            const rawAcik = getVal('AÇIK KORT');
            const rawKapali = getVal('KAPALI KORT');
            const rawDouble = getVal('DOUBLE KORT') || getVal('DOULE KORT');
            const rawSingle = getVal('SINGLE KORT') || getVal('SİNGLE KORT');

            const acik = parseInt(rawAcik || '0') || 0;
            const kapali = parseInt(rawKapali || '0') || 0;
            const rawToplam = parseInt(getVal('TOPLAM KORT') || getVal('KORT SAYISI') || '0') || 0;
            const effectiveToplam = (acik + kapali) > 0 ? (acik + kapali) : rawToplam;

            const rawDate = formatExcelDateValue(normalizedRow['KAYIT TARİHİ']);
            const rawIl = getVal('İL');

            const rawKapsam = getVal('KAPSAM DURUMU') || getVal('KAPSAM');
            let normalizedKapsam = rawKapsam.toLocaleUpperCase('tr-TR');
            if (normalizedKapsam.includes('DAHİL') || normalizedKapsam.includes('DAHIL')) normalizedKapsam = 'KAPSAM DAHİLİNDE';
            else if (normalizedKapsam.includes('DIŞ') || normalizedKapsam.includes('DIS')) normalizedKapsam = 'KAPSAM DIŞI';

            return {
              sir: getVal('SIRA'),
              kayitTarihi: rawDate || today,
              tesis: tesisName,
              kategori: normalizeKategori(getVal('KATEGORİ')),
              kapsamDurumu: normalizedKapsam || '',
              il: rawIl ? rawIl.toLocaleUpperCase('tr-TR') : '',
              ilce: getVal('İLÇE/BÖLGE') || getVal('İLÇE') || '',
              tesisTuru: getVal('TESİS TÜRÜ') || '',
              kortValidation: getVal('KORT VALIDATION') || '',
              acikKort: rawAcik !== '' ? acik.toString() : '',
              kapaliKort: rawKapali !== '' ? kapali.toString() : '',
              doubleKort: rawDouble !== '' ? (parseInt(rawDouble) || 0).toString() : '',
              singleKort: rawSingle !== '' ? (parseInt(rawSingle) || 0).toString() : '',
              toplamKort: effectiveToplam,
              acilisSaati: getVal('AÇILIŞ SAATİ') || '',
              kapanisSaati: getVal('KAPANIŞ SAATİ') || '',
              kortSaatUcreti: getVal('KORT SAAT ÜCRETİ') || '',
              paraBirimi: getVal('PARA BİRİMİ') || '',
              acikAdres: getVal('AÇIK ADRES') || getVal('ADRES') || '',
              webSitesi: getVal('WEB SİTESİ') || '',
              kontakKisi: getVal('KONTAK KİŞİ') || '',
              kontakUnvan: getVal('KONTAK UNVAN') || '',
              telefon: getVal('TELEFON') || '',
              eposta: getVal('E POSTA') || getVal('E-POSTA') || '',
              aciklamaNot: getVal('AÇIKLAMA NOT') || getVal('AÇIKLAMA') || ''
            };
          })
          .filter(Boolean);

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

const normalizeHeaderKey = (str) => {
  return String(str || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleUpperCase('tr-TR');
};

const toAsciiKey = (str) => {
  return normalizeHeaderKey(str)
    .replace(/İ/g, 'I')
    .replace(/İ/g, 'I')
    .replace(/Ş/g, 'S')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C');
};

export const parseExcelVisits = (file, facilities = []) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const matchedVisits = [];
        const unmatchedFacilities = [];

        rawRows.forEach((row) => {
          const normalizedRow = {};
          const asciiRow = {};
          Object.keys(row).forEach(k => {
            const trKey = normalizeHeaderKey(k);
            const ascKey = toAsciiKey(k);
            normalizedRow[trKey] = row[k];
            asciiRow[ascKey] = row[k];
          });

          const getRawCell = (...headerNames) => {
            for (const h of headerNames) {
              const trKey = normalizeHeaderKey(h);
              if (normalizedRow[trKey] !== undefined && String(normalizedRow[trKey]).trim() !== '') {
                return normalizedRow[trKey];
              }
              const ascKey = toAsciiKey(h);
              if (asciiRow[ascKey] !== undefined && String(asciiRow[ascKey]).trim() !== '') {
                return asciiRow[ascKey];
              }
            }
            return '';
          };

          const getVal = (...headerNames) => {
            const val = getRawCell(...headerNames);
            return val !== undefined && val !== null ? String(val).trim() : '';
          };

          const tesisName = getVal('TESİS', 'TESİS ADI', 'TESIS', 'TESIS ADI');
          const siraVal = getVal('SIRA', 'SIRA NO');
          if (!tesisName && !siraVal) return;

          // Kayıtlı tesisi bul (isim veya sıra no ile)
          const normTarget = tesisName.toLocaleUpperCase('tr-TR');
          let matchedFac = facilities.find(
            f => (f.tesis || '').trim().toLocaleUpperCase('tr-TR') === normTarget
          );
          if (!matchedFac && siraVal) {
            matchedFac = facilities.find(f => String(f.sir) === String(siraVal));
          }
          if (!matchedFac && normTarget) {
            matchedFac = facilities.find(
              f => (f.tesis || '').trim().toLocaleUpperCase('tr-TR').includes(normTarget) ||
                   normTarget.includes((f.tesis || '').trim().toLocaleUpperCase('tr-TR'))
            );
          }

          if (!matchedFac) {
            unmatchedFacilities.push(tesisName || `Sıra #${siraVal}`);
            return;
          }

          const rawDateCell = getRawCell('ZİYARET TARİHİ', 'ZIYARET TARIHI', 'TARİH', 'TARIH');
          const rawDate = formatExcelDateValue(rawDateCell);
          // Tarih belli değilse "Belirtilmedi" olarak kaydet
          const ziyaretTarihi = rawDate || 'Belirtilmedi';

          const rawSebep = getVal('ZİYARET SEBEBİ', 'ZIYARET SEBEBI', 'SEBEP', 'ZİYARET AMACI', 'ZİYARET NEDENİ').toLocaleUpperCase('tr-TR');
          let normalizedSebep = rawSebep;
          if (rawSebep.includes('GÖRÜŞ') || rawSebep.includes('GORUS')) normalizedSebep = 'GÖRÜŞME';
          else if (rawSebep.includes('KEŞİF') || rawSebep.includes('KESIF')) normalizedSebep = 'KEŞİF';
          else if (rawSebep.includes('KURULUM')) normalizedSebep = 'KURULUM';

          const rawSekil = getVal('GÖRÜŞME ŞEKLİ', 'GORUSME SEKLI', 'GÖRÜŞME TÜRÜ', 'İLETİŞİM ŞEKLİ', 'KANAL').toLocaleUpperCase('tr-TR');
          let normalizedSekil = rawSekil;
          if (rawSekil.includes('TELEFON') || rawSekil === 'TEL') normalizedSekil = 'TELEFON';
          else if (rawSekil.includes('ONLİNE') || rawSekil.includes('ONLINE')) normalizedSekil = 'ONLİNE';
          else if (rawSekil.includes('YÜZ') || rawSekil.includes('YUZ')) normalizedSekil = 'YÜZ YÜZE';
          else if (rawSekil.includes('POSTA') || rawSekil.includes('MAİL') || rawSekil.includes('MAIL')) normalizedSekil = 'E POSTA';
          else if (rawSekil.includes('WHATSAPP') || rawSekil.includes('WP')) normalizedSekil = 'WHATSAPP';

          const rawSonuc = getVal('ZİYARET SONUCU', 'ZIYARET SONUCU', 'SONUÇ', 'SONUC').toLocaleUpperCase('tr-TR');
          let normalizedSonuc = rawSonuc;
          if (rawSonuc.includes('VERİLDİ') || rawSonuc.includes('VERILDI')) normalizedSonuc = 'TEKLİF VERİLDİ';
          else if (rawSonuc.includes('VERİLMEDİ') || rawSonuc.includes('VERILMEDI')) normalizedSonuc = 'TEKLİF VERİLMEDİ';
          else if (rawSonuc.includes('VERİLECEK') || rawSonuc.includes('VERILECEK')) normalizedSonuc = 'TEKLİF VERİLECEK';
          else if (rawSonuc.includes('OLUMSUZ')) normalizedSonuc = 'OLUMSUZ';
          else if (rawSonuc.includes('DEVAM')) normalizedSonuc = 'GÖRÜŞME DEVAM EDİYOR';

          matchedVisits.push({
            facilityId: matchedFac.id,
            tesisAdi: matchedFac.tesis,
            ziyaretTarihi,
            ziyaretEden: getVal('ZİYARET EDEN', 'ZIYARET EDEN', 'SAHA ÇALIŞANI', 'EKİP').toLocaleUpperCase('tr-TR'),
            ziyaretSebebi: normalizedSebep,
            gorusmeSekli: normalizedSekil,
            kontakKisi: getVal('KONTAK KİŞİ', 'KONTAK KISI', 'KONTAK'),
            kontakUnvan: getVal('KONTAK UNVAN', 'KONTAK ÜNVAN', 'UNVAN', 'ÜNVAN').toLocaleUpperCase('tr-TR'),
            telefon: getVal('TELEFON', 'TEL', 'GSM'),
            eposta: getVal('E POSTA', 'E-POSTA', 'EPOSTA', 'EMAIL', 'MAİL'),
            ziyaretSonucu: normalizedSonuc,
            aciklama: getVal('AÇIKLAMA', 'ACIKLAMA', 'AÇIKLAMA NOT', 'NOT')
          });
        });

        resolve({ matchedVisits, unmatchedFacilities });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

export const sortVisitsLatestFirst = (visitList = []) => {
  return [...visitList].sort((a, b) => {
    const dateA = normalizeDateToISO(a.ziyaretTarihi);
    const dateB = normalizeDateToISO(b.ziyaretTarihi);
    if (dateA && dateB) return dateB.localeCompare(dateA);
    if (dateB && !dateA) return 1;
    if (dateA && !dateB) return -1;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });
};

export const buildFacilityRows = (facilities, visits = []) => {
  const sorted = [...facilities].sort((a, b) => (parseInt(a.sir || 0) - parseInt(b.sir || 0)));
  return sorted.map(f => {
    const facilityVisits = sortVisitsLatestFirst(visits.filter(v => v.facilityId === f.id));
    const latestVisit = facilityVisits[0] || {};

    const rowData = {
      ...f,
      kayitTarihi: f.kayitTarihi ? formatDateDisplay(f.kayitTarihi) : '',
      toplamKort: getEffectiveToplamKort(f),
      sonZiyaretTarihi: latestVisit.ziyaretTarihi ? formatDateDisplay(latestVisit.ziyaretTarihi) : '',
      sonZiyaretSonucu: latestVisit.ziyaretSonucu || ''
    };

    const formattedRow = {};
    FACILITY_EXCEL_COLUMNS.forEach(col => {
      formattedRow[col.header] = rowData[col.key] ?? '';
    });
    return formattedRow;
  });
};

export const exportToExcel = (facilities, visits = [], fileName = 'Banja_Saha_Veriler.xlsx') => {
  const facilityRows = buildFacilityRows(facilities, visits);

  const wb = XLSX.utils.book_new();
  const headers = FACILITY_EXCEL_COLUMNS.map(c => c.header);

  const wsFacilities = XLSX.utils.json_to_sheet(facilityRows, { header: headers });
  wsFacilities['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 5, 16) }));
  XLSX.utils.book_append_sheet(wb, wsFacilities, 'Tesis Kayit');

  const visitRows = visits.map(v => {
    const fac = facilities.find(f => f.id === v.facilityId) || {};
    return {
      'ZİYARET TARİHİ': v.ziyaretTarihi ? formatDateDisplay(v.ziyaretTarihi) : '',
      'TESİS': fac.tesis || v.tesisAdi || '',
      'ZİYARET EDEN': v.ziyaretEden || '',
      'ZİYARET SEBEBİ': v.ziyaretSebebi || '',
      'GÖRÜŞME ŞEKLİ': v.gorusmeSekli || '',
      'KONTAK KİŞİ': v.kontakKisi || '',
      'KONTAK UNVAN': v.kontakUnvan || '',
      'TELEFON': v.telefon || '',
      'E POSTA': v.eposta || '',
      'ZİYARET SONUCU': v.ziyaretSonucu || '',
      'AÇIKLAMA': v.aciklama || ''
    };
  });

  const visitHeaders = ZIYARET_TEMPLATE_COLUMNS.map(c => c.header);
  const wsVisits = XLSX.utils.json_to_sheet(visitRows, { header: visitHeaders });
  wsVisits['!cols'] = visitHeaders.map(h => ({ wch: Math.max(h.length + 5, 18) }));
  XLSX.utils.book_append_sheet(wb, wsVisits, 'Ziyaret Giris');

  XLSX.writeFile(wb, fileName);
};

export const copyFacilitiesForExcel = async (facilities, visits = [], includeHeaders = true) => {
  const rows = buildFacilityRows(facilities, visits);
  const headers = FACILITY_EXCEL_COLUMNS.map(c => c.header);

  const lines = [];
  if (includeHeaders) {
    lines.push(headers.join('\t'));
  }

  rows.forEach(r => {
    const vals = headers.map(h => {
      const val = (r[h] ?? '').toString().replace(/[\r\n\t]+/g, ' ');
      return val;
    });
    lines.push(vals.join('\t'));
  });

  const tsvText = lines.join('\n');
  await navigator.clipboard.writeText(tsvText);
  return rows.length;
};
