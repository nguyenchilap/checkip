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
        smsbetStatus
      }
    } else {
      const newNotesString = existingIp.notes ? `${existingIp.notes} | ${note.trim()}` : note.trim()
      const { error: updateError } = await supabase
        .from('ips')
        .update({ notes: newNotesString })
        .eq('ip', ip)

      if (updateError) {
        return { success: false, message: 'Lỗi cập nhật CSDL: ' + updateError.message }
      }

      return { 
        success: true, 
        message: `Đã thêm ghi chú "${note.trim()}" vào IP ${ip} (đã tồn tại).`,
        isDuplicate: false,
        addedTime: existingIp.added_time,
        allNotes: newNotesString,
        smsbetStatus
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
      smsbetStatus
    }
  }
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
