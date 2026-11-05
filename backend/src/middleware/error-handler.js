export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === "entity.parse.failed")
    return res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "JSON không hợp lệ.",
        request_id: req.requestId,
      },
    });
  if (error.type === "entity.too.large")
    return res.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Nội dung quá lớn.",
        request_id: req.requestId,
      },
    });
  if (error.code?.startsWith("LIMIT_"))
    return res.status(413).json({
      error: {
        code: "UPLOAD_LIMIT",
        message: "Tối đa 5 ảnh, mỗi ảnh không quá 5 MB.",
        request_id: req.requestId,
      },
    });
  if (error.code === "23505")
    return res.status(409).json({
      error: {
        code: "ALREADY_EXISTS",
        message: "Thông tin đã tồn tại.",
        request_id: req.requestId,
      },
    });
  if (["40P01", "55P03", "40001", "57014"].includes(error.code))
    return res.status(409).json({
      error: {
        code: "CONCURRENT_UPDATE",
        message: "Dữ liệu đang được cập nhật. Vui lòng tải lại và thử lại.",
        request_id: req.requestId,
      },
    });
  if (["23503", "23514", "22001", "22003", "22P02"].includes(error.code))
    return res
      .status(422)
      .json({
        error: {
          code: "VALIDATION",
          message:
            "Dữ liệu không hợp lệ hoặc đang được tham chiếu. Kiểm tra lại biểu mẫu.",
          request_id: req.requestId,
        },
      });
  if (error.status && error.code)
    return res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        field_errors: error.field_errors,
        request_id: req.requestId,
      },
    });
  // Never log request bodies, SQL parameters, cookies or lookup secrets.
  console.error({
    request_id: req.requestId,
    code: error.code || "INTERNAL_ERROR",
  });
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Không thể xử lý yêu cầu.",
      request_id: req.requestId,
    },
  });
}
