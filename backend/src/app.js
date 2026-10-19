import express from 'express';
import { healthRouter } from './modules/health/health.routes.js';
import { errorHandler } from './middleware/error-handler.js';

export const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use('/api/health', healthRouter);
// Chỉ mount các API nghiệp vụ sau khi có xác thực, phân quyền và validation.
app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'API chưa tồn tại.' } }));
app.use(errorHandler);
