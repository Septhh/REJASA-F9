import { Router } from 'express';
import { db } from '../db.ts';
import { requireRole } from '../auth.ts';

// Seluruh endpoint inventaris HANYA untuk ADMIN. Role lain (termasuk GURU) mendapat 403.
export const inventoryRouter = Router();
inventoryRouter.use(requireRole('ADMIN'));

const CATEGORIES = ['ALAT', 'REAGEN', 'BAHAN'];
const CONDITIONS = ['BAIK', 'PERLU_PERBAIKAN', 'RUSAK'];

const SELECT = `
  SELECT i.*, l.code AS lab_code FROM inventory_items i LEFT JOIN labs l ON l.id = i.lab_id`;

const dto = (r: any) => ({
  id: r.id,
  code: r.code,
  name: r.name,
  category: r.category,
  labId: r.lab_id,
  labCode: r.lab_code,
  quantity: r.quantity,
  minStock: r.min_stock,
  condition: r.item_condition,
  storageLocation: r.storage_location,
  unitValue: r.unit_value,
});

function read(body: any, base: any = {}) {
  const errors: string[] = [];
  const m = { ...base, ...body };
  const code = String(m.code ?? '').trim();
  const name = String(m.name ?? '').trim();
  if (!code) errors.push('code wajib');
  if (!name) errors.push('name wajib');
  if (!CATEGORIES.includes(m.category)) errors.push('category tidak valid');
  const condition = m.condition ?? 'BAIK';
  if (!CONDITIONS.includes(condition)) errors.push('condition tidak valid');
  const ints = { quantity: 0, minStock: 0, unitValue: 0 };
  for (const k of ['quantity', 'minStock', 'unitValue'] as const) {
    const n = Number(m[k] ?? 0);
    if (!Number.isInteger(n) || n < 0) errors.push(`${k} harus bilangan bulat >= 0`);
    ints[k] = n;
  }
  const labId = m.labId == null || m.labId === '' ? null : Number(m.labId);
  return {
    errors,
    v: { code, name, category: m.category, condition, labId, storage: String(m.storageLocation ?? '').trim(), ...ints },
  };
}

inventoryRouter.get('/', (_req, res) => {
  res.json({ items: (db.prepare(`${SELECT} ORDER BY i.category, i.name`).all() as any[]).map(dto) });
});

inventoryRouter.post('/', (req, res) => {
  const { errors, v } = read(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });
  try {
    const info = db
      .prepare(
        `INSERT INTO inventory_items (code, name, category, lab_id, quantity, min_stock, item_condition, storage_location, unit_value)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(v.code, v.name, v.category, v.labId, v.quantity, v.minStock, v.condition, v.storage, v.unitValue);
    res.status(201).json({ item: dto(db.prepare(`${SELECT} WHERE i.id = ?`).get(info.lastInsertRowid)) });
  } catch (e: any) {
    if (String(e.message).includes('UNIQUE')) return res.status(409).json({ error: 'Kode item sudah dipakai.' });
    throw e;
  }
});

inventoryRouter.patch('/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(Number(req.params.id)) as any;
  if (!cur) return res.status(404).json({ error: 'Item tidak ditemukan.' });
  const { errors, v } = read(req.body, {
    code: cur.code,
    name: cur.name,
    category: cur.category,
    condition: cur.item_condition,
    labId: cur.lab_id,
    storageLocation: cur.storage_location,
    quantity: cur.quantity,
    minStock: cur.min_stock,
    unitValue: cur.unit_value,
  });
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });
  db.prepare(
    `UPDATE inventory_items SET code=?, name=?, category=?, lab_id=?, quantity=?, min_stock=?, item_condition=?, storage_location=?, unit_value=? WHERE id=?`,
  ).run(v.code, v.name, v.category, v.labId, v.quantity, v.minStock, v.condition, v.storage, v.unitValue, cur.id);
  res.json({ item: dto(db.prepare(`${SELECT} WHERE i.id = ?`).get(cur.id)) });
});

inventoryRouter.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM inventory_items WHERE id = ?').run(Number(req.params.id));
  if (!info.changes) return res.status(404).json({ error: 'Item tidak ditemukan.' });
  res.json({ ok: true });
});
