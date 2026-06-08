import {
  EnergyDeviceConfig,
  CreateDeviceInput,
  UpdateDeviceInput,
  DeviceQueryParams,
  EnergyData,
  DataQueryParams,
  EnergyStatistics,
  StatisticsParams,
  CollectLog,
  LogQueryParams,
  PaginatedResponse,
} from '@/types/energy'

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8000'

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // TODO: 添加认证头（等待 @/lib/auth 模块实现）
  // const token = await getServerToken()
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
}

// 设备配置 API
export async function fetchEnergyDevices(
  params: DeviceQueryParams = {}
): Promise<PaginatedResponse<EnergyDeviceConfig>> {
  const searchParams = new URLSearchParams()
  if (params.keyword) searchParams.set('keyword', params.keyword)
  if (params.energy_type) searchParams.set('energy_type', params.energy_type)
  if (params.workshop) searchParams.set('workshop', params.workshop)
  if (params.is_enabled !== undefined)
    searchParams.set('is_enabled', String(params.is_enabled))
  if (params.page) searchParams.set('page', String(params.page))
  if (params.page_size) searchParams.set('page_size', String(params.page_size))

  const res = await fetchWithAuth(
    `${API_BASE}/api/v1/energy/devices?${searchParams.toString()}`
  )
  if (!res.ok) throw new Error('获取设备列表失败')
  return res.json()
}

export async function fetchEnergyDeviceById(
  id: string
): Promise<EnergyDeviceConfig> {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/energy/devices/${id}`)
  if (!res.ok) throw new Error('获取设备详情失败')
  return res.json()
}

export async function createEnergyDevice(
  data: CreateDeviceInput
): Promise<EnergyDeviceConfig> {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/energy/devices`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('创建设备失败')
  return res.json()
}

export async function updateEnergyDevice(
  id: string,
  data: UpdateDeviceInput
): Promise<EnergyDeviceConfig> {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/energy/devices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('更新设备失败')
  return res.json()
}

export async function deleteEnergyDevice(id: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/energy/devices/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('删除设备失败')
}

// 能耗数据 API
export async function fetchEnergyData(
  params: DataQueryParams = {}
): Promise<PaginatedResponse<EnergyData>> {
  const searchParams = new URLSearchParams()
  if (params.energy_type) searchParams.set('energy_type', params.energy_type)
  if (params.workshop) searchParams.set('workshop', params.workshop)
  if (params.device_id) searchParams.set('device_id', params.device_id)
  if (params.start_time) searchParams.set('start_time', params.start_time)
  if (params.end_time) searchParams.set('end_time', params.end_time)
  if (params.page) searchParams.set('page', String(params.page))
  if (params.page_size) searchParams.set('page_size', String(params.page_size))

  const res = await fetchWithAuth(
    `${API_BASE}/api/v1/energy/data?${searchParams.toString()}`
  )
  if (!res.ok) throw new Error('获取能耗数据失败')
  return res.json()
}

export async function fetchEnergyStatistics(
  params: StatisticsParams = {}
): Promise<EnergyStatistics> {
  const searchParams = new URLSearchParams()
  if (params.start_time) searchParams.set('start_time', params.start_time)
  if (params.end_time) searchParams.set('end_time', params.end_time)

  const res = await fetchWithAuth(
    `${API_BASE}/api/v1/energy/data/statistics?${searchParams.toString()}`
  )
  if (!res.ok) throw new Error('获取能耗统计失败')
  return res.json()
}

// 数据采集 API
export async function triggerCollect(
  deviceIds?: string[]
): Promise<{ message: string }> {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/energy/collect/trigger`, {
    method: 'POST',
    body: JSON.stringify({ device_ids: deviceIds }),
  })
  if (!res.ok) throw new Error('触发采集失败')
  return res.json()
}

export async function fetchCollectLogs(
  params: LogQueryParams = {}
): Promise<PaginatedResponse<CollectLog>> {
  const searchParams = new URLSearchParams()
  if (params.device_id) searchParams.set('device_id', params.device_id)
  if (params.status) searchParams.set('status', params.status)
  if (params.start_time) searchParams.set('start_time', params.start_time)
  if (params.end_time) searchParams.set('end_time', params.end_time)
  if (params.page) searchParams.set('page', String(params.page))
  if (params.page_size) searchParams.set('page_size', String(params.page_size))

  const res = await fetchWithAuth(
    `${API_BASE}/api/v1/energy/collect/logs?${searchParams.toString()}`
  )
  if (!res.ok) throw new Error('获取采集日志失败')
  return res.json()
}

// 客户端 API 函数（用于 React Query）
export async function fetchEnergyDevicesClient(
  params: DeviceQueryParams = {}
): Promise<PaginatedResponse<EnergyDeviceConfig>> {
  const searchParams = new URLSearchParams()
  if (params.keyword) searchParams.set('keyword', params.keyword)
  if (params.energy_type) searchParams.set('energy_type', params.energy_type)
  if (params.workshop) searchParams.set('workshop', params.workshop)
  if (params.is_enabled !== undefined)
    searchParams.set('is_enabled', String(params.is_enabled))
  if (params.page) searchParams.set('page', String(params.page))
  if (params.page_size) searchParams.set('page_size', String(params.page_size))

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/energy/devices?${searchParams.toString()}`
  )
  if (!res.ok) throw new Error('获取设备列表失败')
  return res.json()
}

export async function fetchEnergyDataClient(
  params: DataQueryParams = {}
): Promise<PaginatedResponse<EnergyData>> {
  const searchParams = new URLSearchParams()
  if (params.energy_type) searchParams.set('energy_type', params.energy_type)
  if (params.workshop) searchParams.set('workshop', params.workshop)
  if (params.device_id) searchParams.set('device_id', params.device_id)
  if (params.start_time) searchParams.set('start_time', params.start_time)
  if (params.end_time) searchParams.set('end_time', params.end_time)
  if (params.page) searchParams.set('page', String(params.page))
  if (params.page_size) searchParams.set('page_size', String(params.page_size))

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/energy/data?${searchParams.toString()}`
  )
  if (!res.ok) throw new Error('获取能耗数据失败')
  return res.json()
}

export async function fetchEnergyStatisticsClient(
  params: StatisticsParams = {}
): Promise<EnergyStatistics> {
  const searchParams = new URLSearchParams()
  if (params.start_time) searchParams.set('start_time', params.start_time)
  if (params.end_time) searchParams.set('end_time', params.end_time)

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/energy/data/statistics?${searchParams.toString()}`
  )
  if (!res.ok) throw new Error('获取能耗统计失败')
  return res.json()
}

export async function fetchCollectLogsClient(
  params: LogQueryParams = {}
): Promise<PaginatedResponse<CollectLog>> {
  const searchParams = new URLSearchParams()
  if (params.device_id) searchParams.set('device_id', params.device_id)
  if (params.status) searchParams.set('status', params.status)
  if (params.start_time) searchParams.set('start_time', params.start_time)
  if (params.end_time) searchParams.set('end_time', params.end_time)
  if (params.page) searchParams.set('page', String(params.page))
  if (params.page_size) searchParams.set('page_size', String(params.page_size))

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/energy/collect/logs?${searchParams.toString()}`
  )
  if (!res.ok) throw new Error('获取采集日志失败')
  return res.json()
}
