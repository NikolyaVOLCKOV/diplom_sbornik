import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { query } from './db'

const SECRET = process.env.JWT_SECRET || 'change-me-in-production'

export async function loginUser(email: string, password: string) {
    const users = await query(
        'SELECT * FROM admin_users WHERE email = $1 LIMIT 1',
        [email]
    )
    const user = users[0]
    if (!user) return null

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return null

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        SECRET,
        { expiresIn: '7d' }
    )
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } }
}

export function verifyToken(token: string) {
    try {
        return jwt.verify(token, SECRET) as { id: string; email: string; role: string }
    } catch {
        return null
    }
}