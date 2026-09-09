'use server'

import { supabase } from '@/lib/supabase'

async function checkSmsbetApi(ip: string): Promise<string> {
  try {
    const res = await fetch(`https://bet.smsbet.top/check_ip.php?ip=${ip}`, {
      headers: {
        'accept': '*/*',
        'referer': 'https://bet.smsbet.top/',
        'user-agent': 'Mozilla/5.0'
      },
      cache: 'no-store'
    })
    if (!res.ok) return 'Lỗi kết nối'
    const data = await res.json()
    const st = String(data.status || '').toLowerCase().trim()

    if (['exists', 'exist', 'found'].includes(st)) return 'Trùng'
    if (['not_exists', 'notexist', 'missing', 'not_found'].includes(st)) return 'Sạch'
    return `Lỗi (${st})`
  } catch (err) {
    return 'Lỗi ngoại lệ'
  }
}

export async function submitNote(ip: string, note: string) {
  // Validate basic IP format
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (!ipRegex.test(ip)) {
    return { success: false, message: 'Định dạng IP không hợp lệ.' }
  }

  if (!note.trim()) {
    return { success: false, message: 'Ghi chú không được để trống.' }
  }

  // Check if IP exists
  const { data: existingIp, error: fetchError } = await supabase
    .from('ips')
    .select('*')
    .eq('ip', ip)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is not found
    return { success: false, message: 'Lỗi khi kiểm tra CSDL: ' + fetchError.message }
  }

  const smsbetStatus = await checkSmsbetApi(ip)

  if (existingIp) {
    const currentNotes = existingIp.notes ? existingIp.notes.split(' | ').map((n: string) => n.trim()) : []
    const noteExists = currentNotes.includes(note.trim())

    if (noteExists) {
      return {
        success: true,
        message: `IP ${ip} đã sử dụng ghi chú "${note.trim()}".`,
        isDuplicate: true,
        addedTime: existingIp.added_time,
        allNotes: existingIp.notes,
        smsbetStatus,
        ip
      }
    } else {
      const newNotesString = existingIp.notes ? `${existingIp.notes} | ${note.trim()}` : note.trim()
      const now = new Date().toISOString()
      const { error: updateError } = await supabase
        .from('ips')
        .update({ notes: newNotesString, added_time: now })
        .eq('ip', ip)

      if (updateError) {
        return { success: false, message: 'Lỗi cập nhật CSDL: ' + updateError.message }
      }

      return {
        success: true,
        message: `Đã thêm ghi chú "${note.trim()}" vào IP ${ip}.`,
        isDuplicate: false,
        addedTime: now,
        allNotes: newNotesString,
        smsbetStatus,
        ip
      }
    }
  } else {
    // Insert new IP
    const now = new Date().toISOString()
    const { error: insertError } = await supabase
      .from('ips')
      .insert({ ip: ip, notes: note.trim(), added_time: now })

    if (insertError) {
      return { success: false, message: 'Lỗi thêm mới CSDL: ' + insertError.message }
    }

    return {
      success: true,
      message: `Đã tạo IP mới ${ip} với ghi chú "${note.trim()}".`,
      isDuplicate: false,
      addedTime: now,
      allNotes: note.trim(),
      smsbetStatus,
      ip
    }
  }
}

export async function updateIpNote(ip: string, notes: string) {
  if (!notes.trim()) {
    return { success: false, message: 'Ghi chú không được để trống' }
  }

  const { error } = await supabase
    .from('ips')
    .update({ notes: notes.trim(), added_time: new Date().toISOString() })
    .eq('ip', ip)

  if (error) {
    return { success: false, message: 'Lỗi cập nhật CSDL: ' + error.message }
  }

  return { success: true }
}

export async function getCommonNotes() {
  const { data, error } = await supabase
    .from('common_notes')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error("Lỗi lấy danh sách ghi chú thường dùng", error)
    return []
  }
  return data
}

export async function getRecentIps() {
  const { data, error } = await supabase
    .from('ips')
    .select('*')
    .order('added_time', { ascending: false })
    .limit(50)

  if (error) {
    console.error("Lỗi lấy danh sách IP gần đây", error)
    return []
  }
  return data
}

export async function addCommonNote(note: string) {
  if (!note.trim()) return { success: false, message: 'Ghi chú trống' }
  const { error } = await supabase
    .from('common_notes')
    .insert({ note: note.trim() })

  if (error) {
    return { success: false, message: 'Lỗi thêm ghi chú (có thể đã tồn tại)' }
  }
  return { success: true }
}

export type FilterResult = {
  ip: string
  originalLine: string
  status: 'Sạch' | 'Trùng' | 'Lỗi'
}

export async function filterIps(lines: string[]): Promise<FilterResult[]> {
  const results: FilterResult[] = []

  // Extract IPs anywhere in the string
  const ipRegex = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/

  const chunks = []
  const chunkSize = 10
  for (let i = 0; i < lines.length; i += chunkSize) {
    chunks.push(lines.slice(i, i + chunkSize))
  }

  for (const chunk of chunks) {
    const chunkPromises = chunk.map(async (line) => {
      const trimmed = line.trim()
      if (!trimmed) return null

      const match = trimmed.match(ipRegex)
      if (!match) {
        return { ip: '', originalLine: trimmed, status: 'Lỗi' as const }
      }
      const ip = match[0]
      const st = await checkSmsbetApi(ip)

      let status: 'Sạch' | 'Trùng' | 'Lỗi' = 'Lỗi'
      if (st === 'Sạch') status = 'Sạch'
      else if (st === 'Trùng') status = 'Trùng'

      return { ip, originalLine: trimmed, status }
    })

    const chunkRes = await Promise.all(chunkPromises)
    results.push(...chunkRes.filter(Boolean) as FilterResult[])
  }

  return results
}

export type Job = {
  id: string;
  name: string;
  links: string;
  created_at: string;
}

export async function getJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching jobs:', error)
    return []
  }
  return data as Job[]
}

export async function addJob(name: string, links: string) {
  if (!name.trim() || !links.trim()) {
    return { success: false, message: 'Tên và Links không được để trống' }
  }

  const { error } = await supabase
    .from('jobs')
    .insert({ name: name.trim(), links: links.trim() })

  if (error) {
    return { success: false, message: 'Lỗi thêm Kèo: ' + error.message }
  }
  return { success: true }
}

export async function deleteJob(id: string) {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, message: 'Lỗi xóa Kèo: ' + error.message }
  }
  return { success: true }
}

export async function updateJob(id: string, links: string) {
  if (!links.trim()) {
    return { success: false, message: 'Links không được để trống' }
  }

  const { error } = await supabase
    .from('jobs')
    .update({ links: links.trim() })
    .eq('id', id)

  if (error) {
    return { success: false, message: 'Lỗi cập nhật Kèo: ' + error.message }
  }
  return { success: true }
}
