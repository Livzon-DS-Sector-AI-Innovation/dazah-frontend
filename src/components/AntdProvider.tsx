'use client'

import { App, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { antdTheme } from '@/lib/antd-theme'

interface AntdProviderProps {
  children: React.ReactNode
}

export function AntdProvider({ children }: AntdProviderProps) {
  return (
    <ConfigProvider theme={antdTheme} locale={zhCN}>
      <App component={false}>
        {children}
      </App>
    </ConfigProvider>
  )
}
