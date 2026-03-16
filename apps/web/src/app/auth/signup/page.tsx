'use client'

import { ShieldCheck, Mail, ArrowRight } from 'lucide-react'
import { Header } from '@/components/layout/header'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showBack title="회원가입" />

      <div className="flex-1 px-6 pt-10 pb-20">
        <div className="mb-8">
            <h1 className="text-2xl font-black text-navy mb-2">반갑습니다!</h1>
            <p className="text-gray-500 text-sm">
                Safe Deliver와 함께 더 안전한 식생활을 즐겨보세요
            </p>
        </div>

        <div className="space-y-4">
            <div className="card p-6 border-2 border-navy/5">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-navy rounded-2xl flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-navy">간편 가입</h2>
                        <p className="text-xs text-gray-400">SNS 계정으로 3초만에 가입하세요</p>
                    </div>
                </div>
                <Link 
                    href="/auth/login"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-navy text-white rounded-xl text-sm font-bold shadow-lg"
                >
                    가입하러 가기
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="p-4 text-center">
                <p className="text-xs text-gray-400 mb-4">이미 계정이 있으신가요?</p>
                <Link 
                    href="/auth/login"
                    className="text-sm font-bold text-navy-tint border-b border-navy-tint pb-0.5"
                >
                    로그인하기
                </Link>
            </div>
        </div>
      </div>
    </div>
  )
}
