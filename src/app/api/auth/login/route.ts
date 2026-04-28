import { NextRequest, NextResponse } from 'next/server'
import { loginUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json()

        if (!email || !password) {
            return NextResponse.json({ error: 'Email и пароль обязательны' }, { status: 400 })
        }

        const result = await loginUser(email, password)

        if (!result) {
            return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 })
        }

        const response = NextResponse.json({ ok: true, user: result.user })
        response.cookies.set('auth_token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 дней
            path: '/',
        })

        return response
    } catch (err) {
        console.error('Login error:', err)
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
    }
}