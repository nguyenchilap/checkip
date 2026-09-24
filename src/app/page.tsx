'use client'

import { useState, useEffect } from 'react'
import { submitNote, getCommonNotes, addCommonNote, filterIps, FilterResult, getJobs, addJob, deleteJob, updateJob, Job, updateIpNote, getRecentIps } from './actions'
import { Search, Plus, Terminal, Settings2, Calendar, ShieldAlert, CheckCircle2, Edit2, Menu, X, RefreshCw } from 'lucide-react'

type Result = {
  success: boolean;
  message: string;
  isDuplicate?: boolean;
  addedTime?: string;
  updatedTime?: string;
  allNotes?: string;
  smsbetStatus?: string;
  smsbetDateAdded?: string;
  ip?: string;
} | null

type CommonNote = {
  note: string;
  created_at?: string;
}

type RecentIp = {
  ip: string;
  notes: string;
  added_time: string;
  updated_time: string;
}

export default function Home() {
  const [mainTab, setMainTab] = useState<'home' | 'filter' | 'job'>('home')

  const [mode, setMode] = useState<'classic' | 'advance'>('classic')
  const [result, setResult] = useState<Result>(null)
  const [pending, setPending] = useState(false)

  // Edit note state
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [editNoteText, setEditNoteText] = useState('')
  const [editNotePending, setEditNotePending] = useState(false)

  // Local storage loaded state
  const [isLoaded, setIsLoaded] = useState(false)

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [recentIps, setRecentIps] = useState<RecentIp[]>([])
  const [loadingRecent, setLoadingRecent] = useState(false)

  // Filter tab state
  const [filterInput, setFilterInput] = useState('')
  const [filterResults, setFilterResults] = useState<FilterResult[]>([])
  const [filterPending, setFilterPending] = useState(false)

  // Job tab state
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobName, setJobName] = useState('')
  const [jobLinks, setJobLinks] = useState('')
  const [jobPending, setJobPending] = useState(false)
  const [editingJobId, setEditingJobId] = useState<string | null>(null)
  const [editingLinks, setEditingLinks] = useState('')

  // Selected Jobs state
  const [selectedJobs, setSelectedJobs] = useState<string[]>([])

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

  useEffect(() => {
    getJobs().then(setJobs)
  }, [mainTab])

  const fetchRecent = async () => {
    setLoadingRecent(true)
    const ips = await getRecentIps()
    setRecentIps(ips || [])
    setLoadingRecent(false)
  }

  useEffect(() => {
    const loadLocalData = () => {
      const savedInput = localStorage.getItem('filterInput')
      const savedResults = localStorage.getItem('filterResults')
      const savedSelectedJobs = localStorage.getItem('selectedJobs')

      if (savedInput) setFilterInput(savedInput)
      if (savedResults) {
        try {
          setFilterResults(JSON.parse(savedResults))
        } catch (e) { }
      }
      if (savedSelectedJobs) {
        try {
          setSelectedJobs(JSON.parse(savedSelectedJobs))
        } catch (e) { }
      }
      setIsLoaded(true)
    }
    loadLocalData()
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('filterInput', filterInput)
    }
  }, [filterInput, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('filterResults', JSON.stringify(filterResults))
    }
  }, [filterResults, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('selectedJobs', JSON.stringify(selectedJobs))
    }
  }, [selectedJobs, isLoaded])

  const handleClearFilter = () => {
    setFilterInput('')
    setFilterResults([])
    localStorage.removeItem('filterInput')
    localStorage.removeItem('filterResults')
  }

  const handleFilterSubmit = async () => {
    if (!filterInput.trim()) return
    setFilterPending(true)
    const lines = filterInput.split('\n').filter(l => l.trim())
    const res = await filterIps(lines)
    setFilterResults(res)
    setFilterPending(false)
  }

  const handleJobSubmit = async () => {
    setJobPending(true)
    const res = await addJob(jobName, jobLinks)
    if (res.success) {
      setJobName('')
      setJobLinks('')
      getJobs().then(setJobs)
    } else {
      alert(res.message)
    }
    setJobPending(false)
  }

  const handleSaveJob = async (id: string) => {
    const res = await updateJob(id, editingLinks)
    if (res.success) {
      setEditingJobId(null)
      getJobs().then(setJobs)
    } else {
      alert(res.message)
    }
  }

  const handleDeleteJob = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa kèo này không?')) {
      await deleteJob(id)
      getJobs().then(setJobs)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }


  const handleClassicSubmit = async () => {
    setPending(true)
    setResult(null)
    setIsEditingNote(false)

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
    setIsEditingNote(false)

    const res = await submitNote(advIp, advNote)
    setResult(res)
    if (res.success && !res.isDuplicate) {
      setAdvIp('')
    }
    setPending(false)
  }

  const handleSaveNote = async () => {
    if (!result?.ip) return
    setEditNotePending(true)
    const res = await updateIpNote(result.ip, editNoteText)
    if (res.success) {
      setResult({ ...result, allNotes: editNoteText })
      setIsEditingNote(false)
    } else {
      alert(res.message)
    }
    setEditNotePending(false)
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
          <button
            onClick={() => {
              setIsDrawerOpen(true);
              fetchRecent();
            }}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setMainTab('home')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${mainTab === 'home'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              Quản lý Note
            </button>
            <button
              onClick={() => setMainTab('filter')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${mainTab === 'filter'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              Lọc IP Hàng Loạt
            </button>
            <button
              onClick={() => setMainTab('job')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${mainTab === 'job'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              Link Kèo
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {mainTab === 'home' && (
          <>


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
                        {result.smsbetDateAdded && (
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            (Ngày thêm vào SMSBET: {result.smsbetDateAdded})
                          </span>
                        )}
                      </div>
                    )}
                    {result.allNotes !== undefined && (
                      <div className="mt-3 text-sm">
                        <div className="flex items-start">
                          <span className="font-semibold text-gray-700 dark:text-gray-300 mt-1 mr-2">Đã note:</span>
                          {isEditingNote ? (
                            <div className="flex-1 flex flex-col space-y-2">
                              <textarea
                                className="w-full px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono resize-y min-h-[60px]"
                                value={editNoteText}
                                onChange={(e) => setEditNoteText(e.target.value)}
                              />
                              <div className="flex space-x-2">
                                <button
                                  onClick={handleSaveNote}
                                  disabled={editNotePending}
                                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 disabled:opacity-70 transition-colors cursor-pointer"
                                >
                                  {editNotePending ? 'Đang lưu...' : 'Lưu'}
                                </button>
                                <button
                                  onClick={() => setIsEditingNote(false)}
                                  disabled={editNotePending}
                                  className="px-3 py-1.5 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center flex-wrap gap-2">
                              <span className="text-gray-600 dark:text-gray-400 break-all bg-white/50 dark:bg-black/20 px-2 py-1 rounded border border-gray-200 dark:border-gray-700/50">
                                {result.allNotes || '(Trống)'}
                              </span>
                              {result.ip && (
                                <button
                                  onClick={() => {
                                    setEditNoteText(result.allNotes || '');
                                    setIsEditingNote(true);
                                  }}
                                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors cursor-pointer"
                                  title="Chỉnh sửa ghi chú"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {result.addedTime && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm flex items-center text-gray-600 dark:text-gray-400">
                          <Calendar className="w-3.5 h-3.5 mr-1" />
                          Ngày thêm: {new Date(result.addedTime).toLocaleString('vi-VN')}
                        </p>
                        {result.updatedTime && (
                          <p className="text-sm flex items-center text-gray-600 dark:text-gray-400">
                            <Calendar className="w-3.5 h-3.5 mr-1" />
                            Ngày cập nhật gần nhất: {new Date(result.updatedTime).toLocaleString('vi-VN')}
                          </p>
                        )}
                      </div>
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

            {/* Selected Jobs Display */}
            {selectedJobs.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Kèo Đang Chọn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {jobs.filter(j => selectedJobs.includes(j.id)).map(job => (
                    <div key={job.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="font-bold text-lg leading-tight truncate" title={job.name}>{job.name}</h3>
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-300 whitespace-nowrap ml-2">
                          {job.links.split('\n').filter(l => l.trim()).length} links
                        </span>
                      </div>
                      <div className="p-4 flex-1 overflow-y-auto max-h-56 space-y-2">
                        {job.links.split('\n').filter(l => l.trim()).map((link, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                            <span className="text-xs font-mono truncate mr-2 text-gray-700 dark:text-gray-300" title={link}>
                              {link}
                            </span>
                            <button
                              onClick={() => handleCopy(link)}
                              className="text-xs px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer text-gray-600 dark:text-gray-300 flex-shrink-0 font-medium"
                            >
                              Copy
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* IP Filtering Tab */}
        {mainTab === 'filter' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="filterInput" className="block text-sm font-medium">
                      Nhập danh sách IP (1 IP mỗi dòng)
                    </label>
                    <button
                      onClick={handleClearFilter}
                      className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Xóa dữ liệu
                    </button>
                  </div>
                  <textarea
                    id="filterInput"
                    rows={8}
                    value={filterInput}
                    onChange={(e) => setFilterInput(e.target.value)}
                    placeholder="1.55.0.251:46561:randomm:randomm&#10;118.68.233.249:54079:randomm:randomm"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm resize-y"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Dữ liệu sẽ tự động được lưu lại trên máy của bạn. Có thể dán tối đa 100 dòng cùng lúc.
                  </p>
                </div>

                <button
                  onClick={handleFilterSubmit}
                  disabled={filterPending || !filterInput.trim()}
                  className="cursor-pointer w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-70 flex justify-center"
                >
                  {filterPending ? 'Đang lọc...' : 'Bắt đầu Lọc IP'}
                </button>
              </div>
            </div>

            {/* Results */}
            {filterResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sạch Table */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      IP Sạch ({filterResults.filter(r => r.status === 'Sạch').length})
                    </h3>
                    <button
                      onClick={() => handleCopy(filterResults.filter(r => r.status === 'Sạch').map(r => r.originalLine).join('\n'))}
                      className="text-sm px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50 transition-colors"
                    >
                      Copy tất cả
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-700">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50 dark:text-gray-400 sticky top-0">
                        <tr>
                          <th className="px-4 py-3">Nội dung</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filterResults.filter(r => r.status === 'Sạch').length === 0 ? (
                          <tr><td className="px-4 py-3 text-gray-500 text-center">Không có IP nào</td></tr>
                        ) : filterResults.filter(r => r.status === 'Sạch').map((r, i) => (
                          <tr key={i} className="border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="px-4 py-3 font-mono text-xs">{r.originalLine}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Trùng Table */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
                      IP Trùng ({filterResults.filter(r => r.status === 'Trùng').length})
                    </h3>
                    <button
                      onClick={() => handleCopy(filterResults.filter(r => r.status === 'Trùng').map(r => r.originalLine).join('\n'))}
                      className="text-sm px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
                    >
                      Copy tất cả
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-700">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50 dark:text-gray-400 sticky top-0">
                        <tr>
                          <th className="px-4 py-3">Nội dung</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filterResults.filter(r => r.status === 'Trùng').length === 0 ? (
                          <tr><td className="px-4 py-3 text-gray-500 text-center">Không có IP nào</td></tr>
                        ) : filterResults.filter(r => r.status === 'Trùng').map((r, i) => (
                          <tr key={i} className="border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="px-4 py-3 font-mono text-xs">{r.originalLine}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Lỗi Table (nếu có) */}
                {filterResults.some(r => r.status === 'Lỗi') && (
                  <div className="col-span-1 md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-600 dark:text-gray-400 mb-4">
                      Lỗi Định Dạng / Lỗi Kết Nối ({filterResults.filter(r => r.status === 'Lỗi').length})
                    </h3>
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-700">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50 dark:text-gray-400 sticky top-0">
                          <tr>
                            <th className="px-4 py-3">Nội dung</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filterResults.filter(r => r.status === 'Lỗi').map((r, i) => (
                            <tr key={i} className="border-b dark:border-gray-700 last:border-0">
                              <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.originalLine}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Link Kèo Tab */}
        {mainTab === 'job' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold mb-4">Thêm Kèo Mới</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="jobName" className="block text-sm font-medium mb-1">Tên Kèo (Job)</label>
                  <input
                    id="jobName"
                    type="text"
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                    placeholder="Ví dụ: Kèo Airdrop 1, Job B..."
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="jobLinks" className="block text-sm font-medium mb-1">Danh sách Link (Mỗi link 1 dòng)</label>
                  <textarea
                    id="jobLinks"
                    rows={5}
                    value={jobLinks}
                    onChange={(e) => setJobLinks(e.target.value)}
                    placeholder="https://t.me/...&#10;https://t.me/..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm resize-y transition-colors"
                  />
                </div>
                <button
                  onClick={handleJobSubmit}
                  disabled={jobPending || !jobName.trim() || !jobLinks.trim()}
                  className="cursor-pointer w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-70 flex justify-center"
                >
                  {jobPending ? 'Đang lưu...' : 'Lưu Kèo'}
                </button>
              </div>
            </div>

            {/* Grid hiển thị Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map(job => (
                <div key={job.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedJobs.includes(job.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedJobs([...selectedJobs, job.id])
                          } else {
                            setSelectedJobs(selectedJobs.filter(id => id !== job.id))
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer mr-3 shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg leading-tight truncate" title={job.name}>{job.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{new Date(job.created_at).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-300 whitespace-nowrap ml-2 shrink-0">
                      {job.links.split('\n').filter(l => l.trim()).length} links
                    </span>
                  </div>

                  {editingJobId === job.id ? (
                    <div className="p-4 flex-1">
                      <textarea
                        className="w-full h-48 p-3 text-xs font-mono bg-white dark:bg-gray-900 border border-blue-300 dark:border-blue-700 rounded-lg focus:outline-none resize-none cursor-text focus:ring-2 focus:ring-blue-500"
                        value={editingLinks}
                        onChange={(e) => setEditingLinks(e.target.value)}
                        placeholder="Nhập danh sách link mới..."
                      />
                    </div>
                  ) : (
                    <div className="p-4 flex-1 overflow-y-auto max-h-56 space-y-2">
                      {job.links.split('\n').filter(l => l.trim()).map((link, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                          <span className="text-xs font-mono truncate mr-2 text-gray-700 dark:text-gray-300" title={link}>
                            {link}
                          </span>
                          <button
                            onClick={() => handleCopy(link)}
                            className="text-xs px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer text-gray-600 dark:text-gray-300 flex-shrink-0 font-medium"
                          >
                            Copy
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex space-x-2">
                    {editingJobId === job.id ? (
                      <>
                        <button
                          onClick={() => handleSaveJob(job.id)}
                          className="cursor-pointer flex-1 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg text-sm font-medium transition-colors"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={() => setEditingJobId(null)}
                          className="cursor-pointer px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                        >
                          Hủy
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingJobId(job.id); setEditingLinks(job.links); }}
                          className="cursor-pointer flex-1 py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 rounded-lg text-sm font-medium transition-colors"
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="cursor-pointer px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg text-sm font-medium transition-colors"
                        >
                          Xóa
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {jobs.length === 0 && (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                  <p className="text-gray-500 dark:text-gray-400">Chưa có kèo nào. Hãy tạo kèo mới ở trên!</p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-gray-700 flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="px-4 h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 shrink-0">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-white">IP Gần Đây</h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={fetchRecent}
              disabled={loadingRecent}
              className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50"
              title="Tải lại"
            >
              <RefreshCw className={`w-4 h-4 ${loadingRecent ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
          {recentIps.map((item) => (
            <div key={item.ip} className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-1.5 gap-2">
                <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 break-all">{item.ip}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                  {new Date(item.updated_time || item.added_time).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 break-words">{item.notes}</p>
            </div>
          ))}
          {recentIps.length === 0 && !loadingRecent && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có IP nào.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
