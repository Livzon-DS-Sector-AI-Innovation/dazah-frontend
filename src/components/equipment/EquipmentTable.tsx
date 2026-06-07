'use client'

import { useMemo, useCallback, type CSSProperties } from 'react'
import { App, Table, Space, Input, Select, Button } from 'antd'
import { EditOutlined, DeleteOutlined, SearchOutlined, ToolOutlined, PlusOutlined } from '@ant-design/icons'
import { Equipment, EquipmentStatus, EquipmentCategory, Location } from '@/types/equipment'
import { useEquipmentStore } from '@/stores/equipment'
import { deleteEquipment } from '@/actions/equipment'
import { statusPill, linkDanger, linkPrimary, linkWarning, pillPurple, pillNeutral } from '@/components/equipment/shared-styles'

const statusConfig: Record<EquipmentStatus, { color: string; bg: string }> = {
  '在用':   { color: '#1aae39', bg: '#d9f3e1' },
  '备用':   { color: '#7b3ff2', bg: '#e6e0f5' },
  '维修中': { color: '#dd5b00', bg: '#ffe8d4' },
  '停用':   { color: '#787671', bg: '#f0eeec' },
  '报废':   { color: '#e03131', bg: '#fde0ec' },
}

const statusPillMap: Record<EquipmentStatus, React.CSSProperties> = Object.fromEntries(
  Object.entries(statusConfig).map(([k, v]) => [k, statusPill(v.color, v.bg)])
) as Record<EquipmentStatus, React.CSSProperties>

const statusOptions = Object.keys(statusConfig).map(value => ({ label: value, value }))

interface EquipmentTableProps {
  loading?: boolean
  onRefresh?: () => void
}

// 扁平化树结构，创建 ID -> Name 的映射
function buildIdNameMap(items: EquipmentCategory[] | Location[]): Record<string, string> {
  const map: Record<string, string> = {}
  function traverse(nodes: EquipmentCategory[] | Location[]) {
    for (const node of nodes) {
      map[node.id] = node.name
      if ('children' in node && node.children?.length) {
        traverse(node.children as any)
      }
    }
  }
  traverse(items)
  return map
}

export function EquipmentTable({ loading = false, onRefresh }: EquipmentTableProps) {
  const { message, modal } = App.useApp()
  const {
    equipments,
    categories,
    locations,
    total,
    page,
    pageSize,
    statusFilter,
    keyword,
    setPage,
    setPageSize,
    setStatusFilter,
    setKeyword,
    openEquipmentDrawer,
    openRepairDrawer,
  } = useEquipmentStore()

  // 构建 ID -> Name 映射
  const categoryNameMap = useMemo(() => buildIdNameMap(categories), [categories])
  const locationNameMap = useMemo(() => buildIdNameMap(locations), [locations])

  const handleDelete = useCallback((record: Equipment) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除设备 "${record.name}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteEquipment(record.id)
          message.success('删除设备成功')
          onRefresh?.()
        } catch (error: any) {
          // 显示后端返回的具体错误信息
          const errorMsg = error?.message || '删除设备失败'
          message.error(errorMsg)
        }
      },
    })
  }, [modal, message, onRefresh])

  const columns = [
    {
      title: '设备编号',
      dataIndex: 'equipment_no',
      key: 'equipment_no',
      width: 140,
      fixed: 'start' as const,
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      fixed: 'start' as const,
      ellipsis: true,
    },
    {
      title: '设备分类',
      dataIndex: 'category_id',
      key: 'category',
      width: 120,
      render: (categoryId: string) => categoryNameMap[categoryId] || '-',
    },
    {
      title: '设备位置',
      dataIndex: 'location_id',
      key: 'location',
      width: 120,
      render: (locationId: string) => locationNameMap[locationId] || '-',
    },
    {
      title: '设备状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: EquipmentStatus) => (
        <span style={statusPillMap[status] || statusPill('#787671', '#f0eeec')}>{status}</span>
      ),
    },
    {
      title: '重要性',
      dataIndex: 'importance',
      key: 'importance',
      width: 80,
      render: (importance: string) => {
        const map: Record<string, CSSProperties> = {
          '高': pillPurple,
          '中': pillNeutral,
          '低': pillNeutral,
        }
        return <span style={map[importance] || pillNeutral}>{importance}</span>
      },
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
      width: 140,
      ellipsis: true,
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 150,
      ellipsis: true,
    },
    {
      title: '投用日期',
      dataIndex: 'commissioning_date',
      key: 'commissioning_date',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 170,
      fixed: 'end' as const,
      render: (_: unknown, record: Equipment) => (
        <Space size={8}>
          <span role="button" onClick={() => openRepairDrawer(record.id)} style={linkWarning}>
            <ToolOutlined />报修
          </span>
          <span role="button" onClick={() => openEquipmentDrawer(record)} style={linkPrimary}>
            <EditOutlined />编辑
          </span>
          <span role="button" onClick={() => handleDelete(record)} style={linkDanger}>
            <DeleteOutlined />删除
          </span>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
        <Select
          placeholder="设备状态"
          allowClear
          style={{ width: 120 }}
          value={statusFilter || undefined}
          onChange={(value) => setStatusFilter(value || '')}
          options={statusOptions}
        />
        <Input
          placeholder="搜索设备编号或名称"
          prefix={<SearchOutlined style={{ color: '#a4a097' }} />}
          style={{ width: 240 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
        />
        <div style={{ flex: 1 }} />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openEquipmentDrawer()}
        >
          新增设备
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={equipments}
        rowKey="id"
        size="small"
        loading={loading}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (newPage, newPageSize) => {
            setPage(newPage)
            setPageSize(newPageSize)
          },
        }}
      />
    </div>
  )
}
