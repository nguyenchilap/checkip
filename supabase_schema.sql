-- Xóa bảng nếu đã tồn tại để tránh lỗi
DROP TABLE IF EXISTS ips;
DROP TABLE IF EXISTS common_notes;

-- Tạo bảng ips
CREATE TABLE ips (
    ip TEXT PRIMARY KEY,
    notes TEXT,
    added_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo bảng common_notes
CREATE TABLE common_notes (
    note TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tắt Row Level Security (RLS) để cho phép client (ứng dụng Next.js) có thể đọc/ghi bằng ANON KEY. 
-- (Lưu ý: Vì yêu cầu của bạn là dùng 1 tài khoản admin hardcode ở tầng Next.js middleware, 
--  nên ở đây ta có thể mở quyền truy cập RLS cho đơn giản).
ALTER TABLE ips DISABLE ROW LEVEL SECURITY;
ALTER TABLE common_notes DISABLE ROW LEVEL SECURITY;
