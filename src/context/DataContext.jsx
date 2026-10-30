import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

const DEFAULT_EMPLOYEES = [
  { id: 'emp-1', name: 'ESRA' },
  { id: 'emp-2', name: 'EMRE' }
];

const FACILITIES_KEY = 'banja_saha_facilities_v4';
const VISITS_KEY = 'banja_saha_visits_v4';
const EMPLOYEES_KEY = 'banja_saha_employees_v3';
const AUTH_KEY = 'banja_saha_auth_v1';

async function apiRequest(method = 'GET', payload = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (payload) {
    options.body = JSON.stringify(payload);
  }
  const res = await fetch('/api/state', options);
  const data = await res.json();
  return { status: res.status, ...data };
}

export const DataProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(AUTH_KEY) === 'true';
  });

  const [cloudStatus, setCloudStatus] = useState('connecting'); // 'connecting' | 'synced' | 'offline'

  // Eski versiyonlardaki tüm tesis ve ziyaret verilerini temizle
  useEffect(() => {
    localStorage.removeItem('padel_crm_facilities');
    localStorage.removeItem('padel_crm_visits');
    localStorage.removeItem('banja_saha_facilities_v3');
    localStorage.removeItem('banja_saha_visits_v3');
  }, []);

  const [facilities, setFacilities] = useState(() => {
    const saved = localStorage.getItem(FACILITIES_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [visits, setVisits] = useState(() => {
    const saved = localStorage.getItem(VISITS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem(EMPLOYEES_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_EMPLOYEES;
  });

  useEffect(() => {
    localStorage.setItem(FACILITIES_KEY, JSON.stringify(facilities));
  }, [facilities]);

  useEffect(() => {
    localStorage.setItem(VISITS_KEY, JSON.stringify(visits));
  }, [visits]);

  useEffect(() => {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
  }, [employees]);

  const refreshCloudData = useCallback(async () => {
    try {
      const res = await apiRequest('GET');
      if (res.ok) {
        const localFac = JSON.parse(localStorage.getItem(FACILITIES_KEY) || '[]');
        const localVis = JSON.parse(localStorage.getItem(VISITS_KEY) || '[]');
        const localEmp = JSON.parse(localStorage.getItem(EMPLOYEES_KEY) || '[]');

        // Bulut veritabanı henüz boşsa ve tarayıcıda yüklenmiş veri varsa buluta aktar
        if (!res.initialized && (localFac.length > 0 || localVis.length > 0)) {
          await apiRequest('POST', {
            action: 'sync',
            facilities: localFac,
            visits: localVis,
            employees: localEmp.length > 0 ? localEmp : DEFAULT_EMPLOYEES
          });
          setCloudStatus('synced');
        } else {
          setFacilities(Array.isArray(res.facilities) ? res.facilities : []);
          setVisits(Array.isArray(res.visits) ? res.visits : []);
          if (Array.isArray(res.employees) && res.employees.length > 0) {
            setEmployees(res.employees);
          }
          setCloudStatus('synced');
        }
      } else {
        setCloudStatus('offline');
      }
    } catch {
      setCloudStatus('offline');
    }
  }, []);

  useEffect(() => {
    refreshCloudData();
    const handleFocus = () => {
      refreshCloudData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshCloudData]);

  const syncAction = async (payload) => {
    try {
      const res = await apiRequest('POST', payload);
      if (res.ok) {
        if (Array.isArray(res.facilities)) setFacilities(res.facilities);
        if (Array.isArray(res.visits)) setVisits(res.visits);
        if (Array.isArray(res.employees) && res.employees.length > 0) setEmployees(res.employees);
        setCloudStatus('synced');
      }
    } catch {
      setCloudStatus('offline');
    }
  };

  // --- Auth (Giriş Şifresi) ---
  const login = async (password) => {
    try {
      const res = await apiRequest('POST', { action: 'login', password });
      if (res.ok) {
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_KEY, 'true');
        return { ok: true };
      }
      return { ok: false, error: res.error || 'Hatalı şifre!' };
    } catch {
      // Çevrimdışı yedek kontrol
      if (String(password).trim().toLocaleLowerCase('tr-TR') === 'banja2026') {
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_KEY, 'true');
        return { ok: true };
      }
      return { ok: false, error: 'Giriş yapılamadı, şifreyi kontrol ediniz.' };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_KEY);
  };

  const changePassword = async (newPassword) => {
    try {
      const res = await apiRequest('POST', { action: 'change_password', newPassword });
      return res;
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  // --- Facilities ---
  const addFacility = (facility) => {
    const newFacility = {
      ...facility,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setFacilities(prev => {
      const next = [...prev, newFacility];
      syncAction({ action: 'sync', facilities: next });
      return next;
    });
    return newFacility;
  };

  const bulkAddFacilities = (items) => {
    setFacilities(prev => {
      let currentMaxSir = prev.reduce((max, r) => Math.max(max, parseInt(r.sir || 0) || 0), 0);
      const baseTime = Date.now();
      const prepared = items.map((item, idx) => {
        const providedSir = parseInt(item.sir || 0);
        const assignedSir = providedSir > 0 ? providedSir : (++currentMaxSir);
        if (providedSir > currentMaxSir) currentMaxSir = providedSir;
        return {
          ...item,
          sir: assignedSir.toString(),
          id: `${baseTime}-${idx}`,
          createdAt: new Date().toISOString()
        };
      });
      const next = [...prev, ...prepared];
      syncAction({ action: 'sync', facilities: next });
      return next;
    });
  };

  const updateFacility = (id, updatedData) => {
    setFacilities(prev => {
      const next = prev.map(f => f.id === id ? { ...f, ...updatedData } : f);
      syncAction({ action: 'update_facility', id, facility: updatedData });
      return next;
    });
  };

  const deleteFacility = (id) => {
    setFacilities(prev => prev.filter(f => f.id !== id));
    setVisits(prev => prev.filter(v => v.facilityId !== id));
    syncAction({ action: 'delete_facility', id });
  };

  // --- Visits ---
  const addVisit = (visit) => {
    const newVisit = {
      ...visit,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setVisits(prev => [newVisit, ...prev]);
    syncAction({ action: 'add_visit', visit: newVisit });
    return newVisit;
  };

  const bulkAddVisits = (visitItems) => {
    const baseTime = Date.now();
    const prepared = visitItems.map((item, idx) => ({
      ...item,
      id: `${baseTime}-v-${idx}`,
      createdAt: new Date().toISOString()
    }));

    let updatedEmployees = employees;
    const newEmpNames = Array.from(
      new Set(
        visitItems
          .map(v => (v.ziyaretEden || '').trim().toLocaleUpperCase('tr-TR'))
          .filter(Boolean)
      )
    );
    if (newEmpNames.length > 0) {
      const existingNames = new Set(employees.map(e => e.name.toLocaleUpperCase('tr-TR')));
      const additions = newEmpNames
        .filter(n => !existingNames.has(n))
        .map((n, i) => ({ id: `${baseTime}-emp-${i}`, name: n }));
      if (additions.length > 0) {
        updatedEmployees = [...employees, ...additions];
        setEmployees(updatedEmployees);
      }
    }

    setVisits(prev => {
      const next = [...prepared, ...prev];
      syncAction({ action: 'sync', visits: next, employees: updatedEmployees });
      return next;
    });
  };

  const updateVisit = (id, updatedData) => {
    setVisits(prev => prev.map(v => v.id === id ? { ...v, ...updatedData } : v));
    syncAction({ action: 'update_visit', id, visit: updatedData });
  };

  const deleteVisit = (id) => {
    setVisits(prev => prev.filter(v => v.id !== id));
    syncAction({ action: 'delete_visit', id });
  };

  const clearAllData = () => {
    setFacilities([]);
    setVisits([]);
    localStorage.removeItem(FACILITIES_KEY);
    localStorage.removeItem(VISITS_KEY);
    syncAction({ action: 'reset_all' });
  };

  // --- Employees (Saha Çalışanları) ---
  const addEmployee = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newEmp = { id: Date.now().toString(), name: trimmed };
    setEmployees(prev => {
      const next = [...prev, newEmp];
      syncAction({ action: 'save_employees', employees: next });
      return next;
    });
  };

  const updateEmployee = (id, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setEmployees(prev => {
      const next = prev.map(e => e.id === id ? { ...e, name: trimmed } : e);
      syncAction({ action: 'save_employees', employees: next });
      return next;
    });
  };

  const deleteEmployee = (id) => {
    setEmployees(prev => {
      const next = prev.filter(e => e.id !== id);
      syncAction({ action: 'save_employees', employees: next });
      return next;
    });
  };

  return (
    <DataContext.Provider value={{
      isAuthenticated, login, logout, changePassword,
      cloudStatus, refreshCloudData,
      facilities, addFacility, bulkAddFacilities, updateFacility, deleteFacility,
      visits, addVisit, bulkAddVisits, updateVisit, deleteVisit,
      employees, addEmployee, updateEmployee, deleteEmployee,
      clearAllData
    }}>
      {children}
    </DataContext.Provider>
  );
};
