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
