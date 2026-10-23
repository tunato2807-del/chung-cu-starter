import React, { useEffect, useRef, useState } from 'react';
import { navigation } from './navigation.js';
import { getPageDetails, groupDescriptions, normalizeSearch } from './pageDetails.js';
import Sidebar from './Sidebar.jsx';
import SystemStatus from '../features/dashboard/SystemStatus.jsx';
import ModulePlaceholder from '../shared/components/ModulePlaceholder.jsx';
import PageDirectory from '../shared/components/PageDirectory.jsx';
import Icon from '../shared/components/Icon.jsx';

export default function App() {
  const [role, setRole] = useState('Ban quản lý');
  const [page, setPage] = useState('Tổng quan');
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [navigationCount, setNavigationCount] = useState(0);
  const headingRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const searching = Boolean(query.trim());
  const isOverview = page === 'Tổng quan' || page === 'Trang chủ';
  const results = navigation[role].filter(item => normalizeSearch(item).includes(normalizeSearch(query)));

  useEffect(() => {
    document.title = `${searching ? 'Tìm màn hình' : page} · ${role} · Chung cư`;
  }, [page, role, searching]);

  useEffect(() => {
    if (navigationCount > 0) headingRef.current?.focus();
  }, [page, role, navigationCount]);

  function navigate(nextPage) {
    setPage(nextPage);
    setQuery('');
    setMenuOpen(false);
    setNavigationCount(value => value + 1);
  }

  function changeGroup(nextRole) {
    setRole(nextRole);
    navigate(navigation[nextRole][0]);
  }

  function clearSearch() {
    setQuery('');
    searchRef.current?.focus();
  }

  return <div className="shell" onKeyDown={event => {
    if (event.key === 'Escape' && menuOpen) {
      setMenuOpen(false);
      menuRef.current?.focus();
    }
  }}>
    <a className="skip-link" href="#main-content">Đến nội dung chính</a>
    <nav className="mobile-header" aria-label="Menu di động"><span><Icon name="building" /> CHUNG CƯ</span>
      <button ref={menuRef} className="button" type="button" aria-controls="workspace-menu"
        aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
        <Icon name={menuOpen ? 'close' : 'menu'} />{menuOpen ? 'Đóng menu' : 'Menu'}
      </button>
    </nav>
    <Sidebar role={role} page={page} open={menuOpen} onRoleChange={changeGroup} onNavigate={navigate} />
    <div className="workspace">
      <header className="topbar">
        <div className="search-area" role="search">
          <label htmlFor="screen-search">Tìm màn hình <span>· {role}</span></label>
          <div className="search-field">
            <Icon name="search" /><input ref={searchRef} id="screen-search" type="search" value={query}
              placeholder="Tìm phản ánh, hóa đơn, căn hộ…" onChange={event => setQuery(event.target.value)}
              onKeyDown={event => { if (event.key === 'Escape') clearSearch(); }} />
            {query && <button className="icon-button" type="button" aria-label="Xóa tìm kiếm" onClick={clearSearch}><Icon name="close" /></button>}
          </div>
        </div>
        <span className="preview-badge">Bản xem trước</span>
      </header>
      <main id="main-content" tabIndex={-1}>
        <div className="page-heading"><p className="eyebrow">{role}</p>
          <h1 ref={headingRef} tabIndex={-1}>{searching ? 'Tìm màn hình' : page}</h1>
          <p>{searching ? `Tìm trong nhóm ${role.toLowerCase()}. Có thể nhập tên có dấu hoặc không dấu.` :
            isOverview ? groupDescriptions[role] : getPageDetails(page, role).description}</p>
        </div>
        <div className="content-layout">
          <div className="primary-content">
            {searching ? <PageDirectory pages={results} role={role} onNavigate={navigate} searching onClear={clearSearch} /> :
              isOverview ? <PageDirectory pages={navigation[role].filter(item => item !== page)} role={role} onNavigate={navigate} /> :
                <ModulePlaceholder title={page} role={role} />}
          </div>
          <aside className="context-column" aria-label="Thông tin hệ thống">
            <SystemStatus />
            <section className="scope-note"><h2>Về bản xem trước</h2>
              <p>Khám phá bố cục và phạm vi của từng phân hệ trước khi triển khai.</p>
              <details><summary>Chức năng hiện có</summary>
                <ul><li>Điều hướng giữa bốn nhóm màn hình.</li><li>Tìm kiếm tên màn hình.</li><li>Kiểm tra kết nối API thực tế.</li></ul>
                <p>Chưa có đăng nhập, dữ liệu cư dân, lưu phản ánh hay thanh toán.</p>
              </details>
            </section>
          </aside>
        </div>
        <footer className="workspace-footer">Quản lý vận hành chung cư <span aria-hidden="true">·</span> Tiếp nhận phản ánh cư dân</footer>
      </main>
    </div>
  </div>;
}
