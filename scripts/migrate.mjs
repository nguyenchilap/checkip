import fs from 'fs'
import readline from 'readline'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrate() {
  const filePath = path.join(__dirname, '../all_ips.csv')
  
  if (!fs.existsSync(filePath)) {
    console.error("File all_ips.csv not found!")
    return
  }

  console.log("Xóa dữ liệu cũ rác trong bảng ips...")
  // Delete all existing data to clean up the mess
  const { error: delError } = await supabase.from('ips').delete().neq('ip', '0.0.0.0')
  if (delError) {
    console.error("Lỗi khi xóa dữ liệu cũ:", delError)
  }

  console.log("Bắt đầu parse và migrate dữ liệu mới...")

  const fileStream = fs.createReadStream(filePath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  let rows = []
  let count = 0
  
  for await (const line of rl) {
    // Tìm IP
    const ipMatch = line.match(/(\d{1,3}(?:\.\d{1,3}){3})/)
    // Tìm Date
    const dateMatch = line.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/)

    if (ipMatch && dateMatch) {
      const ip = ipMatch[1]
      const dateStr = dateMatch[1]
      
      const startIndex = ipMatch.index + ipMatch[0].length
      const endIndex = dateMatch.index
      
      let note = line.substring(startIndex, endIndex)
      // Dọn dẹp khoảng trắng, dấu phẩy, dấu nháy kép thừa
      note = note.replace(/^[,"'\s]+|[,"'\s]+$/g, '')

      if (ip && note && dateStr) {
        // Kiểm tra xem date có hợp lệ không
        const parsedTime = new Date(dateStr)
        if (!isNaN(parsedTime.getTime())) {
          rows.push({
            ip,
            notes: note,
            added_time: parsedTime.toISOString()
          })
          count++
        }
      }
    }

    // Bulk insert every 500 records
    if (rows.length >= 500) {
      const { error } = await supabase.from('ips').upsert(rows)
      if (error) {
        console.error("Lỗi khi insert batch:", error)
      } else {
        console.log(`Đã insert ${count} records hợp lệ...`)
      }
      rows = []
    }
  }

  // Insert remaining
  if (rows.length > 0) {
    const { error } = await supabase.from('ips').upsert(rows)
    if (error) {
      console.error("Lỗi khi insert số lượng còn lại:", error)
    } else {
      console.log(`Hoàn thành! Đã insert tổng cộng ${count} records hợp lệ.`)
    }
  } else {
    console.log(`Hoàn thành! Đã insert tổng cộng ${count} records hợp lệ.`)
  }
}

migrate().catch(console.error)
