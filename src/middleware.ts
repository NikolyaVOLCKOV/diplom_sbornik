import { NextRequest, NextResponse } from 'next/server'

const SECRET = process.env.JWT_SECRET || '76daa059-fafe-7002-8001-2ab73e705912'

async function verifyJwt(token: string): Promise<boolean> {
    try {
        const [headerB64, payloadB64, signatureB64] = token.split('.')
        if (!headerB64 || !payloadB64 || !signatureB64) return false

        const encoder = new TextEncoder()
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(SECRET),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        )

        const data = encoder.encode(`${headerB64}.${payloadB64}`)
        const signature = Uint8Array.from(
            atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
            c => c.charCodeAt(0)
        )

        const valid = await crypto.subtle.verify('HMAC', key, signature, data)
        if (!valid) return false

        const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))
        return payload.exp > Math.floor(Date.now() / 1000)
    } catch {
        return false
    }
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    if (pathname.startsWith('/admin')) {
        const token = req.cookies.get('auth_token')?.value
        if (!token || !(await verifyJwt(token))) {
            return NextResponse.redirect(new URL('/login', req.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*'],
}