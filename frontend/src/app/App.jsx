import React, { useState } from 'react';
import { navigation } from './navigation.js';
import SystemStatus from '../features/dashboard/SystemStatus.jsx';
import ModulePlaceholder from '../shared/components/ModulePlaceholder.jsx';

export default function App() {
  const [role, setRole] = useState('Ban quản lý');
  const [page, setPage] = useState('Tổng quan');
  return <div className="shell">
    <header><strong>CHUNG CƯ / KHUNG DỰ ÁN</strong><p>Bản xem cấu trúc · Chưa có đăng nhập và dữ liệu thật</p></header>
    <label className="role">Xem nhóm màn hình: <select value={role} onChange={event => {
      setRole(event.target.value); setPage(navigation[event.target.value][0]);
    }}>{Object.keys(navigation).map(item => <option key={item}>{item}</option>)}</select></label>
    <div className="workspace"><nav aria-label="Chức năng">{navigation[role].map(item =>
      <button key={item} aria-current={page === item ? 'page' : undefined} onClick={() => setPage(item)}>{item}</button>
    )}</nav><main><p>{role}</p><h1>{page}</h1><SystemStatus /><ModulePlaceholder title={page} />
      <p className="note">Chọn nhóm màn hình chỉ phục vụ xem trước. Quyền truy cập sẽ được kiểm tra tại backend khi triển khai.</p>
    </main></div>
  </div>;
}
