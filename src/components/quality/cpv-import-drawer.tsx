"use client"

import { useState, useRef } from "react"
import { previewCpvImport, confirmCpvImport } from "@/lib/api/quality-cpv"
import { CpvImportPreview } from "@/types/quality-cpv"

interface CpvImportDrawerProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
  dataType: "CPP" | "CQA"
  onSuccess: () => void
}

export function CpvImportDrawer({ isOpen, onClose, productId, productName, dataType, onSuccess }: CpvImportDrawerProps) {
  const [importMode, setImportMode] = useState<"create" | "update" | "overwrite">("create")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CpvImportPreview | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  function resetState() {
    setFile(null)
    setPreview(null)
    setPreviewing(false)
    setImporting(false)
    setErrorMsg("")
    setSuccessMsg("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleClose() {
    resetState()
    onClose()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (!selected.name.endsWith(".xlsx") && !selected.name.endsWith(".xls")) {
      setErrorMsg("请上传 Excel 文件（.xlsx 或 .xls）")
      return
    }
    setErrorMsg("")
    setFile(selected)
    setPreview(null)
  }

  async function handlePreview() {
    if (!file) { setErrorMsg("请先选择文件"); return }
    setPreviewing(true)
    setErrorMsg("")
    try {
      const result = await previewCpvImport(file, productId, dataType, importMode)
      setPreview(result)
    } catch (err: any) {
      setErrorMsg(err.message || "预览失败")
    } finally {
      setPreviewing(false)
    }
  }

  async function handleConfirm() {
    if (!file) { setErrorMsg("请先选择文件"); return }
    setImporting(true)
    setErrorMsg("")
    try {
      const task = await confirmCpvImport(file, productId, dataType, importMode, file.name, false)
      setSuccessMsg(`导入成功：${task.success_rows} 行成功，${task.failed_rows} 行失败`)
      setTimeout(() => {
        handleClose()
        onSuccess()
      }, 1500)
    } catch (err: any) {
      setErrorMsg(err.message || "导入失败")
    } finally {
      setImporting(false)
    }
  }

  const modeLabels = {
    create: { label: "新增", desc: "仅导入新批次，已存在的批号将被跳过" },
    update: { label: "更新", desc: "新批次新增，已存在的批次追加参数值" },
    overwrite: { label: "覆盖", desc: "删除该产品下所有当前类型数据后重新导入" },
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 transition-opacity" onClick={handleClose} />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">上传 Excel</h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">产品</span>
                <span className="font-medium text-gray-900">{productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">数据类型</span>
                <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${dataType === "CPP" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>{dataType}</span>
              </div>
            </div>

            {/* Import Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">导入模式</label>
              <div className="space-y-2">
                {(Object.keys(modeLabels) as Array<keyof typeof modeLabels>).map((mode) => (
                  <label key={mode} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${importMode === mode ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input
                      type="radio"
                      name="importMode"
                      value={mode}
                      checked={importMode === mode}
                      onChange={() => { setImportMode(mode); setPreview(null) }}
                      className="mt-0.5 accent-blue-600"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{modeLabels[mode].label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{modeLabels[mode].desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* File Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择文件</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="cpv-file-input"
                />
                <label htmlFor="cpv-file-input" className="cursor-pointer">
                  <div className="text-3xl mb-2">📄</div>
                  <div className="text-sm text-gray-600">
                    {file ? file.name : "点击选择 Excel 文件"}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">支持 .xlsx / .xls</div>
                </label>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                {errorMsg}
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
                {successMsg}
              </div>
            )}

            {/* Preview Results */}
            {preview && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">预览结果</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-gray-900">{preview.total_rows}</div>
                    <div className="text-xs text-gray-500 mt-1">总行数</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-green-700">{preview.valid_rows}</div>
                    <div className="text-xs text-gray-500 mt-1">可导入</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-red-700">{preview.error_rows.length}</div>
                    <div className="text-xs text-gray-500 mt-1">错误行</div>
                  </div>
                </div>

                {/* Matched Parameters */}
                {preview.matched_parameters.length > 0 && (
                  <div className="text-xs text-gray-500">
                    匹配参数：{preview.matched_parameters.join("、")}
                  </div>
                )}

                {/* Unmatched Columns */}
                {preview.unmatched_columns.length > 0 && (
                  <div className="text-xs text-amber-600">
                    未匹配列：{preview.unmatched_columns.join("、")}
                  </div>
                )}

                {/* Error Details */}
                {preview.error_rows.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-red-600 mb-2">错误明细（前 20 行）</div>
                    <div className="max-h-48 overflow-y-auto border border-red-200 rounded-lg">
                      <table className="w-full text-xs">
                        <thead className="bg-red-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-red-700">行号</th>
                            <th className="px-3 py-2 text-left text-red-700">错误信息</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-100">
                          {preview.error_rows.slice(0, 20).map((err) => (
                            <tr key={err.row_number}>
                              <td className="px-3 py-2 text-gray-700">{err.row_number}</td>
                              <td className="px-3 py-2 text-red-600">{err.error_message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {preview.error_rows.length > 20 && (
                      <div className="text-xs text-gray-400 mt-1">还有 {preview.error_rows.length - 20} 行错误未显示</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
              disabled={importing}
            >
              取消
            </button>
            <button
              onClick={handlePreview}
              disabled={!file || previewing || importing}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {previewing ? "预览中..." : "预览数据"}
            </button>
            {preview && preview.valid_rows > 0 && (
              <button
                onClick={handleConfirm}
                disabled={importing}
                className={`flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                  importMode === "overwrite" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {importing ? "导入中..." : "确认导入"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
