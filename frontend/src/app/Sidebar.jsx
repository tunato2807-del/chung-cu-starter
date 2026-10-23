import React from 'react';
import { navigation } from './navigation.js';
import { pageDetails } from './pageDetails.js';
import Icon from '../shared/components/Icon.jsx';

export default function Sidebar({ role, page, open, onRoleChange, onNavigate }) {
  return <aside id="workspace-menu" className={`sidebar ${open ? 'is-open' : ''}`}>
    <div className="brand"><span className="brand-mark"><Icon name="building" /></span>
      <div><strong>CHUNG CƯ</strong><span>Quản lý vận hành</span></div>
    </div>
    <div className="group-picker">
      <label htmlFor="preview-group">Nhóm xem trước</label>
      <select id="preview-group" value={role} onChange={event => onRoleChange(event.target.value)}
        aria-describedby="preview-note">
        {Object.keys(navigation).map(item => <option key={item}>{item}</option>)}
      </select>
    </div>
    <nav aria-label="Chức năng">
      <p className="nav-label">Không gian làm việc</p>
      {navigation[role].map(item => <button key={item} type="button"
        aria-current={page === item ? 'page' : undefined} onClick={() => onNavigate(item)}>
        <Icon name={pageDetails[item].icon} /><span>{item}</span>
      </button>)}
    </nav>
    <div className="sidebar-note"><Icon name="info" /><p id="preview-note">
      Chọn nhóm để xem cấu trúc màn hình. Chưa có đăng nhập và phân quyền.</p></div>
  </aside>;
}
