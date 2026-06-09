"use client"

import Link from 'next/link'
import { Card, Row, Col } from 'antd'
import { TeamOutlined, ClockCircleOutlined, BookOutlined } from '@ant-design/icons'

const modules = [
  {
    key: 'profile',
    title: '员工档案',
    desc: '管理员工基本信息、入职离职、岗位变动等',
    icon: <TeamOutlined className="text-2xl text-[var(--color-primary)]" />,
    path: '/hr/profile',
  },
  {
    key: 'attendance',
    title: '考勤管理',
    desc: '考勤记录、请假审批、加班统计等',
    icon: <ClockCircleOutlined className="text-2xl text-[var(--color-primary)]" />,
    path: '/hr/attendance',
  },
  {
    key: 'training',
    title: '培训管理',
    desc: '培训计划、课程安排、培训记录等',
    icon: <BookOutlined className="text-2xl text-[var(--color-primary)]" />,
    path: '/hr/training',
  },
]

export default function HrPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold text-[var(--color-charcoal)] mb-2">
          人事管理
        </h1>
        <p className="text-[14px] text-[var(--color-steel)]">
          人员、岗位、培训、考勤等人事业务数据管理
        </p>
      </div>

      <Row gutter={[16, 16]}>
        {modules.map((mod) => (
          <Col xs={24} sm={12} lg={8} key={mod.key}>
            <Link href={mod.path}>
              <Card
                hoverable
                className="h-full cursor-pointer transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">{mod.icon}</div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-[var(--color-charcoal)] mb-1">
                      {mod.title}
                    </h3>
                    <p className="text-[14px] text-[var(--color-steel)] leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  )
}
