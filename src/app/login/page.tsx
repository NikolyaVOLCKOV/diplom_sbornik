'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Ошибка входа')
                return
            }

            router.push('/admin')
        } catch {
            setError('Ошибка соединения с сервером')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh', background: 'var(--paper)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <div style={{
                background: '#fff', border: '1px solid var(--border)',
                borderRadius: 8, padding: '48px 40px', width: '100%', maxWidth: 400,
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: 13, fontWeight: 700, color: 'var(--ink)',
                        lineHeight: 1.4, marginBottom: 8,
                    }}>
                        Гуманитарные исследования<br />Центральной России
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink3)' }}>Панель управления</div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 12, color: 'var(--ink3)', marginBottom: 6, fontWeight: 500 }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%', padding: '10px 12px',
                                border: '1px solid var(--border)', borderRadius: 4,
                                fontSize: 14, color: 'var(--ink)', background: '#fff',
                                outline: 'none', boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', fontSize: 12, color: 'var(--ink3)', marginBottom: 6, fontWeight: 500 }}>
                            Пароль
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%', padding: '10px 12px',
                                border: '1px solid var(--border)', borderRadius: 4,
                                fontSize: 14, color: 'var(--ink)', background: '#fff',
                                outline: 'none', boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            marginBottom: 16, padding: '10px 12px',
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: 4, fontSize: 13, color: '#b91c1c',
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', padding: '11px',
                            background: loading ? 'var(--ink3)' : 'var(--burgundy)',
                            color: '#fff', border: 'none', borderRadius: 4,
                            fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background .15s',
                        }}
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </form>
            </div>
        </div>
    )
}