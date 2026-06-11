import {
  EnergyDeviceConfig,
  CreateDeviceInput,
  UpdateDeviceInput,
  DeviceQueryParams,
  EnergyData,
  DataQueryParams,
  EnergyOverviewData,
  StatisticsParams,
  CollectLog,
  CollectLogDetail,
  LogQueryParams,
  PaginatedResponse,
  AlertRule,
  CreateRuleInput,
  UpdateRuleInput,
  RuleQueryParams,
  AlertRecord,
  ProcessRecordInput,
  RecordQueryParams,
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

/** 解包 paginated_response: {code, data, meta} → {items, total, page, page_size} */
async function unwrapPaginated<T>(res: Response): Promise<PaginatedResponse<T>> {
  const json = await res.json()
  return {
    items: json.data ?? [],
    total: json.meta?.total ?? 0,
    page: json.meta?.page ?? 1,
    page_size: json.meta?.page_size ?? 20,
  }
}

/** 解包 success_response: {code, data} → data */
async function unwrapData<T>(res: Response): Promise<T> {
  const json = await res.json()
  return json.data
}

// 平台列表
export interface PlatformInfo {
  code: string
  name: string
}

export async function fetchPlatforms(): Promise<PlatformInfo[]> {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/energy/platforms`)
  if (!res.ok) throw new Error('获取平台列表失败')
  const json = await res.json()
  return json.data
}

export async function fetchPlatformsClient(): Promise<PlatformInfo[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/energy/platforms`
  )
  if (!res.ok) throw new Error('获取平台列表失败')
  const json = await res.json()
  return json.data
}

// 数据源配置 API
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
  if (!res.ok) throw new Error('获取数据源列表失败')
  return unwrapPaginated(res)
}

export async function fetchEnergyDeviceById(
  id: string
): Promise<EnergyDeviceConfig> {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/energy/devices/${id}`)
  if (!res.ok) throw new Error('获取数据源详情失败')
  return unwrapData(res)
}

export async function createEnergyDevice(
  data: CreateDeviceInput
): Promise<EnergyDeviceConfig> {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/energy/devices`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('创建数据源失败')
  return unwrapData(res)
}

export async function updateEnergyDevice(
  id: string,
  data: UpdateDeviceInput
): Promise<EnergyDeviceConfig> {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/energy/devices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('更新数据源失败')
  return unwrapData(res)
}

export async function deleteEnergyDevice(id: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/energy/devices/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('删除数据源失败')
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
  return unwrapPaginated(res)
}

export async function fetchEnergyOverview(
  params: StatisticsParams = {}
): Promise<EnergyOverviewData> {
  const searchParams = new URLSearchParams()
  if (params.start_time) searchParams.set('start_time', params.start_time)
  if (params.end_time) searchParams.set('end_time', params.end_time)
  if (params.energy_type) searchParams.set('energy_type', params.energy_type)

  const res = await fetchWithAuth(
    `${API_BASE}/api/v1/energy/overview?${searchParams.toString()}`
  )
  if (!res.ok) throw new Error('获取能源总览失败')
  return unwrapData(res)
}

// 数据采集 API
export async function triggerCollect(
  platformCode?: string
): Promise<{ message: string }> {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/energy/collect/trigger`, {
    method: 'POST',
    body: JSON.stringify({ platform_code: platformCode ?? null }),
  })
  if (!res.ok) throw new Error('触发采集失败')
  return unwrapData(res)
}

export async function fetchCollectLogs(
  params: LogQueryParams = {}
): Promise<PaginatedResponse<CollectLog>> {
  const searchParams = new URLSearchParams()
  if (params.platform_code) searchParams.set('platform_code', params.platform_code)
  if (params.status) searchParams.set('status', params.status)
  if (params.page) searchParams.set('page', String(params.page))
  if (params.page_size) searchParams.set('page_size', String(params.page_size))

  const res = await fetchWithAuth(
    `${API_BASE}/api/v1/energy/collect/logs?${searchParams.toString()}`
  )
  if (!res.ok) throw new Error('获取采集日志失败')
  return unwrapPaginated(res)
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
  if (!res.ok) throw new Error('获取数据源列表失败')
  const json = await res.json()
  return {
    items: json.data ?? [],
    total: json.meta?.total ?? 0,
    page: json.meta?.page ?? 1,
    page_size: json.meta?.page_size ?? 20,
  }
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
  const json = await res.json()
  return {
    items: json.data ?? [],
    total: json.meta?.total ?? 0,
    page: json.meta?.page ?? 1,
    page_size: json.meta?.page_size ?? 20,
  }
}

export async function fetchEnergyOverviewClient(
  params: StatisticsParams = {}
): Promise<EnergyOverviewData> {
  const searchParams = new URLSearchParams()
  if (params.start_time) searchParams.set('start_time', params.start_time)
  if (params.end_time) searchParams.set('end_time', params.end_time)
  if (params.energy_type) searchParams.set('energy_type', params.energy_type)

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/energy/overview?${searchParams.toString()}`
  )
  if (!res.ok) throw new Error('获取能源总览失败')
  const json = await res.json()
  return json.data
}

// 预警规则 API
export async function fetchAlertRules(
  params: RuleQueryParams = {}
): Promise<PaginatedResponse<AlertRule>> {
  const searchParams = new URLSearchParams()
  if (params.energy_type) searchParams.set('energy_type', String(params.energy_type))
  if (params.alert_level) searchParams.set('alert_level', String(params.alert_level))
  if (params.is_enabled !== undefined) searchParams.set('is_enabled', String(params.is_enabled))
  if (params.page) searchParams.set('page', String(params.page))
  if (params.page_size) searchParams.set('page_size', String(params.page_size))

  const res = await fetchWithAuth(
    `${API_BASE}/api/v1/energy/alerts/rules?${searchParams.toString()}`
  )
  if (!res.ok) throw new Error('获取预警规则失败')
  return unwrapPaginated(res)
}

export async function fetchAlertRuleById(id: string): Promise<AlertRule> {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/energy/alerts/rules/${id}`)
  if (!res.ok) throw new Error('获取预警规则详情失败')
  return unwrapData(res)
}

export async function createAlertRule(data: CreateRuleInput): Promise<AlertRule> {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/energy/alerts/rules`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('创建预警规则失败')
  return unwrapData(res)
}

export async function updateAlertRule(id: string, data: UpdateRuleInput): Promise<AlertRule> {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/energy/alerts/rules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('更新预警规则失败')
  return unwrapData(res)
}

export async function deleteAlertRule(id: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/energy/alerts/rules/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('删除预警规则失败')
}

// 预警记录 API
export async function fetchAlertRecords(
  params: RecordQueryParams = {}
): Promise<PaginatedResponse<AlertRecord>> {
  const searchParams = new URLSearchParams()
  if (params.energy_type) searchParams.set('energy_type', String(params.energy_type))
  if (params.alert_level) searchParams.set('alert_level', String(params.alert_level))
  if (params.status) searchParams.set('status', String(params.status))
  if (params.start_time) searchParams.set('start_time', String(params.start_time))
  if (params.end_time) searchParams.set('end_time', String(params.end_time))
  if (params.page) searchParams.set('page', String(params.page))
  if (params.page_size) searchParams.set('page_size', String(params.page_size))

  const res = await fetchWithAuth(
    `${API_BASE}/api/v1/energy/alerts/records?${searchParams.toString()}`
  )
  if (!res.ok) throw new Error('获取预警记录失败')
  return unwrapPaginated(res)
}

export async function processAlertRecord(
  id: string,
  data: ProcessRecordInput
): Promise<AlertRecord> {
  const res = await fetchWithAuth(
    `${API_BASE}/api/v1/energy/alerts/records/${id}/process`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  )
  if (!res.ok) throw new Error('处理预警记录失败')
  return unwrapData(res)
}

export async function fetchCollectLogDetail(
  id: string
): Promise<CollectLogDetail> {
  const res = await fetchWithAuth(
    `${API_BASE}/api/v1/energy/collect/logs/${id}/detail`
  )
  if (!res.ok) throw new Error('获取采集日志详情失败')
  return unwrapData(res)
}

export async function fetchCollectLogDetailClient(
  id: string
): Promise<CollectLogDetail> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/energy/collect/logs/${id}/detail`
  )
  if (!res.ok) throw new Error('获取采集日志详情失败')
  return unwrapData(res)
}

export async function fetchCollectLogsClient(
  params: LogQueryParams = {}
): Promise<PaginatedResponse<CollectLog>> {
  const searchParams = new URLSearchParams()
  if (params.platform_code) searchParams.set('platform_code', params.platform_code)
  if (params.status) searchParams.set('status', params.status)
  if (params.page) searchParams.set('page', String(params.page))
  if (params.page_size) searchParams.set('page_size', String(params.page_size))

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/energy/collect/logs?${searchParams.toString()}`
  )
  if (!res.ok) throw new Error('获取采集日志失败')
  const json = await res.json()
  return {
    items: json.data ?? [],
    total: json.meta?.total ?? 0,
    page: json.meta?.page ?? 1,
    page_size: json.meta?.page_size ?? 20,
  }
}
