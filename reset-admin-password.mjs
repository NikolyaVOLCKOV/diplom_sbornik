import dotenv from 'dotenv';
import 'dotenv/config';
import bcrypt from 'bcrypt';
import pg from 'pg';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
dotenv.config({ path: '.env.local' });
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
    console.error('Нет DATABASE_URL в .env.local');
    process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const rl = readline.createInterface({ input, output });

const email = (await rl.question('Email: ')).trim().toLowerCase();
const password = (await rl.question('Новый пароль: ')).trim();
const name = (await rl.question('Имя (можно пропустить): ')).trim() || null;
const role = ((await rl.question('Роль admin/editor [admin]: ')).trim() || 'admin').toLowerCase();
rl.close();

if (!email || password.length < 6) {
    console.error('Email обязателен, пароль минимум 6 символов');
    process.exit(1);
}
if (!['admin', 'editor'].includes(role)) {
    console.error('Роль должна быть admin или editor');
    process.exit(1);
}

const hash = await bcrypt.hash(password, 10);

const { rows } = await pool.query(
    `INSERT INTO admin_users (email, password_hash, name, role)
   VALUES ($1, $2, $3, $4)
   ON CONFLICT (email) DO UPDATE
     SET password_hash = EXCLUDED.password_hash,
         name = COALESCE(EXCLUDED.name, admin_users.name),
         role = EXCLUDED.role
   RETURNING id, email, role`,
    [email, hash, name, role]
);

console.log('✓ Готово:', rows[0]);
await pool.end();