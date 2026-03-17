'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import Link from 'next/link'

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    passwordConfirm?: string
  }>({})
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: typeof errors = {}
    if (!validateEmail(email)) newErrors.email = '올바른 이메일 형식을 입력해주세요'
    if (password.length < 8) newErrors.password = '비밀번호는 8자 이상이어야 합니다'
    if (password !== passwordConfirm) newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    showToast('회원가입 기능은 현재 준비 중입니다')
  }

  function clearError(field: keyof typeof errors) {
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showBack title="회원가입" />

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-navy text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg animate-fade-in whitespace-nowrap">
          {toast}
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-black text-navy mb-1">반갑습니다!</h1>
            <p className="text-gray-500 text-sm">Safe Deliver와 함께 더 안전한 식생활을 즐겨보세요</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름 (선택)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-navy placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition"
              />
            </div>

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError('email') }}
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
                onChange={(e) => { setPassword(e.target.value); clearError('password') }}
                required
                minLength={8}
                placeholder="비밀번호 (8자 이상)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-navy placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition"
              />
              {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
            </div>

            <div>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => { setPasswordConfirm(e.target.value); clearError('passwordConfirm') }}
                required
                placeholder="비밀번호 확인"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-navy placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition"
              />
              {errors.passwordConfirm && (
                <p className="mt-1.5 text-xs text-red-500">{errors.passwordConfirm}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-navy text-white rounded-xl font-bold text-sm shadow-lg active:scale-[0.98] transition-transform"
            >
              회원가입
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/login" className="font-bold text-navy underline underline-offset-2">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
