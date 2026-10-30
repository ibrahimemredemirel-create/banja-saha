import fs from 'fs';
import path from 'path';

const DEFAULT_EMPLOYEES = [
  { id: 'emp-1', name: 'EMRE' },
  { id: 'emp-2', name: 'ESRA' },
  { id: 'emp-3', name: 'BARIŞ' }
];

const DEFAULT_PASSWORD = process.env.APP_PASSWORD || 'banja2026';

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL.replace(/^["']|["']$/g, '').trim();
  }
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/^DATABASE_URL=(.+)$/m);
      if (match) {
        return match[1].replace(/^["']|["']$/g, '').trim();
      }
    }
  } catch {
    // ignore
  }
  return '';
}

async function neonQuery(query, params = []) {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    throw new Error('DATABASE_URL tanımlı değil');
  }
  const parsed = new URL(dbUrl);
  const endpoint = `https://${parsed.hostname}/sql`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Neon-Connection-String': dbUrl,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, params })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Neon SQL hatası (${response.status}): ${errText}`);
  }

  return response.json();
}

let tableInitialized = false;

async function ensureTable() {
  if (tableInitialized) return;
  await neonQuery(`
    CREATE TABLE IF NOT EXISTS banja_saha_store (
      key TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  tableInitialized = true;
}

async function getStoreMap() {
  await ensureTable();
  const res = await neonQuery(`SELECT key, data FROM banja_saha_store;`);
  const map = {};
  for (const row of res.rows || []) {
    map[row.key] = row.data;
  }
  return map;
}

async function setStoreKey(key, value) {
  await ensureTable();
  await neonQuery(
    `INSERT INTO banja_saha_store (key, data, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
    [key, JSON.stringify(value)]
  );
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const store = await getStoreMap();
      const hasFacilitiesKey = Object.prototype.hasOwnProperty.call(store, 'facilities');
      const hasVisitsKey = Object.prototype.hasOwnProperty.call(store, 'visits');

      const facilities = Array.isArray(store.facilities) ? store.facilities : [];
      const visits = Array.isArray(store.visits) ? store.visits : [];
      const employees = Array.isArray(store.employees) && store.employees.length > 0
        ? store.employees
        : DEFAULT_EMPLOYEES;

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        ok: true,
        initialized: hasFacilitiesKey || hasVisitsKey,
        facilities,
        visits,
        employees
      }));
      return;
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body || '{}');
      } else if (!body) {
        body = await new Promise((resolve) => {
          let raw = '';
          req.on('data', chunk => { raw += chunk; });
          req.on('end', () => {
            try {
              resolve(JSON.parse(raw || '{}'));
            } catch {
              resolve({});
            }
          });
        });
      }

      const { action } = body;
      const store = await getStoreMap();

      const currentFacilities = Array.isArray(store.facilities) ? store.facilities : [];
      const currentVisits = Array.isArray(store.visits) ? store.visits : [];
      const currentEmployees = Array.isArray(store.employees) && store.employees.length > 0
        ? store.employees
        : DEFAULT_EMPLOYEES;
      const currentPassword = store.auth?.password || DEFAULT_PASSWORD;

      if (action === 'login') {
        const inputPass = String(body.password || '').trim();
        if (inputPass.toLocaleLowerCase('tr-TR') === String(currentPassword).trim().toLocaleLowerCase('tr-TR')) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true }));
        } else {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: 'Girdiğiniz şifre hatalı!' }));
        }
        return;
      }

      if (action === 'change_password') {
        const newPassword = String(body.newPassword || '').trim();
        if (!newPassword || newPassword.length < 3) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: 'Şifre en az 3 karakter olmalıdır.' }));
          return;
        }
        await setStoreKey('auth', { password: newPassword });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      if (action === 'sync') {
        if (Array.isArray(body.facilities)) {
          await setStoreKey('facilities', body.facilities);
        }
        if (Array.isArray(body.visits)) {
          await setStoreKey('visits', body.visits);
        }
        if (Array.isArray(body.employees)) {
          await setStoreKey('employees', body.employees);
        }
      } else if (action === 'add_facility') {
        const next = [body.facility, ...currentFacilities];
        await setStoreKey('facilities', next);
      } else if (action === 'bulk_add_facilities') {
        const incoming = Array.isArray(body.facilities) ? body.facilities : [];
        const next = [...incoming, ...currentFacilities];
        await setStoreKey('facilities', next);
      } else if (action === 'update_facility') {
        const next = currentFacilities.map(f => f.id === body.id ? { ...f, ...body.facility, id: body.id } : f);
        await setStoreKey('facilities', next);
      } else if (action === 'delete_facility') {
        const nextFac = currentFacilities.filter(f => f.id !== body.id);
        const nextVis = currentVisits.filter(v => v.facilityId !== body.id);
        await setStoreKey('facilities', nextFac);
        await setStoreKey('visits', nextVis);
      } else if (action === 'add_visit') {
        const next = [body.visit, ...currentVisits];
        await setStoreKey('visits', next);
      } else if (action === 'bulk_add_visits') {
        const incoming = Array.isArray(body.visits) ? body.visits : [];
        const next = [...incoming, ...currentVisits];
        await setStoreKey('visits', next);
      } else if (action === 'update_visit') {
        const next = currentVisits.map(v => v.id === body.id ? { ...v, ...body.visit, id: body.id } : v);
        await setStoreKey('visits', next);
      } else if (action === 'delete_visit') {
        const next = currentVisits.filter(v => v.id !== body.id);
        await setStoreKey('visits', next);
      } else if (action === 'save_employees') {
        if (Array.isArray(body.employees)) {
          await setStoreKey('employees', body.employees);
        }
      } else if (action === 'reset_all') {
        await setStoreKey('facilities', []);
        await setStoreKey('visits', []);
      }

      const updated = await getStoreMap();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        ok: true,
        facilities: Array.isArray(updated.facilities) ? updated.facilities : currentFacilities,
        visits: Array.isArray(updated.visits) ? updated.visits : currentVisits,
        employees: Array.isArray(updated.employees) && updated.employees.length > 0 ? updated.employees : currentEmployees
      }));
      return;
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: err.message }));
  }
}
