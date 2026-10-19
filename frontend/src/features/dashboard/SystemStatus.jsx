import React, { useEffect, useState } from 'react';
import { getJson } from '../../shared/api/client.js';
export default function SystemStatus() {
  const [message, setMessage] = useState('Đang kiểm tra API…');
  useEffect(() => {
    const controller = new AbortController();
    getJson('/health', { signal: controller.signal })
      .then(() => setMessage('API đang hoạt động · Chưa kết nối MySQL'))
      .catch(error => { if (error.name !== 'AbortError') setMessage('Chưa kết nối API — hãy chạy backend ở terminal thứ hai.'); });
    return () => controller.abort();
  }, []);
  return <p role="status">{message}</p>;
}
