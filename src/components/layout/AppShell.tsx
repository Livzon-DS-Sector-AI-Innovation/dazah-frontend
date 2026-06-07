'use client'

import { App } from 'antd'
import { TopNav } from "./TopNav"
import { Sidebar } from "./Sidebar"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <App className="flex-1 overflow-hidden">
          <main className="h-full overflow-y-auto bg-[var(--color-surface)] p-6">
            {children}
          </main>
        </App>
      </div>
    </div>
  )
}
