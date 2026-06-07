'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button, message, Tabs } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { Employee, Department } from '@/types/hr'
import { fetchEmployeesAction } from '@/actions/hr'
import { fetchDepartments } from '@/lib/api/hr'
import { useHrStore } from '@/stores/hr'
import EmployeeTable from './EmployeeTable'
import EmployeeForm from './EmployeeForm'
import FeishuSyncPanel from './FeishuSyncPanel'

interface EmployeeProfileClientProps {
  initialEmployees: Employee[]
  initialTotal: number
}

export default function EmployeeProfileClient({
  initialEmployees,
  initialTotal,
}: EmployeeProfileClientProps) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [formOpen, setFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)

  const { searchKeyword, filterStatus } = useHrStore()

  const activeDepartment =
    activeTab === 'all'
      ? ''
      : departments.find((d) => d.id === activeTab)?.name || ''

  const loadData = useCallback(async () => {
    try {
      const res = await fetchEmployeesAction({
        keyword: searchKeyword || undefined,
        department: activeDepartment || undefined,
        status: filterStatus || undefined,
        page,
        page_size: pageSize,
      })
      setEmployees(res.data)
      setTotal(res.meta?.total || 0)
    } catch (err: any) {
      message.error(err.message || '加载数据失败')
    }
  }, [searchKeyword, activeDepartment, filterStatus, page, pageSize])

  const loadDepartments = useCallback(async () => {
    try {
      const res = await fetchDepartments({ page_size: 100 })
      setDepartments(res.data)
    } catch {
      setDepartments([])
    }
  }, [])

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage)
    setPageSize(newPageSize)
  }

  const handleRefresh = () => {
    loadData()
    loadDepartments()
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormOpen(true)
  }

  const handleAdd = () => {
    setEditingEmployee(null)
    setFormOpen(true)
  }

  const handleFormSuccess = () => {
    loadData()
  }

  const handleTabChange = (key: string) => {
    setActiveTab(key)
    setPage(1)
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetchEmployeesAction({
          department: activeDepartment || undefined,
          status: filterStatus || undefined,
          keyword: searchKeyword || undefined,
          page,
          page_size: pageSize,
        })
        if (!cancelled) {
          setEmployees(res.data)
          setTotal(res.meta?.total || 0)
        }
      } catch (err: any) {
        if (!cancelled) message.error(err.message || '加载数据失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [activeDepartment, filterStatus, searchKeyword, page, pageSize])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetchDepartments({ page_size: 100 })
        if (!cancelled) setDepartments(res.data || [])
      } catch (err: any) {
        if (!cancelled) message.error(err.message || '加载部门失败')
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const tabItems = [
    { key: 'all', label: '全部', value: '' },
    ...departments.map((d) => ({ key: d.id, label: d.name, value: d.name })),
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-[22px] font-semibold text-[var(--color-charcoal)]">
          员工档案
        </h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增员工
        </Button>
      </div>

      <FeishuSyncPanel onSynced={handleRefresh} />

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        type="card"
        items={tabItems.map((dept) => ({
          key: dept.key,
          label: dept.label,
          children: (
            <EmployeeTable
              employees={employees}
              total={total}
              page={page}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onRefresh={handleRefresh}
              onEdit={handleEdit}
            />
          ),
        }))}
      />

      <EmployeeForm
        open={formOpen}
        employee={editingEmployee}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}
