import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'bluuu_booth'}`;

const isRemoteDb =
  connectionString.includes('supabase.co') ||
  connectionString.includes('supabase.com') ||
  (!connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'));

const useSSL = isProduction && isRemoteDb;

const poolConfig = {
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  max: isProduction ? 1 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

if (connectionString.includes('pooler.supabase.com') && !connectionString.includes('pgbouncer=')) {
  poolConfig.connectionString = `${connectionString}${connectionString.includes('?') ? '&' : '?'}pgbouncer=true`;
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export default pool;
