'use client'

import { ShieldCheck, MessageCircle, Mail } from 'lucide-react'
import { Header } from '@/components/layout/header'
import Link from 'next/link'

export default function LoginPage() {
  const socialLogins = [
    { 
        name: '카카오로 시작하기', 
        icon: MessageCircle, 
        bg: 'bg-[#FAE100]', 
        text: 'text-[#3C1E1E]',
        href: '/api/auth/kakao'
    },
    { 
        name: '네이버로 시작하기', 
        icon: ShieldCheck, 
        bg: 'bg-[#03C75A]', 
        text: 'text-white',
        href: '/api/auth/naver'
    },
    { 
        name: '이메일로 시작하기', 
        icon: Mail, 
        bg: 'bg-white', 
        text: 'text-gray-700',
        href: '/auth/email'
    },
  ]

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      <Header showBack transparent invert />

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="text-center mb-12">
            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20">
                <ShieldCheck className="w-10 h-10 text-navy-tint" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">Safe Deliver</h1>
            <p className="text-white/60 text-sm">
                안심하고 먹을 수 있는<br />
                가장 확실한 방법
            </p>
        </div>

        <div className="w-full space-y-3">
            {socialLogins.map((login) => (
                <a 
                    key={login.name}
                    href={login.href}
                    className={`flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-sm shadow-xl transition-transform active:scale-[0.98] ${login.bg} ${login.text}`}
                >
                    <login.icon className="w-5 h-5" />
                    {login.name}
                </a>
            ))}
        </div>

        <p className="mt-8 text-xs text-white/40 text-center leading-relaxed">
            로그인 시 Safe Deliver의 <br />
            <Link href="/terms" className="underline">이용약관</Link> 및 <Link href="/privacy" className="underline">개인정보처리방침</Link>에 동의하게 됩니다.
        </p>
      </div>
    </div>
  )
}
