import { getSystemStatus } from './health.service.js';
export function getHealth(req, res) { res.json({ data: getSystemStatus() }); }
