# Cập nhật giao diện main trong VS Code

**Nếu dự án của bạn đã có đăng nhập, QR, hóa đơn:** không thay các file bên dưới vào bản đó. Nếu đã bị trang trắng với lỗi App.jsx đọc `filter`, mở [hướng dẫn khôi phục bản nghiệp vụ](khoi-phuc-ban-nghiep-vu-vscode.md).

Bản này áp dụng cho bộ khung trên `main` tại commit `59bd4ae`, được sửa trong nhánh `codex/main-ui-refresh`. Nhánh `codex/auth-qr-incidents` có nhiều nghiệp vụ hơn và cấu trúc App khác. Không chép đè bộ file này vào bản nghiệp vụ đó: cần tích hợp theo component và router của bản ấy.

Không cần tải lại ZIP. Với đúng bộ khung main, tạo hoặc mở lần lượt tám đường dẫn bên dưới, thay toàn bộ nội dung bằng code tương ứng rồi lưu UTF-8. Các file mới phải giữ đúng tên và phần mở rộng. Không cần sửa backend, API, package.json hoặc cấu hình database.

Sau khi lưu, chạy từ thư mục gốc bằng Node 24:

```powershell
npm ci
npm run build
npm run dev:backend
```

Giữ terminal backend mở. Mở terminal thứ hai:

```powershell
npm run dev:frontend
```

Mở địa chỉ Vite hiển thị. Để kiểm tra: chọn đủ bốn nhóm; nhập `hoa don` hoặc `PHẢN ÁNH`; mở menu trên điện thoại; bấm Kiểm tra lại. API của bộ khung trả MySQL chưa cấu hình là đúng. Các màn hình nghiệp vụ hiện là bản xem trước.

## 1. frontend/src/app/App.jsx

Thay nội dung.

```jsx
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
  const screens = navigation[role];
  const compatibleNavigation = Array.isArray(screens) && screens.length > 0 &&
    screens.every(item => typeof item === 'string');
  const results = compatibleNavigation ?
    screens.filter(item => normalizeSearch(item).includes(normalizeSearch(query))) : [];

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

  if (!compatibleNavigation) {
    return <main className="version-mismatch" aria-labelledby="version-mismatch-title">
      <section className="panel module-preview" role="alert">
        <h1 id="version-mismatch-title">Không khớp phiên bản giao diện</h1>
        <p>App.jsx của bộ khung main đang được dùng cùng menu của bản đầy đủ nghiệp vụ.</p>
        <p>Hãy khôi phục App.jsx và stylesheet đúng bản để tiếp tục dùng đăng nhập, QR và hóa đơn.</p>
        <p><a href="https://github.com/tunato2807-del/chung-cu-starter/blob/codex/main-ui-refresh/docs/ui-main/khoi-phuc-ban-nghiep-vu-vscode.md">
          Mở hướng dẫn khôi phục bản nghiệp vụ</a></p>
      </section>
    </main>;
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

```

## 2. frontend/src/app/Sidebar.jsx

Tạo file mới.

```jsx
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

```

## 3. frontend/src/app/pageDetails.js

Tạo file mới.

```javascript
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

```

## 4. frontend/src/features/dashboard/SystemStatus.jsx

Thay nội dung.

```jsx
import React, { useEffect, useState } from 'react';
import { getJson } from '../../shared/api/client.js';
import Icon from '../../shared/components/Icon.jsx';

export default function SystemStatus() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let timedOut = false;
    setState({ status: 'loading' });
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 5000);

    getJson('/health', { signal: controller.signal })
      .then(payload => {
        if (payload?.data?.status !== 'ok') throw new Error('INVALID_HEALTH');
        if (active) setState({ status: 'success', database: payload.data.database,
          checkedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) });
      })
      .catch(error => {
        if (!active) return;
        const message = timedOut ? 'API chưa phản hồi sau 5 giây. Hãy kiểm tra backend và thử lại.' :
          error.message === 'INVALID_HEALTH' || error instanceof SyntaxError ?
            'Phản hồi API không hợp lệ. Hãy kiểm tra dịch vụ backend.' :
            'Chưa kết nối được API. Hãy chạy backend ở terminal thứ hai.';
        setState({ status: 'error', message });
      })
      .finally(() => clearTimeout(timeout));

    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [attempt]);

  const loading = state.status === 'loading';
  const connected = state.status === 'success';
  return <section className="panel system-status" aria-labelledby="system-title" aria-busy={loading}>
    <h2 id="system-title">Kết nối hệ thống</h2>
    <div className={`connection-state ${state.status}`} role="status" aria-atomic="true">
      <span className="connection-icon"><Icon name={connected ? 'check' : 'info'} /></span>
      <div><strong>{loading ? 'Đang kiểm tra API…' : connected ? 'API đang hoạt động' : 'Cần kiểm tra kết nối'}</strong>
        {loading ? <span className="loading-bar" aria-hidden="true" /> :
          <p>{connected ? `Kiểm tra lúc ${state.checkedAt}` : state.message}</p>}
      </div>
    </div>
    <dl className="database-state"><dt>MySQL</dt><dd>{connected ?
      state.database === 'not_configured' ? 'Chưa cấu hình' : 'Chưa xác định trạng thái' : 'Chưa xác minh'}</dd></dl>
    <p className="status-help">Kết nối API hoạt động chưa đồng nghĩa các nghiệp vụ đã sẵn sàng.</p>
    <button className="button status-retry" type="button" disabled={loading}
      onClick={() => setAttempt(value => value + 1)}><Icon name="refresh" />{loading ? 'Đang kiểm tra' : 'Kiểm tra lại'}</button>
  </section>;
}

```

## 5. frontend/src/shared/components/Icon.jsx

Tạo file mới.

```jsx
import React from 'react';

const paths = {
  building: 'M4 21V3h12v18M2 21h20M16 9h4v12M8 7h4M8 11h4M8 15h4M9 21v-3h2v3',
  overview: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  message: 'M21 15a3 3 0 0 1-3 3H9l-6 3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3zM7 8h10M7 12h7',
  home: 'm3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8',
  qr: 'M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6z',
  receipt: 'M5 3h14v18l-3-2-4 2-4-2-3 2zM9 8h6M9 12h6',
  bell: 'M5 17h14l-2-3V9a5 5 0 0 0-10 0v5zM10 21h4M12 2v2',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-2a8 8 0 0 1 16 0v2',
  settings: 'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6',
  work: 'M4 7h16v14H4zM9 7V3h6v4M4 12h16M10 12v3h4v-3',
  search: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0m-2 5 6 6',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'm6 6 12 12M6 18 18 6',
  check: 'm5 12 4 4L19 6',
  info: 'M12 11v6M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  refresh: 'M20 7v5h-5M4 17v-5h5M5 7a8 8 0 0 1 13-2l2 3M4 16l2 3a8 8 0 0 0 13-2',
};

export default function Icon({ name, className = '' }) {
  return <svg className={`icon ${className}`} width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" focusable="false"><path d={paths[name] || paths.overview} /></svg>;
}

```

## 6. frontend/src/shared/components/PageDirectory.jsx

Tạo file mới.

```jsx
import React from 'react';
import { getPageDetails } from '../../app/pageDetails.js';
import Icon from './Icon.jsx';

export default function PageDirectory({ pages, role, onNavigate, searching = false, onClear }) {
  return <section className="panel directory" aria-labelledby="directory-title">
    <div className="section-heading"><h2 id="directory-title">{searching ? 'Kết quả tìm kiếm' : 'Khám phá các phân hệ'}</h2>
      <span className="count" role="status">{pages.length} màn hình</span></div>
    {pages.length ? <ul className="directory-list">{pages.map(page => <li key={page}>
      <button type="button" onClick={() => onNavigate(page)}>
        <span className="module-icon"><Icon name={getPageDetails(page, role).icon} /></span>
        <span className="module-copy"><strong>{page}</strong><span>{getPageDetails(page, role).description}</span></span>
        <Icon name="arrow" className="row-arrow" />
      </button>
    </li>)}</ul> : <div className="empty-search"><Icon name="search" />
      <h3>Chưa tìm thấy màn hình</h3><p>Thử từ khóa ngắn hơn hoặc chọn nhóm xem trước khác.</p>
      <button className="button" type="button" onClick={onClear}>Xóa tìm kiếm</button>
    </div>}
    {!searching && <p className="section-footnote">Các phân hệ đang ở bước thiết kế, chưa hỗ trợ thao tác nghiệp vụ.</p>}
  </section>;
}

```

## 7. frontend/src/shared/components/ModulePlaceholder.jsx

Thay nội dung.

```jsx
import React from 'react';
import { getPageDetails } from '../../app/pageDetails.js';
import Icon from './Icon.jsx';

export default function ModulePlaceholder({ title, role }) {
  const details = getPageDetails(title, role);
  return <section className="panel module-preview" aria-labelledby="module-title">
    <div className="module-state"><span className="module-icon"><Icon name={details.icon} /></span>
      <span className="status-label">Chưa triển khai nghiệp vụ</span></div>
    <h2 id="module-title">Không gian dành cho {title.toLowerCase()}</h2>
    <p>Phân hệ đã có vị trí trong hệ thống. Các thao tác và dữ liệu sẽ được bổ sung ở bước triển khai tiếp theo.</p>
    <div className="planned-flow"><h3>Luồng dự kiến</h3>
      <ol>{details.steps.map((step, index) => <li key={step}>
        <span className="step-number" aria-hidden="true">{index + 1}</span><span>{step}</span>
      </li>)}</ol>
    </div>
    <p className="module-disclaimer"><Icon name="info" />Bản xem trước chưa lưu hoặc xử lý thông tin tại màn hình này.</p>
  </section>;
}

```

## 8. frontend/src/styles/global.css

Thay nội dung.

```css
:root {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #172c3b;
  background: #f3f6fa;
  line-height: 1.6;
  font-synthesis: none;
  --ink: #172c3b;
  --muted: #526574;
  --accent: #155e75;
  --accent-hover: #10495c;
  --accent-soft: #e9f3f6;
  --surface: #fff;
  --canvas: #f3f6fa;
  --line: #d5dfe8;
  --line-soft: #e9eef3;
  --control-border: #7b8e9c;
  --focus: #b45309;
  --success: #176344;
  --success-soft: #edf7f0;
  --error: #9e3526;
  --error-soft: #fff3ef;
  --radius: 8px;
}

* { box-sizing: border-box; }
body { margin: 0; }
button, input, select { font: inherit; }
button, select { cursor: pointer; }
button { color: inherit; }
button:disabled { cursor: wait; opacity: .65; }
button, a, input, select, summary { -webkit-tap-highlight-color: transparent; }
:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
h1:focus, main:focus { outline: none; }
h1:focus-visible { outline: 3px solid var(--focus); outline-offset: 4px; }
h1, h2, h3, p { margin: 0; }
h1 { font-size: 2rem; line-height: 1.25; letter-spacing: -.035em; font-weight: 700; }
h2 { font-size: 1.0625rem; line-height: 1.5; font-weight: 650; }
h3 { font-size: 1rem; font-weight: 650; }
.icon { flex: 0 0 auto; vertical-align: middle; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.skip-link { position: fixed; top: 8px; left: 8px; z-index: 20; transform: translateY(-160%); padding: 12px 20px; background: var(--ink); color: #fff; border-radius: 4px; }
.skip-link:focus { transform: translateY(0); }
.button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 8px 16px; border: 1px solid var(--control-border); border-radius: 6px; background: var(--surface); font-weight: 600; font-size: .875rem; }
.button:hover:not(:disabled) { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); }
.icon-button { display: grid; place-items: center; flex-shrink: 0; min-width: 44px; min-height: 44px; padding: 8px; border: 0; border-radius: 4px; background: transparent; color: var(--muted); }
.icon-button:hover { background: var(--accent-soft); color: var(--accent); }

/* Navigation stays in the document flow on small screens. */
.shell { min-height: 100vh; }
.mobile-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding: 12px 16px; background: var(--surface); border-bottom: 1px solid var(--line); }
.mobile-header > span { display: flex; align-items: center; gap: 8px; font-size: .875rem; font-weight: 750; letter-spacing: .04em; color: var(--accent); }
.sidebar { display: none; padding: 20px 16px; background: var(--surface); border-bottom: 1px solid var(--line); }
.sidebar.is-open { display: flex; flex-direction: column; }
.brand { display: none; }
.group-picker label { display: block; margin-bottom: 8px; color: var(--muted); font-size: .75rem; font-weight: 650; }
.group-picker select { width: 100%; min-height: 44px; padding: 8px 12px; color: var(--ink); background: var(--surface); border: 1px solid var(--control-border); border-radius: 6px; font-size: .9375rem; }
.sidebar nav { margin-top: 24px; display: flex; flex-direction: column; gap: 4px; }
.nav-label { padding: 0 12px 8px; text-transform: uppercase; letter-spacing: .07em; font-size: .6875rem; font-weight: 700; color: var(--muted); }
.sidebar nav button { display: flex; align-items: center; gap: 12px; min-height: 44px; padding: 12px; border: 0; border-radius: 6px; background: transparent; text-align: left; font-size: .875rem; line-height: 1.5; color: var(--muted); }
.sidebar nav button:hover { background: var(--canvas); color: var(--ink); }
.sidebar nav button[aria-current="page"] { background: var(--accent-soft); color: var(--accent); font-weight: 650; box-shadow: inset 3px 0 var(--accent); }
.sidebar-note { display: flex; align-items: flex-start; gap: 8px; margin-top: 28px; padding: 16px 8px 0; border-top: 1px solid var(--line-soft); font-size: .75rem; color: var(--muted); }
.sidebar-note .icon { width: 16px; height: 16px; margin-top: 2px; }
.workspace { min-width: 0; }
.topbar { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; padding: 16px; background: var(--surface); border-bottom: 1px solid var(--line); }
.search-area { min-width: 0; flex: 1 1 240px; max-width: 560px; }
.search-area label { display: block; margin-bottom: 4px; font-size: .75rem; font-weight: 600; }
.search-area label span { color: var(--muted); font-weight: 400; }
.search-field { display: flex; align-items: center; gap: 8px; padding: 0 4px 0 12px; border: 1px solid var(--control-border); border-radius: 6px; color: var(--muted); background: var(--canvas); }
.search-field:focus-within { outline: 2px solid var(--accent); outline-offset: 2px; }
.search-field input { min-width: 0; width: 100%; min-height: 44px; padding: 8px 0; border: 0; background: transparent; color: var(--ink); font-size: .875rem; }
.search-field input:focus { outline: none; }
.search-field input::placeholder { color: var(--muted); opacity: 1; }
.search-field input::-webkit-search-cancel-button { display: none; }
.preview-badge { display: inline-flex; padding: 4px 8px; border: 1px solid var(--line); border-radius: 4px; color: var(--muted); font-size: .6875rem; font-weight: 650; white-space: nowrap; }
main { max-width: 1440px; margin: auto; padding: 24px 16px; }
.page-heading { margin-bottom: 24px; }
.eyebrow { color: var(--accent); font-size: .75rem; font-weight: 700; margin-bottom: 8px; }
.page-heading > p:last-child { max-width: 720px; margin-top: 12px; font-size: .9375rem; color: var(--muted); }
.content-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; align-items: start; }
.primary-content, .context-column { min-width: 0; }
.context-column { display: grid; gap: 24px; }
.panel { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); }
.section-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; flex-wrap: wrap; padding: 20px; border-bottom: 1px solid var(--line-soft); }
.count { color: var(--muted); font-size: .75rem; white-space: nowrap; }
.directory-list { list-style: none; margin: 0; padding: 0; }
.directory-list li + li { border-top: 1px solid var(--line-soft); }
.directory-list button { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 88px; padding: 20px; text-align: left; background: transparent; border: 0; }
.directory-list button:hover { background: var(--accent-soft); }
.directory-list button:focus-visible { position: relative; outline-offset: -3px; border-radius: 4px; }
.module-icon { display: grid; place-items: center; flex-shrink: 0; width: 40px; height: 40px; background: var(--accent-soft); color: var(--accent); border-radius: 6px; }
.module-copy { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
.module-copy strong { font-size: .9375rem; font-weight: 650; }
.module-copy > span { color: var(--muted); font-size: .8125rem; }
.row-arrow { width: 16px; color: var(--accent); }
.section-footnote { padding: 16px 20px; border-top: 1px solid var(--line-soft); font-size: .75rem; color: var(--muted); }
.empty-search { padding: 32px 20px; text-align: center; }
.empty-search > .icon { width: 32px; height: 32px; margin-bottom: 12px; color: var(--muted); }
.empty-search p { margin: 8px 0 20px; color: var(--muted); font-size: .875rem; }
.system-status { padding: 20px; }
.connection-state { display: flex; align-items: flex-start; gap: 12px; margin-top: 20px; }
.connection-icon { display: grid; place-items: center; width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%; background: var(--canvas); color: var(--muted); }
.connection-state.success .connection-icon { background: var(--success-soft); color: var(--success); }
.connection-state.error .connection-icon { background: var(--error-soft); color: var(--error); }
.connection-state strong { display: block; font-size: .8125rem; font-weight: 650; }
.connection-state p { margin-top: 4px; color: var(--muted); font-size: .75rem; }
.loading-bar { display: block; width: 96px; height: 8px; margin-top: 8px; background: var(--line); border-radius: 4px; animation: pulse 1.5s ease-in-out infinite; }
.database-state { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; padding-top: 16px; margin: 20px 0 0; border-top: 1px solid var(--line-soft); font-size: .75rem; }
.database-state dt { font-weight: 650; }
.database-state dd { margin: 0; color: var(--muted); }
.status-help { margin-top: 12px; font-size: .75rem; color: var(--muted); }
.status-retry { margin-top: 20px; width: 100%; }
.scope-note { padding: 0 4px; font-size: .8125rem; color: var(--muted); }
.scope-note h2 { font-size: .875rem; color: var(--ink); margin-bottom: 8px; }
.scope-note summary { min-height: 44px; padding: 12px 0; cursor: pointer; font-weight: 600; color: var(--accent); }
.scope-note ul { margin: 0 0 12px; padding-left: 20px; }
.scope-note li + li { margin-top: 8px; }
.module-preview { padding: 24px; }
.module-state { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 24px; }
.status-label { font-size: .75rem; font-weight: 600; color: var(--muted); }
.module-preview > h2 { font-size: 1.25rem; }
.module-preview > p { margin-top: 12px; color: var(--muted); font-size: .875rem; }
.planned-flow { margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--line-soft); }
.planned-flow h3 { color: var(--muted); font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; }
.planned-flow ol { margin: 16px 0 0; padding: 0; list-style: none; }
.planned-flow li { display: flex; align-items: center; gap: 12px; padding: 12px 0; font-size: .875rem; }
.step-number { display: grid; place-items: center; flex-shrink: 0; width: 28px; height: 28px; border: 1px solid var(--line); border-radius: 50%; font-size: .75rem; color: var(--muted); }
.module-preview .module-disclaimer { display: flex; align-items: flex-start; gap: 8px; margin-top: 24px; padding: 16px; background: var(--canvas); border-radius: 4px; font-size: .75rem; }
.module-disclaimer .icon { width: 16px; height: 16px; margin-top: 2px; }
.workspace-footer { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--line); color: var(--muted); font-size: .6875rem; }

@keyframes pulse { 50% { opacity: .4; } }
@media (min-width: 600px) {
  main { padding: 32px; }
  .topbar { padding: 16px 32px; justify-content: space-between; }
  .preview-badge { margin-left: auto; }
  .sidebar.is-open { padding: 24px 32px; }
  .directory-list button { gap: 16px; }
}
@media (min-width: 900px) {
  .shell { display: grid; grid-template-columns: 248px minmax(0, 1fr); }
  .mobile-header { display: none; }
  .sidebar, .sidebar.is-open { display: flex; flex-direction: column; position: sticky; top: 0; align-self: start; min-height: 100vh; height: 100vh; overflow-y: auto; padding: 28px 16px; border-bottom: 0; border-right: 1px solid var(--line); }
  .brand { display: flex; align-items: center; gap: 12px; margin: 0 8px 32px; }
  .brand-mark { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 6px; background: var(--accent); color: #fff; flex-shrink: 0; }
  .brand-mark .icon { width: 24px; height: 24px; }
  .brand strong { display: block; font-size: .9375rem; letter-spacing: .05em; color: var(--accent); }
  .brand div > span { display: block; color: var(--muted); font-size: .6875rem; }
  .group-picker { padding: 0 8px; }
  .sidebar-note { margin-top: auto; padding-top: 20px; }
  .sidebar nav { margin-bottom: 32px; }
}
@media (min-width: 1200px) {
  main { padding: 36px 40px; }
  .topbar { padding: 20px 40px; }
  .content-layout { grid-template-columns: minmax(0, 1fr) 280px; }
  .page-heading { margin-bottom: 28px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
}

```
