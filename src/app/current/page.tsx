import { query } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function CurrentIssuePage() {
    const rows = await query(`SELECT volume, number FROM issues WHERE is_current = TRUE LIMIT 1`)
    if (rows[0]) {
        redirect(`/issue/${rows[0].volume}/${rows[0].number}`)
    }
    redirect('/')
}