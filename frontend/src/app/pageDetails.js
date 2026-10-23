// Mô tả phạm vi dự kiến; không phải dữ liệu hoặc quyền nghiệp vụ.
export const pageDetails = {
  'Tổng quan': { icon: 'overview', description: 'Đi đến các phân hệ quản lý và theo dõi trạng thái hệ thống.' },
  'Trang chủ': { icon: 'home', description: 'Tìm các dịch vụ dành cho cư dân trong cùng một không gian.' },
  'Phản ánh': { icon: 'message', description: 'Tiếp nhận, phân công và theo dõi quá trình xử lý phản ánh.', steps: ['Tiếp nhận nội dung và ảnh hiện trường', 'Phân công người xử lý', 'Cập nhật kết quả và lịch sử'] },
  'Căn hộ và cư trú': { icon: 'home', description: 'Quản lý thông tin căn hộ, cư dân và lịch sử cư trú.', steps: ['Quản lý hồ sơ căn hộ', 'Ghi nhận cư dân và quan hệ với căn hộ', 'Theo dõi chuyển căn, chuyển đi'] },
  'Vị trí và QR': { icon: 'qr', description: 'Gắn mã QR với vị trí để tiếp nhận phản ánh đúng nơi.', steps: ['Khai báo vị trí', 'Tạo mã QR cho từng vị trí', 'Quản lý hiệu lực và thu hồi mã'] },
  'Phí và hóa đơn': { icon: 'receipt', description: 'Theo dõi đơn giá, chỉ số điện nước và hóa đơn căn hộ.', steps: ['Thiết lập đơn giá và ghi chỉ số', 'Lập và gửi hóa đơn', 'Đối chiếu, xác nhận thanh toán'] },
  'Hóa đơn': { icon: 'receipt', description: 'Xem các khoản phí và tình trạng thanh toán của căn hộ.', steps: ['Xem hóa đơn được gửi', 'Kiểm tra từng khoản phí', 'Theo dõi xác nhận thanh toán'] },
  'Thông báo': { icon: 'bell', description: 'Theo dõi thông tin và thông báo từ ban quản lý.', steps: ['Soạn nội dung thông báo', 'Chọn nhóm người nhận', 'Gửi và xem thông báo'] },
  'Nhân sự và tài khoản': { icon: 'user', description: 'Quản lý nhân sự, tài khoản và vai trò trong hệ thống.', steps: ['Quản lý thông tin nhân sự', 'Cấp tài khoản theo vai trò', 'Quản lý trạng thái truy cập'] },
  'Tài khoản': { icon: 'user', description: 'Xem thông tin cá nhân và quản lý tài khoản đăng nhập.', steps: ['Đăng nhập vào hệ thống', 'Xem thông tin tài khoản', 'Cập nhật mật khẩu'] },
  'Cấu hình': { icon: 'settings', description: 'Thiết lập thông tin chung của tòa nhà.', steps: ['Khai báo thông tin tòa nhà', 'Kiểm tra thông tin liên hệ', 'Lưu cấu hình sử dụng chung'] },
  'Công việc': { icon: 'work', description: 'Theo dõi phản ánh được giao và tiến độ xử lý.', steps: ['Xem công việc được phân công', 'Cập nhật tiến độ và ảnh xử lý', 'Ghi nhận kết quả công việc'] },
  'Quét QR': { icon: 'qr', description: 'Mở biểu mẫu phản ánh từ mã QR tại vị trí xảy ra sự cố.', steps: ['Quét mã tại vị trí', 'Kiểm tra thông tin vị trí', 'Mở biểu mẫu phản ánh'] },
  'Gửi phản ánh': { icon: 'message', description: 'Cung cấp nội dung và ảnh về vấn đề cần được hỗ trợ.', steps: ['Kiểm tra vị trí từ QR', 'Nhập nội dung và đính kèm ảnh', 'Nhận thông tin tra cứu'] },
  'Tra cứu phản ánh': { icon: 'search', description: 'Tra cứu tình trạng xử lý bằng thông tin được cấp.', steps: ['Nhập thông tin tra cứu', 'Xem trạng thái phản ánh', 'Theo dõi kết quả xử lý'] },
};

export const groupDescriptions = {
  'Ban quản lý': 'Điều phối vận hành, kết nối cư dân và quản lý thông tin tòa nhà.',
  'Cư dân': 'Phản ánh, hóa đơn và thông tin cần thiết cho cuộc sống tại chung cư.',
  'Kỹ thuật viên': 'Không gian theo dõi công việc và thông tin xử lý được phân công.',
  'Khách': 'Tiếp cận kênh phản ánh qua mã QR tại tòa nhà.',
};

const readingAnnouncements = {
  description: 'Đọc thông tin và thông báo được gửi từ ban quản lý.',
  steps: ['Xem các thông báo dành cho mình', 'Đọc nội dung và thời điểm thông báo', 'Theo dõi thông tin cập nhật'],
};

const groupOverrides = {
  'Cư dân': {
    'Phản ánh': {
      description: 'Gửi phản ánh và theo dõi kết quả xử lý vấn đề cần hỗ trợ.',
      steps: ['Gửi nội dung và ảnh hiện trường', 'Theo dõi tiến độ phản ánh của mình', 'Xem kết quả xử lý'],
    },
    'Thông báo': readingAnnouncements,
  },
  'Kỹ thuật viên': { 'Thông báo': readingAnnouncements },
};

export function getPageDetails(page, group) {
  return { ...pageDetails[page], ...groupOverrides[group]?.[page] };
}

export function normalizeSearch(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().trim();
}
