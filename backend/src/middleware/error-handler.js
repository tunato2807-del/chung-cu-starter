export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'JSON không hợp lệ.' } });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Nội dung quá lớn.' } });
  console.error(error);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Không thể xử lý yêu cầu.' } });
}
