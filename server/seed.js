import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  console.log("Memulai seeding database...");
  
  try {
    // 1. Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // 2. Execute schema queries
    console.log("Membuat tabel database...");
    await pool.query(schemaSql);
    console.log("Tabel database berhasil dibuat/diverifikasi.");
    
    // 3. Create default admin if not exists
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'LimabelasNoldua';
    
    const existingAdmin = await pool.query('SELECT * FROM admins WHERE username = $1', [adminUser]);
    
    if (existingAdmin.rows.length === 0) {
      console.log(`Membuat akun admin default: ${adminUser}...`);
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(adminPass, salt);
      
      await pool.query(
        'INSERT INTO admins (username, password_hash) VALUES ($1, $2)',
        [adminUser, hash]
      );
      console.log("Akun admin default berhasil dibuat!");
      console.log(`Username: ${adminUser}`);
      console.log(`Password: ${adminPass}`);
    } else {
      console.log("Akun admin sudah ada di database, skip pembuatan admin.");
    }
    
    console.log("Seeding database SELESAI dengan sukses! 🎉");
  } catch (err) {
    console.error("Terjadi kesalahan saat seeding database:", err);
  } finally {
    await pool.end();
  }
}

seed();
