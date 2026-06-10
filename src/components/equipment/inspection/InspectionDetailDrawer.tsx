'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { App, Drawer, Table, Tag, Typography, Image, Descriptions } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useInspectionStore } from '@/stores/inspection'
import { fetchInspectionHistoryDetail } from '@/lib/api/inspection'
import { getInspectionPhotoUrl } from '@/lib/api/inspection'
import type { InspectionTaskDetail, InspectionRecord, InspectionPhoto } from '@/types/inspection'
import dayjs from 'dayjs'

const { Text } = Typography

/** 按 equipment_id 分组记录 */
function groupRecordsByEquipment(records: InspectionRecord[]): Map<string, InspectionRecord[]> {
  const map = new Map<string, InspectionRecord[]>()
  for (const r of records) {
    const key = r.equipment_id || '__no_equipment__'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(r)
  }
  return map
}

export function InspectionDetailDrawer() {
  const { message } = App.useApp()
  const {
    historyDetailOpen, detailTaskId, closeHistoryDetail,
  } = useInspectionStore()
  const [detail, setDetail] = useState<InspectionTaskDetail | null>(null)
  const [loading, setLoading] = useState(false)

  const loadDetail = useCallback(async () => {
    if (!detailTaskId) return
    setLoading(true)
    try {
      const result = await fetchInspectionHistoryDetail(detailTaskId)
      setDetail(result)
    } catch {
      message.error('加载详情失败')
    } finally {
      setLoading(false)
    }
  }, [detailTaskId, message])

  useEffect(() => {
    if (historyDetailOpen && detailTaskId) {
      loadDetail()
    }
  }, [historyDetailOpen, detailTaskId, loadDetail])

  // 按设备分组
  const recordGroups = useMemo(() => {
    if (!detail?.records?.length) return []
    const map = groupRecordsByEquipment(detail.records)
    return Array.from(map.entries()).map(([equipmentId, records]) => ({
      equipmentId,
      equipmentName: records[0]?.equipment_name || equipmentId.slice(0, 8) + '…',
      records,
    }))
  }, [detail])

  const recordColumns: ColumnsType<InspectionRecord> = [
    { title: '检查项', dataIndex: 'item_name', key: 'item_name', width: 160 },
    { title: '预期结果', dataIndex: 'expected_result', key: 'expected_result', width: 140, render: (v: string | null) => v || '-' },
    {
      title: '结果', dataIndex: 'result', key: 'result', width: 80,
      render: (r: string) => (
        <Tag style={{
          color: r === '正常' ? '#1aae39' : r === '异常' ? '#e03131' : '#787671',
          background: r === '正常' ? '#d9f3e1' : r === '异常' ? '#fde0ec' : '#f0eeec',
          border: 'none', borderRadius: 4, fontWeight: 500,
        }}>{r}</Tag>
      ),
    },
    { title: '实际值', dataIndex: 'actual_value', key: 'actual_value', width: 120, render: (v: string | null) => v || '-' },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 150, render: (v: string | null) => v || '-' },
  ]

  // 多设备时显示分组
  const multiDevice = recordGroups.length > 1

  return (
    <Drawer
      title="巡检详情"
      size={800}
      open={historyDetailOpen}
      onClose={closeHistoryDetail}
      destroyOnHidden
    >
      {loading && <Text type="secondary">加载中...</Text>}
      {!loading && detail && (
        <div>
          <Descriptions column={2} size="small" bordered style={{ marginBottom: 24 }}>
            <Descriptions.Item label="任务编号">{detail.task_no}</Descriptions.Item>
            <Descriptions.Item label="巡检类型">{detail.plan_type}</Descriptions.Item>
            <Descriptions.Item label="路线/设备">{detail.route_name || detail.equipment_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="巡检人员">{detail.assignee_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="计划日期">{detail.planned_date}</Descriptions.Item>
            <Descriptions.Item label="状态">{detail.status}</Descriptions.Item>
            <Descriptions.Item label="开始时间">{detail.started_at ? dayjs(detail.started_at).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
            <Descriptions.Item label="完成时间">{detail.completed_at ? dayjs(detail.completed_at).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
            {detail.overall_result && (
              <Descriptions.Item label="巡检结果">
                <Tag style={{
                  color: detail.overall_result === '正常' ? '#1aae39' : '#e03131',
                  background: detail.overall_result === '正常' ? '#d9f3e1' : '#fde0ec',
                  border: 'none', borderRadius: 4, fontWeight: 500,
                }}>{detail.overall_result}</Tag>
              </Descriptions.Item>
            )}
          </Descriptions>

          {/* 线路巡检现场描述 */}
          {detail.plan_type === '线路巡检' && detail.route_summary && (
            <div style={{
              padding: 16, marginBottom: 24,
              background: '#fafaf9', borderRadius: 8,
              border: '1px solid #ede9e4',
            }}>
              <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>📝 现场描述</Text>
              <Text style={{ fontSize: 13, color: '#5d5b54', whiteSpace: 'pre-wrap' }}>{detail.route_summary}</Text>
            </div>
          )}

          {/* Photos */}
          {detail.photos && detail.photos.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 12 }}>📸 到位照片</Text>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {detail.photos.map((photo: InspectionPhoto) => (
                  <Image
                    key={photo.id}
                    src={getInspectionPhotoUrl(photo.id)}
                    alt={photo.file_name}
                    width={120}
                    height={120}
                    style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e3df' }}
                    fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2YwZWVlYyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjYTRhMDk3IiBmb250LXNpemU9IjEyIj7lm77niYflpLHotKU8L3RleHQ+PC9zdmc+"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Records — 按设备分组 */}
          <div>
            <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 12 }}>📋 检查记录</Text>
            {recordGroups.length === 0 && (
              <Text type="secondary">
                {detail.plan_type === '线路巡检' ? '线路巡检模式，无逐设备检查记录' : '无记录'}
              </Text>
            )}
            {recordGroups.map((group, idx) => (
              <div key={group.equipmentId} style={{ marginBottom: idx < recordGroups.length - 1 ? 24 : 0 }}>
                {/* 多设备时显示设备标题 */}
                {multiDevice && (
                  <div style={{
                    padding: '8px 14px', marginBottom: 10,
                    background: '#0a1530', borderRadius: 6,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 22, height: 22, borderRadius: 11,
                      background: 'rgba(255,255,255,0.15)', color: '#fff',
                      fontSize: 12, fontWeight: 700,
                    }}>
                      {idx + 1}
                    </span>
                    <Text strong style={{ color: '#fff', fontSize: 14 }}>{group.equipmentName}</Text>
                  </div>
                )}
                <Table
                  columns={recordColumns}
                  dataSource={group.records}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {!loading && !detail && <Text type="secondary">无数据</Text>}
    </Drawer>
  )
}
