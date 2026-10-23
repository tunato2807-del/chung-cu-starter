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
