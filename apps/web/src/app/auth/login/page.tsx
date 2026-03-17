'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import Link from 'next/link'

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: { email?: string; password?: string } = {}
    if (!validateEmail(email)) newErrors.email = '올바른 이메일 형식을 입력해주세요'
    if (password.length < 8) newErrors.password = '비밀번호는 8자 이상이어야 합니다'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    showToast('로그인 기능은 현재 준비 중입니다')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showBack title="로그인" />

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-navy text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg animate-fade-in whitespace-nowrap">
          {toast}
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-black text-navy mb-1">다시 만나서 반가워요</h1>
            <p className="text-gray-500 text-sm">이메일로 로그인하세요</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })) }}
                required
                placeholder="이메일"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-navy placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition"
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })) }}
                required
                minLength={8}
                placeholder="비밀번호"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-navy placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition"
              />
              {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-navy text-white rounded-xl font-bold text-sm shadow-lg active:scale-[0.98] transition-transform"
            >
              로그인
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">또는</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => showToast('카카오 로그인은 준비 중입니다')}
              className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-[#FAE100] text-[#3C1E1E] rounded-xl font-bold text-sm active:scale-[0.98] transition-transform shadow"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M9 1.5C4.86 1.5 1.5 4.19 1.5 7.5c0 2.1 1.32 3.95 3.33 5.03l-.85 3.14a.25.25 0 0 0 .37.28L7.9 13.8A9.6 9.6 0 0 0 9 13.5c4.14 0 7.5-2.69 7.5-6S13.14 1.5 9 1.5Z" fill="#3C1E1E"/>
              </svg>
              카카오로 시작하기
            </button>

            <button
              type="button"
              onClick={() => showToast('네이버 로그인은 준비 중입니다')}
              className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-[#03C75A] text-white rounded-xl font-bold text-sm active:scale-[0.98] transition-transform shadow"
            >
              <span className="font-black text-base leading-none">N</span>
              네이버로 시작하기
            </button>

            <button
              type="button"
              onClick={() => showToast('구글 로그인은 준비 중입니다')}
              className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-white text-gray-700 rounded-xl font-bold text-sm border border-gray-200 active:scale-[0.98] transition-transform shadow"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
              </svg>
              구글로 시작하기
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            계정이 없으신가요?{' '}
            <Link href="/auth/signup" className="font-bold text-navy underline underline-offset-2">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
