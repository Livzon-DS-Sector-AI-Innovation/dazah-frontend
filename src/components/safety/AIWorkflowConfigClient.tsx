'use client'

import { useState, useCallback } from 'react'
import { Typography, App } from 'antd'
import { ApiOutlined, CheckCircleOutlined } from '@ant-design/icons'
import type { AIWorkflowConfig } from '@/types/safety'
import { WORKFLOW_MENU_MAP } from '@/types/safety'
import AIWorkflowCard from './AIWorkflowCard'
import WorkflowEditDrawer from './WorkflowEditDrawer'

const { Title, Text } = Typography

// ═══════════════════════════════════════════
// 暂不开放的 AI 工作流 module_code（后续按需添加）
// ═══════════════════════════════════════════

const EXCLUDED_MODULE_CODES = new Set([
  'regulation-revision',   // 操规AI修订管道（未开发）
  'hazard-revision',       // 修订范围AI识别（未开发）
  'hazard',                // 隐患AI分析管道（未开发）
])

// ═══════════════════════════════════════════
// 内置工作流清单（DB 无记录时展示，含 4 字段预填配置）
// ═══════════════════════════════════════════

import type { WorkflowStepItem } from '@/types/safety'

interface BuiltInWorkflow {
  module_code: string
  workflow_name: string
  workflow_description: string
  trigger_event: string
  icon: string
  script_configs: WorkflowStepItem[]
}

const BUILT_IN_WORKFLOWS: BuiltInWorkflow[] = [
  {
    module_code: 'special-ops-critical',
    workflow_name: 'AI关键作业判定',
    workflow_description:
      '特殊作业报备提交时自动识别是否属于关键作业（动火/受限空间/高处/吊装），辅助安全管理人员快速分级审批',
    trigger_event: 'submit',
    icon: '🏗️',
    script_configs: [
      {
        script_number: 1,
        name: 'AI关键作业判定',
        input_info:
          '## 报备信息\n' +
          '从特殊作业报备中获取以下信息：\n' +
          '- 作业类型（动火/受限空间/高处/吊装/临时用电/盲板抽堵/动土/断路）\n' +
          '- 作业级别（特级/一级/二级）\n' +
          '- 作业地点\n' +
          '- 作业部门\n' +
          '- 作业内容描述\n' +
          '- 风险等级\n' +
          '- 安全措施\n' +
          '- 风险评估\n' +
          '- 应急消防器材配置',
        work_rules:
          '## 任务\n' +
          '判定当前特殊作业报备是否属于「关键风险作业」。\n\n' +
          '## 判定标准（参照 GB 30871-2022）\n' +
          '1. 特级或一级动火作业\n' +
          '2. 受限空间内涉及易燃易爆、有毒有害介质的作业\n' +
          '3. 30米以上的高处作业\n' +
          '4. 涉及重大危险源的临时用电\n' +
          '5. 涉及有毒有害、易燃易爆介质的盲板抽堵\n' +
          '6. 超过5米的深基坑动土作业\n' +
          '7. 大型或特大型起重吊装（100吨以上或非常规起重）\n' +
          '8. 涉及有毒有害、易燃易爆介质的管线打开\n' +
          '9. 两个及以上特殊作业类型的交叉作业\n' +
          '10. 风险等级为一级或二级的高风险作业\n\n' +
          '## 约束\n' +
          '- 仅基于报备中已填写的信息进行判定，不得编造未提供的信息\n' +
          '- 信息不足时倾向于不判定为关键作业\n' +
          '- 遵循保守原则：不确定时不判定为关键作业\n' +
          '- 你是一名化工安全专家，严格按照 GB 30871-2022 标准判定',
        reference_docs:
          '## 参考标准\n' +
          '- GB 30871-2022《危险化学品企业特殊作业安全规范》\n' +
          '- 企业特殊作业安全管理制度\n' +
          '- 企业风险分级管控标准',
        output_format:
          '## 输出格式\n' +
          '返回 JSON 格式（只返回 JSON，不要额外说明）：\n' +
          '```json\n' +
          '{\n' +
          '  "is_critical": true,\n' +
          '  "reason": "判定理由（说明符合哪些关键作业判定条件，或不符合的原因）"\n' +
          '}\n' +
          '```',
        expected_keys: ['is_critical', 'reason'],
        is_enabled: true,
      },
    ],
  },
  {
    module_code: 'special-ops-export',
    workflow_name: 'AI智能导出（自然语言解析）',
    workflow_description:
      '支持自然语言筛选条件输入，AI 解析意图后智能导出台账 Excel，简化数据检索流程',
    trigger_event: 'manual_start',
    icon: '📊',
    script_configs: [
      {
        script_number: 1,
        name: 'AI智能导出（自然语言解析）',
        input_info:
          '## 用户输入\n' +
          '用户通过自然语言描述台账筛选条件，例如：\n' +
          '- "查看所有动火作业"\n' +
          '- "上周高处作业的台账"\n' +
          '- "关键作业中未完成的"\n' +
          '- "生产部的受限空间作业"\n' +
          '\n' +
          '需要将用户的自然语言输入解析为结构化的筛选参数。',
        work_rules:
          '## 任务\n' +
          '将用户的自然语言查询转换为结构化的特殊作业台账筛选条件。\n\n' +
          '## 可用筛选字段\n' +
          '- operation_type: hot_work/confined_space/height_work/temporary_electricity/blind_plate/excavation/lifting/road_breaking\n' +
          '- operation_level: special/grade1/grade2\n' +
          '- risk_level: level_1/level_2/level_3/level_4\n' +
          '- department: 部门名称（字符串）\n' +
          '- date_from: 开始日期 YYYY-MM-DD\n' +
          '- date_to: 结束日期 YYYY-MM-DD\n' +
          '- keyword: 模糊搜索关键词\n' +
          '- is_critical: true/false\n\n' +
          '## 映射规则\n' +
          '- 作业类型：动火作业→hot_work, 受限空间→confined_space, 高处作业→height_work, 临时用电→temporary_electricity, 盲板抽堵→blind_plate, 动土作业→excavation, 起重吊装→lifting, 断路作业→road_breaking\n' +
          '- 风险等级：一级/重大→level_1, 二级/较大→level_2, 三级/一般→level_3, 四级/低→level_4\n' +
          '- 作业级别：特级→special, 一级→grade1, 二级→grade2\n\n' +
          '## 约束\n' +
          '- 无法识别的字段设为 null\n' +
          '- 对时间表达（今天、本周、上月等）正确计算日期范围\n' +
          '- 保留用户原始输入中的关键词\n' +
          '- 你是一个数据库查询助手，只返回 JSON',
        reference_docs:
          '## 参考\n' +
          '- 特殊作业报备数据模型（八大特殊作业类型）\n' +
          '- GB 30871-2022《危险化学品企业特殊作业安全规范》分类标准\n' +
          '- 企业风险分级管控标准',
        output_format:
          '## 输出格式\n' +
          '返回 JSON 格式（未匹配字段设为 null，只返回 JSON 不要额外说明）：\n' +
          '```json\n' +
          '{\n' +
          '  "operation_type": null,\n' +
          '  "operation_level": null,\n' +
          '  "risk_level": null,\n' +
          '  "department": null,\n' +
          '  "date_from": null,\n' +
          '  "date_to": null,\n' +
          '  "keyword": null,\n' +
          '  "is_critical": null,\n' +
          '  "explanation": "用中文简述你理解的筛选条件"\n' +
          '}\n' +
          '```',
        expected_keys: [
          'operation_type', 'operation_level', 'risk_level',
          'department', 'date_from', 'date_to',
          'keyword', 'is_critical', 'explanation',
        ],
        is_enabled: true,
      },
    ],
  },
]

// ═══════════════════════════════════════════

interface Props {
  initialWorkflows: AIWorkflowConfig[]
  apiConnected: boolean
  apiModelLabel?: string
}

export default function AIWorkflowConfigClient({

  initialWorkflows,
  apiConnected,
  apiModelLabel,
}: Props) {
  const { message } = App.useApp()

  const [workflows, setWorkflows] = useState<AIWorkflowConfig[]>(
    () => initialWorkflows.filter((w) => !EXCLUDED_MODULE_CODES.has(w.module_code)),
  )
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<AIWorkflowConfig | null>(null)

  const refresh = useCallback(async () => {
    // Re-fetch via server action
    const { getAIWorkflowConfigs } = await import('@/actions/safety')
    try {
      const res = await getAIWorkflowConfigs({ page_size: 500 })
      setWorkflows(
        (res.data || []).filter((w) => !EXCLUDED_MODULE_CODES.has(w.module_code)),
      )
    } catch {
      message.error('刷新失败')
    }
  }, [])

  // Merge DB configs with built-in workflows
  const allWorkflows = [...workflows]
  for (const builtIn of BUILT_IN_WORKFLOWS) {
    if (!allWorkflows.find((w) => w.module_code === builtIn.module_code)) {
      allWorkflows.push({
        id: `builtin-${builtIn.module_code}`,
        module_code: builtIn.module_code,
        workflow_name: builtIn.workflow_name,
        workflow_description: builtIn.workflow_description,
        trigger_event: builtIn.trigger_event,
        is_enabled: true,
        script_configs: builtIn.script_configs,
        sort_order: 99,
        notes: '内置工作流（点击编辑可创建数据库配置）',
        created_at: '',
        updated_at: '',
      })
    }
  }

  // Group by menu group
  const grouped: Record<string, AIWorkflowConfig[]> = {}
  for (const w of allWorkflows) {
    const menu = WORKFLOW_MENU_MAP[w.module_code]
    const group = menu?.group || '其他'
    if (!grouped[group]) grouped[group] = []
    grouped[group].push(w)
  }

  const handleEdit = (workflow: AIWorkflowConfig) => {
    setEditingWorkflow(workflow)
    setDrawerOpen(true)
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* ── Page Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, color: '#37352f' }}>
            AI 工作流配置
          </Title>
          <Text style={{ fontSize: 14, color: '#787671' }}>
            管理安全管理模块所有 AI Agent 工作流的提示词与参数
          </Text>
        </div>

        {/* API status badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 20,
            background: apiConnected ? '#d9f3e1' : '#fde0ec',
            fontSize: 13,
            fontWeight: 500,
            color: apiConnected ? '#1aae39' : '#e03131',
          }}
        >
          {apiConnected ? (
            <>
              <CheckCircleOutlined />
              API: {apiModelLabel || '已连接'}
            </>
          ) : (
            <>
              <ApiOutlined />
              API: 未连接
            </>
          )}
        </div>
      </div>

      {/* ── Workflow Cards by Group ── */}
      {Object.entries(grouped).map(([group, groupWorkflows]) => (
        <div key={group} style={{ marginBottom: 24 }}>
          {/* Group label */}
          <Text
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#bbb8b1',
              textTransform: 'uppercase',
              letterSpacing: 1,
              display: 'block',
              marginBottom: 12,
              paddingLeft: 4,
            }}
          >
            {group}
          </Text>

          {groupWorkflows
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((w) => (
              <AIWorkflowCard
                key={w.id}
                workflow={w}
                onEdit={handleEdit}
                onRefresh={refresh}
              />
            ))}
        </div>
      ))}

      {/* ── API Config Link ── */}
      <div
        style={{
          borderRadius: 12,
          border: '1px dashed #c8c4be',
          background: '#fafaf9',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#f0eeec',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            🔌
          </div>
          <div>
            <Text style={{ fontSize: 14, fontWeight: 500, color: '#37352f' }}>
              全局 API 连接
            </Text>
            <br />
            <Text style={{ fontSize: 12, color: '#bbb8b1' }}>
              AI 模型连接参数在「API调用配置」中统一管理
            </Text>
          </div>
        </div>
        <a
          href="/safety/api-call-config"
          style={{
            fontSize: 13,
            color: '#5645d4',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          前往配置 →
        </a>
      </div>

      {/* ── Edit Drawer ── */}
      <WorkflowEditDrawer
        open={drawerOpen}
        workflow={editingWorkflow}
        onClose={() => {
          setDrawerOpen(false)
          setEditingWorkflow(null)
        }}
        onSaved={refresh}
      />
    </div>
  )
}
