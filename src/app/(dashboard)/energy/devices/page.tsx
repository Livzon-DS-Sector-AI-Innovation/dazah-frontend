"use client"

'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button, Input, Select, Space, Spin } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useEnergyStore } from '@/stores/energy'
import { DeviceTable } from '@/components/energy/DeviceTable'
import { DeviceDrawer } from '@/components/energy/DeviceDrawer'
import { getEnergyDevices } from '@/actions/energy'
import { EnergyDeviceConfig, PaginatedResponse } from '@/types/energy'

export default function DevicesPage() {
  const {
    deviceFilters,
    setDeviceFilters,
    resetDeviceFilters,
    openDeviceDrawer,
  } = useEnergyStore()

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResponse<EnergyDeviceConfig>>({
    items: [],
    total: 0,
    page: 1,
    page_size: 10,
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getEnergyDevices(deviceFilters)
      setData(result)
    } catch (error) {
      console.error('获取设备列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [deviceFilters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="p-6">
      <h1
        className="font-semibold mb-4"
        style={{ fontSize: 22, color: '#1a1a1a', lineHeight: 1.3 }}
      >
        设备配置
      </h1>

      <div
        style={{
          background: '#ffffff',
          padding: 20,
          borderRadius: 12,
          border: '1px solid #e5e3df',
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <Space>
            <Input
              placeholder="搜索设备名称"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              value={deviceFilters.keyword}
              onChange={(e) => setDeviceFilters({ keyword: e.target.value })}
              allowClear
            />
            <Select
              placeholder="能源类型"
              style={{ width: 120 }}
              value={deviceFilters.energy_type}
              onChange={(value) => setDeviceFilters({ energy_type: value })}
              allowClear
              options={[
                { label: '电力', value: 'electricity' },
                { label: '水', value: 'water' },
                { label: '气体', value: 'gas' },
              ]}
            />
            <Select
              placeholder="状态"
              style={{ width: 100 }}
              value={deviceFilters.is_enabled}
              onChange={(value) => setDeviceFilters({ is_enabled: value })}
              allowClear
              options={[
                { label: '启用', value: true },
                { label: '禁用', value: false },
              ]}
            />
            <Button onClick={resetDeviceFilters}>重置</Button>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openDeviceDrawer('create')}
          >
            新增设备
          </Button>
        </div>

        <Spin spinning={loading}>
          <DeviceTable
            data={data.items}
            loading={loading}
            total={data.total}
            onRefresh={fetchData}
          />
        </Spin>
      </div>

      <DeviceDrawer onRefresh={fetchData} />
    </div>
  )
}
