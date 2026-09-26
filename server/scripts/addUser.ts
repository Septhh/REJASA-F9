// Pemakaian: npm run user:add -- KODE "Nama Lengkap" GURU|LABORAN|ADMIN
import { db } from '../db.ts';

const [codeArg, name, role] = process.argv.slice(2);
const code = (codeArg || '').trim().toUpperCase();
if (!code || !name || !['GURU', 'LABORAN', 'ADMIN'].includes(role)) {
  console.error('Pemakaian: npm run user:add -- KODE "Nama Lengkap" GURU|LABORAN|ADMIN');
  process.exit(1);
}
const colors = ['bg-emerald-700', 'bg-sky-700', 'bg-teal-700', 'bg-violet-700', 'bg-indigo-700', 'bg-rose-700', 'bg-amber-700'];
try {
  db.prepare('INSERT INTO users (code, name, role, avatar_color) VALUES (?, ?, ?, ?)').run(
    code,
    name,
    role,
    colors[Math.floor(Math.random() * colors.length)],
  );
  console.log(`Pengguna ${code} (${role}) ditambahkan.`);
} catch (e: any) {
  console.error(String(e.message).includes('UNIQUE') ? `Kode ${code} sudah dipakai.` : e.message);
  process.exit(1);
}
