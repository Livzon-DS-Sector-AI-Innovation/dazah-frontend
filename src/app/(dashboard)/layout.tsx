import { AppShell } from "@/components/layout/AppShell"
import { AntdProvider } from "@/components/AntdProvider"
import '@/lib/dayjs-config'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AntdProvider>
      <AppShell>{children}</AppShell>
    </AntdProvider>
  )
}
