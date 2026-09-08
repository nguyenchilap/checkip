'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(prevState: { error?: string } | null | undefined, formData: FormData) {
  const username = formData.get('username')
  const password = formData.get('password')

  if (username === 'bn' && password === '1') {
    const cookieStore = await cookies()
    cookieStore.set('auth_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 1 month
      path: '/',
    })

    redirect('/')
  } else {
    return { error: 'Tài khoản hoặc mật khẩu không chính xác' }
  }
}
