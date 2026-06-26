import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../../../shared-kernel/http/cors.js';

export default function handler(request: VercelRequest, response: VercelResponse) {
  // Aplicar políticas CORS dinámicas a nivel de infraestructura HTTP
  if (handleCors(request, response)) {
    return; // Petición OPTIONS (Preflight) interceptada y resuelta
  }

  // Lógica principal de negocio del endpoint
  return response.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'fastworks-backend-api',
    environment: process.env.NODE_ENV || 'development',
    method: request.method,
    uptime: process.uptime()
  });
}
