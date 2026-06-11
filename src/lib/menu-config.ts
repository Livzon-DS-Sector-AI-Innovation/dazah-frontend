export interface SubMenuItem {
  key: string
  label: string
  path: string
  children?: SubMenuItem[]   // 嵌套子菜单 → Ant Design SubMenu
  disabled?: boolean         // 灰显占位，功能未开发
}

export interface ModuleMenu {
  key: string
  label: string
  icon: string
  path: string
  children: SubMenuItem[]
}

export const moduleMenus: ModuleMenu[] = [
  {
    key: "production",
    label: "生产管理",
    icon: "factory",
    path: "/production",
    children: [
      { key: "batches", label: "批次管理", path: "/production/batches" },
      { key: "plan", label: "生产计划", path: "/production/plan" },
      { key: "process", label: "工艺规程", path: "/production/process" },
      { key: "records", label: "生产记录", path: "/production/records" },
      { key: "balance", label: "物料平衡", path: "/production/balance" },
      { key: "label-verification", label: "标签验证", path: "/production/label-verification" },
    ],
  },
  {
    key: "equipment",
    label: "设备管理",
    icon: "cog",
    path: "/equipment",
    children: [
      { key: "stats", label: "设备仪表盘", path: "/equipment/stats" },
      { key: "assets", label: "设备台账", path: "/equipment/assets" },
      { key: "maintenance", label: "维护保养", path: "/equipment/maintenance" },
      { key: "inspection", label: "设备巡检", path: "/equipment/inspection" },
      { key: "spare-parts", label: "备件管理", path: "/equipment/spare-parts" },
    ],
  },
  {
    key: "energy",
    label: "能源管理",
    icon: "bolt",
    path: "/energy",
    children: [
      { key: "overview", label: "能源总览", path: "/energy" },
      { key: "devices", label: "设备配置", path: "/energy/devices" },
      { key: "alerts", label: "预警管理", path: "/energy/alerts" },
      { key: "collect-logs", label: "采集日志", path: "/energy/collect-logs" },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // 安全管理模块 — 按化工安全生产管理体系分级
  // ═══════════════════════════════════════════════════════
  {
    key: "safety",
    label: "安全管理",
    icon: "shield",
    path: "/safety",
    children: [
            // ── 系统配置 ──
      {
        key: "system-config",
        label: "系统配置",
        path: "",
        children: [
          { key: "ai-workflow", label: "AI工作流配置", path: "/safety/ai-workflow-config" },
          { key: "api-config", label: "API调用配置", path: "/safety/api-call-config" },
        ],
      },
      // ── 作业安全 ──
      {
        key: "ops-safety",
        label: "作业安全",
        path: "",
        children: [
          { key: "special-ops-ledger", label: "特殊作业台账", path: "/safety/special-ops" },
          { key: "special-ops-report", label: "特殊作业报备", path: "/safety/special-ops/report" },
          { key: "daily-risk-report", label: "关键风险作业报备", path: "/safety/risk-reporting" },
        ],
      },
      // ── 风险与隐患 ──
      {
        key: "risk-hazard",
        label: "风险与隐患",
        path: "",
        children: [
          {
            key: "risk-grading",
            label: "风险分级管控",
            path: "",
            children: [
              { key: "hazard-identification", label: "危险源辨识工作流", path: "/safety/hazard-identification" },
              { key: "hazard-archive", label: "危险源辨识台账", path: "/safety/hazard-identification" },
            ],
          },
          {
            key: "regulation",
            label: "安全操规管理",
            path: "",
            children: [
              { key: "regulation-list", label: "安全操规台账", path: "/safety/regulation" },
            ],
          },
          {
            key: "ehs-change",
            label: "EHS变更管理",
            path: "",
            children: [
              { key: "ehs-change-apply", label: "EHS变更申请", path: "/safety/ehs-change" },
              { key: "ehs-change-accept", label: "EHS变更验收", path: "/safety/ehs-change" },
            ],
          },
          {
            key: "hazard-inspection",
            label: "隐患排查治理",
            path: "",
            children: [
              { key: "hazard-check", label: "隐患排查", path: "/safety/hazard" },
              { key: "hazard-ledger", label: "隐患台账", path: "/safety/hazard" },
            ],
          },
        ],
      },

      // ── 应急与事故 ──
      {
        key: "emergency-accident",
        label: "应急与事故",
        path: "",
        children: [
          { key: "accident-ledger", label: "事故台账", path: "/safety/accident" },
          { key: "emergency-plan", label: "应急预案管理", path: "", disabled: true },
          { key: "emergency-drill", label: "应急演练管理", path: "", disabled: true },
        ],
      },

      // ── 人员资质与培训 ──
      {
        key: "personnel-training",
        label: "人员资质与培训",
        path: "",
        children: [
          { key: "training", label: "安全培训管理", path: "/safety/training" },
          { key: "personnel-qual", label: "厂内人员资质", path: "/safety/special-ops/personnel" },
          { key: "contractor", label: "承包商管理", path: "/safety/contractor" },
        ],
      },

      // ── 职业健康与环境 ──
      {
        key: "oh-env",
        label: "职业健康与环境",
        path: "",
        children: [
          { key: "oh-monitor", label: "职业危害因素监测", path: "/safety/occupational-health" },
          { key: "oh-exam", label: "职业健康体检", path: "/safety/occupational-health" },
          { key: "ppe", label: "劳动防护用品管理", path: "", disabled: true },
        ],
      },

      // ── 法规与安全信息 ──
      {
        key: "regulation-info",
        label: "法规与安全信息",
        path: "",
        children: [
          { key: "knowledge-base", label: "安全知识库", path: "/safety/knowledge-base" },
          { key: "compliance-eval", label: "合规性评价记录", path: "", disabled: true },
        ],
      },
    ],
  },

  {
    key: "rd",
    label: "研发管理",
    icon: "beaker",
    path: "/rd",
    children: [
      { key: "projects", label: "研发项目", path: "/rd/projects" },
      { key: "experiments", label: "实验记录", path: "/rd/experiments" },
      { key: "reports", label: "研发报告", path: "/rd/reports" },
      { key: "bayesian", label: "贝叶斯优化", path: "/rd/bayesian" },
      { key: "ich-analysis", label: "ICH Q3C、Q3D杂质识别", path: "/rd/ich-analysis" },
    ],
  },
  {
    key: "registration",
    label: "注册管理",
    icon: "document",
    path: "/registration",
    children: [
      { key: "review", label: "申报进度", path: "/registration/review" },
      { key: "filing", label: "注册申报", path: "/registration/filing" },
      { key: "writing", label: "申报文件撰写", path: "/registration/writing" },
      { key: "regulation", label: "法规跟踪", path: "/registration/regulation" },
      { key: "documents", label: "文件管理", path: "/registration/documents" },
    ],
  },
  {
    key: "quality",
    label: "质量管理",
    icon: "check-circle",
    path: "/quality",
    children: [
      { key: "deviations", label: "偏差管理", path: "/quality/deviations" },
      { key: "capas", label: "CAPA管理", path: "/quality/capas" },
      { key: "department-contacts", label: "部门联系人", path: "/quality/department-contacts" },
      { key: "inspection", label: "质量检验", path: "/quality/inspection" },
      { key: "change", label: "变更控制", path: "/quality/change" },
      { key: "cpv", label: "持续工艺验证", path: "/quality/cpv" },
    ],
  },
  {
    key: "admin",
    label: "行政管理",
    icon: "building",
    path: "/admin",
    children: [
      { key: "meeting", label: "会议室管理", path: "/admin/meeting" },
      { key: "vehicle", label: "车辆管理", path: "/admin/vehicle" },
      { key: "asset", label: "资产管理", path: "/admin/asset" },
    ],
  },
  {
    key: "hr",
    label: "人事管理",
    icon: "users",
    path: "/hr",
    children: [
      { key: "departments", label: "部门管理", path: "/hr/departments" },
      { key: "profile", label: "员工档案", path: "/hr/profile" },
      { key: "roster", label: "员工花名册", path: "/hr/roster" },
      { key: "offboarding", label: "离职管理", path: "/hr/offboarding" },
      { key: "attendance", label: "考勤管理", path: "/hr/attendance" },
      { key: "training", label: "培训管理", path: "/hr/training" },
    ],
  },
  {
    key: "warehouse",
    label: "仓储管理",
    icon: "archive",
    path: "/warehouse",
    children: [
      { key: "inventory", label: "库存管理", path: "/warehouse/inventory" },
      { key: "inout", label: "出入库记录", path: "/warehouse/inout" },
      { key: "stocktake", label: "库存盘点", path: "/warehouse/stocktake" },
    ],
  },
  {
    key: "purchasing",
    label: "采购管理",
    icon: "cart",
    path: "/purchasing",
    children: [
      { key: "request", label: "采购申请", path: "/purchasing/request" },
      { key: "supplier", label: "供应商管理", path: "/purchasing/supplier" },
      { key: "order", label: "采购订单", path: "/purchasing/order" },
    ],
  },
]

export function getModuleByKey(key: string): ModuleMenu | undefined {
  return moduleMenus.find((m) => m.key === key)
}
