// Liveness: tiến trình API hoạt động; không khẳng định database sẵn sàng.
export function getSystemStatus() { return { status: 'ok', database: 'not_configured' }; }
