import { Pool } from 'pg';

export const pool = new Pool({
  user: 'billutilldata',
  host: 'localhost',
  database: 'billutill',
  password: process.env.DB_PASSWORD || '',
  port: 5432,
});

export async function query<T>(sql: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows;
  } finally {
    client.release();
  }
}