import { Pool } from 'pg'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

export async function query<T = any>(
    sql: string,
    params?: any[]
): Promise<T[]> {
    const { rows } = await pool.query(sql, params)
    return rows
}

export default pool