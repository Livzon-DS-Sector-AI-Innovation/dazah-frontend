import { RiskReportPanel } from '@/components/safety'

export default function RiskReportingPage() {
  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.4, color: '#1a1a1a', margin: 0 }}>
          关键风险作业报备
        </h2>
        <span style={{ fontSize: 14, color: '#5d5b54' }}>
          每日风险作业报备审批管理
        </span>
      </div>

      <RiskReportPanel />
    </div>
  )
}
