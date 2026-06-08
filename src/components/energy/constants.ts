import { EnergyType } from '@/types/energy'

export const energyTypeLabels: Record<EnergyType, { text: string; color: string }> = {
  electricity: { text: '电力', color: 'blue' },
  water: { text: '水', color: 'cyan' },
  gas: { text: '气体', color: 'orange' },
}
