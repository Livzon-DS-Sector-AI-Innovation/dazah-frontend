'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Card, Tree, Button, Space, Tag, Upload, message, Spin, Empty, Descriptions,
  Divider, Popconfirm, Breadcrumb, List, Typography, Tabs, Modal,
} from 'antd'
import {
  ArrowLeftOutlined, FileWordOutlined, UploadOutlined, DeleteOutlined,
  DownloadOutlined, FolderOutlined, FileOutlined, ReloadOutlined,
  EyeOutlined, CheckCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useDossierWriterStore } from '@/stores/dossier-writer'
import {
  uploadChapterAsset, deleteChapterAsset, exportDossier, uploadTemplates, parseTemplates,
  getDownloadUrl, getChapterPreview, matchAssetsToChapters,
} from '@/lib/api/dossier-writer-client'
import type { Chapter, ChapterAsset } from '@/types/dossier-writer'
import type { UploadResponse, ChapterPreview } from '@/lib/api/dossier-writer-client'

const { Text, Title, Paragraph } = Typography

// M3 标准目录结构（固定）
const M3_STRUCTURE = [
  { code: "3.2", title: "主体数据", level: 1, parent_code: null },
  { code: "3.2.S", title: "原料药", level: 2, parent_code: "3.2" },
  { code: "3.2.S.1", title: "基本信息", level: 3, parent_code: "3.2.S" },
  { code: "3.2.S.1.1", title: "药品名称", level: 4, parent_code: "3.2.S.1" },
  { code: "3.2.S.1.2", title: "结构", level: 4, parent_code: "3.2.S.1" },
  { code: "3.2.S.1.3", title: "基本性质", level: 4, parent_code: "3.2.S.1" },
  { code: "3.2.S.2", title: "生产", level: 3, parent_code: "3.2.S" },
  { code: "3.2.S.2.1", title: "生产商", level: 4, parent_code: "3.2.S.2" },
  { code: "3.2.S.2.2", title: "生产工艺控制", level: 4, parent_code: "3.2.S.2" },
  { code: "3.2.S.2.3", title: "物料控制", level: 4, parent_code: "3.2.S.2" },
  { code: "3.2.S.2.4", title: "关键步骤和中间体的控制", level: 4, parent_code: "3.2.S.2" },
  { code: "3.2.S.2.5", title: "工艺验证和/或评价", level: 4, parent_code: "3.2.S.2" },
  { code: "3.2.S.2.6", title: "生产工艺的开发", level: 4, parent_code: "3.2.S.2" },
  { code: "3.2.S.3", title: "特性鉴定", level: 3, parent_code: "3.2.S" },
  { code: "3.2.S.3.1", title: "结构和理化性质", level: 4, parent_code: "3.2.S.3" },
  { code: "3.2.S.3.2", title: "杂质", level: 4, parent_code: "3.2.S.3" },
  { code: "3.2.S.4", title: "原料药的质量控制", level: 3, parent_code: "3.2.S" },
  { code: "3.2.S.4.1", title: "质量标准", level: 4, parent_code: "3.2.S.4" },
  { code: "3.2.S.4.2", title: "分析方法", level: 4, parent_code: "3.2.S.4" },
  { code: "3.2.S.4.3", title: "分析方法的验证", level: 4, parent_code: "3.2.S.4" },
  { code: "3.2.S.4.4", title: "批分析", level: 4, parent_code: "3.2.S.4" },
  { code: "3.2.S.4.5", title: "质量标准制定依据", level: 4, parent_code: "3.2.S.4" },
  { code: "3.2.S.5", title: "对照品", level: 3, parent_code: "3.2.S" },
  { code: "3.2.S.6", title: "包装系统", level: 3, parent_code: "3.2.S" },
  { code: "3.2.S.7", title: "稳定性", level: 3, parent_code: "3.2.S" },
  { code: "3.2.S.7.1", title: "稳定性总结和结论", level: 4, parent_code: "3.2.S.7" },
  { code: "3.2.S.7.2", title: "批准后稳定性研究方案和承诺", level: 4, parent_code: "3.2.S.7" },
  { code: "3.2.S.7.3", title: "稳定性数据", level: 4, parent_code: "3.2.S.7" },
]

interface ChapterWithAssets extends Chapter {
  assets: ChapterAsset[]
  working_file?: string
  source_file?: string
}

export default function DossierDetailPage() {
  const params = useParams()
  const router = useRouter()
  const dossierId = params.id as string

  const {
    currentDossier, currentDossierLoading, loadDossier,
    chapterTree, chapterTreeLoading, loadChapterTree,
  } = useDossierWriterStore()

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<ChapterWithAssets | null>(null)
  const [exporting, setExporting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadTemplateOpen, setUploadTemplateOpen] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [preview, setPreview] = useState<ChapterPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [matching, setMatching] = useState(false)

  useEffect(() => {
    if (dossierId) {
      loadDossier(dossierId)
      loadChapterTree(dossierId)
    }
  }, [dossierId, loadDossier, loadChapterTree])

  // 构建树数据（直接使用后端返回的树结构）
  const buildTreeData = () => {
    const convertToTreeData = (chapters: any[]): any[] => {
      return chapters.map(ch => {
        const children = ch.children ? convertToTreeData(ch.children) : []
        return {
          key: ch.id,
          title: (
            <span className="flex items-center gap-2">
              <span className="text-gray-500">{ch.chapter_code}</span>
              <span className="font-medium">{ch.chapter_title}</span>
              {ch.has_assets && ch.asset_count > 0 && (
                <Tag color="blue" style={{ fontSize: 10, lineHeight: '14px' }}>
                  {ch.asset_count}素材
                </Tag>
              )}
              {ch.has_content && (
                <Tag color="green" style={{ fontSize: 10, lineHeight: '14px' }}>
                  已匹配
                </Tag>
              )}
            </span>
          ),
          chapter: ch,
          children,
          isLeaf: children.length === 0,
        }
      })
    }

    return convertToTreeData(chapterTree)
  }

  // 选择章节
  const handleSelectChapter = async (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      const chapterId = selectedKeys[0] as string
      // 从 chapterTree 中查找章节
      const findChapter = (chapters: any[]): any => {
        for (const ch of chapters) {
          if (ch.id === chapterId) return ch
          if (ch.children) {
            const found = findChapter(ch.children)
            if (found) return found
          }
        }
        return null
      }
      
      const chapter = findChapter(chapterTree)
      if (chapter) {
        setSelectedChapterId(chapterId)
        setSelectedChapter(chapter)
        // 加载预览
        loadPreview(chapterId)
      }
    }
  }

  // 加载预览
  const loadPreview = async (chapterId: string) => {
    setPreviewLoading(true)
    try {
      const result = await getChapterPreview(chapterId)
      setPreview(result)
    } catch {
      setPreview(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  // 上传素材
  const handleUploadAsset = async (file: File) => {
    if (!selectedChapterId) return false
    
    setUploading(true)
    try {
      await uploadChapterAsset(selectedChapterId, file)
      message.success('素材上传成功')
      loadChapterTree(dossierId)
      if (selectedChapterId) {
        loadPreview(selectedChapterId)
      }
    } catch {
      message.error('上传失败')
    } finally {
      setUploading(false)
    }
    
    return false
  }

  // 删除素材
  const handleDeleteAsset = async (assetId: string) => {
    try {
      await deleteChapterAsset(assetId)
      message.success('删除成功')
      loadChapterTree(dossierId)
      if (selectedChapterId) {
        loadPreview(selectedChapterId)
      }
    } catch {
      message.error('删除失败')
    }
  }

  // 上传模板
  const handleUploadTemplate = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    setParsing(true)
    try {
      const fileArray = Array.from(files)
      const result: UploadResponse = await uploadTemplates(dossierId, fileArray)
      
      if (result.success_count > 0) {
        message.success(`上传成功 ${result.success_count} 个文件`)
      }
      if (result.failed_count > 0) {
        message.warning(`${result.failed_count} 个文件上传失败`)
      }

      setUploadTemplateOpen(false)
      loadDossier(dossierId)
      loadChapterTree(dossierId)
    } catch (err: any) {
      message.error(err?.message || '上传失败')
    } finally {
      setParsing(false)
    }
  }

  // 智能匹配素材
  const handleMatchAssets = async () => {
    setMatching(true)
    try {
      if (!dossierId) return
      const result = await matchAssetsToChapters(dossierId)
      message.success(result.message)
      loadChapterTree(dossierId)
    } catch (err: any) {
      message.error(err?.message || '匹配失败')
    } finally {
      setMatching(false)
    }
  }

  // 导出
  const handleExportAll = async () => {
    if (!currentDossier) return
    
    setExporting(true)
    try {
      const result = await exportDossier(currentDossier.id)
      if (result.success) {
        message.success(`导出成功: ${result.filename}`)
        const downloadUrl = getDownloadUrl(currentDossier.id, result.filename!)
        window.open(downloadUrl, '_blank')
      } else {
        message.error(result.message)
      }
    } catch (err: any) {
      message.error(err?.message || '导出失败')
    } finally {
      setExporting(false)
    }
  }

  const handleExportChapter = async () => {
    if (!currentDossier || !selectedChapterId) return
    
    setExporting(true)
    try {
      const result = await exportDossier(currentDossier.id, [selectedChapterId])
      if (result.success) {
        message.success(`导出成功: ${result.filename}`)
        const downloadUrl = getDownloadUrl(currentDossier.id, result.filename!)
        window.open(downloadUrl, '_blank')
      } else {
        message.error(result.message)
      }
    } catch (err: any) {
      message.error(err?.message || '导出失败')
    } finally {
      setExporting(false)
    }
  }

  const treeData = buildTreeData()

  return (
    <div className="p-6 h-full flex flex-col">
      {/* 面包屑 */}
      <Breadcrumb className="mb-4"
        items={[
          { title: <a onClick={() => router.push('/registration/dossier-writer')}>申报资料撰写</a> },
          { title: currentDossier?.product_name || '品种详情' },
        ]}
      />

      {/* 品种信息头部 */}
      <Card className="mb-4" loading={currentDossierLoading}>
        {currentDossier && (
          <div className="flex items-center justify-between">
            <div>
              <Title level={4} className="mb-2!">{currentDossier.product_name}</Title>
              <Descriptions size="small" column={4}>
                <Descriptions.Item label="无菌类型">{currentDossier.sterile_type}</Descriptions.Item>
                <Descriptions.Item label="生产商">{currentDossier.manufacturer}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={currentDossier.parse_status === 'parsed' ? 'success' : 'default'}>
                    {currentDossier.parse_status === 'parsed' ? '已解析' : currentDossier.parse_status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="章节数">{currentDossier.chapter_count}</Descriptions.Item>
              </Descriptions>
            </div>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push('/registration/dossier-writer')}
              >
                返回列表
              </Button>
              {currentDossier?.parse_status !== 'parsed' && (
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={() => setUploadTemplateOpen(true)}
                >
                  上传模板
                </Button>
              )}
              <Button
                icon={<CheckCircleOutlined />}
                onClick={handleMatchAssets}
                loading={matching}
              >
                智能匹配
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleExportAll}
                loading={exporting}
                disabled={currentDossier?.parse_status !== 'parsed'}
              >
                导出全部
              </Button>
            </Space>
          </div>
        )}
      </Card>

      {/* 主内容区 */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* 左侧 M3 目录树 */}
        <Card
          className="w-96 shrink-0 overflow-auto"
          title={
            <Space>
              <FolderOutlined />
              <span>M3 标准目录</span>
            </Space>
          }
        >
          <Spin spinning={chapterTreeLoading}>
            <Tree
              treeData={treeData}
              onSelect={handleSelectChapter}
              selectedKeys={selectedChapterId ? [selectedChapterId] : []}
              defaultExpandAll
              showLine
            />
          </Spin>
        </Card>

        {/* 右侧章节详情 */}
        <Card className="flex-1 overflow-auto">
          {selectedChapter ? (
            <div>
              {/* 章节标题 */}
              <div className="mb-4">
                <Space align="center">
                  <FileOutlined className="text-xl text-blue-500" />
                  <Title level={4} className="mb-0!">
                    <span className="text-gray-500 mr-2">{selectedChapter.chapter_code}</span>
                    {selectedChapter.chapter_title}
                  </Title>
                  <Tag>第 {selectedChapter.level} 级</Tag>
                </Space>
              </div>

              <Divider />

              <Tabs defaultActiveKey="preview" items={[
                {
                  key: 'preview',
                  label: '章节预览',
                  children: (
                    <Spin spinning={previewLoading}>
                      {preview?.success ? (
                        <div className="prose max-w-none">
                          {preview.paragraphs.map((p, idx) => (
                            <div key={idx} className="mb-2">
                              {p.style.includes('Heading') ? (
                                <Title level={(parseInt(p.style.slice(-1)) || 3) as 1 | 2 | 3 | 4 | 5}>
                                  {p.text}
                                </Title>
                              ) : (
                                <Paragraph>{p.text}</Paragraph>
                              )}
                            </div>
                          ))}
                          {preview.tables.length > 0 && (
                            <div className="mt-4">
                              <Title level={5}>表格内容</Title>
                              {preview.tables.map((table, tidx) => (
                                <div key={tidx} className="mb-4 overflow-x-auto">
                                  <table className="min-w-full border">
                                    <tbody>
                                      {table.map((row, ridx) => (
                                        <tr key={ridx} className="border-b">
                                          {row.map((cell, cidx) => (
                                            <td key={cidx} className="border px-2 py-1 text-sm">
                                              {cell}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Empty description={preview?.message || '暂无预览内容'} />
                      )}
                    </Spin>
                  ),
                },
                {
                  key: 'assets',
                  label: `素材 (${selectedChapter.assets?.length || 0})`,
                  children: (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Text type="secondary">
                          源文件: {selectedChapter.working_file || selectedChapter.source_file || '-'}
                        </Text>
                        <Space>
                          <Button
                            icon={<DownloadOutlined />}
                            onClick={handleExportChapter}
                            loading={exporting}
                          >
                            导出本章
                          </Button>
                          <Upload
                            accept=".pdf,.docx,.xlsx,.txt,.doc"
                            showUploadList={false}
                            beforeUpload={handleUploadAsset}
                            disabled={!selectedChapterId}
                          >
                            <Button
                              type="primary"
                              icon={<UploadOutlined />}
                              loading={uploading}
                            >
                              上传素材
                            </Button>
                          </Upload>
                        </Space>
                      </div>

                      {selectedChapter.assets?.length > 0 ? (
                        <List
                          size="small"
                          dataSource={selectedChapter.assets}
                          renderItem={(asset: ChapterAsset) => (
                            <List.Item
                              actions={[
                                <Popconfirm
                                  key="delete"
                                  title="确定删除此素材？"
                                  onConfirm={() => handleDeleteAsset(asset.id)}
                                  okText="确定"
                                  cancelText="取消"
                                >
                                  <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                  />
                                </Popconfirm>,
                              ]}
                            >
                              <List.Item.Meta
                                avatar={<FileWordOutlined className="text-xl text-blue-500" />}
                                title={asset.original_filename}
                                description={
                                  <Space>
                                    {asset.file_type && <Tag>{asset.file_type.toUpperCase()}</Tag>}
                                    {asset.file_size && (
                                      <Text type="secondary">
                                        {(asset.file_size / 1024).toFixed(1)} KB
                                      </Text>
                                    )}
                                    <Text type="secondary">
                                      {dayjs(asset.uploaded_at).format('YYYY-MM-DD HH:mm')}
                                    </Text>
                                  </Space>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      ) : (
                        <Empty description="暂无素材，请上传" />
                      )}
                    </div>
                  ),
                },
              ]} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Empty description="请从左侧 M3 目录选择一个章节" />
            </div>
          )}
        </Card>
      </div>

      {/* 上传模板弹窗 */}
      <Modal
        title="上传申报资料模板"
        open={uploadTemplateOpen}
        onCancel={() => setUploadTemplateOpen(false)}
        footer={null}
        width={500}
      >
        <div className="py-4">
          <p className="mb-4 text-gray-600">
            请上传 Word 格式的申报资料模板文件（.docx），支持多文件批量上传
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <FileWordOutlined className="text-4xl text-blue-500 mb-4" />
            <p className="mb-4">点击或拖拽文件到此处上传（可多选）</p>
            <input
              type="file"
              accept=".docx"
              multiple
              onChange={(e) => {
                handleUploadTemplate(e.target.files)
              }}
              className="hidden"
              id="detail-template-upload"
            />
            <label
              htmlFor="detail-template-upload"
              className="cursor-pointer inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {parsing ? '处理中...' : '选择文件'}
            </label>
          </div>
        </div>
      </Modal>
    </div>
  )
}
