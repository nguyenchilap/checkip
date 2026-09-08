'use client'

import { useState, useEffect } from 'react'
import { submitNote, getCommonNotes, addCommonNote } from './actions'
import { Search, Plus, Terminal, Settings2, Calendar, ShieldAlert, CheckCircle2 } from 'lucide-react'

type Result = {
  success: boolean;
  message: string;
  isDuplicate?: boolean;
  addedTime?: string;
  allNotes?: string;
  smsbetStatus?: string;
} | null

type CommonNote = {
  note: string;
  created_at?: string;
}

export default function Home() {
  const [mode, setMode] = useState<'classic' | 'advance'>('classic')
  const [result, setResult] = useState<Result>(null)
  const [pending, setPending] = useState(false)

  // Classic mode state
  const [classicInput, setClassicInput] = useState('')

  // Advance mode state
  const [advIp, setAdvIp] = useState('')
  const [advNote, setAdvNote] = useState('')
  const [commonNotes, setCommonNotes] = useState<CommonNote[]>([])
  const [newCommonNote, setNewCommonNote] = useState('')

  useEffect(() => {
    if (mode === 'advance') {
      getCommonNotes().then(notes => {
        setCommonNotes(notes || [])
        setAdvNote(prev => prev ? prev : (notes?.[0]?.note || ''))
      })
    }
  }, [mode])

  const handleClassicSubmit = async () => {
    setPending(true)
    setResult(null)

    // Split by first space
    const firstSpaceIndex = classicInput.trim().indexOf(' ')
    if (firstSpaceIndex === -1) {
      setResult({ success: false, message: 'Vui lòng nhập theo định dạng: [IP] [Ghi chú]' })
      setPending(false)
      return
    }

    const ip = classicInput.substring(0, firstSpaceIndex).trim()
    const note = classicInput.substring(firstSpaceIndex + 1).trim()

    const res = await submitNote(ip, note)
    setResult(res)
    if (res.success && !res.isDuplicate) {
      setClassicInput('')
    }
    setPending(false)
  }

  const handleAdvanceSubmit = async () => {
    setPending(true)
    setResult(null)

    const res = await submitNote(advIp, advNote)
    setResult(res)
    if (res.success && !res.isDuplicate) {
      setAdvIp('')
    }
    setPending(false)
  }

  const handleAddCommonNote = async () => {
    if (!newCommonNote) return
    const res = await addCommonNote(newCommonNote)
    if (res.success) {
      setNewCommonNote('')
      const notes = await getCommonNotes()
      setCommonNotes(notes || [])
      setAdvNote(newCommonNote)
    } else {
      alert(res.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Search className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              IP Note Manager
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Mode Selector */}
        <div className="flex p-1 space-x-1 bg-gray-200/50 dark:bg-gray-800/50 rounded-xl max-w-md mx-auto mb-8">
          <button
            onClick={() => { setMode('classic'); setResult(null); }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-medium rounded-lg transition-all ${mode === 'classic'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Classic Mode</span>
          </button>
          <button
            onClick={() => { setMode('advance'); setResult(null); }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-medium rounded-lg transition-all ${mode === 'advance'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>Advance Mode</span>
          </button>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Result Alert */}
          {result && (
            <div className={`p-4 rounded-xl border flex items-start space-x-4 animate-in fade-in slide-in-from-top-2 ${result.success
              ? result.isDuplicate
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
              <div className="mt-0.5">
                {!result.success ? <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
                  : result.isDuplicate ? <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    : <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                }
              </div>
              <div className="flex-1">
                <p className={`font-medium ${!result.success ? 'text-red-800 dark:text-red-300'
                  : result.isDuplicate ? 'text-amber-800 dark:text-amber-300'
                    : 'text-emerald-800 dark:text-emerald-300'
                  }`}>
                  {result.message}
                </p>

                {result.smsbetStatus && (
                  <div className="mt-3 text-sm">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Trạng thái SMSBET: </span>
                    <span className={`font-medium px-2 py-0.5 rounded border ${result.smsbetStatus === 'Sạch'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50'
                      : result.smsbetStatus === 'Trùng'
                        ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50'
                        : 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                      }`}>
                      {result.smsbetStatus}
                    </span>
                  </div>
                )}
                {result.allNotes && (
                  <div className="mt-3 text-sm">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Đã note: </span>
                    <span className="text-gray-600 dark:text-gray-400 break-all bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700/50">
                      {result.allNotes}
                    </span>
                  </div>
                )}
                {result.addedTime && (
                  <p className="text-sm mt-1 flex items-center text-gray-600 dark:text-gray-400">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    Đã thêm vào hệ thống từ: {new Date(result.addedTime).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Form Classic */}
          {mode === 'classic' && (
            <div
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleClassicSubmit();
                }
              }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="classicInput" className="block text-sm font-medium mb-2">
                    Nhập IP và Ghi chú (cách nhau bởi dấu cách)
                  </label>
                  <input
                    id="classicInput"
                    type="text"
                    value={classicInput}
                    onChange={(e) => setClassicInput(e.target.value)}
                    placeholder="Ví dụ: 192.168.1.1 sc88"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Hệ thống sẽ tự động tách chuỗi đầu tiên làm IP, phần còn lại làm Ghi chú.
                  </p>
                </div>

                <button
                  onClick={(e) => { e.preventDefault(); handleClassicSubmit(); }}
                  disabled={pending}
                  className="cursor-pointer w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-70 flex justify-center"
                >
                  {pending ? 'Đang xử lý...' : 'Kiểm tra'}
                </button>
              </div>
            </div>
          )}

          {/* Form Advance */}
          {mode === 'advance' && (
            <div className="space-y-6">
              <div
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdvanceSubmit();
                  }
                }}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
              >
                <div className="space-y-4">
                  <div>
                    <label htmlFor="advIp" className="block text-sm font-medium mb-2">Địa chỉ IP</label>
                    <input
                      id="advIp"
                      type="text"
                      value={advIp}
                      onChange={(e) => setAdvIp(e.target.value)}
                      placeholder="Ví dụ: 192.168.1.1"
                      required
                      pattern="^(\d{1,3}\.){3}\d{1,3}$"
                      title="Vui lòng nhập đúng định dạng IPv4"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="advNote" className="block text-sm font-medium mb-2">Chọn Ghi Chú</label>
                    <select
                      id="advNote"
                      value={advNote}
                      onChange={(e) => setAdvNote(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      {commonNotes.length === 0 ? (
                        <option value="">Chưa có ghi chú thường dùng</option>
                      ) : (
                        commonNotes.map((n) => (
                          <option key={n.note} value={n.note}>{n.note}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <button
                    onClick={(e) => { e.preventDefault(); handleAdvanceSubmit(); }}
                    disabled={pending || !advNote}
                    className="cursor-pointer w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-70 flex justify-center"
                  >
                    {pending ? 'Đang xử lý...' : 'Kiểm tra'}
                  </button>
                </div>
              </div>

              {/* Add common note form */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-medium mb-4 flex items-center">
                  <Plus className="w-4 h-4 mr-1 text-blue-500" />
                  Thêm ghi chú thường dùng mới
                </h3>
                <div
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCommonNote();
                    }
                  }}
                  className="flex space-x-2"
                >
                  <input
                    type="text"
                    value={newCommonNote}
                    onChange={(e) => setNewCommonNote(e.target.value)}
                    placeholder="Ghi chú mới..."
                    required
                    className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={(e) => { e.preventDefault(); handleAddCommonNote(); }}
                    className="cursor-pointer px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-white transition-colors"
                  >
                    Thêm
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
