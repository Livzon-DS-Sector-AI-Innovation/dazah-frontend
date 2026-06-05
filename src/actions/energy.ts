'use server'

import { revalidatePath } from 'next/cache'
import {
  fetchEnergyDevices,
  fetchEnergyDeviceById,
  createEnergyDevice as apiCreateDevice,
  updateEnergyDevice as apiUpdateDevice,
  deleteEnergyDevice as apiDeleteDevice,
  fetchEnergyData,
  fetchEnergyStatistics,
  triggerCollect as apiTriggerCollect,
  fetchCollectLogs,
} from '@/lib/api/energy'
import {
  CreateDeviceInput,
  UpdateDeviceInput,
  DeviceQueryParams,
  DataQueryParams,
  StatisticsParams,
  LogQueryParams,
} from '@/types/energy'

// 设备配置 Server Actions
export async function getEnergyDevices(params: DeviceQueryParams = {}) {
  return fetchEnergyDevices(params)
}

export async function getEnergyDeviceById(id: string) {
  return fetchEnergyDeviceById(id)
}

export async function createEnergyDevice(data: CreateDeviceInput) {
  const result = await apiCreateDevice(data)
  revalidatePath('/energy/devices')
  return result
}

export async function updateEnergyDevice(id: string, data: UpdateDeviceInput) {
  const result = await apiUpdateDevice(id, data)
  revalidatePath('/energy/devices')
  return result
}

export async function deleteEnergyDevice(id: string) {
  await apiDeleteDevice(id)
  revalidatePath('/energy/devices')
}

// 能耗数据 Server Actions
export async function getEnergyData(params: DataQueryParams = {}) {
  return fetchEnergyData(params)
}

export async function getEnergyStatistics(params: StatisticsParams = {}) {
  return fetchEnergyStatistics(params)
}

// 数据采集 Server Actions
export async function triggerCollect(deviceIds?: string[]) {
  const result = await apiTriggerCollect(deviceIds)
  revalidatePath('/energy/collect-logs')
  return result
}

export async function getCollectLogs(params: LogQueryParams = {}) {
  return fetchCollectLogs(params)
}
