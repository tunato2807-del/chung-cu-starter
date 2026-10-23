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
