import { EnergyOverview } from '@/components/energy'

export default function EnergyPage() {
  return (
    <div className="p-6">
      <h1
        className="font-semibold mb-4"
        style={{ fontSize: 22, color: '#1a1a1a', lineHeight: 1.3 }}
      >
        能源管理
      </h1>
      <EnergyOverview />
    </div>
  )
}
