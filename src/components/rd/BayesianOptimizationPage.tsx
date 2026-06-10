'use client'

import { useState, useEffect } from 'react'
import { 
  Card, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Space, 
  Tag, 
  message, 
  Tabs,
  Descriptions,
  Popconfirm,
  Empty,
  Spin,
  Divider
} from 'antd'
import { 
  PlusOutlined, 
  DeleteOutlined, 
  ExperimentOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  DownloadOutlined,
  UploadOutlined
} from '@ant-design/icons'
import { BayesianProject, BayesianComponent, BayesianObjective, CreateProjectRequest } from '@/types/rd'
import { 
  fetchProjects, 
  fetchProject, 
  createProject, 
  deleteProject,
  updateProject,
  addComponent,
  deleteComponent,
  addObjective,
  deleteObjective,
  suggestExperiments,
  generateReactionScope,
  fetchExperiments,
  recordExperimentResult,
  fetchReactionScopes,
  importCSV,
  exportCSV
} from '@/lib/api/rd'
import { BayesianExperiment, ReactionScope } from '@/types/rd'

const { TextArea } = Input
const { Option } = Select

interface BayesianOptimizationPageProps {
  initialProjects: BayesianProject[]
}

export function BayesianOptimizationPage({ initialProjects }: BayesianOptimizationPageProps) {
  const [projects, setProjects] = useState<BayesianProject[]>(initialProjects)
  const [currentProject, setCurrentProject] = useState<BayesianProject | null>(null)
  const [loading, setLoading] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [componentModalVisible, setComponentModalVisible] = useState(false)
  const [objectiveModalVisible, setObjectiveModalVisible] = useState(false)
  const [editProjectModalVisible, setEditProjectModalVisible] = useState(false)
  const [recordResultModalVisible, setRecordResultModalVisible] = useState(false)
  const [currentExperiment, setCurrentExperiment] = useState<any>(null)
  const [form] = Form.useForm()
  const [componentForm] = Form.useForm()
  const [objectiveForm] = Form.useForm()
  const [editProjectForm] = Form.useForm()
  const [recordResultForm] = Form.useForm()

  // 加载项目列表
  const loadProjects = async () => {
    setLoading(true)
    try {
      const data = await fetchProjects()
      setProjects(data)
    } catch (error) {
      message.error('加载项目列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载项目详情
  const loadProjectDetail = async (projectId: string) => {
    setLoading(true)
    try {
      const project = await fetchProject(projectId)
      setCurrentProject(project)
    } catch (error) {
      message.error('加载项目详情失败')
    } finally {
      setLoading(false)
    }
  }

  // 创建项目
  const handleCreateProject = async (values: any) => {
    try {
      const data: CreateProjectRequest = {
        name: values.name,
        description: values.description,
        components: values.components || [],
        objectives: values.objectives || [],
      }
      await createProject(data)
      message.success('项目创建成功')
      setCreateModalVisible(false)
      form.resetFields()
      loadProjects()
    } catch (error: any) {
      message.error(error.message || '创建失败')
    }
  }

  // 删除项目
  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId)
      message.success('项目删除成功')
      if (currentProject?.id === projectId) {
        setCurrentProject(null)
      }
      loadProjects()
    } catch (error: any) {
      message.error(error.message || '删除失败')
    }
  }

  // 添加参数
  const handleAddComponent = async (values: any) => {
    if (!currentProject) return
    try {
      await addComponent(currentProject.id, values)
      message.success('参数添加成功')
      setComponentModalVisible(false)
      componentForm.resetFields()
      loadProjectDetail(currentProject.id)
    } catch (error: any) {
      message.error(error.message || '添加失败')
    }
  }

  // 添加目标
  const handleAddObjective = async (values: any) => {
    if (!currentProject) return
    try {
      await addObjective(currentProject.id, values)
      message.success('目标添加成功')
      setObjectiveModalVisible(false)
      objectiveForm.resetFields()
      loadProjectDetail(currentProject.id)
    } catch (error: any) {
      message.error(error.message || '添加失败')
    }
  }

  // 推荐实验
  const handleSuggestExperiments = async () => {
    if (!currentProject) return
    setLoading(true)
    try {
      await suggestExperiments({ project_id: currentProject.id, num_experiments: 5 })
      message.success('实验推荐成功')
      loadProjectDetail(currentProject.id)
    } catch (error: any) {
      message.error(error.message || '推荐失败')
    } finally {
      setLoading(false)
    }
  }

  // 生成反应范围
  const handleGenerateScope = async () => {
    if (!currentProject) return
    setLoading(true)
    try {
      await generateReactionScope(currentProject.id, `${currentProject.name} - 反应范围`)
      message.success('反应范围生成成功')
      loadProjectDetail(currentProject.id)
    } catch (error: any) {
      message.error(error.message || '生成失败')
    } finally {
      setLoading(false)
    }
  }

  // 编辑项目
  const handleEditProject = () => {
    if (!currentProject) return
    editProjectForm.setFieldsValue({
      name: currentProject.name,
      description: currentProject.description,
      status: currentProject.status,
    })
    setEditProjectModalVisible(true)
  }

  const handleUpdateProject = async (values: any) => {
    if (!currentProject) return
    try {
      await updateProject(currentProject.id, values)
      message.success('项目更新成功')
      setEditProjectModalVisible(false)
      editProjectForm.resetFields()
      loadProjectDetail(currentProject.id)
      loadProjects()
    } catch (error: any) {
      message.error(error.message || '更新失败')
    }
  }

  // 删除参数
  const handleDeleteComponent = async (componentId: string) => {
    if (!currentProject) return
    try {
      await deleteComponent(componentId)
      message.success('参数删除成功')
      loadProjectDetail(currentProject.id)
    } catch (error: any) {
      message.error(error.message || '删除失败')
    }
  }

  // 删除目标
  const handleDeleteObjective = async (objectiveId: string) => {
    if (!currentProject) return
    try {
      await deleteObjective(objectiveId)
      message.success('目标删除成功')
      loadProjectDetail(currentProject.id)
    } catch (error: any) {
      message.error(error.message || '删除失败')
    }
  }

  // 记录实验结果
  const handleRecordResult = (experiment: any) => {
    setCurrentExperiment(experiment)
    recordResultForm.resetFields()
    setRecordResultModalVisible(true)
  }

  const handleSubmitResult = async (values: any) => {
    if (!currentExperiment) return
    try {
      await recordExperimentResult(currentExperiment.id, values)
      message.success('实验结果记录成功')
      setRecordResultModalVisible(false)
      recordResultForm.resetFields()
      if (currentProject) {
        loadProjectDetail(currentProject.id)
      }
    } catch (error: any) {
      message.error(error.message || '记录失败')
    }
  }

  // 导出 CSV
  const handleExportCSV = async () => {
    if (!currentProject) return
    try {
      const blob = await exportCSV(currentProject.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `experiments_${currentProject.id}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error: any) {
      message.error(error.message || '导出失败')
    }
  }

  // 导入 CSV
  const handleImportCSV = async (file: File) => {
    if (!currentProject) return false
    try {
      const result = await importCSV(currentProject.id, file)
      message.success(result.message)
      loadProjectDetail(currentProject.id)
      return true
    } catch (error: any) {
      message.error(error.message || '导入失败')
      return false
    }
  }

  // 项目列表列定义
  const projectColumns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          draft: 'default',
          running: 'processing',
          completed: 'success',
          failed: 'error',
        }
        const textMap: Record<string, string> = {
          draft: '草稿',
          running: '进行中',
          completed: '已完成',
          failed: '失败',
        }
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: BayesianProject) => (
        <Space>
          <Button type="link" onClick={() => loadProjectDetail(record.id)}>
            查看
          </Button>
          <Popconfirm
            title="确定要删除这个项目吗？"
            onConfirm={() => handleDeleteProject(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 组件列表列定义
  const componentColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '下限',
      dataIndex: 'lower_bound',
      key: 'lower_bound',
    },
    {
      title: '上限',
      dataIndex: 'upper_bound',
      key: 'upper_bound',
    },
    {
      title: '间隔',
      dataIndex: 'interval',
      key: 'interval',
      render: (val: number) => val || '-',
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      render: (val: string) => val || '-',
    },
  ]

  // 目标列表列定义
  const objectiveColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '方向',
      dataIndex: 'direction',
      key: 'direction',
      render: (direction: string) => (
        <Tag color={direction === 'maximize' ? 'green' : 'red'}>
          {direction === 'maximize' ? '最大化' : '最小化'}
        </Tag>
      ),
    },
    {
      title: '权重',
      dataIndex: 'weight',
      key: 'weight',
    },
  ]

  // 实验列表列定义
  const experimentColumns = [
    {
      title: '批次',
      dataIndex: 'batch_number',
      key: 'batch_number',
    },
    {
      title: '参数',
      dataIndex: 'parameters',
      key: 'parameters',
      render: (params: Record<string, number>) => (
        <Space wrap>
          {Object.entries(params).map(([key, value]) => (
            <Tag key={key}>{`${key}: ${value}`}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '结果',
      dataIndex: 'results',
      key: 'results',
      render: (results: Record<string, number> | null) => 
        results ? (
          <Space wrap>
            {Object.entries(results).map(([key, value]) => (
              <Tag key={key} color="blue">{`${key}: ${value}`}</Tag>
            ))}
          </Space>
        ) : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: 'default',
          completed: 'success',
          failed: 'error',
        }
        const textMap: Record<string, string> = {
          pending: '待完成',
          completed: '已完成',
          failed: '失败',
        }
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>
      },
    },
    {
      title: '类型',
      dataIndex: 'is_suggested',
      key: 'is_suggested',
      render: (isSuggested: boolean) => (
        <Tag color={isSuggested ? 'purple' : 'default'}>
          {isSuggested ? '推荐' : '手动'}
        </Tag>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>贝叶斯优化</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
          创建项目
        </Button>
      </div>

      {!currentProject ? (
        // 项目列表视图
        <Card>
          <Table
            columns={projectColumns}
            dataSource={projects}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ) : (
        // 项目详情视图
        <Spin spinning={loading}>
          <Card
            title={
              <Space>
                <Button onClick={() => setCurrentProject(null)}>返回</Button>
                <span>{currentProject.name}</span>
                <Tag color={
                  currentProject.status === 'draft' ? 'default' :
                  currentProject.status === 'running' ? 'processing' :
                  currentProject.status === 'completed' ? 'success' : 'error'
                }>
                  {currentProject.status === 'draft' ? '草稿' :
                   currentProject.status === 'running' ? '进行中' :
                   currentProject.status === 'completed' ? '已完成' : '失败'}
                </Tag>
              </Space>
            }
            extra={
              <Space>
                <Button 
                  icon={<ThunderboltOutlined />} 
                  type="primary"
                  onClick={handleSuggestExperiments}
                  disabled={!currentProject.components?.length}
                >
                  推荐实验
                </Button>
                <Button 
                  icon={<FileTextOutlined />}
                  onClick={handleGenerateScope}
                  disabled={!currentProject.components?.length}
                >
                  生成反应范围
                </Button>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={handleExportCSV}
                  disabled={!currentProject.experiments?.length}
                >
                  导出 CSV
                </Button>
                <UploadOutlined />
              </Space>
            }
          >
            <Descriptions column={2} bordered>
              <Descriptions.Item label="项目描述" span={2}>
                {currentProject.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(currentProject.created_at).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(currentProject.updated_at).toLocaleString('zh-CN')}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Tabs
              items={[
                {
                  key: 'components',
                  label: '反应参数',
                  children: (
                    <>
                      <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={() => setComponentModalVisible(true)}
                        style={{ marginBottom: 16 }}
                      >
                        添加参数
                      </Button>
                      <Table
                        columns={componentColumns}
                        dataSource={currentProject.components || []}
                        rowKey="id"
                        pagination={false}
                        locale={{ emptyText: <Empty description="暂无参数" /> }}
                      />
                    </>
                  ),
                },
                {
                  key: 'objectives',
                  label: '优化目标',
                  children: (
                    <>
                      <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={() => setObjectiveModalVisible(true)}
                        style={{ marginBottom: 16 }}
                      >
                        添加目标
                      </Button>
                      <Table
                        columns={objectiveColumns}
                        dataSource={currentProject.objectives || []}
                        rowKey="id"
                        pagination={false}
                        locale={{ emptyText: <Empty description="暂无目标" /> }}
                      />
                    </>
                  ),
                },
                {
                  key: 'experiments',
                  label: '实验记录',
                  children: (
                    <Table
                      columns={experimentColumns}
                      dataSource={currentProject.experiments || []}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                      locale={{ emptyText: <Empty description="暂无实验记录" /> }}
                    />
                  ),
                },
                {
                  key: 'reaction_scopes',
                  label: '反应范围',
                  children: (
                    <Table
                      columns={[
                        { title: '范围名称', dataIndex: 'name', key: 'name' },
                        { title: '总组合数', dataIndex: 'total_combinations', key: 'total_combinations' },
                        { 
                          title: '创建时间', 
                          dataIndex: 'created_at', 
                          key: 'created_at',
                          render: (v) => new Date(v).toLocaleString('zh-CN')
                        },
                      ]}
                      dataSource={currentProject.reaction_scopes || []}
                      rowKey="id"
                      pagination={false}
                      locale={{ emptyText: <Empty description="暂无反应范围" /> }}
                    />
                  ),
                },
              ]}
            />
          </Card>
        </Spin>
      )}

      {/* 创建项目弹窗 */}
      <Modal
        title="创建贝叶斯优化项目"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateProject}>
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="例如：反应条件优化项目" />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <TextArea rows={3} placeholder="描述项目目标和范围" />
          </Form.Item>
          <Divider>反应参数（可选）</Divider>
          <Form.List name="components">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item {...restField} name={[name, 'name']} rules={[{ required: true, message: '参数名称' }]}>
                      <Input placeholder="名称" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'lower_bound']} rules={[{ required: true, message: '下限' }]}>
                      <InputNumber placeholder="下限" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'upper_bound']} rules={[{ required: true, message: '上限' }]}>
                      <InputNumber placeholder="上限" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'interval']}>
                      <InputNumber placeholder="间隔" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'unit']}>
                      <Input placeholder="单位" />
                    </Form.Item>
                    <Button type="text" danger onClick={() => remove(name)}>
                      删除
                    </Button>
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加参数
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Divider>优化目标（可选）</Divider>
          <Form.List name="objectives">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item {...restField} name={[name, 'name']} rules={[{ required: true, message: '目标名称' }]}>
                      <Input placeholder="名称" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'direction']} initialValue="maximize">
                      <Select style={{ width: 120 }}>
                        <Option value="maximize">最大化</Option>
                        <Option value="minimize">最小化</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'weight']} initialValue={1}>
                      <InputNumber placeholder="权重" min={0} step={0.1} />
                    </Form.Item>
                    <Button type="text" danger onClick={() => remove(name)}>
                      删除
                    </Button>
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加目标
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* 添加参数弹窗 */}
      <Modal
        title="添加反应参数"
        open={componentModalVisible}
        onCancel={() => {
          setComponentModalVisible(false)
          componentForm.resetFields()
        }}
        onOk={() => componentForm.submit()}
      >
        <Form form={componentForm} layout="vertical" onFinish={handleAddComponent}>
          <Form.Item
            name="name"
            label="参数名称"
            rules={[{ required: true, message: '请输入参数名称' }]}
          >
            <Input placeholder="例如：温度、压力、催化剂用量" />
          </Form.Item>
          <Form.Item
            name="lower_bound"
            label="下限"
            rules={[{ required: true, message: '请输入下限' }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="upper_bound"
            label="上限"
            rules={[{ required: true, message: '请输入上限' }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="interval" label="间隔">
            <InputNumber style={{ width: '100%' }} placeholder="可选" />
          </Form.Item>
          <Form.Item name="unit" label="单位">
            <Input placeholder="例如：°C, MPa, mol%" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加目标弹窗 */}
      <Modal
        title="添加优化目标"
        open={objectiveModalVisible}
        onCancel={() => {
          setObjectiveModalVisible(false)
          objectiveForm.resetFields()
        }}
        onOk={() => objectiveForm.submit()}
      >
        <Form form={objectiveForm} layout="vertical" onFinish={handleAddObjective}>
          <Form.Item
            name="name"
            label="目标名称"
            rules={[{ required: true, message: '请输入目标名称' }]}
          >
            <Input placeholder="例如：产率、选择性、纯度" />
          </Form.Item>
          <Form.Item
            name="direction"
            label="优化方向"
            initialValue="maximize"
            rules={[{ required: true, message: '请选择优化方向' }]}
          >
            <Select>
              <Option value="maximize">最大化</Option>
              <Option value="minimize">最小化</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="weight"
            label="权重"
            initialValue={1}
            rules={[{ required: true, message: '请输入权重' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑项目弹窗 */}
      <Modal
        title="编辑项目"
        open={editProjectModalVisible}
        onCancel={() => {
          setEditProjectModalVisible(false)
          editProjectForm.resetFields()
        }}
        onOk={() => editProjectForm.submit()}
      >
        <Form form={editProjectForm} layout="vertical" onFinish={handleUpdateProject}>
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="status" label="项目状态">
            <Select>
              <Option value="draft">草稿</Option>
              <Option value="running">进行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="failed">失败</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 记录实验结果弹窗 */}
      <Modal
        title="记录实验结果"
        open={recordResultModalVisible}
        onCancel={() => {
          setRecordResultModalVisible(false)
          recordResultForm.resetFields()
        }}
        onOk={() => recordResultForm.submit()}
      >
        {currentExperiment && (
          <Form form={recordResultForm} layout="vertical" onFinish={handleSubmitResult}>
            <Descriptions bordered size="small" column={1} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="批次号">{currentExperiment.batch_number}</Descriptions.Item>
              <Descriptions.Item label="参数">
                {Object.entries(currentExperiment.parameters).map(([k, v]) => `${k}: ${v}`).join(', ')}
              </Descriptions.Item>
            </Descriptions>
            {currentProject?.objectives?.map((obj) => (
              <Form.Item
                key={obj.id}
                name={obj.name}
                label={`${obj.name} (${obj.direction === 'maximize' ? '最大化' : '最小化'})`}
                rules={[{ required: true, message: `请输入${obj.name}` }]}
              >
                <InputNumber style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            ))}
          </Form>
        )}
      </Modal>
    </div>
  )
}
