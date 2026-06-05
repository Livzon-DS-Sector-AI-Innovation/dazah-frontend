'use client'

import { Button } from 'antd'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export default function LoginPage() {
  const handleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/v1/identity/auth/login`
  }

  return (
    <div className="h-screen flex items-center justify-center bg-[var(--color-brand-navy)]">
      <div className="w-full max-w-md mx-4">
        <div className="bg-[var(--color-canvas)] rounded-[var(--rounded-lg)] p-10 shadow-[rgba(15,15,15,0.2)_0px_24px_48px_-8px]">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-[var(--rounded-md)] bg-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-lg font-semibold">API</span>
            </div>
            <h1 className="text-[var(--color-ink)] text-[22px] font-semibold leading-[1.3] mb-1">
              原料药工厂管理平台
            </h1>
            <p className="text-[var(--color-slate)] text-[14px] leading-[1.5]">
              使用飞书账号安全登录
            </p>
          </div>

          {/* Login Button */}
          <Button
            type="primary"
            block
            size="large"
            onClick={handleLogin}
            className="h-[44px] text-[14px] font-medium"
          >
            飞书登录
          </Button>
        </div>
      </div>
    </div>
  )
}
