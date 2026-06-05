"use client"

import { usePathname, useRouter } from "next/navigation"
import { Menu } from "antd"
import type { MenuProps } from "antd"
import { getModuleByKey } from "@/lib/menu-config"

type MenuItem = Required<MenuProps>['items'][number]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const moduleKey = pathname.split("/")[1] || "production"
  const currentModule = getModuleByKey(moduleKey)

  if (!currentModule) return null

  const menuItems: MenuItem[] = currentModule.children.map((item) => ({
    key: item.path,
    label: item.label,
  }))

  // 按路径长度降序排序，优先匹配更具体的路径
  const sortedChildren = [...currentModule.children].sort(
    (a, b) => b.path.length - a.path.length
  )

  const selectedKey = sortedChildren.find(
    (item) => pathname === item.path || pathname.startsWith(item.path + "/")
  )?.path || currentModule.children[0]?.path

  const handleClick: MenuProps['onClick'] = ({ key }) => {
    router.push(key)
  }

  return (
    <aside className="w-56 bg-[var(--color-canvas)] border-r border-[var(--color-hairline)] flex flex-col shrink-0 overflow-y-auto">
      <div className="px-4 pt-5 pb-3">
        <h2 className="text-[18px] font-semibold text-[var(--color-charcoal)]">
          {currentModule.label}
        </h2>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={handleClick}
        className="sidebar-menu flex-1"
        style={{ borderInlineEnd: 'none' }}
      />

      <div className="px-4 py-3 border-t border-[var(--color-hairline-soft)]">
        <p className="text-[12px] text-[var(--color-stone)]">
          v0.1.0
        </p>
      </div>
    </aside>
  )
}
